<script setup>
import { computed, inject } from 'vue'
import { FLOW_GRAPH } from '../lib/flowGraph.js'
import { runsOnServer } from '../lib/nodeKinds.js'

// Whether the server is there, bottom left in the window's edge gap: green
// (PythonScript's) while it's connected, blue (SQLQuery's) while nodes can only
// run here in the browser. The dot blinks only while the server is there and
// the graph has a node that runs on it (and so sends it data), like those
// nodes' own dots; otherwise it's steady. Nothing while the host is still
// checking.
const graph = inject(FLOW_GRAPH)
const status = graph.server
const connected = computed(() => status.value.state === 'connected')
const sending = computed(() => connected.value && graph.flow.nodes.value.some((n) => runsOnServer(n.data)))
</script>

<template>
  <div
    v-if="status.state !== 'checking'"
    class="flow-server-status"
    :class="connected ? 'flow-node--modify' : 'flow-node--fetch'"
    role="status"
  >
    <span class="flow-blink-dot" :class="{ 'is-steady': !sending }" aria-hidden="true"></span>
    <template v-if="connected">
      LIVE · connected to server{{ status.address ? ` ${status.address}` : '' }}
    </template>
    <template v-else>backend not available, client execution only</template>
  </div>
</template>
