# seamonster 0.3.0

Node kinds an app defines, with their own fields in Manage and as many
outputs as they need; graphs that keep nodes an app doesn't know; and a
Terminal that keeps a log.

```
npm install seamonster@0.3.0
```

## Added

- **Node kinds an app defines.** `defineNodeKind` and `defineNodeCategory`
  (exported) add kinds and categories before the editor mounts, or after:
  the Library and menus follow. A kind needs `kind`, `label` and `category`;
  it runs in the browser through `run(ctx)`, which is given the node, its
  inputs, the SQL engine, the server and helpers, and returns its table (or
  tables, a value, a file to save), what it printed, or an error. The
  built-in kinds are defined the same way. See the README's "Defining node
  kinds".
- **Fields that Manage draws for a kind.** A kind lists its `fields` (text,
  number, select, checkbox, code, file, read-only, or a custom component),
  each kept on the node's data. `validate` rules check them as they're edited:
  an error stops the node running and shows on its face, a warning shows as a
  badge. `affectsOutput: false` marks a field that doesn't make the node
  stale.
- **Kinds a server runs.** A kind with `where: 'server'` and no `run` runs
  through the `server` prop's new `runNode`: that's how DAVY JONES' LOCKER
  0.2.0 runs the node kinds its engine supplies, defined in the browser from
  the engine. A node of such a kind is a placeholder until the kind arrives,
  then a node like any other.
- **Several outputs per node (slots), and pins for them.** A kind's `slots`
  add outputs beyond the first, each read downstream as `<id>_<slot>`. The
  node's one output pin carries all of them; a slot can also have a pin of
  its own (the kind's choice, or the node's `slotPins`), carrying just it.
  A kind's `inputPins` add named input pins for inputs with a role. Data has
  a tab per slot. Saved graphs load unchanged.
- **The Terminal keeps logs.** Each node has a log, and so does the app; the
  Terminal shows the selected node's, or the app's when nothing is selected,
  newest at the bottom.
  - Runs add to their node's log (what a script printed, then its error or
    summary) instead of replacing it.
  - A log belongs to its node's current state (its settings, its wires,
    anything upstream, Reset): the first run after a change clears it first,
    so errors a change dealt with go away.
  - An entry already there isn't repeated: it moves to the end with a count
    (×2), so an unchanged failing node shows its error once.
  - The app's log has the server connecting and going away, and Execute
    Graph's summary. Hosts add to it with the graph store's `log(text,
    type)`; entries are in `logs.app` and `logs.nodes[id]`.
  - Turning pages in Data doesn't log (the graph store's new `turnPage`).

## Changed

- A node kind's `inputs` and `outputs` pin counts are gone: `inputPins` and
  `slots` say what pins a kind has.
- DataExport with several inputs says "N inputs are wired in", since a node
  wired in can bring more than one output.

## Fixed

- **Nodes of unknown kinds are kept.** Opening a graph with a node whose
  kind this app doesn't have (made in another app, or with a plugin this app
  doesn't install) used to drop the node and its wires, and the next save
  lost them for good. Now the node stays as a placeholder: greyed, labelled
  with its kind's name, "Not available here." It keeps its settings and
  wires, and has its first pin on each side plus any its wires use. It can be
  moved, renamed or deleted, but not run (it, and anything downstream of it,
  fails with a message saying why), and new wires can't be drawn to or from
  it. Saving the graph keeps it exactly as it was.
- A SQL node's list of tables it reads from the server is worked out again
  when a graph opens and whenever a kind is defined, rather than kept from
  when it was saved: what a query reads from its inputs depends on their
  kinds.
- A query reading `<input>.<table>` from a node wired in counted as reading
  the server's database unless that node was a DataIngest node; now any
  schema named like a wired input is read here.
- The JavaScript field's hint said `console.log` shows "in the Console"; it's
  the Terminal.
