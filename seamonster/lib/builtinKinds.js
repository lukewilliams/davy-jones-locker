import DataIngestFields from '../components/DataIngestFields.vue'
import ExportInputField from '../components/ExportInputField.vue'
import { FILE_FORMATS, formatFromName, withExtension, writableFormats } from './fileFormats.js'
import { runJavaScript } from './jsSandbox.js'
import { defineNodeKind, toIdentifier } from './kindRegistry.js'
import { copyTo, literal, loadExcel } from './sqlText.js'
import { repairXlsx } from './xlsx.js'

// SEAMONSTER's own node kinds, defined as an app defines its own (see
// kindRegistry.js), in the order the Library and menus list them. Those that
// run do so through `run(ctx)`, whose context and results graphRunner.js
// describes. The rest can't run yet (roadmap steps 9 and 10).

const message = (e) => e?.message ?? String(e)
const connected = (server, method) => server.state === 'connected' && typeof server[method] === 'function'

// ---- Fetch ----

// A SQLQuery node: here, over its inputs, unless it reads tables they don't
// supply; then on the server, over the query database, with its inputs sent.
// Which tables those are is kept on the node (sqlServerTables, worked out in
// flowGraph.js), so it says where it runs before it has.
defineNodeKind({
  kind: 'sql-query',
  label: 'SQLQuery',
  category: 'fetch',
  idPrefix: 'sqlnode',
  outputName: true,
  where: (data) => (data.sqlServerTables?.length ? 'server' : null),
  fields: [
    {
      key: 'sqlQuery', label: 'SQL', type: 'code', language: 'sql', assistant: true,
      placeholder: 'SELECT * FROM upstream_node_data',
      hint: 'DuckDB SQL. A node wired in is a table named by its output, like `sqlnode1_data`, and the query ' +
        'runs here. Read any other table and it runs on the server, over its database (`db`; plain names look ' +
        'in its `public` schema) and the nodes wired in. Ctrl+Enter runs.',
    },
  ],
  async run(ctx) {
    const query = (ctx.node.sqlQuery ?? '').trim().replace(/;+\s*$/, '')
    if (!query) return { error: 'Write a query first.' }
    const table = ctx.table()
    const remote = await ctx.serverTables(query)
    if (!remote.length) {
      await ctx.sql.query(`CREATE TABLE ${table} AS ${query}`)
    } else if (connected(ctx.server, 'query')) {
      await ctx.loadParquet(table, await ctx.server.query({ sql: query, inputs: await ctx.parquet() }))
    } else {
      const which = remote.length === 1 ? `${remote[0]}, which isn't` : `${remote.join(', ')}, which aren't`
      return { error: `This query reads ${which} wired in, so it runs on the server, which isn't available.` }
    }
    return { table }
  },
})
defineNodeKind({ kind: '3d-asset', label: '3D Asset', category: 'fetch', idPrefix: 'asset' })
defineNodeKind({ kind: 'http-request', label: 'HTTP Request', category: 'fetch', idPrefix: 'httprequest' })

// ---- Modify ----

// A PythonScript node, run by the server in its sandbox. The last
// expression's value is its output: a DataFrame as its table, anything else
// shown as a value (with an empty table downstream).
defineNodeKind({
  kind: 'python-script',
  label: 'PythonScript',
  category: 'modify',
  idPrefix: 'pythonscript',
  outputName: true,
  where: 'server',
  fields: [
    {
      key: 'pythonCode', label: 'Python', type: 'code', language: 'python', assistant: true,
      placeholder: "upstream_node_data.groupby('region').sum()",
      hint: 'Each node wired in is a pandas DataFrame named by its output, like `sqlnode1_data` (several tables: ' +
        "`dataingest1_data.sheet1`). The last line's value is this node's output: a DataFrame as its table, " +
        'anything else shown as a value. `print` shows in the Terminal; `sleep(seconds)` waits. Ctrl+Enter runs.',
    },
  ],
  async run(ctx) {
    if (!connected(ctx.server, 'runPython')) {
      return { error: "PythonScript nodes run on the server, which isn't available. Every other kind runs here in the browser." }
    }
    const code = ctx.node.pythonCode ?? ''
    if (!code.trim()) return { error: 'Write some code first.' }
    const result = await ctx.server.runPython({ code, inputs: await ctx.parquet() })
    const output = result.output ?? ''
    if (result.error) return { error: result.error, output }
    const extra = { output, variables: result.variables ?? [] }
    if (!result.table) return { value: result.value ?? { kind: 'none' }, ...extra }
    const table = ctx.table()
    await ctx.loadParquet(table, result.table)
    return { table, ...extra }
  },
})

// A JavaScript node: its code runs in the sandbox (jsSandbox.js) with each
// wired-in node as a variable named by its reference name. Returning an
// array of rows makes its table; returning nothing makes an empty one (what
// it printed is its output). Never on the server, until it has safeguards.
defineNodeKind({
  kind: 'javascript',
  label: 'JavaScript',
  category: 'modify',
  idPrefix: 'javascript',
  outputName: true,
  where: 'browser',
  fields: [
    {
      key: 'jsCode', label: 'JavaScript', type: 'code', language: 'javascript', assistant: true,
      placeholder: 'return upstream_node_data.filter((row) => row.amount > 10)',
      hint: 'Each node wired in is a variable named by its output, like `sqlnode1_data`: an array of rows ' +
        '(objects), or an object of them for several tables (`dataingest1_data.sheet1`). Return an array of rows ' +
        'to output a table. `console.log` and `print` show in the Terminal; `await sleep(seconds)` waits. Runs in ' +
        'a sandbox in this browser, with no access to this page, and stops after 30 seconds. Ctrl+Enter runs.',
    },
  ],
  async run(ctx) {
    const code = ctx.node.jsCode ?? ''
    if (!code.trim()) return { error: 'Write some code first.' }
    const inputs = {}
    for (const input of ctx.inputs) inputs[input.ref] = await ctx.rows(input)

    let value
    let logs
    try {
      ;({ value, logs } = await runJavaScript(code, inputs))
    } catch (e) {
      return { error: message(e), output: (e.logs ?? []).join('\n') }
    }
    const output = logs.join('\n')
    if (value === undefined) return { output }
    if (!Array.isArray(value)) {
      return { error: 'Return an array of rows (objects, one per row) to output a table, or return nothing.', output }
    }
    const table = ctx.table()
    await ctx.loadRows(table, value.map((row) => (row !== null && typeof row === 'object' && !Array.isArray(row) ? row : { value: row })))
    return { table, output }
  },
})
defineNodeKind({ kind: 'geometry-script', label: 'GeometryScript', category: 'modify', idPrefix: 'geoscript' })
defineNodeKind({ kind: 'hlsl', label: 'HLSL', category: 'modify', idPrefix: 'hlsl' })
defineNodeKind({ kind: 'network-fuse', label: 'Network Fuse', category: 'modify', idPrefix: 'networkfuse', runs: true })

// ---- Debug ----

defineNodeKind({ kind: 'debug', label: 'Debug', category: 'debug', idPrefix: 'debug' })

// ---- Import ----

// A DataIngest node's tables were read from its file when it was chosen (the
// runner's readFile) and stored as Parquet; this loads them.
defineNodeKind({
  kind: 'data-ingest',
  label: 'DataIngest',
  category: 'import',
  idPrefix: 'dataingest',
  outputName: true,
  fields: [{ type: 'custom', component: DataIngestFields }],
  canRun: (data) => (data.ingest ? null : 'Choose a file first.'),
  async run(ctx) {
    const ingest = ctx.node.ingest
    if (!ingest) return { error: 'Choose a file first.' }
    const tables = []
    for (const stored of ingest.tables) {
      const bytes = await ctx.getFile(stored.key)
      if (!bytes) return { error: `The data read from "${ingest.fileName}" isn't stored any more. Choose the file again.` }
      const table = ctx.table(stored.name)
      await ctx.loadParquet(table, bytes)
      tables.push({ name: stored.name, label: stored.label, table })
    }
    return FILE_FORMATS[ingest.format].multi ? { tables } : { table: tables[0].table }
  },
})
defineNodeKind({ kind: 'dxf-import', label: 'DXF Import', category: 'import', idPrefix: 'dxfimport', runs: true })

// ---- Export ----

// Write a node wired in to a file, and pass its data on unchanged. With one
// wired in, that one; with several, the one named by `exportInput`.
defineNodeKind({
  kind: 'data-export',
  label: 'DataExport',
  category: 'export',
  idPrefix: 'dataexport',
  fields: [
    { type: 'custom', component: ExportInputField },
    {
      key: 'exportFilename', label: 'Filename', type: 'text', placeholder: 'export',
      hint: (data, typed) => {
        const name = typed || 'export'
        return `Saves as ${withExtension(name, data.exportFormat || formatFromName(name) || 'csv')}`
      },
    },
    {
      key: 'exportFormat', label: 'File Type', type: 'select',
      options: [
        { value: '', label: 'From file name (CSV if none)' },
        ...writableFormats.map((f) => ({ value: f, label: FILE_FORMATS[f].label })),
      ],
    },
  ],
  runHint: "Writes whatever's wired into this node on Run. Downloads to your computer immediately; errors show in the Terminal panel.",
  async run(ctx) {
    const picked = pickExportInput(ctx.node, ctx.inputs)
    if (picked.error) return picked
    const { input, tables } = picked
    const typed = (ctx.node.exportFilename ?? '').trim() || 'export'
    const format = ctx.node.exportFormat || formatFromName(typed) || 'csv'
    const filename = withExtension(typed, format)
    const spec = FILE_FORMATS[format]
    const written = tables ?? [{ name: toIdentifier(input.id) || 'data', table: picked.table }]
    if (written.length > 1 && spec.multi !== 'read-write') {
      return {
        error: `${spec.label} holds one table, and ${input.id} has ${written.length}. ` +
          'Put a SQLQuery node in between to pick one.',
      }
    }
    const bytes = await writeFile(ctx.sql, format, written, filename)
    return {
      ...(tables ? { tables } : { table: picked.table }),
      export: { filename, contentType: spec.contentType, size: bytes.length, bytes },
    }
  },
})

// The input a DataExport node writes: its only one, or the one `exportInput`
// names, by reference name (sqlnode1_data) or ID; <name>.<table> picks one
// table of several. Returns { input, table } or { input, tables }, or { error }.
function pickExportInput(node, inputs) {
  if (!inputs.length) return { error: 'Wire a node into this one to export its data.' }
  const names = inputs.map((i) => i.ref)
  const choice = (node.exportInput ?? '').trim()
  const whole = (input) => (input.tables ? { input, tables: input.tables } : { input, table: input.table })
  if (!choice) {
    if (inputs.length > 1) {
      return { error: `${inputs.length} inputs are wired in (${names.join(', ')}). Name the one to write under Input.` }
    }
    return whole(inputs[0])
  }
  const byName = (name) => inputs.find((i) => i.ref === name || i.id === name)
  // The whole of it as a name first: an ID typed into Manage can hold a dot.
  let input = byName(choice)
  let tableName = null
  if (!input && choice.includes('.')) {
    input = byName(choice.slice(0, choice.lastIndexOf('.')))
    tableName = choice.slice(choice.lastIndexOf('.') + 1)
  }
  if (!input) return { error: `No input called "${choice}" is wired in. Wired in: ${names.join(', ')}.` }
  if (!tableName) return whole(input)
  const table = input.tables?.find((t) => t.name === tableName)
  if (!table) {
    const has = input.tables ? `its tables are ${input.tables.map((t) => t.name).join(', ')}` : 'it has one table'
    return { error: `${input.id} has no table called "${tableName}": ${has}.` }
  }
  return { input, table: table.table }
}

async function writeFile(sql, format, tables, filename) {
  const all = async (table) => sql.query(`SELECT * FROM ${table}`)
  if (format === 'geojson') return new TextEncoder().encode(JSON.stringify(toGeoJson(await all(tables[0].table))))
  if (format === 'sqlite') {
    if (!sql.writeSqlite) throw new Error("This SQL engine can't write SQLite files.")
    return sql.writeSqlite(await Promise.all(tables.map(async (t) => ({ name: t.name, ...(await all(t.table)) }))))
  }
  const options = {
    csv: 'FORMAT csv, HEADER',
    tsv: "FORMAT csv, DELIMITER '\t', HEADER",
    json: 'FORMAT json, ARRAY true',
    parquet: 'FORMAT parquet',
    xlsx: 'FORMAT xlsx, HEADER true',
  }[format]
  if (format === 'xlsx') await loadExcel(sql)
  const path = `flow-export-${Date.now()}-${filename}`
  await copyTo(sql, `SELECT * FROM ${tables[0].table}`, path, options)
  try {
    const bytes = await sql.readFile(path)
    return format === 'xlsx' ? repairXlsx(bytes) : bytes
  } finally {
    await sql.dropFile(path)
  }
}

// Rows with a `geometry` column of GeoJSON text (as DataIngest reads a
// .geojson file) as a FeatureCollection; the other columns are properties.
function toGeoJson({ columns, rows }) {
  const g = columns.findIndex((c) => c.toLowerCase() === 'geometry')
  if (g < 0) throw new Error('GeoJSON needs a geometry column of GeoJSON text, like a .geojson file read by DataIngest has.')
  return {
    type: 'FeatureCollection',
    features: rows.map((row) => ({
      type: 'Feature',
      geometry: typeof row[g] === 'string' ? JSON.parse(row[g]) : row[g],
      properties: Object.fromEntries(columns.flatMap((c, i) => (i === g ? [] : [[c, row[i]]]))),
    })),
  }
}

// ---- Custom ----

defineNodeKind({ kind: 'subnet', label: 'Subnet', category: 'custom', idPrefix: 'subnet', runs: true })
