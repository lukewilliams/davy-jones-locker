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
  the app's own  in the node worker (noderunner.py), its file fields' files
                 from the stored files too
  javascript     refused: browser only, until the engine has safeguards for it
  anything else  can't run on the server yet

Slots and pins as SEAMONSTER has them (its kindRegistry.js): a node's first
output is read by its reference name, its kind's other slots as <id>_<slot>;
a wire from the main pin (source-0) carries all of them, one from a slot's own
pin (source:<slot>) just that slot.

Subnets as SEAMONSTER has them (its subnets.js): a subnet node's graph, inline
(`subnet`) or shared by name (`subnetRef`, in the document's `subnets`), runs
as it is, with what's wired into the subnet's pins put out by its Input nodes
(subnet-input, one pin each, named by ID) and its Output nodes
(subnet-output) its outputs, the topmost first. Nodes inside are known by path
(subnet1/sqlnode1): results are keyed so, and output tables named so. Errors
name the node inside where they started (Screening › classify: ...).
"""

import base64
import io
import json
import re
from dataclasses import dataclass

import pyarrow as pa
import pyarrow.csv as pacsv

from . import database, noderunner, runner, sql
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


SUBNET, SUBNET_INPUT, SUBNET_OUTPUT = "subnet", "subnet-input", "subnet-output"

# How deep subnets may nest: deeper means one contains itself.
MAX_DEPTH = 8

UPSTREAM_FAILED = re.compile(r"^Upstream node .+ failed\.$")


@dataclass
class Level:
    """One graph being run: the document's, or a subnet's (its nodes' paths
    start with `prefix`; `bindings` has what its Input nodes put out, by ID)."""

    doc: dict
    results: dict
    prefix: str = ""
    depth: int = 0
    bindings: dict | None = None


def subnet_graph(node: dict, doc: dict) -> dict | None:
    """A subnet node's graph: inline, or the shared one it names (None if the
    document has none of that name)."""
    if node.get("subnetRef"):
        return (doc.get("subnets") or {}).get(node["subnetRef"])
    return node.get("subnet")


def boundary_pins(graph: dict) -> dict[str, list[str]]:
    """A subnet's pins: its Input and Output nodes' IDs, top to bottom (then
    left to right)."""
    nodes = sorted(
        (n for n in graph.get("nodes", []) if isinstance(n, dict) and "id" in n),
        key=lambda n: (n.get("position", {}).get("y", 0), n.get("position", {}).get("x", 0)),
    )
    return {
        "inputs": [n["id"] for n in nodes if n.get("kind") == SUBNET_INPUT],
        "outputs": [n["id"] for n in nodes if n.get("kind") == SUBNET_OUTPUT],
    }


def reference_name(node: dict, doc: dict | None = None) -> str:
    """How downstream code reads a node's first slot. A subnet's is named by
    its topmost Output node."""
    if node.get("kind") == SUBNET and doc is not None:
        graph = subnet_graph(node, doc)
        first = boundary_pins(graph)["outputs"][:1] if graph else []
        return f"{node['id']}_{first[0] if first else 'data'}"
    return f"{node['id']}_{node.get('outputSuffix') or 'data'}"


def upstream_order(doc: dict, targets: list[str]) -> tuple[list[str], dict[str, list[dict]]]:
    """The targets and everything upstream, each after its inputs; and each
    node's wires in (the edges, in order)."""
    ids = {n["id"] for n in doc.get("nodes", [])}
    inputs: dict[str, list[dict]] = {}
    for edge in doc.get("edges", []):
        if edge.get("source") in ids and edge.get("target") in ids:
            inputs.setdefault(edge["target"], []).append(edge)
    order: list[str] = []
    seen: set[str] = set()

    def visit(node_id: str) -> None:
        if node_id in seen:
            return
        seen.add(node_id)
        for edge in inputs.get(node_id, []):
            visit(edge["source"])
        order.append(node_id)

    for target in targets:
        visit(target)
    return order, inputs


def execute(doc: dict, targets: list[str] | None = None) -> dict[str, dict]:
    """Run `targets` (by default every node with Auto Run on) and everything
    upstream. A target inside a subnet is its path (subnet1/sqlnode1).
    Returns { path: { status, error? | rowCount, output?, value?, export? } }
    for every node that ran, inside subnets too."""
    nodes = {n["id"]: n for n in doc.get("nodes", []) if isinstance(n, dict) and "id" in n}
    if targets is None:
        targets = [node_id for node_id, n in nodes.items() if n.get("autoRun") is not False]
    missing = [t for t in targets if t.split("/")[0] not in nodes]
    if missing:
        raise ValueError(f"No such node: {', '.join(missing)}.")
    results: dict[str, dict] = {}
    with sql.Session() as session:
        run_graph(session, doc, targets, Level(doc=doc, results=results))
    return results


def run_graph(session: sql.Session, graph: dict, targets: list[str], level: Level) -> dict:
    """Run `targets` of one graph (the document's or a subnet's) and what's
    upstream of them; a target can be a path into one of its subnets, which
    then runs only as far as that. Returns this level's outputs: per node
    that ran, its tables by slot (None: its first), a table's name or
    { table name: table } for several."""
    nodes = {n["id"]: n for n in graph.get("nodes", []) if isinstance(n, dict) and "id" in n}
    own: list[str] = []
    inside: dict[str, list[str]] = {}
    for target in targets:
        first, _, rest = target.partition("/")
        if first not in nodes:
            continue
        if rest and nodes[first].get("kind") == SUBNET:
            inside.setdefault(first, []).append(rest)
        elif not rest:
            own.append(first)
    order, inputs = upstream_order(graph, own + list(inside))
    # A subnet that's there only for what's inside it runs just that, and has
    # no result of its own; everything else runs whole.
    feeding = {w["source"] for node_id in order for w in inputs.get(node_id, [])}
    whole = {n for n in order if n not in inside or n in own or n in feeding}

    outputs: dict[str, dict[str | None, str | dict[str, str]]] = {}
    for node_id in order:
        key = level.prefix + node_id
        wires = inputs.get(node_id, [])
        failed = next((w["source"] for w in wires if level.results.get(level.prefix + w["source"], {}).get("status") == "failed"), None)
        if failed:
            if node_id in whole:
                level.results[key] = {"status": "failed", "error": f"Upstream node {failed} failed."}
            continue
        try:
            given = wired(wires, nodes, outputs, level.doc)
            if node_id not in whole:
                run_subnet(session, nodes[node_id], given, outputs, level, inside[node_id], whole=False)
                continue
            result = run_node(session, nodes[node_id], given, outputs, level, inside.get(node_id))
            level.results[key] = {"status": "completed", **result}
        except NodeError as e:
            level.results[key] = {"status": "failed", "error": str(e), **({"output": e.output} if e.output else {})}
        except (QueryError, runner.RunnerUnavailable, noderunner.WorkerUnavailable, database.NoDatabase) as e:
            level.results[key] = {"status": "failed", "error": str(e)}
        except Exception as e:  # anything unexpected fails the node, not the run
            level.results[key] = {"status": "failed", "error": f"{type(e).__name__}: {e}"}
    return outputs


def run_subnet(
    session: sql.Session, node: dict, inputs: list[dict], outputs: dict, level: Level,
    inner_targets: list[str] | None, whole: bool,
) -> dict | None:
    """A subnet node's graph, run with what's wired into its pins put out by
    its Input nodes (the first slot each wire carries): every Output's
    upstream when `whole` (it runs as a node), and `inner_targets` (paths in
    it). Its outputs are its Outputs', the topmost first."""
    path = level.prefix + node["id"]
    name = node.get("label") or node["id"]
    if level.depth >= MAX_DEPTH:
        raise NodeError(f"Subnets here are nested more than {MAX_DEPTH} deep: does one contain itself?")
    graph = subnet_graph(node, level.doc)
    if graph is None:
        raise NodeError(f"This subnet uses \"{node.get('subnetRef')}\" from the graph's shared subnets, which the graph doesn't have.")
    pins = boundary_pins(graph)
    bindings: dict = {}
    for pin in pins["inputs"]:
        given = next((i for i in inputs if i["pin"] == pin), None)
        bindings[pin] = given["output"] if given else NodeError(f"Nothing is wired into {name}'s {pin} input.")
    targets = (pins["outputs"] if whole else []) + (inner_targets or [])
    inner = Level(doc=level.doc, results=level.results, prefix=f"{path}/", depth=level.depth + 1, bindings=bindings)
    made_inside = run_graph(session, graph, targets, inner)
    if not whole:
        return None

    if any(level.results.get(f"{path}/{o}", {}).get("status") == "failed" for o in pins["outputs"]):
        inner_nodes = {n["id"]: n for n in graph.get("nodes", []) if isinstance(n, dict) and "id" in n}
        for key, result in list(level.results.items()):
            child = key.removeprefix(f"{path}/")
            if child == key or "/" in child or result.get("status") != "failed" or UPSTREAM_FAILED.match(result.get("error", "")):
                continue
            child_node = inner_nodes.get(child, {})
            if child_node.get("kind") == SUBNET:  # its error starts with its name already
                raise NodeError(f"{name} › {result['error']}")
            raise NodeError(f"{name} › {child_node.get('label') or child}: {result['error']}")
        raise NodeError(f"{name} failed.")

    made: dict[str | None, str | dict[str, str]] = {}
    for i, out in enumerate(pins["outputs"]):
        made[None if i == 0 else out] = made_inside[out][None]
    if None not in made:
        target = session.output_table(path)
        session.con.execute(f"CREATE TABLE {target} AS SELECT NULL::VARCHAR AS value WHERE false")
        made[None] = target
    outputs[node["id"]] = made
    return {"rowCount": rows_of(session, made[None])}


def rows_of(session: sql.Session, output: str | dict[str, str]) -> int:
    return session.row_count(output) if isinstance(output, str) else sum(session.row_count(t) for t in output.values())


def slot_names(node: dict, doc: dict | None = None) -> list[str]:
    """A node's slots beyond the first: its kind's, if it's one of the app's;
    a subnet's Outputs after the topmost."""
    if node.get("kind") == SUBNET and doc is not None:
        graph = subnet_graph(node, doc)
        return boundary_pins(graph)["outputs"][1:] if graph else []
    kind = noderunner.KINDS.get(node.get("kind"))
    return kind.slot_names(node) if kind else []


def wired(wires: list[dict], nodes: dict[str, dict], outputs: dict, doc: dict | None = None) -> list[dict]:
    """What a node's wires bring it: one input per slot each wire carries,
    { id, ref, slot, pin, output } (output: a table's name, or { table name:
    table }), each once per slot and pin."""
    found, seen = [], set()
    for wire in wires:
        source = nodes[wire["source"]]
        handle = wire.get("sourceHandle") or "source-0"
        target_handle = wire.get("targetHandle") or ""
        pin = target_handle.removeprefix("target:") if target_handle.startswith("target:") else None
        slots = [None, *slot_names(source, doc)]
        if handle.startswith("source:"):
            slots = [s for s in slots if s == handle.removeprefix("source:")]
        for slot in slots:
            if (source["id"], slot, pin) in seen or slot not in outputs.get(source["id"], {}):
                continue
            seen.add((source["id"], slot, pin))
            ref = reference_name(source, doc) if slot is None else f"{source['id']}_{slot}"
            found.append({"id": source["id"], "ref": ref, "slot": slot, "pin": pin, "output": outputs[source["id"]][slot]})
    return found


def exposed(inputs: list[dict]) -> dict:
    return {i["ref"]: i["output"] for i in inputs}


def run_node(
    session: sql.Session, node: dict, inputs: list[dict], outputs: dict, level: Level | None = None,
    inner_targets: list[str] | None = None,
) -> dict:
    """Run one node; its output tables are named by its path (`base`)."""
    kind = node.get("kind")
    node_id = node["id"]
    level = level or Level(doc={}, results={})
    base = level.prefix + node_id

    if kind == SUBNET:
        return run_subnet(session, node, inputs, outputs, level, inner_targets, whole=True)

    if kind == SUBNET_INPUT:
        bound = (level.bindings or {}).get(node_id)
        if bound is None:
            raise NodeError("Input nodes work only inside a subnet: open a subnet and add them there.")
        if isinstance(bound, NodeError):
            raise bound
        outputs[node_id] = {None: bound}
        return {"rowCount": rows_of(session, bound)}

    if kind == SUBNET_OUTPUT:
        if not inputs:
            raise NodeError("Wire a node into this Output.")
        outputs[node_id] = {None: inputs[0]["output"]}
        return {"rowCount": rows_of(session, inputs[0]["output"])}

    if kind == "sql-query":
        session.expose(exposed(inputs))
        target = session.output_table(base)
        session.run_query(node.get("sqlQuery") or "", target)
        outputs[node_id] = {None: target}
        return {"rowCount": session.row_count(target)}

    if kind == "python-script":
        return run_python(session, node, inputs, outputs, base)

    if kind == "data-ingest":
        ingest = node.get("ingest")
        if not ingest:
            raise NodeError("Choose a file first.")
        tables: dict[str, str] = {}
        for stored in ingest.get("tables", []):
            data = database.get_file(stored["key"])
            if data is None:
                raise NodeError(f"The data read from \"{ingest.get('fileName')}\" isn't stored on the server.")
            target = session.output_table(base, stored["name"])
            session.load(target, sql.from_parquet(data))
            tables[stored["name"]] = target
        if not tables:
            raise NodeError("This node's file had no tables.")
        first = tables if ingest.get("format") in MULTI_TABLE_FORMATS else next(iter(tables.values()))
        outputs[node_id] = {None: first}
        return {"rowCount": sum(session.row_count(t) for t in tables.values())}

    if kind == "data-export":
        return run_export(session, node, inputs, outputs)

    if kind == "javascript":
        raise NodeError("JavaScript nodes run only in the browser: the engine won't run them until it has safeguards for them.")

    if kind in noderunner.KINDS:
        return run_app_kind(session, noderunner.KINDS[kind], node, inputs, outputs, base)

    raise NodeError(f"{kind} nodes can't run on the server yet.")


def run_app_kind(session: sql.Session, kind, node: dict, inputs: list[dict], outputs: dict, base: str | None = None) -> dict:
    """A node of one of the app's kinds, by the node worker: its inputs sent
    as Parquet, its file fields' files from the stored files, and what it
    made loaded back as its slots' tables (an empty table for any it left out)."""
    problems = kind.errors(node, pins=[i.get("pin") for i in inputs])
    if problems:
        raise NodeError(" ".join(problems))
    values = kind.with_defaults(node)
    sent = []
    for i in inputs:
        item = {k: i[k] for k in ("ref", "id", "slot", "pin")}
        if isinstance(i["output"], str):
            item["table"] = session.parquet(i["output"])
        else:
            item["tables"] = {name: session.parquet(t) for name, t in i["output"].items()}
        sent.append(item)
    files = {}
    for field in kind.fields:
        stored = values.get(field.key) if field.type == "file" else None
        if isinstance(stored, dict) and stored.get("key"):
            data = database.get_file(stored["key"])
            if data is None:
                raise NodeError(f"{field.label}: \"{stored.get('fileName')}\" isn't stored on the server.")
            files[stored["key"]] = data

    result = noderunner.run(kind, values, sent, files)
    if result.get("error"):
        raise NodeError(result["error"], result.get("output", ""))
    base = base or node["id"]
    made: dict[str | None, str | dict[str, str]] = {}
    for output in result["outputs"]:
        slot = output["slot"]
        slot_base = base if slot is None else f"{base}#{slot}"
        if "tables" in output:
            made[slot] = {}
            for name, data in output["tables"].items():
                target = session.output_table(slot_base, name)
                session.load(target, sql.from_parquet(data))
                made[slot][name] = target
        else:
            target = session.output_table(slot_base)
            session.load(target, sql.from_parquet(output["table"]))
            made[slot] = target
    for slot in [None, *kind.slot_names(node)]:
        if slot not in made:
            target = session.output_table(base if slot is None else f"{base}#{slot}")
            session.con.execute(f"CREATE TABLE {target} AS SELECT NULL::VARCHAR AS value WHERE false")
            made[slot] = target
    outputs[node["id"]] = made
    first = made[None]
    rows = session.row_count(first) if isinstance(first, str) else sum(session.row_count(t) for t in first.values())
    return {"rowCount": rows, "output": result.get("output", ""), **({"value": result["value"]} if "value" in result else {})}


def run_python(session: sql.Session, node: dict, inputs: list[dict], outputs: dict, base: str | None = None) -> dict:
    code = node.get("pythonCode") or ""
    if not code.strip():
        raise NodeError("Write some code first.")
    payload: dict[str, bytes] = {}
    for i in inputs:
        output = i["output"]
        if isinstance(output, str):
            payload[i["ref"]] = session.parquet(output)
        else:
            for table_name, table in output.items():
                payload[f"{i['ref']}.{table_name}"] = session.parquet(table)

    result = runner.run(code, payload)
    if result.get("error"):
        raise NodeError(result["error"], result.get("output", ""))
    target = session.output_table(base or node["id"])
    if "table" in result:
        session.load(target, sql.from_parquet(result["table"]))
    else:
        session.con.execute(f"CREATE TABLE {target} AS SELECT NULL::VARCHAR AS value WHERE false")
    outputs[node["id"]] = {None: target}
    return {
        "rowCount": session.row_count(target),
        "output": result.get("output", ""),
        "value": result.get("value"),
        "variables": result.get("variables", []),
    }


def format_from_name(name: str) -> str | None:
    match = re.search(r"\.([^./\\]+)$", name)
    return EXTENSIONS.get(match.group(1).lower()) if match else None


def run_export(session: sql.Session, node: dict, inputs: list[dict], outputs: dict) -> dict:
    source, table = pick_export_input(node, inputs)
    typed = (node.get("exportFilename") or "").strip() or "export"
    fmt = node.get("exportFormat") or format_from_name(typed) or "csv"
    if fmt not in WRITERS:
        raise NodeError(f"{fmt} files can't be written on the server yet: CSV, TSV, JSON and Parquet can.")
    content_type, extension = WRITERS[fmt]
    filename = typed if format_from_name(typed) == fmt else f"{typed}.{extension}"
    data = session.parquet(table) if fmt == "parquet" else write(fmt, session.arrow(table, geometry_as_text=True))
    outputs[node["id"]] = {None: table}
    return {
        "rowCount": session.row_count(table),
        "export": {
            "filename": filename,
            "contentType": content_type,
            "size": len(data),
            "base64": base64.b64encode(data).decode("ascii"),
        },
    }


def pick_export_input(node: dict, inputs: list[dict]) -> tuple[dict, str]:
    """The input a DataExport node writes: its only one, or the one
    `exportInput` names (reference name or ID; <name>.<table> for one table
    of several)."""
    if not inputs:
        raise NodeError("Wire a node into this one to export its data.")
    names = [i["ref"] for i in inputs]
    choice = (node.get("exportInput") or "").strip()
    if not choice:
        if len(inputs) > 1:
            raise NodeError(f"{len(inputs)} inputs are wired in ({', '.join(names)}). Name the one to write under Input.")
        source, table_name = inputs[0], None
    else:
        def by_name(name: str) -> dict | None:
            return next((i for i in inputs if i["ref"] == name or i["id"] == name), None)

        source, table_name = by_name(choice), None
        if source is None and "." in choice:
            ref, _, table_name = choice.rpartition(".")
            source = by_name(ref)
        if source is None:
            raise NodeError(f"No input called \"{choice}\" is wired in. Wired in: {', '.join(names)}.")

    output = source["output"]
    if isinstance(output, str):
        if table_name:
            raise NodeError(f"{source['id']} has no table called \"{table_name}\": it has one table.")
        return source, output
    if table_name:
        if table_name not in output:
            raise NodeError(f"{source['id']} has no table called \"{table_name}\": its tables are {', '.join(output)}.")
        return source, output[table_name]
    raise NodeError(f"{source['id']} has {len(output)} tables: name one under Input (like {source['ref']}.{next(iter(output))}).")


def write(fmt: str, table: pa.Table) -> bytes:
    """CSV, TSV or JSON (Parquet is the session's own: Session.parquet)."""
    sink = io.BytesIO()
    if fmt == "csv":
        pacsv.write_csv(table, sink)
    elif fmt == "tsv":
        pacsv.write_csv(table, sink, pacsv.WriteOptions(delimiter="\t"))
    else:
        sink.write(json.dumps(table.to_pylist(), default=str).encode())
    return sink.getvalue()
