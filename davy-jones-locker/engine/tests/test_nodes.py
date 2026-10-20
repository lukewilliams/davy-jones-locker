"""An app's node kinds explaining themselves: a description, hints on input
pins, and required input pins checked before a run."""

import pyarrow as pa
import pytest

from davy_jones_locker import nodes
from davy_jones_locker.nodes.context import Input
from davy_jones_locker.nodes.testing import Context

SUMMARY = nodes.NodeKind(
    kind="app.summary", label="Summary", category="import", handler="handlers:summary",
    description="Summarises a raster: the whole of it, or around a site when one is wired in.",
    input_pins=[
        {"name": "site", "label": "Site", "hint": "the boundary to summarise around; optional"},
        {"name": "raster", "label": "Raster", "hint": "a raster's cells", "required": True},
    ],
)


def test_the_browser_is_told_the_description_and_pins():
    described = SUMMARY.to_json()
    assert described["description"].startswith("Summarises a raster")
    assert described["inputPins"][1] == {"name": "raster", "label": "Raster", "hint": "a raster's cells", "required": True}
    nodes.check([SUMMARY], [])


def test_a_required_pin_with_nothing_wired_in_stops_the_run():
    assert SUMMARY.errors({}) == []  # pins not known: settings only
    assert SUMMARY.errors({}, pins=[None, "site"]) == ["Raster: wire a node into this input first."]
    assert SUMMARY.errors({}, pins=["raster"]) == []


def test_the_test_context_checks_required_pins_too():
    table = pa.table({"x": [1]})
    with pytest.raises(nodes.NodeError, match="Raster: wire a node"):
        Context({}, inputs=[Input("site1_data", table, pin="site")], kind=SUMMARY)
    Context({}, inputs=[Input("raster1_data", table, pin="raster")], kind=SUMMARY)


@pytest.mark.parametrize("pin", [{"name": "site", "hint": 3}, {"name": "site", "required": "yes"}])
def test_pin_hints_are_text_and_required_true_or_false(pin):
    kind = nodes.NodeKind(kind="app.bad", label="Bad", category="import", handler="handlers:bad", input_pins=[pin])
    with pytest.raises(nodes.DefinitionError, match="input pin site"):
        nodes.check([kind], [])
