<script setup>
import { computed, inject } from 'vue'
import FlowPanel from '../components/FlowPanel.vue'
import { FLOW_GRAPH } from '../lib/flowGraph.js'
import { formatSize } from '../lib/fileFormats.js'

// The selected node's last run, as a message: its error, or what it produced.
const graph = inject(FLOW_GRAPH)
const node = graph.selectedNode
const result = computed(() => node.value && graph.run.results[node.value.id])
const stale = computed(() => node.value && graph.run.status[node.value.id] === 'stale')

const rows = (n) => `${n.toLocaleString()} ${n === 1 ? 'row' : 'rows'}`
const tables = (list) => list.map((t) => `${t.label} (${rows(t.data.rowCount)})`).join(', ')
</script>

<template>
  <FlowPanel class="terminal-panel" name="terminal" title="Terminal" dock="left" hotkey="T" :default-size="280" collapsed>
    <div class="flow-terminal">
      <p v-if="!result" class="flow-panel-empty">
        Nothing to show yet — run a node to see its output or errors here.
      </p>
      <template v-else>
        <p v-if="stale" class="flow-terminal-line flow-terminal-note">
          This node has changed since it ran (or something upstream has). Run it again to update this.
        </p>
        <!-- What a script printed, then how it ended. -->
        <pre v-if="result.output" class="flow-terminal-output">{{ result.output }}</pre>
        <pre v-if="result.error" class="flow-terminal-error">{{ result.error }}</pre>
        <p v-else-if="result.export" class="flow-terminal-line">
          Wrote “{{ result.export.filename }}” ({{ result.export.contentType }}, {{ formatSize(result.export.size) }}).
        </p>
        <p v-else-if="result.tables" class="flow-terminal-line">
          Read {{ result.tables.length }} {{ result.tables.length === 1 ? 'table' : 'tables' }}: {{ tables(result.tables) }}.
        </p>
        <p v-else-if="result.data" class="flow-terminal-line">Returned {{ rows(result.data.rowCount) }}.</p>
        <p v-else-if="result.value && result.value.kind !== 'none'" class="flow-terminal-line">
          Returned a {{ result.value.type }} (see the Data panel).
        </p>
        <p v-else-if="!result.output" class="flow-terminal-line flow-terminal-note">(no output)</p>
      </template>
    </div>
  </FlowPanel>
</template>
