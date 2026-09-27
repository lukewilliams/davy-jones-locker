// Registry of control types. Adding a type is one `defineControlType` call:
// it supplies the initial value, the component that renders it, and (optionally)
// how the value is shaped when bound as a SQL parameter.

import CheckboxGroupControl from './components/CheckboxGroupControl.vue'
import SelectControl from './components/SelectControl.vue'

const types = new Map()

/**
 * @param {string} type  matches a control definition's `type`
 * @param {{
 *   component: object,
 *   createValue: (control: object) => any,
 *   toSqlParam?: (value: any) => any,
 * }} definition
 */
export function defineControlType(type, definition) {
  types.set(type, definition)
}

export function getControlType(type) {
  const definition = types.get(type)
  if (!definition) throw new Error(`Unknown control type "${type}"`)
  return definition
}

defineControlType('select', {
  component: SelectControl,
  createValue: (control) =>
    (control.options.find((o) => o.isDefault) ?? control.options[0]).value,
})

defineControlType('checkbox_group', {
  component: CheckboxGroupControl,
  createValue: (control) => control.options.filter((o) => o.isDefault).map((o) => o.value),
  // Bound as a comma-joined string; read back with
  // list_contains(string_split($var, ','), col). Option values must not contain commas.
  toSqlParam: (value) => value.join(','),
})
