// Adapter for query results. Kept out of the components so the library never
// assumes your column names: hand `SceneView` `{ id, url }` objects directly if
// they already have that shape.

const DEFAULT_COLUMNS = {
  id: 'model_id',
  url: 'url',
  position: 'position',
  scale: 'scale',
}

/**
 * @param {Array<object>} rows  one row per model, already in render order
 * @param {{ baseUrl?: string } & Partial<typeof DEFAULT_COLUMNS>} [options]
 *   `baseUrl` is prefixed to each url, for paths stored relative to the app root
 *   (or, later, to a blob storage container).
 * @returns {Array<{ id: any, url: string, position?: number[], scale?: number }>}
 */
export function fromRows(rows, options = {}) {
  const { baseUrl = '', ...columns } = options
  const col = { ...DEFAULT_COLUMNS, ...columns }

  return rows.map((row) => {
    const model = { id: row[col.id], url: baseUrl + row[col.url] }
    if (row[col.position] != null) model.position = row[col.position]
    if (row[col.scale] != null) model.scale = row[col.scale]
    return model
  })
}

const DEFAULT_VIEW_COLUMNS = { position: 'position', target: 'target' }

/**
 * Adapter for a viewpoint row: "x,y,z" strings → number triples.
 *
 * Comma strings rather than JSON arrays, matching the other list columns — a
 * column that is sometimes empty does not infer as an array type.
 *
 * @param {object | undefined} row
 * @param {Partial<typeof DEFAULT_VIEW_COLUMNS>} [columns]
 * @returns {{ position: number[], target: number[] } | null} null if unusable
 */
export function fromViewRow(row, columns = {}) {
  if (!row) return null
  const col = { ...DEFAULT_VIEW_COLUMNS, ...columns }
  const position = triple(row[col.position])
  const target = triple(row[col.target])
  return position && target ? { position, target } : null
}

function triple(value) {
  const parts = String(value ?? '')
    .split(',')
    .map((n) => Number(n.trim()))
  return parts.length === 3 && parts.every(Number.isFinite) ? parts : null
}
