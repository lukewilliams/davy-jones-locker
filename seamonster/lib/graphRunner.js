import { FILE_FORMATS } from './fileFormats.js'
import { checkNode, isKnownKind, kindInfo, NODE_KINDS, referenceName, slotsOf, slotsThrough, toIdentifier, uniqueId, withDefaults } from './nodeKinds.js'
import { copyTo, literal, loadExcel, quote } from './sqlText.js'
import { xlsxSheetNames } from './xlsx.js'

// Rows per page of a node's output in the Data panel.
export const PAGE_SIZE = 100

// Each run's outputs are tables in OUTPUTS, out of the queries' sight. While a
// node runs, INPUTS holds a view per node wired into it, named by that node's
// reference name, and the search path finds those (then main), so a query sees
// its inputs and nothing else. A node that outputs several tables (a workbook's
// sheets) is wired in as a schema of that name instead, one view per table:
// dataingest1_data.sheet1.
const OUTPUTS = 'flow_out'
const INPUTS = 'flow_in'

// A query reading these stays local (DuckDB's own catalogs and schemas).
const LOCAL_CATALOGS = new Set(['memory', 'system', 'temp'])
const LOCAL_SCHEMAS = new Set(['information_schema', 'pg_catalog'])

const message = (e) => e?.message ?? String(e)

function walk(value, visit) {
  if (Array.isArray(value)) value.forEach((v) => walk(v, visit))
  else if (value && typeof value === 'object') {
    visit(value)
    Object.values(value).forEach((v) => walk(v, visit))
  }
}

/*
 * Runs nodes in the browser, on the SQL engine the host app supplies (DuckDB
 * SQL; davy-jones-locker's is DuckDB-wasm):
 *
 *   query(sql)               -> Promise<{ columns: string[], rows: any[][] }>
 *   registerFile(name, bytes), readFile(name) -> Promise<Uint8Array>, dropFile(name)
 *                               files the engine's SQL reads and writes by name
 *                               (registerFile leaves `bytes` as they were)
 *   readSqlite(bytes)        -> Promise<[{ name, columns, rows }]>   (optional)
 *   writeSqlite(tables)      -> Promise<Uint8Array>                  (optional)
 *
 * Running a node runs everything upstream of it first, in dependency order.
 * Each node runs through its kind's `run(ctx)` (see kindRegistry.js; the
 * built-ins are in builtinKinds.js). Runs (and file reads) are queued, one at
 * a time. `ctx` is:
 *
 *   id, node          the node's ID, and its data (kind, label, its fields,
 *                     with their defaults where they're unset)
 *   inputs            what's wired in, one per slot each wire carries (see
 *                     SLOTS AND PINS in kindRegistry.js): [{ id, kind, slot,
 *                     ref, pin, table } or { ..., tables: [{ name, label,
 *                     table }] }]: `id` the node it's from, `slot` null for
 *                     that node's first slot, `ref` the reference name it's
 *                     read by, `pin` null for the main input pin or the named
 *                     pin it came through, `table` a table name for SQL.
 *                     While it runs, the SQL engine's search path also finds
 *                     each input by `ref`
 *   sql               the host's SQL engine (above)
 *   server            the server: { state, query?, runPython? } (see
 *                     FlowgraphEditor's `server`); send it data as Parquet
 *   getFile(key)      bytes the host stored by key (a DataIngest node's tables)
 *   table(name?)      a name for an output table of this node's (one of
 *                     several, with a name): create it, then return it
 *   slotTable(slot, name?)   the same, for one of its kind's other slots
 *   rows(input)       an input's rows, as objects by column (for several
 *                     tables, an object of them by name)
 *   parquet()         the inputs as Parquet, [{ name, bytes }], named as the
 *                     node reads them (dataingest1_data.sheet1 for one of
 *                     several tables)
 *   loadParquet(table, bytes), loadRows(table, rows)   create a table
 *   serverTables(query)   the tables a query reads that no input supplies
 *
 * `run` returns (or resolves to) what it made, any of:
 *
 *   table             its output table, or
 *   tables            [{ name, label, table }], several (a workbook's sheets)
 *   slots             its kind's other slots: { [slot]: table } or
 *                     { [slot]: { tables } }; one left out is an empty table
 *   value             a value that isn't a table (shown in Data); downstream
 *                     gets an empty table, as it does when there's no output
 *   export            { filename, contentType, size, bytes }: a file to save
 *   output            what it printed (text), for the Terminal
 *   error             why it failed (or throw)
 *
 * and anything else it returns is kept on the result (PythonScript's
 * `variables`). A result is then one of (as in the spec, §12, plus `tables`
 * and `value`), with `slots: [{ name, label, ref, data | tables }]` when
 * its kind has other slots:
 *   { data: { columns, rows, rowCount, page, pageSize, hasMore } }
 *   { tables: [{ name, label, data }] }          several tables
 *   { export: { filename, contentType, size, bytes } }
 *   { value: { kind: 'json', value } | { kind: 'text', text } | { kind: 'none' } }
 *                                                a script's non-table result
 *   { error }
 * and a script's printed lines as `output` (text) alongside it, or on its own
 * when it returns no table; Python adds its top-level `variables`.
 */
export function createGraphRunner(sql) {
  let queue = Promise.resolve()
  let inputSchemas = [] // schemas made for multi-table inputs, dropped before the next node

  function queued(job) {
    const next = queue.then(job)
    queue = next.catch(() => {})
    return next
  }

  // Run `targetIds` (and everything upstream) of a saved-form graph
  // (graphDocument.js). `paged` ({ id, page, table?, slot? }) picks the page
  // of one target's output (of one of its tables, in one of its slots); the rest show their first page. `getFile(key)` returns
  // stored bytes (a DataIngest node's tables). `server` is the server engine:
  // { state ('connected', 'unavailable' or 'checking'), query?, runPython? }.
  // Resolves to { [nodeId]: result } for every node that ran; rejects if the
  // engine can't run at all.
  const run = (doc, targetIds, { paged = null, getFile, server = { state: 'unavailable' } }) =>
    queued(async () => (await runNow(doc, targetIds, paged, { getFile, server })).results)

  // Resolves to { results, outputs }: the results, and the tables each node
  // that ran left in OUTPUTS (until the next run).
  async function runNow(doc, targetIds, paged, { getFile, server }) {
    if (!sql) throw new Error("No SQL engine is connected, so nodes can't run.")
    const nodes = new Map(doc.nodes.map((n) => [n.id, n]))
    const { order, inputs } = upstreamOrder(doc, targetIds)
    await sql.query(`DROP SCHEMA IF EXISTS ${OUTPUTS} CASCADE`)
    await sql.query(`CREATE SCHEMA ${OUTPUTS}`)

    // Per node that ran: { table } or { tables: [{ name, label, table }] }.
    const outputs = new Map()
    const context = { outputs, getFile, server }
    const results = {}
    for (const id of order) {
      const wires = inputs.get(id) ?? []
      const failed = wires.map((w) => w.source).find((source) => results[source].error)
      if (failed) {
        results[id] = { error: `Upstream node ${failed} failed.` }
        continue
      }
      const node = nodes.get(id)
      const page = paged?.id === id ? paged : { page: 0 }
      try {
        const exposed = inputsOf(wires, nodes, outputs)
        await exposeInputs(exposed)
        results[id] = await runNode(node, exposed, page, context)
      } catch (e) {
        results[id] = { error: message(e) }
      }
    }
    return { results, outputs }
  }

  // ---- For the AI assistant ----

  // What's wired into a node: runs everything upstream of it (not the node
  // itself), then describes each input: { name (its reference name), kind,
  // label, tables: [{ name (one of several), columns: [{ name, type }],
  // rowCount, sample (its first `sampleRows` rows, long values cut short) }] },
  // or { name, kind, label, error } for one that failed. `getFile` and
  // `server` are as for run.
  const describeInputs = (doc, nodeId, { getFile, server = { state: 'unavailable' }, sampleRows = 0 }) =>
    queued(() => describeNow(doc, nodeId, { getFile, server, sampleRows }))

  async function describeNow(doc, nodeId, { getFile, server, sampleRows }) {
    const sourceIds = [...new Set(doc.edges.filter((e) => e.target === nodeId).map((e) => e.source))]
    if (!sourceIds.length) return []
    if (!sql) throw new Error("No SQL engine is connected, so the inputs can't be read.")
    const nodes = new Map(doc.nodes.map((n) => [n.id, n]))
    const { results, outputs } = await runNow(doc, sourceIds, null, { getFile, server })
    const described = []
    for (const id of sourceIds) {
      const source = nodes.get(id)
      const about = { name: referenceName(id, source), kind: kindInfo(source.kind).label, label: source.label ?? '' }
      const output = outputs.get(id)
      if (!output) {
        described.push({ ...about, error: results[id]?.error ?? "It didn't run." })
        continue
      }
      const tables = output.table ? [{ name: null, table: output.table }] : output.tables
      described.push({
        ...about,
        tables: await Promise.all(tables.map(async (t) => ({ name: t.name, ...(await describeTable(t.table, sampleRows)) }))),
      })
    }
    return described
  }

  async function describeTable(table, sampleRows) {
    const columns = (await sql.query(`DESCRIBE SELECT * FROM ${table}`)).rows.map(([name, type]) => ({ name, type }))
    const rowCount = Number((await sql.query(`SELECT count(*) FROM ${table}`)).rows[0][0])
    const sample = sampleRows > 0 ? (await sql.query(`SELECT * FROM ${table} LIMIT ${Math.floor(sampleRows)}`)).rows : []
    return { columns, rowCount, sample: sample.map((row) => row.map(sampleValue)) }
  }

  // What a node's wires bring it: one input per slot each wire carries (a
  // node wired in twice, or through two pins, counts once per slot and pin).
  function inputsOf(wires, nodes, outputs) {
    const seen = new Set()
    const inputs = []
    for (const wire of wires) {
      const source = nodes.get(wire.source)
      const pin = wire.targetHandle?.startsWith('target:') ? wire.targetHandle.slice('target:'.length) : null
      for (const slot of slotsThrough(wire.sourceHandle, source.id, source)) {
        const key = JSON.stringify([source.id, slot.name, pin])
        if (seen.has(key)) continue
        seen.add(key)
        const output = slot.name === null ? outputs.get(source.id) : outputs.get(source.id)?.slots?.[slot.name]
        if (!output) continue
        const { table, tables } = output
        inputs.push({ id: source.id, kind: source.kind, slot: slot.name, ref: slot.ref, pin, ...(tables ? { tables } : { table }) })
      }
    }
    return inputs
  }

  // Run a node through its kind, then record what it made in `outputs` and
  // preview it for the Data panel.
  async function runNode(node, inputs, page, context) {
    if (!isKnownKind(node.kind)) {
      return {
        error: `No ${node.kind} nodes are available here (they come from another app, a plugin this app doesn't ` +
          "install, or a server that isn't connected), so this one can't run. It's kept as it was, and saving the graph keeps it.",
      }
    }
    const definition = NODE_KINDS[node.kind]
    // A kind the server runs (the engine's own, defined from GET /nodes) has
    // no `run`: it runs through the server client's runNode.
    const run = definition.run ?? (definition.where === 'server' ? (ctx) => runOnServer(ctx, definition) : null)
    if (!run) return { error: `${definition.label} nodes can't run yet.` }
    const errors = checkNode(node).filter((p) => p.severity === 'error')
    if (errors.length) return { error: errors.map((p) => `${p.label}: ${p.message}`).join(' ') }
    const ctx = runContext(withDefaults(node), inputs, context)
    const { table, tables, slots: filled, error, ...made } = (await run(ctx)) ?? {}
    if (error) return { error, ...(made.output !== undefined ? { output: made.output } : {}) }

    // Nothing tabular in a slot: downstream reads an empty table.
    const empty = async (name) => {
      await sql.query(`CREATE TABLE ${name} AS SELECT NULL::VARCHAR AS value WHERE false`)
      return { table: name }
    }
    const first = tables ? { tables } : table ? { table } : await empty(ctx.table())
    const others = slotsOf(node.id, node).slice(1)
    const slots = {}
    for (const slot of others) {
      const value = filled?.[slot.name]
      slots[slot.name] = typeof value === 'string' ? { table: value }
        : value?.tables ? { tables: value.tables }
        : await empty(ctx.slotTable(slot.name))
    }
    context.outputs.set(node.id, { ...first, ...(others.length ? { slots } : {}) })
    if (made.export) return made

    // Previews for the Data panel: the page asked for, of the table and slot
    // asked for, and the first page of the rest.
    const show = async (output, slot) => {
      const at = (name) => (page.slot ?? null) === slot && (page.table ?? null) === name ? page.page ?? 0 : 0
      if (output.table) return { data: await preview(output.table, at(null)) }
      const shown = []
      for (const t of output.tables) shown.push({ name: t.name, label: t.label, data: await preview(t.table, at(t.name)) })
      return { tables: shown }
    }
    const result = { ...made, ...(tables || table ? await show(first, null) : {}) }
    if (others.length) {
      result.slots = []
      for (const slot of others) result.slots.push({ name: slot.name, label: slot.label, ref: slot.ref, ...(await show(slots[slot.name], slot.name)) })
    }
    return result
  }

  // A node of a kind the server runs, with no `run` of its own: its inputs and
  // its file fields' files sent to the server's runNode (see davy-jones-locker's
  // engine client), and what comes back loaded as its tables and slots.
  async function runOnServer(ctx, { kind, label, fields = [] }) {
    if (ctx.server.state !== 'connected' || typeof ctx.server.runNode !== 'function') {
      return { error: `${label} nodes run on the server, which isn't available.` }
    }
    const inputs = []
    for (const input of ctx.inputs) {
      const { ref, id, slot, pin } = input
      if (input.table) inputs.push({ ref, id, slot, pin, bytes: await parquetOf(input.table) })
      else {
        const tables = []
        for (const t of input.tables) tables.push({ name: t.name, bytes: await parquetOf(t.table) })
        inputs.push({ ref, id, slot, pin, tables })
      }
    }
    const files = []
    for (const field of fields) {
      const stored = field.type === 'file' ? ctx.node[field.key] : null
      if (!stored?.key) continue
      const bytes = await ctx.getFile(stored.key)
      if (!bytes) return { error: `${field.label}: "${stored.fileName}" isn't kept any more. Choose it again.` }
      files.push({ key: stored.key, bytes })
    }

    const result = await ctx.server.runNode({ kind, node: ctx.node, inputs, files })
    const output = result.output ?? ''
    if (result.error) return { error: result.error, output }
    const made = { output, slots: {} }
    const load = async (bytes, slot, name) => {
      const table = slot === null ? ctx.table(name) : ctx.slotTable(slot, name)
      await loadParquet(table, bytes)
      return table
    }
    for (const o of result.outputs ?? []) {
      let value
      if (o.tables) {
        value = { tables: [] }
        for (const t of o.tables) value.tables.push({ name: t.name, label: t.name, table: await load(t.bytes, o.slot, t.name) })
      } else {
        value = await load(o.bytes, o.slot)
      }
      if (o.slot !== null) made.slots[o.slot] = value
      else if (o.tables) made.tables = value.tables
      else made.table = value
    }
    // A value shows in Data only when there's no table to show.
    if (result.value !== undefined && !made.table && !made.tables) {
      const v = result.value
      made.value = { kind: 'json', type: Array.isArray(v) ? 'array' : v === null ? 'null' : typeof v, value: v }
    }
    return made
  }

  // What a kind's run is given: see the top of this file.
  function runContext(node, inputs, { getFile, server }) {
    return {
      id: node.id,
      node,
      inputs,
      sql,
      server,
      getFile,
      table: (name) => `${OUTPUTS}.${quote(name ? `${node.id}/${name}` : node.id)}`,
      slotTable: (slot, name) => `${OUTPUTS}.${quote(name ? `${node.id}#${slot}/${name}` : `${node.id}#${slot}`)}`,
      rows: inputValue,
      parquet: () => parquetInputs(inputs),
      loadParquet,
      loadRows,
      serverTables: (query) => serverTables(query, [...new Set(inputs.map((i) => i.ref))]),
    }
  }

  // ---- To and from the server ----

  // The tables a query reads that its inputs don't supply, so it runs on the
  // server: `orders`, `sales.orders`. `inputs` are the reference names wired
  // in. A table in a schema named like one of them (dataingest1_data.sheet1)
  // is one of that input's tables, so it's local; if the input has no such
  // table, the query fails here saying so. Read by DuckDB's own parser; a
  // query it can't parse counts as local, and fails here saying why.
  async function serverTables(query, inputs) {
    const text = query.trim().replace(/;+\s*$/, '')
    if (!text || !sql) return []
    let tree
    try {
      tree = JSON.parse((await sql.query(`SELECT json_serialize_sql(${literal(text)})`)).rows[0][0])
    } catch {
      return []
    }
    if (tree.error) return []

    const lower = (s) => (s ?? '').toLowerCase()
    const names = new Set(inputs.map(lower))
    const read = []
    const ctes = new Set()
    walk(tree, (node) => {
      for (const { key } of node.cte_map?.map ?? []) ctes.add(lower(key))
      if (node.type === 'BASE_TABLE') read.push(node)
    })
    const local = ({ catalog_name: catalog, schema_name: schema, table_name: table }) => {
      if (catalog) return LOCAL_CATALOGS.has(lower(catalog))
      if (schema) return LOCAL_SCHEMAS.has(lower(schema)) || names.has(lower(schema))
      return names.has(lower(table)) || ctes.has(lower(table))
    }
    const remote = read.filter((t) => !local(t)).map((t) => [t.catalog_name, t.schema_name, t.table_name].filter(Boolean).join('.'))
    return [...new Set(remote)]
  }

  // Each input, as Parquet, named as the node reads it (once per name).
  async function parquetInputs(inputs) {
    const parts = []
    const named = new Set()
    for (const input of inputs) {
      if (named.has(input.ref)) continue
      named.add(input.ref)
      if (input.table) parts.push({ name: input.ref, bytes: await parquetOf(input.table) })
      else for (const t of input.tables) parts.push({ name: `${input.ref}.${t.name}`, bytes: await parquetOf(t.table) })
    }
    return parts
  }

  async function parquetOf(table) {
    const path = `flow-send-${Date.now()}-${Math.random().toString(36).slice(2)}.parquet`
    await copyTo(sql, `SELECT * FROM ${table}`, path, 'FORMAT parquet')
    try {
      return await sql.readFile(path)
    } finally {
      await sql.dropFile(path)
    }
  }

  async function loadParquet(table, bytes) {
    const path = `flow-received-${Date.now()}-${Math.random().toString(36).slice(2)}.parquet`
    await sql.registerFile(path, bytes)
    try {
      await sql.query(`CREATE TABLE ${table} AS SELECT * FROM read_parquet(${literal(path)})`)
    } finally {
      await sql.dropFile(path)
    }
  }

  // Rows (objects by column) as a new table, by way of a JSON file DuckDB
  // reads, so it infers the column types. No rows: an empty table.
  async function loadRows(table, records) {
    if (!records.length) {
      await sql.query(`CREATE TABLE ${table} AS SELECT NULL::VARCHAR AS value WHERE false`)
      return
    }
    const path = `flow-rows-${Date.now()}-${Math.random().toString(36).slice(2)}.json`
    await sql.registerFile(path, new TextEncoder().encode(JSON.stringify(records)))
    try {
      await sql.query(`CREATE TABLE ${table} AS SELECT * FROM read_json_auto(${literal(path)}, format = 'array')`)
    } finally {
      await sql.dropFile(path)
    }
  }

  // An input's rows as objects keyed by column: a node's table, or for a node
  // with several tables, an object of them by name (book_data.sheet1).
  async function inputValue(output) {
    const rowsOf = async (table) => {
      const { columns, rows } = await sql.query(`SELECT * FROM ${table}`)
      return rows.map((row) => Object.fromEntries(columns.map((c, i) => [c, row[i]])))
    }
    if (output.table) return rowsOf(output.table)
    return Object.fromEntries(await Promise.all(output.tables.map(async (t) => [t.name, await rowsOf(t.table)])))
  }

  // Show a node's query only its inputs (see inputsOf), each by its reference name.
  async function exposeInputs(inputs) {
    for (const schema of [INPUTS, ...inputSchemas]) await sql.query(`DROP SCHEMA IF EXISTS ${quote(schema)} CASCADE`)
    inputSchemas = []
    await sql.query(`CREATE SCHEMA ${INPUTS}`)
    // Set after each re-creation: it finds the schema itself, not by name.
    await sql.query(`SET search_path = '${INPUTS},main'`)
    const named = new Set()
    for (const output of inputs) {
      const name = output.ref
      if (named.has(name)) continue
      named.add(name)
      if (output.table) {
        await sql.query(`CREATE VIEW ${INPUTS}.${quote(name)} AS SELECT * FROM ${output.table}`)
        continue
      }
      await sql.query(`CREATE SCHEMA ${quote(name)}`)
      inputSchemas.push(name)
      for (const t of output.tables) {
        await sql.query(`CREATE VIEW ${quote(name)}.${quote(t.name)} AS SELECT * FROM ${t.table}`)
      }
    }
  }

  async function preview(table, page) {
    const rowCount = Number((await sql.query(`SELECT count(*) FROM ${table}`)).rows[0][0])
    const { columns, rows } = await sql.query(`SELECT * FROM ${table} LIMIT ${PAGE_SIZE} OFFSET ${page * PAGE_SIZE}`)
    return { columns, rows, rowCount, page, pageSize: PAGE_SIZE, hasMore: (page + 1) * PAGE_SIZE < rowCount }
  }

  // Read a chosen file into tables, each as Parquet bytes to store, so the
  // file itself needn't be kept: just its data (a workbook's values, not its
  // formulas). Resolves to [{ name, label, rowCount, bytes }]: `name` is the
  // table's SQL name (a sheet's, made an identifier), `label` its own.
  const readFile = (bytes, fileName, format) => queued(() => readNow(bytes, fileName, format))

  async function readNow(bytes, fileName, format) {
    if (!sql) throw new Error("No SQL engine is connected, so files can't be read.")
    const path = `flow-upload-${Date.now()}.${FILE_FORMATS[format].extensions[0]}`
    const scratch = [] // other files registered while reading
    await sql.registerFile(path, bytes)
    try {
      const sources = await tableQueries(format, path, bytes, fileName, scratch)
      const tables = []
      const used = []
      for (const [i, { label, select }] of sources.entries()) {
        const name = uniqueId(toIdentifier(label) || 'table', used)
        used.push(name)
        const out = `${path}-${i}.parquet`
        scratch.push(out)
        const rowCount = await copyTo(sql, select, out, 'FORMAT parquet')
        tables.push({ name, label, rowCount, bytes: await sql.readFile(out) })
      }
      return tables
    } finally {
      for (const file of [path, ...scratch]) await sql.dropFile(file)
    }
  }

  // A SELECT per table in the file.
  async function tableQueries(format, path, bytes, fileName, scratch) {
    const file = literal(path)
    const one = (select) => [{ label: fileName.replace(/\.[^.]*$/, ''), select }]
    switch (format) {
      case 'csv': return one(`SELECT * FROM read_csv(${file})`)
      case 'tsv': return one(`SELECT * FROM read_csv(${file}, delim = '\t')`)
      case 'json': return one(`SELECT * FROM read_json_auto(${file})`)
      case 'parquet': return one(`SELECT * FROM read_parquet(${file})`)
      // Each feature's properties as columns, and its geometry as GeoJSON text.
      case 'geojson':
        return one(
          'SELECT unnest(f.properties), to_json(f.geometry)::VARCHAR AS geometry ' +
          `FROM (SELECT unnest(features) AS f FROM read_json_auto(${file}))`,
        )
      // The first row of each sheet is its column names (DuckDB's guess misses
      // a text heading over text values).
      case 'xlsx': {
        await loadExcel(sql)
        const sheets = await xlsxSheetNames(bytes)
        return sheets.map((sheet) => ({
          label: sheet,
          select: `SELECT * FROM read_xlsx(${file}, sheet = ${literal(sheet)}, header = true)`,
        }))
      }
      case 'sqlite': {
        if (!sql.readSqlite) throw new Error("This SQL engine can't read SQLite files.")
        const tables = await sql.readSqlite(bytes)
        const sources = []
        for (const [i, t] of tables.entries()) {
          sources.push({ label: t.name, select: await tableFromRows(t, `${path}-rows-${i}.json`, scratch) })
        }
        return sources
      }
      default:
        throw new Error(`Can't read ${FILE_FORMATS[format]?.label ?? format} files.`)
    }
  }

  // Rows from outside DuckDB (a SQLite table) as a SELECT, by way of a JSON
  // file DuckDB reads, so it infers the column types.
  async function tableFromRows({ columns, rows }, path, scratch) {
    if (!rows.length) {
      const none = columns.map((c) => `NULL::VARCHAR AS ${quote(c)}`).join(', ') || 'NULL AS empty'
      return `SELECT ${none} WHERE false`
    }
    const records = rows.map((row) => Object.fromEntries(columns.map((c, i) => [c, row[i]])))
    await sql.registerFile(path, new TextEncoder().encode(JSON.stringify(records)))
    scratch.push(path)
    return `SELECT * FROM read_json_auto(${literal(path)}, format = 'array')`
  }

  return { run, readFile, serverTables, describeInputs }
}

// A value as the AI assistant is shown it: long text cut short, bytes counted.
function sampleValue(value) {
  if (value instanceof Uint8Array) return `(${value.length} bytes)`
  const text = typeof value === 'bigint' ? String(value)
    : value !== null && typeof value === 'object' ? JSON.stringify(value, (_, v) => (typeof v === 'bigint' ? String(v) : v))
    : value
  return typeof text === 'string' && text.length > 200 ? `${text.slice(0, 200)}…` : text
}

// The targets and everything upstream of them, each after its inputs, and
// each node's wires in ({ source, sourceHandle, targetHandle }).
function upstreamOrder(doc, targetIds) {
  const inputs = new Map()
  for (const e of doc.edges) {
    if (!inputs.has(e.target)) inputs.set(e.target, [])
    inputs.get(e.target).push({ source: e.source, sourceHandle: e.sourceHandle, targetHandle: e.targetHandle })
  }
  const order = []
  const seen = new Set()
  const visit = (id) => {
    if (seen.has(id)) return
    seen.add(id)
    for (const { source } of inputs.get(id) ?? []) visit(source)
    order.push(id)
  }
  targetIds.forEach(visit)
  return { order, inputs }
}
