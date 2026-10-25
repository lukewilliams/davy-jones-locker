"""Jobs: runs longer than a request (roadmap 10d). A job runs on a thread of
its own; its progress can be read while it goes, it can be cancelled, and its
result collected once it's done (main.py's /jobs).

Two kinds:
  loop   one Loop node, its inputs sent as Parquet (the browser sends a Loop
         with nodes inside that run only on the server this way)
  graph  a whole graph, as POST /execute runs it

Jobs are kept in this process's memory: an engine restarted while one runs
loses it, and a finished job's result is kept for JOB_KEEP_SECONDS. At most
JOBS_AT_ONCE run at once; more are refused (Busy). A job is its starter's:
with sign-in, no one else can read or cancel it (main.py).
"""

import secrets
import threading
import time
from collections.abc import Callable
from dataclasses import dataclass, field
from datetime import datetime, timezone

from . import settings


class Busy(Exception):
    """As many jobs as JOBS_AT_ONCE are running already."""


@dataclass
class Job:
    id: str
    kind: str
    owner: str | None = None  # the user ID that started it
    status: str = "running"  # running, completed, failed, cancelled
    progress: dict = field(default_factory=dict)
    result: dict | None = None
    error: str | None = None
    started: datetime = field(default_factory=lambda: datetime.now(timezone.utc))
    finished: datetime | None = None
    finished_at: float | None = None  # monotonic, for forgetting it
    cancel: threading.Event = field(default_factory=threading.Event)

    def describe(self) -> dict:
        """What GET /jobs/{id} answers: everything but a loop's tables."""
        about = {
            "id": self.id, "kind": self.kind, "status": self.status, "progress": self.progress,
            "started": self.started.isoformat(), "finished": self.finished.isoformat() if self.finished else None,
        }
        if self.error:
            about["error"] = self.error
        if self.result is not None and self.kind == "graph":
            about["result"] = self.result
        if self.result is not None and self.kind == "loop":
            about["warnings"] = self.result.get("warnings", [])
        return about


_jobs: dict[str, Job] = {}
_lock = threading.Lock()


def _forget_old() -> None:
    now = time.monotonic()
    for job_id, job in list(_jobs.items()):
        if job.finished_at is not None and now - job.finished_at > settings.JOB_KEEP_SECONDS:
            del _jobs[job_id]


def start(kind: str, work: Callable[[Job], dict], owner: str | None = None) -> Job:
    """Run `work(job)` on a thread of its own. It returns the job's result,
    reports progress through `job.progress`, and checks `job.cancel`; an
    exception fails the job, its message the job's error."""
    with _lock:
        _forget_old()
        if sum(1 for j in _jobs.values() if j.status == "running") >= settings.JOBS_AT_ONCE:
            raise Busy(f"The engine is running {settings.JOBS_AT_ONCE} jobs already: try again when one has finished.")
        job = Job(id=secrets.token_hex(8), kind=kind, owner=owner)
        _jobs[job.id] = job

    def run() -> None:
        try:
            job.result = work(job)
            job.status = "cancelled" if job.cancel.is_set() else "completed"
        except Exception as e:  # the job fails, with what went wrong
            job.error = str(e) or type(e).__name__
            job.status = "failed"
        job.finished = datetime.now(timezone.utc)
        job.finished_at = time.monotonic()

    threading.Thread(target=run, name=f"job-{job.id}", daemon=True).start()
    return job


def get(job_id: str) -> Job | None:
    with _lock:
        _forget_old()
        return _jobs.get(job_id)


def cancel(job_id: str) -> Job | None:
    """Ask a job to stop: it does before its next node, or its next run of a
    Loop (one already running finishes)."""
    job = get(job_id)
    if job and job.status == "running":
        job.cancel.set()
    return job
