<script setup>
import { ContextMenuItem } from 'reka-ui'
import MenuItemContent from './MenuItemContent.vue'
import { toneAttrs } from '../tone.js'

defineProps({
  item: { type: Object, required: true },
  inset: { type: Boolean, default: false },
})
</script>

<template>
  <ContextMenuItem
    class="wm-item"
    v-bind="toneAttrs(item.tone)"
    :disabled="item.disabled"
    @select="item.run()"
  >
    <MenuItemContent :item="item" :inset="inset" />
  </ContextMenuItem>
</template>
