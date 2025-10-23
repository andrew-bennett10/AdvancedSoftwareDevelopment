const express = require('express');
const router = express.Router();

// IMPORTANT: binderService must export functions (not objects) with these names:
const binderService = require('../services/binderService');

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

// Minimal “auth” – read account id from header (dev default = 1)
function getAccountId(req) {
  const h = req.header('x-account-id');
  const n = Number(h);
  return Number.isFinite(n) && n > 0 ? n : 1;
}

// Validate path param helpers
function parseBinderId(req) {
  const n = Number(req.params.binderId);
  if (!Number.isFinite(n) || n <= 0) {
    const err = new Error('Invalid binderId');
    err.status = 400;
    throw err;
  }
  return n;
}

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

// GET /api/binders/:binderId/cards  -> list binder cards with quantities + details
router.get(
  '/:binderId/cards',
  asyncHandler(async (req, res) => {
    const accountId = getAccountId(req);
    const binderId = parseBinderId(req);

    await binderService.assertBinderOwnership(binderId, accountId);
    const rows = await binderService.listBinderCards(binderId);

    res.json({ ok: true, data: rows });
  })
);

// GET /api/binders/:binderId/cards/:cardId -> single card detail in binder
router.get(
  '/:binderId/cards/:cardId',
  asyncHandler(async (req, res) => {
    const accountId = getAccountId(req);
    const binderId = parseBinderId(req);
    const cardId = parseCardId(req);

    await binderService.assertBinderOwnership(binderId, accountId);
    const row = await binderService.getBinderCard(binderId, cardId);
    if (!row) return res.status(404).json({ error: 'Card not found in binder' });

    res.json({ ok: true, data: row });
  })
);

// POST /api/binders/:binderId/cards  { cardId } -> add or increment
router.post(
  '/:binderId/cards',
  asyncHandler(async (req, res) => {
    const accountId = getAccountId(req);
    const binderId = parseBinderId(req);
    const cardId = parseCardId(req);

    await binderService.assertBinderOwnership(binderId, accountId);
    const result = await binderService.addOrIncrement(binderId, cardId);

    res.status(201).json({ ok: true, data: result });
  })
);

// PATCH /api/binders/:binderId/cards/:cardId  { quantity } -> set qty (0 deletes)
router.patch(
  '/:binderId/cards/:cardId',
  asyncHandler(async (req, res) => {
    const accountId = getAccountId(req);
    const binderId = parseBinderId(req);
    const cardId = parseCardId(req);
    const quantity = Number(req.body && req.body.quantity);

    if (!Number.isInteger(quantity) || quantity < 0) {
      return res.status(400).json({ error: 'quantity must be a non-negative integer' });
    }

    await binderService.assertBinderOwnership(binderId, accountId);
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
    const accountId = getAccountId(req);
    const binderId = parseBinderId(req);
    const cardId = parseCardId(req);

    await binderService.assertBinderOwnership(binderId, accountId);
    await binderService.removeCard(binderId, cardId);

    res.json({ ok: true, data: { deleted: true, cardId } });
  })
);

// DELETE /api/binders/:binderId/cards/bulk -> remove many cards
router.delete(
  '/:binderId/cards/bulk',
  asyncHandler(async (req, res) => {
    const accountId = getAccountId(req);
    const binderId = parseBinderId(req);
    if (process.env.NODE_ENV !== 'production') {
      console.info('[bindersRoute] bulk delete request', {
        binderId,
        accountId,
        rawBody: req.body,
      });
    }
    const items = parseBulkItems(req);

    await binderService.assertBinderOwnership(binderId, accountId);
    const result = await binderService.removeCardsBulk(binderId, items);

    if (process.env.NODE_ENV !== 'production') {
      console.info('[bindersRoute] bulk delete response', {
        binderId,
        accountId,
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
