import { watch } from 'vue'
import { defineNodeCategory, defineNodeKind, NODE_CATEGORIES, NODE_KINDS } from 'seamonster'

// The app's own node kinds, defined on the engine (its nodes.py), defined in
// the browser too, so they're in the Library and menus and a graph's nodes of
// them are no longer placeholders. Whenever the engine's list of kinds changes
// (status.nodes, from /health), GET /nodes is read and whatever the page
// doesn't have yet is defined: a kind the app already defined in the browser
// keeps that definition. A kind can't be redefined, so one the engine changes
// while the page is open changes on the next reload.
//
// They're defined with `where: 'server'` and no `run`, so SEAMONSTER runs them
// through the engine client's runNode.

export function defineServerKinds(client, { log = (text) => console.warn(text) } = {}) {
  let asked = null
  return watch(
    () => client.status.nodes,
    async (names) => {
      if (!names?.length || names.every((name) => name in NODE_KINDS)) return
      const key = names.join('\n')
      if (asked === key) return
      asked = key
      let listed
      try {
        listed = await client.nodes()
      } catch (e) {
        asked = null // try again on the next change
        log(`Couldn't read the server's node kinds: ${e.message}`, 'error')
        return
      }
      for (const category of listed.categories ?? []) {
        if (NODE_CATEGORIES.some((c) => c.id === category.id)) continue
        try {
          defineNodeCategory(category)
        } catch (e) {
          log(`The server's node category ${category.id} can't be used here: ${e.message}`, 'error')
        }
      }
      for (const kind of listed.kinds ?? []) {
        if (kind.kind in NODE_KINDS) continue
        try {
          defineNodeKind({ ...kind, where: 'server' })
        } catch (e) {
          log(`The server's ${kind.kind} nodes can't be used here: ${e.message}`, 'error')
        }
      }
    },
    { immediate: true },
  )
}
