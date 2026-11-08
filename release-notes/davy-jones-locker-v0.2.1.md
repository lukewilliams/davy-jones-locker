# davy-jones-locker 0.2.1

The engine's whole-graph runs keep a geometry's CRS from node to node, as
[seamonster 0.3.1](https://github.com/lukewilliams/davy-jones-locker/releases/tag/seamonster-v0.3.1)
does in the browser; node kinds' handlers can report errors without a
traceback, read a file field in one call, and be tested without a worker.
The app shell is unchanged apart from its README.

```
pip install davy-jones-locker==0.2.1
npm install --save-exact davy-jones-locker@0.2.1 seamonster@0.3.1
```

Base images: `ghcr.io/lukewilliams/davy-jones-locker-engine:0.2.1` (and
`-runner`, `-node-worker`), also tagged `0.2`.

## Added

- **`NodeError`** (`from davy_jones_locker.nodes import NodeError`): raise
  it, or a subclass, for a problem the node's user can fix, and its message
  alone is the node's error. Any other exception still shows with its
  traceback, as a bug.
- **`ctx.file_field(key)`**: the file chosen in a file field, as `(name,
  bytes)`, the name as the user chose it. Its errors name the field as
  Manage does ("Source: choose a file.").
- **`davy_jones_locker.nodes.testing`**: runs a handler in a test as the
  node worker would, in the test's own process: `Context(node, inputs,
  files, kind)` and `run(handler, ctx)`, with the same `ctx`, tables through
  Parquet both ways, `print` to the log, and settings that break an error
  rule refused. See the engine README's "The app's node kinds".

## Changed

- `ctx.input(ref)` for an input that isn't wired in, and `ctx.file(key)` for
  a file that wasn't sent, raise a `NodeError` that is also a `KeyError`, so
  the node shows the message without a traceback and code catching
  `KeyError` works as before.
- `davy_jones_locker.nodes` is a package (`nodes/`), so the node worker's
  image copies a folder rather than a file. Imports are unchanged. An app's
  worker image built `FROM` the framework's needs no change.

## Fixed

- **GeoParquet metadata survives whole-graph runs** (`POST
  /graphs/{id}/execute`). A table loaded from Parquet with `geo` metadata
  (a node kind's output, a DataIngest file) lost it once in DuckDB, so the
  next node kind couldn't tell its CRS, and DataExport's Parquet had none.
  The engine now keeps it for each table and writes it back when the table
  goes out as Parquet: to the node worker, the runner, or DataExport.

## Docs

- The engine's README: a named input pin can bring several tables (one
  wire from a main pin carries every slot); how geometry travels; how long
  the engine waits for the node worker (the kind's `timeout_s` plus 30
  seconds); developing an app's kinds with the engine installed from PyPI.
- The app shell's README: pin exact versions; the engine's node kinds and
  `defineServerKinds`.
