// Adapter for query results. Kept out of the component so the library never
// assumes your column names: hand `DocView` `{ id, tag, body }` objects directly
// if they already have that shape.

const DEFAULT_COLUMNS = {
  id: 'doc_id',
  tag: 'tag',
  body: 'body',
}

/**
 * @param {Array<object>} rows  already in render order
 * @param {Partial<typeof DEFAULT_COLUMNS>} [columns]  override column names
 * @returns {Array<{ id: any, tag: string, body: string }>}
 */
export function fromRows(rows, columns = {}) {
  const col = { ...DEFAULT_COLUMNS, ...columns }
  return rows.map((row) => ({
    id: row[col.id],
    tag: row[col.tag] ?? '',
    body: row[col.body] ?? '',
  }))
}
