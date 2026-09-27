<script setup>
import { computed, inject, ref } from 'vue'
import { Handle, Position, useNodeConnections } from '@vue-flow/core'
import { vMenu } from '../widgets/menu/index.js'
import NodeFace from './NodeFace.vue'
import { NODE_KINDS, pinCounts, pinOffsets, referenceName, runsOnServer } from '../lib/nodeKinds.js'
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
const kind = computed(() => NODE_KINDS[props.data.kind])
// A node that runs on the server (PythonScript, or SQL reading tables its
// inputs don't supply) says so while the server is away, and shows a blinking
// dot while it's there.
const onServer = computed(() => runsOnServer(props.data))
const serverState = computed(() => graph.server.value.state)

// None while idle (not run since the graph was opened).
const statusLabel = computed(() =>
  onServer.value && serverState.value === 'unavailable'
    ? 'Backend not available.'
    : (STATUS_LABELS[graph.run.status[props.id]] ?? ''),
)

// Every pin on this side, spaced evenly down it.
const pins = (type) =>
  computed(() => {
    const { inputs, outputs } = pinCounts(props.data.kind)
    return pinOffsets(type === 'target' ? inputs : outputs).map((top, i) => ({ id: `${type}-${i}`, top }))
  })
const inputPins = pins('target')
const outputPins = pins('source')

// Connected pins are drawn filled.
const connections = useNodeConnections()
const connectedPins = computed(
  () => new Set(connections.value.map((c) => (c.source === props.id ? c.sourceHandle : c.targetHandle))),
)

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
      class="flow-handle flow-handle--out"
      :class="{ 'is-connected': connectedPins.has(pin.id) }"
      :style="{ top: pin.top }"
      @pointerenter="hoveredOutput = true"
      @pointerleave="hoveredOutput = false"
    />

    <span v-if="hoveredOutput" class="flow-node-ref-hint">{{ referenceName(id, data) }}</span>
  </div>
</template>
