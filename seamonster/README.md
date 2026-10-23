# SEAMONSTER

> **Early release.** This is 0.3: the API may change between minor versions
> until 1.0, so pin an exact version if you depend on it.

Vue 3 widgets for wrangling data in flowgraphs. The main one is the
flowgraph editor: `<FlowgraphEditor />` is the whole thing, canvas, panels and
menus. The others are its menus and some general-purpose data widgets, each
its own entry:

| Import | What |
|---|---|
| `seamonster` | the flowgraph editor: `FlowgraphEditor`, its panels (`EditorPanels`, `DataPanel`...), `defineTheme`, and everything in `/panels` |
| `seamonster/panels` | the editor's docked panels over any content: `PanelHost`, `FlowPanel` ([widgets/panels](widgets/panels/README.md)); no Vue Flow needed |
| `seamonster/menu` | declarative, context-sensitive context menus ([widgets/menu](widgets/menu/README.md)) |
| `seamonster/controls` | control panels: selects and checkbox groups ([widgets/controls](widgets/controls/README.md)) |
| `seamonster/doc` | markdown documents ([widgets/doc](widgets/doc/README.md)) |
| `seamonster/scene` | a 3D scene, on TresJS ([widgets/scene](widgets/scene/README.md)) |
| `seamonster/sheet` | spreadsheet tables ([widgets/sheet](widgets/sheet/README.md)) |
| `seamonster/spatial` | maps, with `/leaflet` and `/deck` renderers, and the editor's Map panel in `/leaflet` ([widgets/spatial](widgets/spatial/README.md)) |
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
  FlowgraphEditor.vue   the editor: a PanelHost with the canvas, title, panels and menus
  panels/               PanelHost: panels, rails and their keys over any content (seamonster/panels)
  EditorPanels.vue      the five below, in order: the editor's panels unless the host gives its own
  TerminalPanel.vue     left panels, in this order (T): the selected node's log, or the app's
  LibraryPanel.vue        (L): node cards to drag onto the canvas
  FlowgraphsPanel.vue     (G): Execute Graph
  DataPanel.vue         bottom panel (D): the selected node's output (a tab per table)
  ManagePanel.vue       right panel (M): the selected node's properties
  menu/ controls/ doc/ scene/ sheet/ spatial/   the other widgets, each with its README
                        (spatial/ has the Map panel, a panel for the editor's `panels` slot)
components/             what the editor is built from
  FlowCanvas.vue        the pannable layer: Vue Flow, with its nodes and wires
  FlowNode.vue          a node: its face, pins, kind tag and output hint
  NodeFace.vue          a node's face, also the Library's cards (scaled)
  FlowWire.vue          a wire: bezier curve between two pins
  FlowConnectionLine.vue  the wire being dragged from a pin
  FlowPanel.vue         the base panel every panel type wraps
  FlowPanelRails.vue    collapsed / side titles on each window edge
  panelMenus.js         the panels' menu definitions and commands
  DataTable.vue         one page of a table, and its pager
  NodeProperties.vue    Manage's fields: ID, Name, each kind's own, Run
  AssistantField.vue    Manage's AI assistant, above a node's SQL or code
  NodeField.vue         one of a kind's declared fields in Manage (text, number, select, code, file...)
  DataIngestFields.vue, ExportInputField.vue, SubnetFields.vue   the built-ins' custom fields (file chooser, Input picker, a subnet's Open, pins and graph)
  CommandField.vue      the Terminal's command field: completion, history
  ServerStatus.vue      bottom left: the server connected (green) or not (blue)
  flowMenus.js          the graph's context menus and their commands
lib/
  flowGraph.js          the graph: nodes, wires, edits, runs, stored files (one per window)
  flowGraphKey.js       its injection key (FLOW_GRAPH), for panels outside the editor's entry
  results.js            a run result's tables, one at a time or all of them
  graphDocument.js      the graph as a saved document, and back
  graphStorage.js       loads the graph from the host's storage, saves edits to it
  graphRunner.js        runs nodes (and their upstream) on the host's SQL engine, subnets level by level
  subnets.js            subnets: their graphs, pins (from Input and Output nodes) and paths
  jsSandbox.js          runs a JavaScript node's code in a sandboxed iframe's worker
  fileFormats.js        the file formats DataIngest reads and DataExport writes
  xlsx.js               a workbook's sheet names, and repairing DuckDB-wasm's xlsx output
  zip.js                reading and writing zips (shapefiles, in and out)
  geoExport.js          DataExport's GeoJSON, KML, GeoPackage and shapefiles
  crs.js                what GDAL and PROJ say about a CRS (its WKT, datum, a dropped datum shift)
  spatialChecks.js      warnings about spatial SQL: measuring in degrees, a dropped datum shift
  nodeKinds.js          import node kinds from here: the registry, with the built-ins defined in it
  kindRegistry.js       the registry: defineNodeKind, defineNodeCategory, node IDs, reference names
  builtinKinds.js       SEAMONSTER's own kinds (SQLQuery, JavaScript, DataIngest...), defined like an app's
  sqlText.js            DuckDB SQL pieces the runner and the built-ins share
  panelLayout.js        all panel layout state and rules (one per window)
  themes.js             the theme registry: the built-in themes and defineTheme
  keyboard.js           isTyping: where single-key shortcuts must not fire
  commands.js           the Terminal's commands: registry, parser, completion, running one
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
| `autoHideRails` | `true` | open panels leave the rails, as long as nothing on their edge can cover them; `false` keeps a rail for every panel (see Panels) |
| `terminalCommands` | none | the Terminal's commands, a registry from `createCommandRegistry` (see Terminal commands). Without it the Terminal has no command field |

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
be reused. `themeNames()` lists them all (the Terminal's `f.Theme` will).

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

A subnet node keeps its graph in its data (`subnet`: `{ nodes, edges,
viewport }`, the same shape), or names a shared one (`subnetRef`), which the
document keeps under `subnets`, by name, only when there are any (see
Subnets). A document without subnets saves exactly as before.

Loading drops nodes with no ID, kind or position, and wires to nodes that
aren't there, so stale or hand-edited documents still open. A node of a kind
this app doesn't have (made in another app, or with a plugin this app doesn't
install, or a kind a server supplies, while it isn't connected) is kept as a
**placeholder**: greyed, labelled with its kind's name, saying "Not available
here." Once the kind is defined (the server connects, say), it's a node like
any other. It has its first pin on each side plus any its
wires use, and it keeps its settings and wires, so saving the graph here loses
nothing. It can be moved, renamed or deleted, but not run (running it, or
anything downstream, fails with a message saying why), and new wires can't be
drawn to or from it. DAVY JONES' LOCKER's app shell supplies
one (`createLocalGraphStorage(name)`), which keeps the document in
localStorage under `<name>:open-graph`.

## Running nodes

Everything runs in the browser, except PythonScript nodes, SQL that reads
the backend database, and the kinds the server supplies, which run on the
server engine (DAVY JONES' LOCKER's, in the framework). The engine can also
run whole graphs, for scheduled runs.

`FlowgraphEditor`'s `server` prop is the server engine as the host app sees it:

```
status                      reactive { state, address, local, assistant }: state
                            `checking`, `connected` or `unavailable`; local
                            true for a server in local development mode;
                            assistant { model, sampleRows } or null
query({ sql, inputs })      -> Promise<Uint8Array>  the result, as Parquet
runPython({ code, inputs }) -> Promise<{ output, value?, variables?, error?, table? }>
runNode({ kind, node, inputs, files })
                            -> Promise<{ output, value?, error?, outputs }>  (optional)
runLoop({ node, path, subnets, inputs, progress })
                            -> Promise<{ warnings, error?, outputs }>  (optional)
assist({ kind, request, code, inputs })
                            -> Promise<{ code, note, model }>  (optional)
```

`inputs` is `{ name: Parquet bytes }`, named by reference name (or
`name.table`). `runNode` runs a node of a kind the server supplies (below):
its `inputs` are `[{ ref, id, slot, pin, bytes }]` (or with `tables: [{ name,
bytes }]`), `files` its file fields' files `[{ key, bytes }]`, and `outputs`
what it made, `[{ slot, bytes }]` or with `tables`, slot null for its first.
`runLoop` runs a Loop node on the server (see Loops): `node` its data, `path`
its path, `subnets` the document's shared subnets, `inputs` `[{ pin, bytes }]`
(`item` for items), `progress({ done, total, failed })` called as its runs
go, and `outputs` `[{ slot, bytes }]`. DAVY JONES' LOCKER's app shell supplies one
(`createEngineClient({ url, name })`), which asks the engine's `GET /health`
for `{ status: 'ok', host?, port?, local? }` every 5 s while it answers, every 15 s
while it doesn't (and not while the page is hidden). What it changes:

- Bottom left, in the window's edge gap: "LIVE · connected to server
  host:port" in PythonScript's green, or "backend not available, client
  execution only" in SQLQuery's blue. Its dot blinks (at 2 Hz) only while the
  server is connected and the graph has a node that runs on it, so a blink
  always means some data will go to the server; otherwise it's steady.
  "· LOCAL" follows the address when the server is in local development mode
  (`status.local`: it signs no one in, and node kinds that run on it can
  reach the network), and the app's log in the Terminal warns so on
  connecting.
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
readSqlite(bytes) / writeSqlite(tables, { statements })   SQLite files (optional)
loadSpatial()                load DuckDB's spatial extension (optional)
```

The runner calls `loadSpatial` before reading Parquet that holds geometry
(GeoParquet `geo` metadata). Read without the extension, a geometry
column's CRS stays spelt out in full (PROJJSON), and DuckDB then treats it as
a different CRS from the same one by name (`EPSG:4326`). The table still
loads if the extension doesn't; only spatial SQL on it fails.

DAVY JONES' LOCKER's app shell supplies `duckdbSql`: DuckDB-wasm, with
sql.js for SQLite (DuckDB's sqlite extension can't reach browser files), both
imported from jsDelivr when first needed and never bundled. Its spatial
extension comes from the app's own origin, loaded when first needed. It turns
Arrow's values into plain ones: BIGINTs to numbers, dates and timestamps to
ISO text, decimals to scaled text.

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
  has no rows. `print()` output goes to Terminal, as does the traceback, with
  the script's own lines only. Ctrl+Enter in the editor saves and runs.
  Geometry travels as GeoParquet, so where the server's runner has
  geopandas, an input with geometry is a GeoDataFrame with each column's
  CRS, and a GeoDataFrame (or GeoSeries) returned comes back as `GEOMETRY`
  with its CRS; without geopandas, geometry is WKB bytes (DAVY JONES' LOCKER's
  engine README, "Python and geometry").
- **DataIngest** reads its file when it's chosen, not when it runs: CSV, TSV,
  JSON, Parquet, Excel (a table per sheet, first row as headers, values not
  formulas), SQLite (a table per table), or a geo file (below). Each table is kept as Parquet in the host's
  storage (`putFile` / `getFile` / `deleteFile`; IndexedDB in DAVY JONES'
  LOCKER's), and the file itself isn't kept. File Type defaults to the extension;
  changing it re-reads the file if it was chosen this session, else asks for
  it again.
- **Geo files**: GeoJSON, KML, a zipped shapefile (one or more `.shp` with
  their `.shx`, `.dbf` and `.prj`), GeoPackage and FlatGeobuf, read with
  DuckDB's spatial extension (`ST_Read`). Each layer is a table: one layer is
  the node's table, and several (a KML's folders, a GeoPackage's layers) are
  several tables, as a workbook's sheets are. Holes, multi-part features and
  points are kept as they are. A feature's geometry is a `GEOMETRY` column
  called `geometry` (unless the file has a column of that name), with its
  CRS in the type: KML and GeoJSON `EPSG:4326`, a shapefile's from its
  `.prj`, a GeoPackage's per layer. A shapefile without a `.prj` has none
  (plain `GEOMETRY`), and stays that way: nothing assumes longitude and
  latitude; nor does a GeoPackage's "undefined" SRS (`srs_id` -1 or 0),
  which GDAL reports as a CRS of that name. Heights that are all 0 (KML
  writes them) are dropped, so a geometry is 3D only when its heights mean
  something. GDAL's own feature numbers (`OGC_FID`) are left out. In SQL,
  spatial functions work with x, y axis order whatever the CRS says
  (`ST_Transform(geometry, 'EPSG:7855')` needs no `always_xy`), as on the
  engine. A GeoPackage without GDAL's feature counts (`gpkg_ogr_contents`)
  can't be read here: DuckDB-wasm's GDAL then reads it on a thread, which it
  can't start. Graphs from before 0.4 keep what they read then: a GeoJSON's
  geometry as GeoJSON text.
- **Several tables** (Excel and SQLite, even with one sheet or table): each
  is named by its sheet or table name as an identifier (`toIdentifier`:
  lower case, each run of anything but letters and digits as one `_`, none at
  either end, `_` before a leading digit; `table` if nothing's left), then
  numbered if that's taken (`sales`, `sales1`): `Q1 Sales` is `q1_sales`,
  `2024` is `_2024`. Downstream it's `<reference name>.<table>` everywhere: a
  schema in SQL, in the browser and on the engine
  (`SELECT * FROM dataingest1_data.q1_sales`; the reference name alone isn't
  a table); attributes of an object in Python (`getattr` for a keyword like
  `class`); properties of an object in JavaScript; DataExport's **Input**; the
  engine's `input` filenames. Manage lists the first three under the node's
  ID, and a Data panel tab whose sheet name differs shows the table's name
  on hover. The names are fixed when the file is read: choosing a file whose
  sheets were renamed renames the tables, and code naming the old ones fails.
- **DataExport** writes a node wired into it to a file, as its File Type or
  the filename's extension (CSV if neither): CSV, TSV, JSON (geometry as
  WKT), Parquet (GeoParquet with geometry), Excel (one table), SQLite (every
  table; geometry as WKT, blobs as blobs), or a geo format ([geoExport.js](lib/geoExport.js)):
  - **GeoJSON** (one table) and **KML** (every table, a folder each):
    longitude and latitude by their standards, so geometry is transformed
    from its CRS, and refused when it has none. KML takes `name` and
    `description` columns as each placemark's own, and the rest as
    ExtendedData.
  - **GeoPackage** (every table, a layer each; one without geometry an
    attributes table) and **Shapefile (.zip)** (every table, a shapefile
    each): the CRS kept, its WKT and EPSG code as GDAL reports them, and
    none when it's unknown (`srs_id` -1, no `.prj`). A shapefile holds one
    geometry column of one kind (points, lines or polygons), with its rings
    turned the way shapefiles want them; its dBase fields are cut to 10
    characters in the name and 254 bytes of text (UTF-8, as the `.cpg`
    says).

  A table's geometry is its column called `geometry`, or else its first.
  They're assembled in JavaScript, since DuckDB-wasm's GDAL corrupts what it
  writes. With
  one node wired in, that one; with several, the one named under **Input**
  (shown only then): its reference name, its ID, or `<name>.<table>` for one
  table of several, typed or chosen from a list (an editor menu, badged by
  category, like the right-click ones; Alt+Down opens it). It downloads when
  the node itself is run, not when it runs upstream of another, and passes the
  input on unchanged. Parquet keeps each geometry column's CRS (below).
  DuckDB-wasm's xlsx files come out with a stray byte ahead
  of the zip, which Excel calls corrupt; `repairXlsx` cuts it (and leaves a
  correct file alone).
- **JavaScript** runs its code in [jsSandbox.js](lib/jsSandbox.js):
  a worker inside a hidden `sandbox="allow-scripts"` iframe. Its origin is
  opaque, so the code can't reach the page, its storage or its cookies (shared
  graphs are safe to run), and it's stopped after 30 s. The code is an async
  function body; each node wired in is a variable named by its reference name
  (an array of row objects, or an object of them for several tables). Returning
  an array of rows makes its table; `console.log` / `print` lines are its
  output (Terminal); `await sleep(s)` waits. It never runs on the server
  (`where: 'browser'`) until the engine has safeguards for user code.
- Other kinds fail with "… nodes can't run yet.", and anything downstream of a
  failure fails too.
- Results are pages of 100 rows plus a count; the Data panel's pager re-runs
  the node for another page. Clicking a row picks it (highlighted; click it
  again to unpick), for panels that follow it, like the Map panel; picking
  one elsewhere (a feature on the map) turns Data to its page and scrolls to
  it.
- **Spatial warnings** ([spatialChecks.js](lib/spatialChecks.js)): a
  SQLQuery that runs but likely doesn't mean what it says gets a warning
  (the run's `warnings`), and so does DataExport's GeoJSON and KML:
  - **Measuring in degrees:** `ST_Area`, `ST_Length`, `ST_Perimeter`,
    `ST_Distance`, `ST_DWithin` or `ST_Buffer` on geometry in a longitude
    and latitude CRS, pointing to the `_Spheroid` function or a projected
    CRS.
  - **A dropped datum shift:** `ST_Transform` between datums PROJ joins only
    by a null transformation (WGS 84 ↔ GDA2020, GDA94 ↔ WGS 84, NAD27 ↔
    NAD83 without grids), so coordinates are carried over unchanged. A
    GeoJSON or KML export from such a CRS too, since those formats are
    WGS 84. GDA94 → GDA2020, which PROJ shifts, doesn't warn.
  - **A target with no datum:** `ST_Transform` to a PROJ string that names
    only an ellipsoid (`+proj=tmerc ... +ellps=GRS80`, no `+datum`,
    `+towgs84` or `+nadgrids`), constant or built per row. PROJ applies no
    datum shift, so the result stays on the source's datum, which the
    warning names. It can't know which datum the projection was meant for,
    so it warns even when the source is already on it: naming the target in
    WKT or PROJJSON, which carry their datum, silences it (and from another
    datum, PROJ then shifts properly).
  - **The `_Spheroid` functions given the wrong coordinates:** with
    `ST_FlipCoordinates` (they take longitude first here, so flipped they
    return NaN, silently), or on a projected CRS.

  The calls come from DuckDB's parse of the query, and each geometry
  argument's type (its CRS) from DuckDB describing that argument selected
  from the same FROM. A null transformation is found by transforming a
  point in the CRS's area of use between the two geographic CRSs and seeing
  it not move ([crs.js](lib/crs.js)), since DuckDB's spatial doesn't say
  which operation PROJ picks or how accurate it's rated. What can't be
  worked out (a server table's types, an alias from the same SELECT) gets
  no warning; a check never stops a run.
- **Geometry in Data:** a geometry column's header has its types and CRS
  (`POLYGON · EPSG:4326`, or "CRS unknown"), and how many of its geometries
  are invalid or empty (in amber). A cell says what its geometry is, not
  its bytes: its type, and its area or length on the ellipsoid
  (`POLYGON · 1.75 ha`, `LINESTRING · 550 m`), with its WKT on hover. One
  whose CRS isn't known shows its type alone; without the spatial
  extension, cells show WKT.
- **A geometry's CRS travels with its table.** In SQL it's on the column's
  type (`GEOMETRY('EPSG:7855')`): a column passed through keeps its CRS,
  `ST_Transform` gives its target's, and mixing CRSs is refused ("Cannot call
  function 'ST_Intersects' with geometries of different coordinate reference
  systems"). On the wire it's GeoParquet `geo` metadata, written by DuckDB
  whenever a table goes out as Parquet (to the server, to PythonScript, to a
  server kind, from DataExport, and DataIngest's stored tables), and read
  back onto the type when one comes in. Two exceptions to DuckDB's own
  handling:
  - **No CRS stays no CRS.** DuckDB leaves `crs` out for a column with none,
    and GeoParquet reads that as OGC:CRS84 (longitude and latitude), so the
    runner writes such a file again with `"crs": null` (`writeParquet`).
  - **OGC:CRS84 is read as `EPSG:4326`**, the same coordinates in x, y order.
    DuckDB-wasm's spatial extension fails on CRS84 ("stoi: no conversion"),
    even opening a file that has it, so the runner reads `geo` itself, with
    DuckDB's GeoParquet reading off (`readParquet`). The engine does the
    same, so both give a column the same type.

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

### Limits of files

Everything known not to work, or to change data on the way, in one place
(most of it from DuckDB-wasm and its GDAL; ROADMAP's 8g has the findings).

**Reading (DataIngest)**
- **Not read:** KMZ (zipped KML), File Geodatabase (the browser's GDAL has
  no OpenFileGDB driver), and formats GDAL has but DataIngest doesn't offer
  yet (GML, GPX, DXF, MapInfo). A shapefile must come zipped, with its
  `.shx` and `.dbf`; a bare `.shp` isn't read.
- **Zips:** stored or deflated members only; no Zip64 (over 4 GB) and no
  encrypted members. `__MACOSX/` is skipped, and a zip with no `.shp` is
  refused.
- **GeoPackage** needs GDAL's feature counts (`gpkg_ogr_contents`): without
  them DuckDB-wasm's GDAL reads on a thread, which it can't start ("thread
  constructor failed"). GDAL, QGIS and DataExport write them; saving the
  file again with QGIS or ogr2ogr adds them. Its "undefined" SRS
  (`srs_id` -1 or 0) is read as no CRS.
- **KML:** each placemark's `name` and `description` only. GDAL's KML
  reader skips ExtendedData, so other fields (DataExport's included) don't
  come back. Heights that are all 0 are dropped.
- **Shapefile** without a `.prj`: no CRS.
- **GeoParquet:** only WKB columns are geometry; GeoParquet 1.1's native
  encodings (`point`, `polygon`...) stay as they are. No `crs` means
  OGC:CRS84, read as `EPSG:4326`; an explicit null means no CRS.
- **Geo files need the spatial extension**, served by the app (DAVY JONES'
  LOCKER's README, "DuckDB's extensions").
- **Excel:** the first row is the column names; values, not formulas.
- **SQLite:** blobs become `\x…` hex text.
- **GDAL's feature numbers** (`OGC_FID`) are left out.

**Writing (DataExport)**
- **One table:** CSV, TSV, JSON, Parquet, Excel, GeoJSON. **Every table:**
  SQLite, KML, GeoPackage, Shapefile (.zip).
- **CSV, TSV, JSON, Excel and SQLite** write geometry as WKT, without its
  CRS. SQLite keeps blobs as blobs, and writes lists and structs as JSON
  text.
- **GeoJSON and KML** are longitude and latitude only: geometry is
  transformed, and a column with no CRS is refused. KML heights are written
  with no `altitudeMode`, so viewers put them on the ground.
- **GeoPackage:** no spatial index (R-tree); a layer of mixed types is
  `GEOMETRY`; one geometry column per layer, any others as WKT text;
  timestamps, lists and structs as text; a CRS without an EPSG code gets an
  `srs_id` from 100000.
- **Shapefile:** one geometry column of one kind (points, lines or
  polygons), or it's refused; no geometry collections; M values dropped;
  an empty geometry becomes a null shape; field names cut to 10 ASCII
  characters (others become `_`), text to 254 bytes, reals to 15 decimals;
  timestamps and lists as text. The `.prj` is OGC WKT 1, which GDAL and
  QGIS read; ArcGIS writes its own flavour.
- **The browser's GDAL writers aren't used** (they corrupt what they write
  in DuckDB-wasm), so these formats are SEAMONSTER's own writers.
- **On the engine** (whole-graph runs), DataExport writes CSV, TSV, JSON and
  Parquet only, and its CSV quotes every field.

**In SQL**
- **In the browser, use `EPSG:4326`, not `OGC:CRS84`:** DuckDB-wasm's
  spatial fails on CRS84 ("stoi: no conversion"); the two are the same
  coordinates in Flow's x, y order.
- **No datum grids** in either engine: a transformation that needs one
  (GDA94 ↔ GDA2020 by grid, NAD27 ↔ NAD83) uses PROJ's grid-free choice,
  the same in both.
- **The engine reads no files** (`ST_Read` and the other readers are
  refused): read them with DataIngest and wire them in.
- **The `_Spheroid` functions take longitude first** (x, y), as everything
  here does: `ST_Area_Spheroid(geometry)` on `EPSG:4326` or `EPSG:7844` is
  right as it is. `ST_FlipCoordinates` before them, which plain DuckDB
  without `geometry_always_xy` needs, gives NaN (a warning says so).
- **`ST_Transform(geometry, source, target)` returns no CRS:** the explicit
  source wins over the column's, but the result is plain `GEOMETRY`, so
  later nodes see "CRS unknown" (GeoJSON and KML exports refuse it).
  `ST_Transform(geometry, target)` on a column with its CRS keeps one; use
  `ST_SetCRS` after the three-argument form to put it back.
- **A target that isn't a fixed authority code** (a PROJ string, WKT, or
  anything built per row) works only in the three-argument form, on
  geometry with no CRS on its type (`ST_GeomFromWKB` of the bytes, say). On
  a column with its CRS, the target must be a constant DuckDB recognises
  (`'EPSG:7855'`); a PROJ string there is refused ("not a recognized
  coordinate reference system").
- **Spatial warnings** are worked out in the browser, for SQL run from the
  editor (here or on the server); a whole-graph run on the engine has none.
  They can't name PROJ's chosen operation or its rated accuracy, only that
  the datum shift is dropped, and a transformation that does shift, but is
  rated at 1 m or worse, gets none. Geometry whose type can't be worked out
  (a server table, an alias from the same SELECT) isn't checked.

**On the map (the Map panel)**
- **A geometry column with no CRS isn't drawn** ("CRS unknown"): give it one
  with `ST_SetCRS`. One PROJ can't transform to longitude and latitude isn't
  drawn either, and the panel says why.
- **The first 10,000 rows** of each geometry column are drawn (the
  `featureLimit` prop), and the first 200 rows of a layers table; a note
  says when there are more. A layers table's `data` is drawn as GeoJSON
  is, in longitude and latitude, whatever its source was.
- **Leaflet only:** there's no deck.gl Map panel yet, for more features
  than Leaflet draws smoothly.
- **Each run reads every output table's geometry** as GeoJSON while a Map
  panel is there, so runs with large geometry tables take longer.
- **A node that ran before the Map panel was mounted** isn't drawn until it
  runs again (results aren't saved, so this is only when a host adds the
  panel while the editor is open).
- **The map's view isn't saved** with the graph: an opened graph fits its
  first layers again.

**In Python (PythonScript)**
- **Geometry is a GeoDataFrame only where the server's runner has
  geopandas** (the framework's runner doesn't: an app adds it). Without it,
  geometry arrives as WKB bytes, and a DataFrame returned with those bytes
  comes back as a blob column, not geometry, with no CRS.
- **Return geometry as a GeoDataFrame or GeoSeries**, with its CRS set
  (`set_crs` or `to_crs`). A GeoDataFrame's `crs` of None comes back as no
  CRS. Shapely objects in a plain column (not a GeoSeries) can't be
  returned, and the run fails.
- **GeoParquet's native encodings** (GeoParquet 1.1's `point`,
  `polygon`...) aren't read as geometry; geopandas writes WKB, which is.

## Subnets

A **Subnet** node (Custom) is a graph of its own, run as one node (roadmap
10c, [subnets.js](lib/subnets.js)). A new one starts as an Input wired to an
Output, so it's one in, one out, and passes its input through.

- **Opening one:** double-click it, press Enter with it selected, Open subnet
  in Manage, or its menu. Its graph takes the canvas, with a breadcrumb after
  the title (`Graph › Screening`); Escape or the breadcrumb goes back up, with
  the subnet selected. Everything works inside as at the top: the Library and
  menus (which add **Input** and **Output** there, under Subnet), Manage,
  Data, the Terminal, running, undo (each level its own).
- **Pins:** each Input node inside is an input pin on the subnet node, and
  each Output node an output, named by the node's ID, top to bottom (then
  left to right). An Input pin takes one wire, and the Input puts out the
  first slot it carries. The topmost Output is the subnet's first slot, read
  downstream as `<subnet id>_<output id>`; any others are slots of their own,
  each with its own pin too, and the main output pin carries them all.
  Renaming an Input or Output renames its pin, and the wires to it follow;
  deleting one drops the wires to its pin.
- **Running:** the subnet's graph runs as it is, not flattened, with what's
  wired into its pins put out by its Input nodes. Inside, nodes are known by
  path (`screening/classify`): their results and tables are kept so, and
  each shows its status and output when the subnet is open. Running a node
  inside runs what's upstream of it at every level (the subnet's inputs
  first), but not the rest of the subnet. An error says where it started:
  `Screening › Classify: …`. Subnets nest, up to 8 deep (a shared subnet that
  contains itself stops there).
- **Stale:** an edit inside makes the subnet stale, with what's downstream of
  it, at every level up; changing what's wired into a subnet makes
  everything inside it stale.
- **Shared subnets:** Manage's Graph shares a subnet's graph under a name
  (the document keeps it under `subnets`), so other Subnet nodes can use the
  same graph (Graph > Shared: name), or take a copy of their own. Editing a
  shared graph changes every use, and each one goes stale.

The graph store has it as API: `levels` (the levels open: `{ depth, label,
shared }`, the top first), `openSubnet(id)` (returns an error message or
null), `closeSubnet(depth?)` (one up by default), `library` (the shared
graphs), `shareSubnet(id, name)` and `useSubnet(id, name | null)`. Its
other methods take the open level's IDs; `run.status`, `run.results` and
`logs.nodes` show the open level's nodes by ID, and the runner and the
store keep them by path. DAVY JONES' LOCKER's engine runs subnets the
same way (its README, "API").

Known limits:

- **The open level isn't saved:** reopening the page shows the top level.
- **Deleting an Input or Output drops its subnet's wires to that pin**
  (every use, for a shared one), and undoing the deletion brings the node
  back, not those wires. Moving another Output above the first changes
  which one is first: wires from the new first one's own pin go.
- **Renaming an Input or Output doesn't rewrite code** that reads it
  (`site_data`), as for any node.
- **Shared subnets no one uses stay in the document;** there's no way to
  delete one yet.

## Loops

A **Loop** node (Custom) is a subnet run once per row (roadmap 10d): screen
each of 500 sites, say. Everything under Subnets holds for it (opening it,
its pins, sharing its graph), and:

- **Its Input node `item`** is its items pin: wire a table into it, and the
  loop runs its graph once per row, `item` putting out that row (a one-row
  table). Its other Inputs put out the same table every run. A new Loop
  starts as `item` wired to an Output, so each run passes its row through.
- **Each Output gathers every run's table**, by column name, with `_key` and
  `_iteration` first: `_key` is the run's row's value in Key column, or its
  row number; `_iteration` counts runs from 1. A failed run adds no rows.
  An Output takes one table (not a workbook's several).
- **`<id>_status`**, an output of its own (with its own pin): a row per run,
  `_key`, `_iteration`, `status` (completed, failed or skipped), `error` (where
  it started: `Classify: …`), `duration_ms` and `rows` (each Output's row
  count, as JSON). An Output inside can't be called `status`.
- **Settings:** Key column; When a run fails (carry on with the rest, the
  default, which warns how many failed; or stop the loop, which fails it,
  naming the run); Most runs (1000: rows past it aren't run, with a
  warning); Runs at once (on the server only).
- **Where it runs:** in the browser, one run at a time, unless something
  inside runs only on the server (PythonScript, SQL reading the server's
  tables, the server's own kinds, a subnet or loop with one of those inside).
  Then the server runs the whole loop, as a job (`server.runLoop`), with as
  many runs at once as Runs at once asks (up to the engine's
  `LOOP_MAX_CONCURRENCY`). A loop with nodes only the server runs and
  JavaScript, which only the browser runs, can't run, and says so. The node
  blinks its dot when it'll run on the server, as far as its own graph
  shows (a shared graph, or one inside, is worked out when it runs).
- **Progress:** the node's face counts runs while it goes, "Running… 37 /
  500 · 2 failed" (`run.progress` on the graph store, by ID).
- **A node inside run on its own** runs in the first run (the first row), in
  the browser, so you can see what a run does.

Known limits:

- **Opened after a run, a loop shows its last run's nodes** (in the
  browser), or none when the server ran it: the server sends back the
  outputs, not what each run's nodes did. `status` says how each run went.
- **No resume yet:** running a loop again runs every row again.
- **In the browser, one run at a time;** on the server, PythonScript inside
  runs one at a time whatever Runs at once says (the runner runs one script
  at a time). Keep Runs at once at 1 for loops of slow scripts, or their
  waits can outlast the engine's run timeout.
- **A loop the server runs takes one table per input:** a workbook's sheets
  need picking first (a SQLQuery node).

## Defining node kinds

Node kinds live in a registry. SEAMONSTER's own are defined in it
([builtinKinds.js](lib/builtinKinds.js)) exactly as an app defines its own,
with `defineNodeKind` and `defineNodeCategory`, both exported. Define them
before FlowgraphEditor mounts, as themes are:

```js
import { defineNodeCategory, defineNodeKind } from 'seamonster'

defineNodeCategory({ id: 'geo', label: 'Geo', colors: { from: '#7dd3a8', to: '#2f855a' } })

defineNodeKind({
  kind: 'geo.double',          // stored in saved graphs; namespace an app's or plugin's with a dot
  label: 'Double',             // the name on its face, in the Library and in the menus
  category: 'geo',             // a built-in category's id, or one defined as above
  outputName: true,            // Manage offers Output Name
  async run(ctx) {
    const [input] = ctx.inputs
    if (!input) return { error: 'Wire a node in.' }
    const table = ctx.table()
    await ctx.sql.query(`CREATE TABLE ${table} AS SELECT n * 2 AS n2 FROM ${input.table}`)
    return { table, output: `doubled ${input.ref}` }
  },
})
```

It appears in the Library, the canvas menu and the menu for a wire dropped
on the canvas, runs, and is saved and loaded like any node. The registry is
reactive, so a kind defined after mounting appears too. A category's
`colors` are its face's gradient (`from`, `to`) and, optionally, its name's
colour (`label`, white by default).

**A kind's definition.** Only `kind`, `label` and `category` are needed.

| | |
|---|---|
| `kind` | lowercase letters, digits and hyphens, with one dot at most (`sql-query`, `geo.double`) |
| `description` | what it does, in a sentence or two: Manage shows it above the node's fields, and the Library when its card is hovered |
| `idPrefix` | new nodes' IDs are `<idPrefix><n>`; by default the label, lowercase without spaces (`double1`) |
| `run(ctx)` | runs it in the browser; without it, the node says it can't run yet |
| `runs` | whether Manage shows Auto Run and Run; by default, whether there's a `run` |
| `where` | `'server'` (it runs only there, and says so), `'browser'` (never on the server), or a function of the node's data returning either (SQLQuery's). Unset: the browser. A kind with `where: 'server'` and no `run` runs through the `server` prop's `runNode`: that's how the kinds a server supplies run (DAVY JONES' LOCKER defines them from its engine's `GET /nodes`) |
| `outputName` | whether Manage offers Output Name |
| `fields` | what Manage shows for it, in order (below), each kept on the node's data under its `key` |
| `canRun(data)` | a reason it can't run yet (shown under Run), or null |
| `runHint` | the line under Run (where results go, by default) |
| `slots` | its outputs beyond the first, `[{ name, label?, pin? }]` or a function of the node's data (below) |
| `inputPins` | named input pins beside the main one, `[{ name, label?, many?, hint?, required? }]` or a function of the data (below) |
| `mainInput` | the main input pin: `'many'` wires (the default), `'one'`, or `false` for none (a Subnet's inputs are all named pins) |
| `mainOutput` | `false` for no main output pin (an Output node, whose output leaves its subnet instead) |
| `create()` | data a new node of the kind starts with (a Subnet's graph) |

**`ctx`**, what `run` is given:

| | |
|---|---|
| `id`, `node` | the node's ID, and its data (kind, label and its own fields, with their defaults) |
| `inputs` | what's wired in, one per slot each wire carries: `[{ id, kind, slot, ref, pin, table }]`, or with `tables: [{ name, label, table }]` for one with several. `id` is the node it's from, `slot` null for that node's first slot, `ref` the reference name it's read by, `pin` null for the main input pin or the named pin it came through, `table` a table name for SQL. The search path also finds each input by `ref` |
| `sql` | the host's SQL engine (`query`, `registerFile`, `readFile`, `dropFile`) |
| `server` | the server: `{ state, query?, runPython? }`, as FlowgraphEditor's `server` |
| `getFile(key)` | bytes the host stored by key |
| `table(name?)` | a name for this node's output table (one of several, with a name): create it, then return it |
| `slotTable(slot, name?)` | the same, for one of its other slots |
| `rows(input)` | an input's rows as objects by column (an object of them by table name, for several) |
| `parquet()` | the inputs as Parquet, `[{ name, bytes }]`, named as the node reads them, for sending to a server |
| `parquetOf(table)` | one table as Parquet (bytes) |
| `loadParquet(table, bytes)`, `loadRows(table, rows)` | create a table from Parquet, or from rows |
| `serverTables(query)` | the tables a query reads that no input supplies |
| `spatialWarnings(query)` | warnings about a query's spatial SQL (see "Spatial warnings"), `[text]`; never throws |
| `runSubnet()`, `runLoop()`, `boundInput` | the built-in Subnet, Loop and Input kinds' (see Subnets, Loops) |

**What `run` returns** (or throws, for an error):

| | |
|---|---|
| `table` | its output table; or `tables: [{ name, label, table }]` for several, shown as tabs in Data and read downstream as `<ref>.<name>` |
| `slots` | its other slots: `{ [slot]: table }`, or `{ [slot]: { tables } }`; a slot left out is an empty table |
| `value` | a value that isn't a table, shown in Data. With no table, downstream reads an empty one |
| `export` | `{ filename, contentType, size, bytes }`: a file, saved when this node is the one run |
| `output` | what it printed, for the Terminal |
| `warnings` | `[text]`: it ran, but something's likely wrong. In the Terminal (amber), and on the node's badge while that run is current |
| `error` | why it failed |

Anything else it returns stays on the result (PythonScript's `variables`).
A saved graph naming a kind this app doesn't have keeps the node as a
placeholder (see Keeping the open graph).

**Fields.** Manage shows a node's ID and Name, then its kind's `fields`,
then Output Name and Run. Text, number and code fields hold a draft and
commit on blur or Enter (Ctrl+Enter in code also runs the node); the rest
commit straight away. The built-ins declare theirs the same way.

```js
fields: [
  { key: 'crs', label: 'Output CRS', type: 'text', mono: true, default: 'EPSG:4326',
    validate: [{ pattern: '^EPSG:\\d+$', message: 'Use EPSG:<code>.' }] },
  { key: 'tolerance', label: 'Tolerance (m)', type: 'number', default: 3, min: 0,
    validate: [{ min: 2.5, severity: 'warn', message: 'Smaller than the datum offsets.' }] },
  { key: 'mode', label: 'Mode', type: 'select', options: [{ value: 'fast', label: 'Fast' }, { value: 'exact', label: 'Exact' }] },
  { key: 'source', label: 'Source', type: 'file', accept: '.kml,.geojson' },
]
```

| Type | Its own options |
|---|---|
| `text` | `placeholder`, `mono` |
| `number` | `placeholder`, `min`, `max`, `step` |
| `select` | `options`: `[{ value, label }]`, or a function of the node's data; `''` is stored as nothing |
| `checkbox` | |
| `code` | `language` (`sql`, `python`, `javascript`, `text`), `placeholder`, `rows`; `assistant: true` puts the AI assistant above it (the server's assistant writes code for SQLQuery, PythonScript and JavaScript) |
| `file` | `accept`. The file is stored through the host's storage and the field holds `{ fileName, fileSize, key }`; `run` reads it with `ctx.getFile(key)` |
| `readonly` | `value(data)`: text to show |
| `custom` | `component`: a Vue component given `node`, for what no type does (DataIngest's file chooser) |

Every field can also have `default` (its value until one is set; `run` sees
it too), `hint` (a line under it, with `` `backticks` `` for code, or a
function `(data, typed) => text`), `affectsOutput: false` (editing it
doesn't make the node stale) and `visible(data)`.

**Rules.** A field's `validate` is a list of rules, each with a `message`,
an optional `severity` (`'error'`, the default, or `'warn'`) and one test:
`required: true`, `min`, `max`, `pattern` (a regex, for text), or `when:
(value, data) => true when it's wrong`. Rules are checked as a field is
edited. An error shows under the field, stops the node running (Run says
why), and is its status on the canvas until it has run; a warning shows under
the field and as a badge on the node, whose tooltip says what it is. Rules
other than `when` are plain data, so a kind the server defines can carry
them.

**Slots and pins.** A node's outputs are slots. The first is what `run`
returns as its table, read downstream by the node's reference name
(`<id>_data`, or `<id>_<Output Name>`). A kind's `slots` add more, each read
as `<id>_<slot>` and filled through `slots` in what `run` returns:

```js
defineNodeKind({
  kind: 'geo.classify', label: 'Classify', category: 'geo',
  slots: [{ name: 'summary' }, { name: 'status', pin: true }],
  async run(ctx) {
    const table = ctx.table()                  // classify_data
    const summary = ctx.slotTable('summary')   // classify_summary
    // ... create both ...
    return { table, slots: { summary } }       // status: left out, so an empty table
  },
})
```

- **One output pin carries every slot.** Wiring it gives the node downstream
  all of them, each by its reference name; hovering it lists them.
- **A slot can have a pin of its own,** carrying just that slot: when its
  kind says `pin: true`, or when the node's data lists the slot in `slotPins`
  (the user's choice; step 9 adds the controls). The main pin still carries
  it, so giving a slot a pin never breaks a wire. Named pins show their
  names while the node is hovered.
- **Inputs** come through the main input pin, any number of wires. A kind's
  `inputPins` add named ones for inputs with a role (`ctx.inputs[i].pin` says
  which pin each came through); a named pin takes one wire unless it says
  `many: true`. Users don't add input pins. A pin's `hint` shows when it's
  hovered, after its label ("Site: the boundary to summarise around;
  optional"). A `required: true` pin with nothing wired in stops the node
  running: its ring shows hollow red even when the node isn't hovered, its
  face and Manage say "Site: wire a node into this input first.", Run is
  refused, and so is a run from downstream. Pins are optional by default.
- **A node of a kind this app doesn't have** (a placeholder) keeps every wire
  it was saved with, into named input pins as well as out of named slots.
- **Handles:** the main pins are `source-0` and `target-0`, as before, so saved
  graphs load unchanged; the others are named, `source:<slot>` and
  `target:<name>`, so reordering pins never rewires a graph.
- **Shown:** Data has a tab per slot, named as downstream code reads it; the
  Terminal lists the other slots' sizes after a run. Output Name can't take
  the name of another of the node's slots.
- A saved graph's wires carry their handles, and the server's whole-graph
  runs (`/execute`) read them as the browser does: a wire from the main pin
  brings every slot, one from a slot's own pin (`source:<slot>`) just that
  slot, and one into a named input pin (`target:<name>`) says so in the
  input's `pin`. There, only the kinds the server defines have slots beyond
  the first (the engine's README, "The app's node kinds").
- **One wire can bring a named input pin several tables.** A named pin
  takes one wire, not one table, so a wire from a node's main pin brings
  every slot of that node through it, each with that `pin`. A kind that
  wants one table there picks it (by slot, or by what's in it), or the user
  wires the slot's own pin instead.

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
`sizing` (`fill` | `content`, below), `defaultSize` (px along the linked
axis), `minWidth` (200), `minHeight` (140), `collapsed` (initial), `hotkey`
(a single key), `aboveBottom` (see below). Panels register with the layout
of the `PanelHost` around them: `FlowgraphEditor` is a PanelHost, and any app
can use one to put the same panels over its own content (a map, a scene),
from `seamonster/panels` ([widgets/panels](widgets/panels/README.md)). Panels
on one side sit side by side, from the edge inwards, in the order they
appear in the host's template. Names must be unique.

The editor's panels are Terminal, Library and Flowgraphs on the left, Data at
the bottom and Manage on the right. All but Manage start collapsed.
Flowgraphs is `aboveBottom`: it sits above Data, which runs underneath it.
(Terminal was called Console in 0.1; it was renamed so it isn't mistaken for
the browser's DevTools console, and its hotkey moved from C to T.)

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
A panel of the host's own is a `FlowPanel` (above), or any component whose
root is one, like the [Map panel](widgets/spatial/README.md#the-map-panel).
A hotkey stays with the first panel to register it: a later one with the
same key gets none, and the console says so.

The graph store (`FLOW_GRAPH`, injected; `PANEL_LAYOUT` is the layout's) has
what a host's panels need to follow the editor:

- `selectedNode` (a computed node, or null) and `select(id)`.
- `run.results[id]`, a node's last result (see Running nodes).
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

**The Terminal's logs.** Each node has a log, and so does the app. The
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

The behaviour lives in [panelLayout.js](lib/panelLayout.js):

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
- **Content panels** (`sizing="content"`), for panels floating over a host's
  content rather than sharing the window: linked, a side panel sits at the
  top of its edge, `defaultSize` wide (resizable), as tall as its content; a
  bottom panel sits at the left, as wide and tall as its content. They
  overlay everything else and don't push other panels. Once the window caps
  one, its body scrolls, across as well as down. Each shows its rail (at the
  start of its edge) while it overlaps another panel. Unlinked, they're like
  any other panel, minimum sizes included.

## Context menus

Menus use [the menu widget](widgets/menu/README.md). `PanelHost` renders
the editor's root through `MenuHost`, and regions opt in with `v-menu`:

- Panel titles and rails: `PANEL_MENU`, with the panel's name as context.
- Canvas: Nodes (categories with colour badges, then node types) and Panels.
- Nodes and wires: `NODE_MENU` (Open subnet, for a subnet; Reset; Delete) and `WIRE_MENU` (Delete), with the ID as context.
- A wire dropped on empty canvas: `CONNECTION_MENU`, opened from code with
  `MenuHost`'s `open()`.

Menus are defined as data: the panels' in [panelMenus.js](components/panelMenus.js)
(`PANEL_MENU`, `panelCommands(layout)`, `panelsSubmenu(layout)`), the graph's
in [flowMenus.js](components/flowMenus.js). PanelHost adds the panel
commands, and the editor its own on top. Right-clicking outside a region
shows no menu, not even the browser's.

The menu look is in a `<style>` block in [PanelHost.vue](widgets/panels/PanelHost.vue).
It sets the `--wm-*` tokens on `.flow-surface` (every PanelHost, so the
editor too), plus the part-class overrides: the category-coloured badges, and
the panning gradient on highlighted items (category colours for items under a
badged category, blue-green otherwise). Menus are portalled into their host,
so this styling reaches only its menus.

## Styling

- **`styles.css`**: the editor's tokens (`--flow-*`) and every one of its rules.
  Layout comes entirely from CSS, and components carry no styles of their own
  except the menu block in PanelHost.vue.
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

## Terminal commands

Step 8f ([commands.js](lib/commands.js), [CommandField.vue](components/CommandField.vue)):
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
