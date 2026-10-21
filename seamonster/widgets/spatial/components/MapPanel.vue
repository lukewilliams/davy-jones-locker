<script setup>
import { computed, inject, onBeforeUnmount, ref, useAttrs } from 'vue'
import FlowPanel from '../../../components/FlowPanel.vue'
import { FLOW_GRAPH } from '../../../lib/flowGraphKey.js'
import { outputAt, outputsOf } from '../../../lib/results.js'
import { fromRows } from '../adapters/fromRows.js'
import { readMapLayers } from '../mapReader.js'
import LeafletMap from './LeafletMap.vue'

// A panel for FlowgraphEditor's `panels` slot: a map of the selected node's
// geometry, and of the nodes pinned to it. Each geometry column of the node's
// output tables is drawn in longitude and latitude (EPSG:4326), or the panel
// says why it can't be (CRS unknown); a table shaped like fromRows's
// (layer_id, label, format, data or url, style, visible) draws a layer per
// row instead. Clicking a feature picks its row in Data, and picking a row in
// Data highlights its features here. The view fits the layers the first time
// there are any, and after that only when Fit is pressed.
//
// FlowPanel's props pass through (dock, aboveBottom, hotkey, title, name...).
// Pins are kept on the nodes (flowGraph's setPanelData, under the panel's
// name), so they're saved with the graph.
const props = defineProps({
  // The basemap: { url, attribution, maxZoom }. OpenStreetMap's by default
  // (LeafletMap's); its attribution is always shown.
  basemap: { type: Object, default: undefined },
  // Rows drawn per geometry column: the first ones, and a note says so.
  featureLimit: { type: Number, default: 10000 },
})

const attrs = useAttrs()
const name = attrs.name ?? 'map'
const graph = inject(FLOW_GRAPH)

// Every output table is read for the map as its node runs, while it's there.
const removeReader = graph.addOutputReader(name, (output) => readMapLayers(output, { limit: props.featureLimit }))
onBeforeUnmount(removeReader)

// The selected node is drawn in this colour, unless it's pinned; pinned nodes
// take these in turn. Both stay clear of the highlight's yellow.
const SELECTION_COLOR = '#2563eb'
const PIN_COLORS = ['#f97316', '#a855f7', '#16a34a', '#db2777', '#0891b2', '#b45309']

// The pinned nodes and the selected one, as { id, suffix } (suffix: its
// output's name). Kept as text first, so moving a node on the canvas, which
// changes the nodes, doesn't draw the map again.
const nodeKey = (n) => [n.id, n.data.outputSuffix ?? null]
const fromKey = ([id, suffix]) => ({ id, suffix })
const pinnedKey = computed(() =>
  JSON.stringify(graph.flow.nodes.value.filter((n) => n.data.panels?.[name]?.pinned).map(nodeKey)),
)
const selectedKey = computed(() => JSON.stringify(graph.selectedNode.value ? nodeKey(graph.selectedNode.value) : null))
const pinned = computed(() => JSON.parse(pinnedKey.value).map(fromKey))
const selected = computed(() => {
  const key = JSON.parse(selectedKey.value)
  return key && fromKey(key)
})
const isPinned = computed(() => !!selected.value && pinned.value.some((p) => p.id === selected.value.id))
const pinColor = (i) => PIN_COLORS[i % PIN_COLORS.length]

function setPinned(id, on) {
  graph.setPanelData(id, name, on ? { pinned: true } : null)
}

// How a node's table is read downstream: dataingest1_data.sheet1, sqlnode1_counts.
function whereOf(node, slot, table) {
  const base = `${node.id}_${slot ?? (node.suffix || 'data')}`
  return table === null ? base : `${base}.${table}`
}

// A node's layers, each with the row its features come from (`sources`, by
// layer id: { id, slot, table, row }, row null when it's the feature's id),
// and notes on what isn't drawn.
function nodeLayers(node, color) {
  const out = { layers: [], sources: new Map(), notes: [] }
  const id = node.id
  const result = graph.run.results[id]
  if (!result) {
    out.notes.push(`Run ${id} to draw it here.`)
    return out
  }
  if (result.error) {
    out.notes.push(`${id} failed, so there's nothing to draw: see the Terminal.`)
    return out
  }
  const tables = outputsOf(result)
  if (!tables.length) {
    out.notes.push(`${id}'s output isn't a table, so there's nothing to draw.`)
    return out
  }
  let unread = false
  let found = false
  for (const t of tables) {
    if (!t.extras || !(name in t.extras)) {
      unread = true
      continue
    }
    const read = t.extras[name]
    if (!read) continue
    found = true
    const where = whereOf(node, t.slot, t.table)
    const key = JSON.stringify([id, t.slot, t.table])
    if (read.error) out.notes.push(`${where}: ${read.error}`)
    if (read.rows) {
      fromRows(read.rows, { style: { color } }).forEach((layer, row) => {
        const layerId = `${key}|row ${row}`
        out.layers.push({ ...layer, id: layerId })
        out.sources.set(layerId, { id, slot: t.slot, table: t.table, row })
      })
      if (read.more) out.notes.push(`${where} has more layers than the map draws: it draws the first ${read.rows.length}.`)
    }
    for (const c of read.columns ?? []) {
      if (c.error) {
        out.notes.push(`${where}: ${c.error}`)
        continue
      }
      const layerId = `${key}|${c.name}`
      out.layers.push({ id: layerId, label: `${where}.${c.name}`, format: 'geojson', data: c.collection, style: { color } })
      out.sources.set(layerId, { id, slot: t.slot, table: t.table, row: null })
      if (c.rows > props.featureLimit) {
        out.notes.push(`${where}.${c.name}: drawing its first ${props.featureLimit.toLocaleString()} of ${c.rows.toLocaleString()} rows.`)
      }
    }
  }
  if (unread) out.notes.push(`Run ${id} again to draw it here: it ran before the map was there.`)
  else if (!found) out.notes.push(`${id}'s output has no geometry to draw.`)
  return out
}

// Pinned nodes first, in their colours, then the selected one (when it isn't
// pinned) on top.
const drawn = computed(() => {
  const parts = pinned.value.map((n, i) => ({ node: n, ...nodeLayers(n, pinColor(i)) }))
  if (selected.value && !isPinned.value) parts.push({ node: selected.value, ...nodeLayers(selected.value, SELECTION_COLOR) })
  return {
    layers: parts.flatMap((p) => p.layers),
    sources: new Map(parts.flatMap((p) => [...p.sources])),
    notes: parts.flatMap((p) => p.notes),
  }
})

const notes = computed(() =>
  !selected.value && !pinned.value.length
    ? ['Select a node whose output has geometry, or pin one, to draw it here.']
    : drawn.value.notes,
)

// Data's picked row, as features to highlight: the row's feature in each of
// its table's geometry layers, or the row's layer in a layers table.
const highlighted = computed(() => {
  const { node, slot, row } = graph.dataView
  if (node === null || row === null) return []
  const table = outputAt(graph.run.results[node], slot, graph.dataView.table)?.table ?? null
  const out = []
  for (const [layer, s] of drawn.value.sources) {
    if (s.id !== node || s.slot !== slot || s.table !== table) continue
    if (s.row === null) out.push({ layer, feature: row })
    else if (s.row === row) out.push({ layer, feature: null })
  }
  return out
})

function onFeatureClick({ layer, feature }) {
  const s = drawn.value.sources.get(layer.id)
  if (!s) return
  graph.showRow({ id: s.id, slot: s.slot, table: s.table, row: s.row ?? feature.id })
}

// The map is made again each time the panel opens: it comes back where it
// was, once it's been fitted to something.
const map = ref(null)
const view = ref(null)
function onReady(leaflet) {
  leaflet.on('moveend', () => {
    if (!drawn.value.layers.length && !view.value) return
    const c = leaflet.getCenter()
    view.value = { center: [c.lng, c.lat], zoom: leaflet.getZoom() }
  })
}
</script>

<template>
  <FlowPanel
    class="flow-map-panel"
    name="map"
    title="Map"
    dock="right"
    hotkey="P"
    :defaultSize="360"
    :minWidth="240"
    collapsed
  >
    <div class="flow-map">
      <div class="flow-map-bar">
        <button
          type="button"
          class="flow-button flow-button--quiet"
          :aria-disabled="!selected"
          :aria-pressed="isPinned"
          :title="selected ? `Keep ${selected.id} on the map while other nodes are selected` : 'Select a node to pin it'"
          @click="selected && setPinned(selected.id, !isPinned)"
        >
          {{ isPinned ? 'Unpin' : 'Pin' }}
        </button>
        <span v-for="(n, i) in pinned" :key="n.id" class="flow-map-pin">
          <button type="button" class="flow-map-pin-name" :title="`Select ${n.id}`" @click="graph.select(n.id)">
            <span class="flow-map-swatch" :style="{ background: pinColor(i) }"></span>{{ n.id }}
          </button>
          <button type="button" class="flow-map-pin-remove" :aria-label="`Unpin ${n.id}`" @click="setPinned(n.id, false)">×</button>
        </span>
        <button
          type="button"
          class="flow-button flow-button--quiet flow-map-fit"
          :aria-disabled="!drawn.layers.length"
          title="Fit the map to what's drawn"
          @click="drawn.layers.length && map?.fit()"
        >
          Fit
        </button>
      </div>
      <ul v-if="notes.length" class="flow-map-notes">
        <li v-for="note in notes" :key="note">{{ note }}</li>
      </ul>
      <div class="flow-map-view">
        <LeafletMap
          ref="map"
          :layers="drawn.layers"
          :selected="highlighted"
          :basemap="basemap"
          :center="view?.center ?? [0, 0]"
          :zoom="view?.zoom ?? 2"
          :auto-fit="!view"
          @ready="onReady"
          @feature-click="onFeatureClick"
        />
      </div>
    </div>
  </FlowPanel>
</template>

<style>
/* The Map panel: a bar (pin, pinned nodes, fit), notes, then the map filling
 * the rest of the panel. */
.flow-map {
  display: flex;
  flex-direction: column;
  gap: 0.375rem;
  height: 100%;
}

.flow-map-bar {
  display: flex;
  flex-wrap: wrap;
  align-items: center;
  gap: 0.375rem;
}

.flow-map-fit {
  margin-left: auto;
}

.flow-map-pin {
  display: inline-flex;
  align-items: center;
  border: 1px solid var(--flow-panel-border);
  border-radius: 999px;
  font-size: 11px;
}

.flow-map-pin button {
  border: 0;
  background: none;
  color: var(--flow-text-muted);
  font: inherit;
  cursor: pointer;
}

.flow-map-pin button:hover {
  color: var(--flow-text);
}

.flow-map-pin-name {
  display: inline-flex;
  align-items: center;
  gap: 0.3rem;
  padding: 0.125rem 0.125rem 0.125rem 0.5rem;
  font-family: var(--font-mono);
}

.flow-map-pin-remove {
  padding: 0.125rem 0.5rem 0.125rem 0.25rem;
}

.flow-map-swatch {
  width: 8px;
  height: 8px;
  border-radius: 50%;
}

.flow-map-notes {
  margin: 0;
  padding: 0 0.375rem;
  list-style: none;
  font-size: 12px;
  color: var(--flow-text-faint);
}

.flow-map-view {
  flex: 1;
  min-height: 0;
  overflow: hidden;
  border-radius: 0.5rem;
}
</style>
