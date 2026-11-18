# davy-jones-locker 0.5.0

The node worker's way out to the internet is now a setting of its own,
`NODE_NETWORK`, rather than following `IS_LOCAL`, and the browser's SQL
handles time zones, with every DuckDB extension it loads served by the app.
Goes with
[seamonster 0.5.0](https://github.com/lukewilliams/davy-jones-locker/releases/tag/seamonster-v0.5.0);
the shell takes seamonster 0.4.3 too.

```
pip install davy-jones-locker==0.5.0
npm install --save-exact davy-jones-locker@0.5.0 seamonster@0.5.0
```

Base images: `ghcr.io/lukewilliams/davy-jones-locker-engine:0.5.0` (and
`-runner`, `-node-worker`), also tagged `0.5`.

## Added

- **Time zones in the browser's SQL**: `TIMESTAMPTZ`, `AT TIME ZONE` and
  `timezone()` work in the browser as on the engine (DuckDB's `icu`). The
  browser's DuckDB runs in UTC, as the engine's image does, so a
  `TIMESTAMPTZ`'s date parts and casts agree in both.
- **`f.Graph.Clear`** in the Terminal: deletes every node and wire on the
  canvas, as seamonster's Clear graph does; Ctrl+Z (Cmd+Z on a Mac) brings them
  back.
- **`canvas-menu`** passes through `DavyJonesLocker` to FlowgraphEditor:
  the app's own items on the canvas's right-click menu.
- **An engine's `NodeCategory` can relabel a built-in category**:
  `NodeCategory("fetch", "Query")`, with `colors` to recolour it too. The
  browser applies it when it reads the engine's node kinds.

## Changed

- **Node kinds reach the network only with `NODE_NETWORK=open`.** Until
  now, `IS_LOCAL=true` also gave the node worker a way out. Now it's off by
  default, in local development too: kinds that call web services need
  `NODE_NETWORK=open` in compose's `.env`, beside `IS_LOCAL`, and a kind
  that says `network=True` is refused without it. `open` is for local
  development only: with `IS_LOCAL` false, the engine refuses to start.
  Compose's networks are renamed to match (`outside-open`, `outside-none`).
- **Every DuckDB extension the browser loads comes from the app**
  (`extension-repository`), not from DuckDB's servers:
  `davy-jones-locker-extensions` now fetches parquet, json, icu and excel
  beside spatial, and `extension-repository` is DuckDB's
  `custom_extension_repository`, so anything DuckDB loads by itself is looked
  for there. An app's Content-Security-Policy needs no DuckDB host for them.
  DuckDB-wasm itself (with `apache-arrow`, `flatbuffers` and `tslib`) still
  loads from `cdn.jsdelivr.net`, so keep that host in the policy.
  That's DuckDB's default, not a lock: a query can still ask for other URLs,
  and only the page's `connect-src` stops it.
- **An extension DuckDB refuses says why** (a signature it doesn't accept,
  say), rather than only that it couldn't be loaded.
- **`/health` reports `nodeNetwork`**: whether the app's node kinds can
  reach the network. The Terminal's warning on connecting says so.
- The READMEs' early-release banners no longer name a version.
- **The app shell takes seamonster 0.5** as well as 0.4 (0.4.2 or later).
- **`engines`** in the package says the Node it builds on: 20.19 or later,
  or 22.12 or later (Vite 8's range). Vite is 8.3.3 or later in development.
- **A node kind's select options can be plain values**:
  `options={"options": ["flux", "sql"]}` reaches Manage as options labelled
  with their values. Until now such a select showed blank options that
  couldn't be chosen, and the node ran with its default.
- **The engine refuses a select it can't show**: options that aren't plain
  values (text or numbers) or `{"value", "label"}`, an option given twice, or
  a default that isn't one of them. It says which kind and field.
- **The engine's refusals say where to run instead**: a JavaScript node, a
  kind the server can't run, and a DataExport format it can't write (Excel,
  the geo formats) each fail saying it runs in the browser.
- **A query naming `db` on an engine with no query database** says so,
  and which setting to add (`QUERY_DATABASE_URL`, or `DATABASE_URL`), in
  place of DuckDB's "Catalog "db" does not exist".

## Upgrading

- **Run `davy-jones-locker-extensions` again** (`npm run extensions`, which
  `predev` and `prebuild` do), and make sure the app serves its folder:
  without the new files, Parquet, JSON, Excel, time zones and every table
  from the engine fail, saying which extension is missing. An app that has
  skipped the command until now (spatial wasn't essential) needs it now, or
  `extension-repository="https://extensions.duckdb.org"` for DuckDB's own.
  The app's `dist/` and image grow by roughly 20 MB before compression (icu
  is about 6 MB for each of DuckDB-wasm's builds).
- **Move your app's own Vite to 8.3.3 or later**: 8.3.0 to 8.3.2 are inside
  its dev server's advisories.
- **Apps with node kinds that call web services** (in local development):
  add `NODE_NETWORK=open` to compose's `.env`, and change any
  `outside-${IS_LOCAL:-false}` in your compose file to
  `outside-${NODE_NETWORK:-none}`, with the networks `outside-open: {}`
  and `outside-none` (internal), as the framework's `compose.yaml` does.
  Without it, those kinds lose the network, and a kind with `network=True`
  is refused.
- **If your compose file still says `outside-${IS_LOCAL:-false}`**, the
  worker keeps its way out with `IS_LOCAL=true`, while the engine reports
  that it has none. Change it as above.
- **Apps whose runner or node worker image installs its own pinned
  packages**: if they pin `certifi`, pin 2026.10.19 or later (the engine's),
  or an older pin puts back the emSign root 0.3.0 dropped.
- **Apps with a select field** whose default isn't one of its options, or
  with an option given twice: the engine now refuses to start, naming the
  kind and field. Fix the definition.

## Known limits

- An engine run outside Docker takes its machine's time zone, so a
  `TIMESTAMPTZ`'s date parts can differ from the browser's (UTC): start it
  with `TZ=UTC`.
- `icu` loads as the browser's DuckDB starts (2 MB gzipped, cached), to set
  UTC, rather than when a query first needs it.
- A deployed engine's node worker has no way out to the internet.
- Outside Docker nothing limits the node worker's network, whatever
  `NODE_NETWORK` says.
- The engine reports `NODE_NETWORK` as it's set: it can't see the worker's
  real network.
