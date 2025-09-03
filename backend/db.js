// server/db.js
const { Pool } = require('pg');

const pool = new Pool({
  connectionString: process.env.DATABASE_URL || 
    'postgres://testuser:testpassword@localhost:5432/testdb'
});

module.exports = {
  query: (text, params) => pool.query(text, params),
};
