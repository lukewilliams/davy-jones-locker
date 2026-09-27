<script setup>
import { ContextMenuCheckboxItem, ContextMenuItemIndicator } from 'reka-ui'
import MenuItemContent from './MenuItemContent.vue'
import { toneAttrs } from '../tone.js'

defineProps({
  item: { type: Object, required: true },
  inset: { type: Boolean, default: false },
})
</script>

<template>
  <ContextMenuCheckboxItem
    class="wm-item"
    v-bind="toneAttrs(item.tone)"
    :model-value="!!item.checked"
    :disabled="item.disabled"
    @select="item.run()"
  >
    <MenuItemContent :item="item">
      <template #indicator>
        <ContextMenuItemIndicator>✓</ContextMenuItemIndicator>
      </template>
    </MenuItemContent>
  </ContextMenuCheckboxItem>
</template>
