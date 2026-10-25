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
//   runLoop    runs a Loop node on the server, as a job, following its
//              progress (SEAMONSTER calls it for a Loop with nodes inside that
//              run only on the server)
//   nodes      the app's own node kinds and categories, as GET /nodes has them
//              (serverKinds.js defines them in the browser)
//   assist     the AI assistant: a node's code from a request in plain words
//   commands, runCommand   the Terminal's b. commands: listed (GET /commands)
//              and run (POST /commands); see commands.js
//   disconnect, connect    stop talking to the engine (status unavailable,
//              status.disconnected true, every request refused) and start
//              again: f.Security.DisconnectBackend and EnableBackend
//   hideAssistant(hidden)  the assistant left out of status in this browser
//              (f.Assistant.Disable), whatever the engine says
//   signOut    sends the window to the engine's sign-out (f.Security.SignOut)
//
// Inputs are [{ name, bytes }]: Parquet, named by reference name (or
// name.table). The engine's README has the API.
//
// The engine answers GET /health with JSON { status: 'ok', host?, port?,
// local?, assistant?, nodes? }; anything else (an error, no answer within 3 seconds, or
// the dev server's index.html when there's no engine) means it's unavailable.
// `assistant` is { model, sampleRows } when it has the AI assistant set up, and
// `nodes` the names of the app's own node kinds (status.nodes follows it).
// `local` is true for an engine in local development (IS_LOCAL): the app's
// node kinds can reach the network (status.local).
//
// Sign-in is the engine's (its identity.py): `signIn` in /health names its
// provider (null when it signs no one in) and `user` is { email, name } once
// signed in (status.signIn, status.user). Signed out, or when any request
// answers 401, the window goes to the engine's sign-in page, which comes back
// here; at most once a minute, so a sign-in that doesn't take can't loop.
// Every request carries X-Requested-By, which the engine requires of requests
// that change things (a page on another site can't send it).

// How often a running job is asked how it's going.
const JOB_POLL_MS = 1000

const CONNECTED_INTERVAL_MS = 5000
const UNAVAILABLE_INTERVAL_MS = 15000
const TIMEOUT_MS = 3000

const PARQUET = 'application/vnd.apache.parquet'

const REQUEST_HEADERS = { 'x-requested-by': 'davy-jones-locker' }
const SIGN_IN_KEY = 'davy-jones-locker:signing-in:'
const SIGN_IN_AGAIN_MS = 60000

function form(fields, inputs) {
  const body = new FormData()
  for (const [name, value] of Object.entries(fields)) body.append(name, value)
  for (const { name, bytes } of inputs) body.append('input', new Blob([bytes], { type: PARQUET }), name)
  return body
}

// `disconnected` and `assistantHidden` start it so (kept by the app shell).
export function createEngineClient({ url, name = 'The engine', disconnected = false, assistantHidden = false }) {
  const base = url.replace(/\/+$/, '')
  let off = disconnected
  let hideAssistant = assistantHidden
  let lastAssistant = null // what the engine last said, hidden or not
  const refuse = () => {
    throw new Error(`${name} is disconnected in this browser (f.Security.DisconnectBackend): f.Security.EnableBackend connects it again.`)
  }

  // To the engine's sign-in page, unless the window went there less than a
  // minute ago (then it didn't take). Says whether it's going.
  function signIn() {
    let last = 0
    try {
      last = Number(sessionStorage.getItem(SIGN_IN_KEY + base)) || 0
    } catch {}
    if (Date.now() - last < SIGN_IN_AGAIN_MS) return false
    try {
      sessionStorage.setItem(SIGN_IN_KEY + base, String(Date.now()))
    } catch {}
    location.assign(`${base}/auth/login?next=${encodeURIComponent(location.pathname + location.search + location.hash)}`)
    return true
  }

  // The engine's errors are JSON { error }; anything else says what came back.
  async function failure(response) {
    if (response.status === 401) {
      return new Error(
        signIn()
          ? `${name} needs you to sign in again: going to sign-in.`
          : `${name} needs you to sign in, and signing in didn't work just now: reload the page to try again.`,
      )
    }
    try {
      const { error } = await response.json()
      if (error) return new Error(error)
    } catch {}
    return new Error(`${name} answered ${response.status} ${response.statusText}.`)
  }

  async function send(path, init) {
    if (off) refuse()
    let response
    try {
      response = await fetch(`${base}${path}`, { method: 'POST', ...init, headers: { ...REQUEST_HEADERS, ...init?.headers } })
    } catch {
      throw new Error(`${name} couldn't be reached.`)
    }
    if (!response.ok) throw await failure(response)
    return response
  }

  const post = (path, fields, inputs) => send(path, { body: form(fields, inputs) })

  async function get(path) {
    if (off) refuse()
    let response
    try {
      response = await fetch(`${base}${path}`, { cache: 'no-store', headers: REQUEST_HEADERS })
    } catch {
      throw new Error(`${name} couldn't be reached.`)
    }
    if (!response.ok) throw await failure(response)
    return response
  }

  const sleep = (ms) => new Promise((resolve) => setTimeout(resolve, ms))

  const client = {
    status: reactive({
      state: off ? 'unavailable' : 'checking', address: null, local: false, assistant: null, nodes: [], disconnected: off,
      signIn: null, user: null,
    }),

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

    // { node (its data, its graph inline), path, subnets (the document's
    // shared ones), inputs: [{ pin, bytes }] (Parquet, `item` for items),
    // progress({ done, total, failed }) }. Starts a job (POST /jobs), asks how
    // it's going every second, and resolves to { warnings, error?, outputs:
    // [{ slot, bytes }] } (slot null for its first output).
    async runLoop({ node, path, subnets = {}, inputs = [], progress = () => {} }) {
      const body = new FormData()
      body.append('job', JSON.stringify({ node, path, subnets }))
      for (const { pin, bytes } of inputs) body.append('input', new Blob([bytes], { type: PARQUET }), pin)
      let job = await (await send('/jobs', { body })).json()
      while (job.status === 'running') {
        await sleep(JOB_POLL_MS)
        job = await (await get(`/jobs/${job.id}`)).json()
        if (job.progress?.total) progress(job.progress)
      }
      if (job.status === 'failed') return { error: job.error }
      const parts = await (await get(`/jobs/${job.id}/result`)).formData()
      const result = JSON.parse(parts.get('result'))
      const tables = new Map()
      for (const file of parts.getAll('table')) tables.set(file.name, new Uint8Array(await file.arrayBuffer()))
      const outputs = (result.outputs ?? []).map((o) => ({ slot: o.slot, bytes: tables.get(o.part) }))
      return { warnings: result.warnings ?? [], outputs }
    },

    // The engine's b. commands: [{ name, kind, description, type, secret,
    // set, values?, value? }] (see the engine's commands.py).
    async commands() {
      return (await (await get('/commands')).json()).commands ?? []
    },

    // Run one: `value` sets a setting (pass it only to set one), none runs an
    // action. Resolves to what it printed.
    async runCommand(command, ...value) {
      const body = value.length ? { name: command, value: value[0] } : { name: command }
      const response = await send('/commands', { headers: { 'content-type': 'application/json' }, body: JSON.stringify(body) })
      return (await response.json()).message
    },

    disconnect() {
      off = true
      clearTimeout(timer)
      Object.assign(client.status, { state: 'unavailable', address: null, assistant: null, disconnected: true })
    },

    connect() {
      if (!off) return
      off = false
      Object.assign(client.status, { state: 'checking', disconnected: false })
      check()
    },

    signOut() {
      location.assign(`${base}/auth/logout`)
    },

    hideAssistant(hidden) {
      hideAssistant = hidden
      client.status.assistant = hidden ? null : lastAssistant
    },

    // { categories: [...], kinds: [...] }: definitions SEAMONSTER's
    // defineNodeCategory and defineNodeKind take.
    async nodes() {
      const response = await fetch(`${base}/nodes`, { cache: 'no-store', headers: REQUEST_HEADERS })
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
    if (off) return
    try {
      const response = await fetch(`${base}/health`, {
        cache: 'no-store', headers: REQUEST_HEADERS, signal: AbortSignal.timeout(TIMEOUT_MS),
      })
      const json = response.ok && response.headers.get('content-type')?.includes('json')
      const body = json ? await response.json() : null
      if (body?.status !== 'ok') throw new Error('not the engine')
      if (off) return // disconnected while it checked
      status.signIn = body.signIn ?? null
      if (body.signIn && !body.user) {
        // Reachable, but nothing works until signed in.
        status.user = null
        signIn()
        throw new Error('not signed in')
      }
      if (JSON.stringify(body.user ?? null) !== JSON.stringify(status.user)) status.user = body.user ?? null
      if (body.user) {
        try {
          sessionStorage.removeItem(SIGN_IN_KEY + base)
        } catch {}
      }
      status.state = 'connected'
      status.address = body.host && body.port ? `${body.host}:${body.port}` : location.host
      status.local = body.local === true
      // Replaced only when they change, not on every check.
      lastAssistant = body.assistant ?? null
      const assistant = hideAssistant ? null : lastAssistant
      if (JSON.stringify(assistant) !== JSON.stringify(status.assistant)) status.assistant = assistant
      if (JSON.stringify(body.nodes ?? []) !== JSON.stringify(status.nodes)) status.nodes = body.nodes ?? []
    } catch {
      if (off) return // disconnected while it checked
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
