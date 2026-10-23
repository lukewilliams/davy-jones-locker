import DataIngestFields from '../components/DataIngestFields.vue'
import ExportInputField from '../components/ExportInputField.vue'
import { FILE_FORMATS, formatFromName, hasTables, withExtension, writableFormats } from './fileFormats.js'
import { crsOfType, writeGeoJson, writeGeoPackage, writeKml, writeShapefile } from './geoExport.js'
import { lonLatExportWarnings } from './spatialChecks.js'
import { runJavaScript } from './jsSandbox.js'
import { defineNodeKind, toIdentifier, whereItRuns } from './kindRegistry.js'
import { copyTo, fromHex, loadExcel, quote } from './sqlText.js'
import { repairXlsx } from './xlsx.js'
import { boundaryPins, LOOP, LOOP_ITEM, LOOP_STATUS, newSubnetGraph, SUBNET, SUBNET_INPUT, SUBNET_OUTPUT, subnetFace } from './subnets.js'
import SubnetFields from '../components/SubnetFields.vue'

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
  description: "Queries the nodes wired in with DuckDB SQL, here in the browser, or on the server when it reads the server's own tables.",
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
    const warnings = await ctx.spatialWarnings(query)
    return { table, ...(warnings.length ? { warnings } : {}) }
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
  description: 'Runs Python on the server, in its sandbox, with each node wired in as a pandas DataFrame. Its last expression is its output.',
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
  description: 'Runs JavaScript here in the browser, in a sandbox, with each node wired in as an array of rows. What it returns is its output.',
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
  description: "Reads a file (CSV, Excel, Parquet, JSON, SQLite, or a geo file) into tables, once when it's chosen.",
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
    return hasTables(ingest) ? { tables } : { table: tables[0].table }
  },
})
defineNodeKind({ kind: 'dxf-import', label: 'DXF Import', category: 'import', idPrefix: 'dxfimport', runs: true })

// ---- Export ----

// Write a node wired in to a file, and pass its data on unchanged. With one
// wired in, that one; with several, the one named by `exportInput`.
defineNodeKind({
  kind: 'data-export',
  label: 'DataExport',
  description: "Writes what's wired in to a file, which downloads when it runs, and passes it on unchanged.",
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
    if (written.length > 1 && !spec.writeTables) {
      return {
        error: `${spec.label} holds one table, and ${input.id} has ${written.length}. ` +
          'Put a SQLQuery node in between to pick one.',
      }
    }
    // Parquet through the runner, which keeps a table's GeoParquet metadata.
    const bytes = format === 'parquet' ? await ctx.parquetOf(written[0].table) : await writeFile(ctx.sql, format, written, filename)
    const warnings = format === 'geojson' || format === 'kml' ? await lonLatExportWarnings(ctx.sql, written, spec.label) : []
    return {
      ...(tables ? { tables } : { table: picked.table }),
      export: { filename, contentType: spec.contentType, size: bytes.length, bytes },
      ...(warnings.length ? { warnings } : {}),
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
  const baseName = filename.replace(/\.[^.]*$/, '') || 'export'
  if (format === 'geojson') return writeGeoJson(sql, tables[0].table)
  if (format === 'kml') return writeKml(sql, tables, baseName)
  if (format === 'gpkg') return writeGeoPackage(sql, tables)
  if (format === 'shapefile') return writeShapefile(sql, tables, baseName)
  if (format === 'sqlite') {
    if (!sql.writeSqlite) throw new Error("This SQL engine can't write SQLite files.")
    const written = []
    for (const t of tables) written.push(await sqliteTable(sql, t))
    return sql.writeSqlite(written)
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

// A table's rows for SQLite: geometry as WKT (as CSV and Excel write it),
// and blobs as bytes, which writeSqlite stores as blobs.
async function sqliteTable(sql, { name, table }) {
  const described = (await sql.query(`DESCRIBE SELECT * FROM ${table}`)).rows.map(([column, type]) => ({
    column,
    geometry: crsOfType(type) !== undefined,
    blob: String(type) === 'BLOB',
  }))
  const exprs = described.map(({ column, geometry, blob }) => {
    const c = quote(column)
    return geometry ? `ST_AsText(${c}) AS ${c}` : blob ? `hex(${c}) AS ${c}` : c
  })
  const { columns, rows } = await sql.query(`SELECT ${exprs.join(', ')} FROM ${table}`)
  return {
    name,
    columns,
    rows: rows.map((row) => row.map((v, i) => (described[i].blob && v !== null ? fromHex(v) : v))),
  }
}

// ---- Custom ----

// A Subnet node: a graph of its own, run as one node (see subnets.js). Its
// pins are its graph's Input and Output nodes, kept on the node as
// `subnetPins` (and its first slot's name as `outputSuffix`) by the graph
// store whenever the graph changes. The runner runs its graph (ctx.runSubnet).
defineNodeKind({
  kind: SUBNET,
  label: 'Subnet',
  description: 'A graph of its own, run as one node: what\'s wired into it comes out of its Input nodes, and its Output nodes are its outputs. Double-click it to open it.',
  category: 'custom',
  idPrefix: 'subnet',
  mainInput: false,
  inputPins: (data) => (data.subnetPins?.inputs ?? []).map((name) => ({ name, label: name })),
  slots: (data) => (data.subnetPins?.outputs ?? []).slice(1).map((name) => ({ name, pin: true })),
  fields: [{ type: 'custom', component: SubnetFields }],
  create: () => {
    const graph = newSubnetGraph()
    return { subnet: graph, ...subnetFace(boundaryPins(graph)) }
  },
  run: (ctx) => ctx.runSubnet(),
})

// A Loop node: a subnet run once per row of what's wired into its `item` pin
// (shown as "items"), the Input node `item` putting out that run's row; its
// other Inputs put out the same table every run. Each Output is gathered
// across the runs, with each run's `_key` and `_iteration` first, and
// `status` says how each run went. It runs in the browser, one run at a time,
// unless something inside runs only on the server: then the server runs it
// all, as a job (graphRunner's runLoop).
defineNodeKind({
  kind: LOOP,
  label: 'Loop',
  description: "Runs a graph of its own once per row of what's wired into items, and gathers each output across the runs, with a status output saying how each run went. Double-click it to open it.",
  category: 'custom',
  idPrefix: 'loop',
  mainInput: false,
  // Where it runs, as far as its own graph says (a shared one, or a subnet
  // inside naming one, is worked out when it runs).
  where: (data) => (serverInside(data.subnet) ? 'server' : null),
  inputPins: (data) =>
    (data.subnetPins?.inputs ?? []).map((name) =>
      name === LOOP_ITEM
        ? { name, label: 'items', hint: 'A run per row: inside, the Input node item puts out that row.', required: true }
        : { name, label: name, hint: 'The same table every run.' },
    ),
  slots: (data) => [
    ...(data.subnetPins?.outputs ?? []).slice(1).map((name) => ({ name, pin: true })),
    { name: LOOP_STATUS, pin: true },
  ],
  fields: [
    { type: 'custom', component: SubnetFields },
    {
      key: 'loopKey', label: 'Key column', type: 'text', mono: true, placeholder: 'row number',
      hint: "Each run's _key in the outputs: this column of its row, or its row number.",
    },
    {
      key: 'loopOnError', label: 'When a run fails', type: 'select', default: 'continue',
      options: [{ value: 'continue', label: 'Carry on with the rest' }, { value: 'stop', label: 'Stop the loop' }],
    },
    {
      key: 'loopMax', label: 'Most runs', type: 'number', min: 1, step: 1, default: 1000,
      hint: 'Rows past this many aren\'t run (a warning says so).',
      validate: [{ min: 1, message: 'At least 1.' }],
    },
    {
      key: 'loopConcurrency', label: 'Runs at once', type: 'number', min: 1, step: 1, default: 1,
      hint: 'On the server only: in the browser it runs one at a time. Python inside runs one at a time whatever this says.',
      validate: [{ min: 1, message: 'At least 1.' }],
    },
  ],
  create: () => {
    const graph = newSubnetGraph(LOOP_ITEM)
    return { subnet: graph, ...subnetFace(boundaryPins(graph)) }
  },
  run: (ctx) => ctx.runLoop(),
})

// Whether anything in a graph (its inline subnets' too) runs only on the server.
function serverInside(graph) {
  return (graph?.nodes ?? []).some((n) => whereItRuns(n) === 'server' || serverInside(n.subnet))
}

// ---- Inside a subnet (the Library and menus offer these only there) ----

// One of its subnet's inputs: the subnet node's pin of this node's ID, and
// what's wired into that pin comes out here (its first slot, as one wire
// from a main pin carries).
defineNodeKind({
  kind: SUBNET_INPUT,
  label: 'Input',
  description: "One of its subnet's inputs: the subnet node has an input pin named by this node's ID, and what's wired into that pin comes out here.",
  category: 'boundary',
  idPrefix: 'input',
  mainInput: false,
  run: (ctx) => ctx.boundInput ?? { error: 'Input nodes work only inside a subnet: open a subnet (double-click it) and add them there.' },
})

// One of its subnet's outputs, named by this node's ID: what's wired into it
// (one wire) comes out of the subnet. The topmost Output is its first slot.
defineNodeKind({
  kind: SUBNET_OUTPUT,
  label: 'Output',
  description: "One of its subnet's outputs, named by this node's ID: what's wired into it comes out of the subnet. The topmost Output is the subnet's first output; others get pins of their own.",
  category: 'boundary',
  idPrefix: 'output',
  mainInput: 'one',
  mainOutput: false,
  run: (ctx) => {
    const input = ctx.inputs[0]
    if (!input) return { error: 'Wire a node into this Output.' }
    return input.tables ? { tables: input.tables } : { table: input.table }
  },
})
