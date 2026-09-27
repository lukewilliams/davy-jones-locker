// The flow window's context menus, as data for widgets/menu. Items name a
// command, run with the context of the region that was right-clicked (for a
// panel title or rail, the panel's name), or carry an inline `action`.

import { kindsInCategory, NODE_CATEGORIES, NODE_KINDS } from '../lib/nodeKinds.js'

// Provided by FlowgraphEditor: (point, menu) opens a menu at a point in client
// coordinates, `menu` being what v-menu takes.
export const OPEN_MENU = Symbol('flow-open-menu')

// Panel titles and rails; context is the panel's name.
export const PANEL_MENU = [
  { command: 'panel.toggleCollapsed' },
  { type: 'checkbox', label: 'Linked', command: 'panel.toggleLinked', shortcut: 'Ctrl+Space' },
  { type: 'separator' },
  { label: 'Set unlinked size to current', command: 'panel.resetUnlinked' },
]

// A node; context is its ID.
export const NODE_MENU = [
  { label: 'Reset', command: 'node.reset' },
  { type: 'separator' },
  { label: 'Delete node', command: 'node.delete', shortcut: 'Del' },
]

// A wire; context is its ID.
export const WIRE_MENU = [{ label: 'Delete wire', command: 'wire.delete', shortcut: 'Del' }]

// Categories (with colour badges, from .flow-node--<category>), each a submenu
// of its node kinds; picking one runs `command` with { kind }.
const nodeKindItems = (command) =>
  NODE_CATEGORIES.map((category) => ({
    type: 'submenu',
    label: category.label,
    badge: { class: `flow-node--${category.id}` },
    items: kindsInCategory(category.id).map((kind) => ({
      label: NODE_KINDS[kind].label,
      command,
      args: { kind },
    })),
  }))

// Opened where a dragged wire is dropped on empty canvas; context is
// { point, from } (see FlowCanvas's connection-dropped event).
export const CONNECTION_MENU = nodeKindItems('node.addConnected')

export function createFlowMenus(layout, graph) {
  const commands = {
    'panel.toggleCollapsed': {
      label: (name) => (layout.find(name).collapsed ? 'Expand' : 'Collapse'),
      run: (name) => layout.setCollapsed(name, !layout.find(name).collapsed),
    },
    'panel.toggleLinked': {
      checked: (name) => layout.find(name).linked,
      run: (name) => layout.toggleLinked(name),
    },
    'panel.resetUnlinked': (name) => layout.resetUnlinkedRect(name),
    'panels.toggleMaximise': {
      label: () => (layout.maximiseAction.value === 'restore' ? 'Restore panels' : 'Collapse all panels'),
      disabled: () => !layout.maximiseAction.value,
      run: () => layout.toggleMaximise(),
    },
    // At the point the canvas was right-clicked.
    'node.add': (_, { kind }) => graph.addNode(kind),
    'node.addConnected': ({ point, from }, { kind }) => graph.addConnectedNode(kind, point, from),
    // Back to not run; only once it has run, and not while it's running.
    'node.reset': {
      disabled: (id) => !graph.run.status[id] || graph.run.status[id] === 'running',
      run: (id) => graph.resetNode(id),
    },
    'node.delete': (id) => graph.remove({ nodeIds: [id] }),
    'wire.delete': (id) => graph.remove({ edgeIds: [id] }),
  }

  const canvasMenu = [
    { type: 'submenu', label: 'Nodes', items: nodeKindItems('node.add') },
    {
      type: 'submenu',
      label: 'Panels',
      items: () => [
        ...layout.panels.map((p) => ({
          type: 'checkbox',
          label: p.title,
          shortcut: p.hotkey,
          checked: !p.collapsed,
          action: () => layout.setCollapsed(p.name, !p.collapsed),
        })),
        { type: 'separator' },
        { command: 'panels.toggleMaximise', shortcut: 'Ctrl+Space' },
      ],
    },
  ]

  return { commands, canvasMenu }
}
