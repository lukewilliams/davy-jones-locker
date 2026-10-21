// The graph store's injection key (see flowGraph.js), on its own so panels
// outside the editor's entry (the Map panel in spatial/leaflet) can inject the
// store without importing Vue Flow.
export const FLOW_GRAPH = Symbol('flow-graph')
