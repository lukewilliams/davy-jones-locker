"""Subnets in whole-graph runs (executor.py): run as they are, inline or
shared, results and tables by path, errors naming where they started."""

import base64
import json

from davy_jones_locker import executor


def sql(node_id: str, query: str, y: int = 0, **data) -> dict:
    return {"id": node_id, "kind": "sql-query", "sqlQuery": query, "position": {"x": 0, "y": y}, **data}


def wire(source: str, target: str, source_handle: str = "source-0", target_handle: str = "target-0") -> dict:
    return {
        "id": f"{source}.{source_handle}-{target}.{target_handle}",
        "source": source, "sourceHandle": source_handle, "target": target, "targetHandle": target_handle,
    }


def boundary(node_id: str, kind: str, y: int) -> dict:
    return {"id": node_id, "kind": f"subnet-{kind}", "position": {"x": 0, "y": y}}


# Times its site by ten (out first, `result`), and counts it (`count`).
SCALE = {
    "nodes": [
        boundary("site", "input", 0),
        sql("scale", "SELECT a * 10 AS b FROM site_data ORDER BY b", 0),
        sql("tally", "SELECT count(*) AS n FROM site_data", 100),
        boundary("result", "output", 0),
        boundary("count", "output", 100),
    ],
    "edges": [wire("site", "scale"), wire("site", "tally"), wire("scale", "result"), wire("tally", "count")],
}


def export(node_id: str, y: int = 0, **data) -> dict:
    return {"id": node_id, "kind": "data-export", "exportFormat": "json", "position": {"x": 0, "y": y}, **data}


def rows(result: dict) -> list:
    return json.loads(base64.b64decode(result["export"]["base64"]))


def graph(subnet: dict, *more_nodes, more_edges=(), subnets=None) -> dict:
    doc = {
        "format": "pipeline",
        "nodes": [sql("source", "SELECT * FROM (VALUES (1), (2), (3)) t(a)"), subnet, *more_nodes],
        "edges": [wire("source", subnet["id"], target_handle="target:site"), *more_edges],
    }
    if subnets:
        doc["subnets"] = subnets
    return doc


def test_a_subnet_runs_its_graph_and_its_outputs_are_slots():
    doc = graph(
        {"id": "subnet1", "kind": "subnet", "subnet": SCALE, "position": {"x": 0, "y": 0}},
        sql("after", "SELECT b, (SELECT n FROM subnet1_count) AS n FROM subnet1_result ORDER BY b"),
        export("out"),
        more_edges=[wire("subnet1", "after"), wire("after", "out")],
    )
    results = executor.execute(doc, ["out"])
    assert rows(results["out"]) == [{"b": 10, "n": 3}, {"b": 20, "n": 3}, {"b": 30, "n": 3}]
    # Inside, by path.
    assert results["subnet1/scale"]["status"] == "completed"
    assert results["subnet1/count"]["rowCount"] == 1
    assert results["subnet1"]["rowCount"] == 3


def test_a_slots_own_pin_carries_just_that_output():
    doc = graph(
        {"id": "subnet1", "kind": "subnet", "subnet": SCALE, "position": {"x": 0, "y": 0}},
        export("out"),
        more_edges=[wire("subnet1", "out", source_handle="source:count")],
    )
    assert rows(executor.execute(doc, ["out"])["out"]) == [{"n": 3}]


def test_a_shared_subnet_runs_for_each_use():
    doc = graph(
        {"id": "first", "kind": "subnet", "subnetRef": "scale", "position": {"x": 0, "y": 0}},
        {"id": "second", "kind": "subnet", "subnetRef": "scale", "position": {"x": 0, "y": 100}},
        sql("again", "SELECT * FROM (VALUES (5)) t(a)"),
        export("out"),
        more_edges=[
            wire("again", "second", target_handle="target:site"),
            wire("first", "out"), wire("second", "out"),
        ],
        subnets={"scale": SCALE},
    )
    doc["nodes"][-1]["exportInput"] = "second_result"
    results = executor.execute(doc, ["first", "out"])
    assert rows(results["out"]) == [{"b": 50}]
    assert results["first"]["rowCount"] == 3
    assert results["second/scale"]["rowCount"] == 1


def test_an_error_inside_names_the_node_it_started_at():
    broken = {**SCALE, "nodes": [*SCALE["nodes"][:1], sql("scale", "SELECT nothing FROM site_data", label="Classify"), *SCALE["nodes"][2:]]}
    doc = graph({"id": "subnet1", "kind": "subnet", "label": "Screening", "subnet": broken, "position": {"x": 0, "y": 0}})
    results = executor.execute(doc, ["subnet1"])
    assert results["subnet1"]["status"] == "failed"
    assert results["subnet1"]["error"].startswith("Screening › Classify: ")
    assert results["subnet1/result"]["error"] == "Upstream node scale failed."


def test_an_input_with_nothing_wired_in_says_so():
    doc = graph({"id": "subnet1", "kind": "subnet", "subnet": SCALE, "position": {"x": 0, "y": 0}})
    doc["edges"] = []
    results = executor.execute(doc, ["subnet1"])
    assert results["subnet1/site"]["error"] == "Nothing is wired into subnet1's site input."
    assert results["subnet1"]["error"] == "subnet1 › site: Nothing is wired into subnet1's site input."


def test_a_target_inside_a_subnet_runs_only_as_far_as_that():
    doc = graph({"id": "subnet1", "kind": "subnet", "subnet": SCALE, "position": {"x": 0, "y": 0}})
    results = executor.execute(doc, ["subnet1/tally"])
    assert results["subnet1/tally"]["rowCount"] == 1
    assert "subnet1" not in results
    assert "subnet1/scale" not in results


def test_a_subnet_containing_itself_stops():
    loop = {"nodes": [{"id": "inner", "kind": "subnet", "subnetRef": "loop", "position": {"x": 0, "y": 0}},
                      boundary("out", "output", 0)],
            "edges": [wire("inner", "out")]}
    doc = {"format": "pipeline", "nodes": [{"id": "outer", "kind": "subnet", "subnetRef": "loop", "position": {"x": 0, "y": 0}}],
           "edges": [], "subnets": {"loop": loop}}
    error = executor.execute(doc, ["outer"])["outer"]["error"]
    assert "nested more than 8 deep" in error


def test_a_missing_shared_subnet_says_so():
    doc = {"format": "pipeline", "nodes": [{"id": "s", "kind": "subnet", "subnetRef": "gone", "position": {"x": 0, "y": 0}}], "edges": []}
    assert '"gone"' in executor.execute(doc, ["s"])["s"]["error"]


def test_input_and_output_nodes_outside_a_subnet():
    doc = {"format": "pipeline", "nodes": [boundary("input1", "input", 0)], "edges": []}
    assert "only inside a subnet" in executor.execute(doc, ["input1"])["input1"]["error"]
