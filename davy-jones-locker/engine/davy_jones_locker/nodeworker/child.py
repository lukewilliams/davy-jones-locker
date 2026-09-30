"""Runs one node, in its own process: server.py starts it as
`python -m davy_jones_locker.nodeworker.child <dir>`.

Reads <dir>/request.json:
  handler   "module:function", imported now (the app's code, trusted)
  node      the node's data, with its fields' defaults
  inputs    [{ ref, id, slot, pin, file } or { ..., tables: { name: file } }],
            each file a Parquet file in <dir>
  files     { key: file }: file fields' stored files, in <dir>/files/

Calls handler(ctx) (see davy_jones_locker.nodes) and writes <dir>/result.json:
  output    what it logged and printed
  value     a JSON value it returned, if any
  outputs   [{ slot, file } or { slot, tables: [{ name, file }] }]: the tables it
            returned, slot None for its first, each as Parquet in <dir>
  error     what went wrong, with the traceback, if it did
"""

import json
import sys
import traceback
from pathlib import Path

MAX_OUTPUT_CHARS = 200_000


class Input:
    """What's wired in, one per slot each wire carries."""

    def __init__(self, spec: dict, directory: Path):
        import pyarrow.parquet as pq

        self.ref = spec["ref"]
        self.id = spec.get("id")
        self.slot = spec.get("slot")
        self.pin = spec.get("pin")
        self.table = pq.read_table(directory / spec["file"]) if "file" in spec else None
        self.tables = {name: pq.read_table(directory / f) for name, f in spec["tables"].items()} if "tables" in spec else None

    def __repr__(self) -> str:
        return f"Input({self.ref!r})"


class Context:
    def __init__(self, request: dict, directory: Path, log):
        self.node = request["node"]
        self.inputs = [Input(spec, directory) for spec in request["inputs"]]
        self._files = {key: directory / "files" / name for key, name in request.get("files", {}).items()}
        self.log = log

    def input(self, ref: str) -> Input:
        for item in self.inputs:
            if item.ref == ref:
                return item
        raise KeyError(f"No input called {ref} is wired in. Wired in: {', '.join(i.ref for i in self.inputs) or 'nothing'}.")

    def file(self, key: str) -> bytes:
        """A file field's file, by its stored key (the field holds { fileName, fileSize, key })."""
        if key not in self._files:
            raise KeyError("That file wasn't sent with the node. Choose it again.")
        return self._files[key].read_bytes()


def as_table(value):
    """A handler's table: a pyarrow Table, a pandas DataFrame or rows (a list of dicts)."""
    import pyarrow as pa

    if isinstance(value, pa.Table):
        return value
    if isinstance(value, list):
        return pa.Table.from_pylist(value)
    if type(value).__name__ == "DataFrame" and hasattr(value, "to_parquet"):
        return pa.Table.from_pandas(value, preserve_index=False)
    raise TypeError(f"Expected a table (pyarrow Table, pandas DataFrame or a list of rows), not {type(value).__name__}.")


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

    class Printed:
        def write(self, text: str) -> int:
            if text.strip():
                log(text.rstrip("\n"))
            return len(text)

        def flush(self) -> None:
            pass

    result: dict = {}
    counter = [0]

    def write(table, stem: str) -> str:
        counter[0] += 1
        name = f"out{counter[0]}-{stem}.parquet"
        pq.write_table(as_table(table), directory / name)
        return name

    def written(slot, value) -> dict:
        if isinstance(value, dict):
            return {"slot": slot, "tables": [{"name": n, "file": write(t, "t")} for n, t in value.items()]}
        return {"slot": slot, "file": write(value, "t")}

    stdout = sys.stdout
    sys.stdout = Printed()
    try:
        module, _, function = request["handler"].partition(":")
        handler = getattr(importlib.import_module(module), function)
        made = handler(Context(request, directory, log)) or {}
        if not isinstance(made, dict):
            raise TypeError("A handler returns a dict: table, tables, value, slots.")
        outputs = []
        if made.get("tables") is not None:
            outputs.append(written(None, dict(made["tables"])))
        elif made.get("table") is not None:
            outputs.append(written(None, made["table"]))
        for slot, value in (made.get("slots") or {}).items():
            outputs.append(written(slot, value))
        result["outputs"] = outputs
        if "value" in made:
            json.dumps(made["value"])  # must be JSON
            result["value"] = made["value"]
    except Exception:
        kind, error, tb = sys.exc_info()
        frames = traceback.extract_tb(tb)[1:]  # not main()'s own frame
        result = {"error": "".join(traceback.format_list(frames)) + "".join(traceback.format_exception_only(kind, error))}
    finally:
        sys.stdout = stdout
    result["output"] = "\n".join(lines)
    (directory / "result.json").write_text(json.dumps(result), encoding="utf-8")


if __name__ == "__main__":
    main(Path(sys.argv[1]))
