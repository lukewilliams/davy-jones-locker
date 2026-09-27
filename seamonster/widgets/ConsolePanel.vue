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
  <FlowPanel class="console-panel" name="console" title="Console" dock="left" hotkey="C" :default-size="280" collapsed>
    <div class="flow-console">
      <p v-if="!result" class="flow-panel-empty">
        Nothing to show yet — run a node to see its output or errors here.
      </p>
      <template v-else>
        <p v-if="stale" class="flow-console-line flow-console-note">
          This node has changed since it ran (or something upstream has). Run it again to update this.
        </p>
        <!-- What a script printed, then how it ended. -->
        <pre v-if="result.output" class="flow-console-output">{{ result.output }}</pre>
        <pre v-if="result.error" class="flow-console-error">{{ result.error }}</pre>
        <p v-else-if="result.export" class="flow-console-line">
          Wrote “{{ result.export.filename }}” ({{ result.export.contentType }}, {{ formatSize(result.export.size) }}).
        </p>
        <p v-else-if="result.tables" class="flow-console-line">
          Read {{ result.tables.length }} {{ result.tables.length === 1 ? 'table' : 'tables' }}: {{ tables(result.tables) }}.
        </p>
        <p v-else-if="result.data" class="flow-console-line">Returned {{ rows(result.data.rowCount) }}.</p>
        <p v-else-if="result.value && result.value.kind !== 'none'" class="flow-console-line">
          Returned a {{ result.value.type }} (see the Data panel).
        </p>
        <p v-else-if="!result.output" class="flow-console-line flow-console-note">(no output)</p>
      </template>
    </div>
  </FlowPanel>
</template>
