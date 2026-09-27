<script setup>
import { inject } from 'vue'
import FlowPanel from '../components/FlowPanel.vue'
import { FLOW_GRAPH } from '../lib/flowGraph.js'

// Running the whole graph (saving, loading and the libraries come later).
const graph = inject(FLOW_GRAPH)
</script>

<template>
  <!-- Sits above the Data panel while that's open, which runs underneath it. -->
  <FlowPanel
    class="flowgraphs-panel"
    name="flowgraphs"
    title="Flowgraphs"
    dock="left"
    hotkey="G"
    :default-size="278"
    above-bottom
    collapsed
  >
    <div class="flow-props">
      <div class="flow-field">
        <button
          type="button"
          class="flow-button"
          :aria-disabled="graph.run.executing"
          @click="graph.run.executing || graph.executeGraph()"
        >
          {{ graph.run.executing ? 'Executing…' : 'Execute Graph' }}
        </button>
        <p class="flow-field-hint">
          Runs every node with Auto Run on, and the nodes they depend on.
        </p>
      </div>
    </div>
  </FlowPanel>
</template>
