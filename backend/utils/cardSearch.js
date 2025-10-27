function makeColumn(alias, column) {
  if (!alias) return column;
  const trimmed = alias.trim();
  return trimmed ? `${trimmed}.${column}` : column;
}

function buildCardSearchConditions(filters = {}, alias = null, startIndex = 1) {
  const conditions = [];
  const params = [];
  let index = startIndex;

  const q = filters.q != null ? String(filters.q).trim() : '';
  const type = filters.type != null ? String(filters.type).trim().toLowerCase() : '';
  const rarity = filters.rarity != null ? String(filters.rarity).trim().toLowerCase() : '';
  const set = filters.set != null ? String(filters.set).trim().toLowerCase() : '';

  if (q) {
    const columnName = makeColumn(alias, 'name');
    const columnNumber = makeColumn(alias, 'number');
    const columnSet = makeColumn(alias, 'set_name');
    conditions.push(`(${columnName} ILIKE $${index} OR ${columnNumber} ILIKE $${index} OR ${columnSet} ILIKE $${index})`);
    params.push(`%${q}%`);
    index += 1;
  }

  if (type) {
    const columnType = makeColumn(alias, 'type');
    conditions.push(`LOWER(${columnType}) = $${index}`);
    params.push(type);
    index += 1;
  }

  if (rarity) {
    const columnRarity = makeColumn(alias, 'rarity');
    conditions.push(`LOWER(${columnRarity}) = $${index}`);
    params.push(rarity);
    index += 1;
  }

  if (set) {
    const columnSet = makeColumn(alias, 'set_name');
    conditions.push(`LOWER(${columnSet}) = $${index}`);
    params.push(set);
    index += 1;
  }

  return { conditions, params, nextIndex: index };
}

module.exports = {
  buildCardSearchConditions,
};
