// SEAMONSTER's editor: FlowgraphEditor, and what a host needs to theme it or to
// build panels that match its own. The other widgets are their own entries
// (seamonster/menu, /controls, /doc, /scene, /sheet, /spatial).

export { default as FlowgraphEditor } from './widgets/FlowgraphEditor.vue'
export { default as FlowPanel } from './components/FlowPanel.vue'
export { FLOW_GRAPH } from './lib/flowGraph.js'
export { PANEL_LAYOUT } from './lib/panelLayout.js'
export { NODE_CATEGORIES, NODE_KINDS } from './lib/nodeKinds.js'
export { defineTheme, resolveTheme, themeNames } from './lib/themes.js'

// Last, so its rules come after Vue Flow's and the components' own in
// style.css, and win over them.
import './styles.css'
