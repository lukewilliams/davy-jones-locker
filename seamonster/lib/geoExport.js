import { crsDefinition } from './crs.js'
import { fromHex, literal, quote } from './sqlText.js'
import { concat, zip } from './zip.js'

// DataExport's geo formats: GeoJSON, KML, GeoPackage and zipped shapefiles.
// They're assembled here from what DuckDB's spatial extension gives
// (ST_AsGeoJSON, ST_AsHEXWKB), since its GDAL writers corrupt what they write
// in DuckDB-wasm (ROADMAP 8g, "Checked first"). A table's geometry is its
// GEOMETRY column called `geometry`, or else its first.
//
// GeoJSON and KML are longitude and latitude by their standards: geometry is
// transformed to EPSG:4326 (x, y: geometry_always_xy) from its own CRS, and
// one whose CRS isn't known is refused. GeoPackage and shapefiles keep the
// CRS, written as GDAL reports it (crs.js's crsDefinition), or none when
// it's unknown.

const encoder = new TextEncoder()

// A column's CRS from its type as DESCRIBE spells it: 'EPSG:7855' for
// GEOMETRY('EPSG:7855'), null for plain GEOMETRY (unknown), undefined for a
// column that isn't geometry.
export function crsOfType(type) {
  const match = /^GEOMETRY(?:\('(.*)'\))?$/s.exec(String(type))
  if (!match) return undefined
  return match[1] === undefined ? null : match[1].replaceAll("''", "'")
}

// A table's columns, [{ name, type, crs }] (crs as crsOfType).
async function describe(sql, table) {
  const { rows } = await sql.query(`DESCRIBE SELECT * FROM ${table}`)
  return rows.map(([name, type]) => ({ name, type: String(type), crs: crsOfType(type) }))
}

const isGeometry = (column) => column.crs !== undefined

// The column written as a table's geometry, or null.
function geometryColumn(columns) {
  const geometry = columns.filter(isGeometry)
  return geometry.find((c) => c.name.toLowerCase() === 'geometry') ?? geometry[0] ?? null
}

const LONGITUDE_LATITUDE = ['EPSG:4326', 'OGC:CRS84']

// A geometry column as GeoJSON text in longitude and latitude. The target is
// EPSG:4326: DuckDB-wasm's spatial fails on 'OGC:CRS84' ("stoi: no
// conversion").
function lonLatGeoJson(column, format) {
  if (column.crs === null) {
    throw new Error(`The CRS of ${column.name} isn't known, so it can't be written as ${format} (longitude and latitude).`)
  }
  const c = quote(column.name)
  return `ST_AsGeoJSON(${LONGITUDE_LATITUDE.includes(column.crs) ? c : `ST_Transform(${c}, 'EPSG:4326')`})`
}

// A table's rows with every GEOMETRY column as GeoJSON text in longitude and
// latitude, and which column is the geometry (-1 for none).
async function lonLatRows(sql, table, format) {
  const columns = await describe(sql, table)
  const geometry = geometryColumn(columns)
  // Decimals as numbers, not the text that keeps their digits.
  const exprs = columns.map((c) => (isGeometry(c) ? `${lonLatGeoJson(c, format)} AS ${quote(c.name)}`
    : /^DECIMAL/.test(c.type) ? `CAST(${quote(c.name)} AS DOUBLE) AS ${quote(c.name)}`
    : quote(c.name)))
  const { rows } = await sql.query(`SELECT ${exprs.join(', ')} FROM ${table}`)
  // Without a GEOMETRY column, a column called geometry holding GeoJSON text.
  const g = geometry ? columns.indexOf(geometry) : columns.findIndex((c) => c.name.toLowerCase() === 'geometry')
  return { columns: columns.map((c) => c.name), rows, geometry: g }
}

const parseGeometry = (value) => (typeof value === 'string' ? JSON.parse(value) : value ?? null)

// ---- GeoJSON ----

export async function writeGeoJson(sql, table) {
  const { columns, rows, geometry } = await lonLatRows(sql, table, 'GeoJSON')
  if (geometry < 0) throw new Error('GeoJSON needs a geometry column, like a geo file read by DataIngest has.')
  const collection = {
    type: 'FeatureCollection',
    features: rows.map((row) => ({
      type: 'Feature',
      geometry: parseGeometry(row[geometry]),
      properties: Object.fromEntries(columns.flatMap((c, i) => (i === geometry ? [] : [[c, row[i]]]))),
    })),
  }
  return encoder.encode(JSON.stringify(collection))
}

// ---- KML ----

const xml = (text) => String(text).replace(/[<>&"']/g, (ch) => `&${{ '<': 'lt', '>': 'gt', '&': 'amp', '"': 'quot', "'": 'apos' }[ch]};`)

// Several tables are a folder each (as DataIngest reads a KML's folders).
// Columns called `name` and `description` are each placemark's own, and the
// other columns are its ExtendedData (which GDAL's KML reader skips; Google
// Earth and QGIS's LIBKML read it).
export async function writeKml(sql, tables, documentName) {
  const parts = []
  for (const t of tables) {
    const { columns, rows, geometry } = await lonLatRows(sql, t.table, 'KML')
    if (geometry < 0) throw new Error(`KML needs a geometry column, and ${t.label ?? t.name} has none.`)
    const own = (element) => columns.findIndex((c, i) => i !== geometry && c.toLowerCase() === element)
    const name = own('name')
    const description = own('description')
    const placemarks = rows.map((row) => {
      const element = (tag, i) => (i >= 0 && row[i] !== null ? `<${tag}>${xml(text(row[i]))}</${tag}>` : '')
      const data = columns
        .map((c, i) => ([geometry, name, description].includes(i) || row[i] === null ? '' : `<Data name="${xml(c)}"><value>${xml(text(row[i]))}</value></Data>`))
        .join('')
      return '<Placemark>' + element('name', name) + element('description', description) +
        (data ? `<ExtendedData>${data}</ExtendedData>` : '') +
        kmlGeometry(parseGeometry(row[geometry])) +
        '</Placemark>'
    })
    parts.push(tables.length > 1 ? `<Folder><name>${xml(t.label ?? t.name)}</name>${placemarks.join('\n')}</Folder>` : placemarks.join('\n'))
  }
  return encoder.encode(
    '<?xml version="1.0" encoding="UTF-8"?>\n<kml xmlns="http://www.opengis.net/kml/2.2"><Document>' +
      `<name>${xml(documentName)}</name>\n${parts.join('\n')}\n</Document></kml>\n`,
  )
}

const text = (value) => (typeof value === 'object' ? JSON.stringify(value) : String(value))
const kmlCoordinates = (points) => `<coordinates>${points.map((p) => p.join(',')).join(' ')}</coordinates>`

// A GeoJSON geometry as KML ('' for none or an empty one). Multi-part
// geometries and collections are a MultiGeometry.
function kmlGeometry(g) {
  if (!g) return ''
  const multi = (geometries) => {
    const inner = geometries.map(kmlGeometry).join('')
    return inner ? `<MultiGeometry>${inner}</MultiGeometry>` : ''
  }
  switch (g.type) {
    case 'Point':
      return g.coordinates.length ? `<Point>${kmlCoordinates([g.coordinates])}</Point>` : ''
    case 'LineString':
      return g.coordinates.length ? `<LineString>${kmlCoordinates(g.coordinates)}</LineString>` : ''
    case 'Polygon': {
      if (!g.coordinates.length) return ''
      const [outer, ...holes] = g.coordinates
      const ring = (r) => `<LinearRing>${kmlCoordinates(r)}</LinearRing>`
      return `<Polygon><outerBoundaryIs>${ring(outer)}</outerBoundaryIs>` +
        holes.map((h) => `<innerBoundaryIs>${ring(h)}</innerBoundaryIs>`).join('') + '</Polygon>'
    }
    case 'MultiPoint':
      return multi(g.coordinates.map((coordinates) => ({ type: 'Point', coordinates })))
    case 'MultiLineString':
      return multi(g.coordinates.map((coordinates) => ({ type: 'LineString', coordinates })))
    case 'MultiPolygon':
      return multi(g.coordinates.map((coordinates) => ({ type: 'Polygon', coordinates })))
    case 'GeometryCollection':
      return multi(g.geometries)
    default:
      return ''
  }
}

// The kind of value each column holds, for a typed file: [{ name, kind,
// select }], kind one of integer, real, boolean, date, text, blob, and
// select how to read it (text for anything else: timestamps, lists).
function attributeColumns(columns, geometry) {
  return columns.filter((c) => c !== geometry).map((c) => {
    const q = quote(c.name)
    const t = c.type.toUpperCase()
    if (isGeometry(c)) return { name: c.name, kind: 'text', select: `ST_AsText(${q})` }
    if (t === 'BOOLEAN') return { name: c.name, kind: 'boolean', select: q }
    if (/^(U?(TINY|SMALL|BIG|HUGE)?INT(EGER)?)$/.test(t)) return { name: c.name, kind: 'integer', select: q }
    if (/^(FLOAT|REAL|DOUBLE|DECIMAL)/.test(t)) return { name: c.name, kind: 'real', select: `CAST(${q} AS DOUBLE)` }
    if (t === 'DATE') return { name: c.name, kind: 'date', select: `strftime(${q}, '%Y-%m-%d')` }
    if (t === 'BLOB') return { name: c.name, kind: 'blob', select: `hex(${q})` }
    return { name: c.name, kind: 'text', select: `CAST(${q} AS VARCHAR)` }
  })
}

// ---- GeoPackage ----

// Each table is a layer (a table without geometry is an attributes table),
// through the SQL engine's SQLite writer (writeSqlite with column types and
// statements). Geometry keeps its CRS: srs_id is the EPSG code, or from
// 100000 for a CRS without one, and -1 ("undefined cartesian") when unknown.
// Each layer's feature count goes in GDAL's gpkg_ogr_contents, kept by
// triggers as GDAL keeps it: DuckDB-wasm's GDAL can't read a GeoPackage
// without it ("thread constructor failed").
export async function writeGeoPackage(sql, tables) {
  if (!sql.writeSqlite) throw new Error("This SQL engine can't write SQLite files, so it can't write GeoPackages.")
  const wgs84 = await crsDefinition(sql, 'EPSG:4326')
  const systems = new Map([
    [-1, ['Undefined cartesian SRS', -1, 'NONE', -1, 'undefined', 'undefined cartesian coordinate reference system']],
    [0, ['Undefined geographic SRS', 0, 'NONE', 0, 'undefined', 'undefined geographic coordinate reference system']],
    [4326, ['WGS 84 geodetic', 4326, 'EPSG', 4326, wgs84.wkt, 'longitude/latitude coordinates in decimal degrees on the WGS 84 spheroid']],
  ])
  const written = []
  const statements = []
  for (const t of tables) {
    const columns = await describe(sql, t.table)
    const geometry = geometryColumn(columns)
    const attributes = attributeColumns(columns, geometry)
    const taken = new Set(attributes.map((a) => a.name.toLowerCase()))
    const fid = ['fid', 'ogc_fid', 'gpkg_fid'].find((name) => !taken.has(name))
    const names = [fid, ...(geometry ? [geometry.name] : []), ...attributes.map((a) => a.name)]
    const types = ['INTEGER PRIMARY KEY AUTOINCREMENT', ...(geometry ? ['GEOMETRY'] : []), ...attributes.map((a) => GPKG_TYPES[a.kind])]

    let srsId = -1
    if (geometry?.crs) {
      const definition = await crsDefinition(sql, geometry.crs)
      const code = Number(definition.auth_code)
      srsId = definition.auth_name === 'EPSG' && Number.isInteger(code) ? code : 100000 + systems.size
      if (!systems.has(srsId)) {
        systems.set(srsId, [definition.name, srsId, definition.auth_name || 'NONE', Number.isInteger(code) ? code : srsId, definition.wkt, ''])
      }
    }

    const g = geometry && quote(geometry.name)
    const selects = [
      ...attributes.map((a) => a.select),
      ...(g ? [`ST_AsHEXWKB(${g})`, `ST_GeometryType(${g})::VARCHAR`, `ST_HasZ(${g})`, `ST_IsEmpty(${g})`,
        `ST_XMin(${g})`, `ST_XMax(${g})`, `ST_YMin(${g})`, `ST_YMax(${g})`] : []),
    ]
    const { rows } = await sql.query(`SELECT ${selects.join(', ') || '1'} FROM ${t.table}`)
    const kinds = new Set()
    const z = new Set()
    const extent = [Infinity, Infinity, -Infinity, -Infinity]
    const out = rows.map((row) => {
      const values = attributes.map((a, i) => attributeValue(a.kind, row[i]))
      if (!g) return [null, ...values]
      const [hex, kind, hasZ, empty, minX, maxX, minY, maxY] = row.slice(attributes.length)
      if (hex === null) return [null, null, ...values]
      kinds.add(kind)
      z.add(Boolean(hasZ))
      const envelope = empty || kind === 'POINT' ? null : [minX, maxX, minY, maxY]
      if (!empty) {
        extent[0] = Math.min(extent[0], minX)
        extent[1] = Math.min(extent[1], minY)
        extent[2] = Math.max(extent[2], maxX)
        extent[3] = Math.max(extent[3], maxY)
      }
      return [null, gpkgGeometry(fromHex(hex), srsId, envelope, Boolean(empty)), ...values]
    })
    written.push({ name: t.name, columns: names, types, rows: out })

    const bounds = Number.isFinite(extent[0]) ? extent : [null, null, null, null]
    statements.push([
      'INSERT INTO gpkg_contents (table_name, data_type, identifier, min_x, min_y, max_x, max_y, srs_id) VALUES (?, ?, ?, ?, ?, ?, ?, ?)',
      [t.name, g ? 'features' : 'attributes', t.name, ...bounds, g ? srsId : null],
    ])
    statements.push(['INSERT INTO gpkg_ogr_contents VALUES (?, ?)', [t.name, out.length]])
    for (const [event, change] of [['insert', '+'], ['delete', '-']]) {
      statements.push(
        `CREATE TRIGGER ${quote(`trigger_${event}_feature_count_${t.name}`)} AFTER ${event.toUpperCase()} ON ${quote(t.name)} ` +
          `BEGIN UPDATE gpkg_ogr_contents SET feature_count = feature_count ${change} 1 ` +
          `WHERE lower(table_name) = lower(${literal(t.name)}); END`,
      )
    }
    if (g) {
      statements.push([
        'INSERT INTO gpkg_geometry_columns VALUES (?, ?, ?, ?, ?, 0)',
        [t.name, geometry.name, kinds.size === 1 ? [...kinds][0] : 'GEOMETRY', srsId, z.size === 2 ? 2 : z.has(true) ? 1 : 0],
      ])
    }
  }
  return sql.writeSqlite(written, {
    statements: [
      'PRAGMA application_id = 1196444487', // "GPKG"
      'PRAGMA user_version = 10400', // GeoPackage 1.4
      ...GPKG_TABLES,
      ...[...systems.values()].map((values) => ['INSERT INTO gpkg_spatial_ref_sys VALUES (?, ?, ?, ?, ?, ?)', values]),
      ...statements,
    ],
  })
}

const GPKG_TYPES = { integer: 'INTEGER', real: 'DOUBLE', boolean: 'BOOLEAN', date: 'DATE', text: 'TEXT', blob: 'BLOB' }

function attributeValue(kind, value) {
  if (value === null || value === undefined) return null
  if (kind === 'boolean') return value ? 1 : 0
  if (kind === 'blob') return fromHex(value)
  if (kind === 'integer' && typeof value === 'string') return value // beyond a double's integers: kept exact as text
  return value
}

// GeoPackage's geometry: its header (magic, version, flags, srs_id, and the
// envelope minx, maxx, miny, maxy unless it's a point or empty), then the
// geometry as ISO WKB, which is what DuckDB writes.
function gpkgGeometry(wkb, srsId, envelope, empty) {
  const header = new DataView(new ArrayBuffer(8 + (envelope ? 32 : 0)))
  header.setUint8(0, 0x47) // G
  header.setUint8(1, 0x50) // P
  header.setUint8(2, 0) // version 1
  header.setUint8(3, 1 | (envelope ? 1 << 1 : 0) | (empty ? 1 << 4 : 0)) // little-endian; envelope type 1; empty
  header.setInt32(4, srsId, true)
  envelope?.forEach((v, i) => header.setFloat64(8 + i * 8, v, true))
  return concat([new Uint8Array(header.buffer), wkb])
}

const GPKG_TABLES = [
  `CREATE TABLE gpkg_spatial_ref_sys (srs_name TEXT NOT NULL, srs_id INTEGER PRIMARY KEY, organization TEXT NOT NULL,
    organization_coordsys_id INTEGER NOT NULL, definition TEXT NOT NULL, description TEXT)`,
  `CREATE TABLE gpkg_contents (table_name TEXT NOT NULL PRIMARY KEY, data_type TEXT NOT NULL, identifier TEXT UNIQUE,
    description TEXT DEFAULT '', last_change DATETIME NOT NULL DEFAULT (strftime('%Y-%m-%dT%H:%M:%fZ','now')),
    min_x DOUBLE, min_y DOUBLE, max_x DOUBLE, max_y DOUBLE, srs_id INTEGER,
    CONSTRAINT fk_gc_r_srs_id FOREIGN KEY (srs_id) REFERENCES gpkg_spatial_ref_sys(srs_id))`,
  `CREATE TABLE gpkg_geometry_columns (table_name TEXT NOT NULL, column_name TEXT NOT NULL, geometry_type_name TEXT NOT NULL,
    srs_id INTEGER NOT NULL, z TINYINT NOT NULL, m TINYINT NOT NULL,
    CONSTRAINT pk_geom_cols PRIMARY KEY (table_name, column_name), CONSTRAINT uk_gc_table_name UNIQUE (table_name),
    CONSTRAINT fk_gc_tn FOREIGN KEY (table_name) REFERENCES gpkg_contents(table_name),
    CONSTRAINT fk_gc_srs FOREIGN KEY (srs_id) REFERENCES gpkg_spatial_ref_sys (srs_id))`,
  'CREATE TABLE gpkg_ogr_contents (table_name TEXT NOT NULL PRIMARY KEY, feature_count INTEGER DEFAULT NULL)',
]

// ---- Shapefiles ----

// A zip of a shapefile per table (.shp, .shx, .dbf, .cpg, and .prj when the
// CRS is known), named by the table, or `baseName` for one. A shapefile holds
// one kind of geometry (points, lines or polygons, single or multi-part) in
// one column; attributes are dBase fields, their names cut to 10 characters,
// text to 254 bytes (UTF-8, as the .cpg says).
export async function writeShapefile(sql, tables, baseName) {
  const files = []
  for (const t of tables) {
    const label = t.label ?? t.name
    const columns = await describe(sql, t.table)
    const geometries = columns.filter(isGeometry)
    if (!geometries.length) throw new Error(`A shapefile needs a geometry column, and ${label} has none.`)
    if (geometries.length > 1) {
      throw new Error(
        `A shapefile holds one geometry column, and ${label} has ${geometries.length} (${geometries.map((c) => c.name).join(', ')}). ` +
          'Leave out the others with a SQLQuery node first.',
      )
    }
    const [geometry] = geometries
    const attributes = attributeColumns(columns, geometry)
    const { rows } = await sql.query(
      `SELECT ${[...attributes.map((a) => a.select), `ST_AsGeoJSON(${quote(geometry.name)})`].join(', ')} FROM ${t.table}`,
    )
    const name = tables.length > 1 ? t.name : baseName
    const shapes = rows.map((row) => parseGeometry(row[attributes.length]))
    const { shp, shx } = shpFiles(shapes, label)
    files.push(
      { name: `${name}.shp`, bytes: shp },
      { name: `${name}.shx`, bytes: shx },
      { name: `${name}.dbf`, bytes: dbfFile(attributes, rows) },
      { name: `${name}.cpg`, bytes: encoder.encode('UTF-8') },
    )
    if (geometry.crs) files.push({ name: `${name}.prj`, bytes: encoder.encode((await crsDefinition(sql, geometry.crs)).wkt) })
  }
  return zip(files)
}

// The shapefile's shape types, by family: [2D, with Z].
const SHAPE_TYPES = { point: [1, 11], multipoint: [8, 18], line: [3, 13], polygon: [5, 15] }
const FAMILIES = {
  Point: 'point', MultiPoint: 'multipoint', LineString: 'line', MultiLineString: 'line', Polygon: 'polygon', MultiPolygon: 'polygon',
}

// Each GeoJSON geometry as parts of points ([x, y, z?]), polygons' rings
// oriented as shapefiles want them (outer clockwise, holes anticlockwise).
function partsOf(g) {
  switch (g.type) {
    case 'Point': return g.coordinates.length ? [[g.coordinates]] : []
    case 'MultiPoint': return [g.coordinates]
    case 'LineString': return g.coordinates.length ? [g.coordinates] : []
    case 'MultiLineString': return g.coordinates
    case 'Polygon': return g.coordinates.map((ring, i) => oriented(ring, i === 0))
    case 'MultiPolygon': return g.coordinates.flatMap((polygon) => polygon.map((ring, i) => oriented(ring, i === 0)))
    default: return []
  }
}

function oriented(ring, outer) {
  let twiceArea = 0
  for (let i = 0; i < ring.length - 1; i++) twiceArea += ring[i][0] * ring[i + 1][1] - ring[i + 1][0] * ring[i][1]
  const clockwise = twiceArea < 0
  return clockwise === outer ? ring : [...ring].reverse()
}

function shpFiles(geometries, label) {
  const families = new Set()
  for (const g of geometries) {
    if (!g) continue
    const family = FAMILIES[g.type]
    if (!family) throw new Error(`A shapefile can't hold a ${g.type}, and ${label} has one.`)
    families.add(family)
  }
  if (families.has('multipoint')) families.delete('point') // single points as one-point multipoints
  if (families.size > 1) {
    const plural = { point: 'points', multipoint: 'points', line: 'lines', polygon: 'polygons' }
    throw new Error(
      `A shapefile holds one kind of geometry, and ${label} has ${[...families].map((f) => plural[f]).join(' and ')}. ` +
        'Split them with SQLQuery nodes first.',
    )
  }
  const family = [...families][0]
  const parts = geometries.map((g) => (g ? partsOf(g) : []))
  const hasZ = parts.some((p) => p.some((part) => part.some((point) => point.length > 2)))
  const shapeType = family ? SHAPE_TYPES[family][hasZ ? 1 : 0] : 0

  const records = parts.map((p) => (p.length ? shapeRecord(shapeType, family, p, hasZ) : nullRecord()))
  const all = parts.flat(2)
  const [xMin, xMax] = range(all, 0)
  const [yMin, yMax] = range(all, 1)
  const [zMin, zMax] = hasZ ? range(all, 2) : [0, 0]

  const shpLength = 100 + records.reduce((sum, r) => sum + 8 + r.length, 0)
  const shxLength = 100 + records.length * 8
  const header = (length) => {
    const view = new DataView(new ArrayBuffer(100))
    view.setInt32(0, 9994) // file code (big-endian)
    view.setInt32(24, length / 2) // in 16-bit words
    view.setInt32(28, 1000, true)
    view.setInt32(32, shapeType, true)
    ;[xMin, yMin, xMax, yMax, zMin, zMax, 0, 0].forEach((v, i) => view.setFloat64(36 + i * 8, v, true))
    return new Uint8Array(view.buffer)
  }
  const shp = [header(shpLength)]
  const shx = [header(shxLength)]
  let offset = 100
  records.forEach((record, i) => {
    const head = new DataView(new ArrayBuffer(8))
    head.setInt32(0, i + 1)
    head.setInt32(4, record.length / 2)
    shp.push(new Uint8Array(head.buffer), record)
    const index = new DataView(new ArrayBuffer(8))
    index.setInt32(0, offset / 2)
    index.setInt32(4, record.length / 2)
    shx.push(new Uint8Array(index.buffer))
    offset += 8 + record.length
  })
  return { shp: concat(shp), shx: concat(shx) }
}

const nullRecord = () => new Uint8Array(4) // shape type 0

// The least and greatest of one axis of points ([0, 0] for none; a missing z
// is 0). A loop, not Math.min(...), which runs out of stack on big shapes.
function range(points, axis) {
  if (!points.length) return [0, 0]
  let min = Infinity
  let max = -Infinity
  for (const p of points) {
    const v = p[axis] ?? 0
    if (v < min) min = v
    if (v > max) max = v
  }
  return [min, max]
}

// One record's content: points as x, y (and z when the file has Z; no M,
// which is optional, except a PointZ's, written as 0).
function shapeRecord(shapeType, family, parts, hasZ) {
  const points = parts.flat()
  if (family === 'point') {
    const [x, y, z = 0] = points[0]
    const view = new DataView(new ArrayBuffer(hasZ ? 36 : 20))
    view.setInt32(0, shapeType, true)
    view.setFloat64(4, x, true)
    view.setFloat64(12, y, true)
    if (hasZ) {
      view.setFloat64(20, z, true)
      view.setFloat64(28, 0, true)
    }
    return new Uint8Array(view.buffer)
  }
  const withParts = family !== 'multipoint'
  const n = points.length
  const size = 4 + 32 + 4 + (withParts ? 4 + 4 * parts.length : 0) + 16 * n + (hasZ ? 16 + 8 * n : 0)
  const view = new DataView(new ArrayBuffer(size))
  let at = 0
  const int = (v) => { view.setInt32(at, v, true); at += 4 }
  const double = (v) => { view.setFloat64(at, v, true); at += 8 }
  int(shapeType)
  const [xMin, xMax] = range(points, 0)
  const [yMin, yMax] = range(points, 1)
  ;[xMin, yMin, xMax, yMax].forEach(double)
  if (withParts) int(parts.length)
  int(n)
  if (withParts) {
    let start = 0
    for (const part of parts) {
      int(start)
      start += part.length
    }
  }
  for (const [x, y] of points) {
    double(x)
    double(y)
  }
  if (hasZ) {
    range(points, 2).forEach(double)
    for (const p of points) double(p[2] ?? 0)
  }
  return new Uint8Array(view.buffer)
}

// ---- dBase (.dbf) ----

// Each value as the bytes of its field (left-aligned text, right-aligned
// numbers), and each field's type, width and decimals.
function dbfFile(attributes, rows) {
  const names = dbfNames(attributes.map((a) => a.name))
  const fields = attributes.map((a, i) => {
    const values = rows.map((row) => row[i])
    const field = { name: names[i], ...dbfField(a.kind, values) }
    field.cells = values.map((v) => field.format(v))
    field.width = Math.min(254, field.cells.reduce((widest, c) => Math.max(widest, c.length), 1))
    return field
  })
  const headerLength = 32 + 32 * fields.length + 1
  const recordLength = 1 + fields.reduce((sum, f) => sum + f.width, 0)
  const out = new Uint8Array(headerLength + recordLength * rows.length + 1)
  const view = new DataView(out.buffer)
  const today = new Date()
  out[0] = 0x03 // dBase III, no memo
  out[1] = today.getFullYear() - 1900
  out[2] = today.getMonth() + 1
  out[3] = today.getDate()
  view.setUint32(4, rows.length, true)
  view.setUint16(8, headerLength, true)
  view.setUint16(10, recordLength, true)
  fields.forEach((f, i) => {
    const at = 32 + i * 32
    out.set(encoder.encode(f.name), at)
    out[at + 11] = f.type.charCodeAt(0)
    out[at + 16] = f.width
    out[at + 17] = f.decimals
  })
  out[headerLength - 1] = 0x0d
  out.fill(0x20, headerLength, out.length - 1)
  rows.forEach((_, r) => {
    let at = headerLength + r * recordLength + 1 // after the deletion flag (a space)
    for (const f of fields) {
      const cell = f.cells[r].subarray(0, f.width)
      out.set(cell, f.right ? at + f.width - cell.length : at)
      at += f.width
    }
  })
  out[out.length - 1] = 0x1a
  return out
}

function dbfField(kind, values) {
  const ascii = (s) => encoder.encode(s)
  switch (kind) {
    case 'integer':
      return { type: 'N', decimals: 0, right: true, format: (v) => ascii(v === null ? '' : String(v)) }
    case 'real':
      return { type: 'N', decimals: 15, right: true, format: (v) => ascii(v === null || !Number.isFinite(v) ? '' : v.toFixed(15)) }
    case 'boolean':
      return { type: 'L', decimals: 0, format: (v) => ascii(v === null ? '?' : v ? 'T' : 'F') }
    case 'date':
      return { type: 'D', decimals: 0, format: (v) => ascii(v === null ? '00000000' : v.replaceAll('-', '')) } // shapelib's null date
    default:
      return { type: 'C', decimals: 0, format: (v) => (v === null ? new Uint8Array(0) : truncated(encoder.encode(String(v)), 254)) }
  }
}

// UTF-8 cut to at most `max` bytes, not mid-character.
function truncated(bytes, max) {
  if (bytes.length <= max) return bytes
  let end = max
  while (end > 0 && (bytes[end] & 0xc0) === 0x80) end--
  return bytes.subarray(0, end)
}

// dBase field names: ASCII letters, digits and _, 10 at most, unique
// ("description" → "descriptio"; a second → "descript_1").
function dbfNames(names) {
  const used = new Set()
  return names.map((name) => {
    const base = name.replace(/[^A-Za-z0-9_]/g, '_').slice(0, 10) || 'field'
    let candidate = base
    for (let n = 1; used.has(candidate.toUpperCase()); n++) candidate = `${base.slice(0, 10 - String(n).length - 1)}_${n}`
    used.add(candidate.toUpperCase())
    return candidate
  })
}
