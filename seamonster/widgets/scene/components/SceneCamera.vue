<script setup>
// Renders nothing. Lives inside TresCanvas so it can reach the active camera
// and the default controls, and owns the viewpoint behaviour: home, frame, and
// optional logging of the current view.
import { onBeforeUnmount, onMounted, watch } from 'vue'
import { useTresContext } from '@tresjs/core'
import { Vector3 } from 'three'
import { fitToObject } from '../fitToObject.js'

const props = defineProps({
  homePosition: { type: Array, required: true },
  homeTarget: { type: Array, required: true },
  // Object3D whose bounds `frame()` fits. Null disables framing.
  framing: { type: Object, default: null },
  // Fraction of extra room left around the bounding sphere when framing.
  fitPadding: { type: Number, default: 1.1 },
  // Single characters, or null to unbind.
  homeKey: { type: String, default: 'h' },
  frameKey: { type: String, default: 'f' },
  log: { type: Boolean, default: false },
})

const { camera, controls } = useTresContext()

const triple = (v) => [round(v.x), round(v.y), round(v.z)]
const round = (n) => Math.round(n * 1000) / 1000

function logView(reason) {
  const cam = camera.activeCamera.value
  if (!cam) return
  const position = triple(cam.position)
  const target = controls.value ? triple(controls.value.target) : null
  // Printed in the comma form the data files use, ready to paste.
  console.log(
    `[seamonster/scene] ${reason}\n` +
      `  "position": "${position.join(',')}"\n` +
      `  "target":   "${target ? target.join(',') : '(no controls)'}"`,
    { position, target, rotation: triple(cam.rotation) },
  )
}

function home() {
  const cam = camera.activeCamera.value
  if (!cam) return
  cam.position.set(...props.homePosition)
  applyTarget(cam, new Vector3(...props.homeTarget))
}

function frame() {
  const cam = camera.activeCamera.value
  if (!cam || !props.framing) return

  const center = fitToObject(cam, props.framing, {
    padding: props.fitPadding,
    pivot: controls.value?.target ?? null,
  })
  if (center) applyTarget(cam, center)
}

function applyTarget(cam, point) {
  if (controls.value) {
    controls.value.target.copy(point)
    controls.value.update()
  } else {
    cam.lookAt(point)
  }
}

// Ignore keys typed into a form control or into an open select listbox.
const IGNORE = 'input, textarea, select, [contenteditable="true"], [role="combobox"], [role="listbox"]'

function onKeydown(event) {
  if (event.altKey || event.ctrlKey || event.metaKey) return
  if (event.target?.closest?.(IGNORE)) return

  const key = event.key.toLowerCase()
  if (props.homeKey && key === props.homeKey.toLowerCase()) {
    event.preventDefault()
    home()
  } else if (props.frameKey && key === props.frameKey.toLowerCase()) {
    event.preventDefault()
    frame()
  }
}

// Log once the user stops moving, rather than every frame.
let attached = null
watch(
  [controls, () => props.log],
  ([instance, enabled]) => {
    if (attached) {
      attached.removeEventListener('end', onControlsEnd)
      attached = null
    }
    if (instance && enabled) {
      instance.addEventListener('end', onControlsEnd)
      attached = instance
    }
  },
  { immediate: true },
)
function onControlsEnd() {
  logView('view changed')
}

onMounted(() => {
  window.addEventListener('keydown', onKeydown)
  if (props.log) logView('initial view')
})

onBeforeUnmount(() => {
  window.removeEventListener('keydown', onKeydown)
  attached?.removeEventListener('end', onControlsEnd)
})

defineExpose({ home, frame, logView })
</script>

<template><slot /></template>
