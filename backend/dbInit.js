// server/dbInit.js
const db = require('./db');

async function initDB() {
  await db.query(`
    CREATE TABLE IF NOT EXISTS accounts (
      id SERIAL PRIMARY KEY,
      username VARCHAR(50) UNIQUE NOT NULL,
      password VARCHAR(255) NOT NULL,
      email VARCHAR(100) UNIQUE NOT NULL,
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
    )
  `);
  console.log("Accounts table created");

  await db.query(`
    CREATE TABLE IF NOT EXISTS favourites (
      id SERIAL PRIMARY KEY,
      user_id INTEGER NOT NULL REFERENCES accounts(id) ON DELETE CASCADE,
      card_title TEXT NOT NULL,
      card_description TEXT,
      card_image_url TEXT,
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
    )
  `);
  console.log("Favourites table created");
}

initDB()
  .then(() => process.exit(0))
  .catch(err => {
    console.error("Error creating tables:", err);
    process.exit(1);
  });
