import { FILE_FORMATS } from './fileFormats.js'
import { crsOfType } from './geoExport.js'
import { spatialWarnings } from './spatialChecks.js'
import { checkNode, isKnownKind, kindInfo, NODE_KINDS, referenceName, slotsOf, slotsThrough, toIdentifier, uniqueId, unwiredPins, withDefaults } from './nodeKinds.js'
import { copyTo, literal, loadExcel, quote } from './sqlText.js'
import { xlsxSheetNames } from './xlsx.js'
import { boundaryPins, graphAt, MAX_DEPTH, SUBNET, subnetGraph } from './subnets.js'
import { unzip } from './zip.js'

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

// A column from crsOfType: geometry with a CRS, or with none (null).
const isGeometryColumn = (column) => column.crs !== undefined

// GeoPackage's placeholders for no CRS, as GDAL reports them (PROJJSON).
function isUndefinedCrs(crs) {
  if (!crs?.startsWith('{')) return false
  try {
    return /^Undefined (cartesian|geographic) SRS$/i.test(JSON.parse(crs).name)
  } catch {
    return false
  }
}

// How much of a geometry's WKT Data shows on hover.
const WKT_SHOWN = 2000

// An area or length in metres as Data shows it: m² up to a hectare, then
// hectares; m up to a kilometre, then km. '' for neither.
function measure(area, length) {
  const number = (v, digits) => v.toLocaleString('en', { maximumFractionDigits: digits })
  if (area > 0) return area >= 10000 ? `${number(area / 10000, 2)} ha` : `${number(area, area < 10 ? 2 : 0)} m²`
  if (length > 0) return length >= 1000 ? `${number(length / 1000, 2)} km` : `${number(length, length < 10 ? 2 : 0)} m`
  return ''
}

// OGC:CRS84 as GeoParquet's PROJJSON (or a name) says it.
const isCrs84 = (crs) => crs === 'OGC:CRS84' || (crs?.id?.authority === 'OGC' && String(crs.id.code) === 'CRS84')

// A GeoParquet WKB column (`column`, quoted) as GEOMETRY with the CRS its
// `geo` entry gives: none for a null `crs`, EPSG:4326 for CRS84 or no `crs`
// (see readParquet), otherwise the PROJJSON, which DuckDB's spatial extension
// names (EPSG:7855).
function geometryOf(column, { crs } = {}) {
  const geometry = `ST_GeomFromWKB(${column})`
  if (crs === null) return geometry
  if (crs === undefined || isCrs84(crs)) return `ST_SetCRS(${geometry}, 'EPSG:4326')`
  return `ST_SetCRS(${geometry}, ${literal(typeof crs === 'string' ? crs : JSON.stringify(crs))})`
}

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
 *   writeSqlite(tables, { statements })   -> Promise<Uint8Array>     (optional)
 *                               tables [{ name, columns, rows, types? }];
 *                               bytes are blobs; statements run after
 *   loadSpatial()            -> Promise   DuckDB's spatial extension, before
 *                               geometry is read from Parquet (optional)
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
 *   parquetOf(table)  one table as Parquet (bytes)
 *   loadParquet(table, bytes), loadRows(table, rows)   create a table
 *                     (Parquet in and out is GeoParquet when there's geometry,
 *                     each column's CRS kept: see writeParquet below)
 *   serverTables(query)   the tables a query reads that no input supplies
 *   spatialWarnings(query)   warnings about a query's spatial SQL: measuring
 *                     in degrees, a dropped datum shift (spatialChecks.js)
 *   runSubnet(), boundInput   for subnets (subnets.js): a Subnet node runs
 *                     its graph with runSubnet(); an Input node inside puts
 *                     out `boundInput`, what's wired into its subnet's pin
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
 *   warnings          [text]: it ran, but something's likely wrong (the
 *                     Terminal, and the node's badge)
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
 * when it returns no table; Python adds its top-level `variables`. With
 * output readers (readOutput), each `data` has `extras` beside it.
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
  // (graphDocument.js). A target inside a subnet is its path
  // (subnet1/sqlnode1; see subnets.js), and runs what's upstream of it at
  // every level. `paged` ({ id (a path), page, table?, slot? }) picks the
  // page of one target's output (of one of its tables, in one of its slots);
  // the rest show their first page. `getFile(key)` returns stored bytes (a
  // DataIngest node's tables). `server` is the server engine: { state
  // ('connected', 'unavailable' or 'checking'), query?, runPython? }.
  // `readers` (a Map of name to function) read each output table while it's
  // there: see readOutput. Resolves to { [path]: result } for every node that
  // ran, inside subnets too; rejects if the engine can't run at all.
  const run = (doc, targetIds, { paged = null, getFile, server = { state: 'unavailable' }, readers = null }) =>
    queued(async () => (await runNow(doc, targetIds, paged, { getFile, server, readers })).results)

  // Resolves to { results, outputs }: the results, and the tables each node
  // that ran left in OUTPUTS (until the next run), by path.
  async function runNow(doc, targetIds, paged, { getFile, server, readers = null }) {
    if (!sql) throw new Error("No SQL engine is connected, so nodes can't run.")
    await sql.query(`DROP SCHEMA IF EXISTS ${OUTPUTS} CASCADE`)
    await sql.query(`CREATE SCHEMA ${OUTPUTS}`)
    const results = {}
    // Per node that ran, by path: { table } or { tables: [{ name, label, table }] }.
    const outputs = new Map()
    const context = { doc, paged, results, outputs, getFile, server, readers, prefix: '', depth: 0, bindings: null }
    await runGraph(doc, targetIds, context)
    return { results, outputs }
  }

  // Run `targets` of one graph: the document's, or a subnet's (its nodes'
  // paths start with `context.prefix`, and `context.bindings` has what its
  // Input nodes put out). A target can be a path into one of its subnets.
  // Resolves to this level's outputs, by node ID.
  async function runGraph(graph, targets, context) {
    const { prefix, results, paged } = context
    const nodes = new Map(graph.nodes.map((n) => [n.id, n]))
    const own = []
    const inside = new Map() // subnet ID -> paths in it that were asked for
    for (const target of targets) {
      const [id, ...rest] = target.split('/')
      if (!nodes.has(id)) continue
      if (rest.length && nodes.get(id).kind === SUBNET) inside.set(id, [...(inside.get(id) ?? []), rest.join('/')])
      else if (!rest.length) own.push(id)
    }
    const { order, inputs } = upstreamOrder(graph, [...own, ...inside.keys()])
    // A subnet that's there only for what's inside it runs just that, and
    // has no result of its own; everything else runs whole.
    const feeding = new Set(order.flatMap((id) => (inputs.get(id) ?? []).map((w) => w.source)))
    const whole = new Set(order.filter((id) => !inside.has(id) || own.includes(id) || feeding.has(id)))

    const outputs = new Map()
    const level = { ...context, levelOutputs: outputs }
    for (const id of order) {
      const key = prefix + id
      const wires = inputs.get(id) ?? []
      const failed = wires.map((w) => w.source).find((source) => results[prefix + source]?.error)
      if (failed) {
        if (whole.has(id)) results[key] = { error: `Upstream node ${failed} failed.` }
        continue
      }
      const node = nodes.get(id)
      try {
        const exposed = inputsOf(wires, nodes, outputs)
        if (!whole.has(id)) {
          await runSubnet(node, exposed, inside.get(id), level, false)
          continue
        }
        await exposeInputs(exposed)
        const page = paged?.id === key ? paged : { page: 0 }
        results[key] = await runNode(node, exposed, page, { ...level, inner: inside.get(id) ?? null })
      } catch (e) {
        results[key] = { error: message(e) }
      }
    }
    return outputs
  }

  // A subnet node's graph, run with what's wired into its pins bound to its
  // Input nodes (the first slot each wire carries): every Output's upstream
  // when `whole` (the subnet runs as a node), and `innerTargets` (paths in
  // it). Resolves to what a kind's run returns: its first Output's table (or
  // tables), and the others as slots; or an error naming where it started
  // (Screening › classify: ...).
  async function runSubnet(node, inputs, innerTargets, context, whole) {
    const path = context.prefix + node.id
    const name = node.label || node.id
    if (context.depth >= MAX_DEPTH) {
      return { error: `Subnets here are nested more than ${MAX_DEPTH} deep: does one contain itself?` }
    }
    const graph = subnetGraph(node, context.doc.subnets)
    if (!graph) return { error: `This subnet uses "${node.subnetRef}" from the graph's shared subnets, which the graph doesn't have.` }
    const pins = boundaryPins(graph)
    const bindings = new Map()
    for (const pin of pins.inputs) {
      const input = inputs.find((i) => i.pin === pin)
      bindings.set(pin, !input ? { error: `Nothing is wired into ${name}'s ${pin} input.` }
        : input.tables ? { tables: input.tables } : { table: input.table })
    }
    const targets = [...(whole ? pins.outputs : []), ...(innerTargets ?? [])]
    const inner = { ...context, prefix: `${path}/`, depth: context.depth + 1, bindings }
    const outputs = await runGraph(graph, targets, inner)
    if (!whole) return null

    const failed = pins.outputs.some((o) => context.results[`${path}/${o}`]?.error)
    if (failed) {
      const nodes = new Map(graph.nodes.map((n) => [n.id, n]))
      const [id, origin] = Object.entries(context.results).find(([key, r]) =>
        key.startsWith(`${path}/`) && !key.slice(path.length + 1).includes('/') && r.error && !/^Upstream node .+ failed\.$/.test(r.error),
      ) ?? []
      if (!origin) return { error: `${name} failed.` }
      const child = nodes.get(id.slice(path.length + 1))
      // A subnet's own error starts with its name already.
      return { error: child?.kind === SUBNET ? `${name} › ${origin.error}` : `${name} › ${child?.label || child?.id}: ${origin.error}` }
    }
    const made = { slots: {} }
    pins.outputs.forEach((o, i) => {
      const out = outputs.get(o)
      if (i === 0) Object.assign(made, out.tables ? { tables: out.tables } : { table: out.table })
      else made.slots[o] = out.tables ? { tables: out.tables } : out.table
    })
    return made
  }

  // ---- For the AI assistant ----

  // What's wired into a node: runs everything upstream of it (not the node
  // itself), then describes each input: { name (its reference name), kind,
  // label, tables: [{ name (one of several), columns: [{ name, type }],
  // rowCount, sample (its first `sampleRows` rows, long values cut short) }] },
  // or { name, kind, label, error } for one that failed. `getFile` and
  // `server` are as for run. `nodePath` is the node's path (its ID, or
  // subnet1/sqlnode1 inside a subnet).
  const describeInputs = (doc, nodePath, { getFile, server = { state: 'unavailable' }, sampleRows = 0 }) =>
    queued(() => describeNow(doc, nodePath, { getFile, server, sampleRows }))

  async function describeNow(doc, nodePath, { getFile, server, sampleRows }) {
    const segments = nodePath.split('/')
    const nodeId = segments.pop()
    const prefix = segments.map((s) => `${s}/`).join('')
    const graph = graphAt(doc, segments) ?? { nodes: [], edges: [] }
    const sourceIds = [...new Set(graph.edges.filter((e) => e.target === nodeId).map((e) => e.source))]
    if (!sourceIds.length) return []
    if (!sql) throw new Error("No SQL engine is connected, so the inputs can't be read.")
    const nodes = new Map(graph.nodes.map((n) => [n.id, n]))
    const { results, outputs } = await runNow(doc, sourceIds.map((id) => prefix + id), null, { getFile, server })
    const described = []
    for (const id of sourceIds) {
      const source = nodes.get(id)
      const about = { name: referenceName(id, source), kind: kindInfo(source.kind).label, label: source.label ?? '' }
      const output = outputs.get(prefix + id)
      if (!output) {
        described.push({ ...about, error: results[prefix + id]?.error ?? "It didn't run." })
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
    const errors = [
      ...checkNode(node).filter((p) => p.severity === 'error').map((p) => `${p.label}: ${p.message}`),
      ...unwiredPins(node, inputs.map((i) => (i.pin ? `target:${i.pin}` : 'target-0'))),
    ]
    if (errors.length) return { error: errors.join(' ') }
    const ctx = runContext(withDefaults(node), inputs, context)
    // A subnet runs its graph; what was asked for inside it runs too.
    ctx.runSubnet = () => runSubnet(node, inputs, context.inner, context, true)
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
    const output = { ...first, ...(others.length ? { slots } : {}) }
    context.levelOutputs.set(node.id, output)
    context.outputs.set(context.prefix + node.id, output)
    if (made.export) return made

    // Previews for the Data panel: the page asked for, of the table and slot
    // asked for, and the first page of the rest.
    const show = async (output, slot) => {
      const at = (name) => (page.slot ?? null) === slot && (page.table ?? null) === name ? page.page ?? 0 : 0
      const read = async (table) => {
        const extras = await readOutput(table, context.readers)
        return extras ? { extras } : {}
      }
      if (output.table) return { data: await preview(output.table, at(null)), ...(await read(output.table)) }
      const shown = []
      for (const t of output.tables) {
        shown.push({ name: t.name, label: t.label, data: await preview(t.table, at(t.name)), ...(await read(t.table)) })
      }
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

  // What a kind's run is given: see the top of this file. Output tables are
  // named by the node's path, so levels don't collide. `boundInput` is what an
  // Input node puts out (see runSubnet).
  function runContext(node, inputs, { getFile, server, prefix, bindings }) {
    const base = prefix + node.id
    return {
      id: node.id,
      node,
      inputs,
      sql,
      server,
      getFile,
      boundInput: bindings?.get(node.id),
      table: (name) => `${OUTPUTS}.${quote(name ? `${base}/${name}` : base)}`,
      slotTable: (slot, name) => `${OUTPUTS}.${quote(name ? `${base}#${slot}/${name}` : `${base}#${slot}`)}`,
      rows: inputValue,
      parquet: () => parquetInputs(inputs),
      parquetOf,
      loadParquet,
      loadRows,
      serverTables: (query) => serverTables(query, [...new Set(inputs.map((i) => i.ref))]),
      spatialWarnings: (query) => spatialWarnings(sql, query),
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

  // A table as Parquet (GeoParquet when it has geometry).
  async function parquetOf(table) {
    const path = `flow-send-${Date.now()}-${Math.random().toString(36).slice(2)}.parquet`
    await writeParquet(`SELECT * FROM ${table}`, path)
    try {
      return await sql.readFile(path)
    } finally {
      await sql.dropFile(path)
    }
  }

  // A table from Parquet bytes (see readParquet).
  async function loadParquet(table, bytes) {
    const path = `flow-received-${Date.now()}-${Math.random().toString(36).slice(2)}.parquet`
    await sql.registerFile(path, bytes)
    try {
      await readParquet(path, table)
    } finally {
      await sql.dropFile(path)
    }
  }

  // A registered Parquet file as a new table. GeoParquet's geometry becomes
  // GEOMETRY columns with their CRS, read from its `geo` metadata here rather
  // than by DuckDB, because DuckDB-wasm's spatial extension fails ("stoi: no
  // conversion") on OGC:CRS84, which is what a column with no `crs` means.
  // CRS84 is read as EPSG:4326, which in Flow's x, y order (longitude first)
  // is the same coordinates; an explicit null `crs` stays unknown.
  async function readParquet(path, table) {
    const file = literal(path)
    const geo = await geoOfFile(path)
    if (!geo) {
      await sql.query(`CREATE TABLE ${table} AS SELECT * FROM read_parquet(${file})`)
      return
    }
    // Spatial first, when the engine has it: without it a CRS stays spelt out
    // in full (PROJJSON), and counts as different from the same CRS by name.
    try {
      await sql.loadSpatial?.()
    } catch {
      // The table loads anyway; spatial SQL on it will say why it can't run.
    }
    await withoutGeoParquet(async () => {
      const present = new Set((await sql.query(`DESCRIBE SELECT * FROM read_parquet(${file})`)).rows.map(([name]) => name))
      const geometry = Object.entries(geo.columns ?? {})
        .filter(([name, column]) => present.has(name) && String(column?.encoding).toUpperCase() === 'WKB')
        .map(([name, column]) => `${geometryOf(quote(name), column)} AS ${quote(name)}`)
      const replace = geometry.length ? ` REPLACE (${geometry.join(', ')})` : ''
      await sql.query(`CREATE TABLE ${table} AS SELECT *${replace} FROM read_parquet(${file})`)
    })
  }

  // A query's rows to a new Parquet file. DuckDB writes each GEOMETRY
  // column's CRS in GeoParquet's `geo` metadata, so it travels with the
  // table, but it leaves `crs` out for a column with none, and GeoParquet
  // reads no `crs` as OGC:CRS84 (longitude/latitude). So when a column has
  // no CRS, the file is written again with its `crs` an explicit null, which
  // reads back as unknown. Resolves to the number of rows.
  async function writeParquet(select, path) {
    const rowCount = await copyTo(sql, select, path, 'FORMAT parquet')
    const untagged = (await sql.query(`DESCRIBE ${select}`)).rows
      .filter(([, type]) => String(type) === 'GEOMETRY')
      .map(([name]) => name)
    if (!untagged.length) return rowCount
    const geo = (await geoOfFile(path)) ?? { version: '1.0.0', primary_column: untagged[0], columns: {} }
    for (const name of untagged) geo.columns[name] = { encoding: 'WKB', geometry_types: [], ...geo.columns[name], crs: null }
    await sql.dropFile(path)
    await copyTo(sql, select, path, `FORMAT parquet, KV_METADATA {geo: ${literal(JSON.stringify(geo))}}`)
    return rowCount
  }

  // A registered Parquet file's `geo` metadata (parsed), or null. DuckDB's
  // GeoParquet reading is off for it, since it fails on CRS84 (see
  // readParquet) even here.
  async function geoOfFile(path) {
    const { rows } = await withoutGeoParquet(() => sql.query(
      `SELECT decode(value) FROM parquet_kv_metadata(${literal(path)}) WHERE decode(key) = 'geo'`,
    ))
    try {
      const geo = rows.length ? JSON.parse(rows[0][0]) : null
      return geo && typeof geo === 'object' && geo.columns && typeof geo.columns === 'object' ? geo : null
    } catch {
      return null
    }
  }

  // `job` with DuckDB's GeoParquet reading off: a file's geometry reads as
  // WKB, and nothing looks at its CRS.
  async function withoutGeoParquet(job) {
    await sql.query('SET enable_geoparquet_conversion = false')
    try {
      return await job()
    } finally {
      await sql.query('SET enable_geoparquet_conversion = true')
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

  // A page of a table for Data. A geometry cell says what the geometry is,
  // not its bytes: its type, and its area or length on the ellipsoid
  // ("POLYGON · 1.75 ha"), with its WKT in `wkt` (by row, then column) to show
  // on hover. `geometry` (by column) has each geometry column's CRS, types,
  // and counts of empty and invalid geometries in the whole table.
  async function preview(table, page) {
    const rowCount = Number((await sql.query(`SELECT count(*) FROM ${table}`)).rows[0][0])
    const described = (await sql.query(`DESCRIBE ${table}`)).rows.map(([name, type]) => ({ name, crs: crsOfType(type) }))
    const paged = { rowCount, page, pageSize: PAGE_SIZE, hasMore: (page + 1) * PAGE_SIZE < rowCount }
    const window = `LIMIT ${PAGE_SIZE} OFFSET ${page * PAGE_SIZE}`
    const columns = described.map((c) => c.name)
    if (!described.some(isGeometryColumn)) {
      const { rows } = await sql.query(`SELECT * FROM ${table} ${window}`)
      return { columns, rows, ...paged }
    }
    return { columns, ...(await geometryPage(table, described, window)), ...paged }
  }

  // What the host's readers (flowGraph's addOutputReader) make of an output
  // table, by reader name: whatever each returns (null for nothing), or
  // { error } for one that throws. Each gets { table, columns, query }: the
  // table's name to put in SQL, its columns ({ name, type, crs }, crs as for
  // a geometry column's type in geoExport.js, undefined for other columns),
  // and `query(sql)` on the SQL engine. Null without readers.
  async function readOutput(table, readers) {
    if (!readers?.size) return null
    const columns = (await sql.query(`DESCRIBE ${table}`)).rows.map(([name, type]) => ({ name, type: String(type), crs: crsOfType(type) }))
    const extras = {}
    for (const [name, read] of readers) {
      try {
        extras[name] = (await read({ table, columns, query: (text) => sql.query(text) })) ?? null
      } catch (e) {
        extras[name] = { error: message(e) }
      }
    }
    return extras
  }

  // A page with geometry: { rows, wkt, geometry }. Measuring needs the
  // spatial extension and a CRS PROJ can transform; failing that, a geometry
  // shows its type, and failing that (no extension), its WKT.
  async function geometryPage(table, described, window) {
    for (const level of ['measured', 'typed', 'text']) {
      try {
        const exprs = described.flatMap((c) => (isGeometryColumn(c) ? geometryCells(c, level) : [quote(c.name)]))
        const { rows } = await sql.query(`SELECT ${exprs.map((e, i) => `${e} AS c${i}`).join(', ')} FROM ${table} ${window}`)
        const cells = []
        const wkt = []
        for (const row of rows) {
          const shown = []
          const hover = []
          let at = 0
          for (const c of described) {
            if (!isGeometryColumn(c)) {
              shown.push(row[at++])
              hover.push(null)
              continue
            }
            const [text, type, empty, area, length] = row.slice(at, at + 5)
            at += 5
            const whole = text !== null && text.length > WKT_SHOWN ? `${text.slice(0, WKT_SHOWN)}…` : text
            const measured = measure(area, length)
            shown.push(text === null ? null : !type ? whole.slice(0, 60) : empty ? `${type} EMPTY` : measured ? `${type} · ${measured}` : type)
            hover.push(whole)
          }
          cells.push(shown)
          wkt.push(hover)
        }
        return { rows: cells, wkt, geometry: level === 'text' ? described.map(() => null) : await geometryInfo(table, described) }
      } catch (e) {
        if (level === 'text') throw e
      }
    }
  }

  // A geometry column's cells for a page: its WKT (cut short), type, whether
  // it's empty, and its area and length in metres on the ellipsoid, from
  // longitude and latitude (EPSG:4326, x, y). A CRS that isn't known can't be
  // measured; lines have no area, polygons no length, points neither.
  function geometryCells(column, level) {
    const g = quote(column.name)
    const text = `left(ST_AsText(${g}), ${WKT_SHOWN + 1})`
    if (level === 'text') return [text, 'NULL', 'NULL', 'NULL', 'NULL']
    const typed = [text, `ST_GeometryType(${g})::VARCHAR`, `ST_IsEmpty(${g})`]
    if (level === 'typed' || column.crs === null) return [...typed, 'NULL', 'NULL']
    const lonLat = ['EPSG:4326', 'OGC:CRS84'].includes(column.crs) ? g : `ST_Transform(${g}, 'EPSG:4326')`
    return [
      ...typed,
      `CASE WHEN ST_Dimension(${g}) = 2 THEN ST_Area_Spheroid(${lonLat}) END`,
      `CASE WHEN ST_Dimension(${g}) = 1 THEN ST_Length_Spheroid(${lonLat}) END`,
    ]
  }

  // Each column's geometry info for Data's header: null for a column that
  // isn't geometry, else { crs, types, z, empty, invalid } over the whole
  // table (just { crs } if they can't be counted).
  async function geometryInfo(table, described) {
    const geometry = described.filter(isGeometryColumn)
    const exprs = geometry.flatMap((c) => {
      const g = quote(c.name)
      return [
        `list(DISTINCT ST_GeometryType(${g})::VARCHAR ORDER BY ST_GeometryType(${g})::VARCHAR) FILTER (WHERE ${g} IS NOT NULL)`,
        `coalesce(bool_or(ST_HasZ(${g})), false)`,
        `count(*) FILTER (WHERE ST_IsEmpty(${g}))`,
        `count(*) FILTER (WHERE NOT ST_IsEmpty(${g}) AND NOT ST_IsValid(${g}))`,
      ]
    })
    let counted = null
    try {
      counted = (await sql.query(`SELECT ${exprs.join(', ')} FROM ${table}`)).rows[0]
    } catch {
      // The header shows the CRS alone.
    }
    return described.map((c) => {
      if (!isGeometryColumn(c)) return null
      const i = geometry.indexOf(c) * 4
      if (!counted) return { crs: c.crs }
      return { crs: c.crs, types: counted[i] ?? [], z: Boolean(counted[i + 1]), empty: Number(counted[i + 2]), invalid: Number(counted[i + 3]) }
    })
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
    const scratchTables = [] // and tables made
    await sql.registerFile(path, bytes)
    try {
      const sources = await tableQueries(format, path, bytes, fileName, scratch, scratchTables)
      const tables = []
      const used = []
      for (const [i, { label, select }] of sources.entries()) {
        const name = uniqueId(toIdentifier(label) || 'table', used)
        used.push(name)
        const out = `${path}-${i}.parquet`
        scratch.push(out)
        const rowCount = await writeParquet(select, out)
        tables.push({ name, label, rowCount, bytes: await sql.readFile(out) })
      }
      return tables
    } finally {
      for (const file of [path, ...scratch]) await sql.dropFile(file)
      for (const table of scratchTables) await sql.query(`DROP TABLE IF EXISTS ${table}`)
    }
  }

  // A SELECT per table in the file: [{ label, select }].
  async function tableQueries(format, path, bytes, fileName, scratch, scratchTables) {
    const file = literal(path)
    const one = (select) => [{ label: fileName.replace(/\.[^.]*$/, ''), select }]
    if (FILE_FORMATS[format].geo) return geoQueries(format, path, bytes, fileName, scratch)
    switch (format) {
      case 'csv': return one(`SELECT * FROM read_csv(${file})`)
      case 'tsv': return one(`SELECT * FROM read_csv(${file}, delim = '\t')`)
      case 'json': return one(`SELECT * FROM read_json_auto(${file})`)
      // A GeoParquet file's geometry keeps its CRS (see readParquet).
      case 'parquet': {
        const table = `main.${quote(`flow-upload-${Date.now()}`)}`
        scratchTables.push(table)
        await readParquet(path, table)
        return one(`SELECT * FROM ${table}`)
      }
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

  // A geo file's layers, each through DuckDB's spatial extension (ST_Read), so
  // holes, multi-part features and points are kept as they are, and each
  // geometry column carries its CRS (KML's is EPSG:4326 by its standard; a
  // shapefile's from its .prj). A zip's shapefiles are registered member by
  // member, since DuckDB-wasm can't open a zip itself.
  async function geoQueries(format, path, bytes, fileName, scratch) {
    let sources = [path]
    if (format === 'shapefile') {
      sources = []
      for (const member of await unzip(bytes)) {
        if (member.name.startsWith('__MACOSX/')) continue // macOS's resource forks
        const memberPath = `${path}.files/${member.name}`
        await sql.registerFile(memberPath, member.bytes)
        scratch.push(memberPath)
        if (/\.shp$/i.test(member.name)) sources.push(memberPath)
      }
      if (!sources.length) throw new Error('There\'s no shapefile (.shp) in this zip.')
    }
    const layers = []
    for (const source of sources) {
      const meta = await sql.query(`SELECT unnest(layers).name FROM ST_Read_Meta(${literal(source)})`)
      for (const [layer] of meta.rows) layers.push({ layer, read: `ST_Read(${literal(source)}, layer := ${literal(layer)})` })
    }
    if (!layers.length) throw new Error('It has no layers.')
    const queries = []
    try {
      for (const { layer, read } of layers) {
        queries.push({
          label: layers.length === 1 ? fileName.replace(/\.[^.]*$/, '') : layer,
          ...(await geoSelect(read)),
        })
      }
    } catch (e) {
      // GDAL reads a GeoPackage without its feature counts on a thread of its
      // own, which DuckDB-wasm can't start.
      if (format === 'gpkg' && /thread constructor failed/.test(message(e))) {
        throw new Error(
          'This GeoPackage has no feature counts (GDAL\'s gpkg_ogr_contents table), which reading it here needs. ' +
            'Save it again with QGIS or ogr2ogr, which add them, and choose it again.',
        )
      }
      throw e
    }
    return queries
  }

  // One layer's SELECT: its geometry column called `geometry` (ST_Read calls
  // it `geom`) unless that name is taken, and made 2D when every height in
  // it is 0 (KML writes ",0" after each point), so it keeps real heights only.
  // GDAL's OGC_FID (a feature's number, which every format gets) is left out;
  // a GeoPackage's own `fid` is kept. Geometry with no CRS (a shapefile
  // without .prj) keeps none: see writeParquet. So does a GeoPackage's
  // "undefined" SRS (srs_id -1 or 0), which GDAL reports as a CRS of that name.
  async function geoSelect(read) {
    const { rows } = await sql.query(`DESCRIBE SELECT * FROM ${read}`)
    const columns = rows.map(([name, type]) => ({ name, crs: crsOfType(type) }))
    const taken = new Set(columns.map((c) => c.name.toLowerCase()))
    const exprs = []
    for (const c of columns) {
      if (c.name === 'OGC_FID') continue // GDAL's own numbering of the features, not the file's
      if (!isGeometryColumn(c)) {
        exprs.push(quote(c.name))
        continue
      }
      const name = c.name === 'geom' && !taken.has('geometry') ? 'geometry' : c.name
      const g = quote(c.name)
      const [[withZ, nonZero]] = (await sql.query(
        `SELECT count(*) FILTER (WHERE ST_HasZ(${g})), ` +
          `count(*) FILTER (WHERE ST_HasZ(${g}) AND (ST_ZMin(${g}) <> 0 OR ST_ZMax(${g}) <> 0)) FROM ${read}`,
      )).rows
      const flat = Number(withZ) && !Number(nonZero) ? `ST_Force2D(${g})` : g
      exprs.push(`${isUndefinedCrs(c.crs) ? `CAST(${flat} AS GEOMETRY)` : flat} AS ${quote(name)}`)
    }
    return { select: `SELECT ${exprs.join(', ')} FROM ${read}` }
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
