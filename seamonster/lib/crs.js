import { literal } from './sqlText.js'

// What GDAL and PROJ, inside the SQL engine's spatial extension, say about a
// CRS, cached per engine. DuckDB's spatial has no functions for a CRS's
// definition or for the transformation PROJ picks, so these ask indirectly.

const encoder = new TextEncoder()
const caches = new WeakMap()

function cacheOf(sql) {
  if (!caches.has(sql)) caches.set(sql, new Map())
  return caches.get(sql)
}

// A CRS as GDAL describes it: { name, auth_name, auth_code, wkt (OGC WKT
// version 1), projjson (text) }, as GeoPackage and a shapefile's .prj need
// it. GDAL reports it for a GeoJSON file whose `crs` member (GeoJSON 2008's)
// names the CRS (ST_Read_Meta). `crs` is an authority code or PROJJSON.
export function crsDefinition(sql, crs) {
  const cache = cacheOf(sql)
  if (!cache.has(crs)) {
    const defined = define(sql, crs)
    cache.set(crs, defined)
    defined.catch(() => cache.delete(crs)) // asked again next time
  }
  return cache.get(crs)
}

async function define(sql, crs) {
  const path = `flow-crs-${Date.now()}-${Math.random().toString(36).slice(2)}.geojson`
  const probe = { type: 'FeatureCollection', crs: { type: 'name', properties: { name: crs } }, features: [] }
  await sql.registerFile(path, encoder.encode(JSON.stringify(probe)))
  try {
    const { rows } = await sql.query(`SELECT unnest(layers).geometry_fields[1].crs FROM ST_Read_Meta(${literal(path)})`)
    const definition = rows[0]?.[0]
    if (!definition?.wkt) throw new Error(`GDAL doesn't know the CRS ${crs.length > 60 ? `${crs.slice(0, 60)}…` : crs}.`)
    return definition
  } finally {
    await sql.dropFile(path)
  }
}

// What the checks need to know about a CRS: { name, geographic (longitude
// and latitude, so lengths are degrees), datum (its name), base: { name, id }
// (its geographic CRS: itself, or a projected CRS's base), bbox (its area of
// use, in degrees) }.
export async function crsInfo(sql, crs) {
  const definition = await crsDefinition(sql, crs)
  const p = JSON.parse(definition.projjson)
  const base = p.type === 'ProjectedCRS' ? p.base_crs : p
  return {
    name: definition.name ?? p.name,
    geographic: p.type === 'GeographicCRS' || (p.type === 'GeodeticCRS' && p.coordinate_system?.subtype === 'ellipsoidal'),
    datum: base?.datum?.name ?? base?.datum_ensemble?.name ?? null,
    base: { name: base?.name ?? null, id: base?.id ? `${base.id.authority}:${base.id.code}` : null },
    bbox: p.bbox ?? null,
  }
}

// Whether transforming from `from` to `to` drops the shift between their
// datums: PROJ has only a null transformation between them, so coordinates
// come out unchanged (GDA94 or GDA2020 to and from WGS 84, NAD27 to NAD83
// without grids). Found by transforming a point in their area of use between
// their geographic CRSs and seeing it not move. Returns { from, to } (crsInfo
// of each), or null when the datums are the same or the shift is kept.
export async function droppedDatumShift(sql, from, to) {
  const a = await crsInfo(sql, from)
  const b = await crsInfo(sql, to)
  if (!a.datum || !b.datum || a.datum === b.datum || !a.base.id || !b.base.id || a.base.id === b.base.id) return null
  const [lon, lat] = samplePoint(a.bbox, b.bbox)
  const { rows } = await sql.query(
    `SELECT ST_X(p), ST_Y(p) FROM (SELECT ST_Transform(ST_Point(${lon}, ${lat}), ${literal(a.base.id)}, ${literal(b.base.id)}) AS p)`,
  )
  const [x, y] = rows[0]
  return Math.abs(x - lon) < 1e-9 && Math.abs(y - lat) < 1e-9 ? { from: a, to: b } : null
}

// A longitude and latitude both CRSs cover: the middle of where their areas
// of use overlap, or of the first's when they don't (0, 0 without either).
function samplePoint(first, second) {
  if (!first) return [0, 0]
  const span = (box) => {
    const east = box.east_longitude < box.west_longitude ? box.east_longitude + 360 : box.east_longitude // across 180°
    return { west: box.west_longitude, east, south: box.south_latitude, north: box.north_latitude }
  }
  const a = span(first)
  const b = second ? span(second) : a
  const overlap = { west: Math.max(a.west, b.west), east: Math.min(a.east, b.east), south: Math.max(a.south, b.south), north: Math.min(a.north, b.north) }
  const box = overlap.west < overlap.east && overlap.south < overlap.north ? overlap : a
  let lon = (box.west + box.east) / 2
  if (lon > 180) lon -= 360
  return [lon, (box.south + box.north) / 2]
}
