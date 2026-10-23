"""Loops (executor.run_loop) and jobs (jobs.py, /jobs): a graph run once per
row, its outputs gathered, how each run went, and runs longer than a request."""

import base64
import json
import time

import pytest
from fastapi.testclient import TestClient

from davy_jones_locker import executor, formdata, main, settings, sql


def sql_node(node_id: str, query: str, y: int = 0, **data) -> dict:
    return {"id": node_id, "kind": "sql-query", "sqlQuery": query, "position": {"x": 0, "y": y}, **data}


def wire(source: str, target: str, source_handle: str = "source-0", target_handle: str = "target-0") -> dict:
    return {
        "id": f"{source}.{source_handle}-{target}.{target_handle}",
        "source": source, "sourceHandle": source_handle, "target": target, "targetHandle": target_handle,
    }


def boundary(node_id: str, kind: str, y: int = 0) -> dict:
    return {"id": node_id, "kind": f"subnet-{kind}", "position": {"x": 0, "y": y}}


# Doubles each row's `a`, failing on multiples of 15 (3 of 50); counts what
# the broadcast input `scale` has, when there's one.
DOUBLE = {
    "nodes": [
        boundary("item", "input"),
        sql_node("double", "SELECT CASE WHEN a % 15 = 0 THEN error('bad row ' || a) ELSE a * 2 END AS b FROM item_data"),
        boundary("result", "output"),
    ],
    "edges": [wire("item", "double"), wire("double", "result")],
}


def loop(**data) -> dict:
    return {"id": "loop1", "kind": "loop", "subnet": DOUBLE, "position": {"x": 0, "y": 0}, **data}


def export(node_id: str, y: int = 0, **data) -> dict:
    return {"id": node_id, "kind": "data-export", "exportFormat": "json", "position": {"x": 0, "y": y}, **data}


def rows(result: dict) -> list:
    return json.loads(base64.b64decode(result["export"]["base64"]))


def graph(node: dict, count: int = 50, exported: str = "loop1_result") -> dict:
    nodes = [sql_node("items", f"SELECT i AS a, 'n' || i AS name FROM range(1, {count + 1}) t(i)"), node, export("out", exportInput=exported)]
    return {
        "format": "pipeline",
        "nodes": nodes,
        "edges": [wire("items", "loop1", target_handle="target:item"), wire("loop1", "out")],
    }


def test_a_loop_runs_once_per_row_and_gathers_what_completed():
    results = executor.execute(graph(loop(loopConcurrency=4)), ["out"])
    out = rows(results["out"])
    assert len(out) == 47
    assert out[0] == {"_key": "1", "_iteration": 1, "b": 2}
    assert [r["_iteration"] for r in out] == [i for i in range(1, 51) if i % 15]  # in the runs' order
    assert results["loop1"]["warnings"] == ["3 of 50 runs failed: loop1_status says which, and why."]


def test_status_says_how_each_run_went():
    results = executor.execute(graph(loop(), exported="loop1_status"), ["out"])
    status = rows(results["out"])
    assert len(status) == 50
    failed = [r for r in status if r["status"] == "failed"]
    assert [r["_iteration"] for r in failed] == [15, 30, 45]
    assert "Double" not in failed[0]["error"] and "double: " in failed[0]["error"] and "bad row 15" in failed[0]["error"]
    assert json.loads(status[0]["rows"]) == {"result": 1}


def test_the_key_column_names_each_run():
    out = rows(executor.execute(graph(loop(loopKey="name"), count=3), ["out"])["out"])
    assert [r["_key"] for r in out] == ["n1", "n2", "n3"]


def test_a_missing_key_column_says_what_there_is():
    error = executor.execute(graph(loop(loopKey="nope"), count=3), ["loop1"])["loop1"]["error"]
    assert error == "Key column: nope isn't a column of what's wired into items (a, name)."


def test_stop_on_error_stops_the_loop():
    error = executor.execute(graph(loop(loopOnError="stop")), ["loop1"])["loop1"]["error"]
    assert error.startswith("Run 15 (_key 15) failed, so the loop stopped: double: ")


def test_most_runs_caps_it_and_says_so():
    results = executor.execute(graph(loop(loopMax=10)), ["out"])
    assert len(rows(results["out"])) == 10
    assert "items has 50 rows: the loop ran the first 10 (Most runs)." in results["loop1"]["warnings"]


def test_other_inputs_are_the_same_every_run():
    inner = {
        "nodes": [
            boundary("item", "input"), boundary("scale", "input", 100),
            sql_node("times", "SELECT a * (SELECT factor FROM scale_data) AS b FROM item_data"),
            boundary("result", "output"),
        ],
        "edges": [wire("item", "times"), wire("scale", "times"), wire("times", "result")],
    }
    doc = graph({"id": "loop1", "kind": "loop", "subnet": inner, "position": {"x": 0, "y": 0}}, count=3)
    doc["nodes"].append(sql_node("scale", "SELECT 100 AS factor"))
    doc["edges"].append(wire("scale", "loop1", target_handle="target:scale"))
    assert [r["b"] for r in rows(executor.execute(doc, ["out"])["out"])] == [100, 200, 300]


def test_a_cancelled_loop_skips_the_runs_not_started():
    items = sql.to_parquet(__import__("pyarrow").table({"a": list(range(1, 11))}))
    asked = {"n": 0}

    def cancelled() -> bool:
        asked["n"] += 1
        return asked["n"] > 3

    result = executor.run_loop(loop(), {}, "loop1", items, {}, cancelled=cancelled)
    status = dict(result["outputs"])["status"]
    statuses = sql.from_parquet(status).column("status").to_pylist()
    assert statuses[:3] == ["completed"] * 3
    assert set(statuses[3:]) == {"skipped"}
    assert result["cancelled"] == 7


def test_a_target_inside_a_loop_runs_in_its_first_run():
    results = executor.execute(graph(loop()), ["loop1/double"])
    assert results["loop1/double"]["rowCount"] == 1
    assert "loop1" not in results


def test_a_loop_needs_an_item_input():
    inner = {"nodes": [boundary("other", "input"), boundary("result", "output")], "edges": [wire("other", "result")]}
    doc = graph({"id": "loop1", "kind": "loop", "subnet": inner, "position": {"x": 0, "y": 0}}, count=1)
    assert "needs an Input node called item" in executor.execute(doc, ["loop1"])["loop1"]["error"]


# ---- Jobs ----


@pytest.fixture
def client(monkeypatch):
    monkeypatch.setattr(settings, "IS_LOCAL", True)
    monkeypatch.setattr(settings, "DATABASE_URL", "")
    with TestClient(main.create_app()) as client:
        yield client


def wait(client: TestClient, job_id: str) -> dict:
    for _ in range(200):
        job = client.get(f"/jobs/{job_id}").json()
        if job["status"] != "running":
            return job
        time.sleep(0.05)
    raise AssertionError("The job didn't finish.")


def test_a_loop_job_runs_and_its_tables_come_back(client):
    import pyarrow as pa

    items = sql.to_parquet(pa.table({"a": list(range(1, 21))}))
    body, content_type = formdata.encode([
        ("job", json.dumps({"node": loop(loopConcurrency=2), "path": "loop1"}).encode(), "application/json", None),
        ("input", items, "application/vnd.apache.parquet", "item"),
    ])
    started = client.post("/jobs", content=body, headers={"content-type": content_type})
    assert started.status_code == 202
    job = wait(client, started.json()["id"])
    assert job["status"] == "completed"
    assert job["progress"] == {"done": 20, "total": 20, "failed": 1}
    assert job["warnings"] == ["1 of 20 runs failed: loop1_status says which, and why."]

    reply = client.get(f"/jobs/{job['id']}/result")
    parts = {filename or name: data for name, data, _, filename in formdata.decode(reply.content, reply.headers["content-type"])}
    result = json.loads(parts["result"])
    assert [o["slot"] for o in result["outputs"]] == [None, "status"]
    first = sql.from_parquet(parts[result["outputs"][0]["part"]])
    assert first.num_rows == 19


def test_a_graph_job_answers_as_execute_does(client):
    started = client.post("/jobs", json={"document": graph(loop(), count=5), "targets": ["loop1"]})
    job = wait(client, started.json()["id"])
    assert job["status"] == "completed"
    assert job["result"]["results"]["loop1"]["status"] == "completed"
    assert job["progress"] == {"node": "loop1", "done": 5, "total": 5, "failed": 0}


def test_jobs_say_what_they_can_and_cant(client):
    assert client.get("/jobs/nope").status_code == 404
    assert client.post("/jobs", json={}).json()["error"] == "Send a graph as `document`, or name a saved one as `graphId`."
    body, content_type = formdata.encode([("job", b'{"node": {"kind": "sql-query"}}', "application/json", None)])
    assert "runs a Loop node" in client.post("/jobs", content=body, headers={"content-type": content_type}).json()["error"]


def test_a_cancelled_job_says_so(client):
    import pyarrow as pa

    slow = {
        "nodes": [boundary("item", "input"), sql_node("wait", "SELECT a, (SELECT count(*) FROM range(3000000)) AS n FROM item_data"),
                  boundary("result", "output")],
        "edges": [wire("item", "wait"), wire("wait", "result")],
    }
    node = {"id": "loop1", "kind": "loop", "subnet": slow, "position": {"x": 0, "y": 0}}
    body, content_type = formdata.encode([
        ("job", json.dumps({"node": node}).encode(), "application/json", None),
        ("input", sql.to_parquet(pa.table({"a": list(range(200))})), "application/vnd.apache.parquet", "item"),
    ])
    job_id = client.post("/jobs", content=body, headers={"content-type": content_type}).json()["id"]
    time.sleep(0.3)
    assert client.delete(f"/jobs/{job_id}").status_code == 200
    job = wait(client, job_id)
    assert job["status"] == "cancelled"
    assert job["progress"]["done"] < 200
