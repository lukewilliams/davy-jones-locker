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


def select_kind(options, default=None):
    field = nodes.Field("language", "Language", "select", default=default, options={"options": options})
    return nodes.NodeKind(kind="app.query", label="Query", category="fetch", handler="handlers:query", fields=[field])


def test_plain_select_options_reach_the_browser_as_value_and_label():
    kind = select_kind(["flux", "sql", 3], default="sql")
    nodes.check([kind], [])
    assert kind.to_json()["fields"][0]["options"] == [
        {"value": "flux", "label": "flux"}, {"value": "sql", "label": "sql"}, {"value": 3, "label": "3"},
    ]


def test_value_and_label_select_options_pass_through():
    options = [{"value": "flux", "label": "Flux"}, {"value": "sql", "label": "SQL"}]
    kind = select_kind(options, default="flux")
    nodes.check([kind], [])
    assert kind.to_json()["fields"][0]["options"] == options


@pytest.mark.parametrize("options, default, message", [
    (None, None, "needs options"),
    ([], None, "needs options"),
    ([{"value": "flux"}], None, "isn't"),
    ([{"label": "Flux"}], None, "isn't"),
    ([True], None, "isn't"),
    ([["flux"]], None, "isn't"),
    (["flux", {"value": "flux", "label": "Flux"}], None, "an option twice"),
    (["flux", "sql"], "influxql", "isn't one of its options"),
])
def test_select_options_the_browser_couldnt_draw_are_refused(options, default, message):
    with pytest.raises(nodes.DefinitionError, match=message):
        nodes.check([select_kind(options, default)], [])
def test_a_built_in_category_can_be_relabelled_and_recoloured():
    relabel = nodes.NodeCategory("fetch", "Query")
    recolour = nodes.NodeCategory("modify", "Script", colors={"from": "#a8de5a", "to": "#4caf3e"})
    nodes.check([SUMMARY], [relabel, recolour])
    assert relabel.to_json() == {"id": "fetch", "label": "Query"}
    assert recolour.to_json()["colors"] == {"from": "#a8de5a", "to": "#4caf3e"}


@pytest.mark.parametrize("categories, problem", [
    ([nodes.NodeCategory("fetch", "Query"), nodes.NodeCategory("fetch", "Ask")], "relabelled twice"),
    ([nodes.NodeCategory("fetch", "")], "needs a label"),
    ([nodes.NodeCategory("fetch", "Query", colors={"from": "blue"})], "#hex colour"),
    ([nodes.NodeCategory("geo", "Geo")], "#hex colour"),
])
def test_a_relabel_or_a_new_category_that_cant_be_used_is_refused(categories, problem):
    with pytest.raises(nodes.DefinitionError, match=problem):
        nodes.check([], categories)
