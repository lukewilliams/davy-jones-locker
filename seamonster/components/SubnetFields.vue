<script setup>
import { computed, inject, ref, useId, watch } from 'vue'
import { FLOW_GRAPH } from '../lib/flowGraph.js'
import { referenceName } from '../lib/nodeKinds.js'

// A Subnet node's Manage fields (a custom field, see builtinKinds.js): Open,
// its pins, and its graph: its own, or a shared one the document keeps by
// name (which every subnet using it runs, and editing it changes for all).
const props = defineProps({ node: { type: Object, required: true } })

const graph = inject(FLOW_GRAPH)
const error = ref('')
const shareName = ref('')
watch(
  () => props.node,
  () => {
    error.value = ''
    shareName.value = ''
  },
)

const pins = computed(() => props.node.data.subnetPins ?? { inputs: [], outputs: [] })
// How downstream nodes read each output: the first by the node's reference
// name, the others by their own.
const outputs = computed(() =>
  pins.value.outputs.map((name, i) => (i === 0 ? referenceName(props.node.id, props.node.data) : `${props.node.id}_${name}`)),
)
const shared = computed(() => props.node.data.subnetRef ?? '')
const sharedNames = computed(() => Object.keys(graph.library))
const uses = computed(() => {
  if (!shared.value) return 0
  const count = (g) => (g?.nodes ?? []).reduce((n, node) => n + (node.subnetRef === shared.value ? 1 : 0) + count(node.subnet), 0)
  return count(graph.snapshot.value) + Object.values(graph.library).reduce((n, g) => n + count(g), 0)
})

function open() {
  error.value = graph.openSubnet(props.node.id) ?? ''
}

function share() {
  error.value = graph.shareSubnet(props.node.id, shareName.value) ?? ''
  if (!error.value) shareName.value = ''
}

const onGraph = (e) => graph.useSubnet(props.node.id, e.target.value || null)

const uid = useId()
const ids = { graph: `${uid}-graph`, share: `${uid}-share`, note: `${uid}-note` }
</script>

<template>
  <div class="flow-field">
    <button type="button" class="flow-button flow-button--wide" @click="open">Open subnet</button>
    <p class="flow-field-hint">Or double-click it, or press Enter. Escape goes back up.</p>
    <p v-if="error" class="flow-field-error">{{ error }}</p>
  </div>

  <div class="flow-field">
    <span class="flow-field-label">Pins</span>
    <p class="flow-field-hint">
      In: {{ pins.inputs.length ? pins.inputs.join(', ') : 'none (add an Input node inside)' }}
    </p>
    <p class="flow-field-hint">
      Out: {{ outputs.length ? outputs.join(', ') : 'none (add an Output node inside)' }}
    </p>
    <p class="flow-field-hint">
      Each Input and Output node inside is a pin, named by its ID, top to bottom. The topmost Output is the
      first output; others get pins of their own.
    </p>
  </div>

  <div class="flow-field">
    <label class="flow-field-label" :for="ids.graph">Graph</label>
    <select :id="ids.graph" class="flow-field-input flow-field-select" :value="shared" :aria-describedby="ids.note" @change="onGraph">
      <option value="">Its own{{ shared ? ' (a copy of the shared one)' : '' }}</option>
      <option v-for="name in sharedNames" :key="name" :value="name">Shared: {{ name }}</option>
    </select>
    <p v-if="shared" :id="ids.note" class="flow-field-hint">
      Shared as {{ shared }}, used {{ uses === 1 ? 'once' : `${uses} times` }} in this graph: editing it inside
      changes every use, and each one goes stale.
    </p>
    <template v-else>
      <p :id="ids.note" class="flow-field-hint">Share it to use the same graph in other subnet nodes.</p>
      <div class="flow-field-row">
        <input
          :id="ids.share"
          v-model="shareName"
          class="flow-field-input"
          placeholder="Name to share it as"
          aria-label="Name to share it as"
          @keydown.enter.prevent="share"
        />
        <button type="button" class="flow-button" :aria-disabled="!shareName.trim()" @click="shareName.trim() && share()">
          Share
        </button>
      </div>
    </template>
  </div>
</template>
