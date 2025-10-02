const { Pool } = require('pg');
const db = require('../db');

const connectionString = process.env.DATABASE_URL || 'postgres://postgres:postgres@localhost:5432/postgres';

// Reuse the existing pool when possible; fall back to creating one linked to db exports.
const pool = db._pool || (db._pool = new Pool({ connectionString }));

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

module.exports = {
  assertBinderOwnership,
  addOrIncrement,
  setQuantity,
  listBinderCards,
  getBinderCard,
  removeCard,
};
