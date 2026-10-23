<script setup>
import { computed, inject, nextTick, ref, watch } from 'vue'
import FlowPanel from '../components/FlowPanel.vue'
import CommandField from '../components/CommandField.vue'
import { FLOW_GRAPH } from '../lib/flowGraph.js'
import { TERMINAL_COMMANDS } from '../lib/commands.js'

// The selected node's log, or the app's when nothing is selected or the
// command field has focus (see the logs in flowGraph.js): newest at the
// bottom, kept in view as entries arrive. The command field (when the host
// gives FlowgraphEditor `terminalCommands`) runs commands into the app's log.
const graph = inject(FLOW_GRAPH)
const commands = inject(TERMINAL_COMMANDS, null)
const commanding = ref(false)
const node = computed(() => (commanding.value ? null : graph.selectedNode.value))
const entries = computed(() => (node.value ? (graph.logs.nodes[node.value.id]?.entries ?? []) : graph.logs.app))
const stale = computed(() => node.value && graph.run.status[node.value.id] === 'stale')

const ENTRY_CLASSES = {
  output: 'flow-terminal-output',
  error: 'flow-terminal-error',
  warning: 'flow-terminal-line flow-terminal-warning',
  info: 'flow-terminal-line',
  note: 'flow-terminal-line flow-terminal-note',
  command: 'flow-terminal-command',
  result: 'flow-terminal-line flow-terminal-result',
}

// Follow the end of the log while it's in view there; a switch to another
// log starts at its end.
const scroller = ref(null)
const atEnd = () => {
  const el = scroller.value
  return !el || el.scrollHeight - el.scrollTop - el.clientHeight < 24
}
watch(
  () => [node.value?.id, entries.value.at(-1)?.id, entries.value.at(-1)?.count, stale.value],
  async ([id], [previousId] = []) => {
    if (id !== previousId || atEnd()) {
      await nextTick()
      if (scroller.value) scroller.value.scrollTop = scroller.value.scrollHeight
    }
  },
  { flush: 'pre' },
)
</script>

<template>
  <FlowPanel class="terminal-panel" name="terminal" title="Terminal" dock="left" hotkey="T" :default-size="280" collapsed>
    <div :class="{ 'flow-terminal-panel': commands }">
      <div ref="scroller" class="flow-terminal">
        <p v-if="!entries.length" class="flow-panel-empty">
          Nothing to show yet — run a node to see its output or errors here.
        </p>
        <component
          :is="entry.type === 'output' || entry.type === 'error' ? 'pre' : 'p'"
          v-for="entry in entries"
          :key="entry.id"
          :class="ENTRY_CLASSES[entry.type]"
        >{{ entry.text }}<span
          v-if="entry.count > 1"
          class="flow-terminal-count"
          :title="node ? `${entry.count} times since this node last changed` : `${entry.count} times`"
        > ×{{ entry.count }}</span></component>
        <p v-if="stale && entries.length" class="flow-terminal-line flow-terminal-note">
          This node has changed since it ran (or something upstream has). Its next run starts a new log.
        </p>
      </div>
      <CommandField v-if="commands" :registry="commands" @focus="commanding = true" @blur="commanding = false" />
    </div>
  </FlowPanel>
</template>
