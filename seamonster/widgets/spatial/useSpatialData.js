import { shallowRef, watch } from 'vue'
import { loadLayerData } from './formats.js'

// A url identifies its content; inline data does not, and re-parsing something
// already in memory is cheap, so only fetched layers are cached.
const cacheKey = (layer) => (layer.url ? `${layer.format ?? 'geojson'}|${layer.url}` : null)

/**
 * Resolves layer descriptors to GeoJSON, shared by both renderers.
 *
 * Only the latest run is kept, the same way the app's useQuery drops stale
 * results — toggling a filter quickly must not let an earlier, slower fetch
 * overwrite a later one.
 *
 * @param {() => Array} getLayers  reactive source of layer descriptors
 * @param {(error: Error, layer: object) => void} [onError]
 * @returns {import('vue').ShallowRef<Array<{ layer: object, data: object }>>}
 */
export function useSpatialData(getLayers, onError) {
  const resolved = shallowRef([])
  const cache = new Map()
  let latest = 0

  watch(
    getLayers,
    async (layers) => {
      const run = ++latest
      const visible = (layers ?? []).filter((layer) => layer.visible !== false)

      const settled = await Promise.all(
        visible.map(async (layer) => {
          const key = cacheKey(layer)
          let pending = key ? cache.get(key) : null
          if (!pending) {
            pending = loadLayerData(layer)
            if (key) cache.set(key, pending)
          }
          try {
            return { layer, data: await pending }
          } catch (error) {
            // One bad layer must not blank the map; drop it and report.
            if (key) cache.delete(key)
            onError?.(error, layer)
            return null
          }
        }),
      )

      if (run === latest) resolved.value = settled.filter(Boolean)
    },
    { immediate: true, deep: false },
  )

  return resolved
}
