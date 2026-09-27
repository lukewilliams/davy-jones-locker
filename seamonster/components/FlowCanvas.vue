<script setup>
import { inject } from 'vue'
import { ConnectionMode, VueFlow } from '@vue-flow/core'
import { Background } from '@vue-flow/background'
// Vue Flow's structural CSS only (no default theme): Flow styles its own nodes and wires.
import '@vue-flow/core/dist/style.css'
import FlowNode from './FlowNode.vue'
import FlowWire from './FlowWire.vue'
import FlowConnectionLine from './FlowConnectionLine.vue'
import { FLOW_GRAPH } from '../lib/flowGraph.js'
import { NODE_KIND_DRAG_TYPE, NODE_KINDS } from '../lib/nodeKinds.js'

// A wire dragged from a pin was dropped on empty canvas, with
// { point: { x, y } in client coordinates, from: { nodeId, handleId, handleType } }.
const emit = defineEmits(['connection-dropped'])

// The nodes and wires come from the graph's Vue Flow store, which <VueFlow> injects.
// Nodes and wires aren't focusable, so clicking one focuses the flow window,
// and its keys (Delete, Ctrl+Z) keep working once that node is deleted.
// One thing is selected at a time (no Shift box or Ctrl multi-select): the
// Manage panel shows that node.
const graph = inject(FLOW_GRAPH)
const { onConnect, onConnectStart, onConnectEnd } = graph.flow

let from = null // the pin a wire is being dragged from
let connected = false

onConnectStart(({ nodeId, handleId, handleType }) => {
  from = { nodeId, handleId, handleType }
  connected = false
})

onConnect((connection) => {
  connected = true
  graph.connect(connection)
})

onConnectEnd((e) => {
  if (connected || !from || !e?.target?.classList?.contains('vue-flow__pane')) return
  const { clientX: x, clientY: y } = e.changedTouches?.[0] ?? e
  emit('connection-dropped', { point: { x, y }, from })
  from = null
})

// A Library card dropped on the canvas: its node lands where the card was
// held, so it appears where the dragged card was.
const isNodeKindDrag = (e) => e.dataTransfer.types.includes(NODE_KIND_DRAG_TYPE)

function onDragOver(e) {
  if (!isNodeKindDrag(e)) return
  e.preventDefault()
  e.dataTransfer.dropEffect = 'copy'
}

function onDrop(e) {
  if (!isNodeKindDrag(e)) return
  e.preventDefault()
  let drag
  try {
    drag = JSON.parse(e.dataTransfer.getData(NODE_KIND_DRAG_TYPE))
  } catch {
    return
  }
  if (!NODE_KINDS[drag?.kind]) return
  graph.addNode(drag.kind, { x: e.clientX, y: e.clientY }, drag.grab ?? undefined)
}
</script>

<template>
  <div
    class="flow-canvas-layer"
    @contextmenu="graph.setContextPoint"
    @dragover="onDragOver"
    @drop="onDrop"
  >
    <VueFlow
      :min-zoom="0.25"
      :max-zoom="2"
      :connection-mode="ConnectionMode.Strict"
      :is-valid-connection="graph.isValidConnection"
      :delete-key-code="null"
      :nodes-focusable="false"
      :edges-focusable="false"
      :selection-key-code="null"
      :multi-selection-key-code="null"
    >
      <Background class="flow-canvas-dots" :gap="24" :size="1" />

      <template #node-pipeline="{ id, data, selected }">
        <FlowNode :id="id" :data="data" :selected="selected" />
      </template>

      <template #edge-wire="wire">
        <FlowWire
          :id="wire.id"
          :source="wire.source"
          :target="wire.target"
          :selected="wire.selected"
          :source-x="wire.sourceX"
          :source-y="wire.sourceY"
          :source-position="wire.sourcePosition"
          :target-x="wire.targetX"
          :target-y="wire.targetY"
          :target-position="wire.targetPosition"
        />
      </template>

      <template #connection-line="line">
        <FlowConnectionLine
          :source-x="line.sourceX"
          :source-y="line.sourceY"
          :source-position="line.sourcePosition"
          :target-x="line.targetX"
          :target-y="line.targetY"
          :target-position="line.targetPosition"
          :source-node="line.sourceNode"
          :target-node="line.targetNode"
          :from-input="line.sourceHandle?.type === 'target'"
        />
      </template>
    </VueFlow>
  </div>
</template>
