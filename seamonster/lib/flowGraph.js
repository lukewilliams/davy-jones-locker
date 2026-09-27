import { computed, reactive } from 'vue'
import { useVueFlow } from '@vue-flow/core'
import { FILE_FORMATS, formatFromName } from './fileFormats.js'
import { EMPTY_DOCUMENT, fromDocument, toDocument } from './graphDocument.js'
import { createGraphRunner } from './graphRunner.js'
import { isTyping } from './keyboard.js'
import { isAutoId, nextNodeId, referenceName, toIdentifier, uniqueId } from './nodeKinds.js'

export const FLOW_GRAPH = Symbol('flow-graph')

// Node size (--flow-node-width/height), for placing a new node by a point on it.
const NODE_WIDTH = 190
const NODE_HEIGHT = 90

// Points on a node, as fractions of its size (see addNode).
const INPUT_PIN = { x: 0, y: 0.5 }
const OUTPUT_PIN = { x: 1, y: 0.5 }

// Data fields that don't change what a node outputs: editing them doesn't
// make its result stale. (sqlServerTables is worked out from the query.)
const COSMETIC_FIELDS = new Set(['label', 'autoRun', 'sqlServerTables'])

const message = (e) => e?.message ?? String(e)
const newKey = () => `${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 10)}`

/*
 * The graph shown in one editor: its nodes and wires, and the edits made to
 * them. Must be created in the setup of a component above the canvas: the Vue
 * Flow store it creates is provided to that component's descendants, and the
 * canvas's <VueFlow> picks it up.
 *
 * Nodes are Vue Flow nodes of type 'pipeline' with `data: { kind, label?,
 * outputSuffix?, autoRun?, ... }` plus each kind's own fields (sqlQuery;
 * ingest, ingestFormat; exportFilename, exportFormat); wires are edges of type
 * 'wire'. One node or wire is selected at a time. Deletions can be undone
 * (Ctrl+Z), most recent first; no other edit can.
 *
 * Nodes run on `sql`, the host's SQL engine (see graphRunner.js), which fills
 * `run`. It isn't saved: whether anything has run yet (`started`), and per
 * node ID its `status` and last `result`. Status is 'running', 'completed',
 * 'failed', or 'stale' (it ran, but its settings or inputs have changed since;
 * so has everything downstream of it); none is idle.
 *
 * A DataIngest node keeps the tables read from its file, not the file, stored
 * by key in `files` (the host's storage, if it has putFile / getFile /
 * deleteFile) and held in memory once used.
 *
 * `server` is the server engine as the host sees it: { status: { state, address,
 * assistant }, query, runPython, assist } (see graphRunner.js, and davy-jones-locker's
 * engine client), status reactive, state being 'checking', 'connected' or
 * 'unavailable'. Without it, there's no server: everything runs in the
 * browser, and what can't doesn't run. `assist` and status.assistant ({ model,
 * sampleRows }) are the AI assistant, when the server has one set up.
 *
 * A SQLQuery node that reads tables its inputs don't supply runs on the
 * server; which tables those are is kept in its data (sqlServerTables),
 * refreshed whenever its query or what's wired into it changes.
 */
export function createFlowGraph({ sql = null, files = null, server = null } = {}) {
  const flow = useVueFlow()
  const runner = createGraphRunner(sql)
  const serverStatus = computed(() => ({
    state: server?.status?.state ?? 'unavailable',
    address: server?.status?.address ?? null,
    assistant: (typeof server?.assist === 'function' && server?.status?.assistant) || null,
  }))
  const deletions = [] // undo stack of { nodes, edges }
  let contextPoint = { x: 0, y: 0 } // client coordinates of the last right-click on the canvas
  const run = reactive({ started: false, executing: false, status: {}, results: {} })
  // Edits per node ID that could change its output: a node edited while it
  // ran comes back stale.
  const edits = new Map()
  const fileCache = new Map() // stored file data by key
  const originals = new WeakMap() // node -> the file chosen for it this session, to read again

  const selectedNode = computed(() => flow.getSelectedNodes.value[0] ?? null)

  // IDs in use, including deleted nodes that undo could bring back.
  const usedIds = () => [...flow.nodes.value, ...deletions.flatMap((d) => d.nodes)].map((n) => n.id)

  function makeNode(kind, position) {
    return { id: nextNodeId(kind, usedIds()), type: 'pipeline', position, data: { kind } }
  }

  function makeEdge({ source, sourceHandle, target, targetHandle }) {
    return {
      id: `${source}.${sourceHandle}-${target}.${targetHandle}`,
      type: 'wire',
      source,
      sourceHandle,
      target,
      targetHandle,
    }
  }

  // The graph as a saved document (see graphDocument.js); recomputed as it's edited.
  const snapshot = computed(() => toDocument(flow.nodes.value, flow.edges.value, flow.viewport.value))

  // Show a saved document (an empty graph if it isn't one), in its saved view,
  // or else fitted once its nodes are measured, no closer than 100% zoom.
  function load(doc) {
    const { nodes, edges, viewport } = fromDocument(doc) ?? fromDocument(EMPTY_DOCUMENT)
    deletions.length = 0
    edits.clear()
    Object.assign(run, { started: false, executing: false, status: {}, results: {} })
    flow.setNodes(nodes)
    flow.setEdges(edges.map(makeEdge))
    // SQL nodes saved before their server tables were worked out.
    for (const n of nodes) {
      if (n.data.kind === 'sql-query' && n.data.sqlQuery && !n.data.sqlServerTables) refreshServerTables(n.id)
    }
    if (viewport) {
      flow.setViewport(viewport)
    } else if (nodes.length) {
      const { off } = flow.onNodesInitialized(() => {
        flow.fitView({ maxZoom: 1 })
        off()
      })
    }
  }

  function setContextPoint(e) {
    contextPoint = { x: e.clientX, y: e.clientY }
  }

  // Add a node at a point in client coordinates (the last right-click on the
  // canvas by default). `grab` is the point on the node that lands there, as
  // fractions of its size: the top-left corner by default.
  function addNode(kind, point = contextPoint, grab = { x: 0, y: 0 }) {
    const p = flow.screenToFlowCoordinate(point)
    const position = { x: p.x - grab.x * NODE_WIDTH, y: p.y - grab.y * NODE_HEIGHT }
    const node = makeNode(kind, position)
    flow.addNodes(node)
    return node
  }

  // Add a node where a wire dragged from `from` ({ nodeId, handleId, handleType })
  // was dropped, wired to it: the new node's first pin of the opposite type,
  // which lands at the drop point.
  function addConnectedNode(kind, point, from) {
    const fromOutput = from.handleType === 'source'
    const node = addNode(kind, point, fromOutput ? INPUT_PIN : OUTPUT_PIN)
    const [source, target] = fromOutput
      ? [from, { nodeId: node.id, handleId: 'target-0' }]
      : [{ nodeId: node.id, handleId: 'source-0' }, from]
    connect({
      source: source.nodeId,
      sourceHandle: source.handleId,
      target: target.nodeId,
      targetHandle: target.handleId,
    })
  }

  function connect(connection) {
    flow.addEdges(makeEdge(connection))
    markStale(connection.target)
  }

  // Nodes downstream of `id`, following wires.
  function downstreamOf(id) {
    const found = new Set()
    const stack = [id]
    while (stack.length) {
      const from = stack.pop()
      for (const e of flow.edges.value) {
        if (e.source === from && !found.has(e.target)) {
          found.add(e.target)
          stack.push(e.target)
        }
      }
    }
    return [...found]
  }

  // Whether a path of wires already leads from `from` to `to`.
  const reaches = (from, to) => from === to || downstreamOf(from).includes(to)

  // The graph must stay acyclic: no wire back into a node's own upstream.
  const isValidConnection = ({ source, target }) => !reaches(target, source)

  // A node's output no longer matches its settings or inputs: it (unless
  // `self` is false) and everything downstream that has run become stale.
  // (A SQL node among them may now read different tables from the server.)
  function markStale(id, { self = true } = {}) {
    for (const n of [...(self ? [id] : []), ...downstreamOf(id)]) {
      edits.set(n, (edits.get(n) ?? 0) + 1)
      if (run.status[n] === 'completed' || run.status[n] === 'failed') run.status[n] = 'stale'
      if (flow.findNode(n)?.data.kind === 'sql-query') refreshServerTables(n)
    }
  }

  // Work out again which tables a SQL node reads from the server.
  async function refreshServerTables(id) {
    const node = flow.findNode(id)
    if (!node || !sql) return
    const sources = [...new Set(flow.edges.value.filter((e) => e.target === id).map((e) => e.source))]
      .map((s) => flow.findNode(s))
      .filter(Boolean)
      .map((s) => ({
        name: referenceName(s.id, s.data),
        tables: s.data.ingest && FILE_FORMATS[s.data.ingest.format].multi ? s.data.ingest.tables.map((t) => t.name) : null,
      }))
    const tables = await runner.serverTables(node.data.sqlQuery ?? '', sources)
    if (flow.findNode(id) !== node) return // deleted or renamed meanwhile
    // Kept even when empty, so a graph opened later knows it's been worked out.
    const previous = node.data.sqlServerTables
    if (!previous || tables.join('\n') !== previous.join('\n')) {
      flow.updateNodeData(id, { sqlServerTables: tables })
    }
  }

  // Back to not run: the node's status and result are cleared, and whatever
  // ran downstream of it is stale.
  function resetNode(id) {
    delete run.status[id]
    delete run.results[id]
    edits.set(id, (edits.get(id) ?? 0) + 1)
    markStale(id, { self: false })
  }

  // Give a node a new ID, which its wires (and any in the undo stack) follow.
  // Other nodes' SQL or Python that names the old ID isn't rewritten, so
  // they're stale.
  function applyRename(id, nextId) {
    if (nextId === id) return
    const follow = (e) => {
      const swap = (end) => (end === id ? nextId : end)
      return makeEdge({ ...e, source: swap(e.source), target: swap(e.target) })
    }
    // Vue Flow looks nodes up by ID from its reactive list, so this renames it
    // in place (staying selected); setEdges rebuilds the wires and their lookup.
    flow.findNode(id).id = nextId
    flow.setEdges(flow.edges.value.map(follow))
    for (const d of deletions) d.edges = d.edges.map(follow)
    for (const byId of [run.status, run.results]) {
      if (!(id in byId)) continue
      byId[nextId] = byId[id]
      delete byId[id]
    }
    if (edits.has(id)) edits.set(nextId, edits.get(id))
    markStale(nextId, { self: false })
  }

  // The ID typed into Manage. Returns an error message, or null once renamed.
  function renameNode(id, nextId) {
    nextId = nextId.trim()
    if (!nextId) return 'ID cannot be empty.'
    if (nextId === id) return null
    if (usedIds().includes(nextId)) return 'Another node already uses this ID.'
    applyRename(id, nextId)
    return null
  }

  // Name a node (empty clears it). While its ID is still the generated one
  // (sqlnode1), the ID follows the name as an identifier: "Sales 2024" ->
  // sales_2024, or sales_20241 if that's taken. After that the ID is the
  // user's, and renaming leaves it alone.
  function setLabel(id, label) {
    label = label.trim()
    const node = flow.findNode(id)
    if (label === (node.data.label ?? '')) return
    flow.updateNodeData(id, { label: label || undefined })
    const base = toIdentifier(label)
    if (base && isAutoId(node.data.kind, id)) {
      applyRename(id, uniqueId(base, usedIds().filter((used) => used !== id)))
    }
  }

  // Name a node's output: read downstream as <id>_<name>. Empty (or "data")
  // goes back to <id>_data. What reads it by name downstream is stale.
  function setOutputName(id, name) {
    const suffix = toIdentifier(name)
    const next = suffix && suffix !== 'data' ? suffix : undefined
    if (next === flow.findNode(id).data.outputSuffix) return
    flow.updateNodeData(id, { outputSuffix: next })
    markStale(id, { self: false })
  }

  // Merge fields into a node's data (sqlQuery, autoRun: false, ...). Unless
  // they're cosmetic, the node's result is stale.
  function updateData(id, patch) {
    const data = flow.findNode(id).data
    const changed = Object.keys(patch).filter((k) => JSON.stringify(patch[k]) !== JSON.stringify(data[k]))
    if (!changed.length) return
    flow.updateNodeData(id, patch)
    if (changed.some((k) => !COSMETIC_FIELDS.has(k))) markStale(id)
  }

  // ---- Stored files (a DataIngest node's tables) ----

  async function getFile(key) {
    if (!fileCache.has(key)) {
      const bytes = await files?.getFile?.(key)
      if (bytes) fileCache.set(key, bytes)
    }
    return fileCache.get(key) ?? null
  }

  async function putFile(key, bytes) {
    fileCache.set(key, bytes)
    await files?.putFile?.(key, bytes)
  }

  function forgetFile(key) {
    fileCache.delete(key)
    files?.deleteFile?.(key)
  }

  // A file chosen for a DataIngest node: its tables are read now and stored,
  // not the file (so a workbook keeps its values, not its formulas). The file
  // stays in memory for this session, to read again as another type. A file
  // whose extension says its type is read as that, whatever File Type was.
  // Resolves to an error message, or null once read.
  async function chooseFile(id, file) {
    const node = flow.findNode(id)
    const original = { name: file.name, size: file.size, bytes: new Uint8Array(await file.arrayBuffer()) }
    originals.set(node, original)
    if (formatFromName(file.name)) updateData(id, { ingestFormat: undefined })
    return readIngest(node, original, node.data.ingestFormat)
  }

  async function readIngest(node, { name, size, bytes }, chosenFormat) {
    const format = chosenFormat || formatFromName(name)
    if (!format || !FILE_FORMATS[format].read) {
      return `Can't tell what kind of file "${name}" is. Pick its type under File Type.`
    }
    let tables
    try {
      tables = await runner.readFile(bytes, name, format)
    } catch (e) {
      return `Couldn't read "${name}" as ${FILE_FORMATS[format].label}. ${message(e)}`
    }
    if (flow.findNode(node.id) !== node) return null // deleted while it was read
    const stored = []
    for (const t of tables) {
      const key = newKey()
      await putFile(key, t.bytes)
      stored.push({ name: t.name, label: t.label, rowCount: t.rowCount, key })
    }
    const previous = node.data.ingest?.tables ?? []
    updateData(node.id, { ingest: { fileName: name, fileSize: size, format, tables: stored } })
    previous.forEach((t) => forgetFile(t.key))
    return null
  }

  // File Type for a DataIngest node ('' reads the file name). Reads the file
  // again if it was chosen this session; otherwise it has to be chosen again.
  // Resolves to an error message, or null.
  async function setIngestFormat(id, format) {
    const node = flow.findNode(id)
    updateData(id, { ingestFormat: format || undefined })
    const original = originals.get(node)
    if (original) return readIngest(node, original, format)
    const ingest = node.data.ingest
    if (!ingest || (format || formatFromName(ingest.fileName)) === ingest.format) return null
    return `Choose "${ingest.fileName}" again to read it as ${FILE_FORMATS[format]?.label ?? 'that type'}.`
  }

  // ---- Running ----

  function download({ filename, contentType, bytes }) {
    const url = URL.createObjectURL(new Blob([bytes], { type: contentType }))
    const link = Object.assign(document.createElement('a'), { href: url, download: filename })
    link.click()
    setTimeout(() => URL.revokeObjectURL(url), 1000)
  }

  const serverForRuns = () => ({ state: serverStatus.value.state, query: server?.query, runPython: server?.runPython })

  // Run nodes and everything upstream of them; results land in `run` for
  // every node that ran. `paged` ({ id, page, table? }) pages one target's
  // output. A DataExport node downloads its file when it's one of `ids`, not
  // when it only ran upstream of them.
  async function runNodes(ids, paged = null) {
    if (!ids.length) return
    run.started = true
    for (const id of ids) run.status[id] = 'running'
    const editsAtStart = new Map(edits)
    let results
    try {
      results = await runner.run(snapshot.value, ids, { paged, getFile, server: serverForRuns() })
    } catch (e) {
      // The engine couldn't run at all (say, DuckDB failed to load).
      results = Object.fromEntries(ids.map((id) => [id, { error: message(e) }]))
    }
    for (let [id, result] of Object.entries(results)) {
      if (!flow.findNode(id)) continue // deleted or renamed while it ran
      if (result.export) {
        const { bytes, ...file } = result.export
        const downloaded = ids.includes(id)
        if (downloaded) download(result.export)
        result = { export: { ...file, downloaded } }
      }
      run.results[id] = result
      const edited = (edits.get(id) ?? 0) !== (editsAtStart.get(id) ?? 0)
      run.status[id] = edited ? 'stale' : result.error ? 'failed' : 'completed'
    }
  }

  // Run one node (its Run button), optionally at a page of (one table of) its output.
  const runNode = (id, page = 0, table = null) => runNodes([id], { id, page, table })

  // Execute Graph: every node with Auto Run on (the default).
  async function executeGraph() {
    run.executing = true
    try {
      await runNodes(flow.nodes.value.filter((n) => n.data.autoRun !== false).map((n) => n.id))
    } finally {
      run.executing = false
    }
  }

  // ---- The AI assistant ----

  // Ask the server's assistant for a node's code: `request` in plain words,
  // `code` what's in its editor now. What's upstream runs first, to describe
  // its inputs (their columns and first rows), without touching any statuses.
  // `onStage('reading' | 'writing')` follows along. Resolves to { code, note }
  // or { error }; the caller puts the code in the node.
  async function askAssistant(id, request, code, onStage = () => {}) {
    const node = flow.findNode(id)
    const assistant = serverStatus.value.assistant
    if (!node) return { error: 'That node is gone.' }
    if (serverStatus.value.state !== 'connected' || !assistant) {
      return { error: "The assistant works through the server, which isn't available." }
    }
    try {
      onStage('reading')
      const inputs = await runner.describeInputs(snapshot.value, id, {
        getFile, server: serverForRuns(), sampleRows: assistant.sampleRows ?? 0,
      })
      onStage('writing')
      return await server.assist({ kind: node.data.kind, request, code, inputs })
    } catch (e) {
      return { error: message(e) }
    }
  }

  // ---- Deleting ----

  // Remove nodes (with their wires) and wires, remembering them for undo.
  // Whatever they fed is stale.
  function remove({ nodeIds = [], edgeIds = [] }) {
    const nodes = flow.nodes.value.filter((n) => nodeIds.includes(n.id))
    const edges = flow.edges.value.filter(
      (e) => edgeIds.includes(e.id) || nodeIds.includes(e.source) || nodeIds.includes(e.target),
    )
    if (!nodes.length && !edges.length) return
    deletions.push({
      nodes: nodes.map(({ id, type, position, data }) => ({ id, type, position: { ...position }, data })),
      edges: edges.map(makeEdge),
    })
    flow.removeEdges(edges.map((e) => e.id))
    flow.removeNodes(nodes.map((n) => n.id))
    for (const e of edges) if (!nodeIds.includes(e.target)) markStale(e.target)
  }

  function undoDelete() {
    const last = deletions.pop()
    if (!last) return
    flow.addNodes(last.nodes)
    flow.addEdges(last.edges)
    for (const e of last.edges) markStale(e.target)
  }

  // Delete/Backspace deletes the selected nodes and wires (a node takes its
  // wires with it; a wire alone leaves its nodes); Ctrl/Cmd+Z undoes a deletion.
  function onKeydown(e) {
    if (isTyping(e)) return
    const mod = e.ctrlKey || e.metaKey
    if ((e.key === 'Delete' || e.key === 'Backspace') && !mod && !e.altKey) {
      e.preventDefault()
      remove({
        nodeIds: flow.getSelectedNodes.value.map((n) => n.id),
        edgeIds: flow.getSelectedEdges.value.map((w) => w.id),
      })
    } else if (mod && !e.shiftKey && !e.altKey && e.key.toLowerCase() === 'z') {
      e.preventDefault()
      undoDelete()
    }
  }

  return {
    flow, selectedNode, snapshot, run, server: serverStatus,
    load, setContextPoint, addNode, addConnectedNode, connect, isValidConnection,
    renameNode, setLabel, setOutputName, updateData, chooseFile, setIngestFormat,
    runNode, executeGraph, resetNode, askAssistant,
    remove, undoDelete, onKeydown,
  }
}
