# panels (`seamonster/panels`)

The flowgraph editor's docked panels over any content: a map, a 3D scene, a
canvas. Panels collapse to rails on their edge, come to the front when
clicked, unlink to float (drag the title, resize from any edge), and answer
Ctrl+Space, exactly as in `FlowgraphEditor`, which is built on this. Vue and
Reka UI are peer dependencies; Vue Flow isn't needed.

```vue
<script setup>
import { FlowPanel, PanelHost } from 'seamonster/panels'
import 'seamonster/style.css'   // once, in the app
</script>

<template>
  <PanelHost class="viewport" storage-key="my-app:viewport" :hotkeys="false">
    <MyMap />                                  <!-- fills the host, under the panels -->
    <template #panels>
      <FlowPanel name="controls" title="Controls" dock="left" sizing="content" :default-size="280">
        …
      </FlowPanel>
      <FlowPanel name="table" title="Table" dock="bottom" sizing="content">
        …
      </FlowPanel>
    </template>
  </PanelHost>
</template>
```

The host is the window the panels are laid out in: give it a size (and it's
`position: relative` and `overflow: hidden`). Panels stay inside it, and
their rails sit in the gap along its edges.

## PanelHost

Slots:

- **default:** the content, filling the host under the panels. It's isolated
  (its own stacking context), so its layers stay under the panels however high
  their z-indexes go (Leaflet's run to 1000). Pointer events outside the panels
  and rails reach it as usual.
- **`panels`:** the `FlowPanel`s, and anything else that floats over the
  content.
- **`title`:** a title top left (the editor's name goes here). Linked left
  panels start below it; without one they start at the top.

Props:

| Prop | Default | |
|---|---|---|
| `storage-key` | the editor's key | where unlinked panels' sizes are saved in localStorage. Name one per host (`'<app>:<host>'`), or hosts with panels of the same name share them |
| `auto-hide-rails` | `true` | open panels leave the rails, except where panels can cover each other; `false` keeps a rail for every panel |
| `hotkeys` | `true` | panels' single-key `hotkey`s. `false` leaves letter keys to the content and the page (a `window` listener for H still fires) |
| `commands` | `{}` | commands for the host's own `v-menu` regions, beside the panels' (see [menu](../menu/README.md)) |
| `ignore` | `'[data-reka-popper-content-wrapper]'` | a selector: pressing on these doesn't deactivate the active panel |
| `layout` | none | a layout from `createPanelLayout`, for a host that needs it before mounting (the editor's menus do). `storage-key` and `auto-hide-rails` then go to `createPanelLayout` instead |

Through a template ref: `layout`, `el` (the host element) and `open(point,
menu)` (a menu at a point, as `MenuHost`'s).

**Keys** act only while focus is inside the host. Pressing anywhere in it
gives it focus (content that swallows pointer events, like a map, included),
and pressing outside the panels leaves no panel active. Ctrl+Space toggles the
active panel's link, or with none active collapses every panel and then
restores them. It's always on; `hotkeys` covers only the single keys.

**Menus:** the host is a `MenuHost`, so panel titles and rails have the panel
menu. Right-clicking elsewhere in the host shows no menu, not even the
browser's, unless a `v-menu` region there has one. `panelsSubmenu(layout)` is
the editor's Panels submenu, for the host's own menus.

## FlowPanel

The props are in [SEAMONSTER's README](../../README.md#panels). For panels
over a host's content, `sizing="content"` is usually what's wanted:

- **Left or right:** at the top of its edge, `default-size` wide (the edge
  facing the content resizes it), as tall as its content.
- **Bottom:** at the left, as wide and as tall as its content.
- **Capped** to the host, beyond which the body scrolls, across and down.
- They float over the content and each other, and don't push other panels.
  Each shows its rail, at the start of its edge, while it overlaps another
  panel, so a covered one can still be reached.
- Unlinked, a content panel is like any other: its rect is its own, and
  `min-width` / `min-height` (200 by 140) apply.

## Look

Panels are frosted glass in the editor's tokens (`--flow-*`, on `:root`), made
for its black window. Over light content, darken the glass on the host:

```css
.viewport {
  --flow-panel: rgba(24, 24, 27, 0.8);
}
```

A theme for any host, the editor's own included, is still to come (roadmap S2).
