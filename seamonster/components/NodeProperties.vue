<script setup>
import { computed, inject, ref, useId, watch } from 'vue'
import { FLOW_GRAPH } from '../lib/flowGraph.js'
import { kindInfo, referenceName, runsOnServer } from '../lib/nodeKinds.js'
import { OPEN_MENU } from './flowMenus.js'
import AssistantField from './AssistantField.vue'
import {
  FILE_FORMATS, READABLE_EXTENSIONS, formatFromName, formatSize, nameFromFile,
  readableFormats, withExtension, writableFormats,
} from '../lib/fileFormats.js'

// The Manage panel's fields for one node. Text fields commit when they lose
// focus (or on Enter; Ctrl+Enter in SQL also runs the node); until then they
// hold a draft. Checkboxes, selects and files commit straight away.
const props = defineProps({
  node: { type: Object, required: true },
})

const graph = inject(FLOW_GRAPH)
const kind = computed(() => kindInfo(props.node.data.kind))
const status = computed(() => graph.run.status[props.node.id])
const running = computed(() => status.value === 'running')

const idDraft = ref('')
const idError = ref('')
const labelDraft = ref('')
const outputDraft = ref('')
const sqlDraft = ref('')
const jsDraft = ref('')
const pyDraft = ref('')
const inputDraft = ref('')
const filenameDraft = ref('')
const fileError = ref('')
const reading = ref(false)
// The node the drafts belong to. Commits go to it rather than props.node: a
// click on another node can select it before this field's blur commits.
let draftNode = null

// Back to the node's values when another node is selected, or when a commit
// changes them (naming a node can change its ID).
watch(
  () => {
    const { id, data } = props.node
    return [
      props.node, id, data.label, data.outputSuffix, data.sqlQuery, data.jsCode, data.pythonCode,
      data.exportInput, data.exportFilename,
    ]
  },
  ([node], [previous] = []) => {
    draftNode = props.node
    idDraft.value = props.node.id
    idError.value = ''
    labelDraft.value = props.node.data.label ?? ''
    outputDraft.value = props.node.data.outputSuffix ?? ''
    sqlDraft.value = props.node.data.sqlQuery ?? ''
    jsDraft.value = props.node.data.jsCode ?? ''
    pyDraft.value = props.node.data.pythonCode ?? ''
    inputDraft.value = props.node.data.exportInput ?? ''
    filenameDraft.value = props.node.data.exportFilename ?? ''
    if (node !== previous) fileError.value = ''
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
  graph.setOutputName(draftNode.id, outputDraft.value)
  outputDraft.value = draftNode.data.outputSuffix ?? '' // as cleaned up
}

function commitSql() {
  if (target()) graph.updateData(draftNode.id, { sqlQuery: sqlDraft.value })
}

function commitSqlAndRun() {
  commitSql()
  if (target()) graph.runNode(draftNode.id)
}

function commitJs() {
  if (target()) graph.updateData(draftNode.id, { jsCode: jsDraft.value })
}

function commitJsAndRun() {
  commitJs()
  if (target()) graph.runNode(draftNode.id)
}

function commitPy() {
  if (target()) graph.updateData(draftNode.id, { pythonCode: pyDraft.value })
}

function commitPyAndRun() {
  commitPy()
  if (target()) graph.runNode(draftNode.id)
}

function commitInput() {
  if (target()) graph.updateData(draftNode.id, { exportInput: inputDraft.value.trim() || undefined })
}

function commitFilename() {
  if (target()) graph.updateData(draftNode.id, { exportFilename: filenameDraft.value.trim() || undefined })
}

// What's in this node's code editor, for the AI assistant.
const codeDraft = computed(() => ({ 'sql-query': sqlDraft, 'python-script': pyDraft, javascript: jsDraft })[props.node.data.kind]?.value ?? '')

// How downstream nodes read this node: by its reference name, or for several
// tables (a workbook's sheets), each as <reference name>.<table>.
const reference = computed(() => {
  const name = referenceName(props.node.id, props.node.data)
  const ingest = props.node.data.ingest
  if (!ingest || !FILE_FORMATS[ingest.format].multi) return `this node's data as “${name}”`
  const tables = ingest.tables.map((t) => `“${name}.${t.name}”`)
  return `this node's tables as ${tables.slice(0, 3).join(', ')}${tables.length > 3 ? ', …' : ''}`
})

// ---- DataIngest ----

const ingest = computed(() => props.node.data.ingest)
const detectedFormat = computed(() => ingest.value && formatFromName(ingest.value.fileName))

const fileSummary = computed(() => {
  const { fileName, fileSize, format, tables } = ingest.value
  const rows = (n) => `${n.toLocaleString()} ${n === 1 ? 'row' : 'rows'}`
  const count = FILE_FORMATS[format].multi
    ? `${tables.length} ${format === 'xlsx' ? 'sheets' : 'tables'}, ${rows(tables.reduce((n, t) => n + t.rowCount, 0))}`
    : rows(tables[0]?.rowCount ?? 0)
  return `${fileName} · ${formatSize(fileSize)} · ${FILE_FORMATS[format].label}, ${count}`
})

// "sales_2024.csv" suggests naming the node "sales 2024", until it's named.
const suggestedName = computed(() => ingest.value && !props.node.data.label && nameFromFile(ingest.value.fileName))

async function readWith(action) {
  const node = props.node
  reading.value = true
  fileError.value = ''
  try {
    const error = await action()
    if (props.node === node) fileError.value = error ?? ''
  } finally {
    reading.value = false
  }
}

function onFile(e) {
  const file = e.target.files[0]
  e.target.value = '' // so choosing the same file again reads it again
  if (file) readWith(() => graph.chooseFile(props.node.id, file))
}

const onIngestFormat = (e) => readWith(() => graph.setIngestFormat(props.node.id, e.target.value))

// ---- DataExport ----

// The nodes wired in, by name (and their tables, when they have several), with
// their category, for the Input field: shown once more than one is wired in,
// or it has a value to clear.
const wiredInputs = computed(() => {
  const ids = new Set(graph.flow.edges.value.filter((e) => e.target === props.node.id).map((e) => e.source))
  return [...ids].map((id) => graph.flow.findNode(id)).filter(Boolean).flatMap((source) => {
    const name = referenceName(source.id, source.data)
    const category = kindInfo(source.data.kind).category
    const tables = source.data.ingest && FILE_FORMATS[source.data.ingest.format].multi ? source.data.ingest.tables : []
    return [{ name, category }, ...tables.map((t) => ({ name: `${name}.${t.name}`, category, table: true }))]
  })
})
const showInput = computed(() => wiredInputs.value.filter((i) => !i.table).length > 1 || !!props.node.data.exportInput)

// The Input field's list: an editor menu under the field, badged by category like
// the canvas's node menus.
const openMenu = inject(OPEN_MENU)
const inputField = ref(null)
function pickInput() {
  const box = inputField.value.getBoundingClientRect()
  openMenu({ x: box.left, y: box.bottom + 4 }, {
    items: wiredInputs.value.map(({ name, category }) => ({
      label: name,
      badge: { class: `flow-node--${category}` },
      action: () => {
        inputDraft.value = name
        commitInput()
      },
    })),
  })
}

const exportFormat = computed(() => props.node.data.exportFormat ?? '')
const exportFilename = computed(() => {
  const typed = filenameDraft.value.trim() || 'export'
  return withExtension(typed, exportFormat.value || formatFromName(typed) || 'csv')
})
const setExportFormat = (e) => graph.updateData(props.node.id, { exportFormat: e.target.value || undefined })

// ---- Running ----

// Auto Run is on unless turned off; only "off" is stored.
const autoRun = computed(() => props.node.data.autoRun !== false)
const setAutoRun = (e) => graph.updateData(props.node.id, { autoRun: e.target.checked ? undefined : false })

// A kind that runs only on the server needs it to be there.
// Runs on the server: PythonScript, or SQL reading tables its inputs don't supply.
const serverTables = computed(() => props.node.data.sqlServerTables ?? [])
const onServer = computed(() => runsOnServer(props.node.data))
const server = graph.server
const serverMissing = computed(() => onServer.value && server.value.state !== 'connected')

const canRun = computed(
  () => !running.value && !reading.value && !serverMissing.value &&
    (props.node.data.kind !== 'data-ingest' || !!ingest.value),
)
const runHint = computed(() =>
  props.node.data.kind === 'data-export'
    ? "Writes whatever's wired into this node on Run. Downloads to your computer immediately; errors show in the Terminal panel."
    : 'Results land in the Data panel; errors show in the Terminal panel.',
)

// Enter commits a field by leaving it for the flow window (not the page, which
// would take the editor's keys with it).
function blur(e) {
  const flowWindow = e.target.parentElement.closest('[tabindex]')
  if (flowWindow) flowWindow.focus()
  else e.target.blur()
}

const uid = useId()
const ids = {
  id: `${uid}-id`, idNote: `${uid}-id-note`, label: `${uid}-label`, sql: `${uid}-sql`,
  output: `${uid}-output`, file: `${uid}-file`, fileNote: `${uid}-file-note`,
  format: `${uid}-format`, filename: `${uid}-filename`, filenameNote: `${uid}-filename-note`,
  js: `${uid}-js`, py: `${uid}-py`, input: `${uid}-input`, inputNote: `${uid}-input-note`,
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
        @keydown.enter="blur"
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
        @keydown.enter="blur"
      />
    </div>

    <!-- The AI assistant, above the SQL or code it writes (when the server has one). -->
    <AssistantField :key="node.id" :node="node" :code="codeDraft" />

    <!-- SQLQuery -->
    <div v-if="node.data.kind === 'sql-query'" class="flow-field">
      <label class="flow-field-label" :for="ids.sql">SQL</label>
      <textarea
        :id="ids.sql"
        v-model="sqlDraft"
        class="flow-field-input flow-field-input--mono flow-field-code"
        rows="8"
        spellcheck="false"
        placeholder="SELECT * FROM upstream_node_data"
        @blur="commitSql"
        @keydown.ctrl.enter.prevent="commitSqlAndRun"
        @keydown.meta.enter.prevent="commitSqlAndRun"
      ></textarea>
      <p class="flow-field-hint">
        DuckDB SQL. A node wired in is a table named by its output, like <code>sqlnode1_data</code>, and the
        query runs here. Read any other table and it runs on the server, over its database (<code>db</code>;
        plain names look in its <code>public</code> schema) and the nodes wired in. Ctrl+Enter runs.
      </p>
    </div>

    <!-- PythonScript: runs on the server, in its sandbox. -->
    <div v-if="node.data.kind === 'python-script'" class="flow-field">
      <label class="flow-field-label" :for="ids.py">Python</label>
      <textarea
        :id="ids.py"
        v-model="pyDraft"
        class="flow-field-input flow-field-input--mono flow-field-code"
        rows="8"
        spellcheck="false"
        placeholder="upstream_node_data.groupby('region').sum()"
        @blur="commitPy"
        @keydown.ctrl.enter.prevent="commitPyAndRun"
        @keydown.meta.enter.prevent="commitPyAndRun"
      ></textarea>
      <p class="flow-field-hint">
        Each node wired in is a pandas DataFrame named by its output, like <code>sqlnode1_data</code> (several
        tables: <code>dataingest1_data.sheet1</code>). The last line's value is this node's output: a DataFrame
        as its table, anything else shown as a value. <code>print</code> shows in the Terminal; <code>sleep(seconds)</code>
        waits. Ctrl+Enter runs.
      </p>
    </div>

    <!-- JavaScript: runs in a sandbox in this browser (jsSandbox.js). -->
    <div v-if="node.data.kind === 'javascript'" class="flow-field">
      <label class="flow-field-label" :for="ids.js">JavaScript</label>
      <textarea
        :id="ids.js"
        v-model="jsDraft"
        class="flow-field-input flow-field-input--mono flow-field-code"
        rows="8"
        spellcheck="false"
        placeholder="return upstream_node_data.filter((row) => row.amount > 10)"
        @blur="commitJs"
        @keydown.ctrl.enter.prevent="commitJsAndRun"
        @keydown.meta.enter.prevent="commitJsAndRun"
      ></textarea>
      <p class="flow-field-hint">
        Each node wired in is a variable named by its output, like <code>sqlnode1_data</code>: an array of rows
        (objects), or an object of them for several tables (<code>dataingest1_data.sheet1</code>). Return an array
        of rows to output a table. <code>console.log</code> and <code>print</code> show in the Console;
        <code>await sleep(seconds)</code> waits. Runs in a sandbox in this browser, with no access to this page,
        and stops after 30 seconds. Ctrl+Enter runs.
      </p>
    </div>

    <!-- DataIngest: the file is read when it's chosen; its data is kept, not the file. -->
    <template v-if="node.data.kind === 'data-ingest'">
      <div class="flow-field">
        <span class="flow-field-label">File</span>
        <label class="flow-file" :class="{ 'is-busy': reading }">
          <input
            :id="ids.file"
            type="file"
            class="flow-file-input"
            :accept="READABLE_EXTENSIONS"
            :disabled="reading"
            :aria-describedby="ids.fileNote"
            @change="onFile"
          />
          {{ reading ? 'Reading…' : ingest ? 'Choose another file…' : 'Choose file…' }}
        </label>
        <div :id="ids.fileNote">
          <p v-if="fileError" class="flow-field-error">{{ fileError }}</p>
          <p v-if="ingest" class="flow-field-hint">{{ fileSummary }}</p>
          <p v-else class="flow-field-hint">
            CSV, TSV, JSON, GeoJSON, Parquet, Excel (.xlsx) or SQLite. Its data is read and kept;
            the file itself isn't.
          </p>
        </div>
        <button
          v-if="suggestedName"
          type="button"
          class="flow-suggestion"
          @click="graph.setLabel(node.id, suggestedName)"
        >
          Rename to “{{ suggestedName }}” to match {{ ingest.fileName }}?
        </button>
      </div>

      <div class="flow-field">
        <label class="flow-field-label" :for="ids.format">File Type</label>
        <select
          :id="ids.format"
          class="flow-field-input flow-field-select"
          :value="node.data.ingestFormat ?? ''"
          :disabled="reading"
          @change="onIngestFormat"
        >
          <option value="">
            From file name{{ detectedFormat ? ` (${FILE_FORMATS[detectedFormat].label})` : '' }}
          </option>
          <option v-for="f in readableFormats" :key="f" :value="f">{{ FILE_FORMATS[f].label }}</option>
        </select>
      </div>
    </template>

    <!-- DataExport -->
    <template v-if="node.data.kind === 'data-export'">
      <div v-if="showInput" class="flow-field">
        <label class="flow-field-label" :for="ids.input">Input</label>
        <div ref="inputField" class="flow-field-combo">
          <input
            :id="ids.input"
            v-model="inputDraft"
            class="flow-field-input flow-field-input--mono"
            :placeholder="wiredInputs[0]?.name ?? ''"
            autocomplete="off"
            spellcheck="false"
            :aria-describedby="ids.inputNote"
            @blur="commitInput"
            @keydown.enter="blur"
            @keydown.alt.down.prevent="pickInput"
          />
          <button
            type="button"
            class="flow-field-combo-button"
            aria-label="Choose from the nodes wired in"
            aria-haspopup="menu"
            @click="pickInput"
          >
            <svg viewBox="0 0 12 12" aria-hidden="true"><path d="M3 4.5 6 7.5 9 4.5" /></svg>
          </button>
        </div>
        <p :id="ids.inputNote" class="flow-field-hint">
          Several nodes are wired in: name the one to write, by its output (like
          <code>{{ wiredInputs[0]?.name }}</code>), or choose it from the list. Left empty, it only runs with
          one wired in.
        </p>
      </div>

      <div class="flow-field">
        <label class="flow-field-label" :for="ids.filename">Filename</label>
        <input
          :id="ids.filename"
          v-model="filenameDraft"
          class="flow-field-input"
          placeholder="export"
          autocomplete="off"
          spellcheck="false"
          :aria-describedby="ids.filenameNote"
          @blur="commitFilename"
          @keydown.enter="blur"
        />
        <p :id="ids.filenameNote" class="flow-field-hint">Saves as {{ exportFilename }}</p>
      </div>

      <div class="flow-field">
        <label class="flow-field-label" :for="ids.format">File Type</label>
        <select
          :id="ids.format"
          class="flow-field-input flow-field-select"
          :value="exportFormat"
          @change="setExportFormat"
        >
          <option value="">From file name (CSV if none)</option>
          <option v-for="f in writableFormats" :key="f" :value="f">{{ FILE_FORMATS[f].label }}</option>
        </select>
      </div>
    </template>

    <div v-if="kind.outputName" class="flow-field">
      <label class="flow-field-label" :for="ids.output">Output Name</label>
      <div class="flow-field-prefixed">
        <span class="flow-field-prefix" aria-hidden="true">{{ node.id }}_</span>
        <input
          :id="ids.output"
          v-model="outputDraft"
          class="flow-field-input flow-field-input--mono"
          placeholder="data"
          spellcheck="false"
          autocomplete="off"
          @blur="commitOutput"
          @keydown.enter="blur"
        />
      </div>
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
        <p class="flow-field-hint">{{ runHint }}</p>
      </div>
    </template>
    <p v-else-if="kind.unknown" class="flow-field-note is-warning">
      This node is a {{ node.data.kind }} node, which this app doesn't have (it was made in another app, or
      with a plugin this app doesn't install). It can't run or take new wires here, but it keeps its settings
      and wires, and saving the graph keeps it as it was.
    </p>
    <p v-else class="flow-field-hint">No editable properties yet for this node kind.</p>
  </div>
</template>
