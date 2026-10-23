// Subnets (roadmap 10c): a node whose output is a graph of its own, run as it
// is (not flattened into the graph around it). Plain functions on saved-form
// graphs ({ nodes, edges, viewport? }, nodes flat as in graphDocument.js), for
// the runner and the graph store alike.
//
// A subnet node keeps its graph inline, in `data.subnet`, or shares one from
// the document's library by name, `data.subnetRef` (the graph is then
// `doc.subnets[name]`, and every node naming it runs the same graph). Inside,
// Input nodes (kind subnet-input) are the subnet's input pins and Output nodes
// (subnet-output) its outputs, each named by the node's ID and ordered top to
// bottom (then left to right) on the canvas. The topmost Output is the
// subnet's first slot, read downstream as <subnet id>_<output id>; any others
// are slots of their own, each with its own pin too.
//
// Paths: a node inside a subnet is known by its subnet's path and its own ID,
// joined by `/` (subnet1/sqlnode1, subnet1/inner1/sqlnode1); a node at the top
// is known by its ID. Run state, logs and output tables are kept by path.

export const SUBNET = 'subnet'
export const SUBNET_INPUT = 'subnet-input'
export const SUBNET_OUTPUT = 'subnet-output'

// A Loop (roadmap 10d) is a subnet run once per row: everything here holds
// for it too. Its Input node `item` puts out each run's row, and it has a
// `status` output of its own (see graphRunner's runLoop).
export const LOOP = 'loop'
export const LOOP_ITEM = 'item'
export const LOOP_STATUS = 'status'

// Kinds whose node holds a graph of its own.
export const isGraphKind = (kind) => kind === SUBNET || kind === LOOP

// How deep subnets may nest when they run: deeper means one contains itself.
export const MAX_DEPTH = 8

export const isBoundary = (kind) => kind === SUBNET_INPUT || kind === SUBNET_OUTPUT

// A subnet node's graph: inline, or its library entry. Null if it names one
// the library doesn't have.
export function subnetGraph(data, library) {
  if (data.subnetRef) return library?.[data.subnetRef] ?? null
  return data.subnet ?? null
}

const byPosition = (a, b) => a.position.y - b.position.y || a.position.x - b.position.x

// A subnet's pins, from its graph's boundary nodes: { inputs, outputs }, each
// a list of node IDs, top to bottom.
export function boundaryPins(graph) {
  const nodes = [...(graph?.nodes ?? [])].sort(byPosition)
  return {
    inputs: nodes.filter((n) => n.kind === SUBNET_INPUT).map((n) => n.id),
    outputs: nodes.filter((n) => n.kind === SUBNET_OUTPUT).map((n) => n.id),
  }
}

// What a subnet node keeps of its pins in its own data, so it can be drawn and
// read without its graph: `subnetPins`, and `outputSuffix` (its first slot's
// name: the topmost Output's ID).
export function subnetFace(pins) {
  const first = pins.outputs[0]
  return { subnetPins: pins, outputSuffix: first && first !== 'data' ? first : undefined }
}

export const samePins = (a, b) => JSON.stringify(a ?? null) === JSON.stringify(b ?? null)

// A new subnet's graph: one Input wired to one Output, so it's one in, one
// out, like any node, and passes its input through until it's changed. A
// new Loop's Input is `item`, so each run passes its row through.
export function newSubnetGraph(input = 'input1') {
  return {
    nodes: [
      { id: input, kind: SUBNET_INPUT, position: { x: 0, y: 0 } },
      { id: 'output1', kind: SUBNET_OUTPUT, position: { x: 360, y: 0 } },
    ],
    edges: [{ id: `${input}.source-0-output1.target-0`, source: input, sourceHandle: 'source-0', target: 'output1', targetHandle: 'target-0' }],
  }
}

// The graph at a path's level: the document itself for [], or the graph of
// the subnet at `segments` (IDs from the top). Null if there's none.
export function graphAt(doc, segments) {
  let graph = doc
  for (const id of segments) {
    const node = graph?.nodes?.find((n) => n.id === id)
    if (!isGraphKind(node?.kind)) return null
    graph = subnetGraph(node, doc.subnets)
  }
  return graph ?? null
}

// IDs downstream of `id` in a graph, following its wires.
export function downstreamIn(graph, id) {
  const found = new Set()
  const stack = [id]
  while (stack.length) {
    const from = stack.pop()
    for (const e of graph?.edges ?? []) {
      if (e.source === from && !found.has(e.target)) {
        found.add(e.target)
        stack.push(e.target)
      }
    }
  }
  return [...found]
}

// Every subnet node in a document, nested ones included, as { path, node },
// down to MAX_DEPTH (a library graph naming itself stops there).
export function subnetNodes(doc) {
  const found = []
  const visit = (graph, prefix, depth) => {
    if (!graph || depth > MAX_DEPTH) return
    for (const node of graph.nodes ?? []) {
      if (!isGraphKind(node.kind)) continue
      const path = `${prefix}${node.id}`
      found.push({ path, node })
      visit(subnetGraph(node, doc.subnets), `${path}/`, depth + 1)
    }
  }
  visit(doc, '', 0)
  return found
}

// A copy of `graph` with `fn(graph)` applied to it and to every inline
// subnet's graph inside it, innermost first. `fn` returns a graph (new, or
// the one it was given). Objects that don't change are kept.
export function mapGraphs(graph, fn) {
  if (!graph) return graph
  let changed = false
  const nodes = (graph.nodes ?? []).map((node) => {
    if (!isGraphKind(node.kind) || !node.subnet) return node
    const subnet = mapGraphs(node.subnet, fn)
    if (subnet === node.subnet) return node
    changed = true
    return { ...node, subnet }
  })
  return fn(changed ? { ...graph, nodes } : graph)
}

// Wires in a graph renamed or dropped for one subnet node's pins: `rename`
// maps old pin names to new ones (target:<input>, source:<output>), and wires
// to a pin the node no longer has go (`pins`, its pins now). Returns the
// graph, a new one if anything changed.
export function rewirePins(graph, subnetId, pins, rename = {}) {
  const outputs = new Set(pins.outputs.slice(1))
  const inputs = new Set(pins.inputs)
  let changed = false
  const edges = []
  for (const e of graph.edges ?? []) {
    let next = e
    if (e.target === subnetId && e.targetHandle?.startsWith('target:')) {
      const name = rename[e.targetHandle.slice(7)] ?? e.targetHandle.slice(7)
      if (!inputs.has(name)) {
        changed = true
        continue
      }
      if (`target:${name}` !== e.targetHandle) next = { ...next, targetHandle: `target:${name}` }
    }
    if (e.source === subnetId && e.sourceHandle?.startsWith('source:')) {
      const name = rename[e.sourceHandle.slice(7)] ?? e.sourceHandle.slice(7)
      if (!outputs.has(name)) {
        changed = true
        continue
      }
      if (`source:${name}` !== e.sourceHandle) next = { ...next, sourceHandle: `source:${name}` }
    }
    if (next !== e) {
      changed = true
      next = { ...next, id: `${next.source}.${next.sourceHandle}-${next.target}.${next.targetHandle}` }
    }
    edges.push(next)
  }
  return changed ? { ...graph, edges } : graph
}
