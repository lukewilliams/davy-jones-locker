# davy-jones-locker (engine)

> **Early release.** This is 0.1: the API may change between minor versions
> until 1.0, so pin an exact version if you depend on it.

DAVY JONES' LOCKER's Python engine, which executes flowgraphs on the server
(FastAPI, port 3000), and **the runner**, the sandbox it runs Python in. An
app built on the framework runs everything it can in the browser; the engine
is the second engine, for:

- **PythonScript** nodes, which can't run in a browser.
- **SQL over the backend database**: a SQL node whose query reads a table its
  wired inputs don't supply runs here, over Postgres (attached read-only as
  `db`) and the inputs the browser sends.
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
an app adds libraries of its own. [../compose.yaml](../compose.yaml) runs
both, with the runner's safeguards; copy it into the app and name the
services for it (`engine-myapp`, `engine-myapp-runner`): browsers reach the
engine through the app's own origin at `/engines/<service>/`.

The package is `davy-jones-locker` (Python 3.12+); `pip install -e .` here
for development. The images don't install it: they copy the package and
install the pinned, hashed versions in `requirements.txt` and
`runner/requirements.txt`.

## Settings

[.env.example](.env.example) (the engine) and
[runner.env.example](runner.env.example) (the runner's limits: never
credentials, since scripts run beside it). The app's compose file usually
sets `RUNNER_URL` (the runner's address, default `http://runner:3000`) and
`PUBLIC_HOST` (what `/health` reports, default `engine`).

## API

| | |
|---|---|
| `GET /health` | `{ status: 'ok', host, port, assistant }`: the app's connection check (`assistant`: `{ model, sampleRows }`, or null when it isn't set up) |
| `POST /query` | form data: `sql`, and an `input` file per input (Parquet, its filename the reference name: `sqlnode1_data`, or `dataingest1_data.sheet1` for one table of several). Answers with the result as Parquet |
| `POST /run/python` | form data: `code`, and `input` files as above. Answers with form data: `result` (JSON) and `table` (Parquet) when the last expression was a table |
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
| JavaScript | refused: browser only until the engine has safeguards for it |
| anything else | can't run on the server yet |

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

User code runs in two places here, and neither is trusted.

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

**Libraries**: scripts get exactly what [runner/requirements.in](runner/requirements.in)
lists (pandas, numpy, pyarrow), compiled to a pinned, hashed
`runner/requirements.txt` and installed at image build; nothing installs at
run time. To enable a library, add it there, recompile (the command is in the
file), and rebuild. An app adds its own the same way, in a runner image
built on this one.

## Layout

```
davy_jones_locker/
  main.py        the API, and create_app
  settings.py    environment settings (.env.example)
  database.py    the engine's tables in Postgres
  sql.py         locked-down DuckDB sessions, query checks
  runner.py      calls to the runner
  executor.py    whole-graph runs
  assist.py      the AI assistant (through LiteLLM)
  formdata.py    multipart/form-data both ways (the runner uses it too)
  sandbox/
    server.py    the runner's API, limits, one process per run
    worker.py    runs one script
runner/          the runner's Dockerfile and libraries
Dockerfile       the engine's image
```

## Developing without Docker

With Python 3.12 and the packages from both lock files installed, from this
folder:

```
RUNNER_URL=http://127.0.0.1:9002 uvicorn davy_jones_locker.main:app --port 9001
uvicorn davy_jones_locker.sandbox.server:app --port 9002
```

(There's no container around the runner here: development only. On macOS it
can't limit a script's memory (the system refuses RLIMIT_AS), and on Windows
it sets no process limits at all. In the Linux container every limit applies,
and a run fails rather than go without one.)
