import { computed, reactive } from 'vue'
import { getControlType } from './controlTypes.js'

/**
 * Builds a panel instance from control definitions.
 *
 * A factory rather than a module singleton: two panels can coexist, tests get a
 * fresh one per case, and a consuming app is free to put the result in a Pinia
 * store, a module export or a provide().
 *
 * @param {Array<{
 *   id: string, type: string, label: string, variable: string,
 *   options: Array<{ value: string, label: string, isDefault: boolean }>,
 *   disabledWhen?: { variable: string, value: any } | null,
 * }>} definitions  already in display order
 */
export function createControlPanel(definitions) {
  const controls = definitions
  const byVariable = new Map()
  const initial = {}

  for (const control of controls) {
    if (byVariable.has(control.variable)) {
      throw new Error(`Duplicate control variable "${control.variable}"`)
    }
    byVariable.set(control.variable, control)
    initial[control.variable] = getControlType(control.type).createValue(control)
  }

  const values = reactive(initial)

  function requireControl(variable) {
    const control = byVariable.get(variable)
    if (!control) throw new Error(`Unknown control variable "${variable}"`)
    return control
  }

  function setValue(variable, value) {
    requireControl(variable)
    values[variable] = value
  }

  // An option's own rule wins; `control.disabledWhen` applies to every option.
  function ruleFor(control, option) {
    return option.disabledWhen ?? control.disabledWhen ?? null
  }

  // A rule's `value` may be one value or a list of them, read as OR.
  function ruleValues(rule) {
    return Array.isArray(rule.value) ? rule.value : [rule.value]
  }

  // A checkbox group's value is an array, so "is X selected" is containment.
  // Scalars (selects) compare by equality.
  function satisfied(rule) {
    const current = values[rule.variable]
    return ruleValues(rule).some((expected) =>
      Array.isArray(current) ? current.includes(expected) : current === expected,
    )
  }

  // Disabled options keep their value, so queries must ignore them in that case.
  function isOptionDisabled(control, option) {
    const rule = ruleFor(control, option)
    return !!rule && satisfied(rule)
  }

  // The option values of `control` that are currently disabled.
  function disabledOptions(control) {
    return control.options.filter((o) => isOptionDisabled(control, o)).map((o) => o.value)
  }

  // A control is disabled when every one of its options is.
  function isDisabled(control) {
    return (
      control.options.length > 0 && control.options.every((o) => isOptionDisabled(control, o))
    )
  }

  // Rules are validated once, here, rather than failing silently at render time.
  for (const control of controls) {
    for (const option of control.options) {
      const rule = ruleFor(control, option)
      if (!rule) continue
      const target = byVariable.get(rule.variable)
      if (!target) {
        throw new Error(
          `Control "${control.id}" is disabled by unknown variable "${rule.variable}"`,
        )
      }
      const expected = ruleValues(rule)
      if (expected.length === 0) {
        throw new Error(`Control "${control.id}" has a disable rule with no value`)
      }
      for (const value of expected) {
        if (!target.options.some((o) => o.value === value)) {
          throw new Error(
            `Control "${control.id}" is disabled by "${value}", ` +
              `which is not an option of "${rule.variable}"`,
          )
        }
      }
    }
  }

  // Current values for the named variables. Arrays are copied so that a change
  // is seen as a change by watchers.
  function pick(...variables) {
    return computed(() => {
      const out = {}
      for (const variable of variables) {
        requireControl(variable)
        const value = values[variable]
        out[variable] = Array.isArray(value) ? [...value] : value
      }
      return out
    })
  }

  // Same, shaped for SQL binding by each control type's `toSqlParam`.
  function sqlParams(...variables) {
    return computed(() => {
      const out = {}
      for (const variable of variables) {
        const { toSqlParam } = getControlType(requireControl(variable).type)
        const value = values[variable]
        out[variable] = toSqlParam ? toSqlParam(value) : value
      }
      return out
    })
  }

  return {
    controls,
    values,
    setValue,
    isDisabled,
    isOptionDisabled,
    disabledOptions,
    pick,
    sqlParams,
  }
}
