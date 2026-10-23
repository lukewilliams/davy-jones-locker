<script setup>
// An app's whole window: SEAMONSTER's FlowgraphEditor with the framework's parts
// wired in: the engine (engineClient.js), its own node kinds (serverKinds.js),
// SQL in the browser (duckdbSql.js), storage (localGraphStorage.js), and the
// Terminal's commands (commands.js). Anything else FlowgraphEditor takes
// (title) passes straight through, and so does its `panels` slot (the app's
// own panels).
import { computed, ref } from 'vue'
import { FlowgraphEditor } from 'seamonster'
import { createAppCommands, localSettings, usableTheme } from './commands.js'
import { createEngineClient } from './engineClient.js'
import { defineServerKinds } from './serverKinds.js'
import { createDuckdbSql } from './duckdbSql.js'
import { createLocalGraphStorage } from './localGraphStorage.js'

const props = defineProps({
  // Where the browser reaches the engine, and what messages call it. Null for
  // no engine: everything runs in the browser, and the window says so.
  engineUrl: { type: String, default: null },
  engineName: { type: String, default: 'The engine' },
  // What the open graph and its files are kept under in the browser.
  storageName: { type: String, default: 'davy-jones-locker' },
  // Where the app serves DuckDB's extensions (spatial), relative to the page
  // or absolute. See the README, "DuckDB's extensions".
  extensionRepository: { type: String, default: 'duckdb-extensions' },
  // The theme, unless f.Theme has chosen another in this browser.
  theme: { type: String, default: 'FLOW' },
  // The app's own Terminal commands: definitions SEAMONSTER's
  // createCommandRegistry takes, beside the framework's f. and b.
  commands: { type: Array, default: () => [] },
})

// What the Terminal's commands chose, kept in this browser.
const kept = localSettings(props.storageName)

// Made once: none of these can change while the window is open.
const server = props.engineUrl
  ? createEngineClient({
      url: props.engineUrl, name: props.engineName,
      disconnected: !!kept.get('disconnected'), assistantHidden: !!kept.get('assistant-hidden'),
    })
  : null
if (server) defineServerKinds(server)
const storage = createLocalGraphStorage(props.storageName)
const sql = createDuckdbSql({ extensionRepository: props.extensionRepository })

const chosen = ref(usableTheme(kept.get('theme')))
const theme = computed(() => chosen.value ?? props.theme)
const terminalCommands = createAppCommands({
  client: server,
  engineName: props.engineName,
  kept,
  chosenTheme: {
    get value() {
      return chosen.value
    },
    set value(name) {
      chosen.value = name
    },
    effective: () => theme.value,
  },
  appCommands: props.commands,
})
</script>

<template>
  <FlowgraphEditor :storage="storage" :sql="sql" :server="server" :theme="theme" :terminal-commands="terminalCommands">
    <template v-if="$slots.panels" #panels>
      <slot name="panels" />
    </template>
  </FlowgraphEditor>
</template>
