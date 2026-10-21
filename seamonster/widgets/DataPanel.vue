<script setup>
import { computed, inject } from 'vue'
import FlowPanel from '../components/FlowPanel.vue'
import DataTable from '../components/DataTable.vue'
import { FLOW_GRAPH } from '../lib/flowGraph.js'
import { referenceName } from '../lib/nodeKinds.js'

// The selected node's output: a page of its table (a tab per table when it has
// several, like a workbook's sheets), or where its export went. A node with
// several slots (see kindRegistry.js) has a tab per slot above those, each
// named as downstream code reads it. The pager re-runs the node for another
// page. Clicking a row picks it (the Map panel shows it).
const graph = inject(FLOW_GRAPH)
const node = graph.selectedNode
const result = computed(() => node.value && graph.run.results[node.value.id])
const running = computed(() => node.value && graph.run.status[node.value.id] === 'running')

// The open slot and table, and the picked row, are the graph store's
// (dataView), so other panels can show a row here: the open slot (null: the
// first), and the open table in it, by name; the first when it's gone.
const view = graph.dataView
const openSlot = (name) => Object.assign(view, { slot: name, table: null, row: null })
const openTable = (name) => Object.assign(view, { table: name, row: null })
const slots = computed(() =>
  result.value?.slots?.length
    ? [{ name: null, ref: referenceName(node.value.id, node.value.data) }, ...result.value.slots]
    : [],
)
const shown = computed(() => (view.slot === null ? result.value : (result.value?.slots?.find((s) => s.name === view.slot) ?? result.value)))
const table = computed(() => {
  const tables = shown.value?.tables
  return tables && (tables.find((t) => t.name === view.table) ?? tables[0])
})
const data = computed(() => shown.value?.data ?? table.value?.data)

const turnPage = (delta) => graph.turnPage(node.value.id, data.value.page + delta, table.value?.name ?? null, view.slot)

// The picked row, as a row of this page (-1 for none here); a click on it
// again unpicks it.
const pageStart = computed(() => (data.value ? data.value.page * data.value.pageSize : 0))
const picked = computed(() => (view.row === null ? -1 : view.row - pageStart.value))
const pick = (r) => (view.row = view.row === pageStart.value + r ? null : pageStart.value + r)
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
    <div v-else class="flow-data-tabs">
      <div v-if="slots.length" class="flow-tabs" role="tablist" aria-label="Outputs">
        <button
          v-for="s in slots"
          :key="s.ref"
          type="button"
          role="tab"
          class="flow-tab flow-tab--mono"
          :aria-selected="s.name === view.slot"
          @click="openSlot(s.name)"
        >
          {{ s.ref }}
        </button>
      </div>
      <!-- A script's value that isn't a table (Python). -->
      <div v-if="shown.value && shown.value.kind !== 'none'" class="flow-value">
        <p class="flow-value-type">{{ shown.value.type }}</p>
        <pre class="flow-value-text">{{
          shown.value.kind === 'json' ? JSON.stringify(shown.value.value, null, 2) : shown.value.text
        }}</pre>
      </div>
      <p v-else-if="!data" class="flow-panel-empty">
        This node's output isn't tabular — see the Terminal panel.
      </p>
      <div v-if="shown.tables" class="flow-tabs" role="tablist">
        <button
          v-for="t in shown.tables"
          :key="t.name"
          type="button"
          role="tab"
          class="flow-tab"
          :aria-selected="t === table"
          :title="t.label !== t.name ? `${t.label} (${t.name} in SQL)` : undefined"
          @click="openTable(t.name)"
        >
          {{ t.label }}
        </button>
      </div>
      <template v-if="data">
        <p v-if="!data.rowCount" class="flow-panel-empty">No rows.</p>
        <DataTable v-else :data="data" :busy="running" :picked="picked" @turn="turnPage" @pick="pick" />
      </template>
    </div>
  </FlowPanel>
</template>
