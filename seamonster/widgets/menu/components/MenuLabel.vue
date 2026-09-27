<script setup>
import { ContextMenuLabel } from 'reka-ui'
import MenuItemContent from './MenuItemContent.vue'

defineProps({
  item: { type: Object, required: true },
  inset: { type: Boolean, default: false },
})
</script>

<template>
  <ContextMenuLabel class="wm-label">
    <MenuItemContent :item="item" :inset="inset" />
  </ContextMenuLabel>
</template>
