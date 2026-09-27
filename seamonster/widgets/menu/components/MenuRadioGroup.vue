<script setup>
import { ContextMenuItemIndicator, ContextMenuRadioGroup, ContextMenuRadioItem } from 'reka-ui'
import MenuItemContent from './MenuItemContent.vue'
import { normalizeBadge, toneAttrs } from '../tone.js'

// { type: 'radio', value, options: [{ value, label, badge?, shortcut?, disabled? }] };
// selecting an option runs the item with that option's value.
const props = defineProps({
  item: { type: Object, required: true },
  inset: { type: Boolean, default: false },
})

function option(o) {
  const badge = normalizeBadge(o.badge)
  return { ...o, badge, tone: badge ?? props.item.tone }
}
</script>

<template>
  <ContextMenuRadioGroup :model-value="item.value" @update:model-value="item.run($event)">
    <ContextMenuRadioItem
      v-for="o in item.options.map(option)"
      :key="o.value"
      class="wm-item"
      v-bind="toneAttrs(o.tone)"
      :value="o.value"
      :disabled="item.disabled || !!o.disabled"
    >
      <MenuItemContent :item="o">
        <template #indicator>
          <ContextMenuItemIndicator>●</ContextMenuItemIndicator>
        </template>
      </MenuItemContent>
    </ContextMenuRadioItem>
  </ContextMenuRadioGroup>
</template>
