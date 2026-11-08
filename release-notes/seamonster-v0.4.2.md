# seamonster 0.4.2

Loops: a graph run once per row, its outputs gathered across the runs. And
the Terminal's command field.

```
npm install seamonster@0.4.2
```

## Added

- **The Loop node** (Custom): a subnet run once per row of what's wired
  into its items pin. Inside, the Input node `item` puts out that run's row,
  and any other Input the same table every run. Each Output gathers every
  run's rows by column name, with `_key` (Key column, or the row number)
  and `_iteration` first; `<id>_status` has a row per run: its status,
  error, duration and each Output's row count. Settings: Key column, When a
  run fails (carry on, or stop the loop), Most runs (1000) and Runs at once
  (on the server). It opens, shares and wires as a subnet does. See the
  README, "Loops".
- **Where a Loop runs:** in the browser, one run at a time, unless
  something inside runs only on the server; then the server runs it as a
  job, through the `server` prop's new `runLoop`.
- **The Terminal's command field**, when the host gives FlowgraphEditor
  `terminalCommands` (a registry from the new `createCommandRegistry`): ~
  focuses it; Enter runs a command into the app's log (the command
  right-aligned in blue, what it printed under it); the only match shows as
  ghost text (Tab takes it), several in a list above the field; history with
  Up and Down, secrets never echoed or kept. SEAMONSTER knows no commands:
  the host defines them (actions and settings, in dotted namespaces). See
  the README, "Terminal commands".
- **Progress on the node** while a Loop runs ("Running… 37 / 500 · 2
  failed"), and `run.progress` on the graph store.

## Known limits

- Opened after a run, a loop shows its last run's nodes, or none when the
  server ran it: `status` says how each run went.
- No resume: running a loop again runs every row again.
- In the browser a loop runs one run at a time.
- A loop the server runs takes one table per input (pick a workbook's
  sheet first).
