# davy-jones-locker 0.3.0

Spatial SQL in both engines, on the same DuckDB (1.5.5): the browser's
DuckDB-wasm moves up to match the engine's, the app serves DuckDB's spatial
extension, and the engine loads it behind its lockdown. Geometry keeps its
CRS between the browser, the engine and Python. And the engine now runs only
for local development (`IS_LOCAL`), where the app's node kinds can reach the
network.

Two changes every app must make: set `IS_LOCAL=true`, and serve the spatial
extension (Upgrading, below).

```
pip install davy-jones-locker==0.3.0
npm install --save-exact davy-jones-locker@0.3.0 seamonster@0.4.0
```

Base images: `ghcr.io/lukewilliams/davy-jones-locker-engine:0.3.0` (and
`-runner`, `-node-worker`), also tagged `0.3`.

## Upgrading

**Set `IS_LOCAL=true`, or the engine won't start.** The engine has no
sign-in yet, so it now runs only for local development: with
`IS_LOCAL=true` it starts, signs no one in, and lets the app's node kinds
reach the network, and says so (a warning in its log, `local` in
`/health`, LOCAL in the app). Without it, it counts as deployed, which
requires sign-in, and refuses to start. Put `IS_LOCAL=true` in a `.env`
beside your compose file (compose reads it, passes it to the engine, and
opens the node worker's way out from it; see `davy-jones-locker/.env.example`
and `compose.yaml`), or in the environment when running the engine without
Docker. It must be exactly `true` or `false`.

The app serves the spatial extension itself (24 MB, 6 MB gzipped). Add to
the app's `package.json`:

```json
"scripts": {
  "extensions": "davy-jones-locker-extensions public/duckdb-extensions",
  "predev": "npm run extensions",
  "prebuild": "npm run extensions"
}
```

and `public/duckdb-extensions/` to its `.gitignore`. Serve the `.gz` copies
if the server can, and a missing file as a 404 (the README's "DuckDB's
extensions" has an nginx block). Without the extension, everything but
spatial SQL still works.

An app with its own compose file and a node worker adds what the framework's
`compose.yaml` now has, so `IS_LOCAL` reaches the engine and opens the
worker's way out:

```yaml
services:
  engine:
    environment:
      IS_LOCAL: ${IS_LOCAL:-false}
  node-worker:
    networks:
      - nodes
      - outside-${IS_LOCAL:-false}
networks:
  outside-true: {}
  outside-false:
    internal: true
```

Upgrade seamonster to 0.4.0 with it: the shell's peer dependency is now
`^0.4.0`. Change the base images' tags in your Dockerfiles to `0.3.0`.

## Security

- **certifi 2026.10.19** (was 2026.7.22). It drops the emSign root whose
  intermediates were compromised (eMudhra's incident, October 2026), which
  the engine would otherwise trust for its outgoing HTTPS (the AI
  assistant's LiteLLM proxy). Rebuild images built on earlier versions.

## The app shell

- **DuckDB-wasm 1.33.1-dev64.0**, which is DuckDB 1.5.5, the engine's. The
  same SQL gives the same answers in both, to floating-point noise.
  DuckDB-wasm now publishes only dev builds; this one is pinned exactly.
- **DuckDB's spatial extension**, from the app's own origin:
  - `DavyJonesLocker`'s `extension-repository` prop, default
    `duckdb-extensions` beside the page;
  - `createDuckdbSql({ extensionRepository })` for an app wiring the editor
    itself;
  - `davy-jones-locker-extensions <folder>`, a command in the package that
    fetches the extension for this version with a gzipped copy.

  It loads the first time something needs it, and DuckDB checks its
  signature.
- `duckdbSql` gains `loadSpatial()`, and its `writeSqlite` takes column
  types, blobs and statements to run after the tables (for SEAMONSTER's
  GeoPackages).

## The engine

- **Spatial SQL.** The image installs DuckDB's spatial extension, and each
  session loads it before the lockdown, with x, y axis order.
- **The CRS through SQL.** A wired-in table's GeoParquet geometry loads as
  `GEOMETRY` with its CRS, so SQL keeps it and refuses to mix CRSs, and a
  query's output goes back as GeoParquet: each CRS as PROJJSON, the
  geometry types, and `"crs": null` for a column with none. Before, engine
  SQL sent geometry back as plain WKB, which the next node saw as bytes.
  OGC:CRS84 loads as `EPSG:4326`, as in the browser. Every table with
  geometry sent to PythonScript or the node worker is GeoParquet the same
  way.
- **DataExport's CSV, TSV and JSON write geometry as WKT**, as the browser
  does, not as bytes. The geo formats (GeoJSON, KML, GeoPackage,
  shapefiles) are written in the browser only, for now.
- **File readers refused.** `ST_Read`, `ST_Read_Meta`, `ST_ReadOSM`,
  `ST_ReadSHP` and `shapefile_meta` are refused in server SQL ("Read the file
  with DataIngest and wire it in."). The lockdown refuses them on its own
  too, for files, URLs and GDAL's network drivers, and tests check both.
  `PROJ_NETWORK=OFF`.
- **PythonScript and geometry.** Where the runner has geopandas, an input
  with geometry is a GeoDataFrame with each column's CRS, and a
  GeoDataFrame (or GeoSeries) the script ends with comes back as `GEOMETRY`
  with its CRS. A variable's summary names its CRS. The framework's runner
  has no geopandas: an app adds it in a runner image built on this one (the
  engine README's "Python and geometry" has the Dockerfile). Without it,
  nothing changes.
- **`IS_LOCAL`** (above). In local development a node kind may say it needs
  the network (`network=True`), and every kind has it: compose puts the
  node worker on `outside-true`. A deployed worker stays sealed until
  sign-in and a proxy (roadmap 10e). The Python sandbox stays sealed either
  way.
- **Node kinds that explain themselves:** `NodeKind(description=...)`, and
  input pins with `hint` and `required` (`GET /nodes` carries them). A
  required pin with nothing wired in is refused before the node worker is
  asked, and by the worker, and `nodes.testing.Context` refuses it too;
  `kind.errors(node, pins=...)` checks it.
- **`RUNNER_PACKAGES_FILE`**: an app's own runner `requirements.in`, which
  the assistant reads to know what scripts can import (and, with geopandas
  listed, that inputs with geometry are GeoDataFrames).
- **The same numbers in both engines:** buffer, intersection, area, length,
  distance, spheroid area and transformations over fixed fixtures match the
  browser's, checked by a test.
- Without the extension (outside Docker), the engine runs and says spatial
  SQL isn't available. The README's "Developing without Docker" installs
  it.
- **Tests:** `pip install --group test`, then `python -m pytest`. They're in
  the source distribution, not the wheel.

## Known limits

- **PythonScript without geopandas** sees geometry as WKB bytes, and a
  DataFrame it returns with them comes back as a blob, without its CRS.
  Shapely objects in a plain column (not a GeoSeries) can't be returned.
- **DataExport on the engine** (whole-graph runs) writes CSV, TSV, JSON and
  Parquet only, and its CSV quotes every field.
- **The engine reads no files** in SQL: read them with DataIngest and wire
  them in.
- **No datum grids:** a transformation that needs one uses PROJ's grid-free
  choice, as the browser does.
- **No sign-in yet:** the engine runs only with `IS_LOCAL=true`, on your own
  machine.
