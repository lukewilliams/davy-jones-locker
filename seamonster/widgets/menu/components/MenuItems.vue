<script setup>
import { computed } from 'vue'
import { getMenuItemType } from '../registry.js'

const props = defineProps({
  items: { type: Array, required: true },
})

// When any item has a check/radio indicator, the rest reserve its space so labels line up.
const inset = computed(() => props.items.some((i) => i.type === 'checkbox' || i.type === 'radio'))
</script>

<template>
  <component
    :is="getMenuItemType(item.type)"
    v-for="(item, i) in items"
    :key="item.id ?? i"
    :item="item"
    :inset="inset"
  />
</template>
