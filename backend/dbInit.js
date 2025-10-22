const db = require('./db');
const { seedCardsIfNeeded } = require('./seedCards');

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

  // Binders (each binder belongs to an account)
  await db.query(`
    CREATE TABLE IF NOT EXISTS binders (
      id SERIAL PRIMARY KEY,
      account_id INTEGER NOT NULL REFERENCES accounts(id) ON DELETE CASCADE,
      title VARCHAR(100) NOT NULL DEFAULT 'My Binder',
      format VARCHAR(50) NOT NULL DEFAULT 'Standard',
      name VARCHAR(50) UNIQUE NOT NULL,
      type_of_card VARCHAR(255) NOT NULL,
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
    )
  `);
  console.log("Binders table created");

  // Ensure legacy binders table has new columns/constraints
  await db.query(`
    ALTER TABLE binders
    ADD COLUMN IF NOT EXISTS account_id INTEGER
  `);
  await db.query(`
    ALTER TABLE binders
    ADD COLUMN IF NOT EXISTS title VARCHAR(100) DEFAULT 'My Binder'
  `);
  await db.query(`
    ALTER TABLE binders
    ADD COLUMN IF NOT EXISTS format VARCHAR(50) DEFAULT 'Standard'
  `);
  await db.query(`
    ALTER TABLE binders
    ADD COLUMN IF NOT EXISTS created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
  `);
  await db.query(`
    WITH first_account AS (
      SELECT id FROM accounts ORDER BY id LIMIT 1
    )
    UPDATE binders
    SET
      account_id = COALESCE(
        account_id,
        (SELECT id FROM first_account),
        1
      ),
      title = COALESCE(NULLIF(title, ''), 'My Binder'),
      format = COALESCE(NULLIF(format, ''), 'Standard')
  `);
  await db.query(`
    ALTER TABLE binders
    ALTER COLUMN account_id SET NOT NULL,
    ALTER COLUMN title SET NOT NULL,
    ALTER COLUMN format SET NOT NULL
  `);
  await db.query(`
    ALTER TABLE binders
    ALTER COLUMN title SET DEFAULT 'My Binder',
    ALTER COLUMN format SET DEFAULT 'Standard'
  `);
  await db.query(`
    DO $$
    BEGIN
      IF NOT EXISTS (
        SELECT 1 FROM information_schema.table_constraints
        WHERE table_name = 'binders'
          AND constraint_type = 'FOREIGN KEY'
          AND constraint_name = 'binders_account_id_fkey'
      ) THEN
        ALTER TABLE binders
        ADD CONSTRAINT binders_account_id_fkey
        FOREIGN KEY (account_id) REFERENCES accounts(id) ON DELETE CASCADE;
      END IF;
    END;
    $$;
  `);
  await db.query(`
    DO $$
    BEGIN
      IF NOT EXISTS (
        SELECT 1 FROM information_schema.table_constraints
        WHERE table_name = 'binders'
          AND constraint_type = 'UNIQUE'
          AND constraint_name = 'binders_name_key'
      ) THEN
        ALTER TABLE binders ADD CONSTRAINT binders_name_key UNIQUE (name);
      END IF;
    END;
    $$;
  `);
  console.log("Binders table migrated");


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
  await seedCardsIfNeeded({ minCount: 120 });

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
