// File formats DataIngest reads and DataExport writes. All tabular for now: a
// file is one table, or several for `multi` formats (a workbook's sheets, a
// database's tables).
//
// read / write: whether DataIngest / DataExport handle it. extensions: the
// first is added to an export's filename when it has none of them.
export const FILE_FORMATS = {
  csv: { label: 'CSV', extensions: ['csv'], contentType: 'text/csv', read: true, write: true },
  tsv: { label: 'TSV', extensions: ['tsv', 'tab'], contentType: 'text/tab-separated-values', read: true, write: true },
  json: { label: 'JSON', extensions: ['json'], contentType: 'application/json', read: true, write: true },
  geojson: { label: 'GeoJSON', extensions: ['geojson'], contentType: 'application/geo+json', read: true, write: true },
  parquet: { label: 'Parquet', extensions: ['parquet'], contentType: 'application/vnd.apache.parquet', read: true, write: true },
  // Reads every sheet; writes one (DuckDB's excel extension writes a single sheet).
  xlsx: {
    label: 'Excel (.xlsx)', extensions: ['xlsx'],
    contentType: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
    read: true, write: true, multi: 'read',
  },
  sqlite: {
    label: 'SQLite', extensions: ['sqlite', 'sqlite3', 'db'], contentType: 'application/vnd.sqlite3',
    read: true, write: true, multi: 'read-write',
  },
}

export const readableFormats = Object.keys(FILE_FORMATS).filter((f) => FILE_FORMATS[f].read)
export const writableFormats = Object.keys(FILE_FORMATS).filter((f) => FILE_FORMATS[f].write)

// For a file input's `accept`.
export const READABLE_EXTENSIONS = readableFormats
  .flatMap((f) => FILE_FORMATS[f].extensions)
  .map((ext) => `.${ext}`)
  .join(',')

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
