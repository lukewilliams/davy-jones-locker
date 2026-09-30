<script setup>
import { computed, inject, ref, useId, watch } from 'vue'
import { FLOW_GRAPH } from '../lib/flowGraph.js'
import { checkNode, kindInfo, referenceName, runsOnServer, withDefaults } from '../lib/nodeKinds.js'
import { FILE_FORMATS } from '../lib/fileFormats.js'
import NodeField from './NodeField.vue'
import { leaveField } from './fieldFocus.js'

// The Manage panel's fields for one node: its ID and Name, its kind's own
// fields (NodeField, from the kind's definition), Output Name, and Run.
// Text fields commit when they lose focus (or on Enter); until then they
// hold a draft, committed to the node it belongs to.
const props = defineProps({
  node: { type: Object, required: true },
})

const graph = inject(FLOW_GRAPH)
const kind = computed(() => kindInfo(props.node.data.kind))
const status = computed(() => graph.run.status[props.node.id])
const running = computed(() => status.value === 'running')
const fields = computed(() => {
  const values = withDefaults(props.node.data)
  return (kind.value.fields ?? []).filter((f) => !f.visible || f.visible(values))
})

const idDraft = ref('')
const idError = ref('')
const labelDraft = ref('')
const outputDraft = ref('')
const outputError = ref('')
// The node the drafts belong to. Commits go to it rather than props.node: a
// click on another node can select it before this field's blur commits.
let draftNode = null

// Back to the node's values when another node is selected, or when a commit
// changes them (naming a node can change its ID).
watch(
  () => {
    const { id, data } = props.node
    return [props.node, id, data.label, data.outputSuffix]
  },
  () => {
    draftNode = props.node
    idDraft.value = props.node.id
    idError.value = ''
    labelDraft.value = props.node.data.label ?? ''
    outputDraft.value = props.node.data.outputSuffix ?? ''
    outputError.value = ''
  },
  { immediate: true },
)

// The drafts' node, unless it has been deleted since.
const target = () => (graph.flow.findNode(draftNode.id) === draftNode ? draftNode : null)

function commitId() {
  if (!target()) return
  idError.value = graph.renameNode(draftNode.id, idDraft.value) ?? ''
  if (!idError.value) idDraft.value = draftNode.id
}

function commitLabel() {
  if (target()) graph.setLabel(draftNode.id, labelDraft.value)
}

function commitOutput() {
  if (!target()) return
  outputError.value = graph.setOutputName(draftNode.id, outputDraft.value) ?? ''
  if (!outputError.value) outputDraft.value = draftNode.data.outputSuffix ?? '' // as cleaned up
}

// How downstream nodes read this node: by its reference name, or for several
// tables (a workbook's sheets), each as <reference name>.<table>.
const reference = computed(() => {
  const name = referenceName(props.node.id, props.node.data)
  const ingest = props.node.data.ingest
  if (!ingest || !FILE_FORMATS[ingest.format].multi) return `this node's data as “${name}”`
  const tables = ingest.tables.map((t) => `“${name}.${t.name}”`)
  return `this node's tables as ${tables.slice(0, 3).join(', ')}${tables.length > 3 ? ', …' : ''}`
})

// ---- Running ----

// Auto Run is on unless turned off; only "off" is stored.
const autoRun = computed(() => props.node.data.autoRun !== false)
const setAutoRun = (e) => graph.updateData(props.node.id, { autoRun: e.target.checked ? undefined : false })

// Runs on the server: PythonScript, or SQL reading tables its inputs don't supply.
const serverTables = computed(() => props.node.data.sqlServerTables ?? [])
const onServer = computed(() => runsOnServer(props.node.data))
const server = graph.server
const serverMissing = computed(() => onServer.value && server.value.state !== 'connected')

// Why it can't run now, if it can't: its kind's say (DataIngest with no file
// yet), or a field's error (shown by the field too).
const blocked = computed(() => {
  if (kind.value.canRun) {
    const reason = kind.value.canRun(withDefaults(props.node.data))
    if (reason) return reason
  }
  const error = checkNode(props.node.data).find((p) => p.severity === 'error')
  return error ? `${error.label}: ${error.message}` : null
})
const canRun = computed(
  () => !running.value && !graph.reading.has(props.node.id) && !serverMissing.value && !blocked.value,
)
const runHint = computed(() => kind.value.runHint ?? 'Results land in the Data panel; errors show in the Terminal panel.')

const uid = useId()
const ids = {
  id: `${uid}-id`, idNote: `${uid}-id-note`, label: `${uid}-label`, output: `${uid}-output`, outputNote: `${uid}-output-note`,
}
</script>

<template>
  <div class="flow-props">
    <div class="flow-field">
      <label class="flow-field-label" :for="ids.id">ID</label>
      <input
        :id="ids.id"
        v-model="idDraft"
        class="flow-field-input flow-field-input--mono"
        :class="{ 'is-invalid': idError }"
        :aria-invalid="!!idError"
        :aria-describedby="ids.idNote"
        spellcheck="false"
        autocomplete="off"
        @input="idError = ''"
        @blur="commitId"
        @keydown.enter="leaveField"
      />
      <div :id="ids.idNote">
        <p v-if="idError" class="flow-field-error">{{ idError }}</p>
        <p class="flow-field-hint">
          Downstream nodes reference {{ reference }}. Renaming doesn't update that text inside other
          nodes' queries or code — you'll need to update those yourself.
        </p>
      </div>
    </div>

    <div class="flow-field">
      <label class="flow-field-label" :for="ids.label">Name</label>
      <input
        :id="ids.label"
        v-model="labelDraft"
        class="flow-field-input"
        :placeholder="kind.label"
        autocomplete="off"
        @blur="commitLabel"
        @keydown.enter="leaveField"
      />
    </div>

    <!-- The kind's own fields: its SQL or code (with the AI assistant above
         it), its file, its settings. -->
    <NodeField v-for="(field, i) in fields" :key="field.key ?? `custom-${i}`" :node="node" :field="field" />

    <div v-if="kind.outputName" class="flow-field">
      <label class="flow-field-label" :for="ids.output">Output Name</label>
      <div class="flow-field-prefixed">
        <span class="flow-field-prefix" aria-hidden="true">{{ node.id }}_</span>
        <input
          :id="ids.output"
          v-model="outputDraft"
          class="flow-field-input flow-field-input--mono"
          :class="{ 'is-invalid': outputError }"
          placeholder="data"
          spellcheck="false"
          autocomplete="off"
          :aria-invalid="!!outputError"
          :aria-describedby="ids.outputNote"
          @input="outputError = ''"
          @blur="commitOutput"
          @keydown.enter="leaveField"
        />
      </div>
      <p v-if="outputError" :id="ids.outputNote" class="flow-field-error">{{ outputError }}</p>
    </div>

    <template v-if="kind.runs">
      <p v-if="onServer" class="flow-field-note" :class="{ 'is-warning': serverMissing }">
        <template v-if="serverTables.length">
          Reads {{ serverTables.join(', ') }} from the server, so it runs there:
        </template>
        <template v-else>Runs on the server:</template>
        running this node sends its input data to the server{{
          server.state === 'connected' && server.address ? ` at ${server.address}` : ''
        }} to complete.
        <template v-if="serverMissing">The server isn't available, so it can't run now.</template>
      </p>
      <label class="flow-field-check">
        Auto Run
        <input type="checkbox" :checked="autoRun" @change="setAutoRun" />
      </label>
      <div class="flow-field">
        <div class="flow-actions">
          <button
            type="button"
            class="flow-button flow-button--wide"
            :aria-disabled="!canRun"
            @click="canRun && graph.runNode(node.id)"
          >
            {{ running ? 'Running…' : 'Run' }}
          </button>
          <button
            v-if="status && !running"
            type="button"
            class="flow-button flow-button--quiet"
            title="Back to not run: clears its status and output"
            @click="graph.resetNode(node.id)"
          >
            Reset
          </button>
        </div>
        <p class="flow-field-hint">{{ blocked ?? runHint }}</p>
      </div>
    </template>
    <p v-else-if="kind.unknown" class="flow-field-note is-warning">
      This node is a {{ node.data.kind }} node, which isn't available here: it was made in another app, or
      with a plugin this app doesn't install, or its kind comes from a server that isn't connected. It can't run
      or take new wires here, but it keeps its settings and wires, and saving the graph keeps it as it was.
    </p>
    <p v-else class="flow-field-hint">No editable properties yet for this node kind.</p>
  </div>
</template>
