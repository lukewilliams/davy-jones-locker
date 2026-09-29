<script setup>
import { computed, inject, ref, useId, watch } from 'vue'
import { FLOW_GRAPH } from '../lib/flowGraph.js'
import { checkField, withDefaults } from '../lib/nodeKinds.js'
import { formatSize } from '../lib/fileFormats.js'
import AssistantField from './AssistantField.vue'
import FieldText from './FieldText.vue'
import { leaveField } from './fieldFocus.js'

// One of a node kind's fields in Manage (see FIELD_TYPES in kindRegistry.js).
// Text, number and code fields hold a draft and commit on blur or Enter
// (Ctrl+Enter in code also runs the node); the rest commit straight away.
// Commits go to the node the draft belongs to, which may no longer be
// selected: a click on another node can select it before this field's blur.
const props = defineProps({
  node: { type: Object, required: true },
  field: { type: Object, required: true },
})

const LANGUAGES = { sql: 'SQL', python: 'Python', javascript: 'JavaScript', text: 'Text' }

const graph = inject(FLOW_GRAPH)
const drafted = computed(() => ['text', 'number', 'code'].includes(props.field.type))
const stored = computed(() => props.node.data[props.field.key])
const shown = computed(() => stored.value ?? props.field.default)

const draft = ref('')
const parseError = ref('')
const fileError = ref('')
let draftNode = null

const asText = (value) => (value === undefined || value === null ? '' : String(value))
watch(
  () => [props.node, stored.value],
  ([node], [previous] = []) => {
    draftNode = props.node
    draft.value = asText(shown.value)
    parseError.value = ''
    if (node !== previous) fileError.value = ''
  },
  { immediate: true },
)

// The draft's node, unless it has been deleted since.
const target = () => (graph.flow.findNode(draftNode.id) === draftNode ? draftNode : null)

// The value a draft stands for: text trimmed (nothing when empty), a number
// (nothing when empty; null when it isn't one), or code as typed.
function draftValue() {
  const { type } = props.field
  if (type === 'code') return draft.value
  // String(): v-model on a number input hands back a number once one's typed.
  const text = String(draft.value ?? '').trim()
  if (type === 'number') return text === '' ? undefined : Number.isFinite(Number(text)) ? Number(text) : null
  return text === '' ? undefined : text
}

function commit() {
  if (!target()) return
  const value = draftValue()
  if (value === null) {
    parseError.value = 'Enter a number.'
    return
  }
  parseError.value = ''
  graph.updateData(draftNode.id, { [props.field.key]: value })
}

function commitAndRun() {
  commit()
  if (target() && !parseError.value) graph.runNode(draftNode.id)
}

function set(value) {
  graph.updateData(props.node.id, { [props.field.key]: value })
}

async function onFile(e) {
  const file = e.target.files[0]
  e.target.value = '' // so choosing the same file again reads it again
  if (!file) return
  const node = props.node
  const error = await graph.storeFieldFile(node.id, props.field.key, file)
  if (props.node === node) fileError.value = error ?? ''
}

// What the field stands for now: the draft while typing, else what's stored.
const current = computed(() => {
  if (!drafted.value) return shown.value
  const value = draftValue()
  return value === null ? draft.value : value
})
const values = computed(() => withDefaults(props.node.data))
const problems = computed(() => (props.field.key ? checkField(props.field, current.value, values.value) : []))
const invalid = computed(() => !!parseError.value || problems.value.some((p) => p.severity === 'error'))
const hint = computed(() => {
  const { hint } = props.field
  return typeof hint === 'function' ? hint(values.value, current.value) : (hint ?? '')
})
const options = computed(() => {
  const { options } = props.field
  return (typeof options === 'function' ? options(values.value) : options) ?? []
})
const busy = computed(() => graph.reading.has(props.node.id))

const uid = useId()
const inputId = `${uid}-input`
const noteId = `${uid}-note`
</script>

<template>
  <component :is="field.component" v-if="field.type === 'custom'" :node="node" />

  <label v-else-if="field.type === 'checkbox'" class="flow-field-check">
    {{ field.label }}
    <input type="checkbox" :checked="!!shown" @change="set($event.target.checked)" />
  </label>

  <template v-else>
    <!-- The AI assistant, above the code it writes (when the server has one). -->
    <AssistantField
      v-if="field.type === 'code' && field.assistant"
      :key="node.id"
      :node="node"
      :code="draft"
      :field="field.key"
      :language="LANGUAGES[field.language] ?? 'code'"
    />

    <div class="flow-field">
      <label v-if="field.type !== 'file'" class="flow-field-label" :for="inputId">{{ field.label }}</label>
      <span v-else class="flow-field-label">{{ field.label }}</span>

      <input
        v-if="field.type === 'text' || field.type === 'number'"
        :id="inputId"
        v-model="draft"
        class="flow-field-input"
        :class="{ 'flow-field-input--mono': field.mono, 'is-invalid': invalid }"
        :type="field.type === 'number' ? 'number' : 'text'"
        :min="field.min"
        :max="field.max"
        :step="field.step"
        :placeholder="field.placeholder"
        :aria-invalid="invalid"
        :aria-describedby="noteId"
        autocomplete="off"
        spellcheck="false"
        @input="parseError = ''"
        @blur="commit"
        @keydown.enter="leaveField"
      />

      <textarea
        v-else-if="field.type === 'code'"
        :id="inputId"
        v-model="draft"
        class="flow-field-input flow-field-input--mono flow-field-code"
        :class="{ 'is-invalid': invalid }"
        :rows="field.rows ?? 8"
        spellcheck="false"
        :placeholder="field.placeholder"
        :aria-invalid="invalid"
        :aria-describedby="noteId"
        @blur="commit"
        @keydown.ctrl.enter.prevent="commitAndRun"
        @keydown.meta.enter.prevent="commitAndRun"
      ></textarea>

      <select
        v-else-if="field.type === 'select'"
        :id="inputId"
        class="flow-field-input flow-field-select"
        :class="{ 'is-invalid': invalid }"
        :value="shown ?? ''"
        :aria-describedby="noteId"
        @change="set($event.target.value === '' ? undefined : $event.target.value)"
      >
        <option v-for="o in options" :key="o.value" :value="o.value">{{ o.label }}</option>
      </select>

      <label v-else-if="field.type === 'file'" class="flow-file" :class="{ 'is-busy': busy }">
        <input
          :id="inputId"
          type="file"
          class="flow-file-input"
          :accept="field.accept"
          :disabled="busy"
          :aria-describedby="noteId"
          @change="onFile"
        />
        {{ busy ? 'Reading…' : shown ? 'Choose another file…' : 'Choose file…' }}
      </label>

      <p v-else-if="field.type === 'readonly'" :id="inputId" class="flow-field-readonly">
        {{ field.value?.(values) ?? '' }}
      </p>

      <div :id="noteId">
        <p v-if="parseError" class="flow-field-error">{{ parseError }}</p>
        <p v-if="fileError" class="flow-field-error">{{ fileError }}</p>
        <p
          v-for="p in problems"
          :key="p.message"
          :class="p.severity === 'warn' ? 'flow-field-warning' : 'flow-field-error'"
        >{{ p.message }}</p>
        <p v-if="field.type === 'file' && shown" class="flow-field-hint">
          {{ shown.fileName }} · {{ formatSize(shown.fileSize) }}
        </p>
        <p v-if="hint" class="flow-field-hint"><FieldText :text="hint" /></p>
      </div>
    </div>
  </template>
</template>
