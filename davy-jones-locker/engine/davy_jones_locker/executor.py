"""Runs a whole graph on the server (POST /execute, POST /graphs/{id}/execute),
for schedulers like n8n. The same rules as the browser (seamonster's
lib/graphRunner.js): a node runs after everything upstream of it, reads each node
wired into it by reference name (sqlnode1_data, or dataingest1_data.sheet1),
and fails if anything upstream failed.

What runs here:
  sql-query      on the server's DuckDB: its inputs, and the query database
  python-script  in the runner (sandbox/)
  data-ingest    from the tables it stored by key (PUT /files/{key})
  data-export    to CSV, TSV, JSON or Parquet, returned in the result (base64)
  javascript     refused: browser only, until the engine has safeguards for it
  anything else  can't run on the server yet
"""

import base64
import io
import json
import re

import pyarrow as pa
import pyarrow.csv as pacsv
import pyarrow.parquet as pq

from . import database, runner, sql
from .sql import QueryError


class NodeError(Exception):
    """A node that failed, with what it printed first (Python)."""

    def __init__(self, message: str, output: str = ""):
        super().__init__(message)
        self.output = output


# Formats whose ingested tables stay separate: the input is a schema of them.
MULTI_TABLE_FORMATS = {"xlsx", "sqlite"}

EXTENSIONS = {
    "csv": "csv", "tsv": "tsv", "tab": "tsv", "json": "json", "geojson": "geojson",
    "parquet": "parquet", "xlsx": "xlsx", "sqlite": "sqlite", "sqlite3": "sqlite", "db": "sqlite",
}
WRITERS = {
    "csv": ("text/csv", "csv"),
    "tsv": ("text/tab-separated-values", "tsv"),
    "json": ("application/json", "json"),
    "parquet": ("application/vnd.apache.parquet", "parquet"),
}


def reference_name(node: dict) -> str:
    return f"{node['id']}_{node.get('outputSuffix') or 'data'}"


def upstream_order(doc: dict, targets: list[str]) -> tuple[list[str], dict[str, list[str]]]:
    """The targets and everything upstream, each after its inputs; and each
    node's inputs (source IDs, once each)."""
    ids = {n["id"] for n in doc.get("nodes", [])}
    inputs: dict[str, list[str]] = {}
    for edge in doc.get("edges", []):
        if edge.get("source") in ids and edge.get("target") in ids:
            sources = inputs.setdefault(edge["target"], [])
            if edge["source"] not in sources:
                sources.append(edge["source"])
    order: list[str] = []
    seen: set[str] = set()

    def visit(node_id: str) -> None:
        if node_id in seen:
            return
        seen.add(node_id)
        for source in inputs.get(node_id, []):
            visit(source)
        order.append(node_id)

    for target in targets:
        visit(target)
    return order, inputs


def execute(doc: dict, targets: list[str] | None = None) -> dict[str, dict]:
    """Run `targets` (by default every node with Auto Run on) and everything
    upstream. Returns { node ID: { status, error? | rowCount, output?, value?,
    export? } } for every node that ran."""
    nodes = {n["id"]: n for n in doc.get("nodes", []) if isinstance(n, dict) and "id" in n}
    if targets is None:
        targets = [node_id for node_id, n in nodes.items() if n.get("autoRun") is not False]
    missing = [t for t in targets if t not in nodes]
    if missing:
        raise ValueError(f"No such node: {', '.join(missing)}.")
    order, inputs = upstream_order(doc, targets)

    results: dict[str, dict] = {}
    outputs: dict[str, str | dict[str, str]] = {}
    with sql.Session() as session:
        for node_id in order:
            sources = inputs.get(node_id, [])
            failed = next((s for s in sources if results[s]["status"] == "failed"), None)
            if failed:
                results[node_id] = {"status": "failed", "error": f"Upstream node {failed} failed."}
                continue
            try:
                result = run_node(session, nodes[node_id], [nodes[s] for s in sources], outputs)
                results[node_id] = {"status": "completed", **result}
            except NodeError as e:
                results[node_id] = {"status": "failed", "error": str(e), **({"output": e.output} if e.output else {})}
            except (QueryError, runner.RunnerUnavailable, database.NoDatabase) as e:
                results[node_id] = {"status": "failed", "error": str(e)}
            except Exception as e:  # anything unexpected fails the node, not the run
                results[node_id] = {"status": "failed", "error": f"{type(e).__name__}: {e}"}
    return results


def exposed_inputs(sources: list[dict], outputs: dict) -> dict:
    return {reference_name(s): outputs[s["id"]] for s in sources}


def run_node(session: sql.Session, node: dict, sources: list[dict], outputs: dict) -> dict:
    kind = node.get("kind")
    node_id = node["id"]

    if kind == "sql-query":
        session.expose(exposed_inputs(sources, outputs))
        target = session.output_table(node_id)
        session.run_query(node.get("sqlQuery") or "", target)
        outputs[node_id] = target
        return {"rowCount": session.row_count(target)}

    if kind == "python-script":
        return run_python(session, node, sources, outputs)

    if kind == "data-ingest":
        ingest = node.get("ingest")
        if not ingest:
            raise NodeError("Choose a file first.")
        tables: dict[str, str] = {}
        for stored in ingest.get("tables", []):
            data = database.get_file(stored["key"])
            if data is None:
                raise NodeError(f"The data read from \"{ingest.get('fileName')}\" isn't stored on the server.")
            target = session.output_table(node_id, stored["name"])
            session.load(target, sql.from_parquet(data))
            tables[stored["name"]] = target
        if not tables:
            raise NodeError("This node's file had no tables.")
        outputs[node_id] = tables if ingest.get("format") in MULTI_TABLE_FORMATS else next(iter(tables.values()))
        return {"rowCount": sum(session.row_count(t) for t in tables.values())}

    if kind == "data-export":
        return run_export(session, node, sources, outputs)

    if kind == "javascript":
        raise NodeError("JavaScript nodes run only in the browser: the engine won't run them until it has safeguards for them.")

    raise NodeError(f"{kind} nodes can't run on the server yet.")


def run_python(session: sql.Session, node: dict, sources: list[dict], outputs: dict) -> dict:
    code = node.get("pythonCode") or ""
    if not code.strip():
        raise NodeError("Write some code first.")
    payload: dict[str, bytes] = {}
    for source in sources:
        name = reference_name(source)
        output = outputs[source["id"]]
        if isinstance(output, str):
            payload[name] = sql.to_parquet(session.arrow(output))
        else:
            for table_name, table in output.items():
                payload[f"{name}.{table_name}"] = sql.to_parquet(session.arrow(table))

    result = runner.run(code, payload)
    if result.get("error"):
        raise NodeError(result["error"], result.get("output", ""))
    target = session.output_table(node["id"])
    if "table" in result:
        session.load(target, sql.from_parquet(result["table"]))
    else:
        session.con.execute(f"CREATE TABLE {target} AS SELECT NULL::VARCHAR AS value WHERE false")
    outputs[node["id"]] = target
    return {
        "rowCount": session.row_count(target),
        "output": result.get("output", ""),
        "value": result.get("value"),
        "variables": result.get("variables", []),
    }


def format_from_name(name: str) -> str | None:
    match = re.search(r"\.([^./\\]+)$", name)
    return EXTENSIONS.get(match.group(1).lower()) if match else None


def run_export(session: sql.Session, node: dict, sources: list[dict], outputs: dict) -> dict:
    source, table = pick_export_input(node, sources, outputs)
    typed = (node.get("exportFilename") or "").strip() or "export"
    fmt = node.get("exportFormat") or format_from_name(typed) or "csv"
    if fmt not in WRITERS:
        raise NodeError(f"{fmt} files can't be written on the server yet: CSV, TSV, JSON and Parquet can.")
    content_type, extension = WRITERS[fmt]
    filename = typed if format_from_name(typed) == fmt else f"{typed}.{extension}"
    data = write(fmt, session.arrow(table))
    outputs[node["id"]] = table
    return {
        "rowCount": session.row_count(table),
        "export": {
            "filename": filename,
            "contentType": content_type,
            "size": len(data),
            "base64": base64.b64encode(data).decode("ascii"),
        },
    }


def pick_export_input(node: dict, sources: list[dict], outputs: dict) -> tuple[dict, str]:
    """The input a DataExport node writes: its only one, or the one
    `exportInput` names (reference name or ID; <name>.<table> for one table
    of several)."""
    if not sources:
        raise NodeError("Wire a node into this one to export its data.")
    names = [reference_name(s) for s in sources]
    choice = (node.get("exportInput") or "").strip()
    if not choice:
        if len(sources) > 1:
            raise NodeError(f"{len(sources)} nodes are wired in ({', '.join(names)}). Name the one to write under Input.")
        source, table_name = sources[0], None
    else:
        def by_name(name: str) -> dict | None:
            return next((s for s, n in zip(sources, names) if n == name or s["id"] == name), None)

        source, table_name = by_name(choice), None
        if source is None and "." in choice:
            ref, _, table_name = choice.rpartition(".")
            source = by_name(ref)
        if source is None:
            raise NodeError(f"No input called \"{choice}\" is wired in. Wired in: {', '.join(names)}.")

    output = outputs[source["id"]]
    if isinstance(output, str):
        if table_name:
            raise NodeError(f"{source['id']} has no table called \"{table_name}\": it has one table.")
        return source, output
    if table_name:
        if table_name not in output:
            raise NodeError(f"{source['id']} has no table called \"{table_name}\": its tables are {', '.join(output)}.")
        return source, output[table_name]
    raise NodeError(f"{source['id']} has {len(output)} tables: name one under Input (like {reference_name(source)}.{next(iter(output))}).")


def write(fmt: str, table: pa.Table) -> bytes:
    sink = io.BytesIO()
    if fmt == "csv":
        pacsv.write_csv(table, sink)
    elif fmt == "tsv":
        pacsv.write_csv(table, sink, pacsv.WriteOptions(delimiter="\t"))
    elif fmt == "json":
        sink.write(json.dumps(table.to_pylist(), default=str).encode())
    else:
        pq.write_table(table, sink)
    return sink.getvalue()
