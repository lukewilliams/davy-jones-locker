<script setup>
import { CheckboxIndicator, CheckboxRoot, Label } from 'reka-ui'

const props = defineProps({
  control: { type: Object, required: true },
  modelValue: { type: Array, default: () => [] },
  disabled: { type: Boolean, default: false },
  // Option values disabled individually, while the group itself stays usable.
  disabledOptions: { type: Array, default: () => [] },
})

const emit = defineEmits(['update:modelValue'])

function isChecked(value) {
  return props.modelValue.includes(value)
}

function setChecked(value, checked) {
  const next = checked
    ? [...props.modelValue, value]
    : props.modelValue.filter((v) => v !== value)
  // Keep the order defined by the control's options.
  emit(
    'update:modelValue',
    props.control.options.map((o) => o.value).filter((v) => next.includes(v)),
  )
}
</script>

<template>
  <fieldset class="wc-checkbox-group" :disabled="disabled">
    <legend class="wc-label">{{ control.label }}</legend>
    <div
      v-for="option in control.options"
      :key="option.value"
      class="wc-checkbox-row"
      :class="{ 'wc-option-disabled': disabledOptions.includes(option.value) }"
    >
      <CheckboxRoot
        :id="`${control.id}-${option.value}`"
        class="wc-checkbox"
        :disabled="disabledOptions.includes(option.value)"
        :model-value="isChecked(option.value)"
        @update:model-value="setChecked(option.value, $event)"
      >
        <CheckboxIndicator>✓</CheckboxIndicator>
      </CheckboxRoot>
      <Label :for="`${control.id}-${option.value}`">{{ option.label }}</Label>
    </div>
  </fieldset>
</template>
