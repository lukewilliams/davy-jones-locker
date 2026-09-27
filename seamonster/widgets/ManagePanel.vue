<script setup>
import { inject } from 'vue'
import FlowPanel from '../components/FlowPanel.vue'
import NodeProperties from '../components/NodeProperties.vue'
import { FLOW_GRAPH } from '../lib/flowGraph.js'

// The selected node's properties.
const graph = inject(FLOW_GRAPH)
</script>

<template>
  <!-- Renders as <section class="flow-panel manage-panel"> so shared panel rules
       target .flow-panel and panel-specific rules target .manage-panel. -->
  <FlowPanel class="manage-panel" name="manage" title="Manage" dock="right" hotkey="M">
    <NodeProperties v-if="graph.selectedNode.value" :node="graph.selectedNode.value" />
    <p v-else class="flow-panel-empty">Select a node to see its properties.</p>
  </FlowPanel>
</template>
