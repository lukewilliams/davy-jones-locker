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

There's no sign-in yet (identity is the next part), so the engine starts
only for local development: `IS_LOCAL=true` (compose's `.env`, or the
environment). Then it signs no one in, and the app's node kinds can reach the
network; it logs a warning saying so, `/health` reports `local: true`, and
the app shows LOCAL. Anyone who can reach it can use it, its AI assistant
included (and so its LiteLLM key's budget): keep it on your own machine.
Without `IS_LOCAL=true` it counts as deployed, which requires sign-in, so it
refuses to start until sign-in exists.

## An app's engine

An app builds its engine on this one. Its entry point makes the FastAPI app:

```python
from davy_jones_locker import create_app

app = create_app(title="engine-myapp")
```

and its image starts from the framework's ([Dockerfile](Dockerfile)), adding
that entry point:

```dockerfile
FROM ghcr.io/lukewilliams/davy-jones-locker-engine:0.3.0
COPY main.py ./
CMD ["uvicorn", "main:app", "--host", "0.0.0.0", "--port", "3000"]
```

**The images.** The engine's, the runner's and the node worker's are
published to GitHub's container registry for each release, from 0.2.0, for
`linux/amd64` and `linux/arm64`:

| Image | Built from |
|---|---|
| `ghcr.io/lukewilliams/davy-jones-locker-engine` | [Dockerfile](Dockerfile) |
| `ghcr.io/lukewilliams/davy-jones-locker-runner` | [runner/Dockerfile](runner/Dockerfile) |
| `ghcr.io/lukewilliams/davy-jones-locker-node-worker` | [nodeworker/Dockerfile](nodeworker/Dockerfile) |

Each is tagged with the version (`0.3.0`) and its minor (`0.3`); there's no
`latest`, so an app says which version it builds on. Or build them yourself
from this folder (`docker build -t davy-jones-locker-engine .`, and `-f
runner/Dockerfile` or `-f nodeworker/Dockerfile` for the others), as
[../compose.yaml](../compose.yaml) does.

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
the engine refuses (see Safeguards). `RUNNER_PACKAGES_FILE` names an app's
own runner `requirements.in` inside the engine's image, when its runner adds
libraries (see Python and geometry); the assistant reads it.

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
| DataExport | to CSV, TSV, JSON (geometry as WKT, as in the browser) or Parquet (GeoParquet), returned in the result. The geo formats are written in the browser only, for now. Its CSV quotes every field (pyarrow's writer), which the browser's doesn't |
| The app's own | by the node worker; a file field's file comes from the stored files (`PUT /files/{key}`) |
| JavaScript | refused: browser only until the engine has safeguards for it |
| anything else | can't run on the server yet |

Wires carry what they did in the browser: one from a node's main output pin
(`source-0`) brings all its slots, one from a slot's own pin (`source:<slot>`)
just that slot.

## The app's node kinds

An app defines node kinds in Python, beside its engine, and the browser learns
them from `GET /nodes`: they need no JavaScript.
[nodes/](davy_jones_locker/nodes/__init__.py) has the whole of it; in short:

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
from davy_jones_locker.nodes import NodeError

def buffer(ctx):
    if not ctx.inputs:
        raise NodeError("Wire in the points to buffer.")  # shown as it is, no traceback
    table = ctx.inputs[0].table                     # a pyarrow Table
    ctx.log(f"buffering {table.num_rows} rows by {ctx.node['distance']} m")
    return {"table": ..., "slots": {"summary": ...}}  # pyarrow Tables, DataFrames or rows
```

- **A kind** has a namespaced name (`app.kind`), a label, a category (built
  in, or one of `categories`), and a `handler`, `"module:function"`. The
  engine never imports the handler, so its libraries needn't be in the
  engine's image. `description` says what it does (Manage and the Library
  show it). `fields`, `slots` and `input_pins` are as SEAMONSTER has
  them, an input pin's `hint` and `required` included, but plain data: hints are text, rules declarative (`Rule(required=,
  min=, max=, pattern=)`, `severity='warn'` for a warning), options a fixed
  list, and there's no custom field type. `timeout_s` bounds a run (60 by
  default).
- **A handler** gets `ctx`: `node` (the node's data, with defaults),
  `inputs` (what's wired in, one per slot each wire carries: `ref`, `id`,
  `slot`, `pin`, and `table` or `tables`), `input(ref)`,
  `file_field(key)` (the file chosen in that file field: its name as the
  user chose it, and its bytes), `file(stored_key)` (the bytes alone, by the
  key the field holds) and `log(text)` (`print` goes to the Terminal too). It
  returns `table` or `tables` (by name), `slots` (by slot), `value` (JSON,
  shown when there's no table): a pyarrow Table, a pandas DataFrame or a
  list of rows each. A slot left out is an empty table.
- **Errors:** raise `NodeError` (from `davy_jones_locker.nodes`, or a
  subclass of it) for anything the node's user can fix, a setting, a file or
  a wire: its message alone is the node's error. Any other exception is the
  node's error with its traceback, as a bug. An input or file the node
  wasn't given raises a `NodeError` that's also a `KeyError`.
- **Testing a handler:** `davy_jones_locker.nodes.testing` runs one in the
  test's own process as the worker would: the same `ctx`, tables through
  Parquet both ways, `print` to the log, and settings that break an error
  rule refused.

  ```python
  from davy_jones_locker.nodes.testing import Context, run

  ctx = Context({"distance": 50}, inputs={"points_data": table}, kind=BUFFER,
                files={"source": ("sites.csv", data)})   # fills in the file field too
  result = run("geo_handlers:buffer", ctx)    # .table, .tables, .slots, .value, .output
  ```

  An exception from the handler is raised as it is, for `pytest.raises`.
  Its docstring has the rest.
- **A named input pin can bring several tables.** It takes one wire, and a
  wire from a node's main pin carries every slot of that node, so `inputs`
  can hold several items with the same `pin`. A handler wanting one table
  there picks it (by `slot`, or by what's in it).
- **Geometry:** write it as WKB with GeoParquet `geo` metadata on the
  Arrow schema (each geometry column's encoding and CRS, as PROJJSON, or
  `null` for unknown). Both engines load it as a `GEOMETRY` column with that
  CRS, so SQL downstream can use it as it is, and every table with geometry
  that reaches a handler comes the same way, a SQL query's output included.
  No `crs` key means OGC:CRS84, which both engines load as `EPSG:4326` (the
  same coordinates; see "Spatial SQL").
- **How long:** the worker kills a run at the kind's `timeout_s`, and the
  engine waits for the worker `timeout_s` plus 30 seconds (for the data
  both ways).
- **The node worker** runs them: an image built `FROM` the framework's
  ([nodeworker/Dockerfile](nodeworker/Dockerfile)), adding the app's
  `nodes.py`, handlers and their libraries, started with
  `NODE_KINDS=nodes:KINDS`. It runs only the kinds that list names, each run
  a process of its own, killed at the kind's `timeout_s`, its memory capped
  (`NODE_MEMORY_MB`), a few at once (`NODE_CONCURRENCY`).
- **Checked twice:** the engine refuses a kind it wasn't given, settings
  that break an error rule, and a required input pin with nothing wired in
  before asking the worker, and the worker checks again
  (`kind.errors(node, pins=...)`; `nodes.testing.Context` does the same).
- **Network access:** in local development (`IS_LOCAL=true`) every kind can
  reach the network, and a kind may say it needs to (`network=True`).
  Otherwise `network=True` is refused: a deployed worker has no way out until
  sign-in and roadmap step 10e, which gives one through a proxy to hosts the
  engine's settings allow.

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
[runner/requirements.in](runner/requirements.in) (or `RUNNER_PACKAGES_FILE`),
so enabling one there tells it too; when geopandas is one, it's also told
inputs with geometry are GeoDataFrames. It answers by calling a `write_code` tool (code and a note), or with
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

**Spatial SQL.** DuckDB's spatial extension is installed with the image and
loaded before the lockdown, so its functions (`ST_Transform`, `ST_Buffer`,
`ST_Area_Spheroid` and the rest) work in server SQL. Axis order is always
x, y (easting or longitude first), whatever a CRS's official order is
(`geometry_always_xy`), as in the browser. So
`ST_Transform(geom, 'EPSG:4326', 'EPSG:7855')` needs no `always_xy`.

The extension's readers are refused twice:
- **The query check** refuses `ST_Read`, `ST_Read_Meta`, `ST_ReadOSM`,
  `ST_ReadSHP` and `shapefile_meta`. Geo files are read in the browser
  (DataIngest) and wired in.
- **The lockdown** refuses them on its own: GDAL goes through DuckDB's file
  system, so local paths, URLs, `/vsicurl/` and its network drivers (WFS,
  OAPIF, Elasticsearch) are all refused.

PROJ fetches no grids (`PROJ_NETWORK=OFF`, and the lockdown).

**Geometry keeps its CRS** through a query, as in the browser. A wired-in
table's GeoParquet `geo` metadata puts each geometry column's CRS on its
type (`GEOMETRY('EPSG:7855')`): the Parquet is read with pyarrow, and its
`geo` becomes geoarrow field metadata, which DuckDB loads with the CRS.
Only WKB columns are geometry: GeoParquet 1.1's native encodings stay as
they are, as in the browser. A
query's output goes back as GeoParquet built from the columns' types
(`Session.parquet`): each CRS as PROJJSON, the geometry types found, and
`"crs": null` for a column with none, since no `crs` would mean OGC:CRS84.
OGC:CRS84 itself is loaded as `EPSG:4326` (DuckDB-wasm's spatial can't
identify CRS84, so the browser does this, and the engine matches it). Mixing
CRSs in one function is refused when the query is bound.

The engine runs without the extension, outside Docker for instance. A
warning is logged once, and spatial SQL then fails with a message saying
the extension isn't installed.

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
capabilities, no credentials, on a network shared only with the engine). In
local development (`IS_LOCAL=true`) compose also puts it on `outside-true`, a
network with a way out, so handlers can call web services; otherwise it has
none (`outside-false` is internal). It runs only the kinds `NODE_KINDS` names, never a handler a
request names, each run in its own process with a timeout and a memory cap.

**Libraries**: scripts get exactly what [runner/requirements.in](runner/requirements.in)
lists (pandas, numpy, pyarrow), compiled to a pinned, hashed
`runner/requirements.txt` and installed at image build; nothing installs at
run time. To enable a library, add it there, recompile (the command is in the
file), and rebuild. An app adds its own the same way, in a runner image
built on this one (see Python and geometry).

## Python and geometry

Tables with geometry reach the runner as GeoParquet, each column's CRS in its
`geo` metadata (`"crs": null` when it's unknown). Where geopandas is
installed in the runner, the worker reads such an input with
`geopandas.read_parquet`: it's a GeoDataFrame, each geometry column a
GeoSeries with its CRS (None when unknown). A GeoDataFrame or GeoSeries the
script ends with is written back with geopandas' `to_parquet`, so the engine
and the browser load it as `GEOMETRY` with its CRS; a plain DataFrame holding
GeoSeries columns is made a GeoDataFrame first. A variable's summary names
its CRS (`3 × 4, EPSG:7855`).

Without geopandas nothing changes: geometry is WKB bytes in a DataFrame, and
a DataFrame returned with them comes back as a blob, not geometry. Shapely
objects in a plain column (not a GeoSeries) can't be returned.

The framework's runner has no geopandas: which geo libraries scripts get is
an app's choice. To add them, build the app's runner on the framework's:
list the framework's libraries and the app's own in the app's
`runner/requirements.in` (geopandas, shapely, pyproj, pyogrio, at versions
that work with the framework's pandas and pyarrow), compile it with hashes
as the framework's is, and install it in an image built on the runner's:

```dockerfile
FROM ghcr.io/lukewilliams/davy-jones-locker-runner:0.3.0
USER root
COPY runner/requirements.txt /tmp/app-requirements.txt
RUN pip install --no-cache-dir --require-hashes -r /tmp/app-requirements.txt && rm /tmp/app-requirements.txt
USER 65534:65534
```

Then copy the app's `runner/requirements.in` into the engine's image too, and
set `RUNNER_PACKAGES_FILE` to it, so the assistant knows what scripts can
import. Checked with geopandas 1.2.0, shapely 2.1.2 and pyproj 3.8.0.

## Layout

```
davy_jones_locker/
  main.py        the API, create_app, refusing the sandboxes
  settings.py    environment settings (.env.example)
  nodes/         the app's node kinds: NodeKind, Field, Rule, NodeCategory, NodeError
    context.py   what a handler is given (ctx), for the worker and for tests
    testing.py   running a handler in a test
  noderunner.py  the app's kinds as the engine knows them, and calls to the node worker
  database.py    the engine's tables in Postgres
  sql.py         locked-down DuckDB sessions (with spatial), query checks
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
tests/           the engine's tests (pytest)
Dockerfile       the engine's image
```

## Developing without Docker

With Python 3.12 and the packages from both lock files installed, from this
folder:

```
IS_LOCAL=true RUNNER_URL=http://127.0.0.1:9002 uvicorn davy_jones_locker.main:app --port 9001
uvicorn davy_jones_locker.sandbox.server:app --port 9002
```

Install DuckDB's extensions once, as the image does at build: the engine
locks DuckDB down and can't install them itself.

```
python -c "import duckdb; duckdb.sql('INSTALL postgres'); duckdb.sql('INSTALL spatial')"
```

The tests need no database:

```
pip install --group test
python -m pytest
```

`test_python.py` runs the runner's worker, so it needs the runner's
libraries too (and geopandas for most of it); without them it's skipped.
`test_parity.py` checks spatial SQL gives the numbers the browser gave: a
query of its own, and `fixtures/screening.sql`, site screening as an app
writes it (a projection centred on the site built per row, buffers,
distances, overlaps, geodesic areas) over made-up data. When DuckDB or its
spatial extension is upgraded, run them in the browser again and update the
numbers (the file says how).

With node kinds, from the app's folder (where its `nodes.py` and handlers are),
with the engine installed from PyPI (`pip install davy-jones-locker`, the
version you pin) or this folder on `PYTHONPATH`:

```
IS_LOCAL=true NODE_WORKER_URL=http://127.0.0.1:9003 RUNNER_URL=http://127.0.0.1:9002 uvicorn main:app --port 9001
NODE_KINDS=nodes:KINDS uvicorn davy_jones_locker.nodeworker.server:app --port 9003
```

(There's no container around the runner or the worker here: development only. On macOS it
can't limit a script's memory (the system refuses RLIMIT_AS), and on Windows
it sets no process limits at all. In the Linux container every limit applies,
and a run fails rather than go without one.)
