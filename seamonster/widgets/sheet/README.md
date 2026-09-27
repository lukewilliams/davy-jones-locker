# sheet (`seamonster/sheet`)

Spreadsheet-style table for displaying query results in Vue 3 widgets.

It renders a prepared grid and nothing else — fetching, filtering, loading and
error states stay in the app. Vue is the only peer dependency.

## Usage

```vue
<script setup>
import { computed } from 'vue'
import { SheetTable, fromLongRows } from 'seamonster/sheet'
import 'seamonster/style.css'

const grid = computed(() => fromLongRows(rows.value))
</script>

<template>
  <SheetTable :columns="grid.columns" :rows="grid.rows" />
</template>
```

## Data shape

```js
columns: [{ key: 1, label: 'Column A' }]
rows:    [{ key: 1, header: '1', cells: { 1: 'value' } }]
```

`cells` is keyed by column `key`. `header` is the optional row-header text and
falls back to the row's `key`. Pass `:row-headers="false"` to drop the leading
header column entirely.

### Per-cell extras

A row may carry `meta`, keyed by column `key`, for things that belong to one cell
rather than to its value:

```js
{ key: 1, cells: { 1: 'n/a' }, meta: { 1: { tooltip: 'Not measured this quarter' } } }
```

Two fields are rendered directly — `tooltip` becomes the cell's `title`, and
`tone` becomes a `ws-tone-{tone}` class. What a tone *means* is left to the app:

```css
.ws-tone-up { color: #b3261e; }
.ws-tone-down { color: #1c7245; }
```

Any other field is passed to the `cell` slot as `meta` and ignored otherwise.

Both arrays are rendered in the order given — sort before passing them in.

### fromLongRows

Converts long-format results (one row per cell, as a database returns them) into
that shape, sorting numeric keys numerically:

```js
fromLongRows(cells, {
  rowKey: 'row_index',      // defaults shown
  columnKey: 'col_index',
  columnLabel: 'col_label',
  value: 'value',
  meta: ['tooltip', 'tone'],   // extra per-cell columns to carry through
})
```

`meta` names further columns on each cell row to collect into `row.meta`. Empty
and null values are dropped, so a column that only applies to a few cells costs
nothing elsewhere.

If your data is already a grid, skip the adapter and pass it straight in.

## Formatting cells

A `cell` slot overrides the default text rendering:

```vue
<SheetTable :columns="grid.columns" :rows="grid.rows">
  <template #cell="{ value, column }">
    <span :class="{ negative: value < 0 }">{{ format(value, column) }}</span>
  </template>
</SheetTable>
```

Slot props: `row`, `column`, `value`, `meta`.

## Styling

The stylesheet is opt-in. Every value an app is expected to change is a custom
property, and **those tokens are the supported contract** — the `ws-` class names
are internal and may change between versions.

| Token | Default | |
|---|---|---|
| `--ws-border` | `#d4d4d4` | cell borders |
| `--ws-header-bg` | `#f3f3f3` | header row and row-header column |
| `--ws-header-color` | `#444` | header text |
| `--ws-font-size` | `13px` | table text |
| `--ws-cell-padding` | `3px 8px` | cell padding |
| `--ws-cell-min-width` | `80px` | minimum data column width |
| `--ws-row-header-width` | `28px` | minimum row-header column width |

They inherit, so set them on any ancestor:

```css
.my-widget {
  --ws-border: #ccc;
  --ws-cell-min-width: 120px;
}
```

`SheetTable` has a single root element, so a `class` on the component lands on the
scroll container and scoped styles reach it directly.

## Distribution

Part of SEAMONSTER: its [README](../../README.md) covers installing it, the
peer dependencies, and Vite's `resolve.dedupe` for a linked copy.
