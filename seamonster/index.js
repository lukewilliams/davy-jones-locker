// SEAMONSTER's editor: FlowgraphEditor, and what a host needs to theme it or to
// build panels that match its own. The other widgets are their own entries
// (seamonster/menu, /panels, /controls, /doc, /scene, /sheet, /spatial).

export { default as FlowgraphEditor } from './widgets/FlowgraphEditor.vue'
export { FLOW_GRAPH } from './lib/flowGraph.js'
// The panels, also their own entry (seamonster/panels) for hosts without the editor.
export * from './widgets/panels/index.js'
export { NODE_CATEGORIES, NODE_KINDS } from './lib/nodeKinds.js'
export { defineTheme, resolveTheme, themeNames } from './lib/themes.js'

// Last, so its rules come after Vue Flow's and the components' own in
// style.css, and win over them.
import './styles.css'
