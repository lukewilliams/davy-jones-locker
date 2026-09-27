# controls (`seamonster/controls`)

Declarative filter controls for Vue 3 widgets. You describe the controls as data;
the library builds the reactive values and renders the panel.

Vue and Reka UI are peer dependencies — the consuming app owns both.

## Usage

```js
import { createControlPanel, fromRows } from 'seamonster/controls'

const panel = createControlPanel(fromRows(rowsFromYourBackend))

panel.controls                         // definitions, in display order
panel.values                           // reactive { variable: value }
panel.setValue('region', 'SOUTH')
panel.isDisabled(control)             // every option disabled
panel.isOptionDisabled(control, option)
panel.disabledOptions(control)        // ['RIVERS']
panel.pick('region')                   // computed of those values, arrays copied
panel.sqlParams('showLayers')          // same, shaped for SQL binding
```

```vue
<script setup>
import { ControlPanel } from 'seamonster/controls'
import 'seamonster/style.css'
</script>

<template>
  <ControlPanel :panel="panel" />
</template>
```

`createControlPanel` is a factory, not a singleton: two panels can coexist, tests
get a fresh one per case, and the app decides where the instance lives (a module
export, a `provide()`, or a Pinia store).

## Control definitions

```js
{
  id: 'region',
  type: 'select',
  label: 'Region',
  variable: 'region',                 // the SQL variable name
  options: [{
    value: 'NORTH',
    label: 'North',
    isDefault: true,
    disabledWhen: { variable: 'x', value: 'Y' } | null,
  }],
  disabledWhen: null,                 // optional; applies to every option
}
```

### Disable rules

A rule reads *"disable this option while `variable` holds `value`"*. For a select
that is equality; for a checkbox group, whose value is an array, it is
containment — so `{ variable: 'showLayers', value: 'PARKS' }` means
"while Parks is ticked".

`value` may be a list, read as **OR**:

```js
{ variable: 'showLayers', value: ['PARKS', 'RIVERS'] }
```

In the flat row shape that is a comma-separated string —
`"PARKS,RIVERS"` — which `fromRows` splits. Spaces around the
commas are trimmed, and a single value needs no comma. Do **not** use a JSON
array in the column: a column mixing arrays and empty strings does not infer a
usable type.

Rules live on **options**. Put the same rule on every option to disable a whole
control: `isDisabled(control)` is true when every option is disabled, which is
what the control components use to disable themselves as a unit.
`disabledOptions(control)` gives the individually disabled ones.

A disabled option **keeps its value** — a greyed checkbox stays ticked and a
disabled select keeps its selection, so queries must ignore them in that case.

Rules are validated when the panel is created: an unknown variable, or a value
that is not one of that variable's options, throws immediately rather than
silently never matching.

`fromRows` converts the flat, one-row-per-option shape (a `ui_controls` table) into
that. Pass a second argument to override column names. If your definitions come
from somewhere else, skip the adapter and pass an array straight in.

A disabled control keeps its value, so queries must ignore it in that case.

## Adding a control type

```js
import { defineControlType } from 'seamonster/controls'
import ColorControl from './ColorControl.vue'

defineControlType('color', {
  component: ColorControl,           // props: control, modelValue, disabled
  createValue: (control) => control.options[0].value,
  toSqlParam: (value) => value,      // optional; omit if the raw value binds as-is
})
```

The component emits `update:modelValue`. Register the type before creating a panel
that uses it. Registering an existing name replaces the built-in, so an app can
swap a component's markup without forking the package.

## Styling

The stylesheet is opt-in and carries only what makes the Reka primitives usable.
Every value an app is expected to change is a custom property, and **those tokens
are the supported contract** — the `wc-` class names are internal and may change
between versions.

| Token | Default | |
|---|---|---|
| `--wc-surface` | `#fff` | select popover background |
| `--wc-border` | `#ddd` | popover border |
| `--wc-radius` | `6px` | popover corner radius |
| `--wc-highlight` | `#f0f0f0` | highlighted option background |
| `--wc-popover-z` | `100` | popover `z-index` |
| `--wc-control-gap` | `12px` | space above each control |
| `--wc-label-gap` | `4px` | space below a label |
| `--wc-checkbox-size` | `16px` | checkbox box (the tick scales with it) |
| `--wc-checkbox-gap` | `8px` | checkbox to its label |
| `--wc-disabled-opacity` | `0.5` | disabled select trigger |

They inherit, so set them on any ancestor:

```css
:root {
  --wc-border: #d4d4d4;
  --wc-radius: 4px;
}
```

One catch: the select popover is portalled to `<body>`, so it inherits from
`<body>`, not from the widget that opened it. Tokens that must reach the popover
(`--wc-surface`, `--wc-border`, `--wc-radius`, `--wc-highlight`, `--wc-popover-z`)
have to be set at `:root` or on `body`. The rest can be set anywhere.

Beyond the tokens: override the `wc-` classes directly, accepting that they are
internal, or replace a component entirely via `defineControlType` above.

## Distribution

Part of SEAMONSTER: its [README](../../README.md) covers installing it, the
peer dependencies, and Vite's `resolve.dedupe` for a linked copy.
