<script setup>
import { computed, onBeforeUnmount, onMounted, provide, ref } from 'vue'
import { MenuHost, vMenu } from './menu/index.js'
import FlowCanvas from '../components/FlowCanvas.vue'
import ConsolePanel from './ConsolePanel.vue'
import LibraryPanel from './LibraryPanel.vue'
import FlowgraphsPanel from './FlowgraphsPanel.vue'
import DataPanel from './DataPanel.vue'
import ManagePanel from './ManagePanel.vue'
import FlowPanelRails from '../components/FlowPanelRails.vue'
import ServerStatus from '../components/ServerStatus.vue'
import { createPanelLayout, PANEL_LAYOUT } from '../lib/panelLayout.js'
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
})

const theme = computed(() => resolveTheme(props.theme))
const themeClass = computed(() => theme.value.className)
const themeStyle = computed(() => theme.value.tokens)

const layout = createPanelLayout()
provide(PANEL_LAYOUT, layout)

const graph = createFlowGraph({ sql: props.sql, files: props.storage, server: props.server })
provide(FLOW_GRAPH, graph)
useGraphStorage(graph, props.storage)

const { commands, canvasMenu } = createFlowMenus(layout, graph)

const host = ref(null)
const windowEl = computed(() => host.value?.el)
const titleBarEl = ref(null)
let observer = null

// Resolve a CSS length custom property (e.g. 1rem) to px.
function cssLengthPx(el, prop) {
  const probe = document.createElement('div')
  probe.style.cssText = `position:absolute;visibility:hidden;width:var(${prop})`
  el.appendChild(probe)
  const px = probe.offsetWidth
  probe.remove()
  return px
}

function measure() {
  const el = windowEl.value
  const bar = titleBarEl.value
  const gap = cssLengthPx(el, '--flow-panel-radius')
  layout.setFrame({
    width: el.clientWidth,
    height: el.clientHeight,
    gap,
    // Linked left panels start below the title bar rather than covering it.
    leftTop: bar.offsetTop + bar.offsetHeight + gap,
  })
}

onMounted(() => {
  observer = new ResizeObserver(measure)
  observer.observe(windowEl.value)
})

onBeforeUnmount(() => observer?.disconnect())

// Menus are portalled into the window; their events aren't the window's.
const inMenu = (e) => !!e.target.closest('.wm-content')

// Pressing outside the panels (on the canvas) leaves no panel active.
function onPointerDown(e) {
  if (!e.target.closest('.flow-panel, .flow-panel-rail') && !inMenu(e)) layout.deactivate()
}

function onKeydown(e) {
  if (inMenu(e)) return
  layout.onKeydown(e)
  graph.onKeydown(e)
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
       the window, so they stay put while the canvas moves.
       MenuHost renders the window element: right-clicks open the nearest
       v-menu region's menu, portalled in here so it takes the flow styles below. -->
  <MenuHost
    ref="host"
    class="flow-editor"
    :class="themeClass"
    :commands="commands"
    tabindex="-1"
    role="application"
    :aria-label="title"
    :style="themeStyle"
    @pointerdown="onPointerDown"
    @keydown="onKeydown"
  >
    <FlowCanvas v-menu="canvasMenu" @connection-dropped="onConnectionDropped" />

    <div ref="titleBarEl" class="flow-title-bar">
      <span class="flow-title flow-pan-trigger">
        <span class="flow-brand-text flow-title-text">{{ title }}</span>
      </span>
    </div>

    <!-- Linked left panels sit side by side in this order. -->
    <ConsolePanel />
    <LibraryPanel />
    <FlowgraphsPanel />
    <DataPanel />
    <ManagePanel />

    <FlowPanelRails />
    <ServerStatus />
  </MenuHost>
</template>

<style>
/* ---- Context menus (widgets/menu) ----
 * Menus are portalled into .flow-editor, so these tokens and part overrides
 * apply to the flow's menus only, and travel with FlowgraphEditor wherever it's used. */
.flow-editor {
  --wm-surface: rgba(24, 24, 27, 0.72);
  --wm-border: var(--flow-panel-border);
  --wm-radius: 0.5rem;
  --wm-shadow: 0 12px 28px rgba(0, 0, 0, 0.4);
  --wm-blur: var(--flow-blur);
  --wm-text: var(--flow-text);
  --wm-text-muted: var(--flow-text-faint);
  --wm-highlight: rgba(255, 255, 255, 0.06);
  --wm-padding: 0.375rem 0;
  --wm-item-padding: 0.5625rem 0.875rem;
  --wm-item-radius: 0;
  --wm-gap: 0.5rem;
  --wm-font-size: 14px;
  --wm-min-width: 12.5rem;
  --wm-badge-size: 8px;
}

/* Node category badges: the category's gradient (from .flow-node--<kind>). */
.flow-editor .wm-badge {
  background-image: linear-gradient(
    135deg,
    var(--node-color-from, var(--wm-badge-color, currentColor)),
    var(--node-color-to, var(--wm-badge-color, currentColor))
  );
}

.flow-editor .wm-sub-indicator {
  font-size: 12px;
}

/* Highlighted items pan a gradient across their label, like the panel titles:
 * the brand blue-green by default, or the node category's colours for items
 * toned by a category badge (the badge itself or a badged submenu above). */
.flow-editor .wm-item[data-highlighted] .wm-item-label {
  background-image: linear-gradient(90deg, var(--flow-brand-from), var(--flow-brand-to), var(--flow-brand-from));
  background-size: 200% 100%;
  background-clip: text;
  -webkit-background-clip: text;
  color: transparent;
  animation: flow-brand-pan 1.5s linear infinite;
}

.flow-editor .wm-item.wm-toned[data-highlighted] .wm-item-label {
  background-image: linear-gradient(
    90deg,
    var(--node-color-from, var(--wm-tone-color)),
    var(--node-color-to, var(--wm-tone-color)),
    var(--node-color-from, var(--wm-tone-color))
  );
}

@media (prefers-reduced-motion: reduce) {
  .flow-editor .wm-item[data-highlighted] .wm-item-label {
    animation: none;
  }
}
</style>
