import { reactive } from 'vue'

// The engine (davy-jones-locker's Python engine) as FlowgraphEditor's `server`
// prop. createEngineClient({ url, name }) makes one: `url` is where the browser
// reaches it (an app's engines sit behind its own origin, at
// /engines/<service>/), and `name` is what messages call it.
//
//   status     whether it's reachable (reactive): checked every 5 seconds
//              while it is (so a drop shows quickly), every 15 while it isn't
//              (each failed check is an error in the browser's console), and
//              whenever the page comes back into view or online
//   query      runs SQL on the server, over the query database and the inputs
//              sent with it; resolves to the result as Parquet
//   runPython  runs a PythonScript node's code in the server's sandbox
//   runNode    runs a node of one of the app's own kinds, in the engine's node
//              worker (SEAMONSTER calls it for a kind whose `where` is 'server'
//              and that has no `run` of its own)
//   nodes      the app's own node kinds and categories, as GET /nodes has them
//              (serverKinds.js defines them in the browser)
//   assist     the AI assistant: a node's code from a request in plain words
//
// Inputs are [{ name, bytes }]: Parquet, named by reference name (or
// name.table). The engine's README has the API.
//
// The engine answers GET /health with JSON { status: 'ok', host?, port?,
// assistant?, nodes? }; anything else (an error, no answer within 3 seconds, or
// the dev server's index.html when there's no engine) means it's unavailable.
// `assistant` is { model, sampleRows } when it has the AI assistant set up, and
// `nodes` the names of the app's own node kinds (status.nodes follows it).

const CONNECTED_INTERVAL_MS = 5000
const UNAVAILABLE_INTERVAL_MS = 15000
const TIMEOUT_MS = 3000

const PARQUET = 'application/vnd.apache.parquet'

function form(fields, inputs) {
  const body = new FormData()
  for (const [name, value] of Object.entries(fields)) body.append(name, value)
  for (const { name, bytes } of inputs) body.append('input', new Blob([bytes], { type: PARQUET }), name)
  return body
}

export function createEngineClient({ url, name = 'The engine' }) {
  const base = url.replace(/\/+$/, '')

  // The engine's errors are JSON { error }; anything else says what came back.
  async function failure(response) {
    try {
      const { error } = await response.json()
      if (error) return new Error(error)
    } catch {}
    return new Error(`${name} answered ${response.status} ${response.statusText}.`)
  }

  async function send(path, init) {
    let response
    try {
      response = await fetch(`${base}${path}`, { method: 'POST', ...init })
    } catch {
      throw new Error(`${name} couldn't be reached.`)
    }
    if (!response.ok) throw await failure(response)
    return response
  }

  const post = (path, fields, inputs) => send(path, { body: form(fields, inputs) })

  const client = {
    status: reactive({ state: 'checking', address: null, assistant: null, nodes: [] }),

    async query({ sql, inputs = [] }) {
      const response = await post('/query', { sql }, inputs)
      return new Uint8Array(await response.arrayBuffer())
    },

    // Resolves to { output, value?, variables?, error?, table? (Parquet) }.
    async runPython({ code, inputs = [] }) {
      const response = await post('/run/python', { code }, inputs)
      const parts = await response.formData()
      const result = JSON.parse(parts.get('result'))
      const table = parts.get('table')
      return table ? { ...result, table: new Uint8Array(await table.arrayBuffer()) } : result
    },

    // { kind, node (its data), inputs: [{ ref, id, slot, pin, bytes } or
    // { ..., tables: [{ name, bytes }] }], files: [{ key, bytes }] }, the tables
    // Parquet. Resolves to { output, value?, error?, outputs: [{ slot, bytes }
    // or { slot, tables: [{ name, bytes }] }] }.
    async runNode({ kind, node, inputs = [], files = [] }) {
      const body = new FormData()
      body.append('kind', kind)
      body.append('node', JSON.stringify(node))
      const specs = inputs.map((input, i) => {
        const { ref, id, slot, pin } = input
        if (!input.tables) {
          body.append('input', new Blob([input.bytes], { type: PARQUET }), `i${i}`)
          return { ref, id, slot, pin, part: `i${i}` }
        }
        const tables = input.tables.map((t, j) => {
          body.append('input', new Blob([t.bytes], { type: PARQUET }), `i${i}-${j}`)
          return { name: t.name, part: `i${i}-${j}` }
        })
        return { ref, id, slot, pin, tables }
      })
      body.append('inputs', JSON.stringify(specs))
      for (const { key, bytes } of files) body.append('file', new Blob([bytes]), key)

      const parts = await (await send('/run/node', { body })).formData()
      const result = JSON.parse(parts.get('result'))
      const tables = new Map()
      for (const file of parts.getAll('table')) tables.set(file.name, new Uint8Array(await file.arrayBuffer()))
      const outputs = (result.outputs ?? []).map((o) =>
        o.tables
          ? { slot: o.slot, tables: o.tables.map((t) => ({ name: t.name, bytes: tables.get(t.part) })) }
          : { slot: o.slot, bytes: tables.get(o.part) },
      )
      return { ...result, outputs }
    },

    // { categories: [...], kinds: [...] }: definitions SEAMONSTER's
    // defineNodeCategory and defineNodeKind take.
    async nodes() {
      const response = await fetch(`${base}/nodes`, { cache: 'no-store' })
      if (!response.ok) throw await failure(response)
      return response.json()
    },

    // { kind, request, code, inputs: [described inputs] } -> { code, note, model }
    // (seamonster's lib/graphRunner.js describes the inputs).
    async assist(body) {
      const response = await send('/assist', {
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify(body),
      })
      return response.json()
    },
  }

  let timer = null

  async function check() {
    const { status } = client
    clearTimeout(timer)
    try {
      const response = await fetch(`${base}/health`, { cache: 'no-store', signal: AbortSignal.timeout(TIMEOUT_MS) })
      const json = response.ok && response.headers.get('content-type')?.includes('json')
      const body = json ? await response.json() : null
      if (body?.status !== 'ok') throw new Error('not the engine')
      status.state = 'connected'
      status.address = body.host && body.port ? `${body.host}:${body.port}` : location.host
      // Replaced only when they change, not on every check.
      if (JSON.stringify(body.assistant ?? null) !== JSON.stringify(status.assistant)) status.assistant = body.assistant ?? null
      if (JSON.stringify(body.nodes ?? []) !== JSON.stringify(status.nodes)) status.nodes = body.nodes ?? []
    } catch {
      status.state = 'unavailable'
      status.address = null
      status.assistant = null
    }
    // Not while the page is hidden: coming back into view checks straight away.
    if (document.visibilityState === 'visible') {
      timer = setTimeout(check, status.state === 'connected' ? CONNECTED_INTERVAL_MS : UNAVAILABLE_INTERVAL_MS)
    }
  }

  check()
  document.addEventListener('visibilitychange', () => document.visibilityState === 'visible' && check())
  window.addEventListener('online', check)
  window.addEventListener('offline', check)

  return client
}
