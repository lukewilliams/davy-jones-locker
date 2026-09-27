<script setup>
import { computed, inject, useId } from 'vue'
import { getBezierPath } from '@vue-flow/core'
import { vMenu } from '../widgets/menu/index.js'
import { WIRE_MENU } from './flowMenus.js'
import { FLOW_GRAPH } from '../lib/flowGraph.js'
import { NODE_KINDS } from '../lib/nodeKinds.js'

// A wire between two pins: a bezier curve, drawn here rather than with Vue
// Flow's BaseEdge so its default edge styles don't apply. Its colour says how
// far data has flowed, worked out afresh from both nodes' run status:
//
//   pristine  nothing has run yet                  white, 65%
//   dormant   runs have started; source not done   white
//   flowing   source done, target not              source colour -> white
//   flowed    both done                            source colour -> target colour
//
// Going from flowing to flowed, the target's colour grows out from the source
// end: the flowing gradient lies over the flowed one and slides off it (see
// .flow-wire--grow). Dashed while selected.
const props = defineProps({
  id: { type: String, required: true },
  source: { type: String, required: true },
  target: { type: String, required: true },
  selected: Boolean,
  sourceX: { type: Number, required: true },
  sourceY: { type: Number, required: true },
  sourcePosition: { type: String, required: true },
  targetX: { type: Number, required: true },
  targetY: { type: Number, required: true },
  targetPosition: { type: String, required: true },
})

const graph = inject(FLOW_GRAPH)
const path = computed(() => getBezierPath(props)[0])

const done = (id) => graph.run.status[id] === 'completed'
const state = computed(() => {
  if (!done(props.source)) return graph.run.started ? 'dormant' : 'pristine'
  return done(props.target) ? 'flowed' : 'flowing'
})

const category = (id) => `flow-node--${NODE_KINDS[graph.flow.findNode(id)?.data.kind]?.category}`

// Gradient IDs are document-wide, so each wire's are unique to it.
const uid = useId().replace(/[^\w-]/g, '')
const flowedId = `flow-wire-flowed-${uid}`
const flowingId = `flow-wire-flowing-${uid}`
</script>

<template>
  <g v-menu="{ items: WIRE_MENU, context: id }">
    <path
      v-if="state === 'pristine' || state === 'dormant'"
      class="flow-wire"
      :class="state === 'pristine' ? 'flow-wire--idle' : 'flow-wire--waiting'"
      :d="path"
    />
    <template v-else>
      <!-- Along the wire, from source to target, in canvas coordinates. -->
      <defs>
        <linearGradient
          v-for="gradient in [flowedId, flowingId]"
          :id="gradient"
          :key="gradient"
          gradientUnits="userSpaceOnUse"
          :x1="sourceX"
          :y1="sourceY"
          :x2="targetX"
          :y2="targetY"
        >
          <stop offset="0" class="flow-wire-stop-source" :class="category(source)" />
          <stop
            offset="1"
            :class="gradient === flowedId ? ['flow-wire-stop-target', category(target)] : 'flow-wire-stop-dormant'"
          />
        </linearGradient>
      </defs>
      <path class="flow-wire" :d="path" :stroke="`url(#${flowedId})`" />
      <path
        class="flow-wire flow-wire--grow"
        :class="{ 'is-complete': state === 'flowed' }"
        :d="path"
        pathLength="1"
        :stroke="`url(#${flowingId})`"
      />
    </template>

    <!-- Selected: gaps in the window's colour over whichever wire is drawn. -->
    <path v-if="selected" class="flow-wire-gaps" :d="path" />
    <!-- Wider and invisible, so the 2px wire is easy to click. -->
    <path class="flow-wire-hit" :d="path" />
  </g>
</template>
