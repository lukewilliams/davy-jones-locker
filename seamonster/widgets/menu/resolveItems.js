// Turns item definitions into what the item components render: commands looked
// up, and function-valued fields (label, disabled, checked, ...) read with the
// region's context. Run inside a computed, so an open menu stays current.

import { normalizeBadge } from './tone.js'

const read = (value, context) => (typeof value === 'function' ? value(context) : value)

// A command is a function, or { run, label?, disabled?, hidden?, checked?, value? }.
function lookup(commands, name) {
  const command = commands?.[name]
  if (!command) return null
  return typeof command === 'function' ? { run: command } : command
}

// No separators at either end or next to each other (e.g. once items are hidden).
function tidySeparators(items) {
  return items.filter(
    (item, i) =>
      item.type !== 'separator' ||
      (i > 0 && i < items.length - 1 && items[i + 1].type !== 'separator'),
  )
}

/**
 * @param {Array<object> | (context) => Array<object>} items
 * @param {any} context  the region's context, passed to every function
 * @param {Record<string, Function | object>} commands  the host's commands
 * @param {object | null} tone  inherited from the enclosing submenu (see tone.js)
 */
export function resolveItems(items, context, commands, tone = null) {
  const out = []
  for (const item of read(items, context) ?? []) {
    const type = item.type ?? 'item'
    const command = item.command ? lookup(commands, item.command) : null
    const unknown = !!item.command && !command
    if (unknown) console.error(`[seamonster/menu] Unknown command "${item.command}"`)
    if (read(item.hidden ?? command?.hidden, context)) continue

    const badge = normalizeBadge(read(item.badge, context))
    const resolved = {
      ...item,
      type,
      label: read(item.label ?? command?.label, context),
      badge,
      // `tone: false` opts an item (and its submenu) out of an inherited tone.
      tone: item.tone === false ? null : (normalizeBadge(read(item.tone, context)) ?? badge ?? tone),
      disabled: unknown || !!read(item.disabled ?? command?.disabled, context),
      checked: read(item.checked ?? command?.checked, context),
      value: read(item.value ?? command?.value, context),
      // Called with the selected value for radio groups, otherwise item.args.
      run: (arg) => (item.action ?? command?.run)?.(context, arg ?? item.args),
    }
    if (type === 'submenu') {
      resolved.items = resolveItems(item.items, context, commands, resolved.tone)
      if (!resolved.items.length) continue
    }
    out.push(resolved)
  }
  return tidySeparators(out)
}
