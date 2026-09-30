"""The app's own node kinds (nodes.py), as the engine knows them: what
create_app was given, what GET /nodes tells the browser, and how a node of
one is run, by the node worker (nodeworker/), which the engine reaches at
NODE_WORKER_URL. The engine never imports a handler.

The worker's answer is form data: `result` (JSON: output, value?, error?,
outputs: [{ slot, part } or { slot, tables: [{ name, part }] }]) and a
`table` part (Parquet) per table, its filename the part named.
"""

import json

import httpx

from . import formdata, nodes, settings

KINDS: dict[str, nodes.NodeKind] = {}
CATEGORIES: list[nodes.NodeCategory] = []
PARQUET = "application/vnd.apache.parquet"


class WorkerUnavailable(RuntimeError):
    pass


def register(kinds: list[nodes.NodeKind], categories: list[nodes.NodeCategory]) -> None:
    """The app's kinds and categories (create_app's `nodes` and `categories`)."""
    nodes.check(kinds, categories)
    KINDS.clear()
    KINDS.update({kind.kind: kind for kind in kinds})
    CATEGORIES[:] = categories


def describe() -> dict:
    """GET /nodes: everything the browser needs to define them."""
    return {"categories": [c.to_json() for c in CATEGORIES], "kinds": [k.to_json() for k in KINDS.values()]}


def unavailable(kind: nodes.NodeKind) -> str:
    return f"{kind.label} nodes run on the engine's node worker, which isn't set up (NODE_WORKER_URL)."


def _timeout(kind: nodes.NodeKind) -> httpx.Timeout:
    return httpx.Timeout(kind.timeout_s + 30, connect=5)


async def forward(kind: nodes.NodeKind, body: bytes, content_type: str) -> tuple[bytes, str, int]:
    """POST /run/node as the browser sent it; the worker's answer as it is."""
    if not settings.NODE_WORKER_URL:
        raise WorkerUnavailable(unavailable(kind))
    try:
        async with httpx.AsyncClient(timeout=_timeout(kind)) as client:
            response = await client.post(f"{settings.NODE_WORKER_URL}/run", content=body, headers={"content-type": content_type})
    except httpx.HTTPError as e:
        raise WorkerUnavailable(f"The engine's node worker isn't available, so {kind.label} nodes can't run.") from e
    return response.content, response.headers.get("content-type", "application/json"), response.status_code


def run(kind: nodes.NodeKind, node: dict, inputs: list[dict], files: dict[str, bytes]) -> dict:
    """For graph runs on the server. `inputs` are [{ ref, id, slot, pin,
    table: Parquet } or { ..., tables: { name: Parquet } }]. Returns the
    worker's result, its outputs as [{ slot, table: Parquet } or { slot,
    tables: { name: Parquet } }]."""
    if not settings.NODE_WORKER_URL:
        raise WorkerUnavailable(unavailable(kind))
    specs, parts = [], []
    for i, item in enumerate(inputs):
        spec = {k: item.get(k) for k in ("ref", "id", "slot", "pin")}
        if "tables" in item:
            spec["tables"] = []
            for j, (name, data) in enumerate(item["tables"].items()):
                part = f"i{i}-{j}"
                spec["tables"].append({"name": name, "part": part})
                parts.append(("input", data, PARQUET, part))
        else:
            spec["part"] = f"i{i}"
            parts.append(("input", item["table"], PARQUET, spec["part"]))
        specs.append(spec)
    fields = [
        ("kind", kind.kind.encode(), "text/plain", None),
        ("node", json.dumps(node).encode(), "application/json", None),
        ("inputs", json.dumps(specs).encode(), "application/json", None),
    ]
    files_parts = [("file", data, "application/octet-stream", key) for key, data in files.items()]
    body, content_type = formdata.encode(fields + parts + files_parts)
    try:
        response = httpx.post(f"{settings.NODE_WORKER_URL}/run", content=body, headers={"content-type": content_type},
                              timeout=_timeout(kind))
    except httpx.HTTPError as e:
        raise WorkerUnavailable(f"The engine's node worker isn't available, so {kind.label} nodes can't run.") from e
    if response.status_code != 200:
        try:
            return {"error": response.json().get("error", response.text)}
        except ValueError:
            return {"error": response.text}
    decoded = formdata.decode(response.content, response.headers["content-type"])
    result = json.loads(next(data for name, data, _, _ in decoded if name == "result"))
    tables = {filename: data for name, data, _, filename in decoded if name == "table" and filename}
    result["outputs"] = [
        {"slot": o["slot"], "tables": {t["name"]: tables[t["part"]] for t in o["tables"]}} if "tables" in o
        else {"slot": o["slot"], "table": tables[o["part"]]}
        for o in result.get("outputs", [])
    ]
    return result
