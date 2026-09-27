<script setup>
import { computed, toRef, watch } from 'vue'
import { useGLTF } from '@tresjs/cientos'
import { applyMaterial } from '../applyMaterial.js'

const props = defineProps({
  url: { type: String, required: true },
  position: { type: Array, default: () => [0, 0, 0] },
  scale: { type: Number, default: 1 },
  // Merged into every mesh material. null leaves the model exactly as authored.
  material: { type: Object, default: null },
  // Ignore a COLOR_0 attribute that is entirely black — otherwise such a mesh
  // renders unlit black whatever the lighting.
  dropBlackVertexColors: { type: Boolean, default: true },
})

// toRef rather than props.url so a changed url reloads the model.
const { state, isLoading } = useGLTF(toRef(props, 'url'))

// The whole glTF scene. Reach for `nodes` instead when a model needs one part.
const object = computed(() => state.value?.scene)

watch(
  [object, () => props.material, () => props.dropBlackVertexColors],
  ([scene]) => {
    if (!scene) return
    applyMaterial(scene, props.material ?? {}, props.dropBlackVertexColors)
  },
  { immediate: true },
)

defineExpose({ isLoading })
</script>

<template>
  <TresGroup :position="position" :scale="scale">
    <primitive v-if="object" :object="object" />
  </TresGroup>
</template>
