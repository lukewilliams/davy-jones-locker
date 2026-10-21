<script setup>
import TerminalPanel from './TerminalPanel.vue'
import LibraryPanel from './LibraryPanel.vue'
import FlowgraphsPanel from './FlowgraphsPanel.vue'
import DataPanel from './DataPanel.vue'
import ManagePanel from './ManagePanel.vue'

// The editor's own panels, in their usual order: what FlowgraphEditor shows
// unless the host fills its `panels` slot. A host that adds panels of its own
// puts this in the slot to keep these beside them.
</script>

<template>
  <!-- Linked left panels sit side by side in this order. -->
  <TerminalPanel />
  <LibraryPanel />
  <FlowgraphsPanel />
  <DataPanel />
  <ManagePanel />
</template>
