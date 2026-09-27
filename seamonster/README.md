# SEAMONSTER

> **Early release.** This is 0.1: the API may change between minor versions
> until 1.0, so pin an exact version if you depend on it.

Vue 3 widgets for wrangling data in flowgraphs. The main one is the
flowgraph editor: `<FlowgraphEditor />` is the whole thing, canvas, panels and
menus. The others are its menus and some general-purpose data widgets, each
its own entry:

| Import | What |
|---|---|
| `seamonster` | the flowgraph editor: `FlowgraphEditor`, `FlowPanel`, `defineTheme` |
| `seamonster/menu` | declarative, context-sensitive context menus ([widgets/menu](widgets/menu/README.md)) |
| `seamonster/controls` | control panels: selects and checkbox groups ([widgets/controls](widgets/controls/README.md)) |
| `seamonster/doc` | markdown documents ([widgets/doc](widgets/doc/README.md)) |
| `seamonster/scene` | a 3D scene, on TresJS ([widgets/scene](widgets/scene/README.md)) |
| `seamonster/sheet` | spreadsheet tables ([widgets/sheet](widgets/sheet/README.md)) |
| `seamonster/spatial` | maps, with `/leaflet` and `/deck` renderers ([widgets/spatial](widgets/spatial/README.md)) |
| `seamonster/style.css` | every widget's CSS, once, before the app's own |

SEAMONSTER has no server, storage or commands of its own: the host supplies
them as props, and it works without any of them. DAVY JONES' LOCKER
(`davy-jones-locker` on npm and PyPI) is the framework that supplies them: a
browser shell and a Python engine.

```js
import { FlowgraphEditor } from 'seamonster'
import 'seamonster/style.css'
```

Vue, reka-ui and Vue Flow (`@vue-flow/core`, `@vue-flow/background`) are peer
dependencies. The other widgets' libraries are optional peers, needed only
by the widget that uses them: three and TresJS (scene), Leaflet, deck.gl and
shpjs (spatial), marked (doc). A host linking SEAMONSTER from a folder
(`file:`) should list `vue`, `reka-ui`, `@vue-flow/core`,
`@vue-flow/background` and `seamonster` in Vite's `resolve.dedupe`: a second
copy of Vue breaks reactivity, and of SEAMONSTER splits its menu registry.

```
npm run build    # dist/: an ES module per entry, and style.css
```

## Structure

```
index.js                the editor's entry (seamonster)
styles.css              the editor's tokens (--flow-*) and rules
widgets/                what a host uses whole
  FlowgraphEditor.vue        the editor: canvas, title, panels, rails, menus
  ConsolePanel.vue      left panels, in this order (C): the selected node's error or summary
  LibraryPanel.vue        (L): node cards to drag onto the canvas
  FlowgraphsPanel.vue     (G): Execute Graph
  DataPanel.vue         bottom panel (D): the selected node's output (a tab per table)
  ManagePanel.vue       right panel (M): the selected node's properties
  menu/ controls/ doc/ scene/ sheet/ spatial/   the other widgets, each with its README
components/             what the editor is built from
  FlowCanvas.vue        the pannable layer: Vue Flow, with its nodes and wires
  FlowNode.vue          a node: its face, pins, kind tag and output hint
  NodeFace.vue          a node's face, also the Library's cards (scaled)
  FlowWire.vue          a wire: bezier curve between two pins
  FlowConnectionLine.vue  the wire being dragged from a pin
  FlowPanel.vue         the base panel every panel type wraps
  FlowPanelRails.vue    collapsed / side titles on each window edge
  DataTable.vue         one page of a table, and its pager
  NodeProperties.vue    Manage's fields: ID, Name, each kind's own, Run
  AssistantField.vue    Manage's AI assistant, above a node's SQL or code
  ServerStatus.vue      bottom left: the server connected (green) or not (blue)
  flowMenus.js          context menu definitions and their commands
lib/
  flowGraph.js          the graph: nodes, wires, edits, runs, stored files (one per window)
  graphDocument.js      the graph as a saved document, and back
  graphStorage.js       loads the graph from the host's storage, saves edits to it
  graphRunner.js        runs nodes (and their upstream) on the host's SQL engine
  jsSandbox.js          runs a JavaScript node's code in a sandboxed iframe's worker
  fileFormats.js        the file formats DataIngest reads and DataExport writes
  xlsx.js               a workbook's sheet names, and repairing DuckDB-wasm's xlsx output
  nodeKinds.js          node kinds and categories, node IDs, reference names
  panelLayout.js        all panel layout state and rules (one per window)
  themes.js             the theme registry: the built-in themes and defineTheme
  keyboard.js           isTyping: where single-key shortcuts must not fire
```

The canvas fills the window and can be larger than it. Panels and the title are
positioned against the window, not the canvas, so they stay put while it pans.

## Props

| Prop | Default | |
|---|---|---|
| `title` | `'SEAMONSTER'` | the name top left (and the window's accessible name) |
| `theme` | `'FLOW'` | any case: a built-in theme, `FLOW` (rounded, category gradients), `FLOWDARK` (rounded, light to dark grey), `LUX` (sharp, brushed metal in the category's colours) or `LUXDARK` (sharp, obsidian; the node under the pointer shows its category colour down the left edge), or one the app defines (see Themes) |
| `storage` | none | keeping the open graph and ingested data (see Keeping the open graph) |
| `sql` | none | the engine nodes run on (see Running nodes) |
| `server` | none | the server engine (see Running nodes) |

## Themes

A theme is a name, the theme it's based on, and token values over that
theme's, set on the window ([themes.js](lib/themes.js)). The four built-ins
are node looks (see Styling); an app defines its own before FlowgraphEditor
mounts, usually to change the brand gradient (the title, and hovered panel
titles, rails and menu items):

```js
import { defineTheme } from 'seamonster'

defineTheme({
  name: 'EMBER',
  base: 'LUX',
  tokens: { '--flow-brand-from': '#f7b955', '--flow-brand-to': '#d1741f' },
})
```

`<FlowgraphEditor theme="EMBER" />` then uses it. A theme can be based on
another app theme; names are matched in any case, and a built-in's name can't
be reused. `themeNames()` lists them all (the console's `f.Theme` will).

## Canvas

The canvas is [Vue Flow](https://vueflow.dev) (`@vue-flow/core`). Only its
structural CSS is imported (in FlowCanvas.vue), not its default theme; nodes
and wires are SEAMONSTER's own components, rendered through the `#node-pipeline` and
`#edge-wire` slots and styled by `.flow-node*`, `.flow-handle*` and
`.flow-wire*` in `styles.css`. Zoom runs from 0.25 to 2.

The graph lives in [flowGraph.js](lib/flowGraph.js), which
`FlowgraphEditor` creates and provides like the panel layout. It owns the window's
Vue Flow store (so `<VueFlow>` in FlowCanvas picks it up) and every edit:

- **Adding nodes:** from the canvas menu at the right-clicked point; by
  dropping a wire dragged from a pin on empty canvas, which opens the same
  node menu and wires the new node in, with its pin at the drop point; or by
  dragging a card from the Library, which lands where the card was held
  (HTML drag and drop, type `application/x-flow-node-kind`).
- **Wires:** drag from a pin to a pin. Output to input only, and never back
  into a node's own upstream: the graph stays acyclic.
- **Selecting:** click a node (outlined) or a wire (dashed). One thing is
  selected at a time (no box or multi-select); clicking the canvas deselects.
  The Manage panel shows the selected node.
- **Deleting:** Delete/Backspace deletes what's selected. A node takes its
  wires with it; a wire alone leaves both nodes, and the input pin it fed
  empties unless another wire feeds it. Nodes and wires also have a Delete
  context menu. Ctrl/Cmd+Z undoes deletions, most recent first; no other edit
  can be undone.
- **IDs** are `<prefix><n>` per kind, the lowest free `n` (`sqlnode1`), and
  unique, counting deleted nodes that undo could restore. A node's output is
  read downstream as `<id>_data`, or `<id>_<output name>` once it's named
  (shown when hovering its output pin).
- **Naming** (Manage): Name labels the node, and a renamed node shows its kind
  above it. While the ID is still the generated one, naming also sets the ID
  to the name as an identifier (`Sales 2024` → `sales_2024`, then
  `sales_20241` if that's taken); after that the ID is left alone. The ID can
  be edited directly (not empty, not in use), and its wires follow it; other
  nodes' code that names the old ID doesn't. Fields commit on blur or Enter.

Nodes and wires aren't focusable, so keyboard focus stays on the window when
the node under it is deleted.

## Keeping the open graph

`FlowgraphEditor` takes a `storage` prop from the host app, `{ load(), save(doc) }`
(plus the file methods under Running nodes), and never stores anything itself
([graphStorage.js](lib/graphStorage.js)).
`load()` may return a Promise. On mount the graph is loaded from it, in its
saved view (or fitted, if the document has none); after that every edit, pan
and zoom is saved once edits settle for 400ms, and straight away when the page
is hidden or closed. Without `storage`, the editor starts empty and keeps nothing.

`doc` is the pipeline document from the spec (§12), plus the view, built
by [graphDocument.js](lib/graphDocument.js):

```json
{
  "format": "pipeline",
  "nodes": [{ "id": "orders", "kind": "sql-query", "label": "Orders", "position": { "x": 0, "y": 0 } }],
  "edges": [{ "id": "…", "source": "orders", "sourceHandle": "source-0", "target": "…", "targetHandle": "target-0" }],
  "viewport": { "x": 415, "y": 355, "zoom": 1 }
}
```

Loading drops nodes of unknown kinds (and their wires), so stale or
hand-edited documents still open. DAVY JONES' LOCKER's app shell supplies
one (`createLocalGraphStorage(name)`), which keeps the document in
localStorage under `<name>:open-graph`.

## Running nodes

Everything runs in the browser, except PythonScript nodes and SQL that reads
the backend database, which run on the server engine (DAVY JONES' LOCKER's,
in the framework). The engine can also run whole graphs, for scheduled runs.

`FlowgraphEditor`'s `server` prop is the server engine as the host app sees it:

```
status                      reactive { state, address, assistant }: state
                            `checking`, `connected` or `unavailable`;
                            assistant { model, sampleRows } or null
query({ sql, inputs })      -> Promise<Uint8Array>  the result, as Parquet
runPython({ code, inputs }) -> Promise<{ output, value?, variables?, error?, table? }>
assist({ kind, request, code, inputs })
                            -> Promise<{ code, note, model }>  (optional)
```

`inputs` is `{ name: Parquet bytes }`, named by reference name (or
`name.table`). DAVY JONES' LOCKER's app shell supplies one
(`createEngineClient({ url, name })`), which asks the engine's `GET /health`
for `{ status: 'ok', host?, port? }` every 5 s while it answers, every 15 s
while it doesn't (and not while the page is hidden). What it changes:

- Bottom left, in the window's edge gap: "LIVE · connected to server
  host:port" in PythonScript's green, or "backend not available, client
  execution only" in SQLQuery's blue. Its dot blinks (at 2 Hz) only while the
  server is connected and the graph has a node that runs on it, so a blink
  always means some data will go to the server; otherwise it's steady.
- A node that runs on the server shows "Backend not available." as its status
  while it's away, and a blinking dot, top right in its label's colour
  ("Executes on server"), while it's there. Manage notes that running it
  sends its input data to the server, and Run waits for the server. That's
  PythonScript (`where: 'server'` in nodeKinds.js), and a SQLQuery whose query
  reads a table no wired input supplies (see below).

`FlowgraphEditor` takes a `sql` prop from the host app, the engine nodes run on:

```
query(sql)                -> Promise<{ columns, rows }>   plain values in the rows
registerFile(name, bytes) / readFile(name) / dropFile(name)
                             files its SQL reads and writes by name
readSqlite(bytes) / writeSqlite(tables)                    SQLite files (optional)
```

DAVY JONES' LOCKER's app shell supplies `duckdbSql`: DuckDB-wasm, with
sql.js for SQLite (DuckDB's sqlite extension can't reach browser files), both
imported from jsDelivr when first needed and never bundled. It turns Arrow's
values into plain ones: BIGINTs to numbers, dates and timestamps to ISO text,
decimals to scaled text.

[graphRunner.js](lib/graphRunner.js) does the rest, in DuckDB
SQL:

- **Run** (Manage, or Ctrl+Enter in the SQL box) runs a node and everything
  upstream of it, in dependency order. **Execute Graph** (Flowgraphs) runs
  every node with Auto Run on, and their upstream. Runs queue, one at a time.
- Each node's output is a table in the `flow_out` schema. While a node runs,
  `flow_in` holds one view per node wired into it, named by that node's
  reference name (`sqlnode1_data`), and the search path is `flow_in, main`: a
  query sees its inputs and nothing else. A node with several tables (a
  workbook's sheets) is wired in as a schema of that name instead:
  `dataingest1_data.sheet1`. All of it is rebuilt every run.
- **SQLQuery**: the query, as a table. There's no switch between the database
  and the inputs: DuckDB's parser lists the tables a query reads
  (`serverTables`, kept on the node as `sqlServerTables` whenever the query or
  its wires change), and if each is a wired input (or a CTE), the query runs
  here. If any isn't, it runs on the server instead, with its inputs sent as
  Parquet: there, plain names are the inputs, then the backend database's
  `public` schema (`db.public.orders` in full). Manage names the tables it's
  going to the server for.
- **PythonScript** runs on the server. Each node wired in is a pandas
  DataFrame named by its reference name (several tables: an object with one
  per table). The last line, if it's an expression, is the node's value: a
  DataFrame (or Series, or Arrow table) becomes its table; anything else is
  shown in the Data panel (pretty-printed JSON, or its `repr`), and the node
  has no rows. `print()` output goes to Console, as does the traceback, with
  the script's own lines only. Ctrl+Enter in the editor saves and runs.
- **DataIngest** reads its file when it's chosen, not when it runs: CSV, TSV,
  JSON, GeoJSON (a column per property, geometry as GeoJSON text), Parquet,
  Excel (a table per sheet, first row as headers, values not formulas) or
  SQLite (a table per table). Each table is kept as Parquet in the host's
  storage (`putFile` / `getFile` / `deleteFile`; IndexedDB in DAVY JONES'
  LOCKER's), and the file itself isn't kept. File Type defaults to the extension;
  changing it re-reads the file if it was chosen this session, else asks for
  it again.
- **DataExport** writes a node wired into it to a file, as its File Type or
  the filename's extension (CSV if neither): CSV, TSV, JSON, GeoJSON (needs a
  geometry column), Parquet, Excel (one table) or SQLite (every table). With
  one node wired in, that one; with several, the one named under **Input**
  (shown only then): its reference name, its ID, or `<name>.<table>` for one
  table of several, typed or chosen from a list (an editor menu, badged by
  category, like the right-click ones; Alt+Down opens it). It downloads when
  the node itself is run, not when it runs upstream of another, and passes the
  input on unchanged. DuckDB-wasm's xlsx files come out with a stray byte ahead
  of the zip, which Excel calls corrupt; `repairXlsx` cuts it (and leaves a
  correct file alone).
- **JavaScript** runs its code in [jsSandbox.js](lib/jsSandbox.js):
  a worker inside a hidden `sandbox="allow-scripts"` iframe. Its origin is
  opaque, so the code can't reach the page, its storage or its cookies (shared
  graphs are safe to run), and it's stopped after 30 s. The code is an async
  function body; each node wired in is a variable named by its reference name
  (an array of row objects, or an object of them for several tables). Returning
  an array of rows makes its table; `console.log` / `print` lines are its
  output (Console); `await sleep(s)` waits. It never runs on the server
  (`where: 'browser'`) until the engine has safeguards for user code.
- Other kinds fail with "… nodes can't run yet.", and anything downstream of a
  failure fails too.
- Results are pages of 100 rows plus a count; the Data panel's pager re-runs
  the node for another page.

Run state lives in the graph store (`run`), not in the saved document:
statuses and results start empty whenever a graph is opened. A status is
`running`, `completed`, `failed` or `stale`: changing anything that affects a
node's output (its SQL, file, format or output name; a wire into it; a rename
upstream) makes it and whatever ran downstream **Stale**, and a node edited
while it runs comes back stale. **Reset** (Manage, or the node's menu) takes a
node back to not run. Nodes show their status top left, and wires take their
colours from it (see the roadmap's wire table; stale counts as not run).
Unavailable buttons use `aria-disabled` rather than `disabled`, which would
drop keyboard focus, and with it the editor's hotkeys.

## AI assistant

SQLQuery, PythonScript and JavaScript nodes have an **Assistant** field in
Manage, above their code, while the server is there with its assistant set
up (`status.assistant`; the engine's README has the LiteLLM settings).
Type what the code should do and press Enter (Shift+Enter for a new line):

1. What's upstream runs, without changing any statuses, and each input is
   described: its reference name, columns and types, row count, and first
   `sampleRows` rows (graphRunner.js's `describeInputs`).
2. The engine's `/assist` gets the request, the node's kind and the code in
   its editor now (so "now sort it by name" changes what's there), with those
   inputs. For SQL, the engine adds the server database's tables and columns.
3. The answer replaces the node's code, which marks it stale like any edit,
   with the model's note underneath and **Undo** (while the code is still what
   it wrote). Nothing runs until the user runs it.

The field says what it sends, and to which model, before it's used.

## Panels

A panel component is a thin wrapper around `FlowPanel`:

```vue
<FlowPanel class="manage-panel" name="manage" title="Manage" dock="right" />
```

Props: `name` (unique id), `title`, `dock` (`left` | `right` | `bottom`),
`defaultSize` (px along the linked axis), `minWidth` (200), `minHeight` (140),
`collapsed` (initial), `hotkey` (a single key), `aboveBottom` (see below).
Panels register with the layout that `FlowgraphEditor` creates and provides. Left
panels sit side by side in the order they appear in FlowgraphEditor's template.
`FlowPanel` is exported so a host's own panels can match the built-in ones,
and `FLOW_GRAPH` and `PANEL_LAYOUT` (the stores FlowgraphEditor provides) so they
can follow the selection. Letting a host add, move or replace panels is still
to come.

The panels are Console, Library and Flowgraphs on the left, Data at the
bottom and Manage on the right. All but Manage start collapsed. Console, Data
and Flowgraphs are empty for now. Flowgraphs is `aboveBottom`: it sits above
Data, which runs underneath it.

The behaviour lives in [panelLayout.js](lib/panelLayout.js):

- **Linked** (the default): panels share the window. Left panels sit side by
  side, right panels are full height, and the bottom panel fills the width
  between them. Each resizes on one axis only, from the edge facing the canvas.
  A linked panel only makes room for other linked panels.
- **Above the bottom panel:** the last left panels can be `aboveBottom`. While
  the bottom panel is open (and linked) they stop above it, and it extends left
  underneath them; resizing the bottom panel moves their bottom edge, down to
  their minimum height. With the bottom panel closed they're full height.
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
  a title click.
- **Hotkeys:** a panel's own key (C, L, G, D, M) acts like a rail click:
  opens it, brings it to the front if it's covered, or else collapses it.
  Ignored with Ctrl, Cmd or Alt held, or while typing in a field.
- **Ctrl+Space** with no panel active (after clicking the canvas) collapses all
  panels to maximise the canvas; pressing it again restores them. The window
  needs focus for any of these keys, so click inside it first.
- **"Set unlinked size to current"** (`resetUnlinkedRect`) saves the panel's
  linked position as its unlinked one, without unlinking it.

## Context menus

Menus use [the menu widget](widgets/menu/README.md). `FlowgraphEditor` renders
its root through `MenuHost`, and regions opt in with `v-menu`:

- Panel titles and rails: `PANEL_MENU`, with the panel's name as context.
- Canvas: Nodes (categories with colour badges, then node types) and Panels.
- Nodes and wires: `NODE_MENU` and `WIRE_MENU` (Delete), with the ID as context.
- A wire dropped on empty canvas: `CONNECTION_MENU`, opened from code with
  `MenuHost`'s `open()`.

Menus are defined as data in [flowMenus.js](components/flowMenus.js), with
the commands that act on the layout and the graph. Right-clicking outside a
region shows no menu, not even the browser's.

The editor's menu look is in a `<style>` block in [FlowgraphEditor.vue](widgets/FlowgraphEditor.vue).
It sets the `--wm-*` tokens on `.flow-editor`, plus the part-class overrides:
the category-coloured badges, and the panning gradient on highlighted items
(category colours for items under a badged category, blue-green otherwise).
Menus are portalled into `.flow-editor`, so this styling reaches only the editor's
menus.

## Styling

- **`styles.css`**: the editor's tokens (`--flow-*`) and every one of its rules.
  Layout comes entirely from CSS, and components carry no styles of their own
  except the menu block in FlowgraphEditor.vue.
- A host app sizes FlowgraphEditor's container itself.
- `--flow-panel-radius` is both the panel corner radius and the gap between a
  docked panel and the window edge; the rails sit in that gap.
- Panel titles and rails are plain light text (`--flow-text`); hovering pans
  the brand gradient through them. The window's title keeps its smooth brand
  gradient in every theme.
- **Node themes** are classes on the window (`.flow-theme-flow`, `-flowdark`,
  `-lux`, `-luxdark`) and reach the Library's cards too. FLOWDARK is FLOW
  with every category's face in grey (`#a3a6ad` to `#33363c`) and white names;
  it's set on the face, so wires, kind tags and badges keep the category
  colours. LUX plates run top to
  bottom: primary to 20%, secondary at 22% (a hard light edge), primary at
  60%, and the category's light colour at 120%, primary being the category's
  deep colour and secondary its light one. LUXDARK plates are obsidian
  (`#0b0c10` primary, `#3d414c` secondary): primary to 20%, secondary at 24%,
  back to primary at 110%; the hovered node shows a 3px edge of its category
  colour. The status sits in the top band, above the edge. Names are
  plain near-white (`#e8e9ec`; dark on LUX's silver Custom plate) with a
  close drop shadow.
- **Planned:** the node category gradients (`.flow-node--<kind>`, currently
  `--node-color-from` / `--node-color-to` literals per class) are to be pulled
  into named tokens so they can be adjusted in one place. Nodes and the menu
  highlight both use them.

## Planned: console commands

Step 8f, after the split: a command field at the bottom of the Console panel
(~ focuses it). `f.` commands run in the browser (`f.Theme = "FLOW"`,
`f.Security.DisconnectBackend`), `b.` commands on the engine
(`b.LiteLLMKey = "…"`), with completion and namespaces. The Console's logs
also change: they append, and clear when a node's state changes. The design
is in the roadmap (step 8f).
