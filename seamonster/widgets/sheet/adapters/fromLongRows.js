// Adapter for long-format query results — one row per cell, as a database
// naturally returns them. Kept out of the component so the library never assumes
// where the data came from: hand `SheetTable` a grid directly if you have one.

const DEFAULT_COLUMNS = {
  rowKey: 'row_index',
  columnKey: 'col_index',
  columnLabel: 'col_label',
  value: 'value',
}

// Numeric keys (indices) sort numerically; anything else sorts as text.
function compareKeys(a, b) {
  if (typeof a === 'number' && typeof b === 'number') return a - b
  return String(a).localeCompare(String(b))
}

/**
 * @param {Array<object>} cells  one row per cell
 * @param {{ meta?: string[] } & Partial<typeof DEFAULT_COLUMNS>} [options]
 *   `meta` names extra per-cell columns to carry through — `tooltip` and `tone`
 *   are rendered by SheetTable, anything else is available to the `cell` slot.
 *   Empty and null values are dropped, so a sparse column costs nothing.
 * @returns {{ columns: Array<{key: any, label: string}>,
 *             rows: Array<{key: any, cells: object, meta: object}> }}
 */
export function fromLongRows(cells, options = {}) {
  const { meta = [], ...columns } = options
  const col = { ...DEFAULT_COLUMNS, ...columns }
  const columnLabels = new Map()
  const rows = new Map()
  const rowMeta = new Map()

  for (const cell of cells) {
    const columnKey = cell[col.columnKey]
    const rowKey = cell[col.rowKey]
    // Last label wins; a column's label is expected to be the same in every row.
    columnLabels.set(columnKey, cell[col.columnLabel])
    if (!rows.has(rowKey)) rows.set(rowKey, {})
    rows.get(rowKey)[columnKey] = cell[col.value]

    if (meta.length === 0) continue
    const extras = {}
    for (const field of meta) {
      const value = cell[field]
      if (value !== undefined && value !== null && value !== '') extras[field] = value
    }
    if (Object.keys(extras).length === 0) continue
    if (!rowMeta.has(rowKey)) rowMeta.set(rowKey, {})
    rowMeta.get(rowKey)[columnKey] = extras
  }

  return {
    columns: [...columnLabels]
      .sort((a, b) => compareKeys(a[0], b[0]))
      .map(([key, label]) => ({ key, label })),
    rows: [...rows]
      .sort((a, b) => compareKeys(a[0], b[0]))
      .map(([key, cells]) => ({ key, cells, meta: rowMeta.get(key) ?? {} })),
  }
}
