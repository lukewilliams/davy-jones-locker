<script setup>
import { computed, inject, ref, useId, watch } from 'vue'
import { FLOW_GRAPH } from '../lib/flowGraph.js'
import { FILE_FORMATS, READABLE_EXTENSIONS, formatFromName, formatSize, nameFromFile, readableFormats } from '../lib/fileFormats.js'

// DataIngest's File and File Type (a custom field, see builtinKinds.js): the
// file is read when it's chosen, and its data kept, not the file. Choosing
// another File Type reads it again, if it was chosen this session.
const props = defineProps({ node: { type: Object, required: true } })

const graph = inject(FLOW_GRAPH)
const fileError = ref('')
watch(() => props.node, () => (fileError.value = ''))

const ingest = computed(() => props.node.data.ingest)
const reading = computed(() => graph.reading.has(props.node.id))
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
  fileError.value = ''
  const error = await action()
  if (props.node === node) fileError.value = error ?? ''
}

function onFile(e) {
  const file = e.target.files[0]
  e.target.value = '' // so choosing the same file again reads it again
  if (file) readWith(() => graph.chooseFile(props.node.id, file))
}

const onIngestFormat = (e) => readWith(() => graph.setIngestFormat(props.node.id, e.target.value))

const uid = useId()
const ids = { file: `${uid}-file`, fileNote: `${uid}-file-note`, format: `${uid}-format` }
</script>

<template>
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
