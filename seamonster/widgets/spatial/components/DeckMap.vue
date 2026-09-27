<script setup>
import { computed, onBeforeUnmount, onMounted, ref, watch } from 'vue'
import { Deck, WebMercatorViewport } from '@deck.gl/core'
import { BitmapLayer, GeoJsonLayer } from '@deck.gl/layers'
import { TileLayer } from '@deck.gl/geo-layers'
import { useSpatialData } from '../useSpatialData.js'
import { combineBounds, featureBounds, hexToRgba, resolveStyle } from '../geo.js'

const props = defineProps({
  // [{ id, format, url | data, style, visible }] — see fromRows.
  layers: { type: Array, default: () => [] },
  // [longitude, latitude], the same convention as LeafletMap.
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
  autoFit: { type: Boolean, default: true },
})

const emit = defineEmits(['error', 'ready', 'feature-click'])

const container = ref(null)
const canvas = ref(null)

// deck.gl owns a WebGL context and mutates heavily; keep it out of reactivity.
let deck = null
let fitted = false

const resolved = useSpatialData(
  () => props.layers,
  (error, layer) => emit('error', error, layer),
)

// A raster basemap through TileLayer rather than MapLibre: deck draws it in the
// same context as the data, so there is no second map library to keep in sync
// and no extra stylesheet.
function basemapLayer() {
  return new TileLayer({
    id: 'wsp-basemap',
    data: props.basemap.url,
    minZoom: 0,
    maxZoom: props.basemap.maxZoom ?? 19,
    tileSize: 256,
    renderSubLayers: (subProps) => {
      const { boundingBox } = subProps.tile
      return new BitmapLayer(subProps, {
        data: null,
        image: subProps.data,
        bounds: [boundingBox[0][0], boundingBox[0][1], boundingBox[1][0], boundingBox[1][1]],
      })
    },
  })
}

function dataLayers() {
  return resolved.value.map(({ layer, data }) => {
    const s = resolveStyle(layer.style)
    return new GeoJsonLayer({
      id: `wsp-${layer.id}`,
      data,
      pickable: true,
      stroked: true,
      filled: true,
      getFillColor: hexToRgba(s.fillColor, s.fillOpacity),
      getLineColor: hexToRgba(s.color, s.opacity),
      getLineWidth: s.weight,
      lineWidthUnits: 'pixels',
      getPointRadius: s.radius,
      pointRadiusUnits: 'pixels',
      onClick: (info) => emit('feature-click', { layer, feature: info.object }),
    })
  })
}

const allLayers = computed(() => [basemapLayer(), ...dataLayers()])

function fit() {
  const bounds = combineBounds(resolved.value.map((entry) => featureBounds(entry.data)))
  const width = container.value?.clientWidth
  const height = container.value?.clientHeight
  if (!deck || !bounds || !width || !height) return

  // deck has no fitBounds of its own; a throwaway viewport does the maths.
  const { longitude, latitude, zoom } = new WebMercatorViewport({ width, height }).fitBounds(
    bounds,
    { padding: 24 },
  )
  deck.setProps({ initialViewState: { longitude, latitude, zoom } })
  fitted = true
}

onMounted(() => {
  deck = new Deck({
    canvas: canvas.value,
    initialViewState: {
      longitude: props.center[0],
      latitude: props.center[1],
      zoom: props.zoom,
    },
    controller: true, // pan, zoom and rotate
    layers: allLayers.value,
  })
  if (props.autoFit) fit()
  emit('ready', deck)
})

watch(allLayers, (layers) => {
  deck?.setProps({ layers })
  if (props.autoFit && !fitted) fit()
})

onBeforeUnmount(() => {
  // Releases the WebGL context; without it a remounted map leaks one each time.
  deck?.finalize()
  deck = null
})

defineExpose({ fit, getDeck: () => deck })
</script>

<template>
  <div ref="container" class="wsp-map">
    <canvas ref="canvas" class="wsp-canvas" />
    <!-- Rendered as text, never as markup: basemap terms usually require it. -->
    <div v-if="basemap.attribution" class="wsp-attribution">{{ basemap.attribution }}</div>
  </div>
</template>
