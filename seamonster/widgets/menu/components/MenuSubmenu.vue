<script setup>
import { inject } from 'vue'
import {
  ContextMenuPortal,
  ContextMenuSub,
  ContextMenuSubContent,
  ContextMenuSubTrigger,
} from 'reka-ui'
import MenuItemContent from './MenuItemContent.vue'
import MenuItems from './MenuItems.vue'
import { MENU_HOST } from '../context.js'
import { toneAttrs } from '../tone.js'

defineProps({
  item: { type: Object, required: true },
  inset: { type: Boolean, default: false },
})

const host = inject(MENU_HOST)
</script>

<template>
  <ContextMenuSub>
    <ContextMenuSubTrigger
      class="wm-item wm-sub-trigger"
      v-bind="toneAttrs(item.tone)"
      :disabled="item.disabled"
    >
      <MenuItemContent :item="item" :inset="inset" submenu />
    </ContextMenuSubTrigger>
    <ContextMenuPortal :to="host.el.value">
      <ContextMenuSubContent class="wm-content wm-sub-content" :collision-padding="8">
        <MenuItems :items="item.items" />
      </ContextMenuSubContent>
    </ContextMenuPortal>
  </ContextMenuSub>
</template>
