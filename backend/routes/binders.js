const express = require('express');
const router = express.Router();

// IMPORTANT: binderService must export functions (not objects) with these names:
const binderService = require('../services/binderService');

const requiredExports = [
  'assertBinderOwnership',
  'listBinderCards',
  'getBinderCard',
  'addOrIncrement',
  'updateQuantity',
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

// PATCH /api/binders/:binderId/cards/:cardId  { delta: 1 | -1 } -> inc/dec or remove at 0
router.patch(
  '/:binderId/cards/:cardId',
  asyncHandler(async (req, res) => {
    const accountId = getAccountId(req);
    const binderId = parseBinderId(req);
    const cardId = parseCardId(req);
    const delta = Number(req.body && req.body.delta);

    if (delta !== 1 && delta !== -1) {
      return res.status(400).json({ error: 'delta must be 1 or -1' });
    }

    await binderService.assertBinderOwnership(binderId, accountId);
    const result = await binderService.updateQuantity(binderId, cardId, delta);

    // result: { action:'updated'|'removed', qty?:number, cardId }
    res.json({ ok: true, data: result });
  })
);

// Basic error handler for this router (kept local)
router.use((err, req, res, _next) => {
  const status = err.status || 500;
  res.status(status).json({ error: err.message || 'Internal Server Error' });
});

module.exports = router;
