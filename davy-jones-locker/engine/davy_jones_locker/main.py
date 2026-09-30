"""The engine: FastAPI, on port 3000. An app makes its own with create_app()
(`app` here is one with nothing added, for running the engine as it is).

  GET  /health                  { status: 'ok', host, port, assistant, nodes }: the
                                app checks this (`nodes`: the app's node kinds' names)
  GET  /nodes                   the app's node kinds and categories (nodes.py), for
                                the browser to define
  POST /query                   SQL over the query database, with inputs as Parquet
  POST /run/python              a PythonScript node, run in the sandbox (runner/)
  POST /run/node                a node of one of the app's kinds, run by the node
                                worker (nodeworker/)
  GET  /graphs                  saved graphs
  PUT  /graphs/{id}             save one: { name, document }
  GET  /graphs/{id}             one, with its document
  POST /graphs/{id}/execute     run a saved graph on the server (for n8n)
  POST /execute                 run a graph given in the body: { document, targets? }
  PUT  /files/{key}             store data a DataIngest node read (Parquet)
  POST /assist                  the AI assistant: a node's code from a request
                                in plain words (assist.py)

Errors are JSON { error }, their message meant for the user. There's no
sign-in yet: keep the engine off the public internet until there is.

Requests from the sandboxes (the runner, the node worker) are refused, every
one of them (see settings.SANDBOX_HOSTS): code runs there, and nothing it does
may reach the engine.
"""

import asyncio
import ipaddress
import json
import logging
import socket
from contextlib import asynccontextmanager
from datetime import datetime, timezone

from fastapi import APIRouter, FastAPI, Request
from fastapi.concurrency import run_in_threadpool
from fastapi.exceptions import RequestValidationError
from fastapi.responses import JSONResponse, Response
from pydantic import BaseModel

from . import assist, database, executor, formdata, noderunner, nodes, runner, settings, sql

log = logging.getLogger("davy-jones-locker")
MAX_UPLOAD = settings.MAX_UPLOAD_MB * 1024 * 1024


@asynccontextmanager
async def lifespan(_: FastAPI):
    if database.available():
        try:
            await run_in_threadpool(database.migrate)
        except database.NoDatabase as e:
            # Not fatal: everything else still works, and the tables are made
            # the first time the database answers.
            log.warning("%s Saved graphs, stored files and run records are off until it answers.", e)
    else:
        log.warning("No DATABASE_URL: saved graphs, stored files and run records are off.")
    yield


router = APIRouter()


def error(message: str, status: int = 400) -> JSONResponse:
    return JSONResponse({"error": message}, status_code=status)


async def no_database(_: Request, e: database.NoDatabase):
    return error(str(e), 503)


async def no_runner(_: Request, e: runner.RunnerUnavailable | noderunner.WorkerUnavailable):
    return error(str(e), 503)


async def invalid_request(_: Request, e: RequestValidationError):
    first = e.errors()[0] if e.errors() else {}
    where = ".".join(str(part) for part in first.get("loc", ())[1:])
    return error(f"The request wasn't valid: {where + ': ' if where else ''}{first.get('msg', 'unreadable')}.")


@router.get("/health")
def health():
    return {
        "status": "ok", "host": settings.PUBLIC_HOST, "port": settings.PORT, "hostname": socket.gethostname(),
        "assistant": assist.summary(), "nodes": sorted(noderunner.KINDS),
    }


@router.get("/nodes")
def list_nodes():
    return noderunner.describe()


async def read_body(request: Request) -> bytes:
    if int(request.headers.get("content-length") or 0) > MAX_UPLOAD:
        raise ValueError(f"The request is bigger than {settings.MAX_UPLOAD_MB} MB.")
    body = await request.body()
    if len(body) > MAX_UPLOAD:
        raise ValueError(f"The request is bigger than {settings.MAX_UPLOAD_MB} MB.")
    return body


# ---- Running ----

@router.post("/query")
async def query(request: Request):
    """Form data: `sql`, and an `input` file part per input, its filename the
    reference name (sqlnode1_data, or dataingest1_data.sheet1). Answers with
    the result as Parquet."""
    try:
        body = await read_body(request)
        parts = formdata.decode(body, request.headers.get("content-type", ""))
    except ValueError as e:
        return error(str(e), 413 if "bigger" in str(e) else 400)
    fields = {name: data for name, data, _, filename in parts if not filename}
    inputs = {filename: data for name, data, _, filename in parts if filename and name == "input"}
    if "sql" not in fields:
        return error("No query was sent.")
    try:
        result = await run_in_threadpool(sql.run_query, fields["sql"].decode("utf-8"), inputs)
    except sql.QueryError as e:
        return error(str(e))
    return Response(result, media_type="application/vnd.apache.parquet")


@router.post("/run/python")
async def run_python(request: Request):
    """Form data: `code`, and an `input` file part per input (as for /query).
    Answers with the runner's form data: `result` JSON (output, value,
    variables, or error) and `table` Parquet when the last expression was a
    table."""
    try:
        body = await read_body(request)
    except ValueError as e:
        return error(str(e), 413)
    content, content_type, status = await runner.forward(body, request.headers.get("content-type", ""))
    return Response(content, status_code=status, media_type=content_type)


@router.post("/run/node")
async def run_node(request: Request):
    """Form data: `kind`, `node` (JSON: its data), `inputs` (JSON: what's
    wired in, one per slot each wire carries, naming its Parquet parts), an
    `input` part per table and a `file` part per file field's file (see
    nodeworker/server.py). Checked here (the kind is the app's, its settings
    pass their rules), then run by the node worker, whose form data answers."""
    try:
        body = await read_body(request)
        parts = formdata.decode(body, request.headers.get("content-type", ""))
    except ValueError as e:
        return error(str(e), 413 if "bigger" in str(e) else 400)
    fields = {name: data for name, data, _, filename in parts if not filename}
    name = fields.get("kind", b"").decode("utf-8", "replace")
    kind = noderunner.KINDS.get(name)
    if kind is None:
        return error(f"This engine has no {name or 'such'} nodes.", 404)
    try:
        node = json.loads(fields.get("node") or b"{}")
    except ValueError:
        return error("The node's data wasn't JSON.")
    problems = kind.errors(node)
    if problems:
        return error(" ".join(problems))
    content, content_type, status = await noderunner.forward(kind, body, request.headers.get("content-type", ""))
    return Response(content, status_code=status, media_type=content_type)


class ExecuteRequest(BaseModel):
    document: dict
    targets: list[str] | None = None


class ExecuteSaved(BaseModel):
    targets: list[str] | None = None


async def run_graph(document: dict, targets: list[str] | None, graph_id: str | None, trigger: str):
    started = datetime.now(timezone.utc)
    try:
        results = await run_in_threadpool(executor.execute, document, targets)
    except ValueError as e:
        return error(str(e))
    failed = [node_id for node_id, r in results.items() if r["status"] == "failed"]
    status = "failed" if failed else "completed"
    run_id = None
    if database.available():
        # Record everything but exported files (they're in the response).
        recorded = {k: {f: v for f, v in r.items() if f != "export"} for k, r in results.items()}
        try:
            run_id = await run_in_threadpool(database.record_run, graph_id, trigger, started, status, recorded)
        except database.NoDatabase as e:
            log.warning("The run wasn't recorded: %s", e)
    return {"runId": run_id, "status": status, "failed": failed, "results": results}


@router.post("/execute")
async def execute(body: ExecuteRequest):
    return await run_graph(body.document, body.targets, None, "document")


@router.post("/graphs/{graph_id}/execute")
async def execute_saved(graph_id: str, body: ExecuteSaved | None = None):
    graph = await run_in_threadpool(database.get_graph, graph_id)
    if not graph:
        return error(f"No saved graph called {graph_id}.", 404)
    return await run_graph(graph["document"], body.targets if body else None, graph_id, "saved")


# ---- The AI assistant ----

@router.post("/assist")
async def assist_node(body: assist.AssistRequest):
    """JSON { kind, request, code, inputs } (see assist.py). Answers
    { code, note, model }."""
    if not assist.enabled():
        return error("The AI assistant isn't set up on the engine (LITELLM_BASE_URL, LITELLM_API_KEY and ASSIST_MODEL).", 503)
    try:
        return await assist.write(body)
    except assist.AssistError as e:
        return error(str(e), e.status)


# ---- Saved graphs and stored files ----

class SaveGraph(BaseModel):
    name: str = ""
    document: dict


@router.get("/graphs")
async def list_graphs():
    return await run_in_threadpool(database.list_graphs)


@router.put("/graphs/{graph_id}")
async def save_graph(graph_id: str, body: SaveGraph):
    if body.document.get("format") != "pipeline":
        return error("That isn't a pipeline document.")
    version = await run_in_threadpool(database.put_graph, graph_id, body.name, body.document)
    return {"id": graph_id, "version": version}


@router.get("/graphs/{graph_id}")
async def get_graph(graph_id: str):
    graph = await run_in_threadpool(database.get_graph, graph_id)
    return graph or error(f"No saved graph called {graph_id}.", 404)


@router.put("/files/{key}")
async def put_file(key: str, request: Request):
    try:
        body = await read_body(request)
    except ValueError as e:
        return error(str(e), 413)
    await run_in_threadpool(database.put_file, key, body)
    return {"key": key, "size": len(body)}


# ---- Refusing the sandboxes ----

def _address(text: str):
    try:
        address = ipaddress.ip_address(text.split("%", 1)[0])
    except ValueError:
        return None
    return getattr(address, "ipv4_mapped", None) or address


async def sandbox_addresses() -> set:
    """The sandboxes' addresses now, loopback left out."""
    loop = asyncio.get_running_loop()
    found = set()
    for host in settings.SANDBOX_HOSTS:
        try:
            infos = await loop.getaddrinfo(host, None)
        except OSError:
            continue  # not running (or not on this network): nothing to refuse
        for info in infos:
            address = _address(info[4][0])
            if address and not address.is_loopback:
                found.add(address)
    return found


async def refuse_sandboxes(request: Request, call_next):
    client = _address(request.client.host) if request.client else None
    if client and not client.is_loopback and client in await sandbox_addresses():
        log.warning("Refused %s %s from a sandbox (%s).", request.method, request.url.path, client)
        return error("The engine doesn't take requests from its sandboxes.", 403)
    return await call_next(request)


def create_app(
    title: str = "davy-jones-locker",
    nodes: list[nodes.NodeKind] | None = None,
    categories: list[nodes.NodeCategory] | None = None,
) -> FastAPI:
    """The engine as a FastAPI app. An app's entry point calls this, with its
    own node kinds and their categories (see nodes.py), and from step 8f its
    own commands."""
    noderunner.register(nodes or [], categories or [])
    app = FastAPI(title=title, lifespan=lifespan)
    app.middleware("http")(refuse_sandboxes)
    app.add_exception_handler(database.NoDatabase, no_database)
    app.add_exception_handler(runner.RunnerUnavailable, no_runner)
    app.add_exception_handler(noderunner.WorkerUnavailable, no_runner)
    app.add_exception_handler(RequestValidationError, invalid_request)
    app.include_router(router)
    return app


app = create_app()
