<script setup>
// One page of a table ({ columns, rows, page, hasMore }), and a pager whose
// buttons ask for the page before or after (`turn` with -1 or 1). A table
// with geometry also has `geometry` (by column: null, or { crs, types, z,
// empty, invalid }) and `wkt` (by row and column), from the runner's preview.
import { computed } from 'vue'

const props = defineProps({
  data: { type: Object, required: true },
  busy: Boolean, // the pager waits while the node runs
})
const emit = defineEmits(['turn'])

const canTurn = (delta) => !props.busy && (delta < 0 ? props.data.page > 0 : props.data.hasMore)
const turn = (delta) => canTurn(delta) && emit('turn', delta)
const cell = (v) => (v === null || v === undefined ? '' : typeof v === 'object' ? JSON.stringify(v) : String(v))

// A geometry column's types and CRS ("POLYGON · EPSG:4326"), and what's wrong
// with any of its geometries.
function geometryHeader(info) {
  const types = info.types?.length ? info.types.join(', ') + (info.z ? ' Z' : '') : 'GEOMETRY'
  const problems = [info.invalid && `${info.invalid} invalid`, info.empty && `${info.empty} empty`].filter(Boolean)
  return { label: `${types} · ${info.crs ?? 'CRS unknown'}`, problems: problems.join(' · ') }
}
const geometryHeaders = computed(() => (props.data.geometry ?? []).map((info) => (info ? geometryHeader(info) : null)))
</script>

<template>
  <div class="flow-data">
    <div class="flow-table-wrap">
      <table class="flow-table">
        <thead>
          <tr>
            <th v-for="(column, i) in data.columns" :key="i">
              {{ column }}
              <template v-if="geometryHeaders[i]">
                <span class="flow-table-geometry">{{ geometryHeaders[i].label }}</span>
                <span
                  v-if="geometryHeaders[i].problems"
                  class="flow-table-geometry flow-table-geometry-problem"
                  title="Invalid: self-intersecting rings and the like (ST_IsValid). Empty: no coordinates (ST_IsEmpty)."
                >{{ geometryHeaders[i].problems }}</span>
              </template>
            </th>
          </tr>
        </thead>
        <tbody>
          <tr v-for="(row, r) in data.rows" :key="r">
            <td v-for="(value, i) in row" :key="i" :title="data.wkt?.[r]?.[i] ?? undefined">{{ cell(value) }}</td>
          </tr>
        </tbody>
      </table>
    </div>
    <div class="flow-pager">
      <span>Page {{ data.page + 1 }}</span>
      <button type="button" class="flow-button flow-button--quiet" :aria-disabled="!canTurn(-1)" @click="turn(-1)">
        Prev
      </button>
      <button type="button" class="flow-button flow-button--quiet" :aria-disabled="!canTurn(1)" @click="turn(1)">
        Next
      </button>
    </div>
  </div>
</template>
