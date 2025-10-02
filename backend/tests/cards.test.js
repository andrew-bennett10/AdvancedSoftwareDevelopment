process.env.DATABASE_URL = process.env.DATABASE_URL || 'postgres://postgres:postgres@localhost:5432/postgres_test';

const request = require('supertest');
const { Client } = require('pg');
const app = require('../server');
const db = require('../db');

beforeAll(async () => {
  await db.query(
    `INSERT INTO cards (id, name, set_name, number, rarity, image_url, type)
     VALUES ($1, $2, $3, $4, $5, $6, $7)
     ON CONFLICT (id) DO NOTHING`,
    ['test-pikachu', 'Pikachu', 'Test Set', '001', 'Common', 'Image not available yet', 'Electric']
  );
});

afterAll(async () => {
  const client = new Client({ connectionString: process.env.DATABASE_URL });
  await client.connect();
  await client.query('DELETE FROM cards WHERE id = $1', ['test-pikachu']);
  await client.end();
});

describe('GET /cards', () => {
  it('returns card search results', async () => {
    const res = await request(app).get('/api/cards').query({ q: 'pika' });
    expect(res.status).toBe(200);
    expect(res.body).toHaveProperty('items');
    expect(Array.isArray(res.body.items)).toBe(true);
  });
});
