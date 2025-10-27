const db = require('../db');
const { buildCardSearchConditions } = require('../utils/cardSearch');

async function searchCards({ q, type, rarity, set, limit = 20, offset = 0 }) {
  const numericLimit = Math.min(Number(limit) || 20, 100);
  const numericOffset = Math.max(Number(offset) || 0, 0);

  const safeFilters = {
    q: q ? String(q).trim().toLowerCase() : '',
    type: type ? String(type).trim().toLowerCase() : '',
    rarity: rarity ? String(rarity).trim().toLowerCase() : '',
    set: set ? String(set).trim().toLowerCase() : '',
  };

  const { conditions, params, nextIndex } = buildCardSearchConditions(
    safeFilters,
    null,
    1
  );
  const whereClause = conditions.length ? `WHERE ${conditions.join(' AND ')}` : '';

  const limitPlaceholder = `$${nextIndex}`;
  const offsetPlaceholder = `$${nextIndex + 1}`;

  const query = `
    SELECT *, COUNT(*) OVER() AS total_count
    FROM cards
    ${whereClause}
    ORDER BY name ASC
    LIMIT ${limitPlaceholder}
    OFFSET ${offsetPlaceholder}
  `;

  const finalParams = [...params, numericLimit, numericOffset];

  const { rows } = await db.query(query, finalParams);
  const total = rows.length > 0 ? Number(rows[0].total_count) : 0;
  const items = rows.map(({ total_count, ...rest }) => rest);
  return { items, total };
}

module.exports = {
  searchCards,
};
