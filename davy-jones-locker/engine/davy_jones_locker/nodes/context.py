"""What a handler is given, and what's made of what it returns: shared by the
node worker (nodeworker/child.py) and by tests (testing.py), so a handler
meets the same context in both. pyarrow is imported only when a table is.
"""

import contextlib
import sys

from . import NodeError


class NotProvided(NodeError, KeyError):
    """An input or a file the handler asked for that the node wasn't given.
    A NodeError, so its message is the node's error, and a KeyError, as
    ctx.input() and ctx.file() raised before NodeError existed."""

    def __str__(self) -> str:
        # A KeyError's str() quotes its message.
        return str(self.args[0]) if self.args else ""


class Input:
    """One thing wired in: one slot of one node, through one pin.

    ref     the reference name it's read by (dataingest1_data, classify1_summary)
    id      the node it comes from
    slot    None for that node's first slot, else the slot's name
    pin     None for the main input pin, else the named pin it came through
    table   a pyarrow Table; None when it has several, in
    tables  {name: pyarrow Table} (a workbook's sheets)
    """

    def __init__(self, ref: str, table=None, tables: dict | None = None, id: str | None = None,
                 slot: str | None = None, pin: str | None = None):
        self.ref, self.id, self.slot, self.pin = ref, id, slot, pin
        self.table = table
        self.tables = tables

    def __repr__(self) -> str:
        return f"Input({self.ref!r})"


class Context:
    """A handler's view of its run (see the package's docstring).

    node     the node's data, with its fields' defaults
    inputs   [Input], one per slot each wire carries
    files    {stored key: bytes, or a function returning them}: the file
             fields' files
    log      log(*parts): a line for the Terminal
    labels   {field key: label}, so messages name fields as Manage does
    """

    def __init__(self, node: dict, inputs: list[Input], files: dict, log, labels: dict | None = None):
        self.node = node
        self.inputs = list(inputs)
        self._files = files
        self.log = log
        self._labels = labels or {}

    def input(self, ref: str) -> Input:
        """The input read by reference name `ref`."""
        for item in self.inputs:
            if item.ref == ref:
                return item
        wired = ", ".join(i.ref for i in self.inputs) or "nothing"
        raise NotProvided(f"No input called {ref} is wired in. Wired in: {wired}.")

    def file(self, key: str) -> bytes:
        """A file field's file, by its stored key (the field holds
        { fileName, fileSize, key })."""
        if key not in self._files:
            raise NotProvided("That file wasn't sent with the node. Choose it again.")
        found = self._files[key]
        return found() if callable(found) else found

    def file_field(self, key: str) -> tuple[str, bytes]:
        """The file chosen in file field `key`: (its name as the user chose it,
        its bytes). The name's extension is often what says the format."""
        label = self._labels.get(key, key)
        stored = self.node.get(key)
        if not isinstance(stored, dict) or not stored.get("key"):
            raise NotProvided(f"{label}: choose a file.")
        if stored["key"] not in self._files:
            raise NotProvided(f"{label}: \"{stored.get('fileName') or 'the file'}\" wasn't sent with the node. Choose it again.")
        return stored.get("fileName") or "", self.file(stored["key"])


@contextlib.contextmanager
def printing_to(log):
    """print() inside the block goes to `log`, a line at a time, as it does in
    the node worker."""

    class Printed:
        def write(self, text: str) -> int:
            if text.strip():
                log(text.rstrip("\n"))
            return len(text)

        def flush(self) -> None:
            pass

    stdout = sys.stdout
    sys.stdout = Printed()
    try:
        yield
    finally:
        sys.stdout = stdout


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


def outputs(made) -> list[tuple[str | None, object]]:
    """What a handler returned, as [(slot, Table or {name: Table})]: its first
    slot (None) first, then the others. Raises TypeError for a return the
    worker can't use. A "value" is the caller's to take (and must be JSON)."""
    made = made or {}
    if not isinstance(made, dict):
        raise TypeError("A handler returns a dict: table, tables, value, slots.")

    def tables(value):
        if isinstance(value, dict):
            return {name: as_table(t) for name, t in value.items()}
        return as_table(value)

    found = []
    if made.get("tables") is not None:
        found.append((None, tables(dict(made["tables"]))))
    elif made.get("table") is not None:
        found.append((None, tables(made["table"])))
    for slot, value in (made.get("slots") or {}).items():
        found.append((slot, tables(value)))
    return found
