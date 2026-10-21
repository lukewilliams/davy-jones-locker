// A graph as it's saved: the pipeline document from the spec (§12), plus
// the view. Nodes are flat, { id, kind, position, label?, outputSuffix?, ... }
// (everything in a canvas node's `data`); wires are { id, source,
// sourceHandle, target, targetHandle }; viewport is { x, y, zoom }. Shared
// subnets' graphs are `subnets`, by name, only when there are any (see
// subnets.js); a subnet's own graph has the same shape, without `format`.

export const EMPTY_DOCUMENT = { format: 'pipeline', nodes: [], edges: [] }

export function toDocument(nodes, edges, viewport, subnets = null) {
  return {
    format: 'pipeline',
    ...toGraph(nodes, edges, viewport),
    ...(subnets && Object.keys(subnets).length ? { subnets } : {}),
  }
}

// One level's canvas nodes and wires in saved form: a document's, or a subnet's.
export function toGraph(nodes, edges, viewport) {
  return {
    nodes: nodes.map(({ id, position, data }) => ({ id, ...data, position: { x: position.x, y: position.y } })),
    edges: edges.map(({ id, source, sourceHandle, target, targetHandle }) => ({
      id, source, sourceHandle, target, targetHandle,
    })),
    viewport: { x: viewport.x, y: viewport.y, zoom: viewport.zoom },
  }
}

const isPoint = (p) => Number.isFinite(p?.x) && Number.isFinite(p?.y)

// A saved document as canvas nodes and wires, and its shared subnets, or null
// if it isn't one.
export function fromDocument(doc) {
  if (doc?.format !== 'pipeline') return null
  const graph = fromGraph(doc)
  if (!graph) return null
  const subnets = doc.subnets && typeof doc.subnets === 'object' && !Array.isArray(doc.subnets) ? doc.subnets : {}
  return { ...graph, subnets }
}

// One level in saved form as canvas nodes and wires, or null if it isn't
// one. Stored data can be stale or hand-edited, so nodes without an ID, kind
// or position are dropped, and wires to nodes that aren't there. A node of a
// kind this app doesn't have is kept, as a placeholder (see isKnownKind).
export function fromGraph(graph) {
  if (!Array.isArray(graph?.nodes) || !Array.isArray(graph.edges)) return null
  const nodes = graph.nodes
    .filter((n) => typeof n?.id === 'string' && typeof n.kind === 'string' && n.kind && isPoint(n.position))
    .map(({ id, position, ...data }) => ({ id, type: 'pipeline', position: { x: position.x, y: position.y }, data }))
  const ids = new Set(nodes.map((n) => n.id))
  const edges = graph.edges.filter((e) => ids.has(e?.source) && ids.has(e?.target))
  const viewport = isPoint(graph.viewport) && Number.isFinite(graph.viewport.zoom) ? graph.viewport : null
  return { nodes, edges, viewport }
}
