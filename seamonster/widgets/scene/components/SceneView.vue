<script setup>
import { ref, shallowRef } from 'vue'
import { TresCanvas } from '@tresjs/core'
import { OrbitControls } from '@tresjs/cientos'
import GltfModel from './GltfModel.vue'
import SceneCamera from './SceneCamera.vue'

const props = defineProps({
  // [{ id, url, position?, scale?, material? }] — a model unmounts when it
  // leaves the list.
  models: { type: Array, required: true },
  // The home viewpoint: where H returns to, and where the camera starts.
  cameraPosition: { type: Array, default: () => [4, 3, 6] },
  // What OrbitControls rotates around and what the camera looks at.
  target: { type: Array, default: () => [0, 1, 0] },
  clearColor: { type: String, default: '#ffffff' },
  // Merged into every mesh material. Slightly glossy by default so that form
  // reads from the highlights; pass {} to leave models exactly as authored.
  material: { type: Object, default: () => ({ roughness: 0.45, metalness: 0.1 }) },
  dropBlackVertexColors: { type: Boolean, default: true },
  // Keyboard shortcuts; null unbinds either.
  homeKey: { type: String, default: 'h' },
  frameKey: { type: String, default: 'f' },
  // Log position/target to the console whenever the view settles.
  logCamera: { type: Boolean, default: false },
})

// Where the camera and controls START — snapshotted once, deliberately.
//
// Binding the live props here would reset the view whenever the prop changed
// identity, which happens every time a query re-runs and rebuilds the array,
// even when the numbers are unchanged. So the camera is placed once and the
// props only govern where H returns to.
const initialPosition = [...props.cameraPosition]
const initialTarget = [...props.target]

// The three Object3D behind <TresGroup>, used as the bounds for framing.
const modelsGroup = shallowRef(null)
const sceneCamera = ref(null)

defineExpose({
  home: () => sceneCamera.value?.home(),
  frame: () => sceneCamera.value?.frame(),
  logView: () => sceneCamera.value?.logView('requested'),
})
</script>

<template>
  <div class="wsc-scene">
    <TresCanvas :clear-color="clearColor">
      <TresPerspectiveCamera :position="initialPosition" :look-at="initialTarget" />
      <OrbitControls :target="initialTarget" enable-damping make-default />

      <!-- Ambient is kept low: it lifts shadows but washes out the specular
           highlights that make a surface readable, so the key light does the work. -->
      <TresAmbientLight :intensity="0.7" />
      <TresDirectionalLight :position="[5, 8, 5]" :intensity="2.2" />
      <TresDirectionalLight :position="[-6, 3, -4]" :intensity="0.9" />

      <!-- Models are grouped so framing measures them and not the lights. -->
      <TresGroup ref="modelsGroup">
        <GltfModel
          v-for="model in models"
          :key="model.id"
          :url="model.url"
          :position="model.position ?? [0, 0, 0]"
          :scale="model.scale ?? 1"
          :material="model.material ?? material"
          :drop-black-vertex-colors="dropBlackVertexColors"
        />
      </TresGroup>

      <SceneCamera
        ref="sceneCamera"
        :home-position="cameraPosition"
        :home-target="target"
        :framing="modelsGroup"
        :home-key="homeKey"
        :frame-key="frameKey"
        :log="logCamera"
      />
    </TresCanvas>
  </div>
</template>
