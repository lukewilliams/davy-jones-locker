import { computed, markRaw, reactive, toRaw, watch } from 'vue'
import { useVueFlow } from '@vue-flow/core'
import { FILE_FORMATS, formatFromName, formatSize } from './fileFormats.js'
import { EMPTY_DOCUMENT, fromDocument, fromGraph, toDocument, toGraph } from './graphDocument.js'
import { createGraphRunner } from './graphRunner.js'
import { isTyping } from './keyboard.js'
import {
  inputPinsOf, isAutoId, isCosmetic, isKnownKind, nextNodeId, NODE_KINDS, outputPinsOf, slotsOf, slotsThrough, toIdentifier, uniqueId,
} from './nodeKinds.js'
import { outputAt } from './results.js'
import {
  boundaryPins, downstreamIn, graphAt, isBoundary, MAX_DEPTH, mapGraphs, rewirePins, samePins, SUBNET, subnetFace,
  subnetGraph, subnetNodes,
} from './subnets.js'

export { FLOW_GRAPH } from './flowGraphKey.js'

// Node size (--flow-node-width/height), for placing a new node by a point on it.
const NODE_WIDTH = 190
const NODE_HEIGHT = 90

// Points on a node, as fractions of its size (see addNode).
const INPUT_PIN = { x: 0, y: 0.5 }
const OUTPUT_PIN = { x: 1, y: 0.5 }

const message = (e) => e?.message ?? String(e)
const newKey = () => `${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 10)}`
const rows = (n) => `${n.toLocaleString()} ${n === 1 ? 'row' : 'rows'}`

// A run's result as log entries: what a script printed, then how it ended.
function resultEntries(result) {
  const entries = result.output ? [{ type: 'output', text: result.output }] : []
  if (result.error) {
    entries.push({ type: 'error', text: result.error })
  } else if (result.export) {
    const { filename, contentType, size } = result.export
    entries.push({ type: 'info', text: `Wrote “${filename}” (${contentType}, ${formatSize(size)}).` })
  } else if (result.tables) {
    const list = result.tables.map((t) => `${t.label} (${rows(t.data.rowCount)})`).join(', ')
    entries.push({ type: 'info', text: `Read ${result.tables.length} ${result.tables.length === 1 ? 'table' : 'tables'}: ${list}.` })
  } else if (result.data) {
    entries.push({ type: 'info', text: `Returned ${rows(result.data.rowCount)}.` })
  } else if (result.value && result.value.kind !== 'none') {
    entries.push({ type: 'info', text: `Returned a ${result.value.type} (see the Data panel).` })
  } else if (!result.output) {
    entries.push({ type: 'note', text: '(no output)' })
  }
  if (!result.error && result.slots?.length) {
    const size = (s) => (s.data ? rows(s.data.rowCount) : `${s.tables.length} tables`)
    entries.push({ type: 'info', text: `Also: ${result.slots.map((s) => `${s.ref} (${size(s)})`).join(', ')}.` })
  }
  if (!result.error) for (const text of result.warnings ?? []) entries.push({ type: 'warning', text })
  return entries
}

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
 * deleteFile) and held in memory once used. A kind's `file` field keeps its
 * file the same way. `reading` holds the IDs of nodes whose file is being
 * read or stored.
 *
 * Logs, shown in the Terminal, aren't saved either. `logs.nodes` holds a log
 * per node ID, `{ state, entries }`, and `logs.app` the app's own entries
 * (the server coming and going, Execute Graph, and whatever the host adds
 * with `log`). An entry is `{ id, type, text, count }`, type being 'output'
 * (printed), 'error', 'warning' (a run's `warnings`), 'info' or 'note'. Runs append to a node's log. A log
 * belongs to its node's state, the edit count kept per node (its settings,
 * its wires, anything upstream, Reset): the first run after a change clears
 * it before adding. An entry already in a log isn't added again: it counts
 * the repeat and moves to the end, so an unchanged failing node shows its
 * error once. The Data panel's pager (turnPage) doesn't log.
 *
 * `server` is the server engine as the host sees it: { status: { state, address,
 * assistant }, query, runPython, runNode, assist } (see graphRunner.js, and
 * davy-jones-locker's engine client), status reactive, state being 'checking',
 * 'connected' or 'unavailable'. runNode runs the kinds the server supplies. Without it, there's no server: everything runs in the
 * browser, and what can't doesn't run. `assist` and status.assistant ({ model,
 * sampleRows }) are the AI assistant, when the server has one set up.
 *
 * A SQLQuery node that reads tables its inputs don't supply runs on the
 * server; which tables those are is kept in its data (sqlServerTables),
 * refreshed whenever its query or what's wired into it changes.
 *
 * For panels the host adds (the Map panel): `dataView` is what Data shows of
 * the selected node, { node, slot, table, row }: the slot's and table's tabs
 * open (null for the first) and the row picked in it (by its number in the
 * whole table, from 0; null for none), back to the first tabs and no row
 * whenever another node is selected. `showRow` picks a row there.
 * `addOutputReader` reads each output table as a node runs, while the table
 * is there (they're dropped by the next run). `setPanelData` keeps a panel's
 * own data on a node (in `data.panels`, saved with the graph, following the
 * node through renames, deletion and undo, and leaving it fresh).
 *
 * Subnets (subnets.js): the canvas shows one level, the document's graph or a
 * subnet's, opened with `openSubnet` and left with `closeSubnet`; `levels`
 * are the ones open, for a breadcrumb. The levels above the canvas's are kept
 * in saved form, and every edit is written back up through them, so
 * `snapshot` is always the whole document. Node IDs in the store's API are
 * the canvas level's; run state, results and logs are kept by path
 * (subnet1/sqlnode1), and `run.status`, `run.results` and `logs.nodes` show
 * the canvas level's by ID. An edit inside a subnet makes the subnet stale,
 * with what's downstream of it at every level, and for a shared subnet every
 * use of it. A subnet node's pins (`subnetPins`, and `outputSuffix`) follow
 * its graph's Input and Output nodes, and its wires follow their renames.
 */
export function createFlowGraph({ sql = null, files = null, server = null } = {}) {
  const flow = useVueFlow()
  const runner = createGraphRunner(sql)
  const serverStatus = computed(() => ({
    state: server?.status?.state ?? 'unavailable',
    address: server?.status?.address ?? null,
    local: server?.status?.local === true,
    assistant: (typeof server?.assist === 'function' && server?.status?.assistant) || null,
  }))
  let deletions = [] // undo stack of { nodes, edges }, the canvas level's
  let contextPoint = { x: 0, y: 0 } // client coordinates of the last right-click on the canvas

  // The levels open above the canvas's, outermost first: { id (the subnet
  // node opened, at that level), graph (that level in saved form), deletions
  // (its undo stack) }. The document's shared subnets, by name.
  const stack = reactive([])
  const library = reactive({})
  const prefix = computed(() => stack.map((level) => `${level.id}/`).join(''))
  const pathOf = (id) => prefix.value + id

  // Run state, results and logs by path; `run.status`, `run.results` and
  // `logs.nodes` are the canvas level's, by ID.
  const runFlags = reactive({ started: false, executing: false })
  const runAll = reactive({ status: {}, results: {} })
  const logAll = reactive({})
  const logState = reactive({ app: [] })
  const run = {
    get started() { return runFlags.started },
    set started(value) { runFlags.started = value },
    get executing() { return runFlags.executing },
    set executing(value) { runFlags.executing = value },
    status: levelView(() => runAll.status),
    results: levelView(() => runAll.results),
  }
  const logs = { nodes: levelView(() => logAll), get app() { return logState.app } }

  // An object of things by path, seen from the canvas's level, by ID.
  function levelView(all) {
    const full = (id) => (typeof id === 'string' ? prefix.value + id : id)
    const here = (path) => path.startsWith(prefix.value) && !path.slice(prefix.value.length).includes('/')
    return new Proxy({}, {
      get: (_, id) => (typeof id === 'string' ? all()[full(id)] : undefined),
      set: (_, id, value) => {
        all()[full(id)] = value
        return true
      },
      deleteProperty: (_, id) => {
        delete all()[full(id)]
        return true
      },
      has: (_, id) => full(id) in all(),
      ownKeys: () => Object.keys(all()).filter(here).map((path) => path.slice(prefix.value.length)),
      getOwnPropertyDescriptor: (_, id) =>
        full(id) in all() ? { value: all()[full(id)], enumerable: true, configurable: true, writable: true } : undefined,
    })
  }

  // Edits per node path that could change its output: a node edited while it
  // ran comes back stale.
  const edits = new Map()
  const fileCache = new Map() // stored file data by key
  const originals = new WeakMap() // node -> the file chosen for it this session, to read again
  const reading = reactive(new Set())
  let entrySeq = 0

  const selectedNode = computed(() => flow.getSelectedNodes.value[0] ?? null)

  const dataView = reactive({ node: null, slot: null, table: null, row: null })
  watch(
    () => selectedNode.value?.id ?? null,
    (id) => {
      if (dataView.node !== id) Object.assign(dataView, { node: id, slot: null, table: null, row: null })
    },
  )

  // Select one node (and nothing else).
  function select(id) {
    const node = flow.findNode(id)
    if (!node) return
    flow.removeSelectedEdges(flow.getSelectedEdges.value)
    flow.removeSelectedNodes(flow.getSelectedNodes.value)
    flow.addSelectedNodes([node])
  }

  // IDs in use, including deleted nodes that undo could bring back.
  const usedIds = () => [...flow.nodes.value, ...deletions.flatMap((d) => d.nodes)].map((n) => n.id)

  // A new node, with what its kind starts it with (a subnet's graph).
  function makeNode(kind, position) {
    return { id: nextNodeId(kind, usedIds()), type: 'pipeline', position, data: { kind, ...(NODE_KINDS[kind].create?.() ?? {}) } }
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

  // The canvas's level in saved form, and the whole graph as a saved document
  // (see graphDocument.js), the levels above written back; recomputed as it's
  // edited.
  const levelDoc = computed(() => toGraph(flow.nodes.value, flow.edges.value, flow.viewport.value))
  const snapshot = computed(() => {
    const { nodes, edges, viewport } = stack.length ? stack[0].graph : levelDoc.value
    return { ...toDocument([], [], viewport ?? { x: 0, y: 0, zoom: 1 }, { ...library }), nodes, edges }
  })

  // Show a saved document (an empty graph if it isn't one), in its saved view,
  // or else fitted once its nodes are measured, no closer than 100% zoom.
  function load(doc) {
    const { nodes, edges, viewport, subnets } = fromDocument(doc) ?? fromDocument(EMPTY_DOCUMENT)
    deletions = []
    stack.splice(0)
    for (const name of Object.keys(library)) delete library[name]
    Object.assign(library, subnets)
    edits.clear()
    Object.assign(runFlags, { started: false, executing: false })
    runAll.status = {}
    runAll.results = {}
    for (const path of Object.keys(logAll)) delete logAll[path]
    flow.setEdges([])
    flow.setNodes(nodes)
    flow.setEdges(edges.map(makeEdge))
    // Which tables SQL nodes read from the server, worked out again: what
    // they read from their inputs depends on kinds this page has now (a node
    // saved as a placeholder's neighbour may read that node's slots).
    for (const n of nodes) {
      if (n.data.kind === 'sql-query' && n.data.sqlQuery) refreshServerTables(n.id)
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
  // which lands at the drop point (unwired if it has none: an Output node has
  // no output pin).
  function addConnectedNode(kind, point, from) {
    const fromOutput = from.handleType === 'source'
    const node = addNode(kind, point, fromOutput ? INPUT_PIN : OUTPUT_PIN)
    const handle = fromOutput ? inputPinsOf(node.data)[0]?.handle : outputPinsOf(node.id, node.data)[0]?.handle
    if (!handle) return
    const [source, target] = fromOutput
      ? [from, { nodeId: node.id, handleId: handle }]
      : [{ nodeId: node.id, handleId: handle }, from]
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

  // The graph must stay acyclic: no wire back into a node's own upstream. A
  // named input pin takes one wire, unless it says it takes many. A
  // placeholder (a kind this app doesn't have) keeps the wires it was saved
  // with, whatever pins they use: its kind isn't here to say which it has.
  // (It takes no new ones: its pins aren't connectable.) Vue Flow asks this
  // of every wire it's given too (setEdges, addEdges: those have an `id`, a
  // drag doesn't), which the store makes from wires checked when they were
  // drawn; counting a one-wire pin's wire then would count the wire itself
  // (or, renamed, the one it replaces), so those are checked only for pins.
  function isValidConnection({ id, source, target, targetHandle }) {
    if (reaches(target, source)) return false
    const node = flow.findNode(target)
    if (node && !isKnownKind(node.data.kind)) return true
    const pin = inputPinsOf(node?.data ?? {}).find((p) => p.handle === (targetHandle ?? 'target-0'))
    if (!pin) return false
    return pin.many || id !== undefined || !flow.edges.value.some((e) => e.target === target && e.targetHandle === pin.handle)
  }

  // A node's output no longer matches its settings or inputs: it (unless
  // `self` is false) and everything downstream that has run become stale.
  // (A SQL node among them may now read different tables from the server.)
  // Inside a subnet, so is the subnet, at every level up (see markEnclosing).
  function markStale(id, { self = true } = {}) {
    for (const n of [...(self ? [id] : []), ...downstreamOf(id)]) {
      markPath(pathOf(n))
      if (flow.findNode(n)?.data.kind === 'sql-query') refreshServerTables(n)
    }
    if (stack.length) markEnclosing()
  }

  // One node stale, by path, and (unless `inside` is false) everything that
  // ran inside it, if it's a subnet: its inputs feed all of that.
  function markPath(path, { inside = true } = {}) {
    const paths = [path, ...(inside ? Object.keys(runAll.status).filter((p) => p.startsWith(`${path}/`)) : [])]
    for (const p of paths) {
      edits.set(p, (edits.get(p) ?? 0) + 1)
      if (runAll.status[p] === 'completed' || runAll.status[p] === 'failed') runAll.status[p] = 'stale'
    }
  }

  // The canvas's level changed: the subnet it's the graph of is stale, with
  // what's downstream of it, and so on up to the top. For a shared subnet,
  // every use of it, with all that ran inside the others.
  function markEnclosing() {
    syncLevels()
    const doc = snapshot.value
    const here = prefix.value.slice(0, -1)
    const top = stack.at(-1)
    const ref = top.graph.nodes.find((n) => n.id === top.id)?.subnetRef
    const uses = ref ? subnetNodes(doc).filter((s) => s.node.subnetRef === ref).map((s) => s.path) : [here]
    for (const path of uses) markUp(doc, path, path !== here)
  }

  function markUp(doc, path, inside) {
    const segments = path.split('/')
    const id = segments.pop()
    const levelPrefix = segments.map((s) => `${s}/`).join('')
    markPath(path, { inside })
    for (const n of downstreamIn(graphAt(doc, segments), id)) markPath(levelPrefix + n)
    if (segments.length) markUp(doc, segments.join('/'), false)
  }

  // Work out again which tables a SQL node reads from the server.
  async function refreshServerTables(id) {
    const node = flow.findNode(id)
    if (!node || !sql) return
    const sources = flow.edges.value
      .filter((e) => e.target === id)
      .flatMap((e) => {
        const source = flow.findNode(e.source)
        return source ? slotsThrough(e.sourceHandle, source.id, source.data).map((s) => s.ref) : []
      })
    const tables = await runner.serverTables(node.data.sqlQuery ?? '', [...new Set(sources)])
    if (flow.findNode(id) !== node) return // deleted or renamed meanwhile
    // Kept even when empty, so a graph opened later knows it's been worked out.
    const previous = node.data.sqlServerTables
    if (!previous || tables.join('\n') !== previous.join('\n')) {
      flow.updateNodeData(id, { sqlServerTables: tables })
    }
  }

  // A kind defined after the graph opened (one the server supplies) can bring
  // slots that SQL nodes read: which tables they read from the server is
  // worked out again.
  watch(
    () => Object.keys(NODE_KINDS).length,
    () => {
      for (const n of flow.nodes.value) {
        if (n.data.kind === 'sql-query' && n.data.sqlQuery) refreshServerTables(n.id)
      }
    },
  )

  // Back to not run: the node's status and result are cleared, and whatever
  // ran downstream of it is stale.
  function resetNode(id) {
    const path = pathOf(id)
    for (const p of Object.keys(runAll.status).filter((p) => p === path || p.startsWith(`${path}/`))) {
      delete runAll.status[p]
      delete runAll.results[p]
      edits.set(p, (edits.get(p) ?? 0) + 1)
    }
    markStale(id, { self: false })
  }

  // Give a node a new ID, which its wires (and any in the undo stack) follow.
  // Other nodes' SQL or Python that names the old ID isn't rewritten, so
  // they're stale. An Input or Output node's ID names its subnet's pin, so
  // the subnet's wires to that pin follow too, wherever it's used.
  function applyRename(id, nextId) {
    if (nextId === id) return
    const kind = flow.findNode(id).data.kind
    if (stack.length && isBoundary(kind)) renamePin(id, nextId)
    const follow = (e) => {
      const swap = (end) => (end === id ? nextId : end)
      return makeEdge({ ...e, source: swap(e.source), target: swap(e.target) })
    }
    // Vue Flow looks nodes up by ID from its reactive list, so this renames it
    // in place (staying selected); setEdges rebuilds the wires and their lookup.
    flow.findNode(id).id = nextId
    flow.setEdges(flow.edges.value.map(follow))
    for (const d of deletions) d.edges = d.edges.map(follow)
    // Its run state and logs, and those of everything inside it.
    const [from, to] = [pathOf(id), pathOf(nextId)]
    for (const byPath of [runAll.status, runAll.results, logAll]) {
      for (const p of Object.keys(byPath).filter((p) => p === from || p.startsWith(`${from}/`))) {
        byPath[to + p.slice(from.length)] = byPath[p]
        delete byPath[p]
      }
    }
    for (const p of [...edits.keys()].filter((p) => p === from || p.startsWith(`${from}/`))) edits.set(to + p.slice(from.length), edits.get(p))
    if (dataView.node === id) dataView.node = nextId
    markStale(nextId, { self: false })
  }

  // The ID typed into Manage. Returns an error message, or null once renamed.
  function renameNode(id, nextId) {
    nextId = nextId.trim()
    if (!nextId) return 'ID cannot be empty.'
    if (nextId === id) return null
    if (nextId.includes('/')) return "IDs can't contain /: it separates a subnet's ID from its nodes' (subnet1/sqlnode1)."
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

  // Name a node's output (its first slot): read downstream as <id>_<name>.
  // Empty (or "data") goes back to <id>_data. What reads it by name
  // downstream is stale. Returns an error message for a name another of its
  // slots has, or null.
  function setOutputName(id, name) {
    const node = flow.findNode(id)
    const suffix = toIdentifier(name)
    const next = suffix && suffix !== 'data' ? suffix : undefined
    if (next === node.data.outputSuffix) return null
    if (next && slotsOf(id, node.data).some((s) => s.name === next)) {
      return `This node already has an output called ${next} (${id}_${next}). Choose another name.`
    }
    flow.updateNodeData(id, { outputSuffix: next })
    markStale(id, { self: false })
    return null
  }

  // Merge fields into a node's data (sqlQuery, autoRun: false, ...). Unless
  // they're cosmetic (see isCosmetic), the node's result is stale.
  function updateData(id, patch) {
    const data = flow.findNode(id).data
    const changed = Object.keys(patch).filter((k) => JSON.stringify(patch[k]) !== JSON.stringify(data[k]))
    if (!changed.length) return
    flow.updateNodeData(id, patch)
    if (changed.some((k) => !isCosmetic(data.kind, k))) markStale(id)
  }

  // A panel's own data on a node, by the panel's name (null or undefined
  // removes it). Cosmetic: the node isn't stale.
  function setPanelData(id, panel, value) {
    const node = flow.findNode(id)
    if (!node) return
    const panels = { ...node.data.panels }
    if (value === null || value === undefined) delete panels[panel]
    else panels[panel] = value
    updateData(id, { panels: Object.keys(panels).length ? panels : undefined })
  }

  // ---- Subnets (see subnets.js, and above) ----

  // Show one level's graph (saved form) on the canvas, in its saved view or
  // fitted, with `select` selected.
  function showLevel(graph, select = null) {
    const { nodes, edges, viewport } = fromGraph(graph) ?? fromGraph({ nodes: [], edges: [] })
    if (select) nodes.forEach((n) => (n.selected = n.id === select))
    // The last level's wires go first: IDs repeat between levels, and a wire
    // into a one-wire pin is checked against the wires there (isValidConnection).
    flow.setEdges([])
    flow.setNodes(nodes)
    flow.setEdges(edges.map(makeEdge))
    if (viewport) flow.setViewport(viewport)
    else if (nodes.length) {
      const { off } = flow.onNodesInitialized(() => {
        flow.fitView({ maxZoom: 1 })
        off()
      })
    }
  }

  // Open a subnet node of the canvas's level: its graph takes the canvas.
  // Returns an error message, or null.
  function openSubnet(id) {
    const node = flow.findNode(id)
    if (node?.data.kind !== SUBNET) return null
    const graph = subnetGraph(node.data, library)
    if (!graph) return `This subnet uses "${node.data.subnetRef}" from the graph's shared subnets, which the graph doesn't have.`
    if (stack.length >= MAX_DEPTH) return `Subnets open here only ${MAX_DEPTH} deep.`
    syncLevels()
    const { nodes, edges, viewport } = levelDoc.value
    stack.push({ id, graph: { nodes, edges, viewport }, deletions })
    deletions = []
    showLevel(graph)
    return null
  }

  // Back up to level `depth` (0: the top; by default, one up), with the
  // subnet just left selected.
  function closeSubnet(depth = stack.length - 1) {
    if (depth < 0 || depth >= stack.length) return
    syncLevels()
    let left = null
    while (stack.length > depth) {
      left = stack.pop()
      deletions = left.deletions
    }
    showLevel(left.graph, left.id)
  }

  // The levels open, for a breadcrumb: the top (label null), then each subnet
  // in turn, by its name (or ID), and the shared subnet it uses, if it does.
  const levels = computed(() => [
    { depth: 0, label: null, shared: null },
    ...stack.map((level, i) => {
      const node = level.graph.nodes.find((n) => n.id === level.id)
      return { depth: i + 1, label: node?.label || level.id, shared: node?.subnetRef ?? null }
    }),
  ])

  // Every edit on the canvas inside a subnet goes back into the levels above,
  // so they and `snapshot` stay the whole graph: when it's watched, and at
  // once whenever something reads the whole graph (a run straight after an
  // edit, as Ctrl+Enter does, mustn't run the graph from before it).
  let written = null
  function syncLevels() {
    if (!stack.length) return
    const graph = levelDoc.value
    if (graph === written) return
    written = graph
    writeBack(graph)
  }
  watch(levelDoc, syncLevels)

  // The canvas's graph into the subnet node it belongs to (or the shared
  // subnet it uses), then that level into the one above, and so on. When its
  // Input and Output nodes have changed, the node's pins follow (every use of
  // a shared one), wires to pins that are gone go, and it's stale.
  function writeBack(graph) {
    const top = stack.at(-1)
    const node = top.graph.nodes.find((n) => n.id === top.id)
    if (!node) return
    const pins = boundaryPins(graph)
    const pinsChanged = !samePins(node.subnetPins, pins)
    if (node.subnetRef) {
      library[node.subnetRef] = graph
      if (pinsChanged) transformAll(facePins((n) => n.subnetRef === node.subnetRef, pins))
    } else {
      top.graph = { ...top.graph, nodes: top.graph.nodes.map((n) => (n === node ? { ...n, subnet: graph } : n)) }
      if (pinsChanged) top.graph = facePins((n) => n.id === top.id, pins)(top.graph)
    }
    cascade(stack.length - 2)
    if (pinsChanged) markEnclosing()
  }

  // Each level from `from` up takes the level below into its subnet node,
  // until one uses a shared subnet (the shared graph is the one that changed).
  function cascade(from) {
    for (let i = from; i >= 0; i--) {
      const level = stack[i]
      const node = level.graph.nodes.find((n) => n.id === level.id)
      if (node.subnetRef) {
        library[node.subnetRef] = stack[i + 1].graph
        return
      }
      level.graph = { ...level.graph, nodes: level.graph.nodes.map((n) => (n === node ? { ...n, subnet: stack[i + 1].graph } : n)) }
    }
  }

  // A change to graphs for subnet nodes matching `which`: their pins (and
  // first slot's name) become `pins`, and their wires follow, renamed by
  // `rename` ({ old pin name: new }) or dropped where the pin's gone.
  const facePins = (which, pins, rename = {}) => (graph) => {
    let next = graph
    for (const node of graph.nodes ?? []) {
      if (node.kind !== SUBNET || !which(node)) continue
      if (!samePins(node.subnetPins, pins)) {
        next = { ...next, nodes: next.nodes.map((n) => (n.id === node.id ? { ...n, ...subnetFace(pins) } : n)) }
      }
      next = rewirePins(next, node.id, pins, rename)
    }
    return next
  }

  // Apply a change (see mapGraphs) to every graph in the document: the
  // levels above, the shared subnets, and the canvas's level.
  function transformAll(change) {
    for (const level of stack) level.graph = mapGraphs(level.graph, change)
    for (const name of Object.keys(library)) library[name] = mapGraphs(library[name], change)
    const here = levelDoc.value
    const next = mapGraphs({ nodes: here.nodes, edges: here.edges }, change)
    if (next.edges !== here.edges) flow.setEdges(next.edges.map(makeEdge))
    next.nodes.forEach((n, i) => {
      if (n === here.nodes[i]) return
      const { id, position, ...data } = n
      flow.updateNodeData(id, data)
    })
  }

  // An Input or Output node on the canvas renamed: its subnet's pin of that
  // name is renamed, and the wires to it follow, for every use of a shared
  // subnet.
  function renamePin(id, nextId) {
    const top = stack.at(-1)
    const node = top.graph.nodes.find((n) => n.id === top.id)
    const graph = levelDoc.value
    const pins = boundaryPins({ nodes: graph.nodes.map((n) => (n.id === id ? { ...n, id: nextId } : n)) })
    const change = facePins(node.subnetRef ? (n) => n.subnetRef === node.subnetRef : (n) => n.id === top.id, pins, { [id]: nextId })
    if (node.subnetRef) transformAll(change)
    else top.graph = change(top.graph)
  }

  // Share a subnet node's graph under a name (an identifier, not in use), so
  // other subnet nodes can use it. Returns an error message, or null.
  function shareSubnet(id, name) {
    const node = flow.findNode(id)
    const ref = toIdentifier(name ?? '')
    if (!ref) return 'Give it a name: letters, digits and _.'
    if (ref in library) return `There's a shared subnet called ${ref} already.`
    library[ref] = node.data.subnet ?? { nodes: [], edges: [] }
    updateData(id, { subnet: undefined, subnetRef: ref })
    return null
  }

  // Use a shared subnet's graph (`ref`), or this node's own copy of the one it
  // uses (`ref` null). Its pins follow the graph it now has.
  function useSubnet(id, ref) {
    const node = flow.findNode(id)
    const graph = ref ? library[ref] : structuredClone(toRaw(library[node.data.subnetRef]) ?? { nodes: [], edges: [] })
    if (!graph) return
    const pins = boundaryPins(graph)
    updateData(id, { subnet: ref ? undefined : graph, subnetRef: ref ?? undefined, ...subnetFace(pins) })
    const here = levelDoc.value
    const next = rewirePins({ nodes: here.nodes, edges: here.edges }, id, pins)
    if (next.edges !== here.edges) flow.setEdges(next.edges.map(makeEdge))
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
    reading.add(id)
    try {
      const original = { name: file.name, size: file.size, bytes: new Uint8Array(await file.arrayBuffer()) }
      originals.set(node, original)
      if (formatFromName(file.name)) updateData(id, { ingestFormat: undefined })
      return await readIngest(node, original, node.data.ingestFormat)
    } finally {
      reading.delete(id)
    }
  }

  // A file chosen for a kind's `file` field: stored whole through the host,
  // the field holding { fileName, fileSize, key } (the node's run reads it
  // with ctx.getFile(key)). The file it replaces is let go. Resolves to an
  // error message, or null once stored.
  async function storeFieldFile(id, fieldKey, file) {
    const node = flow.findNode(id)
    reading.add(id)
    try {
      const bytes = new Uint8Array(await file.arrayBuffer())
      if (flow.findNode(node.id) !== node) return null // deleted meanwhile
      const key = newKey()
      await putFile(key, bytes)
      const previous = node.data[fieldKey]?.key
      updateData(node.id, { [fieldKey]: { fileName: file.name, fileSize: file.size, key } })
      if (previous) forgetFile(previous)
      return null
    } catch (e) {
      return `Couldn't keep "${file.name}". ${message(e)}`
    } finally {
      reading.delete(id)
    }
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
    if (original) {
      reading.add(id)
      try {
        return await readIngest(node, original, format)
      } finally {
        reading.delete(id)
      }
    }
    const ingest = node.data.ingest
    if (!ingest || (format || formatFromName(ingest.fileName)) === ingest.format) return null
    return `Choose "${ingest.fileName}" again to read it as ${FILE_FORMATS[format]?.label ?? 'that type'}.`
  }

  // ---- Logs ----

  // Add an entry to a list of them, or count it again if it's there already
  // (moving it to the end, where the latest run's entries are).
  function append(entries, { type, text }) {
    const i = entries.findIndex((e) => e.type === type && e.text === text)
    if (i < 0) {
      entries.push({ id: ++entrySeq, type, text, count: 1 })
    } else {
      const [same] = entries.splice(i, 1)
      entries.push({ ...same, count: same.count + 1 })
    }
  }

  // A node's run, in its log (by path): cleared first if the node has changed
  // since the log began (`state` is its edit count when the run started).
  function logRun(path, state, entries) {
    if (logAll[path]?.state !== state) logAll[path] = { state, entries: [] }
    for (const entry of entries) append(logAll[path].entries, entry)
  }

  // An entry in the app's log: `type` is 'info' (default), 'error', 'warning' or 'note'.
  const log = (text, type = 'info') => append(logState.app, { type, text })

  // The server coming and going, in the app's log.
  watch(
    () => serverStatus.value.state,
    (state, previous) => {
      if (state === 'connected') {
        const { address, local } = serverStatus.value
        log(`Connected to the server${address ? ` at ${address}` : ''}.`)
        if (local) {
          log(
            'The server is in local development mode (IS_LOCAL): it signs no one in, and node kinds that run on it ' +
              'can reach the network. Keep it on your own machine.',
            'warning',
          )
        }
      } else if (state === 'unavailable') {
        log(
          previous === 'connected'
            ? "Lost the server: nodes that run there can't run until it's back."
            : server
              ? "The server isn't available: nodes that run there can't run until it is."
              : "There's no server: everything runs in this browser, and nodes that need a server can't run.",
          previous === 'connected' ? 'error' : 'note',
        )
      }
    },
    { immediate: true },
  )

  // ---- Running ----

  function download({ filename, contentType, bytes }) {
    const url = URL.createObjectURL(new Blob([bytes], { type: contentType }))
    const link = Object.assign(document.createElement('a'), { href: url, download: filename })
    link.click()
    setTimeout(() => URL.revokeObjectURL(url), 1000)
  }

  const serverForRuns = () => ({
    state: serverStatus.value.state, query: server?.query, runPython: server?.runPython, runNode: server?.runNode,
  })

  // Output readers by name: each `read({ table, columns, query })` runs on
  // every output table as its node runs (see graphRunner's readOutput), and
  // what it returns is kept beside the table's page as `extras[name]`, held
  // as it is (not made reactive: it may be large). A node that ran before a
  // reader was added has nothing from it until it runs again. Returns a
  // function that removes the reader.
  const readers = new Map()
  function addOutputReader(name, read) {
    const raw = async (table) => {
      const value = await read(table)
      return value !== null && typeof value === 'object' ? markRaw(value) : value
    }
    readers.set(name, raw)
    return () => readers.get(name) === raw && readers.delete(name)
  }

  // Whether a path's node is still there: on the canvas's level, by its ID;
  // elsewhere, in the document.
  function stillThere(path) {
    const segments = path.split('/')
    const id = segments.pop()
    if (segments.map((s) => `${s}/`).join('') === prefix.value) return !!flow.findNode(id)
    return !!graphAt(snapshot.value, segments)?.nodes.some((n) => n.id === id)
  }

  // Run nodes, by path, and everything upstream of them (inside subnets
  // too); results land in `run` (and, unless `log` is false, the logs) for
  // every node that ran, and are returned by path. `paged` ({ id (a path),
  // page, table?, slot? }) pages one target's output. A DataExport node
  // downloads its file when it's one of `paths`, not when it only ran
  // upstream of them.
  async function runNodes(paths, paged = null, { log: logging = true } = {}) {
    if (!paths.length) return {}
    syncLevels()
    run.started = true
    for (const path of paths) runAll.status[path] = 'running'
    const editsAtStart = new Map(edits)
    let results
    try {
      results = await runner.run(snapshot.value, paths, { paged, getFile, server: serverForRuns(), readers })
    } catch (e) {
      // The engine couldn't run at all (say, DuckDB failed to load).
      results = Object.fromEntries(paths.map((path) => [path, { error: message(e) }]))
    }
    for (let [path, result] of Object.entries(results)) {
      if (!stillThere(path)) continue // deleted or renamed while it ran
      if (result.export) {
        const { bytes, ...file } = result.export
        const downloaded = paths.includes(path)
        if (downloaded) download(result.export)
        result = { ...result, export: { ...file, downloaded } } // the bytes aren't kept
      }
      runAll.results[path] = result
      const edited = (edits.get(path) ?? 0) !== (editsAtStart.get(path) ?? 0)
      runAll.status[path] = edited ? 'stale' : result.error ? 'failed' : 'completed'
      if (logging) logRun(path, editsAtStart.get(path) ?? 0, resultEntries(result))
    }
    // A target inside a subnet that ran only as far as what was asked for
    // inside it has no result of its own: it's no longer running.
    for (const path of paths) if (runAll.status[path] === 'running') delete runAll.status[path]
    return results
  }

  // Run one node of the canvas's level (its Run button), optionally at a page
  // of (one table, in one slot, of) its output.
  const runNode = (id, page = 0, table = null, slot = null) => runNodes([pathOf(id)], { id: pathOf(id), page, table, slot })

  // Another page of (one table, in one slot, of) a node's output, for the
  // Data panel's pager: a run like runNode's, but not logged.
  const turnPage = (id, page, table = null, slot = null) =>
    runNodes([pathOf(id)], { id: pathOf(id), page, table, slot }, { log: false })

  // Pick a row of a node's output in Data (a feature clicked on a map):
  // selects the node, opens the slot's and table's tabs, and turns Data to
  // the row's page if it shows another. `row` counts from 0 in the whole table.
  async function showRow({ id, slot = null, table = null, row }) {
    if (!flow.findNode(id)) return
    Object.assign(dataView, { node: id, slot, table, row })
    if (selectedNode.value?.id !== id) select(id)
    const data = outputAt(run.results[id], slot, table)?.data
    if (!data || run.status[id] === 'running') return
    const page = Math.floor(row / data.pageSize)
    if (page !== data.page) await turnPage(id, page, table, slot)
  }

  // Execute Graph: every node with Auto Run on (the default), summed up in
  // the app's log.
  async function executeGraph() {
    run.executing = true
    try {
      // The top level's nodes, whichever level is open.
      const ids = snapshot.value.nodes.filter((n) => n.autoRun !== false).map((n) => n.id)
      if (!ids.length) {
        log('Nothing to execute: every node has Auto Run off.', 'note')
        return
      }
      const ran = Object.keys(await runNodes(ids)).filter((path) => runAll.status[path])
      const count = (status) => ran.filter((path) => runAll.status[path] === status).length
      const parts = [`${count('completed')} completed`, `${count('failed')} failed`]
      if (count('stale')) parts.push(`${count('stale')} changed while running`)
      log(`Executed the graph: ${ran.length} ${ran.length === 1 ? 'node' : 'nodes'} ran, ${parts.join(', ')}.`, count('failed') ? 'error' : 'info')
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
      syncLevels()
      onStage('reading')
      const inputs = await runner.describeInputs(snapshot.value, pathOf(id), {
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
  // wires with it; a wire alone leaves its nodes); Ctrl/Cmd+Z undoes a
  // deletion. Enter opens the selected subnet; Escape goes back up a level.
  function onKeydown(e) {
    if (isTyping(e)) return
    const mod = e.ctrlKey || e.metaKey
    if (e.key === 'Enter' && !mod && !e.altKey && selectedNode.value?.data.kind === SUBNET) {
      e.preventDefault()
      const error = openSubnet(selectedNode.value.id)
      if (error) log(error, 'error')
      return
    }
    if (e.key === 'Escape' && stack.length) {
      e.preventDefault()
      closeSubnet()
      return
    }
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
    flow, selectedNode, snapshot, run, logs, log, reading, server: serverStatus, dataView,
    levels, library, openSubnet, closeSubnet, shareSubnet, useSubnet,
    load, setContextPoint, addNode, addConnectedNode, connect, isValidConnection, select,
    renameNode, setLabel, setOutputName, updateData, setPanelData, chooseFile, setIngestFormat, storeFieldFile,
    runNode, turnPage, showRow, addOutputReader, executeGraph, resetNode, askAssistant,
    remove, undoDelete, onKeydown,
  }
}
