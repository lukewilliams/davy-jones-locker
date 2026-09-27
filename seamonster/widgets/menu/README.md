# menu (`seamonster/menu`)

Declarative, context-sensitive context menus for Vue 3 widgets. You describe the
menus as data and mark which parts of a widget they belong to; the library opens
the right one on right-click (or long-press on touch) and renders it with Reka UI,
which handles focus, keyboard navigation, typeahead, submenus, dismissal and
collision flipping.

Vue and Reka UI are peer dependencies — the consuming app owns both.

## Usage

```vue
<script setup>
import { MenuHost, vMenu } from 'seamonster/menu'
import 'seamonster/style.css'   // once, in the app

const commands = {
  'panel.collapse': (name) => collapse(name),
}
const panelMenu = [
  { label: 'Collapse', command: 'panel.collapse' },
]
</script>

<template>
  <!-- The widget's root element. Menus are portalled into it. -->
  <MenuHost class="my-widget" :commands="commands">
    <h2 v-menu="{ items: panelMenu, context: 'manage' }">Manage</h2>
    <div v-menu="canvasMenu" class="canvas" />
  </MenuHost>
</template>
```

- **`MenuHost`** renders the owning widget's root element (`as`, default `div`;
  attributes and listeners pass through, and the element is exposed as `el`).
  Right-clicking inside it opens the menu of the nearest `v-menu` region around
  the pointer. With no region, or a menu with no visible items, the browser's
  menu is suppressed and nothing opens. Props: `commands`, `modal` (default
  `true`: the rest of the page ignores the pointer while a menu is open).
  Through a template ref, `open({ x, y }, menu)` opens a menu from code at a
  point in client coordinates, taking what `v-menu` takes (say, a menu of what
  to create where a dragged connection was dropped).
- **`v-menu`** marks a region: `v-menu="items"` or
  `v-menu="{ items, context }"`. `context` is passed to every function and
  command in that menu, so one menu definition can serve many regions (every
  panel title, say). `v-menu="null"` marks a region with no menu.

Hosts nest: a widget with its own `MenuHost` inside an app's `MenuHost` handles
right-clicks within itself, and the app's host stands down.

## Item definitions

```js
{
  type: 'item',            // default; also checkbox, radio, submenu, separator, label
  label: 'Collapse',       // or (context) => string; or from the command
  command: 'panel.collapse', // run with (context, args), or…
  action: (context, args) => {}, // …an inline function instead
  args: { any: 'value' },  // passed to the command/action
  shortcut: 'Ctrl+Space',  // displayed only; the widget binds the key itself
  badge: '#4d7dfb',        // optional coloured dot: a CSS colour, or { color?, class? }
  tone: false,             // see Tones; defaults to the badge, else inherited
  disabled: false,         // or (context) => boolean
  hidden: false,           // or (context) => boolean
  checked: true,           // checkbox: or (context) => boolean
  value: 'a',              // radio: the selected value
  options: [{ value, label, badge?, shortcut?, disabled? }], // radio
  items: [ … ],            // submenu: or (context) => items
  id: 'collapse',          // optional stable key
}
```

Function-valued fields are read while the menu is open, inside a computed, so the
menu reflects current state. Hidden items are dropped, then empty submenus and
stray separators (leading, trailing, doubled).

`items` itself may be a function of the context, for menus built from state.

### Tones

An item's **tone** is its badge, or else the tone of the submenu it sits in, so
everything under a badged submenu shares that badge's colour. A toned row gets
the `wm-toned` class, the badge's `class`, and `--wm-tone-color` (from its
`color`), for a widget to style — say, highlighting it in the badge's colours
rather than the default. Set `tone` to a badge-shaped value to choose one
without drawing a dot, or `tone: false` to opt an item (and its submenu) out.

### Commands

`commands` maps names to a function, or to an object that also supplies state:

```js
'panel.toggleLinked': {
  run: (name) => layout.toggleLinked(name),
  checked: (name) => layout.find(name).linked,   // label, disabled, hidden, value too
}
```

An item's own fields win over its command's. Commands keep menus serialisable
(they can come from data, like the controls widget's definitions) and let a keyboard
shortcut and a menu item share one implementation. An unknown command logs an
error and renders its item disabled.

### Adding an item type

```js
import { defineMenuItemType } from 'seamonster/menu'
import SliderItem from './SliderItem.vue'

defineMenuItemType('slider', SliderItem)   // props: item (resolved), inset
```

Registering an existing name replaces the built-in.

## Styling

The stylesheet is opt-in and carries only what makes the menu usable. The
supported contract is the tokens below **and** the `wm-` part classes, since
widgets are expected to restyle their menus beyond what tokens can express.

Menus are portalled into their `MenuHost`'s element, so they inherit from the
widget that owns them: set app defaults on `:root` and widget overrides on the
widget's root. A widget's overrides reach only its own menus.

```css
:root        { --wm-radius: 4px; }                 /* app */
.my-widget { --wm-surface: rgba(24, 24, 27, 0.72); }  /* widget */
.my-widget .wm-item[data-highlighted] { … }       /* widget, beyond tokens */
```

| Token | Default | |
|---|---|---|
| `--wm-surface` | `#fff` | menu background |
| `--wm-border` | `#ddd` | menu border |
| `--wm-radius` | `6px` | menu corner radius |
| `--wm-shadow` | `0 8px 24px rgba(0,0,0,.15)` | menu shadow |
| `--wm-blur` | `0px` | backdrop blur behind the menu |
| `--wm-text` | `#222` | item text |
| `--wm-text-muted` | `#777` | shortcuts, chevrons, labels |
| `--wm-highlight` | `#f0f0f0` | highlighted item background |
| `--wm-padding` | `4px` | menu padding |
| `--wm-item-padding` | `4px 8px` | item padding |
| `--wm-item-radius` | `4px` | item corner radius |
| `--wm-gap` | `8px` | space between an item's parts |
| `--wm-font-size` | `13px` | |
| `--wm-min-width` | `160px` | |
| `--wm-badge-size` | `8px` | badge dot |
| `--wm-badge-color` | `currentColor` | set per item by `badge` |
| `--wm-tone-color` | — | set per row by its tone's `color` |
| `--wm-separator` | `--wm-border` | separator line |
| `--wm-disabled-opacity` | `0.5` | |
| `--wm-z` | `100` | menu `z-index` |

| Part class | |
|---|---|
| `wm-content` | a menu (also `wm-sub-content` on submenus) |
| `wm-item` | any selectable row (also `wm-sub-trigger`) |
| `wm-toned` | a row with a tone, plus the tone's `class` and `--wm-tone-color` |
| `wm-label` | a non-selectable heading row |
| `wm-indicator` | check / radio mark column |
| `wm-badge` | the badge dot, plus the item's `badge.class` |
| `wm-item-label` | the row's text |
| `wm-shortcut` | the shortcut text |
| `wm-sub-indicator` | a submenu's chevron |
| `wm-separator` | |

Reka's state attributes are available on rows: `[data-highlighted]`,
`[data-disabled]`, `[data-state="checked"]`, `[data-state="open"]` (submenu
triggers).

## Distribution

Part of SEAMONSTER: its [README](../../README.md) covers installing it, the
peer dependencies, and Vite's `resolve.dedupe` for a linked copy.
