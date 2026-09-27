// Geometry and style helpers shared by both renderers.

/**
 * Bounding box of any GeoJSON, as [[minLng, minLat], [maxLng, maxLat]].
 * Returns null for empty or degenerate input, so callers can skip fitting.
 */
export function featureBounds(geojson) {
  let minLng = Infinity
  let minLat = Infinity
  let maxLng = -Infinity
  let maxLat = -Infinity

  // Coordinates nest to arbitrary depth (Point → MultiPolygon), so walk until
  // the first element stops being an array.
  const walk = (coords) => {
    if (!Array.isArray(coords)) return
    if (typeof coords[0] === 'number') {
      const [lng, lat] = coords
      if (!Number.isFinite(lng) || !Number.isFinite(lat)) return
      if (lng < minLng) minLng = lng
      if (lat < minLat) minLat = lat
      if (lng > maxLng) maxLng = lng
      if (lat > maxLat) maxLat = lat
      return
    }
    for (const part of coords) walk(part)
  }

  const visit = (node) => {
    if (!node) return
    if (node.type === 'FeatureCollection') node.features?.forEach(visit)
    else if (node.type === 'Feature') visit(node.geometry)
    else if (node.type === 'GeometryCollection') node.geometries?.forEach(visit)
    else if (node.coordinates) walk(node.coordinates)
  }

  visit(geojson)

  if (minLng === Infinity) return null
  return [
    [minLng, minLat],
    [maxLng, maxLat],
  ]
}

/** Union of several bounding boxes, or null if there are none. */
export function combineBounds(list) {
  const boxes = list.filter(Boolean)
  if (boxes.length === 0) return null
  return [
    [Math.min(...boxes.map((b) => b[0][0])), Math.min(...boxes.map((b) => b[0][1]))],
    [Math.max(...boxes.map((b) => b[1][0])), Math.max(...boxes.map((b) => b[1][1]))],
  ]
}

/**
 * '#rrggbb' (or '#rgb') plus an opacity to deck.gl's [r, g, b, a] with a 0-255
 * alpha. Unparseable input falls back to opaque mid grey rather than throwing,
 * because a bad colour in the data should not blank the map.
 */
export function hexToRgba(hex, opacity = 1) {
  const alpha = Math.round(Math.min(Math.max(opacity, 0), 1) * 255)
  const match = /^#?([0-9a-f]{3}|[0-9a-f]{6})$/i.exec(String(hex ?? '').trim())
  if (!match) return [128, 128, 128, alpha]

  let digits = match[1]
  if (digits.length === 3) digits = [...digits].map((d) => d + d).join('')
  return [
    parseInt(digits.slice(0, 2), 16),
    parseInt(digits.slice(2, 4), 16),
    parseInt(digits.slice(4, 6), 16),
    alpha,
  ]
}

// The renderer-neutral style defaults. Both renderers read these names and
// translate; nothing app-specific belongs here.
export const DEFAULT_STYLE = {
  color: '#3388ff', // stroke
  fillColor: null, // falls back to `color`
  weight: 2, // stroke width in pixels
  opacity: 1, // stroke opacity
  fillOpacity: 0.2,
  radius: 5, // point radius in pixels
}

export function resolveStyle(style) {
  const merged = { ...DEFAULT_STYLE, ...(style ?? {}) }
  return { ...merged, fillColor: merged.fillColor ?? merged.color }
}
