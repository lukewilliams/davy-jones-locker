<script setup>
import { computed, inject, ref } from 'vue'
import { Handle, Position, useNodeConnections } from '@vue-flow/core'
import { vMenu } from '../widgets/menu/index.js'
import NodeFace from './NodeFace.vue'
import { kindInfo, pinCounts, pinOffsets, referenceName, runsOnServer } from '../lib/nodeKinds.js'
import { NODE_MENU } from './flowMenus.js'
import { FLOW_GRAPH } from '../lib/flowGraph.js'

const STATUS_LABELS = {
  running: 'Running…',
  completed: 'Run completed.',
  failed: 'Run failed.',
  stale: 'Stale.', // ran, but its settings or inputs have changed since
}

// A pipeline node: the category-coloured face, and its pins down each side.
const props = defineProps({
  id: { type: String, required: true },
  data: { type: Object, required: true },
  selected: Boolean,
})

const graph = inject(FLOW_GRAPH)
const kind = computed(() => kindInfo(props.data.kind))
// A node that runs on the server (PythonScript, or SQL reading tables its
// inputs don't supply) says so while the server is away, and shows a blinking
// dot while it's there.
const onServer = computed(() => runsOnServer(props.data))
const serverState = computed(() => graph.server.value.state)

// None while idle (not run since the graph was opened).
// A placeholder (a kind this app doesn't have) says so until it has run and failed.
const statusLabel = computed(() =>
  onServer.value && serverState.value === 'unavailable'
    ? 'Backend not available.'
    : (STATUS_LABELS[graph.run.status[props.id]] ?? (kind.value.unknown ? 'Not available here.' : '')),
)

// Connected pins are drawn filled.
const connections = useNodeConnections()
const connectedPins = computed(
  () => new Set(connections.value.map((c) => (c.source === props.id ? c.sourceHandle : c.targetHandle))),
)

// Every pin on this side, spaced evenly down it. A placeholder's kind doesn't
// say what pins it has, so it has the first on each side and whichever its
// wires use, in order, so every wire it was saved with still has its end.
const pins = (type) =>
  computed(() => {
    let ids
    if (kind.value.unknown) {
      const wired = connections.value
        .filter((c) => (type === 'source' ? c.source : c.target) === props.id)
        .map((c) => (type === 'source' ? c.sourceHandle : c.targetHandle))
      ids = [...new Set([`${type}-0`, ...wired])].sort((a, b) => a.localeCompare(b, undefined, { numeric: true }))
    } else {
      const { inputs, outputs } = pinCounts(props.data.kind)
      ids = Array.from({ length: type === 'target' ? inputs : outputs }, (_, i) => `${type}-${i}`)
    }
    const offsets = pinOffsets(ids.length)
    return ids.map((id, i) => ({ id, top: offsets[i] }))
  })
const inputPins = pins('target')
const outputPins = pins('source')

// Pins show while the node is hovered. Tracked here rather than with CSS :hover,
// which is unreliable on touch and hybrid devices.
const hovered = ref(false)
// Hovering an output pin shows the name downstream code reads its data by.
const hoveredOutput = ref(false)
</script>

<template>
  <div
    v-menu="{ items: NODE_MENU, context: id }"
    class="flow-node"
    :class="[`flow-node--${kind.category}`, { 'is-hovered': hovered }]"
    @pointerenter="hovered = true"
    @pointerleave="hovered = false"
  >
    <!-- A renamed node still says what kind it is. -->
    <span v-if="data.label" class="flow-node-kind">{{ kind.label }}</span>

    <NodeFace :label="data.label || kind.label" :status="statusLabel" :selected="selected" />
    <span
      v-if="onServer && serverState === 'connected'"
      class="flow-blink-dot flow-node-server-dot"
      role="img"
      aria-label="Executes on server"
      title="Executes on server"
    ></span>

    <Handle
      v-for="pin in inputPins"
      :id="pin.id"
      :key="pin.id"
      type="target"
      :position="Position.Left"
      :connectable="!kind.unknown"
      class="flow-handle flow-handle--in"
      :class="{ 'is-connected': connectedPins.has(pin.id) }"
      :style="{ top: pin.top }"
    />
    <Handle
      v-for="pin in outputPins"
      :id="pin.id"
      :key="pin.id"
      type="source"
      :position="Position.Right"
      :connectable="!kind.unknown"
      class="flow-handle flow-handle--out"
      :class="{ 'is-connected': connectedPins.has(pin.id) }"
      :style="{ top: pin.top }"
      @pointerenter="hoveredOutput = true"
      @pointerleave="hoveredOutput = false"
    />

    <span v-if="hoveredOutput" class="flow-node-ref-hint">{{ referenceName(id, data) }}</span>
  </div>
</template>
