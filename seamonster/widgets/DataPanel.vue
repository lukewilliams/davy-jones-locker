<script setup>
import { computed, inject, ref, watch } from 'vue'
import FlowPanel from '../components/FlowPanel.vue'
import DataTable from '../components/DataTable.vue'
import { FLOW_GRAPH } from '../lib/flowGraph.js'

// The selected node's output: a page of its table (a tab per table when it has
// several, like a workbook's sheets), or where its export went. The pager
// re-runs the node for another page.
const graph = inject(FLOW_GRAPH)
const node = graph.selectedNode
const result = computed(() => node.value && graph.run.results[node.value.id])
const running = computed(() => node.value && graph.run.status[node.value.id] === 'running')

// The open tab, by table name; the first table when it's gone.
const tab = ref(null)
watch(node, () => (tab.value = null))
const table = computed(() => {
  const tables = result.value?.tables
  return tables && (tables.find((t) => t.name === tab.value) ?? tables[0])
})
const data = computed(() => result.value?.data ?? table.value?.data)

const turnPage = (delta) => graph.runNode(node.value.id, data.value.page + delta, table.value?.name ?? null)
</script>

<template>
  <FlowPanel class="data-panel" name="data" title="Data" dock="bottom" hotkey="D" :default-size="240" collapsed>
    <p v-if="!result || result.error" class="flow-panel-empty">Run a node to see its output here.</p>
    <p v-else-if="result.export && result.export.downloaded" class="flow-panel-empty">
      “{{ result.export.filename }}” was downloaded to your computer.
    </p>
    <p v-else-if="result.export" class="flow-panel-empty">
      “{{ result.export.filename }}” was written as this node ran upstream of another, not downloaded.
      Run this node to download it.
    </p>
    <!-- A script's value that isn't a table (Python). -->
    <div v-else-if="result.value && result.value.kind !== 'none'" class="flow-value">
      <p class="flow-value-type">{{ result.value.type }}</p>
      <pre class="flow-value-text">{{
        result.value.kind === 'json' ? JSON.stringify(result.value.value, null, 2) : result.value.text
      }}</pre>
    </div>
    <p v-else-if="!result.data && !result.tables" class="flow-panel-empty">
      This node's output isn't tabular — see the Console panel.
    </p>
    <div v-else class="flow-data-tabs">
      <div v-if="result.tables" class="flow-tabs" role="tablist">
        <button
          v-for="t in result.tables"
          :key="t.name"
          type="button"
          role="tab"
          class="flow-tab"
          :aria-selected="t === table"
          :title="t.label !== t.name ? `${t.label} (${t.name} in SQL)` : undefined"
          @click="tab = t.name"
        >
          {{ t.label }}
        </button>
      </div>
      <p v-if="!data.rowCount" class="flow-panel-empty">No rows.</p>
      <DataTable v-else :data="data" :busy="running" @turn="turnPage" />
    </div>
  </FlowPanel>
</template>
