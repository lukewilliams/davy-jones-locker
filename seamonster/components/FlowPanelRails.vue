<script setup>
import { inject } from 'vue'
import { vMenu } from '../widgets/menu/index.js'
import { PANEL_LAYOUT } from '../lib/panelLayout.js'
import { PANEL_MENU } from './flowMenus.js'

const layout = inject(PANEL_LAYOUT)
</script>

<template>
  <!-- Panel titles in the gap on each docked edge, stacked around the edge's centre. -->
  <template v-for="(panels, dock) in layout.rails.value" :key="dock">
    <div v-if="panels.length" :class="['flow-rail-group', `flow-rail-group--${dock}`]">
      <button
        v-for="p in panels"
        :key="p.name"
        v-menu="{ items: PANEL_MENU, context: p.name }"
        type="button"
        :class="['flow-panel-rail', `flow-panel-rail--${dock}`, { 'is-open': !p.collapsed }]"
        :aria-label="`${p.title} panel`"
        :aria-expanded="!p.collapsed"
        @click="layout.toggle(p.name)"
      >
        <span class="flow-panel-rail-text">{{ p.title }}</span>
      </button>
    </div>
  </template>
</template>
