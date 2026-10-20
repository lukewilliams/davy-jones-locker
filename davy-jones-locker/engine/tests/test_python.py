"""PythonScript's geometry in the runner's worker: inputs with geometry as
GeoDataFrames with their CRS where geopandas is installed, and GeoDataFrames
written back with it. These need the runner's libraries (pandas, and
geopandas for most), so they're skipped without them."""

import json
import sys

import pytest

from davy_jones_locker import sql

pytest.importorskip("pandas")
from davy_jones_locker.sandbox import worker  # noqa: E402

HOLED = "POLYGON ((0 0, 100 0, 100 100, 0 100, 0 0), (20 20, 40 20, 40 40, 20 40, 20 20))"


def run(tmp_path, code: str, tables: dict[str, str]) -> tuple[dict, str | None]:
    """Runs `code` with each of `tables` (name: SELECT) as an input, as the
    runner does; its result, and the type of the geometry column it returned
    (`geom`) once loaded back into the engine."""
    with sql.Session() as session:
        spec = {}
        for i, (name, select) in enumerate(tables.items()):
            session.con.execute(f"CREATE TABLE t{i} AS {select}")
            (tmp_path / f"input{i}.parquet").write_bytes(session.parquet(f"t{i}"))
            spec[name] = f"input{i}.parquet"
        (tmp_path / "inputs.json").write_text(json.dumps(spec))
        (tmp_path / "script.py").write_text(code)
        worker.main(tmp_path)
        result = json.loads((tmp_path / "result.json").read_text())
        returned = tmp_path / "value.parquet"
        if not returned.exists():
            return result, None
        session.load("returned", sql.from_parquet(returned.read_bytes()))
        types = dict((name, str(type_)) for name, type_, *_ in session.con.execute("DESCRIBE returned").fetchall())
        return result, types.get("geom")


def test_geometry_in_and_out_keeps_its_crs(tmp_path):
    pytest.importorskip("geopandas")
    code = (
        "print(type(sql1_data).__name__, sql1_data.crs.to_epsg(), len(sql1_data.geometry.iloc[0].interiors))\n"
        "sql1_data['area'] = sql1_data.area\n"
        "sql1_data\n"
    )
    result, returned = run(tmp_path, code, {"sql1_data": f"SELECT 1 AS id, ST_SetCRS(ST_GeomFromText('{HOLED}'), 'EPSG:7855') AS geom"})
    assert "error" not in result, result.get("error")
    assert result["output"] == "GeoDataFrame 7855 1\n"
    assert result["value"] == {"kind": "table", "rows": 1}
    assert returned == "GEOMETRY('EPSG:7855')"


def test_unknown_crs_stays_unknown(tmp_path):
    pytest.importorskip("geopandas")
    result, returned = run(tmp_path, "print(sql1_data.crs)\nsql1_data", {"sql1_data": "SELECT ST_Point(1, 2) AS geom"})
    assert result["output"] == "None\n"
    assert returned == "GEOMETRY"


def test_a_new_crs_and_a_geoseries_in_a_plain_dataframe(tmp_path):
    pytest.importorskip("geopandas")
    code = (
        "import geopandas as gpd\nimport pandas as pd\n"
        "pd.DataFrame({'id': [1], 'geom': gpd.GeoSeries.from_xy([144.9], [-37.8], crs='EPSG:4326').to_crs(7855)})\n"
    )
    result, returned = run(tmp_path, code, {})
    assert "error" not in result, result.get("error")
    assert returned == "GEOMETRY('EPSG:7855')"


def test_variables_name_their_crs(tmp_path):
    pytest.importorskip("geopandas")
    result, _ = run(tmp_path, "zones = sql1_data.to_crs(7844)", {"sql1_data": f"SELECT ST_SetCRS(ST_GeomFromText('{HOLED}'), 'EPSG:7855') AS geom"})
    assert result["variables"] == [{"name": "zones", "type": "GeoDataFrame", "summary": "1 × 1, EPSG:7844"}]


def test_without_geopandas_geometry_is_wkb(tmp_path, monkeypatch):
    monkeypatch.setitem(sys.modules, "geopandas", None)  # import geopandas fails
    result, _ = run(tmp_path, "print(type(sql1_data).__name__, type(sql1_data.geom[0]).__name__)", {"sql1_data": "SELECT ST_Point(1, 2) AS geom"})
    assert "error" not in result, result.get("error")
    assert result["output"] == "DataFrame bytes\n"

