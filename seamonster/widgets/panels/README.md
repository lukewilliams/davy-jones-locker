# panels (`seamonster/panels`)

The flowgraph editor's docked panels over any content: a map, a 3D scene, a
canvas. Panels collapse to rails on their edge, come to the front when
clicked, unlink to float (drag the title, resize from any edge), and answer
Ctrl+Space, exactly as in `FlowgraphEditor`, which is built on this. Vue and
Reka UI are peer dependencies; Vue Flow isn't needed.

```vue
<script setup>
import { FlowPanel, PanelHost } from 'seamonster/panels'
import 'seamonster/style.css'   // once, in the app
</script>

<template>
  <PanelHost class="viewport" storage-key="my-app:viewport" :hotkeys="false">
    <MyMap />                                  <!-- fills the host, under the panels -->
    <template #panels>
      <FlowPanel name="controls" title="Controls" dock="left" sizing="content" :default-size="280">
        …
      </FlowPanel>
      <FlowPanel name="table" title="Table" dock="bottom" sizing="content">
        …
      </FlowPanel>
    </template>
  </PanelHost>
</template>
```

The host is the window the panels are laid out in: give it a size (and it's
`position: relative` and `overflow: hidden`). Panels stay inside it, and
their rails sit in the gap along its edges.

How the editor uses them, its own panels and the Terminal, comes after:
[The editor's panels](#the-editors-panels).

## PanelHost

Slots:

- **default:** the content, filling the host under the panels. It's isolated
  (its own stacking context), so its layers stay under the panels however high
  their z-indexes go (Leaflet's run to 1000). Pointer events outside the panels
  and rails reach it as usual.
- **`panels`:** the `FlowPanel`s, and anything else that floats over the
  content.
- **`title`:** a title top left (the editor's name goes here). Linked left
  panels start below it; without one they start at the top.

Props:

| Prop | Default | |
|---|---|---|
| `storage-key` | the editor's key | where unlinked panels' sizes are saved in localStorage. Name one per host (`'<app>:<host>'`), or hosts with panels of the same name share them |
| `auto-hide-rails` | `true` | open panels leave the rails, except where panels can cover each other; `false` keeps a rail for every panel |
| `hotkeys` | `true` | panels' single-key `hotkey`s. `false` leaves letter keys to the content and the page (a key listener on `window`, like the scene's H (home) and F (frame), still fires) |
| `commands` | `{}` | commands for the host's own `v-menu` regions, beside the panels' (see [menu](../menu/README.md)) |
| `ignore` | `'[data-reka-popper-content-wrapper]'` | a selector: pressing on these doesn't deactivate the active panel |
| `layout` | none | a layout from `createPanelLayout`, for a host that needs it before mounting (the editor's menus do). `storage-key` and `auto-hide-rails` then go to `createPanelLayout` instead |

Through a template ref: `layout`, `el` (the host element) and `open(point,
menu)` (a menu at a point, as `MenuHost`'s).

**Keys** act only while focus is inside the host. Pressing anywhere in it
gives it focus (content that swallows pointer events, like a map, included),
and pressing outside the panels leaves no panel active. Ctrl+Space toggles the
active panel's link, or with none active collapses every panel and then
restores them. It's always on; `hotkeys` covers only the single keys.

**Menus:** the host is a `MenuHost`, so panel titles and rails have the panel
menu. Right-clicking elsewhere in the host shows no menu, not even the
browser's, unless a `v-menu` region there has one. `panelsSubmenu(layout)` is
the editor's Panels submenu, for the host's own menus.

## FlowPanel

Each of the editor's panels is a thin wrapper around `FlowPanel`:

```vue
<FlowPanel class="manage-panel" name="manage" title="Manage" dock="right" />
```

Props: `name` (unique id), `title`, `dock` (`left` | `right` | `bottom`),
`sizing` (`fill` | `content`, below), `defaultSize` (px along the linked
axis), `minWidth` (200), `minHeight` (140), `collapsed` (initial), `hotkey`
(a single key), `aboveBottom` (see below). Panels register with the layout
of the `PanelHost` around them: `FlowgraphEditor` is a PanelHost, and any app
can use one to put the same panels over its own content (a map, a scene). Panels
on one side sit side by side, from the edge inwards, in the order they
appear in the host's template. Names must be unique.

For panels over a host's content, `sizing="content"` is usually what's
wanted:

- **Left or right:** at the top of its edge, `default-size` wide (the edge
  facing the content resizes it), as tall as its content.
- **Bottom:** at the left, as wide and as tall as its content.
- **Capped** to the host, beyond which the body scrolls, across and down.
- They float over the content and each other, and don't push other panels.
  Each shows its rail, at the start of its edge, while it overlaps another
  panel, so a covered one can still be reached.
- Unlinked, a content panel is like any other: its rect is its own, and
  `min-width` / `min-height` (200 by 140) apply.

## Layout

The behaviour lives in [panelLayout.js](../../lib/panelLayout.js):

- **Linked** (the default): panels share the window. Left panels sit side by
  side from the left edge, right panels from the right, and the bottom panel
  fills the width between them. Each resizes on one axis only, from the edge facing the canvas.
  A linked panel only makes room for other linked panels.
- **Above the bottom panel:** the last panels on either side (the innermost)
  can be `aboveBottom`. While the bottom panel is open (and linked) they stop
  above it, and it extends underneath them, as far as the side's other
  panels, which stay full height at the edge. Resizing the bottom panel moves
  their bottom edge, down to their minimum height. With the bottom panel
  closed they're full height.
- **Unlinked** (the link button, or Ctrl+Space on the active panel): the panel
  floats. It moves by dragging its title and resizes from every edge and
  corner. Its size and position are saved to localStorage, as fractions of the
  window, and restored the next time it's unlinked.
- **Sizes are proportional**, so panels scale with the window down to their
  minimums. If the window gets too narrow for the linked panels at their
  minimums, they unlink.
- **Title click:** collapses the panel, or only brings it to the front if
  another panel covers it. Clicking anywhere on a panel brings it to the front.
- **Rails** (side titles in the window-edge gap) show collapsed panels. On an
  edge with several panels, once any of them is unlinked, the open ones show a
  rail too, so a covered panel can still be reached. A rail click behaves like
  a title click. With `autoHideRails` off (a FlowgraphEditor prop), every
  panel keeps its rail, open or collapsed.
- **Hotkeys:** a panel's own key (T, L, G, D, M; the Map panel's P) acts like a rail click
  (and `~` focuses the Terminal's command field, opening it):
  opens it, brings it to the front if it's covered, or else collapses it.
  Ignored with Ctrl, Cmd or Alt held, or while typing in a field.
- **Ctrl+Space** with no panel active (after clicking the canvas) collapses all
  panels to maximise the canvas; pressing it again restores them. The window
  needs focus for any of these keys, so click inside it first.
- **"Set unlinked size to current"** (`resetUnlinkedRect`) saves the panel's
  linked position as its unlinked one, without unlinking it.
- **Content panels** (`sizing="content"`): see [FlowPanel](#flowpanel).

## Look

Panels are frosted glass in the editor's tokens (`--flow-*`, on `:root`), made
for its black window. Over light content, darken the glass on the host:

```css
.viewport {
  --flow-panel: rgba(24, 24, 27, 0.8);
}
```

## The editor's panels

The editor's panels are Terminal, Library and Flowgraphs on the left, Data at
the bottom and Manage on the right. All but Manage start collapsed.
Flowgraphs is `aboveBottom`: it sits above Data, which runs underneath it.

**A host's own panels** go in FlowgraphEditor's `panels` slot (DAVY JONES'
LOCKER's `DavyJonesLocker` passes it through). Filled, the slot replaces the
editor's panels, so a host that adds to them puts `EditorPanels` (all five,
in their usual order) beside its own:

```vue
<script setup>
import { EditorPanels, FlowgraphEditor } from 'seamonster'
import { MapPanel } from 'seamonster/spatial/leaflet'
</script>

<template>
  <FlowgraphEditor :storage="storage" :sql="sql">
    <template #panels>
      <EditorPanels />
      <MapPanel dock="right" aboveBottom />
    </template>
  </FlowgraphEditor>
</template>
```

To move, reorder or leave out the editor's panels, list them one by one
instead: `TerminalPanel`, `LibraryPanel`, `FlowgraphsPanel`, `DataPanel` and
`ManagePanel` are exported too, and FlowPanel's props given to one replace
its own (`<ManagePanel dock="left" />`, `<DataPanel :collapsed="false" />`).
A panel of the host's own is a [`FlowPanel`](#flowpanel), or any component whose
root is one, like the [Map panel](../spatial/README.md#the-map-panel).
A hotkey stays with the first panel to register it: a later one with the
same key gets none, and the console says so.

The graph store (`FLOW_GRAPH`, injected; `PANEL_LAYOUT` is the layout's) has
what a host's panels need to follow the editor:

- `selectedNode` (a computed node, or null) and `select(id)`.
- `run.results[id]`, a node's last result (SEAMONSTER's README, [Running nodes](../../README.md#running-nodes)).
- `dataView`: what Data shows of the selected node, `{ node, slot, table,
  row }`: the slot's and table's tabs open (null for the first) and the row
  picked (counting from 0 in the whole table; null for none). It goes back
  to the first tabs and no row when another node is selected.
- `showRow({ id, slot, table, row })`: picks a row in Data, selecting the
  node, opening its tabs and turning to the row's page (a run, like the
  pager's).
- `addOutputReader(name, read)`: `read({ table, columns, query })` runs on
  every output table as its node runs, while the table is there (they're
  dropped by the next run): `table` is its name to put in SQL, `columns`
  `[{ name, type, crs }]` (`crs` undefined for a column that isn't geometry,
  null for geometry with none), and `query(sql)` the SQL engine's. What it
  returns is kept beside the table's page as `extras[name]` (or `{ error }`
  if it throws), held as it is rather than made reactive. A node that ran
  before the reader was added has nothing from it until it runs again.
  Returns a function that removes it.
- `setPanelData(id, panel, value)`: a panel's own data on a node, in its
  `data.panels[panel]` (null removes it). It's saved with the graph, follows
  the node through renames, deletion and undo, and leaves the node fresh,
  not stale.

## The Terminal's logs

Each node has a log, and so does the app. The
Terminal shows the selected node's, or the app's when nothing is selected,
newest at the bottom.

- A run adds to its node's log: what a script printed, then its error or a
  summary ("Returned 250 rows."). Everything upstream that ran with it adds
  to theirs.
- A log belongs to its node's current state: its settings, its wires,
  anything upstream, and Reset. The first run after any of those changes
  clears the log before adding to it, so errors a change dealt with go away,
  even if the new run fails differently. Until then a stale node's log says
  it has changed since.
- An entry already in the log isn't added again: it moves to the end and
  counts the repeat (×2), so an unchanged failing node shows its error once.
- The app's log has the server connecting and going away, and Execute
  Graph's summary. A host adds to it with the graph store's `log(text,
  type)`, type being `'info'` (the default), `'error'`, `'warning'` or
  `'note'`; the
  entries are in `logs.app`, and each node's in `logs.nodes[id]`.
- Turning pages in Data doesn't log (it runs the node through `turnPage`).
  Logs aren't saved, like run state.

## Terminal commands

[commands.js](../../lib/commands.js) and [CommandField.vue](../../components/CommandField.vue):
a command field at the bottom of the Terminal, when the host gives
FlowgraphEditor `terminalCommands`. SEAMONSTER has the field, the parser,
completion and the registry, and knows no commands itself: DAVY JONES'
LOCKER's app shell defines `f.` (the browser's) and `b.` (the engine's), and
an app adds its own.

- **Focus:** `~` (or `` ` ``) anywhere in the window but a text field opens
  the Terminal, if it's collapsed, with the field focused. Escape goes back
  to the window. While the field has focus, the Terminal shows the app's
  log.
- **Running:** Enter. The command shows right-aligned in blue in the app's
  log, and what it printed under it (in the error colour for an error).
  `f.Theme = "LUX"` sets a setting, `f.Theme` prints it, `f.Security.DisconnectBackend`
  runs an action, and a namespace alone (`f.Security`) lists what's in it.
  Names match whatever the case. Values are quoted text, numbers, or true
  and false; commands are parsed, never evaluated.
- **Completing:** the only match shows after what's typed, faint; Tab or
  Enter takes it. With several, once 3 characters are typed (or after `=`,
  for a setting's fixed values), a list opens above the field: Up and Down
  move, Enter or a click picks, Right goes into a namespace (›) and Left
  back out, Escape closes it. Settings show their value; secrets only
  whether they're set.
- **History:** Up and Down with the list closed go through this session's
  commands. A secret's value isn't kept: recalling `b.LiteLLMKey = ••••`
  gives `b.LiteLLMKey = ` to finish.

The registry:

```js
import { createCommandRegistry } from 'seamonster'

const commands = createCommandRegistry()
commands.define([
  { name: 'app.Greet', kind: 'action', description: 'Says hello.', run: () => 'Hello.' },
  {
    name: 'app.Region', kind: 'setting', description: 'Where the app looks.',
    values: () => ['east', 'west'], get: () => region, set: (value) => { region = value },
  },
])
```

A definition is `{ name (dotted, its namespace first), kind ('action' or
'setting'), description }` and, for an action, `run(ctx)`; for a setting,
`get()`, `set(value, ctx)`, and optionally `type` ('string', 'number' or
'boolean'), `values()` (the values it takes, when they're fixed) and
`secret` (never shown, echoed or kept; `get()` then says only whether it's
set). `run` and `set` may be async, return what to print, and throw an
Error to print its message as an error. `ctx` is `{ graph, registry }` (the
graph store: `clearLog()`, `log(text, type)` and the rest). The registry
also has `remove(prefix)` and `unavailable(prefix, message)` (what to say
for a command under `prefix` that isn't defined: the app shell's `b.` while
the engine is away). `listing(registry)` is what f.Help prints.
