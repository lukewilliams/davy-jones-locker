// Menu regions: elements marked with v-menu. On right-click, a MenuHost opens
// the menu of the nearest region around the pointer.

const regions = new WeakMap()

// The click landed inside a nested MenuHost, which handles it instead.
export const OTHER_HOST = Symbol('other-host')

// v-menu="items" or v-menu="{ items, context }"; null marks "no menu here".
export function normalize(value) {
  return Array.isArray(value) || typeof value === 'function' ? { items: value } : (value ?? null)
}

export const vMenu = {
  mounted(el, { value }) {
    regions.set(el, normalize(value))
  },
  updated(el, { value }) {
    regions.set(el, normalize(value))
  },
  unmounted(el) {
    regions.delete(el)
  },
}

export function findRegion(target, host) {
  for (let node = target; node && node !== host; node = node.parentElement) {
    if (node.hasAttribute('data-wm-host')) return OTHER_HOST
    if (regions.has(node)) return regions.get(node)
  }
  return null
}
