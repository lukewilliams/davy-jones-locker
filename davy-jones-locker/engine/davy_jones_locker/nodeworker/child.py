"""Runs one node, in its own process: server.py starts it as
`python -m davy_jones_locker.nodeworker.child <dir>`.

Reads <dir>/request.json:
  handler   "module:function", imported now (the app's code, trusted)
  node      the node's data, with its fields' defaults
  labels    { field key: label }, for messages
  inputs    [{ ref, id, slot, pin, file } or { ..., tables: { name: file } }],
            each file a Parquet file in <dir>
  files     { key: file }: file fields' stored files, in <dir>/files/

Calls handler(ctx) (see davy_jones_locker.nodes) and writes <dir>/result.json:
  output    what it logged and printed
  value     a JSON value it returned, if any
  outputs   [{ slot, file } or { slot, tables: [{ name, file }] }]: the tables it
            returned, slot None for its first, each as Parquet in <dir>
  error     what went wrong: a NodeError's message, or any other exception
            with its traceback
"""

import json
import sys
import traceback
from pathlib import Path

from davy_jones_locker.nodes import NodeError
from davy_jones_locker.nodes.context import Context, Input, outputs, printing_to

MAX_OUTPUT_CHARS = 200_000


def main(directory: Path) -> None:
    import importlib

    import pyarrow.parquet as pq

    request = json.loads((directory / "request.json").read_text(encoding="utf-8"))
    lines: list[str] = []
    total = [0]

    def log(*parts) -> None:
        text = " ".join(str(p) for p in parts)
        if total[0] < MAX_OUTPUT_CHARS:
            lines.append(text[: MAX_OUTPUT_CHARS - total[0]])
            total[0] += len(text)

    def read(spec: dict) -> Input:
        table = pq.read_table(directory / spec["file"]) if "file" in spec else None
        tables = {name: pq.read_table(directory / f) for name, f in spec["tables"].items()} if "tables" in spec else None
        return Input(spec["ref"], table, tables, id=spec.get("id"), slot=spec.get("slot"), pin=spec.get("pin"))

    counter = [0]

    def write(table) -> str:
        counter[0] += 1
        name = f"out{counter[0]}-t.parquet"
        pq.write_table(table, directory / name)
        return name

    result: dict = {}
    with printing_to(log):
        try:
            module, _, function = request["handler"].partition(":")
            handler = getattr(importlib.import_module(module), function)
            files = {key: (directory / "files" / name).read_bytes for key, name in request.get("files", {}).items()}
            ctx = Context(request["node"], [read(spec) for spec in request["inputs"]], files, log, request.get("labels"))
            made = handler(ctx) or {}
            result["outputs"] = [
                {"slot": slot, "tables": [{"name": n, "file": write(t)} for n, t in value.items()]}
                if isinstance(value, dict) else {"slot": slot, "file": write(value)}
                for slot, value in outputs(made)
            ]
            if "value" in made:
                json.dumps(made["value"])  # must be JSON
                result["value"] = made["value"]
        except NodeError as error:
            result = {"error": str(error)}
        except Exception:
            kind, error, tb = sys.exc_info()
            frames = traceback.extract_tb(tb)[1:]  # not main()'s own frame
            result = {"error": "".join(traceback.format_list(frames)) + "".join(traceback.format_exception_only(kind, error))}
    result["output"] = "\n".join(lines)
    (directory / "result.json").write_text(json.dumps(result), encoding="utf-8")


if __name__ == "__main__":
    main(Path(sys.argv[1]))
