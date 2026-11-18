# seamonster 0.5.0

Clear graph, the app's own canvas menu items, relabelled categories, and
fixes for Space in text fields, touch menus and Sheet's numeric keys.

```
npm install seamonster@0.5.0
```

Released with davy-jones-locker 0.5.0, whose shell takes it (or 0.4.3).
davy-jones-locker 0.4.1 asks for seamonster 0.4, so an app on it stays on
seamonster 0.4.3.

## Added

- **Clear graph** on the canvas's right-click menu: every node and wire on
  the canvas (inside a subnet, the subnet's) as one deletion Ctrl+Z
  (Cmd+Z on a Mac) brings back. It's `graph.clear()` too.
- **`canvasMenu`** on FlowgraphEditor: the app's own items on the canvas's
  right-click menu, after the built-ins, run with `{ graph }`.
- **`status.nodeNetwork`** on the `server` prop: true when node kinds that
  run on the server can reach the network. The Terminal's warning on
  connecting to a server in local development says so only when it's true;
  "· LOCAL" no longer implies it.
- **Relabel a built-in category**: `defineNodeCategory` with a built-in's
  id (`fetch`, `modify` and the rest) changes its `label`, its `colors` or
  both. Its id, order and kinds stay put, so saved graphs are unaffected.

## Changed

- **`engines`** in the package says the Node it builds on: 20.19 or later,
  or 22.12 or later (Vite 8's range). Vite is 8.3.3 or later in development.
- **A kind with nothing to run it** (a placeholder, or no `run` and no
  server) now fails with "… nodes have nothing to run them.", not "… nodes
  can't run yet."

## Fixed

- **Shift+Space in text fields.** With a modifier held, Space in a text
  field (the SQL editor, Manage's fields) was taken by the canvas's
  Space-to-pan key and typed nothing. Space pans only outside text fields
  now, and types a space inside them, with or without Shift.
- **Sheet's `fromLongRows`** sorts BIGINT row and column keys numerically.
  DuckDB returns them as BigInts, which were sorted as text, so row 10 came
  before row 2.
- **A long-press on a touch screen opens the menu of what was pressed.**
  It showed the items of whatever was last right-clicked (a node's on the
  canvas, say), since the menu learnt where it was only from a right-click.
  Pressing where there's no menu now opens nothing, as a right-click does.
- **A SQL query DuckDB can't parse to decide where it runs** (its `json`
  extension didn't load) now fails with DuckDB's reason. It used to run in
  the browser instead, and a query meant for the server failed as a missing
  table.

## Upgrading

- **Move your app's own Vite to 8.3.3 or later**: 8.3.0 to 8.3.2 are inside
  its dev server's advisories.

## Known limits

- Opened after a run, a loop shows its last run's nodes, or none when the
  server ran it: `status` says how each run went.
- No resume: running a loop again runs every row again.
- In the browser a loop runs one run at a time.
- `status.nodeNetwork` comes from servers that report it (davy-jones-locker
  0.5.0's engine). Without it, the Terminal doesn't warn that node kinds
  can reach the network.
