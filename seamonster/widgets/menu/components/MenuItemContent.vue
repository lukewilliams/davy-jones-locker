<script setup>
// The inside of an item row: [indicator] [badge] label [shortcut | submenu chevron].
defineProps({
  item: { type: Object, required: true },
  inset: { type: Boolean, default: false },
  submenu: { type: Boolean, default: false },
})
</script>

<template>
  <span v-if="inset || $slots.indicator" class="wm-indicator">
    <slot name="indicator" />
  </span>
  <span
    v-if="item.badge"
    :class="['wm-badge', item.badge.class]"
    :style="item.badge.color ? { '--wm-badge-color': item.badge.color } : null"
    aria-hidden="true"
  ></span>
  <span class="wm-item-label">{{ item.label }}</span>
  <span v-if="item.shortcut" class="wm-shortcut">{{ item.shortcut }}</span>
  <span v-if="submenu" class="wm-sub-indicator" aria-hidden="true">›</span>
</template>
