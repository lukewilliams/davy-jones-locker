<script setup>
import { computed } from 'vue'

// A field's hint: plain text, with `backticks` around code.
const props = defineProps({ text: { type: String, default: '' } })
const parts = computed(() => props.text.split('`').map((part, i) => ({ part, code: i % 2 === 1 })))
</script>

<template>
  <template v-for="({ part, code }, i) in parts" :key="i"><code v-if="code">{{ part }}</code><template v-else>{{ part }}</template></template>
</template>
