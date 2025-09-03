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
    CREATE TABLE IF NOT EXISTS binders (
      id SERIAL PRIMARY KEY,
      name VARCHAR(50) UNIQUE NOT NULL,
      typeOfCard VARCHAR(255) NOT NULL
    )
  `);
  console.log("Binders table created");
}

initDB()
  .then(() => process.exit(0))
  .catch(err => {
    console.error("Error creating tables:", err);
    process.exit(1);
  });
