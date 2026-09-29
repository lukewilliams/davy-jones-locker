<script setup>
import { computed, inject, onBeforeUnmount, ref, watch } from 'vue'
import { vMenu } from '../widgets/menu/index.js'
import { PANEL_LAYOUT } from '../lib/panelLayout.js'
import { PANEL_MENU } from './panelMenus.js'

// A panel docked to one edge of its window (FlowgraphEditor, or any PanelHost).
// Position, size, linking and stacking are owned by the window's panel layout
// (see panelLayout.js); the panel's collapsed title is drawn by FlowPanelRails.
const props = defineProps({
  name: { type: String, required: true },
  title: { type: String, required: true },
  dock: {
    type: String,
    required: true,
    validator: (v) => ['left', 'right', 'bottom'].includes(v),
  },
  // 'fill': linked, it packs against the other linked panels and fills its
  // edge. 'content': linked, it's anchored at the start of its edge (top, or
  // left for the bottom) and sized to its content, over whatever is there; its
  // body scrolls once the window caps it. See panelLayout.js.
  sizing: {
    type: String,
    default: 'fill',
    validator: (v) => ['fill', 'content'].includes(v),
  },
  // Initial size along the axis a linked panel resizes on: width for side
  // panels, height for bottom (a content panel's height follows its content).
  defaultSize: { type: Number, default: 320 },
  minWidth: { type: Number, default: 200 },
  minHeight: { type: Number, default: 140 },
  // Initial state only; the layout owns it afterwards.
  collapsed: { type: Boolean, default: false },
  // A single key that toggles the panel like a title click (see panelLayout's onKeydown).
  hotkey: { type: String, default: null },
  // Left panels only, and only the last ones: stop above the bottom panel while
  // it's open, which then runs underneath.
  aboveBottom: { type: Boolean, default: false },
})

const layout = inject(PANEL_LAYOUT)
layout.register({ ...props })
onBeforeUnmount(() => layout.unregister(props.name))

const panel = computed(() => layout.find(props.name))
const rect = computed(() => layout.rects.value[props.name])

// A title can change (a host's data may name its panels): the rail and the
// Panels menu follow it.
watch(
  () => props.title,
  (title) => (panel.value.title = title),
)

// Linked panels resize on one axis, from the edge facing the canvas. Unlinked
// panels resize from every edge and corner.
// A linked content panel on the bottom has none: its content sets both sizes.
const LINKED_EDGES = { left: ['e'], right: ['w'], bottom: ['n'] }
const UNLINKED_EDGES = ['n', 's', 'e', 'w', 'ne', 'nw', 'se', 'sw']
const content = props.sizing === 'content'
const edges = computed(() => {
  if (!panel.value.linked) return UNLINKED_EDGES
  return content && props.dock === 'bottom' ? [] : LINKED_EDGES[props.dock]
})

// Content panels report their natural outer size: the content's, plus the
// panel's title, padding and any scrollbars (the panel less its body's client
// area). Measured again whenever the content or the body changes size.
const panelEl = ref(null)
const bodyEl = ref(null)
const contentEl = ref(null)

function measure() {
  const [el, body, inner] = [panelEl.value, bodyEl.value, contentEl.value]
  if (!el || !body || !inner) return
  layout.setContentSize(props.name, {
    width: inner.offsetWidth + el.offsetWidth - body.clientWidth,
    height: inner.offsetHeight + el.offsetHeight - body.clientHeight,
  })
}

if (content) {
  watch(
    [contentEl, bodyEl],
    ([inner, body], _, onCleanup) => {
      if (!inner || !body) return
      const observer = new ResizeObserver(measure)
      observer.observe(inner)
      observer.observe(body)
      onCleanup(() => observer.disconnect())
    },
    { flush: 'post' },
  )
}

const panelStyle = computed(() => ({
  left: `${rect.value.left}px`,
  top: `${rect.value.top}px`,
  width: `${rect.value.width}px`,
  height: `${rect.value.height}px`,
  zIndex: layout.zIndex(props.name),
}))

const linkLabel = computed(
  () => `${panel.value.linked ? 'Unlink' : 'Link'} ${props.title} panel`,
)

let coveredAtPress = false

function onPress() {
  coveredAtPress = layout.isCovered(props.name)
  layout.activate(props.name)
}

// Dragging the title moves an unlinked panel; a click (no drag) collapses it,
// or only brings it to the front if it was hidden behind another panel.
const DRAG_THRESHOLD = 4
let titleDrag = null
let suppressClick = false

function onTitleDown(e) {
  if (e.button !== 0) return
  suppressClick = false
  titleDrag = { x: e.clientX, y: e.clientY, start: { ...rect.value }, moved: false }
  e.currentTarget.setPointerCapture(e.pointerId)
}

function onTitleMove(e) {
  if (!titleDrag || panel.value.linked) return
  const dx = e.clientX - titleDrag.x
  const dy = e.clientY - titleDrag.y
  if (!titleDrag.moved && Math.hypot(dx, dy) < DRAG_THRESHOLD) return
  titleDrag.moved = true
  layout.move(props.name, titleDrag.start, dx, dy)
}

function onTitleUp() {
  if (!titleDrag) return
  if (titleDrag.moved) {
    suppressClick = true
    layout.commitRect(props.name)
  }
  titleDrag = null
}

function onTitleClick() {
  if (!suppressClick && !coveredAtPress) layout.setCollapsed(props.name, true)
  suppressClick = false
  coveredAtPress = false
}

let drag = null

function onResizeStart(edge, e) {
  e.preventDefault()
  drag = { edge, x: e.clientX, y: e.clientY, start: { ...rect.value } }
  e.currentTarget.setPointerCapture(e.pointerId)
}

function onResizeMove(e) {
  if (!drag) return
  layout.resize(props.name, drag.edge, drag.start, e.clientX - drag.x, e.clientY - drag.y)
}

function onResizeEnd() {
  if (!drag) return
  drag = null
  layout.commitRect(props.name)
}
</script>

<template>
  <section
    v-if="!panel.collapsed && rect"
    ref="panelEl"
    :class="[
      'flow-panel',
      `flow-panel--dock-${dock}`,
      `flow-panel--${sizing}`,
      { 'is-active': layout.active.value === name, 'is-unlinked': !panel.linked },
    ]"
    :style="panelStyle"
    @pointerdown="onPress"
  >
    <button
      v-menu="{ items: PANEL_MENU, context: name }"
      type="button"
      class="flow-panel-title"
      :aria-label="`Hide ${title} panel`"
      @pointerdown="onTitleDown"
      @pointermove="onTitleMove"
      @pointerup="onTitleUp"
      @pointercancel="onTitleUp"
      @click="onTitleClick"
    >
      {{ title }}
    </button>

    <div ref="bodyEl" class="flow-panel-body">
      <!-- A content panel's content lays out at its natural size, to be measured. -->
      <div v-if="content" ref="contentEl" class="flow-panel-content">
        <slot />
      </div>
      <slot v-else />
    </div>

    <div
      v-for="edge in edges"
      :key="edge"
      :class="['flow-panel-resize', `flow-panel-resize--${edge}`]"
      @pointerdown="onResizeStart(edge, $event)"
      @pointermove="onResizeMove"
      @pointerup="onResizeEnd"
      @pointercancel="onResizeEnd"
    ></div>

    <button
      type="button"
      class="flow-panel-link-btn"
      :aria-pressed="panel.linked"
      :aria-label="linkLabel"
      :title="`${linkLabel} (Ctrl+Space)`"
      @click="layout.toggleLinked(name)"
    >
      <!-- Chain / broken chain, drawn as a CSS mask so it can take the title's gradient. -->
      <span
        :class="['flow-panel-link-icon', panel.linked ? 'is-linked' : 'is-unlinked']"
        aria-hidden="true"
      ></span>
    </button>
  </section>
</template>
