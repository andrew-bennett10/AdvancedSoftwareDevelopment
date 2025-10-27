const express = require('express');
const router = express.Router();

// IMPORTANT: binderService must export functions (not objects) with these names:
const binderService = require('../services/binderService');
const { ensureBinderOwner } = require('../middleware/binderAccess');

const requiredExports = [
  'assertBinderOwnership',
  'listBinderCards',
  'getBinderCard',
  'addOrIncrement',
  'setQuantity',
  'removeCard',
  'removeCardsBulk',
];

for (const name of requiredExports) {
  if (typeof binderService[name] !== 'function') {
    throw new Error(`binderService is missing required export: ${name}`);
  }
}

// Small utility to wrap async handlers and forward errors
const asyncHandler = (fn) => (req, res, next) => {
  Promise.resolve(fn(req, res, next)).catch(next);
};

router.use('/:binderId', ensureBinderOwner);

function parseCardId(req) {
  // cards.id is VARCHAR; just ensure non-empty
  const id = String(req.params.cardId || req.body.cardId || '').trim();
  if (!id) {
    const err = new Error('cardId is required');
    err.status = 400;
    throw err;
  }
  return id;
}

function parseBulkItems(req) {
  const body = req.body || {};
  const items = Array.isArray(body.items)
    ? body.items
    : Array.isArray(body.cardIds)
      ? body.cardIds.map((cardId) => ({ cardId }))
      : null;

  if (!items || items.length === 0) {
    const err = new Error('Request must include at least one card to remove.');
    err.status = 400;
    throw err;
  }

  const normalized = [];
  const seen = new Set();

  for (const raw of items) {
    if (!raw || raw.cardId == null) continue;
    const cardId = String(raw.cardId).trim();
    if (!cardId) continue;

    const finishRaw = raw.finish == null ? '' : String(raw.finish).trim();
    const finish = finishRaw || undefined;
    const key = `${cardId}::${finish || ''}`;

    if (seen.has(key)) continue;
    seen.add(key);
    normalized.push(finish ? { cardId, finish } : { cardId });
  }

  if (normalized.length === 0) {
    const err = new Error('Request must include cardIds to remove.');
    err.status = 400;
    throw err;
  }

  return normalized;
}

function normalizeCardQuery(query = {}) {
  const filters = {};
  if (query.q) {
    filters.q = String(query.q).trim();
  } else if (query.search) {
    filters.q = String(query.search).trim();
  }
  if (query.rarity) {
    filters.rarity = String(query.rarity).trim();
  }
  if (query.type) {
    filters.type = String(query.type).trim();
  }
  if (query.set) {
    filters.set = String(query.set).trim();
  }
  if (query.sortBy) {
    filters.sortBy = String(query.sortBy).trim();
  }
  if (query.order) {
    filters.order = String(query.order).trim();
  }
  return filters;
}

// GET /api/binders/:binderId/cards  -> list binder cards with quantities + details
router.get(
  '/:binderId/cards',
  asyncHandler(async (req, res) => {
    const binderId = req.binderId;
    const filters = normalizeCardQuery(req.query);
    const rows = await binderService.listBinderCards(binderId, filters);

    res.json({ ok: true, data: rows });
  })
);

// GET /api/binders/:binderId/cards/:cardId -> single card detail in binder
router.get(
  '/:binderId/cards/:cardId',
  asyncHandler(async (req, res) => {
    const binderId = req.binderId;
    const cardId = parseCardId(req);

    const row = await binderService.getBinderCard(binderId, cardId);
    if (!row) return res.status(404).json({ error: 'Card not found in binder' });

    res.json({ ok: true, data: row });
  })
);

// POST /api/binders/:binderId/cards  { cardId } -> add or increment
router.post(
  '/:binderId/cards',
  asyncHandler(async (req, res) => {
    const binderId = req.binderId;
    const cardId = parseCardId(req);

    const result = await binderService.addOrIncrement(binderId, cardId);

    res.status(201).json({ ok: true, data: result });
  })
);

// PATCH /api/binders/:binderId/cards/:cardId  { quantity } -> set qty (0 deletes)
router.patch(
  '/:binderId/cards/:cardId',
  asyncHandler(async (req, res) => {
    const binderId = req.binderId;
    const cardId = parseCardId(req);
    const quantity = Number(req.body && req.body.quantity);

    if (!Number.isInteger(quantity) || quantity < 0) {
      return res.status(400).json({ error: 'quantity must be a non-negative integer' });
    }

    const result = await binderService.setQuantity(binderId, cardId, quantity);

    if (!result) {
      return res.json({ ok: true, data: { deleted: true, cardId } });
    }

    res.json({ ok: true, data: result });
  })
);

// DELETE /api/binders/:binderId/cards/:cardId -> remove card entirely
router.delete(
  '/:binderId/cards/:cardId',
  asyncHandler(async (req, res) => {
    const binderId = req.binderId;
    const cardId = parseCardId(req);

    await binderService.removeCard(binderId, cardId);

    res.json({ ok: true, data: { deleted: true, cardId } });
  })
);

// DELETE /api/binders/:binderId/cards/bulk -> remove many cards
router.delete(
  '/:binderId/cards/bulk',
  asyncHandler(async (req, res) => {
    const binderId = req.binderId;
    if (process.env.NODE_ENV !== 'production') {
      console.info('[bindersRoute] bulk delete request', {
        binderId,
        rawBody: req.body,
      });
    }
    const items = parseBulkItems(req);

    const result = await binderService.removeCardsBulk(binderId, items);

    if (process.env.NODE_ENV !== 'production') {
      console.info('[bindersRoute] bulk delete response', {
        binderId,
        items,
        result,
      });
    }

    res.json({ ok: true, data: { ...result, items } });
  })
);

// Basic error handler for this router (kept local)
router.use((err, req, res, _next) => {
  const status = err.status || 500;
  res.status(status).json({ error: err.message || 'Internal Server Error' });
});

module.exports = router;
