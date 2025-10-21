process.env.DATABASE_URL = process.env.DATABASE_URL || 'postgres://postgres:postgres@localhost:5432/postgres_test';

// Confirms the API server comes up and responds to a simple health check.
const request = require('supertest');
const app = require('../server');

describe('smoke', () => {
  it('responds to health check', async () => {
    const res = await request(app).get('/health');
    expect(res.status).toBe(200);
    expect(res.body).toMatchObject({ ok: true });
  });
});
