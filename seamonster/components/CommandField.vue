<script setup>
import { computed, inject, nextTick, ref, useId } from 'vue'
import { FLOW_GRAPH } from '../lib/flowGraph.js'
import { completions, runCommand } from '../lib/commands.js'

// The Terminal's command field (roadmap 8f; commands.js has the commands).
// Enter runs what's typed, into the app's log: the command right-aligned, what
// it printed under it. Completing: the only match shows after what's typed
// (ghost text; Tab or Enter takes it); with several, once 3 characters are
// typed (or after =), a list opens above the field: Up and Down move, Enter
// or a click picks, Right goes into a namespace and Left back out, Escape
// closes it. Up and Down with the list closed go through this session's
// commands (a secret's value isn't kept). Escape in the field goes back to the
// window. Focus stays in the field throughout: it's an ARIA combobox.
const props = defineProps({ registry: { type: Object, required: true } })
const emit = defineEmits(['focus', 'blur'])

const graph = inject(FLOW_GRAPH)
const input = ref(null)
const text = ref('')
const focused = ref(false)
const listOpen = ref(true) // false after Escape, until the next keystroke
const active = ref(-1)
const busy = ref(false)
const history = []
let historyAt = null // index into history while going through it
let draft = '' // what was typed before going through history

const found = computed(() => completions(props.registry, text.value))
const items = computed(() => found.value.items)
const showList = computed(
  () => focused.value && listOpen.value && items.value.length > 1 && (text.value.trim().length >= 3 || text.value.includes('=')),
)
const ghost = computed(() => (focused.value && historyAt === null ? found.value.ghost : ''))

const uid = useId()
const listId = `${uid}-list`
const optionId = (i) => `${uid}-option-${i}`

function caretToEnd() {
  nextTick(() => {
    const el = input.value
    if (el) el.setSelectionRange(el.value.length, el.value.length)
  })
}

function take(insert) {
  text.value = insert
  active.value = -1
  listOpen.value = true
  caretToEnd()
}

function onInput() {
  listOpen.value = true
  active.value = -1
  historyAt = null
}

function recall(step) {
  if (!history.length) return
  if (historyAt === null) {
    if (step > 0) return
    draft = text.value
    historyAt = history.length
  }
  historyAt = Math.min(history.length, Math.max(0, historyAt + step))
  text.value = historyAt === history.length ? draft : history[historyAt]
  if (historyAt === history.length) historyAt = null
  caretToEnd()
}

async function run() {
  const typed = text.value.trim()
  if (!typed || busy.value) return
  busy.value = true
  try {
    const { echo, history: kept, entries } = await runCommand(props.registry, typed, { graph, registry: props.registry })
    graph.log(echo, 'command', { repeat: true })
    for (const entry of entries) graph.log(entry.text, entry.type, { repeat: true })
    if (history.at(-1) !== kept) history.push(kept)
    text.value = ''
  } finally {
    busy.value = false
    historyAt = null
  }
}

// Back to the window, so its keys (panel hotkeys, Delete) work again.
function leave() {
  input.value?.closest('.flow-panel-host')?.focus({ preventScroll: true })
}

function onKeydown(e) {
  const list = showList.value
  if (e.key === 'ArrowDown' || e.key === 'ArrowUp') {
    e.preventDefault()
    const step = e.key === 'ArrowDown' ? 1 : -1
    const n = items.value.length
    if (list) active.value = active.value < 0 ? (step > 0 ? 0 : n - 1) : (active.value + step + n) % n
    else recall(step)
    return
  }
  const picked = list && active.value >= 0 ? items.value[active.value] : null
  if (e.key === 'ArrowRight' && picked?.kind === 'namespace') {
    e.preventDefault()
    take(picked.insert)
  } else if (e.key === 'ArrowLeft' && picked) {
    // Out of the namespace being typed in: f.Security.Dis -> f.
    e.preventDefault()
    take(text.value.replace(/[^.]*$/, '').replace(/[^.]*\.$/, ''))
  } else if (e.key === 'Tab' && (picked || ghost.value)) {
    e.preventDefault()
    take(picked ? picked.insert : text.value + ghost.value)
  } else if (e.key === 'Enter') {
    e.preventDefault()
    if (picked) take(picked.insert)
    else if (ghost.value) take(text.value + ghost.value)
    else run()
  } else if (e.key === 'Escape') {
    e.preventDefault()
    if (list) listOpen.value = false
    else leave()
  }
}

function onFocus() {
  focused.value = true
  emit('focus')
}

function onBlur() {
  focused.value = false
  emit('blur')
}

defineExpose({ focus: () => input.value?.focus() })
</script>

<template>
  <div class="flow-command">
    <ul v-if="showList" :id="listId" class="flow-command-list" role="listbox" aria-label="Commands">
      <li
        v-for="(item, i) in items"
        :id="optionId(i)"
        :key="item.insert"
        role="option"
        class="flow-command-option"
        :aria-selected="i === active"
        :title="item.description || undefined"
        @mousedown.prevent
        @click="take(item.insert)"
      >
        <span class="flow-command-option-label">{{ item.label }}</span>
        <span v-if="item.detail" class="flow-command-option-detail">{{ item.detail }}</span>
      </li>
    </ul>
    <div class="flow-command-box">
      <!-- The rest of the only match, after what's typed. -->
      <div class="flow-command-ghost" aria-hidden="true"><span class="flow-command-typed">{{ text }}</span>{{ ghost }}</div>
      <input
        ref="input"
        v-model="text"
        class="flow-command-input"
        role="combobox"
        aria-label="Command"
        aria-autocomplete="both"
        :aria-expanded="showList"
        :aria-controls="listId"
        :aria-activedescendant="showList && active >= 0 ? optionId(active) : undefined"
        :aria-busy="busy"
        spellcheck="false"
        autocomplete="off"
        placeholder="Type a command (~ focuses here; f.Help lists them)"
        @input="onInput"
        @keydown="onKeydown"
        @focus="onFocus"
        @blur="onBlur"
      />
    </div>
  </div>
</template>
