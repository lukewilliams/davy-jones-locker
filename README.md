# DAVY JONES' LOCKER

Davy Jones' Locker is a data wrangling platform for the self-respecting. Customisable, beautiful, useable.

Unlock your insights from the depths of "I'm not a data engineer and I don't want to hire one".

Build data apps around **flowgraphs**: node graphs where each node reads,
transforms or writes a table. Everything that is able to runs in the browser, on
DuckDB-wasm; Python, and SQL over your own database, run on a small, locked-down
server engine.

> **Early release.** This is 0.1: the API may change between minor versions
> until 1.0, so pin an exact version if you depend on it.

This repo holds two products, each built on the one before:

| | What | Package |
|---|---|---|
| [**SEAMONSTER**](seamonster/) | the UI library: a flowgraph editor for Vue 3, with its panels and menus, plus data widgets (controls, documents, 3D scenes, sheets, maps). No server, storage or commands of its own | [`seamonster`](https://www.npmjs.com/package/seamonster) on npm |
| [**DAVY JONES' LOCKER**](davy-jones-locker/) | the app framework on SEAMONSTER: a browser shell that runs SQL in the browser and keeps your graph, and a Python engine that runs what the browser can't | [`davy-jones-locker`](https://www.npmjs.com/package/davy-jones-locker) on npm (the shell) and [PyPI](https://pypi.org/project/davy-jones-locker/) (the engine) |

<br>

I don't like it when my data goes places I don't expect it to, and neither should you. So, here's a rule of thumb:

If it's not blinking, it's on your computer. If it is blinking, whatever is plugged into it is leaving your browser. If you're using the AI Assistant, some stuff is definitely leaving your computer. Hopefully not more than is needed, but consider yourself notified.

If the status bar is green and blinking, there's an external connection and some stuff is primed for the server. If it's green and solid, there's a server available, but your graph has only local nodes drawn. 

You're in control.

## Getting started

### The editor on its own

```
npm install seamonster vue reka-ui @vue-flow/core @vue-flow/background
```

```vue
<script setup>
import { FlowgraphEditor } from 'seamonster'
import 'seamonster/style.css'
</script>

<template>
  <div style="height: 100vh"><FlowgraphEditor title="MY FLOWS" theme="LUX" /></div>
</template>
```

Without a host's storage, SQL engine or server, the editor works but keeps
and runs nothing: add those with the framework (below), or supply your own
(see [seamonster/README.md](seamonster/README.md)).

### A whole app, with the framework

```
npm install davy-jones-locker seamonster vue reka-ui @vue-flow/core @vue-flow/background
```

```vue
<script setup>
import { DavyJonesLocker } from 'davy-jones-locker'
import 'seamonster/style.css'
</script>

<template>
  <div style="height: 100vh">
    <DavyJonesLocker title="MY APP" theme="LUX" engine-url="/engines/engine" storage-name="myapp" />
  </div>
</template>
```

SQL and files now run in the browser, and the open graph is kept between
visits. For Python nodes and SQL over a database, run the engine and its
sandbox (Docker, from a clone of this repo):

```
cp davy-jones-locker/engine/.env.example davy-jones-locker/engine/.env
cp davy-jones-locker/engine/runner.env.example davy-jones-locker/engine/runner.env
docker compose -f davy-jones-locker/compose.yaml up -d --build
```

The engine listens on `localhost:9001`. The browser reaches it through your
app's own origin, so proxy `/engines/engine` to it; with Vite:

```js
server: {
  proxy: {
    '/engines/engine': {
      target: 'http://localhost:9001',
      rewrite: (path) => path.replace(/^\/engines\/engine/, ''),
    },
  },
},
```

A database, saved graphs and the AI assistant are settings in the engine's
`.env`; [engine-shared](davy-jones-locker/engine-shared/README.md) runs a
Postgres for development. See [davy-jones-locker/README.md](davy-jones-locker/README.md)
and [the engine's README](davy-jones-locker/engine/README.md).

The engine has no sign-in yet: don't expose it to the internet.

## Working on it

See [CONTRIBUTING.md](CONTRIBUTING.md).

## Licence

[Apache 2.0](LICENSE).
