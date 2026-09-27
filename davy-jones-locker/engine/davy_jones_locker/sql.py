"""Server-side DuckDB, where user SQL runs: one in-memory database per query or
graph run, with the query database (Postgres) attached read-only as "db".

User SQL is user code, so each session is locked down before any runs: no
files, no new extensions, no new attachments, settings frozen. DuckDB's
lockdown doesn't stop postgres_scan() reaching another server by connection
string, so a query must also pass check_query: a single SELECT, calling none of
the functions that open connections or run SQL given as text.

Tables are exchanged as Arrow (in) and Parquet (on the wire). Like the browser
(seamonster's lib/graphRunner.js), each node's output is a table in OUTPUTS, and a
query sees its inputs through INPUTS (a view per input, named by its
reference name) or, for an input with several tables, a schema of that name.
"""

import io
import json
import logging
import re
import threading
from contextlib import contextmanager
from urllib.parse import urlsplit

import duckdb
import pyarrow as pa
import pyarrow.parquet as pq

from . import settings

log = logging.getLogger("davy-jones-locker.sql")

OUTPUTS = "flow_out"
INPUTS = "flow_in"
CATALOG = "db"  # the attached query database

# Functions that open connections or run SQL given as text.
BLOCKED_FUNCTIONS = {"query", "query_table"}
BLOCKED_PREFIXES = ("postgres_",)


class QueryError(ValueError):
    """A query that can't run: its message is for the user."""


def scrub(message: str) -> str:
    """An error message without the query database's URL or password, which
    DuckDB's own messages can include: they reach users and logs."""
    url = settings.QUERY_DATABASE_URL
    if url:
        message = message.replace(url, "the query database")
        try:
            password = urlsplit(url).password
        except ValueError:
            password = None
        if password:
            message = message.replace(password, "****")
    return re.sub(r"(password\s*=\s*)\S+", r"\1****", message, flags=re.IGNORECASE)


def quote(name: str) -> str:
    return '"' + name.replace('"', '""') + '"'


def literal(text: str) -> str:
    return "'" + text.replace("'", "''") + "'"


def to_parquet(table: pa.Table) -> bytes:
    sink = io.BytesIO()
    pq.write_table(table, sink)
    return sink.getvalue()


def from_parquet(data: bytes) -> pa.Table:
    return pq.read_table(io.BytesIO(data))


def _walk(value, visit):
    if isinstance(value, dict):
        visit(value)
        for child in value.values():
            _walk(child, visit)
    elif isinstance(value, list):
        for child in value:
            _walk(child, visit)


class Session:
    """One locked-down DuckDB, for a query or a whole graph run."""

    def __init__(self):
        con = duckdb.connect(":memory:")
        self.con = con
        con.execute(f"SET memory_limit = {literal(settings.QUERY_MEMORY_LIMIT)}")
        search_path = INPUTS
        if settings.QUERY_DATABASE_URL:
            try:
                con.execute("LOAD postgres")
                con.execute(f"ATTACH {literal(settings.QUERY_DATABASE_URL)} AS {CATALOG} (TYPE postgres, READ_ONLY)")
            except duckdb.Error as e:
                con.close()
                log.warning("Can't attach the query database: %s", scrub(str(e)))
                raise QueryError(
                    "The engine can't reach its query database (QUERY_DATABASE_URL), so SQL can't run on the server. "
                    "Is the database running?"
                ) from e
            search_path += f",{CATALOG}.public"
        for schema in (INPUTS, OUTPUTS):
            con.execute(f"CREATE SCHEMA {schema}")
        # Unqualified names: inputs first, then the query database's public schema.
        con.execute(f"SET search_path = {literal(search_path)}")
        con.execute("SET autoinstall_known_extensions = false")
        con.execute("SET autoload_known_extensions = false")
        con.execute("SET enable_external_access = false")
        con.execute("SET lock_configuration = true")
        self._input_views: list[str] = []
        self._input_schemas: list[str] = []

    def close(self) -> None:
        self.con.close()

    def __enter__(self):
        return self

    def __exit__(self, *_):
        self.close()

    @contextmanager
    def _deadline(self):
        timer = threading.Timer(settings.QUERY_TIMEOUT_SECONDS, self.con.interrupt)
        timer.start()
        try:
            yield
        except duckdb.InterruptException:
            raise QueryError(f"The query took longer than {settings.QUERY_TIMEOUT_SECONDS} seconds and was stopped.")
        finally:
            timer.cancel()

    # ---- Checking a query ----

    def check_query(self, query: str) -> None:
        """Raise QueryError unless `query` is one SELECT calling nothing blocked."""
        tree = json.loads(self.con.execute("SELECT json_serialize_sql(?)", [query]).fetchone()[0])
        if tree.get("error"):
            message = tree.get("error_message", "")
            if "Only SELECT" in message:
                raise QueryError("Only a SELECT query can run on the server.")
            raise QueryError(f"Couldn't read the query: {message}")
        if len(tree.get("statements", [])) != 1:
            raise QueryError("Write one SELECT query, not several statements.")

        def visit(node):
            name = str(node.get("function_name", "")).lower()
            if name and (name in BLOCKED_FUNCTIONS or name.startswith(BLOCKED_PREFIXES)):
                raise QueryError(f"{name}() can't be used on the server: query the tables in {CATALOG} instead.")

        _walk(tree, visit)

    # ---- Tables ----

    def load(self, target: str, table: pa.Table) -> None:
        """Create table `target` (quoted, qualified) from Arrow."""
        self.con.register("__flow_load", table)
        try:
            self.con.execute(f"CREATE TABLE {target} AS SELECT * FROM __flow_load")
        finally:
            self.con.unregister("__flow_load")

    def arrow(self, table: str) -> pa.Table:
        return self.con.execute(f"SELECT * FROM {table}").to_arrow_table()

    def row_count(self, table: str) -> int:
        return self.con.execute(f"SELECT count(*) FROM {table}").fetchone()[0]

    def output_table(self, node_id: str, name: str | None = None) -> str:
        return f"{OUTPUTS}.{quote(node_id if name is None else f'{node_id}/{name}')}"

    def expose(self, inputs: dict[str, str | dict[str, str]]) -> None:
        """Show the next query only these inputs: reference name -> table, or
        -> { table name: table } for an input with several tables."""
        for view in self._input_views:
            self.con.execute(f"DROP VIEW IF EXISTS {INPUTS}.{quote(view)}")
        for schema in self._input_schemas:
            self.con.execute(f"DROP SCHEMA IF EXISTS {quote(schema)} CASCADE")
        self._input_views, self._input_schemas = [], []
        for name, source in inputs.items():
            if isinstance(source, str):
                self.con.execute(f"CREATE VIEW {INPUTS}.{quote(name)} AS SELECT * FROM {source}")
                self._input_views.append(name)
            else:
                self.con.execute(f"CREATE SCHEMA {quote(name)}")
                self._input_schemas.append(name)
                for table_name, table in source.items():
                    self.con.execute(f"CREATE VIEW {quote(name)}.{quote(table_name)} AS SELECT * FROM {table}")

    def run_query(self, query: str, target: str) -> None:
        """Check `query`, then run it into table `target`."""
        query = query.strip().rstrip(";").strip()
        if not query:
            raise QueryError("Write a query first.")
        self.check_query(query)
        with self._deadline():
            try:
                self.con.execute(f"CREATE TABLE {target} AS {query}")
            except duckdb.InterruptException:
                raise
            except duckdb.Error as e:
                raise QueryError(scrub(str(e))) from e


def database_tables() -> dict[str, list[tuple[str, str]]]:
    """The query database's tables (its public schema), each with its columns
    as (name, type): what the AI assistant tells the model a query can read.
    Empty without a query database."""
    if not settings.QUERY_DATABASE_URL:
        return {}
    with Session() as session:
        rows = session.con.execute(
            "SELECT table_name, column_name, data_type FROM duckdb_columns() "
            "WHERE database_name = ? AND schema_name = 'public' ORDER BY table_name, column_index",
            [CATALOG],
        ).fetchall()
    tables: dict[str, list[tuple[str, str]]] = {}
    for table, column, data_type in rows:
        tables.setdefault(table, []).append((column, data_type))
    return tables


def run_query(query: str, inputs: dict[str, bytes]) -> bytes:
    """POST /query: `query` over `inputs` (reference name, or name.table, ->
    Parquet) and the query database. Returns the result as Parquet."""
    with Session() as session:
        exposed: dict[str, str | dict[str, str]] = {}
        for i, (name, data) in enumerate(inputs.items()):
            table = f"{OUTPUTS}.{quote(f'input{i}')}"
            session.load(table, from_parquet(data))
            if "." in name:
                ref, _, table_name = name.partition(".")
                exposed.setdefault(ref, {})[table_name] = table
            else:
                exposed[name] = table
        session.expose(exposed)
        target = f"{OUTPUTS}.{quote('result')}"
        session.run_query(query, target)
        return to_parquet(session.arrow(target))
