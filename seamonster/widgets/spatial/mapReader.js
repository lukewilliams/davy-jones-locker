// What the Map panel draws of a node's output table, read as the node runs
// (an output reader: see flowGraph's addOutputReader), since its tables are
// gone by the next run. Needs DuckDB's spatial extension, which a table with
// geometry has loaded.

// A layers table has more rows than this: the rest aren't drawn.
export const LAYER_ROWS = 200

// CRSs whose x, y are longitude and latitude already (in Flow's x, y order).
const LON_LAT = new Set(['EPSG:4326', 'OGC:CRS84'])

const quote = (name) => `"${String(name).replace(/"/g, '""')}"`

// A value from the SQL engine as fromRows takes it: big integers as numbers.
const plain = (value) => (typeof value === 'bigint' ? Number(value) : value)

// A table shaped like fromRows's: a layer per row.
const isLayersTable = (names) => names.has('layer_id') && (names.has('data') || names.has('url'))

/*
 * One output table ({ table, columns, query }, as an output reader gets it)
 * for the map, up to `limit` rows:
 *
 *   { rows: [{ layer_id, label, format, data, url, style, visible, ... }] }
 *       a layers table (fromRows's shape: layer_id, and data or url), its
 *       first LAYER_ROWS rows, `more` true when it has more
 *   { columns: [{ name, crs, collection, rows, drawn, error }] }
 *       each geometry column: its features in longitude and latitude, as a
 *       FeatureCollection whose features' ids are their row numbers (from 0),
 *       null geometries skipped; `rows` the table's row count, `drawn` the
 *       features drawn (its first `limit` rows'); or `error`, why it can't be
 *       drawn (no CRS, or one PROJ can't transform)
 *   null  neither
 */
export async function readMapLayers({ table, columns, query }, { limit }) {
  const names = new Set(columns.map((c) => c.name))
  if (isLayersTable(names)) {
    const { columns: cols, rows } = await query(`SELECT * FROM ${table} LIMIT ${LAYER_ROWS + 1}`)
    return {
      rows: rows.slice(0, LAYER_ROWS).map((row) => Object.fromEntries(cols.map((c, i) => [c, plain(row[i])]))),
      more: rows.length > LAYER_ROWS,
    }
  }
  const geometry = columns.filter((c) => c.crs !== undefined)
  if (!geometry.length) return null
  const rows = Number((await query(`SELECT count(*) FROM ${table}`)).rows[0][0])
  const out = []
  for (const c of geometry) out.push({ name: c.name, crs: c.crs, rows, ...(await readColumn(c, table, query, limit)) })
  return { columns: out }
}

async function readColumn(column, table, query, limit) {
  if (column.crs === null) {
    return { error: `${column.name} has no CRS (CRS unknown), so it can't be placed on the map. Give it one in SQL with ST_SetCRS.` }
  }
  const g = quote(column.name)
  const lonLat = LON_LAT.has(column.crs) ? g : `ST_Transform(${g}, 'EPSG:4326')`
  let rows
  try {
    rows = (await query(`SELECT ST_AsGeoJSON(${lonLat}) FROM ${table} LIMIT ${limit}`)).rows
  } catch (e) {
    return { error: `${column.name} couldn't be put in longitude and latitude for the map. ${e?.message ?? e}` }
  }
  const features = []
  rows.forEach(([json], i) => {
    if (json === null || json === undefined) return
    features.push({ type: 'Feature', id: i, geometry: typeof json === 'string' ? JSON.parse(json) : json, properties: {} })
  })
  return { collection: { type: 'FeatureCollection', features }, drawn: features.length }
}
