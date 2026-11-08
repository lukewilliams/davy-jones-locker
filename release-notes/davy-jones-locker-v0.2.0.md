# davy-jones-locker 0.2.0 (app shell and engine)

An app's own node kinds, written in Python and run on the server, which the
browser learns from the engine; a node worker to run them apart from the
engine; and an engine that no longer takes requests from its sandboxes.
Both halves are 0.2.0: the engine's API gained endpoints the shell uses.

```
npm install davy-jones-locker@0.2.0 seamonster@0.3.0
pip install davy-jones-locker==0.2.0
```

The shell needs seamonster 0.3.0, whose node-kind registry it defines the
engine's kinds in.

## Added

- **Node kinds an app defines in Python.** List them in the app's
  `nodes.py` with `davy_jones_locker.nodes` (`NodeKind`, `Field`, `Rule`,
  `NodeCategory`) and pass them to `create_app(nodes=..., categories=...)`.
  A kind names its handler, `"module:function"`, which gets the node's data,
  its inputs as pyarrow tables and its file fields' files, and returns its
  tables, slots and a value. See the engine README's "The app's node kinds".
- **The node worker** runs them: a container like the runner's (read-only,
  unprivileged, no credentials, on a network shared only with the engine),
  each run a process of its own with the kind's timeout. Its image,
  `engine/nodeworker/Dockerfile`, is the base an app's worker builds on;
  `compose.yaml` runs it with `--profile nodes`.
- **Engine API:** `GET /nodes` (the kinds and categories, for the browser),
  `POST /run/node` (runs one, checked by the engine, then the worker), and
  `nodes` in `/health`. Whole-graph runs (`/execute`) run them too, and now
  follow wires' pins: a wire from a slot's own pin carries just that slot.
- **App shell:** the engine client's `runNode` and `nodes()`, and
  `defineServerKinds(client)`, which defines the engine's kinds in the
  browser whenever its list changes (`DavyJonesLocker` does it itself).

## Changed

- **The engine refuses every request from the runner and the node worker**
  (403), whatever it asks, so code running there can't use the engine: its
  database, saved graphs, AI budget or node kinds. It looks their addresses
  up by name on every request (`RUNNER_URL`, `NODE_WORKER_URL`, and any
  hosts in `SANDBOX_HOSTS`); loopback is never refused.
- DataExport on the server says "N inputs are wired in", as in the browser.
