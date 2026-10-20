import { crsInfo, droppedDatumShift } from './crs.js'
import { crsOfType } from './geoExport.js'
import { literal } from './sqlText.js'

// Warnings about spatial SQL that runs but likely doesn't mean what it says
// (ROADMAP 8g, rules 6 and 7a):
//
// - Measuring in degrees: ST_Area, ST_Length, ST_Perimeter, ST_Distance,
//   ST_DWithin and ST_Buffer work in a CRS's units, which for longitude and
//   latitude are degrees.
// - A dropped datum shift: ST_Transform between datums PROJ joins by a null
//   transformation carries coordinates over unchanged (crs.js's
//   droppedDatumShift). So does DataExport's GeoJSON and KML, which are
//   longitude and latitude (WGS 84).
// - A target with no datum: ST_Transform to a PROJ string that names only an
//   ellipsoid (+proj=tmerc ... +ellps=GRS80) applies no datum shift, so the
//   result stays on the source's datum. Found in the target's text, so a
//   target built per row (`'+proj=tmerc +lon_0=' || lon`) is checked too.
// - The _Spheroid functions given the wrong coordinates: with x, y order
//   (geometry_always_xy, set in both engines) they take longitude first, so
//   ST_FlipCoordinates (latitude first) makes them return NaN, silently; and
//   a projected CRS isn't longitude and latitude at all.
//
// A query's spatial calls are found in DuckDB's own parse of it, and each
// geometry argument's type (with its CRS) by asking DuckDB to describe that
// argument selected from the same FROM. What can't be worked out (a server
// table, an alias of the same SELECT) isn't warned about: these never stop a
// run, and never guess.

// The measuring functions, and what to use on longitude and latitude instead.
const MEASURES = {
  st_area: ['ST_Area', 'ST_Area_Spheroid (square metres)'],
  st_length: ['ST_Length', 'ST_Length_Spheroid (metres)'],
  st_perimeter: ['ST_Perimeter', 'ST_Perimeter_Spheroid (metres)'],
  st_distance: ['ST_Distance', 'ST_Distance_Spheroid (metres, between points)'],
  st_dwithin: ['ST_DWithin', 'ST_DWithin_Spheroid (metres, between points)'],
  st_buffer: ['ST_Buffer', null],
}
// The functions that measure on the ellipsoid, in longitude and latitude.
const SPHEROID = new Set(['st_area_spheroid', 'st_length_spheroid', 'st_perimeter_spheroid', 'st_distance_spheroid', 'st_dwithin_spheroid'])
const WATCHED = new RegExp(`\\b(${[...Object.keys(MEASURES), ...SPHEROID, 'st_transform'].join('|')})\\s*\\(`, 'i')

// Warnings for a query (text), run with its inputs exposed as they are for
// the query itself. Never throws.
export async function spatialWarnings(sql, query) {
  if (!WATCHED.test(query)) return []
  try {
    const tree = JSON.parse((await sql.query(`SELECT json_serialize_sql(${literal(query)})`)).rows[0][0])
    if (tree.error || tree.statements?.length !== 1) return []
    const warnings = new Set()
    for (const call of spatialCalls(tree.statements[0])) {
      try {
        const warning = await checkCall(sql, tree.statements[0], call)
        if (warning) warnings.add(warning)
      } catch {
        // Not worked out: no warning.
      }
    }
    return [...warnings]
  } catch {
    return []
  }
}

// Warnings for DataExport writing `tables` as GeoJSON or KML (`format`),
// which transform to EPSG:4326.
export async function lonLatExportWarnings(sql, tables, format) {
  const warnings = new Set()
  for (const t of tables) {
    try {
      const { rows } = await sql.query(`DESCRIBE SELECT * FROM ${t.table}`)
      for (const [name, type] of rows) {
        const crs = crsOfType(type)
        if (!crs || crs === 'EPSG:4326' || crs === 'OGC:CRS84') continue
        const dropped = await droppedDatumShift(sql, crs, 'EPSG:4326')
        if (dropped) {
          warnings.add(
            `${format} is longitude and latitude on WGS 84, and ${name} is in ${crs} (${dropped.from.name}). ` +
              datumMessage(dropped),
          )
        }
      }
    } catch {
      // Not worked out: no warning.
    }
  }
  return [...warnings]
}

const datumMessage = ({ from, to }) =>
  `PROJ has only a null transformation between ${from.base.name} and ${to.base.name} here, so coordinates are carried ` +
  'over unchanged and any real offset between the two datums is dropped. That\'s expected if your data takes one as ' +
  'the other; otherwise transform from the data\'s own datum.'

// Every watched function call in a statement: { name, node, select (the
// SELECT it's in), ctes (the CTEs it can see) }.
function spatialCalls(statement) {
  const found = []
  const visit = (value, select, ctes) => {
    if (Array.isArray(value)) {
      for (const v of value) visit(v, select, ctes)
      return
    }
    if (!value || typeof value !== 'object') return
    if (value.cte_map?.map?.length) ctes = [...ctes, ...value.cte_map.map]
    if (value.type === 'SELECT_NODE') select = value
    const name = value.class === 'FUNCTION' ? String(value.function_name).toLowerCase() : null
    if (select && (MEASURES[name] || SPHEROID.has(name) || name === 'st_transform')) found.push({ name, node: value, select, ctes })
    for (const v of Object.values(value)) visit(v, select, ctes)
  }
  visit(statement.node, null, [])
  return found
}

async function checkCall(sql, statement, { name, node, select, ctes }) {
  const [geometry, ...rest] = node.children ?? []
  if (!geometry) return null
  const crsOf = async () => normalised(crsOfType(await typeOf(sql, statement, geometry, select, ctes)))

  if (MEASURES[name]) {
    const crs = await crsOf()
    if (!crs) return null
    const info = await crsInfo(sql, crs)
    if (!info.geographic) return null
    const [fn, instead] = MEASURES[name]
    return `${fn} on ${described(geometry)} works in degrees: ${crs} (${info.name}) is longitude and latitude. ` +
      `${instead ? `Use ${instead}, or` : 'Use'} ST_Transform to a projected CRS in metres first.`
  }

  if (SPHEROID.has(name)) {
    return spheroidWarning(sql, name, node, async (g) => normalised(crsOfType(await typeOf(sql, statement, g, select, ctes))))
  }

  // ST_Transform(geometry, target) or (geometry, source, target, ...).
  const target = rest.length >= 2 && !isBoolean(rest[1]) ? rest[1] : rest[0]
  if (datumless(target)) {
    const source = rest.length >= 2 && !isBoolean(rest[1]) ? stringConstant(rest[0]) : await crsOf()
    const on = source ? await sourceDatum(sql, normalised(source)) : null
    return `ST_Transform's target is a PROJ string with no datum, only an ellipsoid, so PROJ applies no datum shift: ` +
      `the result stays on ${on ? `the source's datum (${on})` : "the source's datum"}. If the projection is meant for ` +
      'another datum, transform to that datum\'s geographic CRS first, or name the target in WKT or PROJJSON, which ' +
      'carry their datum (a target built per row can be WKT too).'
  }
  const constants = rest.map(stringConstant)
  const [from, to] = constants.length >= 2 && constants[0] && constants[1] ? constants : [await crsOf(), constants[0]]
  if (!from || !to) return null
  const dropped = await droppedDatumShift(sql, normalised(from), normalised(to))
  if (!dropped) return null
  return `ST_Transform from ${from} (${dropped.from.name}) to ${to} (${dropped.to.name}) changes datum: ${datumMessage(dropped)}`
}

// `ST_Area_Spheroid(ST_FlipCoordinates(...))`, or a _Spheroid function on a
// projected CRS. `crsOfArgument(node)` is the CRS of a geometry argument.
async function spheroidWarning(sql, name, node, crsOfArgument) {
  const fn = SPHEROID_NAMES[name]
  for (const argument of node.children ?? []) {
    if (argument.class === 'FUNCTION' && String(argument.function_name).toLowerCase() === 'st_flipcoordinates') {
      return `${fn} takes longitude first here (x, y order, in both engines), so ST_FlipCoordinates, which puts ` +
        'latitude first, makes it return NaN. Drop ST_FlipCoordinates.'
    }
  }
  for (const argument of node.children ?? []) {
    let crs
    try {
      crs = await crsOfArgument(argument)
    } catch {
      continue // not a geometry, or not worked out
    }
    if (!crs) continue
    const info = await crsInfo(sql, crs)
    if (!info.geographic) {
      return `${fn} measures on the ellipsoid from longitude and latitude, but ${described(argument)} is in ${crs} ` +
        `(${info.name}), which is projected. Use ST_Area or ST_Length on it as it is (in its units), or ST_Transform ` +
        'it to its geographic CRS first.'
    }
  }
  return null
}

const SPHEROID_NAMES = {
  st_area_spheroid: 'ST_Area_Spheroid',
  st_length_spheroid: 'ST_Length_Spheroid',
  st_perimeter_spheroid: 'ST_Perimeter_Spheroid',
  st_distance_spheroid: 'ST_Distance_Spheroid',
  st_dwithin_spheroid: 'ST_DWithin_Spheroid',
}

// Whether an ST_Transform target is, or is built from, a PROJ string that
// names no datum: +datum, +towgs84 and +nadgrids are what give one.
function datumless(target) {
  const texts = []
  const visit = (value) => {
    if (Array.isArray(value)) return value.forEach(visit)
    if (!value || typeof value !== 'object') return
    const text = stringConstant(value)
    if (text) texts.push(text)
    Object.values(value).forEach(visit)
  }
  visit(target)
  return texts.some((text) => /(^|\s)\+proj=/.test(text) && !/\+(datum|towgs84|nadgrids)=/.test(text) && !/\+init=/.test(text))
}

// A CRS's datum, by name, for messages (null when it isn't known).
async function sourceDatum(sql, crs) {
  try {
    const info = await crsInfo(sql, crs)
    return info.datum ?? info.base.name
  } catch {
    return null
  }
}

const isBoolean = (node) => node?.class === 'CONSTANT' && node.value?.type?.id === 'BOOLEAN'

// OGC:CRS84 as EPSG:4326, the same coordinates in x, y order (DuckDB-wasm's
// spatial can't identify CRS84).
const normalised = (crs) => (crs === 'OGC:CRS84' ? 'EPSG:4326' : crs)

const stringConstant = (node) =>
  node?.class === 'CONSTANT' && node.value?.type?.id === 'VARCHAR' && !node.value.is_null ? node.value.value : null

const described = (node) => (node.class === 'COLUMN_REF' ? node.column_names.at(-1) : 'a geometry')

// An expression's type, as DuckDB binds it: the expression alone, selected
// from the same FROM with the same CTEs (no WHERE, grouping or ordering).
async function typeOf(sql, statement, expression, select, ctes) {
  const node = {
    ...select,
    select_list: [expression],
    cte_map: { map: ctes },
    where_clause: null,
    group_expressions: [],
    group_sets: [],
    having: null,
    qualify: null,
    modifiers: [],
    aggregate_handling: 'STANDARD_HANDLING',
  }
  // DuckDB marks a position it doesn't have as the largest 64-bit integer,
  // which JSON.parse rounds; its parser wants it exact.
  const probe = JSON.stringify({ error: false, statements: [{ ...statement, node }] })
    .replaceAll(':18446744073709552000', ':18446744073709551615')
  const text = (await sql.query(`SELECT json_deserialize_sql(${literal(probe)})`)).rows[0][0]
  return String((await sql.query(`DESCRIBE ${text}`)).rows[0][1])
}
