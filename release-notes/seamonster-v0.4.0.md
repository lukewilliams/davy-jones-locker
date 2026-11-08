# seamonster 0.4.0

Geometry as geometry: DataIngest reads geo files into `GEOMETRY` columns that
carry their CRS, SQL in the browser has DuckDB's spatial functions (with
warnings when spatial SQL probably doesn't mean what it says), Data shows
geometry, and DataExport writes KML, GeoPackage and shapefiles. Node kinds
can also explain themselves now: a description, hints on input pins, and
required input pins.

```
npm install seamonster@0.4.0
```

## Upgrading

- **It needs a SQL engine on DuckDB 1.5 with its spatial extension:**
  [davy-jones-locker 0.3.0](https://github.com/lukewilliams/davy-jones-locker/releases/tag/davy-jones-locker-v0.3.0)'s
  `duckdbSql`, with the extension served by the app (0.3.0's notes say how).
  An app that uses SEAMONSTER's widgets but not its editor needs nothing.
- **Breaking: a GeoJSON file's geometry is a `GEOMETRY` column**, no longer
  GeoJSON text. SQL that parsed the text needs changing (see Changed).

## Added

- **Geo files in DataIngest:** GeoJSON, KML, a zipped shapefile, GeoPackage
  and FlatGeobuf, read with DuckDB's spatial extension (`ST_Read`).
  - Each layer is a table. A file with one layer is the node's table, and
    one with several (a KML's folders) is several tables, like a workbook's
    sheets.
  - Holes, multi-part features and points are kept as they are.
  - The geometry is a `GEOMETRY` column called `geometry`, with its CRS in
    the type: `EPSG:4326` for KML and GeoJSON, a shapefile's from its
    `.prj`, a GeoPackage's per layer. A shapefile without a `.prj` has no
    CRS, and keeps none: nothing assumes longitude and latitude.
  - Heights that are all 0 (KML writes them) are dropped.
- **Spatial SQL in the browser:** `ST_Transform`, `ST_Area_Spheroid`,
  `ST_Buffer` and the rest. Axis order is always x, y (longitude first),
  whatever a CRS says, as on the engine, so
  `ST_Transform(geometry, 'EPSG:7855')` needs no `always_xy`.
- **The CRS through SQL.** A geometry column's CRS is on its type
  (`GEOMETRY('EPSG:7855')`): a column passed through keeps it,
  `ST_Transform` gives its target's, and mixing CRSs is refused. It goes to
  the server and back with the table, so a query that runs there keeps it
  too.
- **Geometry in Data:** a geometry column's header has its types and CRS,
  and how many of its geometries are invalid or empty; a cell has its type
  and its area or length on the ellipsoid (`POLYGON · 1.75 ha`), with its
  WKT on hover.
- **DataExport writes KML, GeoPackage and zipped shapefiles**, beside
  GeoJSON. KML is longitude and latitude (transformed, or refused without a
  CRS); GeoPackage and shapefiles keep the CRS. All three write every table
  of their input: folders, layers, shapefiles.
- **Spatial warnings:** SQLQuery warns when spatial SQL probably doesn't
  mean what it says. Warnings show in the Terminal, in amber, and on the
  node's badge:
  - measuring (`ST_Area`, `ST_Distance`, `ST_Buffer`...) on longitude and
    latitude, which works in degrees;
  - `ST_Transform` between datums PROJ joins only by a null transformation,
    which drops the shift between them (DataExport's GeoJSON and KML warn
    about this too);
  - `ST_Transform` to a PROJ string with no datum, constant or built per
    row, which applies no datum shift;
  - the `_Spheroid` functions given `ST_FlipCoordinates` (NaN: they take
    longitude first) or a projected CRS.
- **LOCAL in the status bar** when the server is in local development mode
  (`status.local`), with a warning in the app's log: it signs no one in, and
  node kinds that run on it can reach the network.
- **PythonScript and geometry:** where the server's runner has geopandas
  (an app adds it; davy-jones-locker 0.3.0's engine README has how), an
  input with geometry is a GeoDataFrame with its CRS, and a GeoDataFrame
  returned comes back as `GEOMETRY` with its CRS.
- **`warnings` from `run`**, for a kind's own warnings, and
  `ctx.spatialWarnings(query)`.
- **`loadSpatial()`**, optional on the `sql` prop. The runner calls it before
  reading Parquet that holds geometry.
- **Kinds that explain themselves:** a kind's `description` (shown in Manage
  above its fields, and in the Library on hover; the built-ins that run have
  one), an input pin's `hint` (on hover), and `required: true` input pins. A
  required pin with nothing wired in shows as a hollow red ring, the node
  and Manage say so ("Site: wire a node into this input first."), and it
  doesn't run. Pins stay optional by default.

## Known limits

The README's "Limits of files" lists them all. The ones most likely to
matter:
- A GeoPackage without GDAL's feature counts (`gpkg_ogr_contents`) can't be
  read; saving it again with QGIS or ogr2ogr fixes it.
- In browser SQL, use `EPSG:4326`, not `OGC:CRS84` (DuckDB-wasm fails on
  it).
- KML reads back names and descriptions only (GDAL's KML reader skips
  ExtendedData).
- GeoPackage export has no spatial index; shapefiles hold one kind of
  geometry, with dBase's 10-character names and 254-byte text.
- KMZ and File Geodatabase aren't read.
- `ST_Transform(geometry, source, target)` returns geometry with no CRS
  (`ST_SetCRS` puts it back); a PROJ-string or per-row target works only in
  that form, on geometry with no CRS on its type.
- PythonScript sees geometry as a GeoDataFrame only where the server's
  runner has geopandas; otherwise as WKB bytes, which come back as a blob.

## Changed

- **A GeoJSON file's geometry is a `GEOMETRY` column**, no longer GeoJSON
  text. A graph that read one before keeps the text it read until the file
  is chosen again. SQL that parsed the text needs changing (the spatial
  functions take the column as it is).
- **DataExport's GeoJSON** writes a `GEOMETRY` column in longitude and
  latitude, transformed from its own CRS when it has another. It refuses a
  column whose CRS isn't known. A column of GeoJSON text still works.
- **Parquet with geometry is DuckDB's GeoParquet**, wherever a table goes
  out (to the server, to a server kind, DataExport, DataIngest's stored
  tables). The runner's own record of `geo` metadata is gone: the CRS comes
  from the column's type. A column with no CRS is written with
  `"crs": null`, so it stays unknown rather than becoming longitude and
  latitude.
- **OGC:CRS84 is read as `EPSG:4326`**, the same coordinates in x, y order.
  DuckDB-wasm's spatial extension fails on CRS84 ("stoi: no conversion"),
  even opening a file that has it, so the runner reads GeoParquet's `geo`
  itself. A GeoParquet file with no `crs` (CRS84 by its rule) now loads.
- **The `sql` prop's `writeSqlite`** takes `(tables, { statements })`:
  column types (`types`), bytes as blobs, and statements run after the
  tables. GeoPackage needs them; davy-jones-locker 0.3.0's has them.
- **DataExport's GeoJSON and KML** take the column called `geometry`, or
  else the first `GEOMETRY` column; decimals are numbers.
- **A GeoPackage's "undefined" SRS** is read as no CRS.
- **A DataExport's run keeps what else it returned** (its output, its
  warnings): the graph store kept only the export.
- **SQLite export writes geometry as WKT and blobs as blobs.** They were
  JSON arrays of byte values.
- **A node of a kind the app doesn't have keeps its wires into named input
  pins.** Loading the graph dropped them, and saving lost them.
