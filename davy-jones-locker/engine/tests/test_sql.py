"""Server SQL: the lockdown, the functions refused, and spatial SQL."""

import http.server
import io
import json
import math
import struct
import threading

import duckdb
import pyarrow as pa
import pyarrow.parquet as pq
import pytest

from davy_jones_locker import sql

KML = b"""<?xml version="1.0" encoding="UTF-8"?>
<kml xmlns="http://www.opengis.net/kml/2.2"><Document>
<Placemark><name>pin</name><Point><coordinates>144.95,-37.47,0</coordinates></Point></Placemark>
</Document></kml>
"""


@pytest.fixture
def kml_file(tmp_path):
    path = tmp_path / "site.kml"
    path.write_bytes(KML)
    return str(path)


@pytest.fixture
def web_server():
    """A local server answering every GET with GeoJSON, recording what's asked."""
    hits = []

    class Handler(http.server.BaseHTTPRequestHandler):
        def do_GET(self):
            hits.append(self.path)
            self.send_response(200)
            self.send_header("Content-Type", "application/geo+json")
            self.end_headers()
            self.wfile.write(b'{"type":"FeatureCollection","features":[]}')

        do_HEAD = do_GET

        def log_message(self, *args):
            pass

    server = http.server.ThreadingHTTPServer(("127.0.0.1", 0), Handler)
    threading.Thread(target=server.serve_forever, daemon=True).start()
    yield f"http://127.0.0.1:{server.server_address[1]}", hits
    server.shutdown()


def run(query: str, inputs: dict[str, bytes] | None = None) -> pa.Table:
    return sql.from_parquet(sql.run_query(query, inputs or {}))


def point(table: pa.Table, column: str = "g") -> tuple[float, float]:
    """The x, y of a WKB point in the first row (ISO WKB, little-endian)."""
    wkb = table.column(column)[0].as_py()
    return struct.unpack_from("<dd", wkb, 5)


# ---- The spatial extension ----


def test_spatial_is_loaded_with_x_y_axis_order():
    with sql.Session() as session:
        assert session.spatial
    # EPSG:4326 is officially latitude first: without geometry_always_xy this
    # gives POINT (inf inf).
    x, y = point(run("SELECT ST_AsWKB(ST_Transform(ST_Point(144.95, -37.47), 'EPSG:4326', 'EPSG:7855')) AS g"))
    assert x == pytest.approx(318717.7325297, abs=1e-6)
    assert y == pytest.approx(5851013.5398555, abs=1e-6)


def test_geodesic_area_takes_x_y():
    # A 0.001° square at 37.47°S, measured on the ellipsoid without flipping.
    table = run(
        "SELECT ST_Area_Spheroid(ST_GeomFromText("
        "'POLYGON((144.95 -37.47, 144.951 -37.47, 144.951 -37.469, 144.95 -37.469, 144.95 -37.47))')) AS a"
    )
    assert table.column("a")[0].as_py() == pytest.approx(9813.0, rel=1e-3)


def test_settings_stay_locked():
    with sql.Session() as session:
        with pytest.raises(duckdb.Error, match="locked"):
            session.con.execute("SET geometry_always_xy = false")


def test_without_spatial_the_error_says_so(monkeypatch):
    monkeypatch.setattr(sql, "_load_spatial", lambda con: False)
    with pytest.raises(sql.QueryError, match="spatial extension isn't installed"):
        run("SELECT ST_Point(1, 2) AS g")


# ---- Files and URLs: refused twice ----

READERS = [
    "SELECT * FROM ST_Read({target})",
    "SELECT * FROM ST_Read_Meta({target})",
    "SELECT * FROM st_read({target})",
    "SELECT * FROM (SELECT * FROM ST_READ({target}))",
    "WITH t AS (SELECT * FROM ST_Read({target})) SELECT * FROM t",
    "SELECT * FROM ST_ReadOSM({target})",
    "SELECT * FROM ST_ReadSHP({target})",
    "SELECT * FROM shapefile_meta({target})",
]


@pytest.mark.parametrize("template", READERS)
def test_check_query_refuses_file_readers(template, kml_file):
    with pytest.raises(sql.QueryError, match="Read the file with DataIngest"):
        run(template.format(target=sql.literal(kml_file)))


@pytest.mark.parametrize(
    "target",
    [
        "{file}",
        "{url}/site.geojson",
        "/vsicurl/{url}/site.geojson",
        "GeoJSON:{url}/site.geojson",
        "WFS:{url}/wfs",
        "OAPIF:{url}/collections",
        "/vsimem/site.geojson",
    ],
)
def test_the_lockdown_alone_refuses_st_read(target, kml_file, web_server):
    """Without check_query (the second layer), DuckDB's lockdown still keeps
    GDAL off the file system and the network."""
    url, hits = web_server
    target = target.format(file=kml_file, url=url)
    with sql.Session() as session:
        with pytest.raises(duckdb.Error):
            session.con.execute(f"SELECT * FROM ST_Read({sql.literal(target)})").fetchall()
    assert hits == []


def test_st_read_works_before_the_lockdown(kml_file):
    """The control for the test above: the same file reads unlocked."""
    con = duckdb.connect()
    con.execute("LOAD spatial")
    assert con.execute(f"SELECT count(*) FROM ST_Read({sql.literal(kml_file)})").fetchone()[0] == 1


def test_proj_fetches_no_grids(web_server):
    url, hits = web_server
    with sql.Session() as session:
        try:
            session.con.execute(
                "SELECT ST_Transform(ST_Point(1, 2), "
                f"{sql.literal(f'+proj=longlat +datum=WGS84 +nadgrids={url}/grid.tif')}, 'EPSG:4326')"
            ).fetchall()
        except duckdb.Error:
            pass
    assert hits == []


@pytest.mark.parametrize(
    "query",
    [
        "SELECT * FROM postgres_scan('host=elsewhere', 'public', 't')",
        "SELECT * FROM query('SELECT 1')",
        "SELECT * FROM query_table('t')",
    ],
)
def test_check_query_refuses_connections_and_sql_as_text(query):
    with pytest.raises(sql.QueryError, match="can't be used on the server"):
        run(query)


def test_one_select_only():
    with pytest.raises(sql.QueryError, match="Only a SELECT"):
        run("COPY (SELECT 1) TO 'x.geojson' (FORMAT GDAL, DRIVER 'GeoJSON')")


# ---- Geometry through a query ----


def test_spatial_sql_over_an_input():
    wkb = bytes.fromhex("0101000000000000000000F03F0000000000000040")  # POINT (1 2)
    table = pa.table({"id": [1], "geometry": [wkb]})
    result = run(
        "SELECT id, ST_X(ST_GeomFromWKB(geometry)) AS x, ST_Area(ST_Buffer(ST_GeomFromWKB(geometry), 10)) AS area "
        "FROM input1",
        {"input1": sql.to_parquet(table)},
    )
    assert result.column("x")[0].as_py() == 1.0
    # 32 segments, as the browser's: 32 triangles of 10 m sides, not pi * 100.
    assert result.column("area")[0].as_py() == pytest.approx(16 * 100 * math.sin(math.pi / 16), abs=1e-9)


# ---- The CRS through SQL (rule 5) ----


@pytest.fixture
def geoparquet(tmp_path):
    """Parquet as DuckDB writes it, which is how the browser sends tables:
    each GEOMETRY column's CRS in its `geo` metadata, as PROJJSON."""
    con = duckdb.connect()
    con.execute("LOAD spatial")
    con.execute("SET geometry_always_xy = true")

    def write(select: str, geo: dict | None = None) -> bytes:
        path = tmp_path / "input.parquet"
        options = f", KV_METADATA {{geo: {sql.literal(json.dumps(geo))}}}" if geo else ""
        con.execute(f"COPY ({select}) TO {sql.literal(str(path))} (FORMAT parquet{options})")
        return path.read_bytes()

    yield write
    con.close()


def geo_of(data: bytes) -> dict:
    """A Parquet file's `geo` metadata, by column."""
    return json.loads(pq.read_schema(io.BytesIO(data)).metadata[sql.GEO_KEY])["columns"]


def crs_code(column: dict) -> str | None:
    crs = column["crs"]
    return None if crs is None else f"{crs['id']['authority']}:{crs['id']['code']}"


def types_of(data: bytes, tmp_path) -> dict[str, str]:
    """Each column's type as DuckDB, with spatial loaded, reads the file (as
    the browser does)."""
    path = tmp_path / "output.parquet"
    path.write_bytes(data)
    con = duckdb.connect()
    con.execute("LOAD spatial")
    return {name: kind for name, kind, *_ in con.execute("DESCRIBE SELECT * FROM read_parquet(?)", [str(path)]).fetchall()}


SITE = "ST_SetCRS(ST_Point(144.95, -37.47), 'EPSG:4326')"


def test_an_input_is_geometry_with_its_crs(geoparquet):
    table = run(
        "SELECT ST_CRS(geometry) AS crs, typeof(geometry) AS type FROM input1",
        {"input1": geoparquet(f"SELECT 1 AS id, {SITE} AS geometry")},
    )
    assert table.column("crs")[0].as_py() == "EPSG:4326"
    assert table.column("type")[0].as_py() == "GEOMETRY('EPSG:4326')"


def test_a_query_keeps_each_columns_crs(geoparquet, tmp_path):
    data = sql.run_query(
        "SELECT id, geometry, ST_Transform(geometry, 'EPSG:7855') AS mga FROM input1",
        {"input1": geoparquet(f"SELECT 1 AS id, {SITE} AS geometry")},
    )
    columns = geo_of(data)
    assert crs_code(columns["geometry"]) == "EPSG:4326"
    assert crs_code(columns["mga"]) == "EPSG:7855"
    assert columns["mga"]["geometry_types"] == ["Point"]
    assert types_of(data, tmp_path) == {"id": "INTEGER", "geometry": "GEOMETRY('EPSG:4326')", "mga": "GEOMETRY('EPSG:7855')"}
    x, y = point(sql.from_parquet(data), "mga")
    assert x == pytest.approx(318717.7325297, abs=1e-6)
    assert y == pytest.approx(5851013.5398555, abs=1e-6)


def test_geometry_made_by_a_query_leaves_as_geoparquet(tmp_path):
    data = sql.run_query(
        "SELECT ST_SetCRS(ST_Point(320000, 5851000), 'EPSG:7855') AS mga, "
        "ST_GeomFromText('POLYGON Z((0 0 1, 1 0 1, 1 1 1, 0 0 1))') AS solid",
        {},
    )
    columns = geo_of(data)
    assert crs_code(columns["mga"]) == "EPSG:7855"
    assert columns["solid"]["geometry_types"] == ["Polygon Z"]
    # No CRS stays no CRS: without the explicit null, OGC:CRS84 is meant.
    assert "crs" in columns["solid"] and columns["solid"]["crs"] is None
    assert types_of(data, tmp_path)["solid"] == "GEOMETRY"


def test_an_unknown_crs_stays_unknown(geoparquet):
    unknown = {"version": "1.0.0", "primary_column": "geometry",
               "columns": {"geometry": {"encoding": "WKB", "geometry_types": [], "crs": None}}}
    data = sql.run_query(
        "SELECT geometry, ST_CRS(geometry) AS crs FROM input1",
        {"input1": geoparquet("SELECT ST_Point(320000, 5851000) AS geometry", unknown)},
    )
    assert sql.from_parquet(data).column("crs")[0].as_py() is None
    assert geo_of(data)["geometry"]["crs"] is None


def test_crs84_is_read_as_epsg_4326(geoparquet):
    # No `crs` key means OGC:CRS84 (GeoParquet's rule, which DuckDB's writer
    # relies on for an untagged column). The browser reads it as EPSG:4326,
    # since its spatial extension can't identify CRS84, and so does the engine.
    inputs = {
        "absent": geoparquet("SELECT ST_Point(144.95, -37.47) AS geometry"),
        "named": geoparquet("SELECT ST_SetCRS(ST_Point(144.95, -37.47), 'OGC:CRS84') AS geometry"),
    }
    table = run("SELECT ST_CRS(a.geometry) AS a, ST_CRS(n.geometry) AS n FROM absent a, named n", inputs)
    assert (table.column("a")[0].as_py(), table.column("n")[0].as_py()) == ("EPSG:4326", "EPSG:4326")


def test_mixed_crss_are_refused(geoparquet):
    inputs = {
        "a": geoparquet(f"SELECT {SITE} AS geometry"),
        "b": geoparquet("SELECT ST_SetCRS(ST_Point(318717, 5851013), 'EPSG:7855') AS geometry"),
    }
    with pytest.raises(sql.QueryError, match="different coordinate reference systems"):
        run("SELECT ST_Intersects(a.geometry, b.geometry) FROM a, b", inputs)


def test_metadata_duckdb_cant_use_leaves_a_blob():
    wkb = bytes.fromhex("0101000000000000000000F03F0000000000000040")
    table = pa.table({"geometry": [wkb]}).replace_schema_metadata({sql.GEO_KEY: b"not json"})
    result = run("SELECT typeof(geometry) AS type FROM input1", {"input1": sql.to_parquet(table)})
    assert result.column("type")[0].as_py() == "BLOB"


def test_without_spatial_the_crs_still_travels(monkeypatch, geoparquet):
    data_in = geoparquet("SELECT ST_SetCRS(ST_Point(320000, 5851000), 'EPSG:7855') AS geometry")
    monkeypatch.setattr(sql, "_load_spatial", lambda con: False)
    data = sql.run_query("SELECT geometry FROM input1", {"input1": data_in})
    columns = geo_of(data)
    assert crs_code(columns["geometry"]) == "EPSG:7855"
    assert columns["geometry"]["geometry_types"] == []
