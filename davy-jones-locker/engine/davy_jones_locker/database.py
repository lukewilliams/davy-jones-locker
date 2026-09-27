"""The engine's own tables in Postgres, in the FLOW_SCHEMA schema, created the
first time the database answers (the engine owns them):

  graphs  saved graphs (pipeline documents), by ID
  files   stored data by key (a DataIngest node's tables, as Parquet)
  runs    a record of each server-side graph execution
"""

import json
import logging
import re
import uuid
from datetime import datetime, timezone

import psycopg

from . import settings

log = logging.getLogger("davy-jones-locker.database")


class NoDatabase(RuntimeError):
    """No DATABASE_URL, or it can't be reached: the endpoints that need
    Postgres can't work (they answer 503)."""


if not re.fullmatch(r"[a-z_][a-z0-9_]*", settings.FLOW_SCHEMA):
    raise ValueError(f"FLOW_SCHEMA must be a plain lowercase identifier, not {settings.FLOW_SCHEMA!r}")

S = settings.FLOW_SCHEMA

SCHEMA_SQL = f"""
CREATE SCHEMA IF NOT EXISTS {S};

CREATE TABLE IF NOT EXISTS {S}.graphs (
  id          text PRIMARY KEY,
  name        text NOT NULL DEFAULT '',
  document    jsonb NOT NULL,
  version     integer NOT NULL DEFAULT 1,
  created_at  timestamptz NOT NULL DEFAULT now(),
  updated_at  timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS {S}.files (
  key         text PRIMARY KEY,
  bytes       bytea NOT NULL,
  created_at  timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS {S}.runs (
  id          uuid PRIMARY KEY,
  graph_id    text,
  trigger     text NOT NULL,
  started_at  timestamptz NOT NULL,
  finished_at timestamptz,
  status      text NOT NULL,
  results     jsonb
);
"""


def available() -> bool:
    return bool(settings.DATABASE_URL)


_migrated = False


def connect() -> psycopg.Connection:
    """A connection, with the engine's tables created the first time one
    succeeds (so a database that comes up after the engine still works)."""
    global _migrated
    if not available():
        raise NoDatabase("No database is configured for the engine (DATABASE_URL).")
    try:
        db = psycopg.connect(settings.DATABASE_URL, autocommit=True, connect_timeout=5)
    except psycopg.OperationalError as e:
        log.warning("Can't reach the database: %s", str(e).strip())
        raise NoDatabase("The engine can't reach its database (DATABASE_URL). Is it running?") from e
    if not _migrated:
        try:
            db.execute(SCHEMA_SQL)
        except Exception:
            db.close()
            raise
        _migrated = True
    return db


def migrate() -> None:
    with connect():
        pass


# ---- Graphs ----

def put_graph(graph_id: str, name: str, document: dict) -> int:
    """Save a graph, returning its version (1 when new, one more each save)."""
    with connect() as db:
        row = db.execute(
            f"""
            INSERT INTO {S}.graphs (id, name, document) VALUES (%s, %s, %s)
            ON CONFLICT (id) DO UPDATE
              SET name = EXCLUDED.name, document = EXCLUDED.document,
                  version = {S}.graphs.version + 1, updated_at = now()
            RETURNING version
            """,
            (graph_id, name, json.dumps(document)),
        ).fetchone()
    return row[0]


def get_graph(graph_id: str) -> dict | None:
    with connect() as db:
        row = db.execute(
            f"SELECT id, name, version, updated_at, document FROM {S}.graphs WHERE id = %s", (graph_id,)
        ).fetchone()
    if not row:
        return None
    return {"id": row[0], "name": row[1], "version": row[2], "updatedAt": row[3].isoformat(), "document": row[4]}


def list_graphs() -> list[dict]:
    with connect() as db:
        rows = db.execute(f"SELECT id, name, version, updated_at FROM {S}.graphs ORDER BY updated_at DESC").fetchall()
    return [{"id": r[0], "name": r[1], "version": r[2], "updatedAt": r[3].isoformat()} for r in rows]


# ---- Stored files ----

def put_file(key: str, data: bytes) -> None:
    with connect() as db:
        db.execute(
            f"INSERT INTO {S}.files (key, bytes) VALUES (%s, %s) ON CONFLICT (key) DO UPDATE SET bytes = EXCLUDED.bytes",
            (key, data),
        )


def get_file(key: str) -> bytes | None:
    with connect() as db:
        row = db.execute(f"SELECT bytes FROM {S}.files WHERE key = %s", (key,)).fetchone()
    return bytes(row[0]) if row else None


# ---- Runs ----

def record_run(graph_id: str | None, trigger: str, started: datetime, status: str, results: dict) -> str:
    run_id = str(uuid.uuid4())
    with connect() as db:
        db.execute(
            f"""
            INSERT INTO {S}.runs (id, graph_id, trigger, started_at, finished_at, status, results)
            VALUES (%s, %s, %s, %s, %s, %s, %s)
            """,
            (run_id, graph_id, trigger, started, datetime.now(timezone.utc), status, json.dumps(results)),
        )
    return run_id
