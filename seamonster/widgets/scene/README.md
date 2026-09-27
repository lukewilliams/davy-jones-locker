# scene (`seamonster/scene`)

A declarative [TresJS](https://tresjs.org) scene with orbit/zoom/pan controls and
data-driven glTF models.

Fetching and deciding *which* models to show stay in the app; this library loads
and renders the list it is given. `vue`, `three`, `@tresjs/core` and
`@tresjs/cientos` are all peer dependencies — the app owns those versions.

## Usage

```vue
<script setup>
import { computed } from 'vue'
import { SceneView, fromRows } from 'seamonster/scene'
import 'seamonster/style.css'

const models = computed(() => fromRows(rows.value, { baseUrl: '/' }))
</script>

<template>
  <SceneView :models="models" />
</template>
```

The canvas fills its container, so give the container a size.

### SceneView props

| Prop | Default | |
|---|---|---|
| `models` | required | `[{ id, url, position?, scale? }]` |
| `cameraPosition` | `[4, 3, 6]` | initial camera position |
| `target` | `[0, 1, 0]` | what the camera looks at and orbits around |
| `clearColor` | `#ffffff` | canvas background |
| `material` | `{ roughness: 0.45, metalness: 0.1 }` | merged into every mesh material |
| `dropBlackVertexColors` | `true` | ignore an all-black `COLOR_0` attribute |
| `homeKey` | `'h'` | return to `cameraPosition`/`target`; `null` unbinds |
| `frameKey` | `'f'` | fit the visible models; `null` unbinds |
| `logCamera` | `false` | log the view to the console when it settles |

## Viewpoint

`cameraPosition` and `target` are the **home** view: where the camera starts and
where <kbd>H</kbd> returns it. They are snapshotted on mount for the starting
position, so a later change to either updates where <kbd>H</kbd> goes without
yanking the camera — a prop rebuilt by a re-running query would otherwise reset
the view on every change. Mount the component only once the viewpoint is known. <kbd>F</kbd> frames whatever models are currently
mounted. Both are also exposed as methods, for binding to your own buttons:

```vue
<SceneView ref="scene" :models="models" />
<button @click="$refs.scene.home()">Home</button>
<button @click="$refs.scene.frame()">Frame</button>
```

Keys are ignored while focus is in a form control or an open select listbox, and
whenever Ctrl/Alt/Cmd is held.

`logCamera` prints position and target each time orbiting settles, in the comma
form the data files use:

```
[seamonster/scene] view changed
  "position": "42.31,38.05,64.22"
  "target":   "23.4,20.5,-30.1"
```

Note it logs **target**, not rotation. With orbit controls the rotation is
derived from position and target, so position + target is what reproduces a view
— setting a rotation without the matching target makes the camera jump on the
next drag. (Rotation is included in the expanded object if you want it.)

### fitToObject

The framing maths is exported for use outside `SceneView`:

```js
const center = fitToObject(camera, object, { padding: 1.1, pivot: controls.target })
if (center) { controls.target.copy(center); controls.update() }
```

It fits the bounding **sphere**, not the box. A box's projected size depends on
the viewing angle — seen cornerwise it spans its diagonal — so fitting the
largest box axis leaves corners outside the frustum from oblique angles. It also
sets `near`/`far` to sit just outside the sphere, which keeps depth precision
usable in a scene far from the origin.

A model may carry its own `material` object, which overrides the scene default
for that model.

## Materials

`material` is **merged** into each mesh's existing material, not substituted for
it, so textures, transparency and anything else the model brought survive. The
material is cloned first — glTF loaders cache and share materials, and mutating
them in place leaks across models. Pass `{}` to leave models exactly as authored.

`color` is applied through `.set()`, so `'#ff0000'`, `0xff0000` and a `Color` all
work. Everything else is assigned directly.

The default is slightly glossy so that form reads from the highlights, and
`SceneView` keeps ambient light low for the same reason — ambient lifts shadows
but washes out exactly the specular response that makes a surface legible.

### Black vertex colours

Some exporters (Houdini among them) write a `COLOR_0` attribute on every mesh
whether or not colours were ever assigned, leaving it filled with zeros. three
sees the attribute, enables `vertexColors`, and the mesh renders as unlit black —
white base colour multiplied by black — which no amount of lighting can fix.

`dropBlackVertexColors` (on by default) checks whether every vertex colour is
pure black and, if so, ignores the attribute so the base colour applies. Meshes
with real vertex colours are untouched. Set it to `false` to keep the raw
behaviour.

This is a workaround, not a repair: the durable fix is to stop the exporter
writing an unused `COLOR_0`.

Models are keyed by `id`, so a model that leaves the list is unmounted and its
glTF released — driving the array from your filters is all "load and unload"
needs to be.

### fromRows

```js
fromRows(rows, {
  baseUrl: '',        // prefixed to every url
  id: 'model_id',     // column names
  url: 'url',
  position: 'position',
  scale: 'scale',
})
```

`position` and `scale` are only set when the column is present, so the component
defaults apply otherwise.

## Composing your own scene

`GltfModel` is exported for scenes that need more than `SceneView` provides:

```vue
<TresCanvas>
  <TresPerspectiveCamera :position="[4, 3, 6]" />
  <OrbitControls />
  <TresAmbientLight :intensity="1.6" />
  <GltfModel url="/objects/Artificer.glb" />
</TresCanvas>
```

`GltfModel` renders the whole glTF scene. For one part of a model, or for
animations, use `useGLTF`/`useAnimations` from `@tresjs/cientos` directly:

```js
const { state, nodes } = useGLTF('/objects/Artificer.glb')
const rig = computed(() => nodes.value?.Engineer_Rig)
const { actions } = useAnimations(computed(() => state.value?.animations ?? []), rig)
```

## Required Vite config

TresJS elements are created by its own renderer rather than resolved as Vue
components, so the template compiler must be told to leave them alone. This
library sets it for its own SFCs; **an app writing `Tres*` tags in its own
templates needs it too**:

```js
vue({
  template: {
    compilerOptions: {
      isCustomElement: (tag) => tag.startsWith('Tres') && tag !== 'TresCanvas',
    },
  },
})
```

Without it you get unresolved-component warnings and an empty canvas.

Also add `resolve.dedupe: ['vue', 'three', '@tresjs/core', '@tresjs/cientos']`.
Two copies of `three` break every `instanceof` check inside it, and a linked
`file:` dependency makes that easy to cause by accident.

## Distribution

Part of SEAMONSTER: its [README](../../README.md) covers installing it, the
peer dependencies, and Vite's `resolve.dedupe` for a linked copy.
