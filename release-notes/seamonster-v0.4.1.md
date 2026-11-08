# seamonster 0.4.1

Subnets: a graph inside a node, run as one node, inline or shared. And a
host can add panels to the flowgraph editor, or move and replace its own, and
SEAMONSTER has its first such panel: a map of the selected node's geometry.

```
npm install seamonster@0.4.1
```

## Added

- **Subnets.** The Subnet node (Custom) runs a graph of its own, as it is.
  Double-click it (or Enter, or Open subnet in Manage) to open it on the
  canvas, with a breadcrumb after the title; Escape goes back up. Inside,
  Input and Output nodes are its pins, named by their IDs: an input pin per
  Input, and the topmost Output its first output (`<subnet>_<output>`), the
  others outputs with pins of their own. A new subnet passes its input
  through. Nodes inside are known by path (`screening/classify`): their
  run state, Data and Terminal show when it's open, and a node there runs
  with what it needs, the subnet's inputs first. Errors name where they
  started (`Screening › Classify: …`). Manage's Graph shares a subnet's
  graph by name (kept in the document's `subnets`), uses a shared one, or
  takes a copy; editing a shared one changes every use, and each goes
  stale. See the README, "Subnets".
- **Kind options** for it, any kind can use: `mainInput` (`'many'`, `'one'`
  or `false`), `mainOutput: false` and `create()` (data a new node starts
  with).
- **FlowgraphEditor's `panels` slot.** Filled, it replaces the editor's
  panels: put `EditorPanels` (all five, in their usual order) beside the
  host's own, or list `TerminalPanel`, `LibraryPanel`, `FlowgraphsPanel`,
  `DataPanel` and `ManagePanel` one by one to move, reorder or leave them
  out. FlowPanel's props given to one of them replace its own
  (`<ManagePanel dock="left" />`). A hotkey stays with the first panel to
  register it; a later one with the same key gets none, with a console
  warning.
- **`aboveBottom` on the right.** The innermost right panels can stop above
  the bottom panel while it's open, as the last left ones can; Data then
  runs under them, as far as the right's full-height panels (Manage).
- **The Map panel** (`MapPanel`, from `seamonster/spatial/leaflet`, hotkey
  P): the selected node's geometry columns, drawn in longitude and latitude
  (or "CRS unknown"), and the nodes pinned to it. A table shaped like
  `fromRows`'s draws a layer per row. Clicking a feature picks its row in
  Data, and picking a row in Data highlights its features. Props:
  `basemap` (OpenStreetMap by default) and `featureLimit` (10,000 rows per
  geometry column); FlowPanel's pass through. Import
  `leaflet/dist/leaflet.css` with it. See the spatial README, "The Map
  panel".
- **Picking a row in Data:** click a row to pick it, again to let it go.
- **For a host's panels, on the graph store:** `dataView` (Data's open tabs
  and picked row), `showRow` (pick a row from elsewhere: selects the node,
  opens its tabs, turns the page), `select(id)`, `addOutputReader` (read
  each output table as its node runs, while the table is there) and
  `setPanelData` (a panel's own data on a node, saved with the graph). See
  the README, "Panels".
- **`LeafletMap` and `DeckMap` take `selected`** (features to highlight,
  `[{ layer, feature }]`) and `selectedStyle`; `SELECTED_STYLE` is exported
  from `seamonster/spatial`. `LeafletMap` now follows its container when it
  resizes.

## Fixed

- **Renaming a node no longer drops its wires into one-wire named pins**
  (8c's `inputPins`). Vue Flow checked every wire the editor gave it as if
  it were being drawn, so such a wire counted against itself.

## Known limits

Subnets:

- the subnet that's open isn't saved: reopening the page shows the top;
- deleting an Input or Output drops the wires to its pin, and undo brings
  back the node, not those wires; moving another Output above the first
  changes which is first;
- renaming an Input or Output doesn't rewrite code that reads it, as for
  any node;
- a shared subnet nothing uses stays in the document: it can't be deleted
  yet.

The Map panel:

- draws with Leaflet only: there's no deck.gl Map panel yet for more
  features than Leaflet draws smoothly;
- draws the first 10,000 rows of each geometry column, and the first 200
  rows of a layers table, with a note saying so;
- reads every output table's geometry on every run while it's mounted, so
  runs with large geometry tables take longer;
- doesn't draw a node that ran before the panel was mounted until it runs
  again;
- doesn't save its view with the graph.
