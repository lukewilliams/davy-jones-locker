<script setup>
import { onBeforeUnmount, onMounted, ref, watch } from 'vue'
import L from 'leaflet'
import { useSpatialData } from '../useSpatialData.js'
import { combineBounds, featureBounds, resolveStyle, SELECTED_STYLE } from '../geo.js'

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
  // Features to highlight: [{ layer, feature }], a layer's id and a feature's
  // GeoJSON `id` (null for every feature in the layer). Changing it restyles
  // them without drawing the layers again.
  selected: { type: Array, default: () => [] },
  selectedStyle: { type: Object, default: () => SELECTED_STYLE },
})

const emit = defineEmits(['error', 'ready', 'feature-click'])

const container = ref(null)

// Leaflet objects mutate themselves constantly and must never be wrapped in a
// reactive proxy, so these are plain variables rather than refs.
let map = null
let resizer = null
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

  highlight()
  if (props.autoFit && !fitted) fit()
}

// Restyle the highlighted features: those in `selected` take selectedStyle
// and come to the front; the ones before go back to their layer's style.
// One newly highlighted that's out of view is panned to.
let highlighted = []
function highlight({ pan = false } = {}) {
  for (const { overlay, featureLayer } of highlighted) overlay.resetStyle(featureLayer)
  highlighted = []
  const style = leafletStyle(props.selectedStyle)
  for (const { layer, feature } of props.selected) {
    const overlay = overlays.get(layer)
    overlay?.eachLayer((featureLayer) => {
      if (feature !== null && feature !== undefined && featureLayer.feature?.id !== feature) return
      featureLayer.setStyle(style)
      featureLayer.bringToFront()
      highlighted.push({ overlay, featureLayer })
    })
  }
  if (!pan || !map || !highlighted.length) return
  const bounds = L.latLngBounds([])
  for (const { featureLayer } of highlighted) bounds.extend(featureLayer.getBounds?.() ?? featureLayer.getLatLng())
  if (bounds.isValid() && !map.getBounds().intersects(bounds)) map.panTo(bounds.getCenter())
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
  // Leaflet sizes itself once; a container that resizes (a panel) needs telling.
  resizer = new ResizeObserver(() => map?.invalidateSize())
  resizer.observe(container.value)
  emit('ready', map)
})

watch(resolved, sync)
watch(
  () => props.selected,
  () => highlight({ pan: true }),
)

onBeforeUnmount(() => {
  resizer?.disconnect()
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
