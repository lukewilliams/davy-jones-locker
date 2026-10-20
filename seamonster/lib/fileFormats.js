// File formats DataIngest reads and DataExport writes. A file is one table, or
// several for `multi` formats (a workbook's sheets, a database's tables), or
// for `multi: 'layers'` formats, one per layer when it has several (a KML's
// folders, a GeoPackage's layers) and a plain table when it has one.
//
// read / write: whether DataIngest / DataExport handle it. writeTables:
// DataExport writes every table of its input (others write one). extensions:
// the first is added to an export's filename when it has none of them. geo:
// read with DuckDB's spatial extension (ST_Read), each geometry a GEOMETRY
// column with its CRS; written by geoExport.js.
export const FILE_FORMATS = {
  csv: { label: 'CSV', extensions: ['csv'], contentType: 'text/csv', read: true, write: true },
  tsv: { label: 'TSV', extensions: ['tsv', 'tab'], contentType: 'text/tab-separated-values', read: true, write: true },
  json: { label: 'JSON', extensions: ['json'], contentType: 'application/json', read: true, write: true },
  geojson: {
    label: 'GeoJSON', extensions: ['geojson'], contentType: 'application/geo+json',
    read: true, write: true, geo: true, multi: 'layers',
  },
  kml: {
    label: 'KML', extensions: ['kml'], contentType: 'application/vnd.google-earth.kml+xml',
    read: true, write: true, writeTables: true, geo: true, multi: 'layers',
  },
  // A zip holding one or more shapefiles (.shp, .shx, .dbf, and .prj for the CRS).
  shapefile: {
    label: 'Shapefile (.zip)', extensions: ['zip'], contentType: 'application/zip',
    read: true, write: true, writeTables: true, geo: true, multi: 'layers',
  },
  gpkg: {
    label: 'GeoPackage', extensions: ['gpkg'], contentType: 'application/geopackage+sqlite3',
    read: true, write: true, writeTables: true, geo: true, multi: 'layers',
  },
  fgb: {
    label: 'FlatGeobuf', extensions: ['fgb'], contentType: 'application/flatgeobuf',
    read: true, write: false, geo: true, multi: 'layers',
  },
  parquet: { label: 'Parquet', extensions: ['parquet'], contentType: 'application/vnd.apache.parquet', read: true, write: true },
  // Reads every sheet; writes one (DuckDB's excel extension writes a single sheet).
  xlsx: {
    label: 'Excel (.xlsx)', extensions: ['xlsx'],
    contentType: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
    read: true, write: true, multi: 'read',
  },
  sqlite: {
    label: 'SQLite', extensions: ['sqlite', 'sqlite3', 'db'], contentType: 'application/vnd.sqlite3',
    read: true, write: true, writeTables: true, multi: 'read-write',
  },
}

export const readableFormats = Object.keys(FILE_FORMATS).filter((f) => FILE_FORMATS[f].read)
export const writableFormats = Object.keys(FILE_FORMATS).filter((f) => FILE_FORMATS[f].write)

// For a file input's `accept`.
export const READABLE_EXTENSIONS = readableFormats
  .flatMap((f) => FILE_FORMATS[f].extensions)
  .map((ext) => `.${ext}`)
  .join(',')

// Whether a DataIngest node's data (its `ingest`) is several tables, each read
// as <reference name>.<table>, rather than one.
export function hasTables(ingest) {
  const multi = FILE_FORMATS[ingest.format]?.multi
  return multi === 'layers' ? ingest.tables.length > 1 : !!multi
}

const extensionOf = (name) => /\.([^./\\]+)$/.exec(name)?.[1].toLowerCase() ?? ''

// The format a filename's extension names, or null.
export function formatFromName(name) {
  const ext = extensionOf(name)
  return Object.keys(FILE_FORMATS).find((f) => FILE_FORMATS[f].extensions.includes(ext)) ?? null
}

// `name`, with the format's extension added unless it already has one of them
// ("ducks" -> "ducks.csv"; "ducks.csv" stays; "ducks.csv" as Parquet ->
// "ducks.csv.parquet").
export function withExtension(name, format) {
  const { extensions } = FILE_FORMATS[format]
  return extensions.includes(extensionOf(name)) ? name : `${name}.${extensions[0]}`
}

// A filename as a name for its node: no extension, and _, - and runs of
// spaces as single spaces ("sales_2024.csv" -> "sales 2024").
export const nameFromFile = (filename) =>
  filename.replace(/\.[^.]*$/, '').replace(/[_\-\s]+/g, ' ').trim()

export function formatSize(bytes) {
  if (bytes < 1024) return `${bytes} B`
  const units = ['KB', 'MB', 'GB']
  let n = bytes
  let unit = -1
  while (n >= 1024 && unit < units.length - 1) {
    n /= 1024
    unit++
  }
  return `${n < 10 ? n.toFixed(1) : Math.round(n)} ${units[unit]}`
}
