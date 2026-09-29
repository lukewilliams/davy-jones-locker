<script setup>
import { computed, inject, ref, useId, watch } from 'vue'
import { FLOW_GRAPH } from '../lib/flowGraph.js'
import { FILE_FORMATS } from '../lib/fileFormats.js'
import { kindInfo, referenceName } from '../lib/nodeKinds.js'
import { OPEN_MENU } from './flowMenus.js'
import { leaveField } from './fieldFocus.js'

// DataExport's Input (a custom field, see builtinKinds.js): which node wired
// in to write, typed or chosen from a list. Shown once more than one is wired
// in, or it has a value to clear. It holds a draft and commits on blur or
// Enter, to the node the draft belongs to.
const props = defineProps({ node: { type: Object, required: true } })

const graph = inject(FLOW_GRAPH)
const draft = ref('')
let draftNode = null
watch(
  () => [props.node, props.node.data.exportInput],
  () => {
    draftNode = props.node
    draft.value = props.node.data.exportInput ?? ''
  },
  { immediate: true },
)

function commit() {
  if (graph.flow.findNode(draftNode.id) === draftNode) {
    graph.updateData(draftNode.id, { exportInput: draft.value.trim() || undefined })
  }
}

// The nodes wired in, by name (and their tables, when they have several), with
// their category.
const wiredInputs = computed(() => {
  const ids = new Set(graph.flow.edges.value.filter((e) => e.target === props.node.id).map((e) => e.source))
  return [...ids].map((id) => graph.flow.findNode(id)).filter(Boolean).flatMap((source) => {
    const name = referenceName(source.id, source.data)
    const category = kindInfo(source.data.kind).category
    const tables = source.data.ingest && FILE_FORMATS[source.data.ingest.format].multi ? source.data.ingest.tables : []
    return [{ name, category }, ...tables.map((t) => ({ name: `${name}.${t.name}`, category, table: true }))]
  })
})
const shown = computed(() => wiredInputs.value.filter((i) => !i.table).length > 1 || !!props.node.data.exportInput)

// The list: an editor menu under the field, badged by category like the
// canvas's node menus.
const openMenu = inject(OPEN_MENU)
const combo = ref(null)
function pick() {
  const box = combo.value.getBoundingClientRect()
  openMenu({ x: box.left, y: box.bottom + 4 }, {
    items: wiredInputs.value.map(({ name, category }) => ({
      label: name,
      badge: { class: `flow-node--${category}` },
      action: () => {
        draft.value = name
        commit()
      },
    })),
  })
}

const uid = useId()
const ids = { input: `${uid}-input`, note: `${uid}-input-note` }
</script>

<template>
  <div v-if="shown" class="flow-field">
    <label class="flow-field-label" :for="ids.input">Input</label>
    <div ref="combo" class="flow-field-combo">
      <input
        :id="ids.input"
        v-model="draft"
        class="flow-field-input flow-field-input--mono"
        :placeholder="wiredInputs[0]?.name ?? ''"
        autocomplete="off"
        spellcheck="false"
        :aria-describedby="ids.note"
        @blur="commit"
        @keydown.enter="leaveField"
        @keydown.alt.down.prevent="pick"
      />
      <button
        type="button"
        class="flow-field-combo-button"
        aria-label="Choose from the nodes wired in"
        aria-haspopup="menu"
        @click="pick"
      >
        <svg viewBox="0 0 12 12" aria-hidden="true"><path d="M3 4.5 6 7.5 9 4.5" /></svg>
      </button>
    </div>
    <p :id="ids.note" class="flow-field-hint">
      Several nodes are wired in: name the one to write, by its output (like
      <code>{{ wiredInputs[0]?.name }}</code>), or choose it from the list. Left empty, it only runs with
      one wired in.
    </p>
  </div>
</template>
