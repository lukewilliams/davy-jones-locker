<script setup>
// One page of a table ({ columns, rows, page, hasMore }), and a pager whose
// buttons ask for the page before or after (`turn` with -1 or 1).
const props = defineProps({
  data: { type: Object, required: true },
  busy: Boolean, // the pager waits while the node runs
})
const emit = defineEmits(['turn'])

const canTurn = (delta) => !props.busy && (delta < 0 ? props.data.page > 0 : props.data.hasMore)
const turn = (delta) => canTurn(delta) && emit('turn', delta)
const cell = (v) => (v === null || v === undefined ? '' : typeof v === 'object' ? JSON.stringify(v) : String(v))
</script>

<template>
  <div class="flow-data">
    <div class="flow-table-wrap">
      <table class="flow-table">
        <thead>
          <tr>
            <th v-for="(column, i) in data.columns" :key="i">{{ column }}</th>
          </tr>
        </thead>
        <tbody>
          <tr v-for="(row, r) in data.rows" :key="r">
            <td v-for="(value, i) in row" :key="i">{{ cell(value) }}</td>
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
