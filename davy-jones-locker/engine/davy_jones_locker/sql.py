"""Server-side DuckDB, where user SQL runs: one in-memory database per query or
graph run, with the query database (Postgres) attached read-only as "db".

User SQL is user code, so each session is locked down before any runs: no
files, no new extensions, no new attachments, settings frozen. DuckDB's
lockdown doesn't stop postgres_scan() reaching another server by connection
string, so a query must also pass check_query: a single SELECT, calling none of
the functions that open connections or run SQL given as text, nor the spatial
extension's file readers (the lockdown already refuses them; geo files are
read in the browser).

The spatial extension is loaded before the lockdown, with x, y axis order
whatever a CRS's official order (geometry_always_xy), as in the browser.

Tables are exchanged as Arrow (in) and Parquet (on the wire). Geometry keeps
its CRS both ways: GeoParquet's `geo` metadata becomes geoarrow fields, which
DuckDB loads as GEOMETRY('EPSG:7855'), and a GEOMETRY column's CRS is written
back as `geo` metadata, as DuckDB's own Parquet writer does in the browser.
Like the browser
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
GEO_KEY = b"geo"  # GeoParquet's metadata key
# How DuckDB exchanges GEOMETRY as Arrow: WKB, with the CRS as PROJJSON.
EXTENSION_NAME = b"ARROW:extension:name"
EXTENSION_METADATA = b"ARROW:extension:metadata"
GEOARROW_WKB = b"geoarrow.wkb"
# GeoParquet's CRS for a column whose metadata has no `crs` key.
DEFAULT_CRS = "OGC:CRS84"
# What it's loaded as with the spatial extension, as the browser does (whose
# spatial can't identify OGC:CRS84): the same coordinates in x, y order.
LONGITUDE_LATITUDE = "EPSG:4326"
# ST_GeometryType's names, as GeoParquet spells them.
GEOMETRY_TYPES = {
    "POINT": "Point", "LINESTRING": "LineString", "POLYGON": "Polygon", "MULTIPOINT": "MultiPoint",
    "MULTILINESTRING": "MultiLineString", "MULTIPOLYGON": "MultiPolygon", "GEOMETRYCOLLECTION": "GeometryCollection",
}

# Functions that open connections or run SQL given as text.
BLOCKED_FUNCTIONS = {"query", "query_table"}
BLOCKED_PREFIXES = ("postgres_",)
# The spatial extension's readers: files and URLs (through GDAL's drivers).
FILE_FUNCTIONS = {"st_read", "st_read_meta", "st_readosm", "st_readshp", "shapefile_meta"}

_spatial_missing = False  # set once LOAD spatial has failed, so it's logged once


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


def _is_crs84(crs) -> bool:
    if isinstance(crs, dict):
        crs_id = crs.get("id") or {}
        return crs_id.get("authority") == "OGC" and str(crs_id.get("code")) == "CRS84"
    return crs == DEFAULT_CRS


def _geometry_fields(table: pa.Table, spatial: bool) -> pa.Table:
    """`table` with the WKB columns its GeoParquet `geo` metadata names as
    geoarrow fields, each with its CRS: the PROJJSON given, none for an
    explicit null (unknown), and OGC:CRS84 when there's no `crs` key
    (GeoParquet's rule), which with spatial loaded is EPSG:4326, as in the
    browser. Metadata DuckDB can't use leaves the table as it is."""
    try:
        columns = json.loads((table.schema.metadata or {}).get(GEO_KEY) or b"{}").get("columns") or {}
    except (ValueError, AttributeError):
        return table
    if not isinstance(columns, dict):
        return table
    fields = []
    for field in table.schema:
        info = columns.get(field.name)
        if (isinstance(info, dict) and str(info.get("encoding", "")).upper() == "WKB"
                and (pa.types.is_binary(field.type) or pa.types.is_large_binary(field.type))):
            crs = info.get("crs", DEFAULT_CRS)
            if spatial and _is_crs84(crs):
                crs = LONGITUDE_LATITUDE
            extension = {} if crs is None else {"crs": crs, **({"crs_type": "projjson"} if isinstance(crs, dict) else {})}
            field = field.with_metadata({
                **(field.metadata or {}), EXTENSION_NAME: GEOARROW_WKB, EXTENSION_METADATA: json.dumps(extension).encode(),
            })
        fields.append(field)
    return pa.Table.from_arrays(table.columns, schema=pa.schema(fields, metadata=table.schema.metadata))


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
        self.spatial = _load_spatial(con)
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
            if name in FILE_FUNCTIONS:
                raise QueryError(
                    f"{name}() can't be used on the server, which reads no files. "
                    "Read the file with DataIngest and wire it in."
                )

        _walk(tree, visit)

    # ---- Tables ----

    def load(self, target: str, table: pa.Table) -> None:
        """Create table `target` (quoted, qualified) from Arrow: from Parquet
        with `geo` metadata, its geometry as GEOMETRY with each column's CRS."""
        self.con.register("__flow_load", _geometry_fields(table, self.spatial))
        try:
            self.con.execute(f"CREATE TABLE {target} AS SELECT * FROM __flow_load")
        finally:
            self.con.unregister("__flow_load")

    def arrow(self, table: str, geometry_as_text: bool = False) -> pa.Table:
        """A table as Arrow; with `geometry_as_text`, each GEOMETRY column as
        WKT, as DuckDB writes it to CSV and JSON (the browser's DataExport)."""
        columns = "*"
        if geometry_as_text:
            described = self.con.execute(f"DESCRIBE SELECT * FROM {table}").fetchall()
            columns = ", ".join(
                f"ST_AsText({quote(name)}) AS {quote(name)}" if re.match(r"GEOMETRY(\(|$)", kind) else quote(name)
                for name, kind, *_ in described
            )
        return self.con.execute(f"SELECT {columns} FROM {table}").to_arrow_table()

    def parquet(self, table: str) -> bytes:
        """A table as Parquet. With geometry it's GeoParquet: each GEOMETRY
        column's CRS (PROJJSON) in its `geo` metadata, or an explicit null when
        the column has none, since no `crs` would mean OGC:CRS84."""
        result = self.arrow(table)
        columns = {}
        fields = []
        for field in result.schema:
            metadata = field.metadata or {}
            if metadata.get(EXTENSION_NAME) == GEOARROW_WKB:
                crs = json.loads(metadata.get(EXTENSION_METADATA) or b"{}").get("crs")
                if isinstance(crs, str) and crs.startswith("{"):
                    crs = json.loads(crs)
                columns[field.name] = {"encoding": "WKB", "geometry_types": self._geometry_types(table, field.name), "crs": crs}
                # The file says it once, in `geo`, as DuckDB's Parquet does.
                field = field.with_metadata({k: v for k, v in metadata.items() if k not in (EXTENSION_NAME, EXTENSION_METADATA)})
            fields.append(field)
        if columns:
            geo = {"version": "1.0.0", "primary_column": next(iter(columns)), "columns": columns}
            schema = pa.schema(fields, metadata={**(result.schema.metadata or {}), GEO_KEY: json.dumps(geo).encode()})
            result = pa.Table.from_arrays(result.columns, schema=schema)
        return to_parquet(result)

    def _geometry_types(self, table: str, column: str) -> list[str]:
        """The geometry types in a column, as GeoParquet lists them ("Polygon
        Z"). Empty, meaning not known, without the spatial extension."""
        if not self.spatial:
            return []
        c = quote(column)
        rows = self.con.execute(
            f"SELECT DISTINCT ST_GeometryType({c}), ST_HasZ({c}), ST_HasM({c}) FROM {table} WHERE {c} IS NOT NULL"
        ).fetchall()
        names = {
            GEOMETRY_TYPES.get(str(kind), str(kind).title()) + (" ZM" if z and m else " Z" if z else " M" if m else "")
            for kind, z, m in rows
        }
        return sorted(names)

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
                if not self.spatial and "spatial extension" in str(e):
                    raise QueryError(
                        "This query uses spatial SQL, which this engine can't run: "
                        "its DuckDB spatial extension isn't installed."
                    ) from e
                raise QueryError(scrub(str(e))) from e


def _load_spatial(con: duckdb.DuckDBPyConnection) -> bool:
    """LOAD spatial, installed with the engine (its image installs it at
    build), and x, y axis order. False, logged once, if it isn't installed:
    the engine still runs SQL, just not spatial SQL."""
    global _spatial_missing
    try:
        con.execute("LOAD spatial")
        con.execute("SET geometry_always_xy = true")
        return True
    except duckdb.Error as e:
        if not _spatial_missing:
            _spatial_missing = True
            log.warning(
                "DuckDB's spatial extension couldn't load, so spatial SQL won't run on the engine (%s). "
                "Install it once: python -c \"import duckdb; duckdb.sql('INSTALL spatial')\"",
                str(e).splitlines()[0],
            )
        return False


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
        return session.parquet(target)
