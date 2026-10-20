"""DataExport on the engine (whole-graph runs): geometry as the browser writes it."""

import base64
import csv
import io
import json

import pyarrow.parquet as pq

from davy_jones_locker import executor, sql


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
