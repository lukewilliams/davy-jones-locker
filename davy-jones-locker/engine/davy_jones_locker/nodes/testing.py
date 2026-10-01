"""Running a node kind's handler in a test, as the node worker would but in
the test's own process: the same context (context.py), tables passed
through Parquet both ways, print() going to the log, and settings that
break an error rule refused. No worker, no limits, no timeout.

    import pyarrow as pa
    import pytest
    from davy_jones_locker.nodes import NodeError
    from davy_jones_locker.nodes.testing import Context, run

    import nodes                                   # the app's kind definitions
    from handlers import scale                     # the handler under test

    SCALE = next(k for k in nodes.KINDS if k.kind == "demo.scale")

    def test_scales_each_value():
        points = pa.table({"x": [1.0, 2.0]})
        ctx = Context({"factor": 3}, inputs={"points_data": points}, kind=SCALE)
        result = run(scale, ctx)
        assert result.table.column("x").to_pylist() == [3.0, 6.0]
        assert "scaled 2 rows" in result.output

    def test_reads_the_chosen_file():
        ctx = Context(files={"source": ("sites.csv", b"x,y\\n1,2\\n")})
        assert ctx.file_field("source") == ("sites.csv", b"x,y\\n1,2\\n")

    def test_refuses_a_negative_factor():
        with pytest.raises(NodeError, match="can't be negative"):
            Context({"factor": -1}, kind=SCALE)

Context(node, inputs, files, kind):

  node     the node's data, as Manage keeps it. With `kind`, its fields'
           defaults go under it, and a broken error rule raises NodeError
           with the message the worker would give
  inputs   {reference name: table}, a table being a pyarrow Table, a
           pandas DataFrame or rows (a list of dicts), or {name: table}
           for an input with several; or a list of Input, for an input's
           id, slot or pin
  files    {field key: (file name, bytes)}, which also fills in that file
           field on the node; or {stored key: bytes}, for a node whose file
           fields are filled in already
  kind     the NodeKind, for its defaults, rules and field labels

Its `logs` are the lines logged so far. run(handler, ctx) calls the handler
("module:function" or the function itself) and returns a Result: `table`,
`tables`, `slots` ({slot: table or {name: table}}), `value` and `output`
(the log, as one text). An exception from the handler is raised as it is,
for pytest.raises: in the worker a NodeError becomes the node's error
message, and anything else the same with its traceback.
"""

import importlib
import io
import json
from dataclasses import dataclass, field

from . import NodeError, NodeKind
from . import context


def _through_parquet(table):
    """`table` written to Parquet and read back, as the worker's are."""
    import pyarrow.parquet as pq

    sink = io.BytesIO()
    pq.write_table(context.as_table(table), sink)
    return pq.read_table(io.BytesIO(sink.getvalue()))


def _inputs(inputs) -> list[context.Input]:
    if isinstance(inputs, dict):
        made = []
        for ref, value in inputs.items():
            if isinstance(value, dict):
                made.append(context.Input(ref, tables={name: _through_parquet(t) for name, t in value.items()}))
            else:
                made.append(context.Input(ref, _through_parquet(value)))
        return made
    made = []
    for item in inputs:
        if not isinstance(item, context.Input):
            raise TypeError("inputs is {reference name: table} or a list of Input.")
        table = _through_parquet(item.table) if item.table is not None else None
        tables = {name: _through_parquet(t) for name, t in item.tables.items()} if item.tables is not None else None
        made.append(context.Input(item.ref, table, tables, id=item.id, slot=item.slot, pin=item.pin))
    return made


class Context(context.Context):
    """A handler's context for a test (see this module's docstring)."""

    def __init__(self, node: dict | None = None, inputs=(), files: dict | None = None, kind: NodeKind | None = None):
        node = dict(node or {})
        stored = {}
        for key, value in (files or {}).items():
            if isinstance(value, tuple):
                name, data = value
                node[key] = {"fileName": name, "fileSize": len(data), "key": key}
                stored[key] = data
            else:
                stored[key] = value
        labels = {}
        if kind is not None:
            problems = kind.errors(node)
            if problems:
                raise NodeError(" ".join(problems))
            node = kind.with_defaults(node)
            labels = {f.key: f.label for f in kind.fields}
        self.logs: list[str] = []
        super().__init__(node, _inputs(inputs), stored, self._log, labels)

    def _log(self, *parts) -> None:
        self.logs.append(" ".join(str(p) for p in parts))


@dataclass
class Result:
    """What a handler made, as the worker would send it on."""

    table: object = None
    tables: dict | None = None
    slots: dict = field(default_factory=dict)
    value: object = None
    output: str = ""


def run(handler, ctx: Context) -> Result:
    """Call `handler` ("module:function", or the function) with `ctx`."""
    if isinstance(handler, str):
        module, _, function = handler.partition(":")
        handler = getattr(importlib.import_module(module), function)
    with context.printing_to(ctx.log):
        made = handler(ctx) or {}
    result = Result()
    for slot, value in context.outputs(made):
        value = {n: _through_parquet(t) for n, t in value.items()} if isinstance(value, dict) else _through_parquet(value)
        if slot is not None:
            result.slots[slot] = value
        elif isinstance(value, dict):
            result.tables = value
        else:
            result.table = value
    if "value" in made:
        json.dumps(made["value"])  # must be JSON, as in the worker
        result.value = made["value"]
    result.output = "\n".join(ctx.logs)
    return result
