function attachUser(req, _res, next) {
  const header = req.header('x-account-id');
  const parsed = Number(header);
  const fallback = 1;
  const id = Number.isFinite(parsed) && parsed > 0 ? parsed : fallback;
  req.user = { id };
  next();
}

module.exports = {
  attachUser,
};
