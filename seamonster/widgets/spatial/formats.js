// Registry of spatial formats. Every format resolves to a GeoJSON
// FeatureCollection, which is what both renderers consume — adding a format is
// one `defineSpatialFormat` call and neither renderer changes.

const formats = new Map()

/**
 * @param {string} name  matches a layer's `format`
 * @param {{
 *   parse?: (data: any) => object,        // inline data → GeoJSON
 *   load?: (url: string) => Promise<object>, // url → GeoJSON
 * }} definition
 */
export function defineSpatialFormat(name, definition) {
  formats.set(name, definition)
}

export function getSpatialFormat(name) {
  const definition = formats.get(name)
  if (!definition) {
    throw new Error(
      `Unknown spatial format "${name}" (known: ${[...formats.keys()].join(', ')})`,
    )
  }
  return definition
}

async function fetchOrThrow(url) {
  const response = await fetch(url)
  if (!response.ok) throw new Error(`Failed to fetch ${url}: ${response.status}`)
  return response
}

// A collection of collections — what shpjs returns for a zip of several shapes —
// is flattened into one, so a layer is always a single FeatureCollection.
function asFeatureCollection(value) {
  if (Array.isArray(value)) {
    return {
      type: 'FeatureCollection',
      features: value.flatMap((part) => asFeatureCollection(part).features),
    }
  }
  if (value?.type === 'FeatureCollection') return value
  if (value?.type === 'Feature') return { type: 'FeatureCollection', features: [value] }
  // A bare geometry.
  if (value?.type) {
    return {
      type: 'FeatureCollection',
      features: [{ type: 'Feature', geometry: value, properties: {} }],
    }
  }
  throw new Error('Not usable as GeoJSON')
}

defineSpatialFormat('geojson', {
  parse: (data) => asFeatureCollection(typeof data === 'string' ? JSON.parse(data) : data),
  load: async (url) => asFeatureCollection(await (await fetchOrThrow(url)).json()),
})

defineSpatialFormat('shapefile', {
  // A .zip containing .shp/.dbf, ideally with a .prj so shpjs can reproject to
  // WGS84. Loose .shp files work too but arrive in their native projection.
  load: async (url) => {
    // Imported here rather than at the top so an app that never loads a
    // shapefile never downloads shpjs.
    const shp = (await import('shpjs')).default
    const buffer = await (await fetchOrThrow(url)).arrayBuffer()
    return asFeatureCollection(await shp(buffer))
  },
})

/**
 * Resolves one layer descriptor to a GeoJSON FeatureCollection.
 * Inline `data` wins over `url`, so a row that already carries GeoJSON from the
 * database needs no second request.
 */
export async function loadLayerData(layer) {
  const name = layer.format ?? 'geojson'
  const format = getSpatialFormat(name)

  if (layer.data != null && layer.data !== '') {
    if (!format.parse) throw new Error(`Format "${name}" cannot take inline data; use a url`)
    return format.parse(layer.data)
  }
  if (!layer.url) {
    throw new Error(`Layer "${layer.id}" has neither \`data\` nor \`url\``)
  }
  if (!format.load) throw new Error(`Format "${name}" cannot load from a url; use inline data`)
  return format.load(layer.url)
}
