"""Runs one PythonScript node's code, in its own process: server.py starts it
(with its limits) as `python -I worker.py <dir>`.

Reads <dir>/script.py and <dir>/inputs.json ({ reference name: Parquet file,
or { table name: file } for an input with several tables }). Each input is a
pandas DataFrame named by its reference name (several tables: an object with a
DataFrame per table, `dataingest1_data.sheet1`). print() goes to
<dir>/output.txt as it happens; sleep(seconds) waits (at most 30 at a time).

Writes <dir>/result.json:
  output     what it printed
  value      the last expression's value, when the script ends with one:
             { kind: 'table', rows } (written to <dir>/value.parquet),
             { kind: 'json', type, value }, { kind: 'text', type, text }, or
             { kind: 'none' }
  variables  its top-level variables: [{ name, type, summary }]
  error      what went wrong, if it did (a traceback of the script's lines)
"""

import ast
import contextlib
import datetime
import decimal
import json
import linecache
import math
import os
import sys
import time
import traceback
import types
from pathlib import Path

SCRIPT = "<script>"
MAX_OUTPUT_CHARS = int(os.environ.get("RUN_MAX_OUTPUT_CHARS") or 200_000)
MAX_JSON_CHARS = 1_000_000


class CappedWriter:
    """print()'s target: a file, cut off at MAX_OUTPUT_CHARS."""

    def __init__(self, path: Path):
        self.file = open(path, "w", encoding="utf-8", buffering=1)
        self.left = MAX_OUTPUT_CHARS

    def write(self, text: str) -> int:
        if self.left > 0:
            chunk = text[: self.left]
            self.file.write(chunk)
            self.left -= len(chunk)
            if self.left <= 0:
                self.file.write("\n… (output cut off)\n")
        return len(text)

    def flush(self) -> None:
        self.file.flush()


def sleep(seconds) -> None:
    time.sleep(max(0.0, min(float(seconds), 30.0)))


def main(workdir: Path) -> None:
    code = (workdir / "script.py").read_bytes().decode("utf-8")  # server.py wrote it with \n line breaks
    spec = json.loads((workdir / "inputs.json").read_text(encoding="utf-8"))
    linecache.cache[SCRIPT] = (len(code), None, code.splitlines(True), SCRIPT)
    output = CappedWriter(workdir / "output.txt")
    result: dict = {}
    try:
        import pandas as pd

        namespace = {"__name__": "__flow__", "sleep": sleep}
        for name, source in spec.items():
            if isinstance(source, str):
                namespace[name] = pd.read_parquet(workdir / source)
            else:
                namespace[name] = types.SimpleNamespace(
                    **{table: pd.read_parquet(workdir / file) for table, file in source.items()}
                )
        given = set(namespace)

        tree = ast.parse(code, SCRIPT)
        last = tree.body.pop() if tree.body and isinstance(tree.body[-1], ast.Expr) else None
        with contextlib.redirect_stdout(output), contextlib.redirect_stderr(output):
            exec(compile(tree, SCRIPT, "exec"), namespace)
            value = eval(compile(ast.Expression(last.value), SCRIPT, "eval"), namespace) if last else None
        result["value"] = describe(value, workdir)
        result["variables"] = variables(namespace, given)
    except BaseException as e:  # SystemExit and KeyboardInterrupt too: report, don't vanish
        result["error"] = script_traceback(e)
    output.flush()
    result["output"] = (workdir / "output.txt").read_text(encoding="utf-8", errors="replace")
    (workdir / "result.json").write_text(json.dumps(result), encoding="utf-8")


def script_traceback(e: BaseException) -> str:
    """The error, with only the script's own lines in its traceback."""
    if isinstance(e, SyntaxError) and e.filename == SCRIPT:
        return "".join(traceback.format_exception_only(type(e), e)).strip()
    frames = [f for f in traceback.extract_tb(e.__traceback__) if f.filename == SCRIPT]
    lines = traceback.format_list(frames)
    head = "Traceback (most recent call last):\n" if lines else ""
    return (head + "".join(lines) + "".join(traceback.format_exception_only(type(e), e))).strip()


def describe(value, workdir: Path) -> dict:
    """The last expression's value, as the browser shows it."""
    import pandas as pd
    import pyarrow as pa
    import pyarrow.parquet as pq

    if value is None:
        return {"kind": "none"}
    if isinstance(value, pd.Series):
        value = value.to_frame()
    if isinstance(value, pd.DataFrame):
        frame = value if isinstance(value.index, pd.RangeIndex) else value.reset_index()
        frame.columns = [str(c) for c in frame.columns]
        frame.to_parquet(workdir / "value.parquet", index=False)
        return {"kind": "table", "rows": len(frame)}
    if isinstance(value, pa.Table):
        pq.write_table(value, workdir / "value.parquet")
        return {"kind": "table", "rows": value.num_rows}
    try:
        plain = to_json(value)
        text = json.dumps(plain)
        if len(text) <= MAX_JSON_CHARS:
            return {"kind": "json", "type": type(value).__name__, "value": plain}
    except (TypeError, ValueError, RecursionError):
        pass
    return {"kind": "text", "type": type(value).__name__, "text": repr(value)[:MAX_JSON_CHARS]}


def to_json(value):
    """Plain JSON values, or TypeError."""
    if value is None or isinstance(value, (bool, int, str)):
        return value
    if isinstance(value, float):
        return value if math.isfinite(value) else None
    if isinstance(value, decimal.Decimal):
        return str(value)
    if isinstance(value, (datetime.date, datetime.datetime, datetime.time)):
        return value.isoformat()
    if isinstance(value, dict):
        return {str(k): to_json(v) for k, v in value.items()}
    if isinstance(value, (list, tuple, set, frozenset)):
        return [to_json(v) for v in value]
    if hasattr(value, "tolist"):  # numpy arrays and scalars
        return to_json(value.tolist())
    raise TypeError(type(value).__name__)


def variables(namespace: dict, given: set) -> list[dict]:
    """The script's own top-level values (not inputs, modules, functions or classes)."""
    out = []
    for name, value in namespace.items():
        if name.startswith("_") or name in given or name == "__builtins__":
            continue
        if isinstance(value, (types.ModuleType, types.FunctionType, types.BuiltinFunctionType, type)):
            continue
        out.append({"name": name, "type": type(value).__name__, "summary": summary(value)})
    return out


def summary(value) -> str:
    shape = getattr(value, "shape", None)
    if isinstance(shape, tuple) and shape:  # numpy scalars have shape ()
        return " × ".join(str(n) for n in shape)
    if isinstance(value, (list, tuple, set, dict, str)):
        return f"{len(value)} {'characters' if isinstance(value, str) else 'items'}"
    return str(value)[:60]


if __name__ == "__main__":
    main(Path(sys.argv[1]))
