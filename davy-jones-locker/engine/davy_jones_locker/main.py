"""The engine: FastAPI, on port 3000. An app makes its own with create_app()
(`app` here is one with nothing added, for running the engine as it is).

  GET  /health                  { status: 'ok', host, port, local, assistant, nodes }:
                                the app checks this (`nodes`: the app's node kinds'
                                names; `local`: IS_LOCAL)
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
  POST /jobs                    start a job, a run longer than a request (jobs.py):
                                a Loop node (form data) or a graph ({ document |
                                graphId, targets? }); answers { id, status, ... }
  GET  /jobs/{id}               its status and progress (a graph's result once done)
  GET  /jobs/{id}/result        a finished Loop's tables (form data), or a graph's result
  DELETE /jobs/{id}             cancel it: it stops before its next node or run
  GET  /commands                the Terminal's b. commands, for completion (commands.py)
  POST /commands                run one: { name, value? } (local development only)
  PUT  /files/{key}             store data a DataIngest node read (Parquet)
  POST /assist                  the AI assistant: a node's code from a request
                                in plain words (assist.py)

Errors are JSON { error }, their message meant for the user. There's no
sign-in yet, so the engine starts only with IS_LOCAL=true (local
development), and must stay on the developer's machine.

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

from . import assist, database, executor, formdata, jobs, noderunner, nodes, runner, settings, sql
from . import commands as terminal

log = logging.getLogger("davy-jones-locker")
MAX_UPLOAD = settings.MAX_UPLOAD_MB * 1024 * 1024


NOT_LOCAL = (
    "IS_LOCAL isn't true, so this engine counts as deployed, and a deployed engine requires sign-in, which it "
    "doesn't have yet (roadmap 8b part b). For local development, set IS_LOCAL=true (the app's compose .env, or the "
    "environment)."
)
LOCAL = (
    "IS_LOCAL is true: local development only. The engine signs no one in, and the app's node kinds can reach the "
    "network. Keep it on this machine: never expose it to a network others use."
)


@asynccontextmanager
async def lifespan(_: FastAPI):
    if not settings.IS_LOCAL:
        log.error(NOT_LOCAL)
        raise RuntimeError(NOT_LOCAL)
    log.warning(LOCAL)
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
        "local": settings.IS_LOCAL,
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
    pass their rules, its required input pins have something wired in), then
    run by the node worker, whose form data answers."""
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
        inputs = json.loads(fields.get("inputs") or b"[]")
    except ValueError:
        return error("The node's data or inputs weren't JSON.")
    problems = kind.errors(node, pins=[i.get("pin") for i in inputs if isinstance(i, dict)])
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


# ---- Jobs (roadmap 10d) ----

PARQUET = "application/vnd.apache.parquet"


@router.post("/jobs")
async def start_job(request: Request):
    """Start a job. Form data runs one Loop node: `job` (JSON: { node: its
    data, its graph inline or named in `subnets`; path: its path, for
    messages and table names; subnets: the document's shared subnets }), and
    an `input` file part per pin, its filename the pin's name (`item` for
    items), each Parquet. JSON runs a graph, as /execute does: { document |
    graphId, targets? }. Answers 202 with the job (GET /jobs/{id})."""
    try:
        body = await read_body(request)
    except ValueError as e:
        return error(str(e), 413)
    content_type = request.headers.get("content-type", "")
    try:
        if content_type.startswith("multipart/"):
            work, kind = loop_job(body, content_type)
        else:
            work, kind = await graph_job(body)
    except ValueError as e:
        return error(str(e))
    try:
        job = jobs.start(kind, work)
    except jobs.Busy as e:
        return error(str(e), 429)
    return JSONResponse(job.describe(), status_code=202)


def loop_job(body: bytes, content_type: str):
    parts = formdata.decode(body, content_type)
    fields = {name: data for name, data, _, filename in parts if not filename}
    inputs = {filename: data for name, data, _, filename in parts if filename and name == "input"}
    try:
        spec = json.loads(fields.get("job") or b"{}")
    except ValueError:
        raise ValueError("The job wasn't JSON.") from None
    node = spec.get("node")
    if not isinstance(node, dict) or node.get("kind") != executor.LOOP:
        raise ValueError("A job sent as form data runs a Loop node: send its data as `node`.")
    if executor.LOOP_ITEM not in inputs:
        raise ValueError(f"Nothing was sent for {node.get('label') or node.get('id')}'s items input.")
    doc = {"subnets": spec.get("subnets") or {}}
    path = str(spec.get("path") or node.get("id") or "loop")
    items = inputs.pop(executor.LOOP_ITEM)

    def work(job: jobs.Job) -> dict:
        return executor.run_loop(node, doc, path, items, inputs, progress=job.progress.update, cancelled=job.cancel.is_set)

    return work, "loop"


async def graph_job(body: bytes):
    try:
        spec = json.loads(body or b"{}")
    except ValueError:
        raise ValueError("The job wasn't JSON.") from None
    graph_id = spec.get("graphId")
    if graph_id:
        graph = await run_in_threadpool(database.get_graph, graph_id)
        if not graph:
            raise ValueError(f"No saved graph called {graph_id}.")
        document = graph["document"]
    elif isinstance(spec.get("document"), dict):
        document = spec["document"]
    else:
        raise ValueError("Send a graph as `document`, or name a saved one as `graphId`.")
    targets = spec.get("targets")

    def work(job: jobs.Job) -> dict:
        started = datetime.now(timezone.utc)
        results = executor.execute(
            document, targets, progress=lambda path, p: job.progress.update({"node": path, **p}),
            cancelled=job.cancel.is_set,
        )
        failed = [node_id for node_id, r in results.items() if r["status"] == "failed"]
        status = "failed" if failed else "completed"
        run_id = None
        if database.available():
            recorded = {k: {f: v for f, v in r.items() if f != "export"} for k, r in results.items()}
            try:
                run_id = database.record_run(graph_id, "job", started, status, recorded)
            except database.NoDatabase as e:
                log.warning("The job's run wasn't recorded: %s", e)
        return {"runId": run_id, "status": status, "failed": failed, "results": results}

    return work, "graph"


def find_job(job_id: str) -> jobs.Job | JSONResponse:
    job = jobs.get(job_id)
    if job is None:
        return error(f"No job {job_id}: it never was, or it finished more than {settings.JOB_KEEP_SECONDS} seconds ago.", 404)
    return job


@router.get("/jobs/{job_id}")
def job_status(job_id: str):
    job = find_job(job_id)
    return job if isinstance(job, JSONResponse) else job.describe()


@router.get("/jobs/{job_id}/result")
def job_result(job_id: str):
    """A finished job's result: a graph's as JSON (as /execute answers); a
    Loop's as form data: `result` (JSON: { warnings, failed, cancelled,
    outputs: [{ slot, part }] }, slot null for its first) and a `table` part
    (Parquet) per output, its filename the part."""
    job = find_job(job_id)
    if isinstance(job, JSONResponse):
        return job
    if job.status == "running":
        return error("The job is still running.", 409)
    if job.status == "failed":
        return error(job.error or "The job failed.")
    if job.kind == "graph":
        return job.result
    result = job.result or {}
    outputs, parts = [], []
    for n, (slot, data) in enumerate(result.get("outputs", [])):
        outputs.append({"slot": slot, "part": f"t{n}"})
        parts.append(("table", data, PARQUET, f"t{n}"))
    summary = {k: result.get(k) for k in ("warnings", "failed", "cancelled")}
    content, content_type = formdata.encode([("result", json.dumps({**summary, "outputs": outputs}).encode(), "application/json", None), *parts])
    return Response(content, media_type=content_type)


@router.delete("/jobs/{job_id}")
def cancel_job(job_id: str):
    job = jobs.cancel(job_id)
    if job is None:
        return find_job(job_id)
    return job.describe()


# ---- The Terminal's b. commands (roadmap 8f) ----

@router.get("/commands")
def list_commands():
    """{ commands: [{ name, kind, description, type, secret, set, values?,
    value? }] }: `set` is whether a command set it, over .env; `value` a
    setting's value (a secret's, only whether it has one)."""
    return {"commands": terminal.describe()}


@router.post("/commands")
async def run_command(request: Request):
    """JSON { name, value? }: sets a setting to `value`, prints it without
    one, or runs an action. Answers { message }. Only in local development
    (IS_LOCAL), since there's no sign-in yet to say who may."""
    if not settings.IS_LOCAL:
        return error(
            "Commands that change the engine need sign-in, which it doesn't have yet, or local development "
            "(IS_LOCAL=true).", 403,
        )
    try:
        body = json.loads(await read_body(request) or b"{}")
    except ValueError:
        body = None
    if not isinstance(body, dict) or not isinstance(body.get("name"), str):
        return error("Send the command as JSON: { name, value? }.")
    try:
        message = await run_in_threadpool(terminal.run, body["name"], body.get("value"), "value" in body)
    except terminal.CommandError as e:
        return error(str(e))
    return {"message": message}


# ---- The AI assistant ----

@router.post("/assist")
async def assist_node(body: assist.AssistRequest):
    """JSON { kind, request, code, inputs } (see assist.py). Answers
    { code, note, model }."""
    if not assist.enabled():
        if not terminal.assistant_on():
            return error("The AI assistant is off on this engine (b.Assistant.Enabled = false).", 503)
        return error(
            "The AI assistant isn't set up on the engine (LITELLM_BASE_URL, LITELLM_API_KEY and ASSIST_MODEL, "
            "or b.LiteLLMURL, b.LiteLLMKey and b.Assistant.Model).", 503,
        )
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
    commands: list[terminal.Command] | None = None,
) -> FastAPI:
    """The engine as a FastAPI app. An app's entry point calls this, with its
    own node kinds and their categories (see nodes/), and its own b. commands
    for the Terminal (see commands.py)."""
    noderunner.register(nodes or [], categories or [])
    terminal.register(commands or [])
    app = FastAPI(title=title, lifespan=lifespan)
    app.middleware("http")(refuse_sandboxes)
    app.add_exception_handler(database.NoDatabase, no_database)
    app.add_exception_handler(runner.RunnerUnavailable, no_runner)
    app.add_exception_handler(noderunner.WorkerUnavailable, no_runner)
    app.add_exception_handler(RequestValidationError, invalid_request)
    app.include_router(router)
    return app


app = create_app()
