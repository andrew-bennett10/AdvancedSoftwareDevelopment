INSERT INTO cards (id, name, set_name, number, rarity, image_url, type, hp, weaknesses, retreat)
VALUES
  ('base-weedle', 'Weedle', 'Base Set', '13/102', 'Common', '/img/cards/weedle.jpg', 'Grass', 40, 'Fire x2', 1),
  ('base-kakuna', 'Kakuna', 'Base Set', '14/102', 'Uncommon', '/img/cards/kakuna.jpg', 'Grass', 80, 'Fire x2', 2),
  ('base-beedrill', 'Beedrill', 'Base Set', '15/102', 'Rare', '/img/cards/beedrill.jpg', 'Grass', 120, 'Fire x2', 2),
  ('base-tangela', 'Tangela', 'Base Set', '16/102', 'Common', '/img/cards/tangela.jpg', 'Grass', 80, 'Fire x2', 1),
  ('base-charmander', 'Charmander', 'Base Set', '4/102', 'Common', '/img/cards/charmander.jpg', 'Fire', 60, 'Water x2', 1),
  ('base-charmeleon', 'Charmeleon', 'Base Set', '5/102', 'Uncommon', '/img/cards/charmeleon.jpg', 'Fire', 80, 'Water x2', 2),
  ('base-charizard', 'Charizard', 'Base Set', '4/102', 'Rare Holo', '/img/cards/charizard_base.jpg', 'Fire', 150, 'Water x2', 3),
  ('ex-charizard', 'Charizard EX', 'XY Evolutions', '12/108', 'Ultra Rare', '/img/cards/charizard_ex.jpg', 'Fire', 180, 'Water x2', 2),
  ('mega-charizard', 'M Charizard EX', 'XY Evolutions', '13/108', 'Ultra Rare', '/img/cards/charizard_mega.jpg', 'Fire', 230, 'Water x2', 3),
  ('base-vulpix', 'Vulpix', 'Base Set', '68/102', 'Common', '/img/cards/vulpix.jpg', 'Fire', 60, 'Water x2', 1),
  ('base-ninetales', 'Ninetales', 'Base Set', '12/102', 'Rare', '/img/cards/ninetales.jpg', 'Fire', 100, 'Water x2', 2),
  ('break-ninetales', 'Ninetales BREAK', 'XY Evolutions', '16/108', 'Ultra Rare', '/img/cards/ninetales_break.jpg', 'Fire', 140, 'Water x2', 2),
  ('base-growlithe', 'Growlithe', 'Base Set', '28/102', 'Common', '/img/cards/growlithe.jpg', 'Fire', 70, 'Water x2', 1),
  ('base-arcanine', 'Arcanine', 'Base Set', '23/102', 'Rare', '/img/cards/arcanine.jpg', 'Fire', 130, 'Water x2', 3),
  ('base-ponyta', 'Ponyta', 'Base Set', '39/102', 'Common', '/img/cards/ponyta.jpg', 'Fire', 60, 'Water x2', 1),
  ('base-magmar', 'Magmar', 'Base Set', '36/102', 'Uncommon', '/img/cards/magmar.jpg', 'Fire', 80, 'Water x2', 2),
  ('ex-blastoise', 'Blastoise EX', 'XY Evolutions', '21/108', 'Ultra Rare', '/img/cards/blastoise_ex.jpg', 'Water', 180, 'Electric x2', 3),
  ('mega-blastoise', 'M Blastoise EX', 'XY Evolutions', '22/108', 'Ultra Rare', '/img/cards/blastoise_mega.jpg', 'Water', 220, 'Electric x2', 3),
  ('base-poliwag', 'Poliwag', 'Base Set', '29/102', 'Common', '/img/cards/poliwag.jpg', 'Water', 60, 'Electric x2', 1),
  ('base-poliwhirl', 'Poliwhirl', 'Base Set', '30/102', 'Uncommon', '/img/cards/poliwhirl.jpg', 'Water', 80, 'Electric x2', 2),
  ('base-poliwrath', 'Poliwrath', 'Base Set', '31/102', 'Rare', '/img/cards/poliwrath.jpg', 'Water', 140, 'Electric x2', 3),
  ('ex-slowbro', 'Slowbro EX', 'XY Evolutions', '26/108', 'Ultra Rare', '/img/cards/slowbro_ex.jpg', 'Water', 180, 'Electric x2', 3),
  ('mega-slowbro', 'M Slowbro EX', 'XY Evolutions', '27/108', 'Ultra Rare', '/img/cards/slowbro_mega.jpg', 'Water', 220, 'Electric x2', 4),
  ('base-seel', 'Seel', 'Base Set', '28/102', 'Common', '/img/cards/seel.jpg', 'Water', 80, 'Electric x2', 1)
ON CONFLICT (id) DO UPDATE
SET name = EXCLUDED.name;
