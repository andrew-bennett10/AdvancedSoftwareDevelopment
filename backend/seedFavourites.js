// backend/seedFavourites.js
const db = require('./db');

async function seed() {
  // create a test user if missing
  const { rows: users } = await db.query(
    `INSERT INTO accounts (username, password, email)
     VALUES ('demo', 'demo-password-hash', 'demo@example.com')
     ON CONFLICT (username) DO NOTHING
     RETURNING id`
  );

  // get the user's id
  const { rows: found } = await db.query(
    `SELECT id FROM accounts WHERE username = 'demo'`
  );
  const userId = found[0]?.id;

  if (!userId) throw new Error('Failed to resolve demo user id');

  // insert a couple of favourites if none exist for this user
  const { rows: favs } = await db.query(
    `SELECT COUNT(*)::int AS count FROM favourites WHERE user_id = $1`,
    [userId]
  );
  if (favs[0].count > 0) {
    console.log('Favourites already seeded');
    return;
  }

  await db.query(
    `INSERT INTO favourites (user_id, card_title, card_description, card_image_url)
     VALUES 
      ($1, 'Sample Card A', 'This is a sample favourite card.', 'https://picsum.photos/seed/a/600/400'),
      ($1, 'Sample Card B', 'Another sample favourite card.', 'https://picsum.photos/seed/b/600/400'),
      ($1, 'Sample Card C', 'One more favourite for testing.', 'https://picsum.photos/seed/c/600/400')`,
    [userId]
  );
  console.log('Seeded favourites for demo user (id=' + userId + ')');
}

seed()
  .then(() => process.exit(0))
  .catch(err => {
    console.error('Seeding error:', err);
    process.exit(1);
  });

