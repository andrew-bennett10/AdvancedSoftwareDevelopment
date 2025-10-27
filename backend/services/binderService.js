const db = require('../db');
const { encryptBinderPayload, decryptBinderPayload } = require('../utils/binderCrypto');
const { buildCardSearchConditions } = require('../utils/cardSearch');

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

const RARITY_PRIORITY = [
  'secret rare',
  'rare rainbow',
  'rare holo gx',
  'rare holo v',
  'rare holo vmax',
  'rare holo',
  'rare ultra',
  'ultra rare',
  'rare',
  'uncommon',
  'common',
];

function toIso(value) {
  if (!value) return null;
  if (value instanceof Date) return value.toISOString();
  if (typeof value === 'string') return value;
  return null;
}

function buildEncryptedSnapshot(card) {
  if (!card) return null;
  const snapshot = { ...card };
  if (snapshot.addedAt instanceof Date) {
    snapshot.addedAt = snapshot.addedAt.toISOString();
  }
  return snapshot;
}

function presentCardRow(row) {
  if (!row) return null;

  if (row.secure_payload) {
    try {
      const payload = decryptBinderPayload(row.secure_payload);
      if (payload && typeof payload === 'object') {
        const id = payload.card_id || payload.id || row.card_id || row.id;
        return {
          ...payload,
          id,
          card_id: id,
          qty: Number(row.qty ?? payload.qty ?? 0),
          addedAt: payload.addedAt || toIso(row.added_at),
        };
      }
      return {
        qty: Number(row.qty) || 0,
        id: row.card_id || row.id,
        card_id: row.card_id || row.id,
        name: row.name,
        set_name: row.set_name,
        number: row.number,
        rarity: row.rarity,
        image_url: row.image_url,
        type: row.type,
        hp: row.hp,
        weaknesses: row.weaknesses,
        retreat: row.retreat,
        addedAt: toIso(row.added_at),
      };
    } catch (err) {
      console.error('Failed to decrypt binder payload', err);
    }
  }

  return {
    qty: Number(row.qty) || 0,
    id: row.card_id || row.id,
    card_id: row.card_id || row.id,
    name: row.name,
    set_name: row.set_name,
    number: row.number,
    rarity: row.rarity,
    image_url: row.image_url,
    type: row.type,
    hp: row.hp,
    weaknesses: row.weaknesses,
    retreat: row.retreat,
    addedAt: toIso(row.added_at),
  };
}

function raritySortClause(direction = 'DESC') {
  const normalized = direction === 'ASC' ? 'ASC' : 'DESC';
  const cases = RARITY_PRIORITY.map(
    (name, idx) =>
      `WHEN LOWER(c.rarity) = '${name.replace(/'/g, "''")}' THEN ${RARITY_PRIORITY.length - idx}`
  ).join(' ');
  return `(CASE ${cases} ELSE 0 END) ${normalized}`;
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

    const hasSecurePayload = await binderCardsHasSecurePayloadColumn();
    const selectColumns = hasSecurePayload
      ? 'bc.qty, bc.secure_payload, bc.added_at, c.*'
      : 'bc.qty, bc.added_at, c.*';

    const full = await client.query(
      `SELECT ${selectColumns}
         FROM binder_cards bc
         JOIN cards c ON c.id = bc.card_id
        WHERE bc.binder_id = $1 AND bc.card_id = $2`,
      [binderId, cardId]
    );

    const row = full.rows[0] || null;
    if (row && !hasSecurePayload) {
      row.secure_payload = null;
    }
    const card = presentCardRow(row);
    const snapshot = hasSecurePayload ? buildEncryptedSnapshot(card) : null;
    if (hasSecurePayload && snapshot) {
      await client.query(
        `UPDATE binder_cards
            SET secure_payload = $3
          WHERE binder_id = $1 AND card_id = $2`,
        [binderId, cardId, encryptBinderPayload(snapshot)]
      );
    }

    return card;
  });
}

async function listBinderCards(binderId, options = {}) {
  const params = [binderId];
  const hasSecurePayload = await binderCardsHasSecurePayloadColumn();
  const selectColumns = hasSecurePayload
    ? 'bc.qty, bc.secure_payload, bc.added_at, c.*'
    : 'bc.qty, bc.added_at, c.*';

  const { conditions, params: searchParams } = buildCardSearchConditions(
    {
      q: options.q || options.search,
      type: options.type,
      rarity: options.rarity,
      set: options.set,
    },
    'c',
    params.length + 1
  );

  const whereClause = conditions.length ? `AND ${conditions.join(' AND ')}` : '';
  const rawSortBy = (options.sortBy || '').toLowerCase();
  const rawOrder = (options.order || '').toLowerCase();
  let orderDirection = rawOrder === 'asc' ? 'ASC' : 'DESC';
  let orderClause = 'ORDER BY c.name ASC';

  if (rawSortBy === 'recent' || rawSortBy === 'recently added') {
    orderClause = `ORDER BY bc.added_at ${orderDirection}, c.name ASC`;
  } else if (rawSortBy === 'rarity' || rawSortBy === 'highest rarity') {
    if (rawOrder === 'asc') {
      orderDirection = 'ASC';
    } else if (!rawOrder) {
      orderDirection = 'DESC';
    }
    orderClause = `ORDER BY ${raritySortClause(orderDirection)}, c.name ASC`;
  }

  const finalParams = params.concat(searchParams);

  const result = await db.query(
    `SELECT ${selectColumns}
       FROM binder_cards bc
       JOIN cards c ON c.id = bc.card_id
      WHERE bc.binder_id = $1
        ${whereClause}
      ${orderClause}`,
    finalParams
  );

  if (!hasSecurePayload) {
    result.rows.forEach((row) => {
      row.secure_payload = null;
    });
  }

  return result.rows.map(presentCardRow);
}

async function getBinderCard(binderId, cardId) {
  const hasSecurePayload = await binderCardsHasSecurePayloadColumn();
  const selectColumns = hasSecurePayload
    ? 'bc.qty, bc.secure_payload, bc.added_at, c.*'
    : 'bc.qty, bc.added_at, c.*';

  const result = await db.query(
    `SELECT ${selectColumns}
       FROM binder_cards bc
       JOIN cards c ON c.id = bc.card_id
      WHERE bc.binder_id = $1 AND bc.card_id = $2`,
    [binderId, cardId]
  );

  if (result.rows.length === 0) {
    throw httpError(404, 'Card not found in binder');
  }

  const row = result.rows[0];
  if (row && !hasSecurePayload) {
    row.secure_payload = null;
  }

  return presentCardRow(row);
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

    const hasSecurePayload = await binderCardsHasSecurePayloadColumn();
    const selectColumns = hasSecurePayload
      ? 'bc.qty, bc.secure_payload, bc.added_at, c.*'
      : 'bc.qty, bc.added_at, c.*';

    const full = await client.query(
      `SELECT ${selectColumns}
         FROM binder_cards bc
         JOIN cards c ON c.id = bc.card_id
        WHERE bc.binder_id = $1 AND bc.card_id = $2`,
      [binderId, cardId]
    );

    const row = full.rows[0] || null;
    if (row && !hasSecurePayload) {
      row.secure_payload = null;
    }
    const card = presentCardRow(row);
    const snapshot = hasSecurePayload ? buildEncryptedSnapshot(card) : null;
    if (hasSecurePayload && snapshot) {
      await client.query(
        `UPDATE binder_cards
            SET secure_payload = $3
          WHERE binder_id = $1 AND card_id = $2`,
        [binderId, cardId, encryptBinderPayload(snapshot)]
      );
    }

    return card;
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

let binderCardsHasSecurePayloadColumnCache = null;
let binderCardsHasFinishColumnCache = null;

async function binderCardsHasSecurePayloadColumn() {
  if (binderCardsHasSecurePayloadColumnCache !== null) {
    return binderCardsHasSecurePayloadColumnCache;
  }

  try {
    const result = await db.query(
      `SELECT column_name
         FROM information_schema.columns
        WHERE table_name = 'binder_cards'
          AND column_name = 'secure_payload'
        LIMIT 1`
    );
    binderCardsHasSecurePayloadColumnCache = result.rowCount > 0;
  } catch (err) {
    console.error('Failed to inspect binder_cards.secure_payload column', err);
    binderCardsHasSecurePayloadColumnCache = false;
  }

  return binderCardsHasSecurePayloadColumnCache;
}

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
