# seamonster 0.3.1

A geometry's CRS now travels with its table from node to node, instead of
being lost the first time a table passes through the browser.

```
npm install seamonster@0.3.1
```

## Fixed

- **GeoParquet metadata survives between nodes.** A server kind's output
  with GeoParquet `geo` metadata (each geometry column's encoding and CRS)
  lost it on arrival: DuckDB keeps a Parquet file's rows but not its
  metadata, so the next server kind got a table whose CRS it couldn't know.
  The runner now keeps each table's `geo` and writes it back whenever the
  table goes out as Parquet again: to a server kind, to PythonScript, or
  from DataExport. A GeoParquet file read by DataIngest keeps it too.
- **DataExport's Parquet is GeoParquet** when its input came with that
  metadata, so GDAL, QGIS and geopandas read the geometry with its CRS.

## Added

- **`ctx.parquetOf(table)`**, one table as Parquet, with its `geo` metadata
  when it has some.

A SQL query's output doesn't carry the metadata yet: geometry through SQL
comes with DuckDB's spatial extension (roadmap step 8g).
