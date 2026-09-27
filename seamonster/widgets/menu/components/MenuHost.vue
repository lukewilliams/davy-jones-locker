<script setup>
import { computed, provide, ref, shallowRef } from 'vue'
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

// Open a menu from code, at a point in client coordinates: `menu` is what
// v-menu takes (items, or { items, context }). Reka only opens on a right-click,
// so this sends one to the trigger, carrying the point.
function open({ x, y }, menu) {
  opening = normalize(menu)
  el.value.querySelector(':scope > .wm-trigger').dispatchEvent(
    new MouseEvent('contextmenu', { bubbles: true, cancelable: true, clientX: x, clientY: y }),
  )
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
  >
    <ContextMenuRoot :modal="modal">
      <ContextMenuTrigger as="div" class="wm-trigger">
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
