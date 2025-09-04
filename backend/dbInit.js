const db = require('./db');

async function initDB() {
  // Accounts table
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

  // Binders (each binder belongs to an account)
  await db.query(`
    CREATE TABLE IF NOT EXISTS binders (
      id SERIAL PRIMARY KEY,
      account_id INTEGER NOT NULL REFERENCES accounts(id) ON DELETE CASCADE,
      title VARCHAR(100) NOT NULL DEFAULT 'My Binder',
      format VARCHAR(50) DEFAULT 'Standard',
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
    )
  `);
  console.log("Binders table created");

  // Cards catalog (reference data)
  await db.query(`
    CREATE TABLE IF NOT EXISTS cards (
      id VARCHAR(100) PRIMARY KEY,       -- e.g. "xy-12-charizard"
      name VARCHAR(100) NOT NULL,
      set_name VARCHAR(100),
      number VARCHAR(50),
      rarity VARCHAR(50),
      image_url TEXT,
      type VARCHAR(50),
      hp INTEGER,
      weaknesses TEXT,
      retreat INTEGER
    )
  `);
  console.log("Cards table created");

  // Junction table (binder <-> cards with quantity)
  await db.query(`
    CREATE TABLE IF NOT EXISTS binder_cards (
      binder_id INTEGER NOT NULL REFERENCES binders(id) ON DELETE CASCADE,
      card_id VARCHAR(100) NOT NULL REFERENCES cards(id) ON DELETE RESTRICT,
      qty INTEGER NOT NULL DEFAULT 0,
      added_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
      PRIMARY KEY (binder_id, card_id),
      CHECK (qty >= 0)
    )
  `);
  console.log("Binder_Cards table created");
}

initDB()
  .then(() => process.exit(0))
  .catch(err => {
    console.error("Error creating tables:", err);
    process.exit(1);
  });