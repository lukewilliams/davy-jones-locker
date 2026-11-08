# davy-jones-locker 0.1.0

The first release of DAVY JONES' LOCKER: an app framework for flowgraphs,
built on [SEAMONSTER](https://www.npmjs.com/package/seamonster). It has two
halves, released together: a browser shell on npm, and a Python engine on
PyPI.

```
npm install davy-jones-locker seamonster vue reka-ui @vue-flow/core @vue-flow/background
pip install davy-jones-locker
```

This is an early release: the API may change between minor versions until
1.0, so pin an exact version if you depend on it.

## The browser shell (npm)

`<DavyJonesLocker />` is a whole app window: SEAMONSTER's flowgraph editor
with everything it needs wired in.

- **SQL in the browser** on DuckDB-wasm (1.32.0), with SQLite files through
  sql.js (1.13.0), both loaded when first needed.
- **Your graph is kept between visits**, in localStorage, with the data
  DataIngest nodes read in IndexedDB.
- **The engine client**, which checks the engine's health and sends it the
  nodes that need it.

The parts are exported too (`createEngineClient`, `duckdbSql`,
`createLocalGraphStorage`), for apps that wire the editor themselves.

## The engine (PyPI)

A FastAPI app (`create_app()`) that runs what the browser can't:

- **Python** in a sandboxed runner: a separate container with no
  credentials and no network beyond the engine, read-only, unprivileged,
  with time, CPU, memory and process limits per script. Scripts import only
  the libraries its pinned list allows (pandas, numpy and pyarrow to start).
- **SQL over your database**, on a locked-down DuckDB with Postgres attached
  read-only: one SELECT per query, no file access, no new extensions,
  settings frozen.
- **Saved graphs, stored files and run records** in Postgres, and endpoints
  to run whole graphs on the server, for schedulers.
- **The AI assistant**, through any LiteLLM proxy (OpenAI-style). It's off
  until you set the proxy's URL, key and model, and the key never leaves the
  engine.

The engine runs without a database too: saved graphs answer "unavailable"
until one is set up or reachable, and everything else works.

Dockerfiles for the engine and the runner, an example `compose.yaml` to copy
into your app, and an optional development Postgres (`engine-shared`) are in
the repo.

## Before you deploy

- **The engine has no sign-in yet.** Anyone who can reach it can use it,
  including the assistant's budget. Keep it off the internet and untrusted
  networks.
- JavaScript nodes never run on the engine: they run only in the browser's
  sandbox.
- See [SECURITY.md](https://github.com/lukewilliams/davy-jones-locker/blob/main/SECURITY.md)
  to report a vulnerability.

## Known issue

Running the engine outside Docker on macOS, every Python node fails. Fixed
in 0.1.1: upgrade with `pip install --upgrade davy-jones-locker`. Docker, the
recommended way to run it, isn't affected.
