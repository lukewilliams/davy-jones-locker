// Node kinds and categories, and the names derived from them: node IDs and the
// reference names downstream code uses. Colours live in styles.css
// (.flow-node--<category>), so anything coloured by category takes that class.

// In display order: the menus and the Library list categories in this order.
export const NODE_CATEGORIES = [
  { id: 'fetch', label: 'Fetch' },
  { id: 'modify', label: 'Modify' },
  { id: 'debug', label: 'Debug' },
  { id: 'import', label: 'Import' },
  { id: 'export', label: 'Export' },
  { id: 'custom', label: 'Custom' },
]

// label: the default name on the node; idPrefix: auto IDs are <idPrefix><n>;
// runs: it can be run (the rest have no properties to edit yet);
// outputName: its output can be named (Manage > Output Name);
// where: 'server' runs only on the server (sending it the node's input data);
// 'browser' never runs on the server, until it has safeguards for running
// user code; unset runs in the browser now, and may run on the server later.
// Pins default to one input and one output (see pinCounts).
export const NODE_KINDS = {
  'sql-query': { label: 'SQLQuery', category: 'fetch', idPrefix: 'sqlnode', runs: true, outputName: true },
  '3d-asset': { label: '3D Asset', category: 'fetch', idPrefix: 'asset' },
  'http-request': { label: 'HTTP Request', category: 'fetch', idPrefix: 'httprequest' },
  'python-script': {
    label: 'PythonScript', category: 'modify', idPrefix: 'pythonscript', runs: true, outputName: true, where: 'server',
  },
  javascript: {
    label: 'JavaScript', category: 'modify', idPrefix: 'javascript', runs: true, outputName: true, where: 'browser',
  },
  'geometry-script': { label: 'GeometryScript', category: 'modify', idPrefix: 'geoscript' },
  hlsl: { label: 'HLSL', category: 'modify', idPrefix: 'hlsl' },
  'network-fuse': { label: 'Network Fuse', category: 'modify', idPrefix: 'networkfuse', runs: true },
  debug: { label: 'Debug', category: 'debug', idPrefix: 'debug' },
  'data-ingest': { label: 'DataIngest', category: 'import', idPrefix: 'dataingest', runs: true, outputName: true },
  'dxf-import': { label: 'DXF Import', category: 'import', idPrefix: 'dxfimport', runs: true },
  'data-export': { label: 'DataExport', category: 'export', idPrefix: 'dataexport', runs: true },
  subnet: { label: 'Subnet', category: 'custom', idPrefix: 'subnet', runs: true },
}

// Drag-and-drop type for a node kind dragged from the Library onto the canvas.
// The data is JSON: { kind, grab: { x, y } }, grab being where the card was
// held, as fractions of its size (see flowGraph's addNode).
export const NODE_KIND_DRAG_TYPE = 'application/x-flow-node-kind'

export const kindsInCategory = (category) =>
  Object.keys(NODE_KINDS).filter((kind) => NODE_KINDS[kind].category === category)

// A kind this app doesn't have: a saved graph can name one (made by another
// app, or by a plugin this app doesn't install). Its node is kept as a
// placeholder, greyed, labelled with the kind's name, and never run, with its
// data and wires as they were, so saving the graph here loses nothing.
export const isKnownKind = (kind) => Object.hasOwn(NODE_KINDS, kind)

// A kind's entry in NODE_KINDS, or the placeholder's for an unknown kind.
export const kindInfo = (kind) =>
  isKnownKind(kind) ? NODE_KINDS[kind] : { label: String(kind), category: 'unknown', unknown: true }

export function pinCounts(kind) {
  const meta = kindInfo(kind)
  return { inputs: meta.inputs ?? 1, outputs: meta.outputs ?? 1 }
}

// base1, base2, ...: the first not in `used` (a Set).
function numbered(base, used) {
  let n = 1
  while (used.has(`${base}${n}`)) n++
  return `${base}${n}`
}

// The next free auto ID for a kind: <idPrefix><n>, lowest n not in `usedIds`.
export const nextNodeId = (kind, usedIds) => numbered(NODE_KINDS[kind].idPrefix, new Set(usedIds))

// `base`, or base1, base2, ... if it's taken (sales, sales1).
export function uniqueId(base, usedIds) {
  const used = new Set(usedIds)
  return used.has(base) ? numbered(base, used) : base
}

// Whether an ID is still the one the kind generated (<idPrefix><n>), so
// naming the node may replace it. Never for an unknown kind's: its prefix
// isn't known.
export const isAutoId = (kind, id) => isKnownKind(kind) && new RegExp(`^${NODE_KINDS[kind].idPrefix}\\d+$`).test(id)

// Text as a Python-safe name: lowercase, each run of anything but letters and
// digits as one _, no _ at either end, and a leading _ before a digit.
// "Sales 2024!" -> sales_2024; "3D view" -> _3d_view.
export function toIdentifier(text) {
  const slug = text.toLowerCase().replace(/[^a-z0-9]+/g, '_').replace(/^_+|_+$/g, '')
  return /^\d/.test(slug) ? `_${slug}` : slug
}

// The name a downstream node types to read this node's output: <id>_data, or
// <id>_<outputSuffix> once the output has been named.
export const referenceName = (id, data) => `${id}_${data.outputSuffix || 'data'}`

// Whether a node runs on the server, sending it the node's input data: a kind
// that runs only there (PythonScript), or SQL reading tables its inputs don't
// supply (sqlServerTables, worked out from the query in flowGraph.js).
export const runsOnServer = (data) =>
  isKnownKind(data.kind) && (NODE_KINDS[data.kind].where === 'server' || !!data.sqlServerTables?.length)

// Where pins sit down a node's side, as a top %: evenly spaced, with equal
// margins above and below (one pin is centred).
export const pinOffsets = (count) =>
  Array.from({ length: count }, (_, i) => `${((i + 1) / (count + 1)) * 100}%`)
