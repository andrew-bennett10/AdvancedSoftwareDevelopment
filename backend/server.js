const express = require('express');
const cors = require('cors');
const db = require('./db');

const app = express();
app.use(cors());
app.use(express.json());

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

const PORT = 12343;
app.listen(PORT, () => {
  console.log(`Backend running on http://localhost:${PORT}`);
});
