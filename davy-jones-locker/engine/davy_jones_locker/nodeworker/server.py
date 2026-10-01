"""The node worker: runs the app's own node kinds (davy_jones_locker.nodes)
for the engine, and nothing else.

Handlers are the app's code, so trusted, but they parse what users send
(uploaded files, other nodes' tables) with whatever libraries they use, C
libraries among them. So they don't run in the engine, which holds the
database's and the AI proxy's credentials: they run here, in a container
with none, on a network it shares only with the engine, with no way out
(10e will add one, through a proxy, for kinds that need it). Each run is a
process of its own (child.py), killed when it passes its kind's timeout_s,
with its memory capped at NODE_MEMORY_MB (as address space, doubled for
allocators' reservations).

It runs only the kinds NODE_KINDS names ("module:attribute", the app's list
of NodeKinds), however it's asked: the handler to run comes from that list,
never from the request.

  POST /run    form data: `kind`, `node` (JSON: the node's data), `inputs`
               (JSON: [{ ref, id, slot, pin, part } or { ..., tables:
               [{ name, part }] }]), an `input` part per Parquet table (its
               filename the part named above), and a `file` part per file
               field's file (its filename the stored key). Answers with form
               data: `result` (JSON: output, value?, error?, outputs: [{ slot,
               part } or { slot, tables: [{ name, part }] }]) and a `table`
               part per table (Parquet, its filename the part named).
  GET /health  { status, kinds }
"""

import asyncio
import json
import os
import shutil
import signal
import sys
import tempfile
from pathlib import Path

from fastapi import FastAPI, Request
from fastapi.responses import JSONResponse, Response

from davy_jones_locker import formdata, nodes

CONCURRENCY = int(os.environ.get("NODE_CONCURRENCY") or 2)
MEMORY_MB = int(os.environ.get("NODE_MEMORY_MB") or 2048)
SCRATCH = os.environ.get("NODE_SCRATCH") or tempfile.gettempdir()
# Where the app's modules are (its nodes.py and handlers): the directory the
# worker starts in, unless NODE_APP_DIR says otherwise.
APP_DIR = os.environ.get("NODE_APP_DIR") or os.getcwd()
sys.path.insert(0, APP_DIR)
# What a run's process imports from: the app, this framework, and whatever
# the worker was started with.
CHILD_PATH = os.pathsep.join(
    [APP_DIR, str(Path(__file__).resolve().parents[2])] + [p for p in (os.environ.get("PYTHONPATH") or "").split(os.pathsep) if p]
)

# The kinds it runs (the engine checks them: it knows the categories too).
KINDS = {kind.kind: kind for kind in nodes.load(os.environ["NODE_KINDS"])} if os.environ.get("NODE_KINDS") else {}

app = FastAPI(title="davy-jones-locker node worker")
slots = asyncio.Semaphore(CONCURRENCY)
PARQUET = "application/vnd.apache.parquet"


def refuse(message: str, status: int) -> JSONResponse:
    return JSONResponse({"error": message}, status_code=status)


@app.get("/health")
def health():
    return {"status": "ok", "kinds": sorted(KINDS)}


@app.post("/run")
async def run(request: Request):
    try:
        parts = formdata.decode(await request.body(), request.headers.get("content-type", ""))
    except ValueError as e:
        return refuse(str(e), 400)
    fields = {name: data for name, data, _, filename in parts if not filename}
    kind = KINDS.get(fields.get("kind", b"").decode("utf-8", "replace"))
    if kind is None:
        return refuse("The node worker doesn't run that kind of node.", 404)
    try:
        node = json.loads(fields.get("node") or b"{}")
        inputs = json.loads(fields.get("inputs") or b"[]")
    except ValueError:
        return refuse("The node's data or inputs weren't JSON.", 400)
    errors = kind.errors(node)
    if errors:
        return refuse(" ".join(errors), 400)
    tables = {filename: data for name, data, _, filename in parts if name == "input" and filename}
    files = {filename: data for name, data, _, filename in parts if name == "file" and filename}

    async with slots:
        workdir = Path(tempfile.mkdtemp(prefix="node-", dir=SCRATCH))
        try:
            return await run_in(workdir, kind, kind.with_defaults(node), inputs, tables, files)
        finally:
            shutil.rmtree(workdir, ignore_errors=True)


async def run_in(workdir: Path, kind: nodes.NodeKind, node: dict, inputs: list, tables: dict, files: dict) -> Response:
    # The request's names become file names here, so none of them is used as one.
    parts: dict[str, str] = {}
    for i, (part, data) in enumerate(tables.items()):
        parts[part] = f"input{i}.parquet"
        (workdir / parts[part]).write_bytes(data)
    (workdir / "files").mkdir()
    stored: dict[str, str] = {}
    for i, (key, data) in enumerate(files.items()):
        stored[key] = f"file{i}"
        (workdir / "files" / stored[key]).write_bytes(data)
    specs = []
    for item in inputs:
        spec = {k: item.get(k) for k in ("ref", "id", "slot", "pin")}
        if "tables" in item:
            spec["tables"] = {t["name"]: parts[t["part"]] for t in item["tables"] if t.get("part") in parts}
        elif item.get("part") in parts:
            spec["file"] = parts[item["part"]]
        else:
            continue
        specs.append(spec)
    request = {"handler": kind.handler, "node": node, "labels": {f.key: f.label for f in kind.fields},
               "inputs": specs, "files": stored}
    (workdir / "request.json").write_text(json.dumps(request), encoding="utf-8")

    extra = {"preexec_fn": set_limits} if os.name == "posix" else {}
    env = {**os.environ, "PYTHONPATH": CHILD_PATH, "PYTHONDONTWRITEBYTECODE": "1", "HOME": str(workdir), "TMPDIR": str(workdir)}
    process = await asyncio.create_subprocess_exec(
        sys.executable, "-m", "davy_jones_locker.nodeworker.child", str(workdir),
        cwd=str(workdir), env=env,
        stdin=asyncio.subprocess.DEVNULL, stdout=asyncio.subprocess.DEVNULL, stderr=asyncio.subprocess.PIPE,
        **extra,
    )
    try:
        _, stderr = await asyncio.wait_for(process.communicate(), kind.timeout_s)
    except asyncio.TimeoutError:
        kill(process)
        await process.wait()
        return answer({"error": f"{kind.label} stopped after {kind.timeout_s} seconds.", "output": ""})
    finally:
        kill(process)

    result_file = workdir / "result.json"
    if not result_file.exists():
        detail = stderr.decode("utf-8", "replace").strip()[-2000:]
        why = "it ran out of memory" if process.returncode == -signal.SIGKILL else "it crashed"
        return answer({"error": f"{kind.label} stopped before finishing: {why}." + (f"\n{detail}" if detail else ""), "output": ""})
    result = json.loads(result_file.read_text(encoding="utf-8"))
    out_tables = []
    outputs = []
    for output in result.pop("outputs", []):
        if "tables" in output:
            named = []
            for t in output["tables"]:
                named.append({"name": t["name"], "part": t["file"]})
                out_tables.append((t["file"], (workdir / t["file"]).read_bytes()))
            outputs.append({"slot": output["slot"], "tables": named})
        else:
            outputs.append({"slot": output["slot"], "part": output["file"]})
            out_tables.append((output["file"], (workdir / output["file"]).read_bytes()))
    result["outputs"] = outputs
    return answer(result, out_tables)


def answer(result: dict, tables: list[tuple[str, bytes]] = ()) -> Response:
    parts = [("result", json.dumps(result).encode(), "application/json", None)]
    parts += [("table", data, PARQUET, name) for name, data in tables]
    body, content_type = formdata.encode(parts)
    return Response(body, media_type=content_type)


def set_limits() -> None:
    """In the child, before it starts (POSIX only): its own process group, so
    a timeout kills everything it started, and its memory capped."""
    import resource

    os.setsid()
    memory = MEMORY_MB * 1024 * 1024 * 2
    try:
        resource.setrlimit(resource.RLIMIT_AS, (memory, memory))
    except (ValueError, OSError):
        # On Linux (the worker's container) the limit must hold; macOS, for
        # development only, won't set it.
        if sys.platform.startswith("linux"):
            raise


def kill(process: asyncio.subprocess.Process) -> None:
    try:
        if os.name == "posix":
            os.killpg(process.pid, signal.SIGKILL)
        else:
            process.kill()
    except (ProcessLookupError, PermissionError):
        pass
