# doc (`seamonster/doc`)

Renders a sequence of tagged markdown documents in Vue 3 widgets.

Fetching, filtering and ordering stay in the app; this library turns the rows it
is given into styled HTML. Vue is the peer dependency; `marked` is a real
dependency and does the parsing.

## Usage

```vue
<script setup>
import { computed } from 'vue'
import { DocView, fromRows } from 'seamonster/doc'
import 'seamonster/style.css'

const documents = computed(() => fromRows(rows.value))
</script>

<template>
  <DocView :documents="documents" />
</template>
```

## Data shape

```js
[{ id: 'overview', tag: 'building', body: '# Heading\n\nBody text.' }]
```

`body` is markdown (GFM, so tables and strikethrough work). Documents render in
the order given — sort before passing them in. `fromRows` maps query results
(`doc_id`, `tag`, `body` by default) into that shape:

```js
fromRows(rows, { id: 'doc_id', tag: 'tag', body: 'body' })
```

## Tags and styling

Each document is wrapped in `<article class="md-doc md-doc-{tag}">`. An empty or
missing tag yields just `md-doc`. Nothing in this library knows what a tag means
— the app supplies the appearance:

```css
.md-doc-building h1,
.md-doc-building h2 { color: #1a5fb4; }
```

A tag with no matching CSS renders with default styling, so tags can be added to
your data before the app knows about them. Pass `prefix` to namespace the classes
differently — the shipped stylesheet assumes the default, so a custom prefix
means styling the elements yourself.

The stylesheet carries baseline layout only (spacing, code blocks, tables,
blockquotes) and no colour beyond greys, so it composes with whatever the app
defines per tag.

| Token | Default | |
|---|---|---|
| `--md-doc-gap` | `20px` | space between documents |
| `--md-code-bg` | `#f5f5f5` | code span and block background |
| `--md-border` | `#ddd` | table cells and rules |
| `--md-quote-border` | `#ddd` | blockquote rule |
| `--md-muted` | `#555` | blockquote text |

## Security

Markdown is rendered with `v-html` and **is not sanitised**. That is safe only
while every document comes from a source you control, such as your own database.

If any document can be authored by a user — or by anyone who can write to a store
you do not fully control — sanitise before rendering. Add `dompurify` in the app
and pass already-clean bodies in, or fork this component to sanitise `marked`
output. A markdown parser is not a sanitiser: `marked` passes raw HTML, including
`<script>`, straight through by design.

## Distribution

Part of SEAMONSTER: its [README](../../README.md) covers installing it, the
peer dependencies, and Vite's `resolve.dedupe` for a linked copy.
