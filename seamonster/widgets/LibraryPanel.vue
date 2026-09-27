<script setup>
import FlowPanel from '../components/FlowPanel.vue'
import NodeFace from '../components/NodeFace.vue'
import { kindsInCategory, NODE_CATEGORIES, NODE_KIND_DRAG_TYPE, NODE_KINDS } from '../lib/nodeKinds.js'

// The node palette: every kind by category, as cards to drag onto the canvas.
// A card is the node's real face, scaled down.
const sections = NODE_CATEGORIES.map((category) => ({ ...category, kinds: kindsInCategory(category.id) }))

function onDragStart(kind, e) {
  const card = e.currentTarget.getBoundingClientRect()
  const grab = { x: (e.clientX - card.left) / card.width, y: (e.clientY - card.top) / card.height }
  e.dataTransfer.setData(NODE_KIND_DRAG_TYPE, JSON.stringify({ kind, grab }))
  e.dataTransfer.effectAllowed = 'copy'
}
</script>

<template>
  <!-- 238px fits two columns of cards. -->
  <FlowPanel class="library-panel" name="library" title="Library" dock="left" hotkey="L" :default-size="238" collapsed>
    <div class="flow-library">
      <section v-for="section in sections" :key="section.id" class="flow-library-section">
        <h3 class="flow-library-heading">
          <span class="flow-library-dot" :class="`flow-node--${section.id}`" aria-hidden="true"></span>
          {{ section.label }}
        </h3>
        <div class="flow-library-cards">
          <div
            v-for="kind in section.kinds"
            :key="kind"
            class="flow-library-card"
            :class="`flow-node--${section.id}`"
            draggable="true"
            :title="`Drag onto the canvas to add ${NODE_KINDS[kind].label}`"
            @dragstart="onDragStart(kind, $event)"
          >
            <NodeFace :label="NODE_KINDS[kind].label" />
          </div>
        </div>
      </section>
    </div>
  </FlowPanel>
</template>
