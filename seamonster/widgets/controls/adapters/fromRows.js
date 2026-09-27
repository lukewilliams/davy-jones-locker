// Adapter for the flat, one-row-per-option shape (a `ui_controls` table).
// Kept out of the core so the library never assumes where definitions come from:
// another project can hand `createControlPanel` a plain array instead.

const DEFAULT_COLUMNS = {
  id: 'control_id',
  type: 'control_type',
  label: 'label',
  variable: 'variable',
  optionValue: 'option_value',
  optionLabel: 'option_label',
  isDefault: 'is_default',
  disabledWhenVariable: 'disabled_when_variable',
  disabledWhenValue: 'disabled_when_value',
}

// "A, B" → ['A', 'B']. Spaces are tolerated so a comma-separated column can be
// written the way a person would type it.
function splitList(value) {
  return String(value ?? '')
    .split(',')
    .map((v) => v.trim())
    .filter(Boolean)
}

/**
 * @param {Array<object>} rows  already ordered by control, then option
 * @param {Partial<typeof DEFAULT_COLUMNS>} [columns]  override column names
 */
export function fromRows(rows, columns = {}) {
  const col = { ...DEFAULT_COLUMNS, ...columns }
  const byId = new Map()

  for (const row of rows) {
    if (!byId.has(row[col.id])) {
      byId.set(row[col.id], {
        id: row[col.id],
        type: row[col.type],
        label: row[col.label],
        variable: row[col.variable],
        options: [],
      })
    }
    byId.get(row[col.id]).options.push({
      value: row[col.optionValue],
      label: row[col.optionLabel],
      isDefault: row[col.isDefault],
      // Rules are per option. Put the same rule on every row of a control to
      // disable the whole control; `isDisabled` reports that case.
      // Empty string means "no rule" — all-null JSON columns don't infer a type.
      disabledWhen: row[col.disabledWhenVariable]
        ? {
            variable: row[col.disabledWhenVariable],
            // Comma-separated, read as OR, same spelling as scene_models'
            // show_when/hide_when. A single value needs no comma.
            value: splitList(row[col.disabledWhenValue]),
          }
        : null,
    })
  }

  return [...byId.values()]
}
