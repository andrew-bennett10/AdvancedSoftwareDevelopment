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

const PORT = 12343;
app.listen(PORT, () => {
  console.log(`Backend running on http://localhost:${PORT}`);
});
