<script setup>
// Renders a prepared grid. Fetching, filtering and error handling stay in the app;
// this component only knows how to display columns and rows.
defineProps({
  columns: { type: Array, required: true },
  rows: { type: Array, required: true },
  // Leading column of row headers (`row.header`, falling back to `row.key`).
  rowHeaders: { type: Boolean, default: true },
})

// Per-cell extras from `fromLongRows({ meta: [...] })`.
const metaFor = (row, column) => row.meta?.[column.key] ?? {}

// `tone` becomes a class rather than a colour: what a tone means belongs to the
// app, the same way the doc widget leaves tag colours to its consumer.
const toneClass = (tone) => (tone ? `ws-tone-${tone}` : null)
</script>

<template>
  <div class="ws-scroll">
    <table class="ws-sheet">
      <thead>
        <tr>
          <th v-if="rowHeaders" class="ws-corner"></th>
          <th v-for="column in columns" :key="column.key">{{ column.label }}</th>
        </tr>
      </thead>
      <tbody>
        <tr v-for="row in rows" :key="row.key">
          <th v-if="rowHeaders" class="ws-row-header">{{ row.header ?? row.key }}</th>
          <td
            v-for="column in columns"
            :key="column.key"
            :title="metaFor(row, column).tooltip"
            :class="toneClass(metaFor(row, column).tone)"
          >
            <slot
              name="cell"
              :row="row"
              :column="column"
              :value="row.cells[column.key]"
              :meta="metaFor(row, column)"
            >
              {{ row.cells[column.key] }}
            </slot>
          </td>
        </tr>
      </tbody>
    </table>
  </div>
</template>
