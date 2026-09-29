<script setup>
import { computed, inject } from 'vue'
import { vMenu } from '../widgets/menu/index.js'
import { PANEL_LAYOUT } from '../lib/panelLayout.js'
import { PANEL_MENU } from './panelMenus.js'

const layout = inject(PANEL_LAYOUT)

// Each edge's rails in two groups: fill panels' stacked around the edge's
// centre, and content panels' at the start of the edge, where those panels are
// anchored (level with the top of a side panel, the left of a bottom one).
const groups = computed(() => {
  const { gap, leftTop } = layout.frame
  const start = { left: { top: `${leftTop}px` }, right: { top: `${gap}px` }, bottom: { left: `${gap}px` } }
  return Object.entries(layout.rails.value).flatMap(([dock, panels]) => [
    { key: dock, dock, panels: panels.filter((p) => p.sizing !== 'content') },
    {
      key: `${dock}-start`,
      dock,
      start: true,
      style: start[dock],
      panels: panels.filter((p) => p.sizing === 'content'),
    },
  ])
})
</script>

<template>
  <!-- Panel titles in the gap on each docked edge. -->
  <template v-for="g in groups" :key="g.key">
    <div
      v-if="g.panels.length"
      :class="['flow-rail-group', `flow-rail-group--${g.dock}`, { 'flow-rail-group--start': g.start }]"
      :style="g.style"
    >
      <button
        v-for="p in g.panels"
        :key="p.name"
        v-menu="{ items: PANEL_MENU, context: p.name }"
        type="button"
        :class="['flow-panel-rail', `flow-panel-rail--${g.dock}`, { 'is-open': !p.collapsed }]"
        :aria-label="`${p.title} panel`"
        :aria-expanded="!p.collapsed"
        @click="layout.toggle(p.name)"
      >
        <span class="flow-panel-rail-text">{{ p.title }}</span>
      </button>
    </div>
  </template>
</template>
