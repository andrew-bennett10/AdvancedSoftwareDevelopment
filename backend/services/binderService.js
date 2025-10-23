const db = require('../db');

const pool = db.pool;

function httpError(status, message) {
  const err = new Error(message);
  err.status = status;
  return err;
}

async function withTransaction(action) {
  const client = await pool.connect();
  try {
    await client.query('BEGIN');
    const result = await action(client);
    await client.query('COMMIT');
    return result;
  } catch (err) {
    try {
      await client.query('ROLLBACK');
    } catch (rollbackErr) {
      console.error('Rollback failed', rollbackErr);
    }
    throw err;
  } finally {
    client.release();
  }
}

function mapCardRow(row) {
  if (!row) return null;
  return {
    qty: row.qty,
    id: row.id,
    card_id: row.id,
    name: row.name,
    set_name: row.set_name,
    number: row.number,
    rarity: row.rarity,
    image_url: row.image_url,
    type: row.type,
    hp: row.hp,
    weaknesses: row.weaknesses,
    retreat: row.retreat,
  };
}

async function assertBinderOwnership(binderId, accountId) {
  const id = Number(binderId);
  if (!Number.isInteger(id) || id <= 0) {
    throw httpError(400, 'Invalid binder id');
  }

  const result = await db.query('SELECT id, account_id, title FROM binders WHERE id = $1', [id]);
  if (result.rows.length === 0) {
    throw httpError(404, 'Binder not found');
  }

  const binder = result.rows[0];
  if (Number(binder.account_id) !== Number(accountId)) {
    throw httpError(403, 'Forbidden');
  }

  return binder;
}

async function ensureCardExists(client, cardId) {
  const result = await client.query('SELECT * FROM cards WHERE id = $1', [cardId]);
  if (result.rows.length === 0) {
    throw httpError(404, 'Card not found');
  }
  return result.rows[0];
}

async function addOrIncrement(binderId, cardId) {
  if (!cardId || typeof cardId !== 'string') {
    throw httpError(400, 'cardId is required');
  }

  return withTransaction(async (client) => {
    await ensureCardExists(client, cardId);
    await client.query(
      `INSERT INTO binder_cards (binder_id, card_id, qty)
       VALUES ($1, $2, 1)
       ON CONFLICT (binder_id, card_id)
       DO UPDATE SET qty = binder_cards.qty + 1`,
      [binderId, cardId]
    );

    const full = await client.query(
      `SELECT bc.qty, c.*
         FROM binder_cards bc
         JOIN cards c ON c.id = bc.card_id
        WHERE bc.binder_id = $1 AND bc.card_id = $2`,
      [binderId, cardId]
    );

    return mapCardRow(full.rows[0]);
  });
}

async function listBinderCards(binderId) {
  const result = await db.query(
    `SELECT bc.qty, c.*
       FROM binder_cards bc
       JOIN cards c ON c.id = bc.card_id
      WHERE bc.binder_id = $1
      ORDER BY c.name ASC`,
    [binderId]
  );
  return result.rows.map(mapCardRow);
}

async function getBinderCard(binderId, cardId) {
  const result = await db.query(
    `SELECT bc.qty, c.*
       FROM binder_cards bc
       JOIN cards c ON c.id = bc.card_id
      WHERE bc.binder_id = $1 AND bc.card_id = $2`,
    [binderId, cardId]
  );

  if (result.rows.length === 0) {
    throw httpError(404, 'Card not found in binder');
  }

  return mapCardRow(result.rows[0]);
}

async function setQuantity(binderId, cardId, quantity) {
  const qty = Number(quantity);
  if (!Number.isInteger(qty) || qty < 0) {
    throw httpError(400, 'quantity must be a non-negative integer');
  }

  return withTransaction(async (client) => {
    if (qty === 0) {
      await client.query(
        'DELETE FROM binder_cards WHERE binder_id = $1 AND card_id = $2',
        [binderId, cardId]
      );
      return null;
    }

    await ensureCardExists(client, cardId);

    await client.query(
      `INSERT INTO binder_cards (binder_id, card_id, qty)
       VALUES ($1, $2, $3)
       ON CONFLICT (binder_id, card_id)
       DO UPDATE SET qty = EXCLUDED.qty`,
      [binderId, cardId, qty]
    );

    const full = await client.query(
      `SELECT bc.qty, c.*
         FROM binder_cards bc
         JOIN cards c ON c.id = bc.card_id
        WHERE bc.binder_id = $1 AND bc.card_id = $2`,
      [binderId, cardId]
    );

    return mapCardRow(full.rows[0]);
  });
}

async function removeCard(binderId, cardId) {
  const { rowCount } = await db.query(
    'DELETE FROM binder_cards WHERE binder_id = $1 AND card_id = $2',
    [binderId, cardId]
  );

  if (rowCount === 0) {
    throw httpError(404, 'Card not found in binder');
  }
}

let binderCardsHasFinishColumnCache = null;

async function binderCardsHasFinishColumn() {
  if (binderCardsHasFinishColumnCache !== null) {
    return binderCardsHasFinishColumnCache;
  }

  try {
    const result = await db.query(
      `SELECT column_name
         FROM information_schema.columns
        WHERE table_name = 'binder_cards'
          AND column_name = 'finish'
        LIMIT 1`
    );
    binderCardsHasFinishColumnCache = result.rowCount > 0;
  } catch (err) {
    console.error('Failed to inspect binder_cards.finish column', err);
    binderCardsHasFinishColumnCache = false;
  }

  return binderCardsHasFinishColumnCache;
}

async function removeCardsBulk(binderId, items) {
  if (!Array.isArray(items) || items.length === 0) {
    throw httpError(400, 'items must be a non-empty array');
  }

  const normalized = [];
  const seen = new Set();

  for (const raw of items) {
    if (!raw || raw.cardId == null) continue;
    const cardId = String(raw.cardId).trim();
    if (!cardId) continue;

    const finishRaw = raw.finish == null ? '' : String(raw.finish).trim();
    const finish = finishRaw || undefined;
    const key = `${cardId}::${finish || ''}`;
    if (seen.has(key)) continue;
    seen.add(key);
    normalized.push({ cardId, finish });
  }

  if (normalized.length === 0) {
    throw httpError(400, 'items must include at least one cardId');
  }

  const hasFinishColumn = await binderCardsHasFinishColumn();

  if (process.env.NODE_ENV !== 'production') {
    console.info('[binderService] removeCardsBulk begin', {
      binderId,
      requested: items,
      normalized,
      hasFinishColumn,
    });
  }

  return withTransaction(async (client) => {
    let deleted = 0;

    for (const entry of normalized) {
      const params = [binderId, entry.cardId];
      let query = 'DELETE FROM binder_cards WHERE binder_id = $1 AND card_id = $2';

      if (hasFinishColumn) {
        if (entry.finish) {
          params.push(entry.finish);
          query += ' AND finish = $3';
        } else {
          query += " AND (finish IS NULL OR finish = '')";
        }
      }

      try {
        if (process.env.NODE_ENV !== 'production') {
          console.debug('[binderService] removeCardsBulk executing', {
            binderId,
            cardId: entry.cardId,
            finish: entry.finish,
            query,
            params,
          });
        }
        const result = await client.query(query, params);
        deleted += result.rowCount;
      } catch (err) {
        console.error('Failed to remove card from binder (bulk)', {
          binderId,
          cardId: entry.cardId,
          finish: entry.finish,
          err,
        });
        throw err;
      }
    }

    if (process.env.NODE_ENV !== 'production') {
      console.info('[binderService] removeCardsBulk commit', {
        binderId,
        normalized,
        deleted,
      });
    }

    return { deleted };
  });
}

module.exports = {
  assertBinderOwnership,
  addOrIncrement,
  setQuantity,
  listBinderCards,
  getBinderCard,
  removeCard,
  removeCardsBulk,
};
