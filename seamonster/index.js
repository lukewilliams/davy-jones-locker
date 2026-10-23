// SEAMONSTER's editor: FlowgraphEditor, and what a host needs to theme it or to
// build panels that match its own. The other widgets are their own entries
// (seamonster/menu, /panels, /controls, /doc, /scene, /sheet, /spatial).

export { default as FlowgraphEditor } from './widgets/FlowgraphEditor.vue'
// The editor's own panels, for a host filling FlowgraphEditor's `panels` slot:
// all of them in their usual order, or each on its own.
export { default as EditorPanels } from './widgets/EditorPanels.vue'
export { default as TerminalPanel } from './widgets/TerminalPanel.vue'
export { default as LibraryPanel } from './widgets/LibraryPanel.vue'
export { default as FlowgraphsPanel } from './widgets/FlowgraphsPanel.vue'
export { default as DataPanel } from './widgets/DataPanel.vue'
export { default as ManagePanel } from './widgets/ManagePanel.vue'
export { FLOW_GRAPH } from './lib/flowGraph.js'
// The panels, also their own entry (seamonster/panels) for hosts without the editor.
export * from './widgets/panels/index.js'
export { defineNodeCategory, defineNodeKind, NODE_CATEGORIES, NODE_KINDS } from './lib/nodeKinds.js'
export { defineTheme, hasTheme, resolveTheme, themeNames } from './lib/themes.js'
// The Terminal's commands (FlowgraphEditor's `terminalCommands`).
export { createCommandRegistry, listing, MASK, parseCommand } from './lib/commands.js'

// Last, so its rules come after Vue Flow's and the components' own in
// style.css, and win over them.
import './styles.css'
