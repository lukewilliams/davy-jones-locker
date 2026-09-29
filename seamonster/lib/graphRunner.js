import { FILE_FORMATS, formatFromName, withExtension } from './fileFormats.js'
import { runJavaScript } from './jsSandbox.js'
import { isKnownKind, kindInfo, referenceName, toIdentifier, uniqueId } from './nodeKinds.js'
import { repairXlsx, xlsxSheetNames } from './xlsx.js'

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

const quote = (name) => `"${name.replaceAll('"', '""')}"`
const literal = (text) => `'${text.replaceAll("'", "''")}'`
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
 * JavaScript runs in a sandbox here (jsSandbox.js). Two things run on
 * the server, through FlowgraphEditor's `server` ({ query, runPython }, see
 * davy-jones-locker's engine client), their inputs sent as Parquet: PythonScript, and
 * SQL that reads tables its inputs don't supply (serverTables). Some kinds
 * can't run yet. Runs (and file reads) are queued, one at a time.
 *
 * A result is one of (as in the spec, §12, plus `tables` and `value`):
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
  // (graphDocument.js). `paged` ({ id, page, table? }) picks the page of one
  // target's output; the rest show their first page. `getFile(key)` returns
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
      const sources = [...new Set(inputs.get(id) ?? [])]
      const failed = sources.find((source) => results[source].error)
      if (failed) {
        results[id] = { error: `Upstream node ${failed} failed.` }
        continue
      }
      const node = nodes.get(id)
      const page = paged?.id === id ? paged : { page: 0 }
      try {
        await exposeInputs(sources.map((s) => nodes.get(s)), outputs)
        results[id] = await runNode(node, sources.map((s) => nodes.get(s)), page, context)
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

  function runNode(node, sources, page, context) {
    switch (node.kind) {
      case 'sql-query': return runSql(node, sources, page, context)
      case 'data-ingest': return runIngest(node, page, context)
      case 'data-export': return runExport(node, sources, context)
      case 'javascript': return runJs(node, sources, page, context)
      case 'python-script': return runPython(node, sources, page, context)
      default:
        return {
          error: isKnownKind(node.kind)
            ? `${kindInfo(node.kind).label} nodes can't run yet.`
            : `This app doesn't have ${node.kind} nodes, so this one can't run here. It's kept as it was, and saving the graph keeps it.`,
        }
    }
  }

  // ---- To and from the server ----

  // The tables a query reads that its inputs don't supply, so it runs on the
  // server: `orders`, `sales.orders`. `inputs` are [{ name, tables? }], the
  // reference names wired in (and table names, for an input with several).
  // Read by DuckDB's own parser; a query it can't parse counts as local, and
  // fails here saying why.
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
    const names = new Set(inputs.map((i) => lower(i.name)))
    const schemas = new Map(inputs.filter((i) => i.tables).map((i) => [lower(i.name), new Set(i.tables.map(lower))]))
    const read = []
    const ctes = new Set()
    walk(tree, (node) => {
      for (const { key } of node.cte_map?.map ?? []) ctes.add(lower(key))
      if (node.type === 'BASE_TABLE') read.push(node)
    })
    const local = ({ catalog_name: catalog, schema_name: schema, table_name: table }) => {
      if (catalog) return LOCAL_CATALOGS.has(lower(catalog))
      if (schema) return LOCAL_SCHEMAS.has(lower(schema)) || !!schemas.get(lower(schema))?.has(lower(table))
      return names.has(lower(table)) || ctes.has(lower(table))
    }
    const remote = read.filter((t) => !local(t)).map((t) => [t.catalog_name, t.schema_name, t.table_name].filter(Boolean).join('.'))
    return [...new Set(remote)]
  }

  // Each node wired in, as Parquet, named as the node reads it.
  async function parquetInputs(sources, outputs) {
    const inputs = []
    for (const source of sources) {
      const name = referenceName(source.id, source)
      const output = outputs.get(source.id)
      if (output.table) inputs.push({ name, bytes: await parquetOf(output.table) })
      else for (const t of output.tables) inputs.push({ name: `${name}.${t.name}`, bytes: await parquetOf(t.table) })
    }
    return inputs
  }

  async function parquetOf(table) {
    const path = `flow-send-${Date.now()}-${Math.random().toString(36).slice(2)}.parquet`
    await copyTo(`SELECT * FROM ${table}`, path, 'FORMAT parquet')
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

  const connected = (server, method) => server.state === 'connected' && typeof server[method] === 'function'

  // A PythonScript node, run by the server in its sandbox. The last
  // expression's value is its output: a DataFrame as its table, anything else
  // shown as a value (with an empty table downstream).
  async function runPython(node, sources, page, { outputs, server }) {
    if (!connected(server, 'runPython')) {
      return { error: "PythonScript nodes run on the server, which isn't available. Every other kind runs here in the browser." }
    }
    const code = node.pythonCode ?? ''
    if (!code.trim()) return { error: 'Write some code first.' }
    const result = await server.runPython({ code, inputs: await parquetInputs(sources, outputs) })
    const output = result.output ?? ''
    if (result.error) return { error: result.error, output }

    const table = `${OUTPUTS}.${quote(node.id)}`
    if (result.table) await loadParquet(table, result.table)
    else await sql.query(`CREATE TABLE ${table} AS SELECT NULL::VARCHAR AS value WHERE false`)
    outputs.set(node.id, { table })
    const extra = { output, variables: result.variables ?? [] }
    return result.table
      ? { data: await preview(table, page.page), ...extra }
      : { value: result.value ?? { kind: 'none' }, ...extra }
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

  // A JavaScript node: its code runs in the sandbox with each wired-in node as
  // a variable named by its reference name. Returning an array of rows makes
  // its table; returning nothing makes an empty one (what it printed is its
  // output).
  async function runJs(node, sources, page, { outputs }) {
    const code = node.jsCode ?? ''
    if (!code.trim()) return { error: 'Write some code first.' }
    const inputs = {}
    for (const source of sources) inputs[referenceName(source.id, source)] = await inputValue(outputs.get(source.id))

    let value
    let logs
    try {
      ;({ value, logs } = await runJavaScript(code, inputs))
    } catch (e) {
      return { error: message(e), output: (e.logs ?? []).join('\n') }
    }
    const output = logs.join('\n')
    if (value !== undefined && !Array.isArray(value)) {
      return { error: 'Return an array of rows (objects, one per row) to output a table, or return nothing.', output }
    }

    const table = `${OUTPUTS}.${quote(node.id)}`
    const records = (value ?? []).map((row) => (row !== null && typeof row === 'object' && !Array.isArray(row) ? row : { value: row }))
    if (records.length) {
      const path = `flow-js-${node.id}-${Date.now()}.json`
      await sql.registerFile(path, new TextEncoder().encode(JSON.stringify(records)))
      try {
        await sql.query(`CREATE TABLE ${table} AS SELECT * FROM read_json_auto(${literal(path)}, format = 'array')`)
      } finally {
        await sql.dropFile(path)
      }
    } else {
      await sql.query(`CREATE TABLE ${table} AS SELECT NULL::VARCHAR AS value WHERE false`)
    }
    outputs.set(node.id, { table })
    return value === undefined ? { output } : { data: await preview(table, page.page), output }
  }

  // Show a node's query only the outputs of `sources`, the nodes wired into it.
  async function exposeInputs(sources, outputs) {
    for (const schema of [INPUTS, ...inputSchemas]) await sql.query(`DROP SCHEMA IF EXISTS ${quote(schema)} CASCADE`)
    inputSchemas = []
    await sql.query(`CREATE SCHEMA ${INPUTS}`)
    // Set after each re-creation: it finds the schema itself, not by name.
    await sql.query(`SET search_path = '${INPUTS},main'`)
    for (const source of sources) {
      const name = referenceName(source.id, source)
      const output = outputs.get(source.id)
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

  // A SQLQuery node: here, over its inputs, unless it reads tables they don't
  // supply; then on the server, over the query database, with its inputs sent.
  async function runSql(node, sources, page, { outputs, server }) {
    const query = (node.sqlQuery ?? '').trim().replace(/;+\s*$/, '')
    if (!query) return { error: 'Write a query first.' }
    const table = `${OUTPUTS}.${quote(node.id)}`
    const remote = await serverTables(query, sources.map((s) => inputNames(s, outputs.get(s.id))))
    if (!remote.length) {
      await sql.query(`CREATE TABLE ${table} AS ${query}`)
    } else if (connected(server, 'query')) {
      await loadParquet(table, await server.query({ sql: query, inputs: await parquetInputs(sources, outputs) }))
    } else {
      const which = remote.length === 1 ? `${remote[0]}, which isn't` : `${remote.join(', ')}, which aren't`
      return { error: `This query reads ${which} wired in, so it runs on the server, which isn't available.` }
    }
    outputs.set(node.id, { table })
    return { data: await preview(table, page.page) }
  }

  // How a node wired in is named in a query: its reference name, and its
  // tables' names when it has several.
  function inputNames(source, output) {
    return { name: referenceName(source.id, source), tables: output?.tables?.map((t) => t.name) ?? null }
  }

  // A DataIngest node's tables were read from its file when it was chosen
  // (readFile below) and stored as Parquet; this loads them.
  async function runIngest(node, page, { outputs, getFile }) {
    const ingest = node.ingest
    if (!ingest) return { error: 'Choose a file first.' }
    const tables = []
    for (const stored of ingest.tables) {
      const bytes = await getFile(stored.key)
      if (!bytes) return { error: `The data read from "${ingest.fileName}" isn't stored any more. Choose the file again.` }
      const path = `flow-ingest-${stored.key}.parquet`
      await sql.registerFile(path, bytes)
      const table = `${OUTPUTS}.${quote(`${node.id}/${stored.name}`)}`
      try {
        await sql.query(`CREATE TABLE ${table} AS SELECT * FROM read_parquet(${literal(path)})`)
      } finally {
        await sql.dropFile(path)
      }
      tables.push({ ...stored, table })
    }

    if (!FILE_FORMATS[ingest.format].multi) {
      outputs.set(node.id, { table: tables[0].table })
      return { data: await preview(tables[0].table, page.page) }
    }
    outputs.set(node.id, { tables })
    const shown = []
    for (const t of tables) {
      const data = await preview(t.table, page.table === t.name ? page.page : 0)
      shown.push({ name: t.name, label: t.label, data })
    }
    return { tables: shown }
  }

  // Write a node wired in to a file, and pass its data on unchanged. With one
  // wired in, that one; with several, the one named by `exportInput`.
  async function runExport(node, sources, { outputs }) {
    const picked = pickExportInput(node, sources, outputs)
    if (picked.error) return picked
    const { source, input } = picked
    const typed = (node.exportFilename ?? '').trim() || 'export'
    const format = node.exportFormat || formatFromName(typed) || 'csv'
    const filename = withExtension(typed, format)
    const spec = FILE_FORMATS[format]
    const tables = input.table ? [{ name: toIdentifier(source.id) || 'data', table: input.table }] : input.tables
    if (tables.length > 1 && spec.multi !== 'read-write') {
      return {
        error: `${spec.label} holds one table, and ${source.id} has ${tables.length}. ` +
          'Put a SQLQuery node in between to pick one.',
      }
    }

    const bytes = await writeFile(format, tables, filename)
    outputs.set(node.id, input)
    return { export: { filename, contentType: spec.contentType, size: bytes.length, bytes } }
  }

  // The input a DataExport node writes: its only one, or the one `exportInput`
  // names, by reference name (sqlnode1_data) or ID; <name>.<table> picks one
  // table of several. Resolves to { source, input } or { error }.
  function pickExportInput(node, sources, outputs) {
    if (!sources.length) return { error: 'Wire a node into this one to export its data.' }
    const names = sources.map((s) => referenceName(s.id, s))
    const choice = (node.exportInput ?? '').trim()
    if (!choice) {
      if (sources.length > 1) {
        return { error: `${sources.length} nodes are wired in (${names.join(', ')}). Name the one to write under Input.` }
      }
      return { source: sources[0], input: outputs.get(sources[0].id) }
    }
    const byName = (name) => sources.find((s, i) => names[i] === name || s.id === name)
    // The whole of it as a name first: an ID typed into Manage can hold a dot.
    let source = byName(choice)
    let tableName = null
    if (!source && choice.includes('.')) {
      source = byName(choice.slice(0, choice.lastIndexOf('.')))
      tableName = choice.slice(choice.lastIndexOf('.') + 1)
    }
    if (!source) return { error: `No input called "${choice}" is wired in. Wired in: ${names.join(', ')}.` }

    const input = outputs.get(source.id)
    if (!tableName) return { source, input }
    const table = input.tables?.find((t) => t.name === tableName)
    if (!table) {
      const has = input.tables ? `its tables are ${input.tables.map((t) => t.name).join(', ')}` : 'it has one table'
      return { error: `${source.id} has no table called "${tableName}": ${has}.` }
    }
    return { source, input: { table: table.table } }
  }

  async function writeFile(format, tables, filename) {
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
    if (format === 'xlsx') await loadExcel()
    const path = `flow-export-${Date.now()}-${filename}`
    await copyTo(`SELECT * FROM ${tables[0].table}`, path, options)
    try {
      const bytes = await sql.readFile(path)
      return format === 'xlsx' ? repairXlsx(bytes) : bytes
    } finally {
      await sql.dropFile(path)
    }
  }

  // COPY a query's rows to a new file, which the engine holds for readFile.
  // (DuckDB-wasm logs "Buffering missing file" for it: harmless, and
  // registering the file first would stop it being written.) Resolves to the
  // number of rows written.
  async function copyTo(select, path, options) {
    const copied = await sql.query(`COPY (${select}) TO ${literal(path)} (${options})`)
    return Number(copied.rows[0]?.[0] ?? 0)
  }

  async function loadExcel() {
    await sql.query('INSTALL excel')
    await sql.query('LOAD excel')
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
        const rowCount = await copyTo(select, out, 'FORMAT parquet')
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
        await loadExcel()
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

// The targets and everything upstream of them, each after its inputs, and
// each node's inputs (source node IDs).
function upstreamOrder(doc, targetIds) {
  const inputs = new Map()
  for (const e of doc.edges) {
    if (!inputs.has(e.target)) inputs.set(e.target, [])
    inputs.get(e.target).push(e.source)
  }
  const order = []
  const seen = new Set()
  const visit = (id) => {
    if (seen.has(id)) return
    seen.add(id)
    for (const source of inputs.get(id) ?? []) visit(source)
    order.push(id)
  }
  targetIds.forEach(visit)
  return { order, inputs }
}
