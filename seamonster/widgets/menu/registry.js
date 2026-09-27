// Registry of menu item types. Adding a type is one `defineMenuItemType` call
// with the component that renders it. The built-ins are registered in builtins.js.

const types = new Map()

/**
 * @param {string} type  matches a menu item's `type` (plain items omit it: 'item')
 * @param {object} component  props: item (resolved, see resolveItems), inset
 */
export function defineMenuItemType(type, component) {
  types.set(type, component)
}

export function getMenuItemType(type) {
  const component = types.get(type)
  if (!component) throw new Error(`Unknown menu item type "${type}"`)
  return component
}
