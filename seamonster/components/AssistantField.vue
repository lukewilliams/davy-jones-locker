<script setup>
import { computed, inject, ref, useId } from 'vue'
import { FLOW_GRAPH } from '../lib/flowGraph.js'

// The AI assistant, in Manage above a node's SQL or code: a request in plain
// words, which the server's assistant turns into the node's code, straight
// into its editor (Undo puts back what was there). Nothing runs until the user
// runs it. Shown only while the server is there with an assistant set up.
// Keyed by node in NodeProperties, so a node's answer stays with it.
const EDITORS = {
  'sql-query': { field: 'sqlQuery', language: 'SQL' },
  'python-script': { field: 'pythonCode', language: 'Python' },
  javascript: { field: 'jsCode', language: 'JavaScript' },
}

const props = defineProps({
  node: { type: Object, required: true },
  code: { type: String, default: '' }, // what's in the node's editor now (its draft)
})

const graph = inject(FLOW_GRAPH)
const assistant = computed(() => graph.server.value.assistant)
const editor = computed(() => EDITORS[props.node.data.kind])

const request = ref('')
const stage = ref(null) // 'reading' or 'writing' while it asks
const note = ref('')
const error = ref('')
// What Undo puts back, while the code is still what the assistant wrote.
const undo = ref(null) // { previous, written }

const busy = computed(() => stage.value !== null)
const canAsk = computed(() => !busy.value && !!request.value.trim())
const canUndo = computed(() => !!undo.value && props.code === undo.value.written)

async function ask() {
  if (!canAsk.value) return
  const node = props.node
  const previous = props.code
  error.value = ''
  note.value = ''
  let result
  try {
    result = await graph.askAssistant(node.id, request.value.trim(), previous, (s) => (stage.value = s))
  } finally {
    stage.value = null
  }
  if (result.error) {
    error.value = result.error
    return
  }
  if (graph.flow.findNode(node.id) !== node) return // deleted while it wrote
  graph.updateData(node.id, { [editor.value.field]: result.code })
  note.value = result.note || 'Done.'
  undo.value = { previous, written: result.code }
  request.value = ''
}

function undoWrite() {
  graph.updateData(props.node.id, { [editor.value.field]: undo.value.previous })
  undo.value = null
  note.value = ''
}

// Enter asks; Shift+Enter starts a new line.
function onKeydown(e) {
  if (e.key !== 'Enter' || e.shiftKey || e.isComposing) return
  e.preventDefault()
  ask()
}

// What leaves the browser, said before it does.
const sends = computed(() => {
  const rows = assistant.value.sampleRows
  const inputs = rows > 0 ? `its inputs' columns and first ${rows} ${rows === 1 ? 'row' : 'rows'}` : "its inputs' columns"
  const database = props.node.data.kind === 'sql-query' ? ", and the server database's tables and columns," : ''
  return `Sends your request, this node's ${editor.value.language}, ${inputs}${database} to ${assistant.value.model} through the server.`
})

const uid = useId()
const ids = { request: `${uid}-request`, note: `${uid}-note` }
</script>

<template>
  <div v-if="assistant && editor" class="flow-field">
    <label class="flow-field-label" :for="ids.request">Assistant</label>
    <div class="flow-assist">
      <textarea
        :id="ids.request"
        v-model="request"
        class="flow-field-input flow-assist-input"
        rows="2"
        :placeholder="`Say what the ${editor.language} should do`"
        :aria-describedby="ids.note"
        @keydown="onKeydown"
      ></textarea>
      <button type="button" class="flow-button" :aria-disabled="!canAsk" @click="ask">
        {{ busy ? 'Writing…' : 'Write' }}
      </button>
    </div>
    <div :id="ids.note" class="flow-assist-status" aria-live="polite">
      <p v-if="busy" class="flow-field-hint">
        {{ stage === 'reading' ? 'Reading its inputs…' : `Writing with ${assistant.model}…` }}
      </p>
      <p v-else-if="error" class="flow-field-error">{{ error }}</p>
      <p v-else-if="note" class="flow-field-note">
        {{ note }}
        <button v-if="canUndo" type="button" class="flow-suggestion" @click="undoWrite">Undo</button>
      </p>
      <p class="flow-field-hint">{{ sends }} Check what it writes before you run it.</p>
    </div>
  </div>
</template>
