const express = require('express');
const cors = require('cors');
const db = require('./db');
const binderRoutes = require('./routes/binders');
const cardRoutes = require('./routes/cards');

const app = express();
app.use(cors());
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
    res.status(201).send({ message: 'User created successfully', user: result.rows[0] });
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

// Add create-binder endpoint
app.post('/create-binder', async (req, res) => {
  try {
    console.log('POST /create-binder body:', req.body);
    const { accountId, name, title: titleFromBody, format } = req.body;

    const title = (titleFromBody ?? name ?? '').trim();
    if (!accountId || !title) {
      return res.status(400).json({ error: 'accountId and title are required' });
    }

    const { rows } = await db.query(
      `INSERT INTO binders (account_id, title, format)
       VALUES ($1,$2,COALESCE($3, 'Standard'))
       RETURNING id, account_id, title, format, created_at`,
      [accountId, title, format]
    );

    return res.status(201).json(rows[0]);
  } catch (err) {
    console.error('Error creating binder:', err);
    return res.status(500).json({ error: 'Internal server error' });
  }
});

// Add GET /binders endpoint so I can actually get the binders from the DB
app.get('/binders', async (req, res) => {
  try {
    const result = await db.query('SELECT * FROM binders ORDER BY id');
    // console.log('GET /binders -> rows:', result.rows.length); // we do a little bit of debugging
    res.send({ binders: result.rows });
  } catch (err) {
    console.error('Error fetching binders:', err);
    res.status(500).send({ error: 'Failed to access PC' });
  }
});

// Add GET /binders/:id to get a single binder for editing
app.get('/binders/:id', async (req, res) => {
  const id = req.params.id;
  try {
    const result = await db.query('SELECT * FROM binders WHERE id = $1', [id]);
    if (result.rows.length > 0) {
      res.send({ binder: result.rows[0] });
    } else {
      res.status(404).send({ error: 'Binder not found' });
    }
  } catch (err) {
    console.error('Error fetching binder by id:', err);
    res.status(500).send({ error: 'Failed to access PC' });
  }
});

// Edit binder endpoint 
app.post('/edit-binder', async (req, res) => {
  const { id, name, typeOfCard } = req.body;
  if (!id) {
    return res.status(400).send({ error: 'Missing binder id' });
  }
  try {
    const result = await db.query(
      'UPDATE binders SET name = $1, typeOfCard = $2 WHERE id = $3 RETURNING *',
      [name, typeOfCard, id]
    );
    if (result.rows.length > 0) {
      console.log('Your binder has evolved!:', result.rows[0]);
      res.send({ message: 'Binder updated', binder: result.rows[0] });
    } else {
      res.status(404).send({ error: 'Binder not found' });
    }
  } catch (err) {
    console.error('Error updating binder:', err);
    res.status(400).send({ error: 'You stopped the evolution' });
  }
});

const PORT = process.env.PORT || 12343;

if (require.main === module) {
  app.listen(PORT, () => {
    console.log(`Backend running on http://localhost:${PORT}`);
  });
}

module.exports = app;
