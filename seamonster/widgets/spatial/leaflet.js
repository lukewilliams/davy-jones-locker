// The Leaflet renderer. Also import 'leaflet/dist/leaflet.css' in your app.
export { default as LeafletMap } from './components/LeafletMap.vue'
// The flowgraph editor's Map panel, for FlowgraphEditor's `panels` slot. It's
// here, not in the editor's entry, so the editor doesn't pull in Leaflet.
export { default as MapPanel } from './components/MapPanel.vue'
