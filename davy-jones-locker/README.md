# DAVY JONES' LOCKER

> **Early release.** This is 0.1: the API may change between minor versions
> until 1.0, so pin an exact version if you depend on it.

An app framework for flowgraphs, built on SEAMONSTER (the UI library). It
supplies what SEAMONSTER's editor leaves to its host: a browser shell that
runs SQL in the browser and keeps the open graph, and a Python engine that
runs what the browser can't. An app built on it chooses its title, themes,
engine settings and (later) its own console commands.

| Folder | What | Released as |
|---|---|---|
| [app/](app/) | the browser shell: the engine client, DuckDB-wasm, storage, and `DavyJonesLocker`, the whole window | `davy-jones-locker` on npm |
| [engine/](engine/README.md) | the Python engine (FastAPI) and its sandboxed runner | `davy-jones-locker` on PyPI, and base images |
| [engine-shared/](engine-shared/README.md) | optional development services: Postgres, later identity and storage | (with the repo) |
| [compose.yaml](compose.yaml) | the engine and runner as an app runs them, to copy | (with the repo) |

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

Anything else (`title`, `theme`) passes through to SEAMONSTER's `FlowgraphEditor`.
The parts are exported too, for an app that wires `FlowgraphEditor` itself:

- `createEngineClient({ url, name })`: the engine as FlowgraphEditor's `server`
  prop ([engineClient.js](app/engineClient.js)), checking its `/health` every
  5 s while it answers and every 15 s while it doesn't.
- `duckdbSql`: FlowgraphEditor's `sql` prop ([duckdbSql.js](app/duckdbSql.js)):
  DuckDB-wasm (1.32.0) and sql.js (1.13.0), loaded from jsDelivr when first
  needed, never bundled.
- `createLocalGraphStorage(name)`: FlowgraphEditor's `storage` prop
  ([localGraphStorage.js](app/localGraphStorage.js)).

`vue` and `seamonster` are peer dependencies. An app linking the framework
from a folder (`file:`) should add `davy-jones-locker` and `seamonster` to
Vite's `resolve.dedupe` with Vue and Vue Flow.

## The engine

See [engine/README.md](engine/README.md): the API, settings, safeguards, and
how an app builds its engine on the framework's (`create_app`, and an image
`FROM davy-jones-locker-engine`).

## Rules

- JavaScript nodes never run on the engine until it has safeguards for them.
- Nothing with credentials reaches the runner: `runner.env` has limits only.
- Secrets live in the engine's `.env`, never in the browser.
- Python libraries are enabled by editing `engine/runner/requirements.in`,
  recompiling with hashes, and rebuilding; scripts can't install anything.
- There's no sign-in yet: keep the engine off the public internet.
