process.env.DATABASE_URL = process.env.DATABASE_URL || 'postgres://postgres:postgres@localhost:5432/postgres_test';

// Validates binder card CRUD by adding the same card twice and checking qty=2.
const request = require('supertest');
const { Client } = require('pg');
const db = require('../db');
const app = require('../server');

let accountId;
let binderId;
const cardId = 'test-charizard';
const uniqueTag = `binder_user_${Date.now()}`;
const testEmail = `${uniqueTag}@example.com`;

beforeAll(async () => {
  const accountRes = await db.query(
    `INSERT INTO accounts (username, password, email)
     VALUES ($1, $2, $3)
     RETURNING id`,
    [uniqueTag, 'secret', testEmail]
  );
  accountId = accountRes.rows[0].id;

  const binderRes = await db.query(
    `INSERT INTO binders (account_id, title, format, name, type_of_card)
     VALUES ($1, $2, $3, $4, $5)
     RETURNING id`,
    [accountId, 'Test Binder', 'Standard', `Test Binder ${Date.now()}`, 'Pokemon']
  );
  binderId = binderRes.rows[0].id;

  await db.query(
    `INSERT INTO cards (id, name, set_name, number, rarity, image_url, type)
     VALUES ($1, $2, $3, $4, $5, $6, $7)
     ON CONFLICT (id) DO NOTHING`,
    [cardId, 'Charizard', 'Test Set', '099', 'Rare', 'Image not available yet', 'Fire']
  );
});

afterAll(async () => {
  const client = new Client({ connectionString: process.env.DATABASE_URL });
  await client.connect();
  await client.query('DELETE FROM binder_cards WHERE binder_id = $1', [binderId]);
  await client.query('DELETE FROM binders WHERE id = $1', [binderId]);
  await client.query('DELETE FROM accounts WHERE id = $1', [accountId]);
  await client.query('DELETE FROM cards WHERE id = $1', [cardId]);
  await client.end();
});

describe('binder card flow', () => {
  it('increments quantity when adding same card twice', async () => {
    const baseUrl = `/api/binders/${binderId}/cards`;

    const first = await request(app)
      .post(baseUrl)
      .set('X-Account-Id', String(accountId))
      .send({ cardId });
    expect(first.status).toBe(201);
    expect(first.body).toHaveProperty('data.qty', 1);

    const second = await request(app)
      .post(baseUrl)
      .set('X-Account-Id', String(accountId))
      .send({ cardId });
    expect(second.status).toBe(201);
    expect(second.body).toHaveProperty('data.qty', 2);

    const list = await request(app)
      .get(baseUrl)
      .set('X-Account-Id', String(accountId));
    expect(list.status).toBe(200);
    expect(list.body).toHaveProperty('data');
    const match = list.body.data.find((row) => row.card_id === cardId || row.id === cardId);
    expect(match).toBeTruthy();
    expect(match.qty).toBe(2);
  });
});
