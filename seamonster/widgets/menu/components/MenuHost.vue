<script setup>
import { computed, nextTick, provide, ref, shallowRef } from 'vue'
import { ContextMenuContent, ContextMenuPortal, ContextMenuRoot, ContextMenuTrigger } from 'reka-ui'
import MenuItems from './MenuItems.vue'
import { MENU_HOST } from '../context.js'
import { findRegion, normalize, OTHER_HOST } from '../regions.js'
import { resolveItems } from '../resolveItems.js'

// Renders the owning widget's root element. Right-clicking inside it opens the
// menu of the nearest v-menu region; with no region (or no items) the browser's
// menu is suppressed and nothing opens. Menus are portalled into this element,
// so they inherit the widget's --wm-* tokens and styles.
defineOptions({ inheritAttrs: false })

const props = defineProps({
  as: { type: String, default: 'div' },
  // Named commands that items reference with `command` (see resolveItems).
  commands: { type: Object, default: () => ({}) },
  // While open, the rest of the page ignores the pointer (Reka's modal).
  modal: { type: Boolean, default: true },
})

const el = ref(null)
const region = shallowRef(null)
// Set by open() for the synthetic right-click it sends, in place of a v-menu region.
let opening = null

const items = computed(() =>
  region.value ? resolveItems(region.value.items, region.value.context, props.commands) : [],
)

provide(MENU_HOST, { el })

// Capture phase, so this runs before Reka's trigger decides whether to open:
// it only opens if the event hasn't been default-prevented.
function onContextMenu(e) {
  const found = opening ?? findRegion(e.target, el.value)
  opening = null
  if (found === OTHER_HOST) return
  region.value = found
  if (!items.value.length) e.preventDefault()
}

// Reka also opens on a touch or pen long-press, from its own timer, which no
// contextmenu event goes with (iOS sends none): take the region when the press
// starts, or the menu would show the last right-click's items. Only presses on
// the trigger count: a tap on an open menu's items must leave them be.
function onPointerDown(e) {
  if (e.pointerType === 'mouse' || !trigger()?.contains(e.target)) return
  const found = findRegion(e.target, el.value)
  // A nested host opens its own menu; this one stays shut (empty, so disabled).
  region.value = found === OTHER_HOST ? null : found
}

const trigger = () => el.value?.querySelector(':scope > .wm-trigger')

// Open a menu from code, at a point in client coordinates: `menu` is what
// v-menu takes (items, or { items, context }). Reka only opens on a right-click,
// so this sends one to the trigger, carrying the point. The trigger is disabled
// while there's nothing to show, and Reka reads that as the event reaches it.
// A real right-click re-renders it in time (the browser runs Vue's update
// between the capture handler and Reka's), a right-click sent from code
// doesn't: show the menu's items first, and send it once the trigger is enabled.
function open({ x, y }, menu) {
  const found = normalize(menu)
  region.value = found
  nextTick(() => {
    opening = found
    trigger()?.dispatchEvent(
      new MouseEvent('contextmenu', { bubbles: true, cancelable: true, clientX: x, clientY: y }),
    )
  })
}

defineExpose({ el, open })
</script>

<template>
  <component
    :is="as"
    ref="el"
    v-bind="$attrs"
    data-wm-host
    @contextmenu.capture="onContextMenu"
    @pointerdown.capture="onPointerDown"
  >
    <ContextMenuRoot :modal="modal">
      <!-- Disabled with nothing to show, so a long-press opens no empty menu. -->
      <ContextMenuTrigger as="div" class="wm-trigger" :disabled="!items.length">
        <slot />
      </ContextMenuTrigger>
      <ContextMenuPortal v-if="el" :to="el">
        <ContextMenuContent class="wm-content" :collision-padding="8">
          <MenuItems :items="items" />
        </ContextMenuContent>
      </ContextMenuPortal>
    </ContextMenuRoot>
  </component>
</template>
