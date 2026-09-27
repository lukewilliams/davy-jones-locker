"""The runner: runs PythonScript nodes' code for the engine, and nothing else.

It holds no credentials and (under compose) shares a network only with
the engine, with no way out: a script can't reach a database or the
internet, only the inputs it was given. Each script runs in its own process
(worker.py) with its own limits:

  wall clock  RUN_TIMEOUT_SECONDS, then the process group is killed
  CPU         5 seconds more, in CPU seconds (so for a script busy on several
              threads at once)
  memory      RUN_MEMORY_MB (as address space, doubled for allocators'
              reservations; the container's own limit backs it up)
  files       256 open; printed output capped at RUN_MAX_OUTPUT_CHARS

in a scratch directory that's deleted afterwards, along with anything the
script left running (see clean_up). The container runs as an
unprivileged user on a read-only filesystem with no capabilities (see
the app's compose.yaml). Python can't be sandboxed from inside itself, so these limits
and the container are the safeguard, not anything the script is told.

Runs are one at a time by default (RUN_CONCURRENCY): runs in one container
share a user, so two at once could read each other's scratch files. Scale
with more runner replicas instead.

  POST /run    form data: `code`, and an `input` file part per input (Parquet,
               its filename the reference name, or name.table). Answers with
               form data: `result` (JSON: output, value, variables, or error)
               and `table` (Parquet) when the last expression was a table.
  GET /health
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

from davy_jones_locker import formdata

TIMEOUT = int(os.environ.get("RUN_TIMEOUT_SECONDS") or 60)
MEMORY_MB = int(os.environ.get("RUN_MEMORY_MB") or 1536)
MAX_OUTPUT_CHARS = int(os.environ.get("RUN_MAX_OUTPUT_CHARS") or 200_000)
CONCURRENCY = int(os.environ.get("RUN_CONCURRENCY") or 1)
SWEEP = os.environ.get("RUN_SWEEP") == "1"
SCRATCH = os.environ.get("RUN_SCRATCH") or tempfile.gettempdir()
WORKER = Path(__file__).with_name("worker.py")

app = FastAPI(title="davy-jones-locker runner")
slots = asyncio.Semaphore(CONCURRENCY)


def set_limits() -> None:
    """In the worker process, before it starts (POSIX only)."""
    import resource

    os.setsid()  # its own process group, so a timeout kills everything it started
    memory = MEMORY_MB * 1024 * 1024 * 2
    resource.setrlimit(resource.RLIMIT_AS, (memory, memory))
    # A little over the wall clock, so that stops a busy single thread first;
    # this stops several busy threads, which use CPU time faster.
    resource.setrlimit(resource.RLIMIT_CPU, (TIMEOUT + 5, TIMEOUT + 10))
    resource.setrlimit(resource.RLIMIT_NOFILE, (256, 256))
    resource.setrlimit(resource.RLIMIT_CORE, (0, 0))


def worker_env(workdir: str) -> dict[str, str]:
    # Windows (local development only) needs its system variables to start Python.
    env = dict(os.environ) if os.name != "posix" else {"PATH": "/usr/local/bin:/usr/bin:/bin", "LANG": "C.UTF-8"}
    env.update({
        "HOME": workdir,
        "TMPDIR": workdir,
        "PYTHONDONTWRITEBYTECODE": "1",
        "ARROW_DEFAULT_MEMORY_POOL": "system",  # plays well with the address-space limit
        "OMP_NUM_THREADS": "2",
        "MPLBACKEND": "Agg",
        "RUN_MAX_OUTPUT_CHARS": str(MAX_OUTPUT_CHARS),
    })
    return env


def answer(result: dict, table: bytes | None = None, status: int = 200) -> Response:
    parts = [("result", json.dumps(result).encode(), "application/json", None)]
    if table is not None:
        parts.append(("table", table, "application/vnd.apache.parquet", "table.parquet"))
    body, content_type = formdata.encode(parts)
    return Response(body, status_code=status, media_type=content_type)


@app.get("/health")
def health():
    return {"status": "ok"}


@app.post("/run")
async def run(request: Request):
    try:
        parts = formdata.decode(await request.body(), request.headers.get("content-type", ""))
    except ValueError as e:
        return JSONResponse({"error": str(e)}, status_code=400)
    code = next((data.decode("utf-8") for name, data, _, filename in parts if name == "code" and not filename), None)
    if code is None:
        return JSONResponse({"error": "No code was sent."}, status_code=400)
    inputs = {filename: data for name, data, _, filename in parts if name == "input" and filename}

    async with slots:
        workdir = tempfile.mkdtemp(prefix="run-", dir=SCRATCH)
        try:
            return await run_in(Path(workdir), code, inputs)
        finally:
            shutil.rmtree(workdir, ignore_errors=True)


async def run_in(workdir: Path, code: str, inputs: dict[str, bytes]) -> Response:
    # Browsers send form fields with \r\n line breaks, which would throw the
    # traceback's line numbers off; bytes, so no platform translates them back.
    code = code.replace("\r\n", "\n").replace("\r", "\n")
    (workdir / "script.py").write_bytes(code.encode("utf-8"))
    spec: dict[str, str | dict[str, str]] = {}
    for i, (name, data) in enumerate(inputs.items()):
        file = f"input{i}.parquet"
        (workdir / file).write_bytes(data)
        ref, dot, table = name.partition(".")
        if dot:
            spec.setdefault(ref, {})[table] = file
        else:
            spec[name] = file
    (workdir / "inputs.json").write_text(json.dumps(spec), encoding="utf-8")

    extra = {"preexec_fn": set_limits} if os.name == "posix" else {}
    process = await asyncio.create_subprocess_exec(
        sys.executable, "-I", str(WORKER), str(workdir),
        cwd=str(workdir), env=worker_env(str(workdir)),
        stdin=asyncio.subprocess.DEVNULL, stdout=asyncio.subprocess.DEVNULL, stderr=asyncio.subprocess.PIPE,
        **extra,
    )
    printed = lambda: read_text(workdir / "output.txt")  # noqa: E731
    try:
        _, stderr = await asyncio.wait_for(process.communicate(), TIMEOUT)
    except asyncio.TimeoutError:
        kill(process)
        await process.wait()
        return answer({"error": f"Stopped after {TIMEOUT} seconds.", "output": printed()})
    finally:
        clean_up(process)

    result_file = workdir / "result.json"
    if not result_file.exists():
        why = stopped_because(process.returncode)
        detail = stderr.decode("utf-8", "replace").strip()[-2000:]
        return answer({"error": f"The script stopped before finishing: {why}." + (f"\n{detail}" if detail else ""),
                       "output": printed()})
    result = json.loads(result_file.read_text(encoding="utf-8"))
    table_file = workdir / "value.parquet"
    return answer(result, table_file.read_bytes() if table_file.exists() else None)


def stopped_because(returncode: int | None) -> str:
    """Why a worker ended without writing its result, from its exit status."""
    if not returncode or returncode > 0:
        return "it crashed"
    number = -returncode
    if number == getattr(signal, "SIGXCPU", None):
        return f"it used its {TIMEOUT + 5} seconds of CPU time"
    if number == signal.SIGKILL:
        return "it ran out of memory, or used too much CPU time"
    try:
        return f"it was stopped ({signal.Signals(number).name})"
    except ValueError:
        return f"it was stopped (signal {number})"


def kill(process: asyncio.subprocess.Process) -> None:
    try:
        if os.name == "posix":
            os.killpg(process.pid, signal.SIGKILL)
        else:
            process.kill()
    except ProcessLookupError:
        pass


def clean_up(process: asyncio.subprocess.Process) -> None:
    """After a run, kill whatever the script left running: its process group,
    and with RUN_SWEEP (set in compose.yaml, one run at a time) every other
    process of this user but the server, so nothing that left the group can
    outlive the run and read the next one's files. Never outside a container:
    it would take the user's other processes too. PID 1 (the container's
    init) reaps them."""
    kill(process)
    if SWEEP and CONCURRENCY == 1 and os.name == "posix":
        try:
            os.kill(-1, signal.SIGKILL)  # every process we may signal, except this one and PID 1
        except ProcessLookupError:
            pass


def read_text(path: Path) -> str:
    try:
        return path.read_text(encoding="utf-8", errors="replace")[:MAX_OUTPUT_CHARS]
    except OSError:
        return ""
