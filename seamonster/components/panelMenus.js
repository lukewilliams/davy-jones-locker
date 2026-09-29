// The panels' context menus, as data for widgets/menu, and the commands they
// run against a panel layout (see panelLayout.js). PanelHost adds these
// commands to its MenuHost; FlowgraphEditor adds the graph's on top.

// Panel titles and rails; context is the panel's name.
export const PANEL_MENU = [
  { command: 'panel.toggleCollapsed' },
  { type: 'checkbox', label: 'Linked', command: 'panel.toggleLinked', shortcut: 'Ctrl+Space' },
  { type: 'separator' },
  { label: 'Set unlinked size to current', command: 'panel.resetUnlinked' },
]

export function panelCommands(layout) {
  return {
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
  }
}

// A "Panels" submenu for a host's own menus (the editor's canvas has one): each
// panel as a checkbox, open or not, then collapse all / restore.
export function panelsSubmenu(layout) {
  return {
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
  }
}
