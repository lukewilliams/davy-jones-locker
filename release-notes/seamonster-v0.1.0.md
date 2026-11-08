# seamonster 0.1.0

The first release of SEAMONSTER: Vue 3 widgets for wrangling data in
flowgraphs, led by a flowgraph editor.

```
npm install seamonster vue reka-ui @vue-flow/core @vue-flow/background
```

This is an early release: the API may change between minor versions until
1.0, so pin an exact version if you depend on it.

## The flowgraph editor

`<FlowgraphEditor />` is a whole editor in one component: a pannable canvas
of nodes and wires, docked panels, and right-click menus.

- **Nodes that run:** SQLQuery, JavaScript, DataIngest and DataExport run in
  the browser. PythonScript, and SQL that reads a table no wired input
  supplies, run on a server engine the host provides. A node runs with
  everything upstream of it, in order.
- **Files in and out:** DataIngest reads CSV, TSV, JSON, GeoJSON, Parquet,
  Excel (a table per sheet) and SQLite (a table per table). DataExport
  writes the same formats.
- **JavaScript nodes** run in a sandboxed iframe's worker, with no access to
  the page, its storage or its cookies, and stop after 30 seconds.
- **Statuses:** running, completed, failed, and stale when a node's settings
  or inputs change after it ran. Reset takes a node back to not run. Wires
  colour to show what's flowed.
- **Panels:** Console, Library, Flowgraphs, Data and Manage, docked or
  floating, with hotkeys (C, L, G, D, M) and Ctrl+Space to collapse them all.
- **You can see what leaves the browser:** a node that runs on the server
  blinks a dot, and the status bar's dot blinks only while the graph has
  such a node.
- **AI assistant** (when the host's server has one): describe what a SQL,
  Python or JavaScript node should do, and it writes the code, with a note
  and Undo. Nothing runs until you run it.
- **Themes:** FLOW, FLOWDARK, LUX and LUXDARK, plus your own with
  `defineTheme`, which can change the brand gradient.

The editor owns nothing of its host's: storage, the SQL engine and the
server arrive as props, and it works without any of them.
[`davy-jones-locker`](https://www.npmjs.com/package/davy-jones-locker)
supplies all three.

## The other widgets

Each is its own entry, and needs only its own libraries (optional peer
dependencies):

- `seamonster/menu`: declarative, context-sensitive context menus
- `seamonster/controls`: control panels (selects, checkbox groups) with
  disable rules
- `seamonster/doc`: markdown documents
- `seamonster/scene`: a 3D scene, on three.js and TresJS
- `seamonster/sheet`: spreadsheet-style tables
- `seamonster/spatial`: maps, with Leaflet and deck.gl renderers

All their CSS is in one file: `import 'seamonster/style.css'`.

## Not yet

- Some node kinds in the Library can't run yet: HTTP Request, 3D Asset,
  GeometryScript, HLSL, Network Fuse, Debug, DXF Import and Subnet.
- The Flowgraphs panel only runs the graph: saving, versions and shared
  libraries come later.
- The doc widget renders markdown without sanitising it: sanitise documents
  from sources you don't control.
