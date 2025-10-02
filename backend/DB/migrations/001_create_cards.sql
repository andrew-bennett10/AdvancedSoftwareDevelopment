-- Creates the cards catalog table if it does not exist
CREATE TABLE IF NOT EXISTS cards (
  id VARCHAR(100) PRIMARY KEY,
  name VARCHAR(100) NOT NULL,
  set_name VARCHAR(100),
  number VARCHAR(50),
  rarity VARCHAR(50),
  image_url TEXT,
  type VARCHAR(50),
  hp INTEGER,
  weaknesses TEXT,
  retreat INTEGER
);

CREATE INDEX IF NOT EXISTS idx_cards_name ON cards (name);
CREATE INDEX IF NOT EXISTS idx_cards_set_name ON cards (set_name);
