# DAVY JONES' LOCKER

> **Early release.** This is 0.2: the API may change between minor versions
> until 1.0, so pin an exact version if you depend on it.

An app framework for flowgraphs, built on SEAMONSTER (the UI library). It
supplies what SEAMONSTER's editor leaves to its host: a browser shell that
runs SQL in the browser and keeps the open graph, and a Python engine that
runs what the browser can't. An app built on it chooses its title, themes,
engine settings, its own node kinds (written in Python, run on the engine)
and (later) its own console commands.

| Folder | What | Released as |
|---|---|---|
| [app/](app/) | the browser shell: the engine client, DuckDB-wasm, storage, and `DavyJonesLocker`, the whole window | `davy-jones-locker` on npm |
| [engine/](engine/README.md) | the Python engine (FastAPI), its sandboxed runner, and the node worker for the app's own node kinds | `davy-jones-locker` on PyPI, and base images on `ghcr.io` |
| [engine-shared/](engine-shared/README.md) | optional development services: Postgres, later identity and storage | (with the repo) |
| [compose.yaml](compose.yaml) | the engine, runner and node worker as an app runs them, to copy | (with the repo) |

## The app shell

```vue
<script setup>
import { DavyJonesLocker } from 'davy-jones-locker'
</script>

<template>
  <DavyJonesLocker
    title="MYAPP"
    theme="LUX"
    engine-url="/engines/engine-myapp"
    engine-name="engine-myapp"
    storage-name="myapp"
  />
</template>
```

with `import 'seamonster/style.css'` once in the app's entry. Props:

| Prop | Default | |
|---|---|---|
| `engine-url` | none | where the browser reaches the engine (the app's own origin, `/engines/<service>`). Without it everything runs in the browser, and the window says so |
| `engine-name` | `'The engine'` | what messages call the engine |
| `storage-name` | `'davy-jones-locker'` | the open graph is kept in localStorage under `<name>:open-graph`, and DataIngest files in the IndexedDB database `<name>` |
| `extension-repository` | `'duckdb-extensions'` | where the app serves DuckDB's extensions, relative to the page or absolute (below) |

Anything else (`title`, `theme`) passes through to SEAMONSTER's `FlowgraphEditor`.
The parts are exported too, for an app that wires `FlowgraphEditor` itself:

- `createEngineClient({ url, name })`: the engine as FlowgraphEditor's `server`
  prop ([engineClient.js](app/engineClient.js)), checking its `/health` every
  5 s while it answers and every 15 s while it doesn't. Its `runNode` runs a
  node of one of the app's own kinds, and `nodes()` lists them.
- `defineServerKinds(client)`: defines the engine's own node kinds and
  categories in the browser (with SEAMONSTER's `defineNodeKind`), whenever the
  engine's list of them changes ([serverKinds.js](app/serverKinds.js)). A
  graph's nodes of those kinds are placeholders until then. A kind the app
  already defined in the browser keeps that definition, and one the engine
  changes while the page is open changes on the next reload.
  `DavyJonesLocker` does this itself.
- `duckdbSql`: FlowgraphEditor's `sql` prop ([duckdbSql.js](app/duckdbSql.js)):
  DuckDB-wasm (1.33.1-dev64.0, which is DuckDB 1.5.5, the engine's) and
  sql.js (1.13.0), loaded from jsDelivr when first needed, never bundled.
  `createDuckdbSql({ extensionRepository })` makes one with its extensions
  elsewhere; `duckdbSql` is one made with the default.
- `createLocalGraphStorage(name)`: FlowgraphEditor's `storage` prop
  ([localGraphStorage.js](app/localGraphStorage.js)).

### DuckDB's extensions

DuckDB's spatial extension (geometry, `ST_Read` for DataIngest's geo files) is
24 MB, 6 MB gzipped, so the app serves it itself rather than every browser
fetching it from DuckDB. It loads the first time something needs it (a geo
file, a spatial function, Parquet with geometry), from
`<extension-repository>/v1.5.5/<wasm_eh|wasm_mvp>/spatial.duckdb_extension.wasm`.
DuckDB checks its signature as it loads, so only DuckDB's own file loads.

The package's `davy-jones-locker-extensions` command fetches it for the
DuckDB this version runs, with a gzipped copy beside each file, into a
folder the app serves as it is. With Vite, run it before `dev` and `build`:

```json
"scripts": {
  "extensions": "davy-jones-locker-extensions public/duckdb-extensions",
  "predev": "npm run extensions",
  "prebuild": "npm run extensions"
}
```

and leave `public/duckdb-extensions/` out of git. It fetches only what's
missing, so it's quick once done. A server should serve the `.gz` copies, with
a long cache (a path names its DuckDB version, so a file never changes), and
answer a missing file with a 404 rather than the app's page. With nginx:

```nginx
location /duckdb-extensions/ {
  gzip_static on;
  add_header Cache-Control "public, max-age=31536000, immutable";
  try_files $uri =404;
}
```

To use DuckDB's own instead, pass
`extension-repository="https://extensions.duckdb.org"`.

Without it, everything but spatial SQL works, and a geo file or spatial query
fails saying where the extension should be. An app linked with `file:` may
need `npm rebuild davy-jones-locker` to link the command the first time.

`vue` and `seamonster` are peer dependencies. An app linking the framework
from a folder (`file:`) should add `davy-jones-locker` and `seamonster` to
Vite's `resolve.dedupe` with Vue and Vue Flow.

## The engine

See [engine/README.md](engine/README.md): the API, settings, safeguards, the
app's own node kinds (`nodes.py`, the node worker), and how an app builds its
engine on the framework's (`create_app`, and an image `FROM
ghcr.io/lukewilliams/davy-jones-locker-engine`).

## Rules

- JavaScript nodes never run on the engine until it has safeguards for them.
- Nothing with credentials reaches the runner or the node worker:
  `runner.env` and `node-worker.env` have limits only.
- The engine refuses every request from the runner and the node worker.
- The app's node kinds run in the node worker, never in the engine.
- Secrets live in the engine's `.env`, never in the browser.
- Python libraries are enabled by editing `engine/runner/requirements.in`,
  recompiling with hashes, and rebuilding; scripts can't install anything.
- There's no sign-in yet, so the engine starts only with `IS_LOCAL=true`
  (local development: it signs no one in, and the app's node kinds can reach
  the network). Keep it on your own machine. The app shows LOCAL beside the
  server's address, and says so in the Terminal.
