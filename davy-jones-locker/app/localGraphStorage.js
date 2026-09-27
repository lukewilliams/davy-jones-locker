// Keeps the open graph in localStorage, so a refresh brings it back, and the
// data DataIngest nodes read from their files in IndexedDB (localStorage's few
// MB would soon run out). FlowgraphEditor takes any storage with this shape (see
// seamonster's lib/graphStorage.js and lib/flowGraph.js); explicit saves to
// the user's library go through the engine later.
//
// createLocalGraphStorage(name): the graph is kept under `<name>:open-graph`,
// the files in the IndexedDB database `<name>`. Give each app its own name.

const FILES_STORE = 'files'

export function createLocalGraphStorage(name = 'davy-jones-locker') {
  const key = `${name}:open-graph`

  let opening = null
  const openFiles = () =>
    (opening ??= new Promise((resolve, reject) => {
      const request = indexedDB.open(name, 1)
      request.onupgradeneeded = () => request.result.createObjectStore(FILES_STORE)
      request.onsuccess = () => resolve(request.result)
      request.onerror = () => reject(request.error)
    }))

  // One request against the files store, as a promise.
  async function files(mode, act) {
    const db = await openFiles()
    return new Promise((resolve, reject) => {
      const request = act(db.transaction(FILES_STORE, mode).objectStore(FILES_STORE))
      request.onsuccess = () => resolve(request.result)
      request.onerror = () => reject(request.error)
    })
  }

  return {
    load() {
      try {
        return JSON.parse(localStorage.getItem(key))
      } catch {
        return null // unavailable, or not JSON: start empty
      }
    },
    save(doc) {
      try {
        localStorage.setItem(key, JSON.stringify(doc))
      } catch {
        // Storage unavailable (private window, blocked, full): the graph just isn't kept.
      }
    },

    // Files unavailable (IndexedDB blocked): they're held in memory, for this visit only.
    async putFile(key, bytes) {
      try {
        await files('readwrite', (store) => store.put(bytes, key))
      } catch {}
    },
    async getFile(key) {
      try {
        return (await files('readonly', (store) => store.get(key))) ?? null
      } catch {
        return null
      }
    },
    async deleteFile(key) {
      try {
        await files('readwrite', (store) => store.delete(key))
      } catch {}
    },
  }
}
