"""DataExport on the engine (whole-graph runs): geometry as the browser writes it."""

import base64
import csv
import io
import json

import pyarrow.parquet as pq
import pytest

from davy_jones_locker import executor, sql

pytestmark = pytest.mark.spatial


def export(fmt: str) -> bytes:
    with sql.Session() as session:
        target = session.output_table("sql1")
        session.con.execute(
            f"CREATE TABLE {target} AS SELECT 'pin' AS name, ST_SetCRS(ST_Point(144.95, -37.47), 'EPSG:4326') AS geometry"
        )
        inputs = [{"id": "sql1", "ref": "sql1_data", "slot": None, "pin": None, "output": target}]
        result = executor.run_export(session, {"id": "dataexport1", "exportFormat": fmt}, inputs, {})
    return base64.b64decode(result["export"]["base64"])


def test_csv_and_json_write_geometry_as_wkt():
    # As DuckDB's own CSV and JSON writers do in the browser, not as bytes.
    assert list(csv.reader(io.StringIO(export("csv").decode()))) == [["name", "geometry"], ["pin", "POINT (144.95 -37.47)"]]
    assert json.loads(export("json")) == [{"name": "pin", "geometry": "POINT (144.95 -37.47)"}]


def test_parquet_is_geoparquet():
    geo = json.loads(pq.read_schema(io.BytesIO(export("parquet"))).metadata[sql.GEO_KEY])
    assert geo["columns"]["geometry"]["crs"]["id"] == {"authority": "EPSG", "code": 4326}


def test_formats_and_kinds_the_server_refuses_say_where_they_run():
    with sql.Session() as session:
        with pytest.raises(executor.NodeError, match="xlsx files are written in the browser only: on the server, CSV, TSV, JSON and Parquet can be"):
            target = session.output_table("sql1")
            session.con.execute(f"CREATE TABLE {target} AS SELECT 1 AS n")
            inputs = [{"id": "sql1", "ref": "sql1_data", "slot": None, "pin": None, "output": target}]
            executor.run_export(session, {"id": "dataexport1", "exportFormat": "xlsx"}, inputs, {})
        with pytest.raises(executor.NodeError, match="JavaScript nodes run only in the browser"):
            executor.run_node(session, {"id": "javascript1", "kind": "javascript"}, [], {})
        with pytest.raises(executor.NodeError, match="chart nodes can't run on the server: run this one in the browser"):
            executor.run_node(session, {"id": "chart1", "kind": "chart"}, [], {})
