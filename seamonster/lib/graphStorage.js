import { onBeforeUnmount, onMounted, watch } from 'vue'

// How long edits settle before the graph is saved (a drag or pan changes it
// every frame).
const SAVE_DELAY = 400

/*
 * Keeps a flow window's open graph in `storage`, which the host app supplies:
 *
 *   { load(): doc | null | Promise<doc | null>, save(doc): void }
 *
 * where doc is a pipeline document (graphDocument.js). On mount the graph is
 * loaded from it; from then on every edit (and pan or zoom) is saved, once
 * edits settle, and straight away if the page is hidden or closed. Without
 * storage the graph starts empty and isn't kept. Call from the window's setup.
 */
export function useGraphStorage(graph, storage) {
  let timer = null
  let stopWatching = null

  function flush() {
    if (!timer) return
    clearTimeout(timer)
    timer = null
    storage.save(graph.snapshot.value)
  }

  function schedule() {
    clearTimeout(timer)
    timer = setTimeout(flush, SAVE_DELAY)
  }

  const onVisibility = () => document.visibilityState === 'hidden' && flush()

  onMounted(async () => {
    graph.load(storage ? await storage.load() : null)
    if (!storage) return
    // Only after loading, so the empty graph before it never overwrites the saved one.
    stopWatching = watch(graph.snapshot, schedule)
    window.addEventListener('pagehide', flush)
    document.addEventListener('visibilitychange', onVisibility)
  })

  onBeforeUnmount(() => {
    stopWatching?.()
    window.removeEventListener('pagehide', flush)
    document.removeEventListener('visibilitychange', onVisibility)
    if (storage) flush()
  })
}
