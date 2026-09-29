// SEAMONSTER's panels for any host (seamonster/panels): PanelHost and the
// FlowPanels it lays out, as in FlowgraphEditor, without the editor (or Vue
// Flow). The layout store and the panel menus are here for hosts that need
// them: to make the layout first, or to put the Panels submenu in their menus.

export { default as PanelHost } from './PanelHost.vue'
export { default as FlowPanel } from '../../components/FlowPanel.vue'
export { createPanelLayout, PANEL_LAYOUT } from '../../lib/panelLayout.js'
export { PANEL_MENU, panelCommands, panelsSubmenu } from '../../components/panelMenus.js'
