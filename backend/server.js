const express = require('express');
const cors = require('cors');
const db = require('./db');
const binderRoutes = require('./routes/binders');
const cardRoutes = require('./routes/cards');

const app = express();
app.use(cors({ origin: 'http://localhost:3000' }));
app.use(express.json());
app.use('/api/binders', binderRoutes);
app.use('/api/cards', cardRoutes);

app.get('/health', (_req, res) => {
  res.json({ ok: true });
});

// Sign Up endpoint
app.post('/signup', async (req, res) => {
  const { username, email, password } = req.body;
  try {
    const result = await db.query(
      'INSERT INTO accounts (username, email, password) VALUES ($1, $2, $3) RETURNING *',
      [username, email, password]
    );
    res.status(201).json({ message: 'Signup successful', user: result.rows[0] });
  } catch (err) {
    console.error(err);
    res.status(400).send({ error: 'Signup failed' });
  }
});

// Login endpoint
app.post('/login', async (req, res) => {
  const { email, password } = req.body;
  try {
    const result = await db.query(
      'SELECT * FROM accounts WHERE email = $1 AND password = $2',
      [email, password]
    );
    if (result.rows.length > 0) {
      res.send({ message: 'Login successful', user: result.rows[0] });
    } else {
      res.status(401).send({ error: 'Invalid credentials' });
    }
  } catch (err) {
    console.error(err);
    res.status(400).send({ error: 'Login failed' });
  }
});

// Update Account Details endpoint
app.put('/update-account', async (req, res) => {
  const { userId, username, email } = req.body;
  try {
    // First check if the new email already exists for a different user
    const emailCheck = await db.query(
      'SELECT * FROM accounts WHERE email = $1 AND id != $2',
      [email, userId]
    );
    
    if (emailCheck.rows.length > 0) {
      return res.status(400).send({ error: 'Email already exists' });
    }

    // Check if the new username already exists for a different user
    const usernameCheck = await db.query(
      'SELECT * FROM accounts WHERE username = $1 AND id != $2',
      [username, userId]
    );
    
    if (usernameCheck.rows.length > 0) {
      return res.status(400).send({ error: 'Username already exists' });
    }

    // Update the user's details
    const result = await db.query(
      'UPDATE accounts SET username = $1, email = $2 WHERE id = $3 RETURNING *',
      [username, email, userId]
    );

    if (result.rows.length > 0) {
      res.send({ message: 'Account updated successfully', user: result.rows[0] });
    } else {
      res.status(404).send({ error: 'User not found' });
    }
  } catch (err) {
    console.error(err);
    res.status(400).send({ error: 'Failed to update account' });
  }
});

// Change Password endpoint
app.put('/change-password', async (req, res) => {
  const { userId, currentPassword, newPassword } = req.body;
  try {
    // Verify current password
    const result = await db.query(
      'SELECT * FROM accounts WHERE id = $1 AND password = $2',
      [userId, currentPassword]
    );

    if (result.rows.length === 0) {
      return res.status(401).send({ error: 'Current password is incorrect' });
    }

    // Update to new password
    await db.query(
      'UPDATE accounts SET password = $1 WHERE id = $2',
      [newPassword, userId]
    );

    res.send({ message: 'Password changed successfully' });
  } catch (err) {
    console.error(err);
    res.status(400).send({ error: 'Failed to change password' });
  }
});

// Delete Account endpoint
app.delete('/delete-account', async (req, res) => {
  const { userId } = req.body;
  try {
    // Delete the user account
    const result = await db.query(
      'DELETE FROM accounts WHERE id = $1 RETURNING *',
      [userId]
    );

    if (result.rows.length > 0) {
      res.send({ message: 'Account deleted successfully' });
    } else {
      res.status(404).send({ error: 'User not found' });
    }
  } catch (err) {
    console.error(err);
    res.status(400).send({ error: 'Failed to delete account' });
  }
});

// Favourites endpoints
app.get('/api/favourites', async (req, res) => {
  const userId = Number(req.query.userId);
  if (!userId) {
    return res.status(400).send({ error: 'Missing or invalid userId' });
  }
  try {
    const { rows } = await db.query(
      `SELECT id, user_id, card_title, card_description, card_image_url, created_at
       FROM favourites
       WHERE user_id = $1
       ORDER BY created_at DESC`,
      [userId]
    );
    res.send(rows);
  } catch (err) {
    console.error('Error fetching favourites:', err);
    res.status(500).send({ error: 'Failed to fetch favourites' });
  }
});

app.post('/api/favourites', async (req, res) => {
  const { userId, cardTitle, cardDescription = '', cardImageUrl = '' } = req.body || {};
  if (!userId || !cardTitle) {
    return res.status(400).send({ error: 'userId and cardTitle are required' });
  }
  try {
    const { rows } = await db.query(
      `INSERT INTO favourites (user_id, card_title, card_description, card_image_url)
       VALUES ($1, $2, $3, $4)
       RETURNING id, user_id, card_title, card_description, card_image_url, created_at`,
      [userId, cardTitle, cardDescription, cardImageUrl]
    );
    const favourite = rows[0];

    // Check and award achievement for first favourite
    let newAchievement = null;
    try {
      const achievementResult = await db.query(
        `INSERT INTO achievements (user_id, achievement_type, achievement_name, achievement_description)
         VALUES ($1, $2, $3, $4)
         ON CONFLICT (user_id, achievement_type) DO NOTHING
         RETURNING id, user_id, achievement_type, achievement_name, achievement_description, unlocked_at`,
        [userId, 'FIRST_FAVOURITE', 'First Favourite', 'Add your first card to favourites']
      );
      if (achievementResult.rows.length > 0) {
        newAchievement = achievementResult.rows[0];
      }
    } catch (achievementErr) {
      console.error('Error awarding achievement:', achievementErr);
      // Don't fail the request if achievement fails
    }

    res.status(201).send({ favourite, achievement: newAchievement });
  } catch (err) {
    console.error('Error creating favourite:', err);
    res.status(500).send({ error: 'Failed to create favourite' });
  }
});

app.delete('/api/favourites/:id', async (req, res) => {
  const favId = Number(req.params.id);
  const userId = Number(req.query.userId || req.body?.userId);
  if (!favId || !userId) {
    return res.status(400).send({ error: 'favourite id and userId are required' });
  }
  try {
    const { rows } = await db.query(
      `DELETE FROM favourites
       WHERE id = $1 AND user_id = $2
       RETURNING id`,
      [favId, userId]
    );
    if (rows.length === 0) {
      return res.status(404).send({ error: 'Favourite not found' });
    }
    res.send({ ok: true });
  } catch (err) {
    console.error('Error deleting favourite:', err);
    res.status(500).send({ error: 'Failed to delete favourite' });
  }
});

// Binders endpoints
app.post('/binders', async (req, res) => {
  const {
    account_id,
    accountId,
    userId,
    title,
    format,
    name,
    type_of_card,
    typeOfCard,
  } = req.body || {};

  const resolvedAccountId = Number(account_id ?? accountId ?? userId);

  if (!Number.isInteger(resolvedAccountId) || resolvedAccountId <= 0) {
    console.error('Create binder error: missing account_id');
    return res.status(400).json({ error: 'Missing account_id' });
  }

  const trimmedName = typeof name === 'string' ? name.trim() : '';
  const binderName = trimmedName || (typeof title === 'string' ? title.trim() : '');
  const typeOfCardValue = typeof type_of_card === 'string' && type_of_card.trim()
    ? type_of_card.trim()
    : (typeof typeOfCard === 'string' ? typeOfCard.trim() : '');

  if (!binderName || !typeOfCardValue) {
    return res.status(400).json({ error: 'Binder name and type are required' });
  }

  const binderTitle = typeof title === 'string' && title.trim() ? title.trim() : binderName;
  const binderFormat = typeof format === 'string' && format.trim() ? format.trim() : 'Standard';

  try {
    const { rows } = await db.query(
      `INSERT INTO binders (account_id, title, format, name, type_of_card)
       VALUES ($1, $2, $3, $4, $5)
       RETURNING id, account_id, title, format, name, type_of_card, created_at`,
      [resolvedAccountId, binderTitle, binderFormat, binderName, typeOfCardValue]
    );
    const binderRow = rows[0];
    const binder = {
      id: binderRow.id,
      account_id: binderRow.account_id,
      title: binderRow.title,
      format: binderRow.format,
      name: binderRow.name,
      typeOfCard: binderRow.type_of_card,
      created_at: binderRow.created_at,
    };

    // Check and award achievement for first binder (if userId is provided)
    let newAchievement = null;
    if (resolvedAccountId) {
      try {
        const achievementResult = await db.query(
          `INSERT INTO achievements (user_id, achievement_type, achievement_name, achievement_description)
           VALUES ($1, $2, $3, $4)
           ON CONFLICT (user_id, achievement_type) DO NOTHING
           RETURNING id, user_id, achievement_type, achievement_name, achievement_description, unlocked_at`,
          [resolvedAccountId, 'FIRST_BINDER', 'Binder Creator', 'Create your first binder']
        );
        if (achievementResult.rows.length > 0) {
          newAchievement = achievementResult.rows[0];
        }
      } catch (achievementErr) {
        console.error('Error awarding achievement:', achievementErr);
        // Don't fail the request if achievement fails
      }
    }

    res.status(201).json({ message: 'Binder created', binder, achievement: newAchievement });
  } catch (err) {
    console.error('Error creating binder:', err);
    res.status(400).json({ error: 'Failed to create binder' });
  }
});

// get a list of binders
app.get('/binders', async (_req, res) => {
  try {
    const { rows } = await db.query('SELECT id, name, type_of_card FROM binders ORDER BY id');
    const binders = rows.map(({ id, name, type_of_card }) => ({
      id,
      name,
      typeOfCard: type_of_card,
    }));
    res.send({ binders });
  } catch (err) {
    console.error('Error fetching binders:', err);
    res.status(500).send({ error: 'Failed to fetch binders' });
  }
});

// get a specific binder by id
app.get('/binders/:id', async (req, res) => {
  const id = Number(req.params.id);
  if (!id) {
    return res.status(400).send({ error: 'Invalid binder id' });
  }
  try {
    const { rows } = await db.query('SELECT id, name, type_of_card FROM binders WHERE id = $1', [id]);
    if (rows.length === 0) {
      return res.status(404).send({ error: 'Binder not found' });
    }
    const binder = {
      id: rows[0].id,
      name: rows[0].name,
      typeOfCard: rows[0].type_of_card,
    };
    res.send({ binder });
  } catch (err) {
    console.error('Error fetching binder by id:', err);
    res.status(500).send({ error: 'Failed to fetch binder' });
  }
});

// edit the name and type of card of a binder 
app.post('/edit-binder', async (req, res) => {
  const { id, name, typeOfCard } = req.body || {};
  if (!id) {
    return res.status(400).send({ error: 'Missing binder id' });
  }
  try {
    const { rows } = await db.query(
      'UPDATE binders SET name = $1, type_of_card = $2 WHERE id = $3 RETURNING id, name, type_of_card',
      [name, typeOfCard, id]
    );
    if (rows.length === 0) {
      return res.status(404).send({ error: 'Binder not found' });
    }
    const binder = {
      id: rows[0].id,
      name: rows[0].name,
      typeOfCard: rows[0].type_of_card,
    };
    res.send({ message: 'Binder updated', binder });
  } catch (err) {
    console.error('Error updating binder:', err);
    res.status(400).send({ error: 'Failed to update binder' });
  }
});

// Delete binder by id
app.delete('/binders/:id', async (req, res) => {
  const id = Number(req.params.id);
  if (!id || !Number.isInteger(id) || id <= 0) {
    return res.status(400).json({ error: 'Invalid binder id' });
  }
  try {
    const { rows } = await db.query('DELETE FROM binders WHERE id = $1 RETURNING id', [id]);
    if (rows.length === 0) {
      return res.status(404).json({ error: 'Binder not found' });
    }
    res.json({ message: 'Successfully released binder (deleted successfully)' });
  } catch (err) {
    console.error('Error deleting binder:', err);
    res.status(500).json({ error: 'The binder did not want to be released (failed to delete)' });
  }
});

// Achievements endpoints
app.get('/api/achievements', async (req, res) => {
  const userId = Number(req.query.userId);
  if (!userId) {
    return res.status(400).send({ error: 'Missing or invalid userId' });
  }
  try {
    const { rows } = await db.query(
      `SELECT id, user_id, achievement_type, achievement_name, achievement_description, unlocked_at
       FROM achievements
       WHERE user_id = $1
       ORDER BY unlocked_at DESC`,
      [userId]
    );
    res.send(rows);
  } catch (err) {
    console.error('Error fetching achievements:', err);
    res.status(500).send({ error: 'Failed to fetch achievements' });
  }
});

app.post('/api/achievements', async (req, res) => {
  const { userId, achievementType, achievementName, achievementDescription = '' } = req.body || {};
  if (!userId || !achievementType || !achievementName) {
    return res.status(400).send({ error: 'userId, achievementType, and achievementName are required' });
  }
  try {
    const { rows } = await db.query(
      `INSERT INTO achievements (user_id, achievement_type, achievement_name, achievement_description)
       VALUES ($1, $2, $3, $4)
       ON CONFLICT (user_id, achievement_type) DO NOTHING
       RETURNING id, user_id, achievement_type, achievement_name, achievement_description, unlocked_at`,
      [userId, achievementType, achievementName, achievementDescription]
    );
    if (rows.length === 0) {
      return res.status(200).send({ message: 'Achievement already unlocked' });
    }
    const achievement = rows[0];
    res.status(201).send({ achievement });
  } catch (err) {
    console.error('Error creating achievement:', err);
    res.status(500).send({ error: 'Failed to create achievement' });
  }
});

module.exports = app;
