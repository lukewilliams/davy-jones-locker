# davy-jones-locker (app shell)

> **Early release.** The API may change between minor versions until 1.0, so
> pin exact versions (`--save-exact`, as below). Each release names the
> `seamonster` it needs.

DAVY JONES' LOCKER's browser shell: it turns [SEAMONSTER](https://www.npmjs.com/package/seamonster)'s
flowgraph editor into a working app. SQL runs in the browser on DuckDB-wasm,
the open graph is kept between visits, and Python nodes and SQL over a
database run on the framework's engine (`davy-jones-locker` on PyPI).

```
npm install --save-exact davy-jones-locker seamonster vue reka-ui @vue-flow/core @vue-flow/background
```

```vue
<script setup>
import { DavyJonesLocker } from 'davy-jones-locker'
import 'seamonster/style.css'
</script>

<template>
  <DavyJonesLocker title="MY APP" theme="LUX" engine-url="/engines/engine" storage-name="myapp" />
</template>
```

| Prop | Default | |
|---|---|---|
| `engine-url` | none | where the browser reaches the engine, through the app's own origin. Without it everything runs in the browser, and the window says so |
| `engine-name` | `'The engine'` | what messages call the engine |
| `storage-name` | `'davy-jones-locker'` | the open graph is kept in localStorage under `<name>:open-graph`, and ingested files in the IndexedDB database `<name>` |

`title`, `theme` and anything else pass through to SEAMONSTER's `FlowgraphEditor`.

**The engine's node kinds** (an app's `nodes.py`, served by `GET /nodes`) need
no code in the browser: once the engine is connected, the shell defines each
kind it lists that the page doesn't already have, so they appear in the
Library and menus, and nodes of them saved while the engine was away stop
being placeholders. They run on the engine, in its node worker.

The parts are exported for an app that wires `FlowgraphEditor` itself:
`createEngineClient({ url, name })`, `duckdbSql`,
`createLocalGraphStorage(name)` and `defineServerKinds(client, { log })`
(the above, given the engine client; returns a function that stops it).

More, including running the engine: the
[framework's README](https://github.com/lukewilliams/davy-jones-locker/tree/main/davy-jones-locker#readme).
Licensed under [Apache 2.0](LICENSE).
