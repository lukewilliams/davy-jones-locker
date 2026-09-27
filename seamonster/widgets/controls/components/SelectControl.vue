<script setup>
import {
  Label,
  SelectContent,
  SelectItem,
  SelectItemIndicator,
  SelectItemText,
  SelectPortal,
  SelectRoot,
  SelectTrigger,
  SelectValue,
  SelectViewport,
} from 'reka-ui'

const props = defineProps({
  control: { type: Object, required: true },
  modelValue: { type: null, default: undefined },
  disabled: { type: Boolean, default: false },
  // Option values disabled individually, while the select itself stays usable.
  disabledOptions: { type: Array, default: () => [] },
})

defineEmits(['update:modelValue'])

function optionLabel(value) {
  return props.control.options.find((o) => o.value === value)?.label ?? ''
}
</script>

<template>
  <Label :for="control.id" class="wc-label">{{ control.label }}</Label>
  <SelectRoot
    :model-value="modelValue"
    :disabled="disabled"
    @update:model-value="$emit('update:modelValue', $event)"
  >
    <SelectTrigger :id="control.id" class="wc-select-trigger">
      <SelectValue>{{ optionLabel(modelValue) }}</SelectValue>
    </SelectTrigger>
    <SelectPortal>
      <SelectContent class="wc-select-content" position="popper" :side-offset="4">
        <SelectViewport>
          <SelectItem
            v-for="option in control.options"
            :key="option.value"
            :value="option.value"
            :disabled="disabledOptions.includes(option.value)"
            class="wc-select-item"
          >
            <SelectItemIndicator>✓</SelectItemIndicator>
            <SelectItemText>{{ option.label }}</SelectItemText>
          </SelectItem>
        </SelectViewport>
      </SelectContent>
    </SelectPortal>
  </SelectRoot>
</template>
