// backend/index.js
const express = require('express');
const db = require('./db');

const app = express();
const PORT = process.env.PORT || 3001;

// Basic CORS for local dev
app.use((req, res, next) => {
  const origin = process.env.CORS_ORIGIN || 'http://localhost:3000';
  res.header('Access-Control-Allow-Origin', origin);
  res.header('Access-Control-Allow-Methods', 'GET,POST,PUT,PATCH,DELETE,OPTIONS');
  res.header('Access-Control-Allow-Headers', 'Content-Type, Authorization');
  if (req.method === 'OPTIONS') return res.sendStatus(204);
  next();
});

app.use(express.json());

app.get('/health', (req, res) => {
  res.json({ ok: true });
});

// GET /api/favourites?userId=1
app.get('/api/favourites', async (req, res) => {
  const userId = Number(req.query.userId);
  if (!userId) {
    return res.status(400).json({ error: 'Missing or invalid userId' });
  }
  try {
    const { rows } = await db.query(
      `SELECT id, user_id, card_title, card_description, card_image_url, created_at
       FROM favourites
       WHERE user_id = $1
       ORDER BY created_at DESC`,
      [userId]
    );
    res.json(rows);
  } catch (err) {
    console.error('Error fetching favourites:', err);
    res.status(500).json({ error: 'Failed to fetch favourites' });
  }
});

app.listen(PORT, () => {
  console.log(`Backend listening on port ${PORT}`);
});

