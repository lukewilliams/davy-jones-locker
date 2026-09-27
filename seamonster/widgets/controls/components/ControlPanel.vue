<script setup>
import { getControlType } from '../controlTypes.js'

defineProps({
  panel: { type: Object, required: true },
})
</script>

<template>
  <div v-for="control in panel.controls" :key="control.id" class="wc-control">
    <component
      :is="getControlType(control.type).component"
      :control="control"
      :model-value="panel.values[control.variable]"
      :disabled="panel.isDisabled(control)"
      :disabled-options="panel.disabledOptions(control)"
      @update:model-value="panel.setValue(control.variable, $event)"
    />
  </div>
</template>
