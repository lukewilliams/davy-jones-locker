// The SQL engine for FlowgraphEditor: DuckDB-wasm, with SQLite
// files through sql.js, both loaded from jsDelivr when first needed (tens of
// MB, cached by the browser after that). FlowgraphEditor takes anything with this
// shape (see seamonster's lib/graphRunner.js):
//
//   query(sql) -> Promise<{ columns: string[], rows: any[][] }>
//   registerFile(name, bytes), readFile(name) -> Promise<Uint8Array>, dropFile(name)
//   readSqlite(bytes) -> Promise<[{ name, columns, rows }]>
//   writeSqlite([{ name, columns, rows }]) -> Promise<Uint8Array>
//
// with plain values in the rows: numbers, strings, booleans, null, and arrays
// or objects of those.

const DUCKDB_VERSION = '1.32.0'
const DUCKDB_URL = `https://cdn.jsdelivr.net/npm/@duckdb/duckdb-wasm@${DUCKDB_VERSION}/+esm`
const SQLJS_VERSION = '1.13.0'
const SQLJS_URL = `https://cdn.jsdelivr.net/npm/sql.js@${SQLJS_VERSION}`

// A load that failed (offline, say) is tried again next time.
function once(load) {
  let loading = null
  return () => {
    loading ??= load()
    loading.catch(() => (loading = null))
    return loading
  }
}

const duckdb = once(async () => {
  const lib = await import(/* @vite-ignore */ DUCKDB_URL)
  const bundle = await lib.selectBundle(lib.getJsDelivrBundles())
  // The worker script is cross-origin, so it's started from a same-origin blob.
  const workerUrl = URL.createObjectURL(
    new Blob([`importScripts("${bundle.mainWorker}");`], { type: 'text/javascript' }),
  )
  const db = new lib.AsyncDuckDB(new lib.VoidLogger(), new Worker(workerUrl))
  await db.instantiate(bundle.mainModule, bundle.pthreadWorker)
  URL.revokeObjectURL(workerUrl)
  return { db, conn: await db.connect() }
})

const sqlite = once(async () => {
  const lib = await import(/* @vite-ignore */ `${SQLJS_URL}/+esm`)
  return (lib.default ?? lib)({ locateFile: (file) => `${SQLJS_URL}/dist/${file}` })
})

// Arrow values as plain ones, by column type.
function plain(value, type) {
  if (value === null || value === undefined) return null
  const kind = String(type)
  if (kind.startsWith('Decimal')) return decimal(String(value), type.scale)
  if (kind.startsWith('Date')) return new Date(value).toISOString().slice(0, 10)
  if (kind.startsWith('Timestamp')) return new Date(value).toISOString().replace('T', ' ').replace(/\.000Z|Z/, '')
  return untyped(value)
}

// Decimals arrive unscaled (1.50 as 150).
function decimal(digits, scale) {
  if (!scale) return digits
  const negative = digits.startsWith('-')
  const d = (negative ? digits.slice(1) : digits).padStart(scale + 1, '0')
  return `${negative ? '-' : ''}${d.slice(0, -scale)}.${d.slice(-scale)}`
}

function untyped(value) {
  if (typeof value === 'bigint') return Number.isSafeInteger(Number(value)) ? Number(value) : String(value)
  if (value === null || typeof value !== 'object') return value
  if (typeof value.toJSON === 'function') return untyped(value.toJSON()) // lists, structs, maps
  if (Array.isArray(value) || ArrayBuffer.isView(value)) return Array.from(value, untyped)
  return Object.fromEntries(Object.entries(value).map(([k, v]) => [k, untyped(v)]))
}

const hex = (bytes) => `\\x${Array.from(bytes, (b) => b.toString(16).padStart(2, '0')).join('')}`
const quote = (name) => `"${name.replaceAll('"', '""')}"`

export const duckdbSql = {
  async query(sql) {
    const { conn } = await duckdb()
    const table = await conn.query(sql)
    const fields = table.schema.fields
    const columns = fields.map((f, i) => ({ vector: table.getChildAt(i), type: f.type }))
    const rows = []
    for (let r = 0; r < table.numRows; r++) rows.push(columns.map((c) => plain(c.vector.get(r), c.type)))
    return { columns: fields.map((f) => f.name), rows }
  },

  // A copy: DuckDB-wasm hands the buffer to its worker, which would leave the
  // caller's bytes empty (the editor keeps them to register again next run).
  async registerFile(name, bytes) {
    const { db } = await duckdb()
    await db.registerFileBuffer(name, bytes.slice())
  },

  async readFile(name) {
    const { db } = await duckdb()
    return db.copyFileToBuffer(name)
  },

  async dropFile(name) {
    const { db } = await duckdb()
    await db.dropFile(name)
  },

  // Every table in a SQLite database. Blobs come out as \x.. hex text.
  async readSqlite(bytes) {
    const SQL = await sqlite()
    const db = new SQL.Database(bytes)
    try {
      const names = db.exec("SELECT name FROM sqlite_master WHERE type = 'table' AND name NOT LIKE 'sqlite_%' ORDER BY rowid")
      return (names[0]?.values ?? []).map(([name]) => {
        const columns = (db.exec(`PRAGMA table_info(${quote(name)})`)[0]?.values ?? []).map((c) => c[1])
        const rows = (db.exec(`SELECT * FROM ${quote(name)}`)[0]?.values ?? []).map((row) =>
          row.map((v) => (v instanceof Uint8Array ? hex(v) : v)),
        )
        return { name, columns, rows }
      })
    } finally {
      db.close()
    }
  },

  // A SQLite database of these tables. Columns are untyped (SQLite keeps each
  // value's own type); lists and structs are stored as JSON text.
  async writeSqlite(tables) {
    const SQL = await sqlite()
    const db = new SQL.Database()
    try {
      for (const { name, columns, rows } of tables) {
        db.run(`CREATE TABLE ${quote(name)} (${columns.map(quote).join(', ')})`)
        const insert = db.prepare(`INSERT INTO ${quote(name)} VALUES (${columns.map(() => '?').join(', ')})`)
        for (const row of rows) {
          insert.run(row.map((v) => (typeof v === 'boolean' ? Number(v) : v !== null && typeof v === 'object' ? JSON.stringify(v) : v)))
        }
        insert.free()
      }
      return db.export()
    } finally {
      db.close()
    }
  },
}
