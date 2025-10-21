const express = require('express');
const { searchCards } = require('../services/cardService');

const router = express.Router();

router.get('/', async (req, res) => {
  try {
    const { q, type, rarity, set, limit, offset } = req.query;
    const data = await searchCards({ q, type, rarity, set, limit, offset });
    res.json({ ok: true, ...data });
  } catch (err) {
    console.error('Card search failed:', err);
    res.status(500).json({ error: 'Failed to search cards' });
  }
});

module.exports = router;
