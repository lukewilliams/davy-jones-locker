# davy-jones-locker (engine)

> **Early release.** This is 0.2: the API may change between minor versions
> until 1.0, so pin an exact version if you depend on it.

DAVY JONES' LOCKER's Python engine, which executes flowgraphs on the server
(FastAPI, port 3000); **the runner**, the sandbox it runs Python in; and **the
node worker**, which runs the app's own node kinds. An app built on the
framework runs everything it can in the browser; the engine is the second
engine, for:

- **PythonScript** nodes, which can't run in a browser.
- **SQL over the backend database**: a SQL node whose query reads a table its
  wired inputs don't supply runs here, over Postgres (attached read-only as
  `db`) and the inputs the browser sends.
- **The app's own node kinds**, written in Python (below): the browser learns
  them from the engine, and the node worker runs them.
- **Whole graphs on the server**, for schedulers (n8n, say) to trigger.

There's no sign-in yet (identity is the next part): keep the engine off the
public internet until there is. Until then, anyone who can reach it can use
its AI assistant, and so its LiteLLM key's budget.

## An app's engine

An app builds its engine on this one. Its entry point makes the FastAPI app:

```python
from davy_jones_locker import create_app

app = create_app(title="engine-myapp")
```

and its image starts from the framework's ([Dockerfile](Dockerfile)), adding
that entry point:

```dockerfile
FROM davy-jones-locker-engine
COPY main.py ./
CMD ["uvicorn", "main:app", "--host", "0.0.0.0", "--port", "3000"]
```

The runner is used as it is ([runner/Dockerfile](runner/Dockerfile)), until
an app adds libraries of its own; so is the node worker
([nodeworker/Dockerfile](nodeworker/Dockerfile)), until the app has node kinds
of its own (below). [../compose.yaml](../compose.yaml) runs them, with their
safeguards; copy it into the app and name the services for it
(`engine-myapp`, `engine-myapp-runner`): browsers reach the engine through the
app's own origin at `/engines/<service>/`.

The package is `davy-jones-locker` (Python 3.12+); `pip install -e .` here
for development. The images don't install it: they copy the package and
install the pinned, hashed versions in `requirements.txt` and
`runner/requirements.txt`.

## Settings

[.env.example](.env.example) (the engine),
[runner.env.example](runner.env.example) (the runner's limits: never
credentials, since scripts run beside it) and
[node-worker.env.example](node-worker.env.example) (the node worker's: never
credentials either). The app's compose file usually sets `RUNNER_URL` (the
runner's address, default `http://runner:3000`), `NODE_WORKER_URL` (the node
worker's, when the app has node kinds) and `PUBLIC_HOST` (what `/health`
reports, default `engine`). `SANDBOX_HOSTS` names more hosts whose requests
the engine refuses (see Safeguards).

## API

| | |
|---|---|
| `GET /health` | `{ status: 'ok', host, port, assistant, nodes }`: the app's connection check (`assistant`: `{ model, sampleRows }`, or null when it isn't set up; `nodes`: the app's node kinds' names) |
| `GET /nodes` | `{ categories, kinds }`: the app's node kinds and categories, as the browser defines them (below) |
| `POST /query` | form data: `sql`, and an `input` file per input (Parquet, its filename the reference name: `sqlnode1_data`, or `dataingest1_data.sheet1` for one table of several). Answers with the result as Parquet |
| `POST /run/python` | form data: `code`, and `input` files as above. Answers with form data: `result` (JSON) and `table` (Parquet) when the last expression was a table |
| `POST /run/node` | form data: `kind`, `node` (JSON, its data), `inputs` (JSON: `[{ ref, id, slot, pin, part }]` or with `tables: [{ name, part }]`), an `input` file per table (Parquet, its filename the part), and a `file` per file field's file (its filename the stored key). Checked here, run by the node worker. Answers with form data: `result` (JSON: `{ output, value?, error?, outputs: [{ slot, part } or { slot, tables: [{ name, part }] }] }`) and a `table` file per table |
| `POST /execute` | JSON `{ document, targets? }`: runs a graph given in full |
| `POST /graphs/{id}/execute` | JSON `{ targets? }` (optional): runs a saved graph |
| `GET /graphs`, `GET /graphs/{id}`, `PUT /graphs/{id}` | saved graphs; `PUT` takes `{ name, document }` and answers `{ id, version }` |
| `PUT /files/{key}` | stores data a DataIngest node read (Parquet), for server runs |
| `POST /assist` | JSON `{ kind, request, code, inputs }`: the AI assistant writes a node's code. Answers `{ code, note, model }` (see below) |

Errors are JSON `{ error }`, their message meant for the user. `/run/python`'s
`result` is `{ output, value, variables }` or `{ output, error }`:

- `output`: what the script printed.
- `value`: its last expression's value: `{ kind: 'table', rows }` (the table
  is the `table` part), `{ kind: 'json', type, value }`,
  `{ kind: 'text', type, text }` (anything JSON can't hold), or
  `{ kind: 'none' }`.
- `variables`: its top-level variables, `[{ name, type, summary }]` (for
  promoting them to outputs of their own, later).

A graph run (`/execute`, `/graphs/{id}/execute`, e.g. from n8n) runs `targets`
(default: every node with Auto Run on) and everything upstream, as the browser
does, and answers `{ runId, status, failed, results }`: per node `{ status,
error? | rowCount, output?, value?, export? }`, an export's file as
`{ filename, contentType, size, base64 }`. Runs are recorded in `runs` when
there's a database. On the server:

| Kind | |
|---|---|
| SQLQuery | on the server's DuckDB: its inputs and the query database |
| PythonScript | in the runner |
| DataIngest | from its tables stored with `PUT /files/{key}` (the keys in the node's `ingest.tables`) |
| DataExport | to CSV, TSV, JSON or Parquet, returned in the result |
| The app's own | by the node worker; a file field's file comes from the stored files (`PUT /files/{key}`) |
| JavaScript | refused: browser only until the engine has safeguards for it |
| anything else | can't run on the server yet |

Wires carry what they did in the browser: one from a node's main output pin
(`source-0`) brings all its slots, one from a slot's own pin (`source:<slot>`)
just that slot.

## The app's node kinds

An app defines node kinds in Python, beside its engine, and the browser learns
them from `GET /nodes`: they need no JavaScript.
[nodes.py](davy_jones_locker/nodes.py) has the whole of it; in short:

```python
# nodes.py: definitions only (the engine and the node worker both import it)
from davy_jones_locker.nodes import Field, NodeCategory, NodeKind, Rule

CATEGORIES = [NodeCategory("geo", "Geo", colors={"from": "#7dd3a8", "to": "#2f855a"})]
KINDS = [
    NodeKind(
        "geo.buffer", "Buffer", "geo", handler="geo_handlers:buffer",
        fields=[Field("distance", "Distance (m)", "number", default=100,
                      validate=[Rule(min=0, message="A distance can't be negative.")])],
        slots=[{"name": "summary"}],
        timeout_s=120,
    ),
]

# main.py
from davy_jones_locker import create_app
import nodes
app = create_app(title="engine-geo", nodes=nodes.KINDS, categories=nodes.CATEGORIES)

# geo_handlers.py: run only by the node worker
def buffer(ctx):
    table = ctx.inputs[0].table                     # a pyarrow Table
    ctx.log(f"buffering {table.num_rows} rows by {ctx.node['distance']} m")
    return {"table": ..., "slots": {"summary": ...}}  # pyarrow Tables, DataFrames or rows
```

- **A kind** has a namespaced name (`app.kind`), a label, a category (built
  in, or one of `categories`), and a `handler`, `"module:function"`. The
  engine never imports the handler, so its libraries needn't be in the
  engine's image. `fields`, `slots` and `input_pins` are as SEAMONSTER has
  them, but plain data: hints are text, rules declarative (`Rule(required=,
  min=, max=, pattern=)`, `severity='warn'` for a warning), options a fixed
  list, and there's no custom field type. `timeout_s` bounds a run (60 by
  default).
- **A handler** gets `ctx`: `node` (the node's data, with defaults),
  `inputs` (what's wired in, one per slot each wire carries: `ref`, `id`,
  `slot`, `pin`, and `table` or `tables`), `input(ref)`, `file(key)` (a file
  field's file) and `log(text)` (`print` goes to the Terminal too). It
  returns `table` or `tables` (by name), `slots` (by slot), `value` (JSON,
  shown when there's no table): a pyarrow Table, a pandas DataFrame or a
  list of rows each. A slot left out is an empty table; an exception is the
  node's error, with its traceback.
- **The node worker** runs them: an image built `FROM` the framework's
  ([nodeworker/Dockerfile](nodeworker/Dockerfile)), adding the app's
  `nodes.py`, handlers and their libraries, started with
  `NODE_KINDS=nodes:KINDS`. It runs only the kinds that list names, each run
  a process of its own, killed at the kind's `timeout_s`, its memory capped
  (`NODE_MEMORY_MB`), a few at once (`NODE_CONCURRENCY`).
- **Checked twice:** the engine refuses a kind it wasn't given and settings
  that break an error rule before asking the worker, and the worker checks
  again.
- A kind can't ask for network access yet (`network=True` is refused): the
  worker has no way out until roadmap step 10e gives it one, through a proxy
  to hosts the engine's settings allow.

## AI assistant

The Assistant field in SEAMONSTER's Manage panel (SQLQuery, PythonScript and
JavaScript nodes) asks `POST /assist` ([assist.py](davy_jones_locker/assist.py)),
which asks a LiteLLM proxy's `/chat/completions`, OpenAI-style. Set it up in
`.env`:

| | |
|---|---|
| `LITELLM_BASE_URL` | the proxy's address (with or without `/v1`) |
| `LITELLM_API_KEY` | its key: stays on the engine. The browser never sees it, and the runner can't read it |
| `ASSIST_MODEL` | a model name the proxy offers. No default: the assistant is off until it's set |
| `ASSIST_SAMPLE_ROWS` | rows of each input sent as examples of its values (default 3; 0 sends column names and types only) |
| `ASSIST_TIMEOUT_SECONDS` | how long to wait for an answer (default 90) |

Off (and hidden in the app) unless all three of the first settings are set.
What the model is sent: the request; the node's kind and current code; each
input's reference name, columns (name and type), row count and first
`ASSIST_SAMPLE_ROWS` rows (values cut to 200 characters), which the browser
works out by running what's upstream; and for SQL, the query database's
tables and columns, not their rows. For Python, it's told the packages in
[runner/requirements.in](runner/requirements.in), so enabling one there tells
it too. It answers by calling a `write_code` tool (code and a note), or with
a fenced code block. The code only fills the node's editor: nothing runs
until the user runs it. Prompts and answers aren't logged, only their size
and time.

A LiteLLM proxy on the Docker host rather than on the network: from inside
the container, that's `host.docker.internal`, which needs
`extra_hosts: ["host.docker.internal:host-gateway"]` on the engine's service.

## Database

The engine owns its tables, in schema `FLOW_SCHEMA` (`flow`), created the
first time the database answers ([database.py](davy_jones_locker/database.py)):
`graphs`, `files` (stored data by key), `runs`. Without `DATABASE_URL`, or
while the database can't be reached, those endpoints answer 503 and graph runs
aren't recorded; everything else still works, and the engine starts either
way.

SQL reads the query database (`QUERY_DATABASE_URL`, else `DATABASE_URL`),
attached read-only as catalog `db`: `db.public.orders`, or just `orders`
(plain names look in the inputs, then `db.public`). Its role should be
read-only: engine-shared's reader role is, and
[its script](../engine-shared/postgres/engine-roles.sql) makes the same roles
on any Postgres.

## Safeguards

User code runs in two places here, and neither is trusted. The app's own
node kinds run in a third, trusted, but handling what users send.

**Refusing the sandboxes.** Every request from the runner or the node worker
is refused (403), whatever it asks: code runs there, and nothing it does may
use the engine (its database, saved graphs, AI budget, or the node kinds it
runs). The engine looks up their addresses by name (the hosts in
`RUNNER_URL` and `NODE_WORKER_URL`, and any in `SANDBOX_HOSTS`) on every
request, so replicas and restarts are covered. Loopback addresses are never
refused: with the runner on the same machine (development), they're
everyone's.

**SQL** ([sql.py](davy_jones_locker/sql.py)). Each query or graph run gets its
own in-memory DuckDB. Once the query database is attached, DuckDB is locked
down: no file access, no new extensions or attachments, settings frozen. That
doesn't stop `postgres_scan()` connecting to any server by connection string,
so a query must also be one SELECT that calls none of the functions that open
connections or run SQL given as text (`postgres_*`, `query`, `query_table`),
checked with DuckDB's own parser. Queries stop after `QUERY_TIMEOUT_SECONDS`
and are held to `QUERY_MEMORY_LIMIT`.

**Python** ([sandbox/](davy_jones_locker/sandbox/)). The engine never runs
it: the runner does, in a separate container that holds no credentials (its
settings file is separate, and nothing secret goes in it) and can reach
nothing but the engine. The container is read-only, unprivileged,
capability-free and resource-limited ([../compose.yaml](../compose.yaml)).
Each script runs in its own process with time, CPU, memory and file limits,
in a scratch directory deleted afterwards, one at a time per container
(concurrent runs share a user, so could read each other's files: scale with
replicas). After each run, every process it started is killed, even ones
that left its process group, so nothing a script leaves running sees the next
run; the container's init reaps them, so they can't use up its process limit
either. Python can't be sandboxed from inside itself, so these limits are the
safeguard, not anything the script is told. In production, Azure Container
Apps' dynamic sessions (Hyper-V isolated) could replace the runner behind the
same API.

**The app's node kinds** ([nodeworker/](davy_jones_locker/nodeworker/)).
Handlers are the app's code, but they parse what users send (uploads, other
nodes' tables), often with C libraries. So they never run in the engine,
which holds the database's and the AI proxy's credentials: the node worker
runs them, in a container like the runner's (read-only, unprivileged, no
capabilities, no credentials, on a network shared only with the engine, with
no way out). It runs only the kinds `NODE_KINDS` names, never a handler a
request names, each run in its own process with a timeout and a memory cap.

**Libraries**: scripts get exactly what [runner/requirements.in](runner/requirements.in)
lists (pandas, numpy, pyarrow), compiled to a pinned, hashed
`runner/requirements.txt` and installed at image build; nothing installs at
run time. To enable a library, add it there, recompile (the command is in the
file), and rebuild. An app adds its own the same way, in a runner image
built on this one.

## Layout

```
davy_jones_locker/
  main.py        the API, create_app, refusing the sandboxes
  settings.py    environment settings (.env.example)
  nodes.py       the app's node kinds: NodeKind, Field, Rule, NodeCategory
  noderunner.py  the app's kinds as the engine knows them, and calls to the node worker
  database.py    the engine's tables in Postgres
  sql.py         locked-down DuckDB sessions, query checks
  runner.py      calls to the runner
  executor.py    whole-graph runs
  assist.py      the AI assistant (through LiteLLM)
  formdata.py    multipart/form-data both ways (the runner uses it too)
  sandbox/
    server.py    the runner's API, limits, one process per run
    worker.py    runs one script
  nodeworker/
    server.py    the node worker's API, one process per run
    child.py     runs one node's handler
runner/          the runner's Dockerfile and libraries
nodeworker/      the node worker's Dockerfile and libraries
Dockerfile       the engine's image
```

## Developing without Docker

With Python 3.12 and the packages from both lock files installed, from this
folder:

```
RUNNER_URL=http://127.0.0.1:9002 uvicorn davy_jones_locker.main:app --port 9001
uvicorn davy_jones_locker.sandbox.server:app --port 9002
```

With node kinds, from the app's folder (where its `nodes.py` and handlers are),
with this folder on `PYTHONPATH`:

```
NODE_WORKER_URL=http://127.0.0.1:9003 RUNNER_URL=http://127.0.0.1:9002 uvicorn main:app --port 9001
NODE_KINDS=nodes:KINDS uvicorn davy_jones_locker.nodeworker.server:app --port 9003
```

(There's no container around the runner or the worker here: development only. On macOS it
can't limit a script's memory (the system refuses RLIMIT_AS), and on Windows
it sets no process limits at all. In the Linux container every limit applies,
and a run fails rather than go without one.)
