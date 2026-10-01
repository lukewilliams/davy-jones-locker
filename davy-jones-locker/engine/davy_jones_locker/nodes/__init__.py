"""Node kinds an app defines for the engine: what they're called, what Manage
shows for them, and the function that runs them. The browser's own (SQLQuery,
PythonScript...) are SEAMONSTER's; these are the app's, run on the server.

    # the app's nodes.py: definitions only, so the engine and the node worker
    # can both import it without the handlers' libraries
    from davy_jones_locker.nodes import Field, NodeCategory, NodeKind, Rule

    CATEGORIES = [NodeCategory("geo", "Geo", colors={"from": "#7dd3a8", "to": "#2f855a"})]
    KINDS = [
        NodeKind(
            "geo.buffer", "Buffer", "geo", handler="app_geo.buffer:run",
            fields=[Field("distance", "Distance (m)", "number", default=100,
                          validate=[Rule(min=0, message="A distance can't be negative.")])],
        ),
    ]

    # the app's main.py
    from davy_jones_locker import create_app
    import nodes
    app = create_app(title="engine-geo", nodes=nodes.KINDS, categories=nodes.CATEGORIES)

The engine never imports a handler, and never runs one: it names it
("module:function") and the node worker (nodeworker/), started with
NODE_KINDS=nodes:KINDS, imports and runs it, each run in a process of its own.
The worker holds no credentials and has no network out, so a handler
parsing what a user uploaded can't reach anything if that goes wrong.

The browser learns these from GET /nodes and defines them itself, so a kind
here needs no JavaScript. Everything about a kind is plain data for that
reason: fields' hints are text, rules are declarative (no functions), and
select options are a fixed list.

A handler is given a context (nodes/context.py) and returns what it made
(see nodeworker/child.py):

    def run(ctx):
        ctx.node              # the node's data, with its fields' defaults
        ctx.inputs            # what's wired in: [Input(ref, id, slot, pin, table | tables)]
        ctx.input(ref)        # one of them by reference name
        ctx.file_field(key)   # a file field's file: (its name, its bytes)
        ctx.file(stored_key)  # the bytes of a file field's file, by its stored key
        ctx.log(text)         # a line for the Terminal
        return {"table": pyarrow_table}   # or "tables": {name: table}, "value": JSON,
                                          # "slots": {slot: table or {name: table}}

A problem the node's user can fix (a setting, a file, a wire) is a
NodeError: its message alone is the node's error. Any other exception is
shown with its traceback, as a bug. nodes/testing.py runs handlers in tests.
"""

import re
from dataclasses import dataclass, field

KIND_NAME = re.compile(r"^[a-z0-9][a-z0-9-]*(\.[a-z0-9][a-z0-9-]*)?$")
IDENTIFIER = re.compile(r"^[A-Za-z_][A-Za-z0-9_]*$")
PIN_NAME = re.compile(r"^[a-z_][a-z0-9_]*$")
HEX_COLOUR = re.compile(r"^#[0-9a-fA-F]{3}([0-9a-fA-F]{3})?$")
HANDLER = re.compile(r"^[A-Za-z_][\w.]*:[A-Za-z_]\w*$")

# Field types the browser can draw from plain data (SEAMONSTER's `custom`
# needs a component, so only a browser-defined kind has it).
FIELD_TYPES = {"text", "number", "select", "checkbox", "code", "file", "readonly"}
BUILT_IN_CATEGORIES = {"fetch", "modify", "debug", "import", "export", "custom"}


class DefinitionError(ValueError):
    """A node kind or category that can't be used, and why."""


class NodeError(ValueError):
    """A problem with what the node was given, which its user can fix: a
    handler raises it with a message for them ("No layer called roads: the
    file has rivers, lakes."), and that message alone is the node's error,
    without a traceback. Subclass it for a handler's own kinds of error."""


@dataclass(frozen=True)
class Rule:
    """A check on a field's value: exactly one test, and what's wrong when it
    fails. severity 'error' stops the node running; 'warn' only warns."""

    message: str
    required: bool | None = None
    min: float | None = None
    max: float | None = None
    pattern: str | None = None
    severity: str = "error"

    def tests(self) -> list[str]:
        return [name for name in ("required", "min", "max", "pattern") if getattr(self, name) is not None]

    def to_json(self) -> dict:
        out = {"message": self.message, "severity": self.severity}
        out.update({name: getattr(self, name) for name in self.tests()})
        return out

    def broken(self, value) -> bool:
        if self.required:
            return value is None or value == ""
        if self.min is not None:
            return isinstance(value, (int, float)) and not isinstance(value, bool) and value < self.min
        if self.max is not None:
            return isinstance(value, (int, float)) and not isinstance(value, bool) and value > self.max
        if self.pattern is not None:
            return isinstance(value, str) and value != "" and not re.search(self.pattern, value)
        return False


@dataclass(frozen=True)
class Field:
    """A field Manage shows for the kind, kept on the node's data under `key`.
    `options` holds the type's own (placeholder, mono, min, max, step,
    options, language, rows, accept, value for readonly...), as SEAMONSTER
    names them."""

    key: str
    label: str
    type: str
    default: object = None
    hint: str | None = None
    affects_output: bool = True
    validate: list[Rule] = field(default_factory=list)
    options: dict = field(default_factory=dict)

    def to_json(self) -> dict:
        out = {"key": self.key, "label": self.label, "type": self.type, **self.options}
        if self.default is not None:
            out["default"] = self.default
        if self.hint:
            out["hint"] = self.hint
        if not self.affects_output:
            out["affectsOutput"] = False
        if self.validate:
            out["validate"] = [rule.to_json() for rule in self.validate]
        return out


@dataclass(frozen=True)
class NodeCategory:
    """A category for the Library and menus, with its nodes' colours: `from`
    and `to` (the face's gradient) and optionally `label` (the name's)."""

    id: str
    label: str
    colors: dict

    def to_json(self) -> dict:
        return {"id": self.id, "label": self.label, "colors": dict(self.colors)}


@dataclass(frozen=True)
class NodeKind:
    """A node kind the engine runs (in the node worker). `handler` is
    "module:function", imported only by the worker. `slots` are its outputs
    beyond the first ([{"name", "label"?, "pin"?}]) and `input_pins` its
    named input pins ([{"name", "label"?, "many"?}]), as SEAMONSTER has them.
    `timeout_s` bounds a run; `network` asks for a way out, which the worker
    doesn't have yet (roadmap 10e)."""

    kind: str
    label: str
    category: str
    handler: str
    id_prefix: str | None = None
    fields: list[Field] = field(default_factory=list)
    slots: list[dict] = field(default_factory=list)
    input_pins: list[dict] = field(default_factory=list)
    output_name: bool = True
    run_hint: str | None = None
    timeout_s: int = 60
    network: bool = False

    def to_json(self) -> dict:
        """What GET /nodes says about it: everything the browser needs to
        define it, and nothing about how it runs."""
        out = {
            "kind": self.kind, "label": self.label, "category": self.category, "where": "server",
            "outputName": self.output_name, "fields": [f.to_json() for f in self.fields],
        }
        if self.id_prefix:
            out["idPrefix"] = self.id_prefix
        if self.slots:
            out["slots"] = [dict(s) for s in self.slots]
        if self.input_pins:
            out["inputPins"] = [dict(p) for p in self.input_pins]
        if self.run_hint:
            out["runHint"] = self.run_hint
        return out

    def with_defaults(self, data: dict) -> dict:
        """A node's data with its fields' defaults under it: what the handler sees."""
        defaults = {f.key: f.default for f in self.fields if f.default is not None}
        return {**defaults, **data}

    def errors(self, data: dict) -> list[str]:
        """What's wrong with a node's settings that stops it running."""
        values = self.with_defaults(data)
        return [
            f"{f.label}: {rule.message}"
            for f in self.fields for rule in f.validate
            if rule.severity == "error" and rule.broken(values.get(f.key))
        ]

    def slot_names(self, data: dict) -> list[str]:
        """Its slots beyond the first, leaving out one named like the first."""
        first = data.get("outputSuffix") or "data"
        return [s["name"] for s in self.slots if s["name"] != first]


def check(kinds: list[NodeKind], categories: list[NodeCategory]) -> None:
    """Raise DefinitionError for anything the engine or the browser couldn't use."""
    category_ids = set(BUILT_IN_CATEGORIES)
    for category in categories:
        if not re.match(r"^[a-z][a-z0-9-]*$", category.id) or category.id in category_ids:
            raise DefinitionError(f"Category {category.id!r} needs a new id of lowercase letters, digits and hyphens.")
        colours = [category.colors.get("from"), category.colors.get("to"), category.colors.get("label", "#fff")]
        if not all(isinstance(c, str) and HEX_COLOUR.match(c) for c in colours):
            raise DefinitionError(f"Category {category.id} needs colors from and to (and optionally label), each a #hex colour.")
        category_ids.add(category.id)
    names = set()
    for kind in kinds:
        where = f"Node kind {kind.kind!r}"
        if not KIND_NAME.match(kind.kind) or "." not in kind.kind:
            raise DefinitionError(f"{where} needs a namespaced name, like app.kind (lowercase letters, digits, hyphens).")
        if kind.kind in names:
            raise DefinitionError(f"{where} is defined twice.")
        names.add(kind.kind)
        if kind.category not in category_ids:
            raise DefinitionError(f"{where} is in category {kind.category!r}, which isn't defined.")
        if not HANDLER.match(kind.handler):
            raise DefinitionError(f"{where} needs a handler written module:function.")
        if kind.network:
            raise DefinitionError(f"{where} asks for network access, which the node worker doesn't give yet (roadmap 10e).")
        keys = set()
        for f in kind.fields:
            if f.type not in FIELD_TYPES:
                raise DefinitionError(f"{where} has field {f.key!r} of type {f.type!r}: use one of {', '.join(sorted(FIELD_TYPES))}.")
            if not IDENTIFIER.match(f.key) or f.key in keys:
                raise DefinitionError(f"{where} needs its fields' keys to be distinct identifiers ({f.key!r} isn't).")
            keys.add(f.key)
            for rule in f.validate:
                if len(rule.tests()) != 1 or rule.severity not in ("error", "warn"):
                    raise DefinitionError(f"{where}'s field {f.key} has a rule that needs exactly one test and severity error or warn.")
        for what, pins in (("slot", kind.slots), ("input pin", kind.input_pins)):
            seen = set()
            for pin in pins:
                name = pin.get("name", "")
                if not PIN_NAME.match(name) or name in seen or (what == "slot" and name == "data"):
                    raise DefinitionError(f"{where} has a {what} named {name!r}: use distinct lowercase names (not data).")
                seen.add(name)


def load(spec: str) -> list[NodeKind]:
    """The kinds a "module:attribute" names (the worker's NODE_KINDS)."""
    import importlib

    module, _, attribute = spec.partition(":")
    if not module or not attribute:
        raise DefinitionError(f"NODE_KINDS is {spec!r}: write it module:attribute, like nodes:KINDS.")
    return list(getattr(importlib.import_module(module), attribute))
