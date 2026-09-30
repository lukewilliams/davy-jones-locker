<script setup>
// An app's whole window: SEAMONSTER's FlowgraphEditor with the framework's parts
// wired in: the engine (engineClient.js), its own node kinds (serverKinds.js),
// SQL in the browser (duckdbSql.js) and storage (localGraphStorage.js).
// Anything else FlowgraphEditor takes (title, theme) passes straight through.
import { FlowgraphEditor } from 'seamonster'
import { createEngineClient } from './engineClient.js'
import { defineServerKinds } from './serverKinds.js'
import { duckdbSql } from './duckdbSql.js'
import { createLocalGraphStorage } from './localGraphStorage.js'

const props = defineProps({
  // Where the browser reaches the engine, and what messages call it. Null for
  // no engine: everything runs in the browser, and the window says so.
  engineUrl: { type: String, default: null },
  engineName: { type: String, default: 'The engine' },
  // What the open graph and its files are kept under in the browser.
  storageName: { type: String, default: 'davy-jones-locker' },
})

// Made once: none of these can change while the window is open.
const server = props.engineUrl ? createEngineClient({ url: props.engineUrl, name: props.engineName }) : null
if (server) defineServerKinds(server)
const storage = createLocalGraphStorage(props.storageName)
</script>

<template>
  <FlowgraphEditor :storage="storage" :sql="duckdbSql" :server="server" />
</template>
