<script setup>
import { computed, provide, ref } from 'vue'
import { vMenu } from './menu/index.js'
import PanelHost from './panels/PanelHost.vue'
import FlowCanvas from '../components/FlowCanvas.vue'
import TerminalPanel from './TerminalPanel.vue'
import LibraryPanel from './LibraryPanel.vue'
import FlowgraphsPanel from './FlowgraphsPanel.vue'
import DataPanel from './DataPanel.vue'
import ManagePanel from './ManagePanel.vue'
import ServerStatus from '../components/ServerStatus.vue'
import { createPanelLayout } from '../lib/panelLayout.js'
import { createFlowGraph, FLOW_GRAPH } from '../lib/flowGraph.js'
import { useGraphStorage } from '../lib/graphStorage.js'
import { hasTheme, resolveTheme } from '../lib/themes.js'
import { CONNECTION_MENU, createFlowMenus, OPEN_MENU } from '../components/flowMenus.js'

const props = defineProps({
  // Where the open graph is kept between visits, supplied by the host app:
  // { load(): doc | null | Promise, save(doc) } (see lib/graphStorage.js),
  // and optionally { putFile(key, bytes), getFile(key), deleteFile(key) } for
  // the data DataIngest nodes read (held in memory only, without them).
  // Without storage the editor starts empty and keeps nothing.
  storage: { type: Object, default: null },
  // The SQL engine nodes run on, supplied by the host app (see
  // lib/graphRunner.js). Without it, running a node reports that no engine
  // is connected.
  sql: { type: Object, default: null },
  // The server engine, as the host app sees it:
  // { status: { state: 'checking' | 'connected' | 'unavailable', address } },
  // reactive. Without it everything runs in the browser, and the window says so.
  server: { type: Object, default: null },
  // The name top left.
  title: { type: String, default: 'SEAMONSTER' },
  // The theme, any case: FLOW, FLOWDARK, LUX, LUXDARK, or one the app has
  // defined (see lib/themes.js), whose tokens can change the brand gradient.
  theme: { type: String, default: 'FLOW', validator: hasTheme },
  // Open panels leave the rails (unless an edge's panels can cover each
  // other). False keeps a rail for every panel, open or collapsed.
  autoHideRails: { type: Boolean, default: true },
})

const theme = computed(() => resolveTheme(props.theme))
const themeClass = computed(() => theme.value.className)
const themeStyle = computed(() => theme.value.tokens)

// Made here rather than by PanelHost, since the menus need it now.
const layout = createPanelLayout({ autoHideRails: () => props.autoHideRails })

const graph = createFlowGraph({ sql: props.sql, files: props.storage, server: props.server })
provide(FLOW_GRAPH, graph)
useGraphStorage(graph, props.storage)

const { commands, canvasMenu } = createFlowMenus(layout, graph)

const host = ref(null)

// Menus are portalled into the window; their events aren't the window's.
const inMenu = (e) => !!e.target.closest('.wm-content')

// PanelHost handles the panels' keys; these are the graph's (Delete, Ctrl+Z).
function onKeydown(e) {
  if (!inMenu(e)) graph.onKeydown(e)
}

// A wire dragged from a pin was dropped on empty canvas: offer a node to create there.
function onConnectionDropped(context) {
  host.value.open(context.point, { items: CONNECTION_MENU, context })
}

// Other components open menus at a point too (Manage's pickers), so they look
// like the right-click ones.
provide(OPEN_MENU, (point, menu) => host.value.open(point, menu))
</script>

<template>
  <!-- The canvas pans underneath; the title and panels are positioned against
       the window, so they stay put while the canvas moves. PanelHost renders
       the window element, lays out the panels and hosts the menus. -->
  <PanelHost
    ref="host"
    class="flow-editor"
    :class="themeClass"
    :layout="layout"
    :commands="commands"
    role="application"
    :aria-label="title"
    :style="themeStyle"
    @keydown="onKeydown"
  >
    <FlowCanvas v-menu="canvasMenu" @connection-dropped="onConnectionDropped" />

    <template #title>
      <span class="flow-title flow-pan-trigger">
        <span class="flow-brand-text flow-title-text">{{ title }}</span>
      </span>
    </template>

    <!-- Linked left panels sit side by side in this order. -->
    <template #panels>
      <TerminalPanel />
      <LibraryPanel />
      <FlowgraphsPanel />
      <DataPanel />
      <ManagePanel />
      <ServerStatus />
    </template>
  </PanelHost>
</template>
