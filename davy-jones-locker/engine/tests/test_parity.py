"""The same spatial SQL gives the same numbers on the engine as in the
browser. BROWSER is what DuckDB-wasm (1.33.1-dev64.0, DuckDB 1.5.5, with its
spatial extension) returned for QUERY in the editor, exported as JSON. When
DuckDB or its spatial extension is upgraded in both engines, run QUERY in the
browser again (a SQLQuery node into DataExport as JSON) and update BROWSER.

Agreement is to 1e-5: the two builds round the last bit of a transformed
coordinate differently now and then."""

import io
import json
from pathlib import Path

import pyarrow.parquet as pq
import pytest

from davy_jones_locker import sql

QUERY = """\
WITH fixtures AS (
  SELECT name, ST_SetCRS(ST_GeomFromText(wkt), 'EPSG:7855') AS geom FROM (VALUES
    ('site', 'POLYGON ((320000 5851000, 321000 5851000, 321000 5852000, 320000 5852000, 320000 5851000), (320400 5851400, 320600 5851400, 320600 5851600, 320400 5851600, 320400 5851400))'),
    ('lots', 'MULTIPOLYGON (((322000 5851000, 322100 5851000, 322100 5851100, 322000 5851100, 322000 5851000)), ((320900 5851900, 321100 5851900, 321100 5852100, 320900 5852100, 320900 5851900)))'),
    ('road', 'LINESTRING (319500 5851500, 321500 5851700, 322050 5851050)'),
    ('pin', 'POINT (320500 5851900)'),
    ('well', 'POINT (319000 5850000)')
  ) AS t(name, wkt)
),
site AS (SELECT geom FROM fixtures WHERE name = 'site')
SELECT
  f.name,
  round(ST_Area(f.geom), 6) AS area,
  round(ST_Length(f.geom), 6) AS length,
  round(ST_Area(ST_Buffer(f.geom, 25)), 6) AS buffer_area,
  round(ST_Area(ST_Intersection(ST_Buffer(f.geom, 25), site.geom)), 6) AS intersect_area,
  ST_Intersects(f.geom, site.geom) AS intersects,
  round(ST_Distance(f.geom, site.geom), 6) AS distance,
  round(ST_Area_Spheroid(ST_Transform(f.geom, 'EPSG:4326')), 3) AS area_spheroid,
  round(ST_X(ST_Centroid(ST_Transform(f.geom, 'EPSG:4326'))), 9) AS lon,
  round(ST_Y(ST_Centroid(ST_Transform(f.geom, 'EPSG:4326'))), 9) AS lat,
  round(ST_X(ST_Centroid(ST_Transform(f.geom, 'EPSG:28355'))), 6) AS gda94_x,
  round(ST_Y(ST_Centroid(ST_Transform(f.geom, 'EPSG:28355'))), 6) AS gda94_y
FROM fixtures f, site
ORDER BY f.name
"""

BROWSER = [
    {"name": "lots", "area": 50000.0, "length": 0.0, "buffer_area": 83901.80644, "intersect_area": 15487.725805,
     "intersects": True, "distance": 0.0, "area_spheroid": 50000.624, "lon": 144.978360953, "lat": -37.46331101,
     "gda94_x": 321209.503158, "gda94_y": 5851808.528011},
    {"name": "pin", "area": 0.0, "length": 0.0, "buffer_area": 1950.90322, "intersect_area": 1950.90322,
     "intersects": True, "distance": 0.0, "area_spheroid": 0.0, "lon": 144.970358815, "lat": -37.462362605,
     "gda94_x": 320499.503146, "gda94_y": 5851898.5279},
    {"name": "road", "area": 0.0, "length": 2861.444443, "buffer_area": 144995.154017, "intersect_area": 45224.440295,
     "intersects": True, "distance": 0.0, "area_spheroid": 0.0, "lon": 144.974196921, "lat": -37.46568409,
     "gda94_x": 320878.900182, "gda94_y": 5851531.575552},
    {"name": "site", "area": 960000.0, "length": 0.0, "buffer_area": 1079450.90322, "intersect_area": 960000.0,
     "intersects": True, "distance": 0.0, "area_spheroid": 960005.962, "lon": 144.970261372, "lat": -37.465965777,
     "gda94_x": 320499.503208, "gda94_y": 5851498.527901},
    {"name": "well", "area": 0.0, "length": 0.0, "buffer_area": 1950.90322, "intersect_area": 0.0,
     "intersects": False, "distance": 1414.213562, "area_spheroid": 0.0, "lon": 144.952941007, "lat": -37.479185229,
     "gda94_x": 318999.503444, "gda94_y": 5849998.52767},
]


def test_buffer_intersect_area_and_transforms_match_the_browser():
    engine = pq.read_table(io.BytesIO(sql.run_query(QUERY, {}))).to_pylist()
    assert [row["name"] for row in engine] == [row["name"] for row in BROWSER]
    for got, expected in zip(engine, BROWSER):
        assert got == pytest.approx(expected, abs=1e-5), got["name"]


FIXTURES = Path(__file__).resolve().parent / "fixtures"
TOLERANCE = {"area_ha": 1e-6, "perimeter_m": 1e-3, "distance_m": 2e-4, "distance_wkt_m": 2e-4, "overlap_ha": 2e-6, "overlap_m": 2e-4}


def test_site_screening_matches_the_browser():
    # fixtures/screening.sql, which the browser ran into screening-browser.json
    # the same way as QUERY (its nulls left out). Zones and flags exactly;
    # numbers to a little over their rounding.
    query = (FIXTURES / "screening.sql").read_text(encoding="utf-8")
    engine = {row["i"]: row for row in pq.read_table(io.BytesIO(sql.run_query(query, {}))).to_pylist()}
    browser = {row["i"]: row for row in json.loads((FIXTURES / "screening-browser.json").read_text(encoding="utf-8"))}
    assert set(engine) == set(browser)
    for i, expected in browser.items():
        got = engine[i]
        assert {k for k, v in got.items() if v is not None} == set(expected), i
        for key, value in expected.items():
            if key in TOLERANCE:
                assert got[key] == pytest.approx(value, abs=TOLERANCE[key]), (i, key)
            else:
                assert got[key] == value, (i, key)
        if got["what"] == "feature":
            assert got["distance_m"] == pytest.approx(got["distance_wkt_m"], abs=1e-4), i  # PROJ string via GDA2020 = WKT

