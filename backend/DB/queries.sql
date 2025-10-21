-- Users hold many Binders
CREATE TABLE Users (
  user_id        SERIAL PRIMARY KEY,
  email          VARCHAR(255) UNIQUE NOT NULL,
  display_name   VARCHAR(100) NOT NULL
);

-- A Binder belongs to one User
CREATE TABLE Binders (
  binder_id      SERIAL PRIMARY KEY,
  user_id        INT NOT NULL REFERENCES Users(user_id) ON DELETE CASCADE,
  binder_name    VARCHAR(100) NOT NULL,
  created_at     TIMESTAMP DEFAULT NOW()
);

-- Cards are linked to a Binder
CREATE TABLE Cards (
  card_id        SERIAL PRIMARY KEY,
  binder_id      INT NOT NULL REFERENCES Binders(binder_id) ON DELETE CASCADE,
  tcg_id         VARCHAR(100),                -- external id if you use an API later
  name           VARCHAR(120) NOT NULL,
  set_name       VARCHAR(120),
  card_number    VARCHAR(20),
  rarity         VARCHAR(40),
  image_url      TEXT
);

-- Optional uniqueness: prevent duplicate of the exact same card entry per binder
CREATE UNIQUE INDEX uniq_binder_card ON Cards(binder_id, name, set_name, card_number);


INSERT INTO Users (email, display_name) VALUES ('ash@poke.com', 'Ash Ketchum');

INSERT INTO Binders (user_id, binder_name)
VALUES (1, 'Kanto Favourites');

INSERT INTO Cards (binder_id, tcg_id, name, set_name, card_number, rarity, image_url)
VALUES
(1, 'xy-12-charizard', 'Charizard', 'XY Evolutions', '12/108', 'Holo', 'https://example.com/charizard.png'),
(1, 'swsh-45-pikachu',  'Pikachu',  'Shining Fates', '45/72',  'Common', 'https://example.com/pikachu.png');
