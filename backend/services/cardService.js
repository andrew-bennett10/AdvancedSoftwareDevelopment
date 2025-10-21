const db = require('../db');

function buildSearchQuery(filters) {
  const where = [];
  const params = [];

  if (filters.q) {
    params.push(`%${filters.q}%`);
    where.push(`(name ILIKE $${params.length} OR number ILIKE $${params.length} OR set_name ILIKE $${params.length})`);
  }

  if (filters.type) {
    params.push(filters.type);
    where.push(`type = $${params.length}`);
  }

  if (filters.rarity) {
    params.push(filters.rarity);
    where.push(`rarity = $${params.length}`);
  }

  if (filters.set) {
    params.push(filters.set);
    where.push(`set_name = $${params.length}`);
  }

  const whereClause = where.length ? `WHERE ${where.join(' AND ')}` : '';
  return { whereClause, params };
}

async function searchCards({ q, type, rarity, set, limit = 20, offset = 0 }) {
  const numericLimit = Math.min(Number(limit) || 20, 100);
  const numericOffset = Math.max(Number(offset) || 0, 0);

  const { whereClause, params } = buildSearchQuery({ q, type, rarity, set });
  params.push(numericLimit, numericOffset);

  const query = `
    SELECT *, COUNT(*) OVER() AS total_count
    FROM cards
    ${whereClause}
    ORDER BY name ASC
    LIMIT $${params.length - 1}
    OFFSET $${params.length}
  `;

  const { rows } = await db.query(query, params);
  const total = rows.length > 0 ? Number(rows[0].total_count) : 0;
  const items = rows.map(({ total_count, ...rest }) => rest);
  return { items, total };
}

module.exports = {
  searchCards,
};
