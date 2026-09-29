<script setup>
import { computed, onBeforeUnmount, onMounted, provide, ref, watch } from 'vue'
import { MenuHost } from '../menu/index.js'
import FlowPanelRails from '../../components/FlowPanelRails.vue'
import { panelCommands } from '../../components/panelMenus.js'
import { createPanelLayout, PANEL_LAYOUT } from '../../lib/panelLayout.js'

// SEAMONSTER's panels over any content: FlowPanels docked to the host's edges,
// with their rails, linking, bring-to-front, title menus and keys, as in
// FlowgraphEditor (which is built on this). The host is the window the panels
// are laid out in; size it as you like.
//
// Slots: the default one is the content, filling the host under the panels (a
// map, a scene, a canvas); `panels` holds the FlowPanels, and anything else
// that floats over the content; `title` is a title top left, which linked left
// panels start below.
const props = defineProps({
  // A layout from createPanelLayout, when the host needs it before mounting
  // (FlowgraphEditor's menus do). Without one, PanelHost makes its own from
  // `storageKey` and `autoHideRails`.
  layout: { type: Object, default: null },
  // Where unlinked panels' sizes are saved: name one per host ('<app>:<host>'),
  // or hosts with panels of the same name share them.
  storageKey: { type: String, default: undefined },
  // Open panels leave the rails (unless an edge's panels can cover each other).
  autoHideRails: { type: Boolean, default: true },
  // Panels' single-key hotkeys. Off, letter keys are left to the content and
  // the page; Ctrl+Space still works.
  hotkeys: { type: Boolean, default: true },
  // More commands for the host's own menus (see widgets/menu), beside the panels'.
  commands: { type: Object, default: () => ({}) },
  // A pointerdown outside the panels leaves no panel active, except on these
  // (a CSS selector): by default, Reka popovers portalled into the host.
  ignore: { type: String, default: '[data-reka-popper-content-wrapper]' },
})

const layout =
  props.layout ?? createPanelLayout({ storageKey: props.storageKey, autoHideRails: () => props.autoHideRails })
provide(PANEL_LAYOUT, layout)

const panelCmds = panelCommands(layout)
const allCommands = computed(() => ({ ...panelCmds, ...props.commands }))

const host = ref(null)
const hostEl = computed(() => host.value?.el)
const titleEl = ref(null)

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
  const el = hostEl.value
  if (!el) return
  const bar = titleEl.value
  const gap = cssLengthPx(el, '--flow-panel-radius')
  layout.setFrame({
    width: el.clientWidth,
    height: el.clientHeight,
    gap,
    // Linked left panels start below the title rather than covering it.
    leftTop: bar ? bar.offsetTop + bar.offsetHeight + gap : gap,
  })
}

const observer = new ResizeObserver(measure)
onMounted(() => observer.observe(hostEl.value))
watch(titleEl, (el, old) => {
  if (old) observer.unobserve(old)
  if (el) observer.observe(el)
  measure()
})
onBeforeUnmount(() => observer.disconnect())

// Menus are portalled into the host; their events aren't the host's.
const inMenu = (e) => !!e.target.closest?.('.wm-content')

// Capture phase, so content that stops pointer events (a map, a 3D view)
// doesn't keep them from the host. Pressing anywhere in the host gives it
// focus, for its keys, unless focus is already inside; pressing outside the
// panels leaves no panel active.
function onPointerDown(e) {
  const el = hostEl.value
  if (!el.contains(document.activeElement)) el.focus({ preventScroll: true })
  if (e.target.closest('.flow-panel, .flow-panel-rail') || inMenu(e)) return
  if (props.ignore && e.target.closest(props.ignore)) return
  layout.deactivate()
}

// Keys reach the host only while focus is inside it.
function onKeydown(e) {
  if (!inMenu(e)) layout.onKeydown(e, { hotkeys: props.hotkeys })
}

defineExpose({
  layout,
  el: hostEl,
  // Open a menu at a point, as MenuHost's open() does.
  open: (point, menu) => host.value.open(point, menu),
})
</script>

<template>
  <!-- MenuHost renders the host element: right-clicks open the nearest v-menu
       region's menu, portalled in here so it takes the surface's menu look. -->
  <MenuHost
    ref="host"
    class="flow-surface flow-panel-host"
    :commands="allCommands"
    tabindex="-1"
    @pointerdown.capture="onPointerDown"
    @keydown="onKeydown"
  >
    <!-- Isolated, so the content's own z-indexes stay under the panels. -->
    <div class="flow-panel-host-content">
      <slot />
    </div>

    <div v-if="$slots.title" ref="titleEl" class="flow-title-bar">
      <slot name="title" />
    </div>

    <slot name="panels" />
    <FlowPanelRails />
  </MenuHost>
</template>

<style>
/* ---- Context menus (widgets/menu) ----
 * Menus are portalled into the host (.flow-surface), so these tokens and part
 * overrides apply to its menus only, and travel with it wherever it's used. */
.flow-surface {
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

/* Badges: the item's gradient (a node category's, from .flow-node--<kind>),
 * else its badge colour. */
.flow-surface .wm-badge {
  background-image: linear-gradient(
    135deg,
    var(--node-color-from, var(--wm-badge-color, currentColor)),
    var(--node-color-to, var(--wm-badge-color, currentColor))
  );
}

.flow-surface .wm-sub-indicator {
  font-size: 12px;
}

/* Highlighted items pan a gradient across their label, like the panel titles:
 * the brand blue-green by default, or the node category's colours for items
 * toned by a category badge (the badge itself or a badged submenu above). */
.flow-surface .wm-item[data-highlighted] .wm-item-label {
  background-image: linear-gradient(90deg, var(--flow-brand-from), var(--flow-brand-to), var(--flow-brand-from));
  background-size: 200% 100%;
  background-clip: text;
  -webkit-background-clip: text;
  color: transparent;
  animation: flow-brand-pan 1.5s linear infinite;
}

.flow-surface .wm-item.wm-toned[data-highlighted] .wm-item-label {
  background-image: linear-gradient(
    90deg,
    var(--node-color-from, var(--wm-tone-color)),
    var(--node-color-to, var(--wm-tone-color)),
    var(--node-color-from, var(--wm-tone-color))
  );
}

@media (prefers-reduced-motion: reduce) {
  .flow-surface .wm-item[data-highlighted] .wm-item-label {
    animation: none;
  }
}
</style>
