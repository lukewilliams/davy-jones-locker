<script setup>
import { onBeforeUnmount, onMounted, ref, watch } from 'vue'
import L from 'leaflet'
import { useSpatialData } from '../useSpatialData.js'
import { combineBounds, featureBounds, resolveStyle } from '../geo.js'

const props = defineProps({
  // [{ id, format, url | data, style, visible }] — see fromRows.
  layers: { type: Array, default: () => [] },
  // [longitude, latitude]. GeoJSON order, NOT Leaflet's [lat, lng] — the same
  // prop has to serve both renderers, so one convention wins and this is it.
  center: { type: Array, default: () => [0, 0] },
  zoom: { type: Number, default: 2 },
  basemap: {
    type: Object,
    default: () => ({
      url: 'https://tile.openstreetmap.org/{z}/{x}/{y}.png',
      attribution: '© OpenStreetMap contributors',
      maxZoom: 19,
    }),
  },
  // Fit the view to the layers the first time any of them load.
  autoFit: { type: Boolean, default: true },
})

const emit = defineEmits(['error', 'ready', 'feature-click'])

const container = ref(null)

// Leaflet objects mutate themselves constantly and must never be wrapped in a
// reactive proxy, so these are plain variables rather than refs.
let map = null
const overlays = new Map()
let fitted = false

const resolved = useSpatialData(
  () => props.layers,
  (error, layer) => emit('error', error, layer),
)

function leafletStyle(style) {
  const s = resolveStyle(style)
  return {
    color: s.color,
    weight: s.weight,
    opacity: s.opacity,
    fillColor: s.fillColor,
    fillOpacity: s.fillOpacity,
  }
}

function toOverlay({ layer, data }) {
  const style = leafletStyle(layer.style)
  return L.geoJSON(data, {
    style,
    // Leaflet draws points as markers by default, which needs icon assets; a
    // circle keeps the library asset-free and matches the deck.gl renderer.
    pointToLayer: (_feature, latlng) =>
      L.circleMarker(latlng, { ...style, radius: resolveStyle(layer.style).radius }),
    onEachFeature: (feature, featureLayer) => {
      featureLayer.on('click', () => emit('feature-click', { layer, feature }))
    },
  })
}

function sync() {
  if (!map) return
  const wanted = new Map(resolved.value.map((entry) => [entry.layer.id, entry]))

  for (const [id, overlay] of overlays) {
    if (!wanted.has(id)) {
      overlay.remove()
      overlays.delete(id)
    }
  }

  for (const [id, entry] of wanted) {
    overlays.get(id)?.remove()
    const overlay = toOverlay(entry)
    overlay.addTo(map)
    overlays.set(id, overlay)
  }

  if (props.autoFit && !fitted) fit()
}

function fit() {
  const bounds = combineBounds(resolved.value.map((entry) => featureBounds(entry.data)))
  if (!map || !bounds) return
  const [[minLng, minLat], [maxLng, maxLat]] = bounds
  map.fitBounds(
    [
      [minLat, minLng],
      [maxLat, maxLng],
    ],
    { padding: [24, 24] },
  )
  fitted = true
}

onMounted(() => {
  map = L.map(container.value, { preferCanvas: true }).setView(
    [props.center[1], props.center[0]],
    props.zoom,
  )
  L.tileLayer(props.basemap.url, {
    attribution: props.basemap.attribution,
    maxZoom: props.basemap.maxZoom ?? 19,
  }).addTo(map)

  sync()
  emit('ready', map)
})

watch(resolved, sync)

onBeforeUnmount(() => {
  map?.remove()
  map = null
  overlays.clear()
})

// `fit` is exposed so the app can bind it to a button or a hotkey; `map` gives
// an escape hatch for anything this component does not wrap.
defineExpose({ fit, getMap: () => map })
</script>

<template>
  <div ref="container" class="wsp-map" />
</template>
