const binderService = require('../services/binderService');

function parseBinderId(params) {
  const raw = params.binderId || params.id;
  const value = Number(raw);
  if (!Number.isInteger(value) || value <= 0) {
    const err = new Error('Invalid binderId');
    err.status = 400;
    throw err;
  }
  return value;
}

async function ensureBinderOwner(req, _res, next) {
  try {
    if (!req.user || !req.user.id) {
      const err = new Error('Authentication required');
      err.status = 401;
      throw err;
    }
    const binderId = parseBinderId(req.params);
    const binder = await binderService.assertBinderOwnership(binderId, req.user.id);
    req.binder = {
      id: binder.id,
      ownerId: binder.account_id,
      title: binder.title,
      name: binder.name,
    };
    req.binderId = binderId;
    next();
  } catch (err) {
    next(err);
  }
}

module.exports = {
  ensureBinderOwner,
  parseBinderId,
};
