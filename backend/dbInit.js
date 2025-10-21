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

  await db.query(`
    CREATE TABLE IF NOT EXISTS binders (
      id SERIAL PRIMARY KEY,
      name VARCHAR(50) UNIQUE NOT NULL,
      type_of_card VARCHAR(255) NOT NULL
    )
  `);
  console.log("Binders table created");

  await db.query(`
    CREATE TABLE IF NOT EXISTS achievements (
      id SERIAL PRIMARY KEY,
      user_id INTEGER NOT NULL REFERENCES accounts(id) ON DELETE CASCADE,
      achievement_type VARCHAR(100) NOT NULL,
      achievement_name VARCHAR(255) NOT NULL,
      achievement_description TEXT,
      unlocked_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
      UNIQUE(user_id, achievement_type)
    )
  `);
  console.log("Achievements table created");
}

initDB()
  .then(() => process.exit(0))
  .catch(err => {
    console.error("Error creating tables:", err);
    process.exit(1);
  });
