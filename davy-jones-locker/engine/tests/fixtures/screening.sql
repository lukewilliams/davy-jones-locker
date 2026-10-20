-- Site screening as an app writes it in SQL, over made-up data generated
-- here: a site of three parts, one with a hole (3.75 ha, in GDA2020 lon/lat,
-- typed as an upstream node's column would be); 24 squares and 4 lines
-- around it, every other one in GDA94; 40 point records with an uncertainty
-- radius (or none). test_parity.py checks the engine gives the numbers the
-- browser gave (screening-browser.json).
--
-- What it exercises: a projection centred on the site built per row, as a
-- PROJ string (reached through GDA2020 first, since it has no datum) and as
-- WKT (which carries GDA2020, so GDA94 data is shifted on the way: the two
-- must agree); the three-argument ST_Transform from each row's own CRS;
-- negative buffers; ST_Intersection, ST_Distance, ST_Boundary; geodesic
-- area, perimeter and length (ST_*_Spheroid, longitude first); ST_Dump in
-- a list comprehension.

WITH
site AS (
  SELECT ST_SetCRS(ST_GeomFromText('MULTIPOLYGON (((144.950565219 -37.469549493, 144.951695656 -37.469549482, 144.951695676 -37.470450493, 144.950565225 -37.470450504, 144.950565219 -37.469549493)), ((144.949434781 -37.469549493, 144.949434775 -37.470450504, 144.947173873 -37.470450472, 144.947173907 -37.469549461, 144.949434781 -37.469549493), (144.948586949 -37.469774739, 144.948021729 -37.469774731, 144.948021717 -37.470225236, 144.948586941 -37.470225244, 144.948586949 -37.469774739)), ((144.953391312 -37.469549446, 144.953391353 -37.470450457, 144.952260902 -37.470450484, 144.952260875 -37.469549473, 144.953391312 -37.469549446)))'), 'EPSG:7844') AS g
),
frame AS (
  SELECT g, ST_X(ST_PointOnSurface(g)) AS lon0, ST_Y(ST_PointOnSurface(g)) AS lat0 FROM site
),
local AS (
  SELECT g,
    printf('+proj=tmerc +lat_0=%.6f +lon_0=%.6f +k=1 +x_0=0 +y_0=0 +ellps=GRS80 +units=m +no_defs', lat0, lon0) AS proj,
    printf('PROJCRS["local",BASEGEOGCRS["GDA2020",DATUM["Geocentric Datum of Australia 2020",ELLIPSOID["GRS 1980",6378137,298.257222101]],ID["EPSG",7844]],CONVERSION["tm",METHOD["Transverse Mercator",ID["EPSG",9807]],PARAMETER["Latitude of natural origin",%.6f],PARAMETER["Longitude of natural origin",%.6f],PARAMETER["Scale factor at natural origin",1],PARAMETER["False easting",0],PARAMETER["False northing",0]],CS[Cartesian,2],AXIS["easting",east,LENGTHUNIT["metre",1]],AXIS["northing",north,LENGTHUNIT["metre",1]]]', lat0, lon0) AS wkt
  FROM frame
),
site_local AS (
  SELECT ST_Transform(g, 'EPSG:7844', proj) AS s, proj, wkt FROM local
),
core AS (SELECT ST_Buffer(s, -3, 32) AS core FROM site_local),
squares AS (
  SELECT i, ST_Transform(ST_Buffer(ST_Point(((i % 6) - 2.5) * 110, ((i // 6) - 1.5) * 90), 20, 2), proj, 'EPSG:7844') AS lonlat
  FROM range(24) t(i), site_local
),
lines AS (
  SELECT 100 + i AS i, ST_Transform(ST_MakeLine(ST_Point(-400 + i * 37, -150 + i * 60), ST_Point(380 - i * 41, 140 - i * 55)), proj, 'EPSG:7844') AS lonlat
  FROM range(4) t(i), site_local
),
features AS (
  SELECT i, CASE WHEN i % 2 = 1 THEN 'EPSG:4283' ELSE 'EPSG:7844' END AS crs,
    CASE WHEN i % 2 = 1 THEN ST_Transform(lonlat, 'EPSG:7844', 'EPSG:4283') ELSE lonlat END AS geometry
  FROM (SELECT * FROM squares UNION ALL SELECT * FROM lines)
),
measured AS (
  SELECT d.i, t.s, c.core, t.proj,
    ST_Transform(ST_Transform(d.geometry, d.crs, 'EPSG:7844'), 'EPSG:7844', t.proj) AS f,
    ST_Transform(d.geometry, d.crs, t.wkt) AS f_wkt
  FROM features d, site_local t, core c
),
classified AS (
  SELECT i, ST_Distance(f, s) AS distance_m, ST_Distance(f_wkt, s) AS distance_wkt_m, ST_Intersects(f, core) AS interior,
    CASE WHEN ST_Intersects(f, s) THEN ST_Transform(ST_Intersection(f, s), proj, 'EPSG:7844') END AS inside
  FROM measured
),
records AS (
  SELECT 200 + i AS i, ST_Transform(ST_Point(cos(i * 0.7) * (8 + i * 9), sin(i * 0.7) * (8 + i * 9)), proj, 'EPSG:7844') AS p,
    [5.0, 50.0, 400.0, NULL][(i % 4) + 1] AS u
  FROM range(40) t(i), site_local
),
placed AS (
  SELECT r.i, r.u, ST_Distance(ST_Transform(r.p, 'EPSG:7844', t.proj), t.s) AS d,
    ST_Distance(ST_Transform(r.p, 'EPSG:7844', t.proj), ST_Boundary(t.s)) AS to_edge
  FROM records r, site_local t
)
SELECT -1 AS i, 'site' AS what,
  ST_NumGeometries(g) AS parts,
  list_sum([ST_NInteriorRings(p.geom) FOR p IN ST_Dump(g)]) AS holes,
  round(ST_Area_Spheroid(g) / 10000, 6) AS area_ha,
  round(ST_Perimeter_Spheroid(g), 3) AS perimeter_m,
  floor((ST_X(ST_PointOnSurface(g)) + 180) / 6)::INTEGER + 1 AS mga_zone,
  NULL AS zone, NULL::DOUBLE AS distance_m, NULL::DOUBLE AS distance_wkt_m, NULL::BOOLEAN AS interior,
  NULL::DOUBLE AS overlap_ha, NULL::DOUBLE AS overlap_m, NULL AS zone_certain, NULL AS zone_possible
FROM site
UNION ALL
SELECT i, 'feature', NULL, NULL, NULL, NULL, NULL,
  CASE WHEN interior THEN 'site' WHEN distance_m <= 100 THEN 'b1' WHEN distance_m <= 300 THEN 'b2' END,
  round(distance_m, 4), round(distance_wkt_m, 4), interior,
  round(coalesce(ST_Area_Spheroid(inside), 0) / 10000, 6), round(coalesce(ST_Length_Spheroid(inside), 0), 4),
  NULL, NULL
FROM classified
UNION ALL
SELECT i, 'record', NULL, NULL, NULL, NULL, NULL, NULL, round(d, 4), NULL, NULL, NULL, NULL,
  CASE WHEN u IS NULL THEN NULL WHEN d = 0 AND u <= to_edge THEN 'site' WHEN d + u <= 100 THEN 'b1' WHEN d + u <= 300 THEN 'b2' END,
  CASE WHEN d - coalesce(u, 0) <= 0 THEN 'site' WHEN d - coalesce(u, 0) <= 100 THEN 'b1' WHEN d - coalesce(u, 0) <= 300 THEN 'b2' END
FROM placed
ORDER BY i
