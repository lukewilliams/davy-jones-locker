# davy-jones-locker 0.3.2

Loops and jobs on the engine: a Loop node's runs, several at once, and runs
longer than a request, as jobs you can follow and cancel. And the Terminal's
commands: `f.` in the browser, `b.` on the engine. Goes with
[seamonster 0.4.2](https://github.com/lukewilliams/davy-jones-locker/releases/tag/seamonster-v0.4.2).

```
pip install davy-jones-locker==0.3.2
npm install --save-exact davy-jones-locker@0.3.2 seamonster@0.4.2
```

Base images: `ghcr.io/lukewilliams/davy-jones-locker-engine:0.3.2` (and
`-runner`, `-node-worker`), also tagged `0.3`.

## Added

- **Loops in graph runs** (`/execute`, graph jobs): each run in a
  locked-down DuckDB of its own, up to the node's Runs at once
  (`loopConcurrency`, at most `LOOP_MAX_CONCURRENCY`, 4 by default) at once.
  Outputs gathered by column name with `_key` and `_iteration` first, and a
  `status` output, as in the browser.
- **Jobs** (`POST /jobs`, `GET /jobs/{id}`, `GET /jobs/{id}/result`,
  `DELETE /jobs/{id}`): one Loop node (form data: the node and its inputs as
  Parquet) or a whole graph (JSON, as `/execute` takes), run on a thread of
  their own, with progress, cancellable before the next node or run. At
  most `JOBS_AT_ONCE` (4) at once; results kept for `JOB_KEEP_SECONDS`
  (3600). A graph job is recorded in `runs`.
- **The app shell's engine client** runs a Loop on the server as a job
  (`runLoop`), following its progress.
- **Settings:** `LOOP_MAX_CONCURRENCY`, `JOBS_AT_ONCE`, `JOB_KEEP_SECONDS`
  (in both `.env.example`s).
- **The Terminal's commands** in the app shell: `f.Help`,
  `f.Terminal.Clear`, `f.Theme`, `f.Security.DisconnectBackend` and
  `EnableBackend`, `f.Assistant.Disable` and `Enable`, kept in the browser;
  and the engine's `b.` commands, defined from it whenever it connects.
  `DavyJonesLocker` takes `theme` (which `f.Theme` overrides) and
  `commands` (the app's own `f.` ones).
- **The engine's `b.` commands** (`GET /commands`, `POST /commands`, local
  development only): `b.LiteLLMURL`, `b.LiteLLMKey`, `b.Assistant.Model`,
  `b.Assistant.Enabled` over `.env` in memory, and `b.Settings.Reset`; an
  app adds its own with `create_app(commands=...)`. The `.env` LiteLLM key
  goes only to the `.env` address: after `b.LiteLLMURL` the assistant has
  no key until `b.LiteLLMKey` is set too.

## Changed

- **The app shell needs seamonster 0.4.2** (its peer dependency is now
  `^0.4.2`): its Terminal commands use `createCommandRegistry` and
  `hasTheme`, new there.

## Known limits

- `b.` settings last until the engine restarts (the browser sends its own
  again then), and what the browser keeps, secrets included, is in
  localStorage: for local development only, until sign-in.

- Jobs are kept in the engine's memory: an engine restarted while one runs
  loses it.
- PythonScript inside a loop runs one at a time whatever Runs at once
  says: the runner runs one script at a time.
- There's no sign-in yet, so anyone who can reach the engine can read or
  cancel a job by its ID.
