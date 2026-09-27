<script setup>
import { computed, inject, useId } from 'vue'
import { getBezierPath } from '@vue-flow/core'
import { FLOW_GRAPH } from '../lib/flowGraph.js'
import { NODE_KINDS } from '../lib/nodeKinds.js'

// The wire being dragged from a pin. Silver, unless the node at its output end
// has run: then that node's colour, to the colour of the input it's over (or
// white while it's over nothing).
const props = defineProps({
  sourceX: { type: Number, required: true },
  sourceY: { type: Number, required: true },
  sourcePosition: { type: String, required: true },
  targetX: { type: Number, required: true },
  targetY: { type: Number, required: true },
  targetPosition: { type: String, required: true },
  // The node dragged from, and the node under the pointer's pin, if any.
  sourceNode: { type: Object, default: null },
  targetNode: { type: Object, default: null },
  // Dragged backwards from an input pin: the output end is the pointer.
  fromInput: Boolean,
})

const graph = inject(FLOW_GRAPH)
const path = computed(() => getBezierPath(props)[0])

// The gradient runs from the output end to the input end.
const ends = computed(() => {
  const pin = { x: props.sourceX, y: props.sourceY }
  const pointer = { x: props.targetX, y: props.targetY }
  return props.fromInput ? [pointer, pin] : [pin, pointer]
})

const category = (node) => `flow-node--${NODE_KINDS[node.data.kind].category}`
const stops = computed(() => {
  const [output, input] = props.fromInput ? [props.targetNode, props.sourceNode] : [props.sourceNode, props.targetNode]
  if (!output || graph.run.status[output.id] !== 'completed') {
    return ['flow-connection-line-from', 'flow-connection-line-to']
  }
  return [
    ['flow-wire-stop-source', category(output)],
    input ? ['flow-wire-stop-target', category(input)] : 'flow-wire-stop-dormant',
  ]
})

const gradientId = `flow-connection-line-${useId().replace(/[^\w-]/g, '')}`
</script>

<template>
  <defs>
    <!-- In canvas coordinates, so it follows the drag. -->
    <linearGradient
      :id="gradientId"
      gradientUnits="userSpaceOnUse"
      :x1="ends[0].x"
      :y1="ends[0].y"
      :x2="ends[1].x"
      :y2="ends[1].y"
    >
      <stop offset="0" :class="stops[0]" />
      <stop offset="1" :class="stops[1]" />
    </linearGradient>
  </defs>
  <path class="flow-wire flow-connection-line" :d="path" :stroke="`url(#${gradientId})`" />
</template>
