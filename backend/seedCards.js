const db = require('./db');

const TYPE_IMAGE = {
  Fire: '/img/cards/charizard_base.jpg',
  Water: '/img/cards/blastoise_ex.jpg',
  Grass: '/img/cards/tangela.jpg',
  Lightning: '/img/pikachu.png',
  Electric: '/img/pikachu.png',
  Psychic: '/img/pikachu.png',
  Fighting: '/img/cards/magmar.jpg',
  Colorless: '/img/cards/vulpix.jpg',
  Fairy: '/img/cards/vulpix.jpg',
  Dragon: '/img/cards/charizard_mega.jpg',
  Metal: '/img/cards/arcanine.jpg',
  Dark: '/img/cards/slowbro_ex.jpg',
};

const TYPE_WEAKNESS = {
  Fire: 'Water x2',
  Water: 'Electric x2',
  Grass: 'Fire x2',
  Lightning: 'Fighting x2',
  Electric: 'Fighting x2',
  Psychic: 'Dark x2',
  Fighting: 'Psychic x2',
  Colorless: 'Fighting x2',
  Fairy: 'Metal x2',
  Dragon: 'Fairy x2',
  Metal: 'Fire x2',
  Dark: 'Fighting x2',
};

function getImageForType(type) {
  return TYPE_IMAGE[type] || '/img/pikachu.png';
}

const FAMILIES = [
  { name: 'Pikachu', type: 'Lightning', baseHp: 60 },
  { name: 'Raichu', type: 'Lightning', baseHp: 100 },
  { name: 'Charmander', type: 'Fire', baseHp: 70 },
  { name: 'Charmeleon', type: 'Fire', baseHp: 90 },
  { name: 'Charizard', type: 'Fire', baseHp: 160 },
  { name: 'Squirtle', type: 'Water', baseHp: 70 },
  { name: 'Wartortle', type: 'Water', baseHp: 90 },
  { name: 'Blastoise', type: 'Water', baseHp: 160 },
  { name: 'Bulbasaur', type: 'Grass', baseHp: 70 },
  { name: 'Ivysaur', type: 'Grass', baseHp: 90 },
  { name: 'Venusaur', type: 'Grass', baseHp: 160 },
  { name: 'Eevee', type: 'Colorless', baseHp: 70 },
  { name: 'Snorlax', type: 'Colorless', baseHp: 150 },
  { name: 'Gengar', type: 'Psychic', baseHp: 130 },
  { name: 'Alakazam', type: 'Psychic', baseHp: 120 },
  { name: 'Machop', type: 'Fighting', baseHp: 80 },
  { name: 'Machamp', type: 'Fighting', baseHp: 150 },
  { name: 'Onix', type: 'Fighting', baseHp: 110 },
  { name: 'Jigglypuff', type: 'Fairy', baseHp: 90 },
  { name: 'Clefairy', type: 'Fairy', baseHp: 90 },
  { name: 'Dragonite', type: 'Dragon', baseHp: 160 },
  { name: 'Dratini', type: 'Dragon', baseHp: 70 },
  { name: 'Metagross', type: 'Metal', baseHp: 160 },
  { name: 'Lucario', type: 'Fighting', baseHp: 130 },
  { name: 'Umbreon', type: 'Dark', baseHp: 120 },
  { name: 'Absol', type: 'Dark', baseHp: 110 },
  { name: 'Lapras', type: 'Water', baseHp: 130 },
  { name: 'Gyarados', type: 'Water', baseHp: 170 },
  { name: 'Arcanine', type: 'Fire', baseHp: 140 },
  { name: 'Flareon', type: 'Fire', baseHp: 130 },
];

const SETS = [
  'Base Set',
  'Jungle',
  'Fossil',
  'Team Rocket',
  'Gym Heroes',
  'Gym Challenge',
  'Neo Genesis',
  'Neo Discovery',
];

const RARITIES = ['Common', 'Uncommon', 'Rare', 'Ultra Rare', 'Secret Rare'];

function buildCatalog(targetSize = 150) {
  const cards = [];
  let counter = 1;

  outer: for (const family of FAMILIES) {
    for (const setName of SETS) {
      for (const rarity of RARITIES) {
        const idSuffix = String(counter).padStart(4, '0');
        const hp =
          family.baseHp +
          Math.floor((counter % 5) * 10) +
          (rarity === 'Ultra Rare' ? 20 : rarity === 'Secret Rare' ? 30 : 0);
        const retreat = Math.max(1, Math.min(4, Math.floor(hp / 50)));
        const typeKey = TYPE_IMAGE[family.type] ? family.type : 'Colorless';
        cards.push({
          id: `demo-${family.name.toLowerCase().replace(/[^a-z0-9]+/g, '-')}-${idSuffix}`,
          name: `${family.name}`,
          set_name: setName,
          number: `${setName.slice(0, 3).toUpperCase()}-${idSuffix}`,
          rarity,
          image_url: getImageForType(typeKey),
          type: family.type,
          hp,
          weaknesses: TYPE_WEAKNESS[typeKey] || 'Colorless x2',
          retreat,
        });
        counter += 1;
        if (cards.length >= targetSize) {
          break outer;
        }
      }
    }
  }

  return cards;
}

async function seedCardsIfNeeded({ minCount = 120 } = {}) {
  const { rows } = await db.query('SELECT COUNT(*)::int AS count FROM cards');
  const current = Number(rows[0]?.count || 0);

  const catalog = buildCatalog(Math.max(minCount, 150));
  if (current >= minCount) {
    console.log(`Refreshing cards table with ${catalog.length} entries (existing ${current})`);
  } else {
    console.log(`Seeding cards table with ${catalog.length} entries (current count ${current})`);
  }

  const columns = [
    'id',
    'name',
    'set_name',
    'number',
    'rarity',
    'image_url',
    'type',
    'hp',
    'weaknesses',
    'retreat',
  ];

  const chunkSize = 50;

  for (let i = 0; i < catalog.length; i += chunkSize) {
    const chunk = catalog.slice(i, i + chunkSize);
    const params = [];
    const values = chunk.map((card, idx) => {
      const baseIndex = idx * columns.length;
      columns.forEach((col) => params.push(card[col]));
      const placeholders = columns
        .map((_, colIdx) => `$${baseIndex + colIdx + 1}`)
        .join(', ');
      return `(${placeholders})`;
    });

    const updates = columns
      .filter((col) => col !== 'id')
      .map((col) => `${col} = EXCLUDED.${col}`)
      .join(', ');

    await db.query(
      `INSERT INTO cards (${columns.join(', ')})
       VALUES ${values.join(', ')}
       ON CONFLICT (id) DO UPDATE SET ${updates}`,
      params
    );
  }
}

module.exports = {
  seedCardsIfNeeded,
};
