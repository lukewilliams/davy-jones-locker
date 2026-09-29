<script setup>
// A node's face, 190 x 90: status top left, name bottom right, on its
// category's gradient (the parent sets .flow-node--<category>). Used on the
// canvas and, scaled down, for the Library's cards.
defineProps({
  label: { type: String, required: true },
  status: { type: String, default: '' },
  selected: Boolean,
})
</script>

<template>
  <div class="flow-node-face" :class="{ 'is-selected': selected }">
    <span class="flow-node-status" :title="status || undefined">{{ status }}</span>
    <span class="flow-node-label">{{ label }}</span>
  </div>
</template>
