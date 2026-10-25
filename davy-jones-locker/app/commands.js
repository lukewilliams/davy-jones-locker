import { watch } from 'vue'
import { createCommandRegistry, hasTheme, listing, themeNames } from 'seamonster'

// The Terminal's commands as DAVY JONES' LOCKER has them (roadmap 8f): a
// registry (SEAMONSTER's createCommandRegistry) with the framework's f.
// commands, the engine's b. commands while it's connected, and the app's own.
//
// What's chosen is kept in the browser's localStorage under `<storageName>:`:
// the theme, and whether the engine is disconnected or the assistant hidden.
// With an engine that signs no one in (local development), b. settings too,
// sent again when the engine comes back without them, having restarted. Any
// script on the page can read localStorage, secrets included, so with sign-in
// they're never kept here: the engine saves them per user, and anything kept
// from before is forgotten.

// localStorage under one app's name; quiet when storage is unavailable.
export function localSettings(storageName) {
  const key = (name) => `${storageName}:${name}`
  return {
    get(name) {
      try {
        return JSON.parse(localStorage.getItem(key(name)))
      } catch {
        return null
      }
    },
    set(name, value) {
      try {
        if (value === null || value === undefined) localStorage.removeItem(key(name))
        else localStorage.setItem(key(name), JSON.stringify(value))
      } catch {
        // Not kept: private window, or storage blocked.
      }
    },
  }
}

// The registry: `client` the engine client (or null), `chosenTheme` a ref the
// window's theme follows (null: the app's), `appCommands` the app's own
// definitions (createCommandRegistry's).
export function createAppCommands({ client, engineName, kept, chosenTheme, appCommands = [] }) {
  const registry = createCommandRegistry()
  const needEngine = () => {
    if (!client) throw new Error('This app has no engine.')
  }

  registry.define([
    {
      name: 'f.Help', kind: 'action', description: 'Lists the commands, with what each does.',
      run: () => listing(registry),
    },
    {
      name: 'f.Terminal.Clear', kind: 'action', description: "Empties the app's log (not the nodes').",
      run: ({ graph }) => {
        graph.clearLog()
        return 'Cleared.'
      },
    },
    {
      name: 'f.Theme', kind: 'setting', description: 'The look: a built-in theme or one the app defines. Kept in this browser.',
      values: () => themeNames(),
      get: () => chosenTheme.effective(),
      set: (value) => {
        chosenTheme.value = value
        kept.set('theme', value)
        return `f.Theme = "${value}", kept in this browser.`
      },
    },
    {
      name: 'f.Security.DisconnectBackend', kind: 'action',
      description: 'Stops talking to the engine: nothing is sent to it, and nodes that need it can\'t run. Kept across reloads.',
      run: () => {
        needEngine()
        client.disconnect()
        kept.set('disconnected', true)
        return `Disconnected from ${engineName}: nothing goes to it until f.Security.EnableBackend, even after a reload.`
      },
    },
    {
      name: 'f.Security.EnableBackend', kind: 'action', description: 'Talks to the engine again.',
      run: () => {
        needEngine()
        kept.set('disconnected', null)
        client.connect()
        return `Connecting to ${engineName} again.`
      },
    },
    {
      name: 'f.Security.WhoAmI', kind: 'action', description: 'Says who you\'re signed in to the engine as.',
      run: () => {
        needEngine()
        const { state, signIn, user } = client.status
        if (signIn && !user) return `You're not signed in to ${engineName}: reload the page to sign in.`
        if (state !== 'connected') return `${engineName} isn't connected, so it can't say.`
        if (!signIn) return `${engineName} signs no one in: it's for local development.`
        return `Signed in to ${engineName} as ${user.name ? `${user.name} (${user.email})` : user.email}.`
      },
    },
    {
      name: 'f.Security.SignOut', kind: 'action', description: 'Signs you out of the engine.',
      run: () => {
        needEngine()
        if (!client.status.signIn) return `${engineName} signs no one in, so there's nothing to sign out of.`
        client.signOut()
        return 'Signing out.'
      },
    },
    {
      name: 'f.Assistant.Disable', kind: 'action', description: 'Hides the AI assistant in this browser.',
      run: () => {
        kept.set('assistant-hidden', true)
        client?.hideAssistant(true)
        return 'The assistant is hidden in this browser (f.Assistant.Enable shows it).'
      },
    },
    {
      name: 'f.Assistant.Enable', kind: 'action', description: 'Shows the AI assistant again, when the engine has it.',
      run: () => {
        kept.set('assistant-hidden', null)
        client?.hideAssistant(false)
        return client?.status.assistant ? 'The assistant is back.' : "The assistant is shown again when the engine has it set up."
      },
    },
  ])
  registry.define(appCommands)
  if (client) followEngine(registry, client, engineName, kept)
  else registry.unavailable('b.', 'b. commands run on the engine, and this app has none.')
  return registry
}

// The engine's b. commands, defined while it's connected (GET /commands),
// run through it (POST /commands). Without sign-in, a setting set here is kept
// in this browser, and sent again when the engine comes back without it.
function followEngine(registry, client, engineName, kept) {
  let listed = []
  const keptSettings = () => kept.get('engine-settings') ?? {}
  const keepHere = () => !client.status.signIn

  // Forget kept settings the engine no longer has set (after b.Settings.Reset,
  // or a new b.LiteLLMURL dropping the key).
  function prune() {
    const settings = keptSettings()
    for (const name of Object.keys(settings)) if (!listed.find((c) => c.name === name)?.set) delete settings[name]
    kept.set('engine-settings', Object.keys(settings).length ? settings : null)
  }

  async function refresh() {
    listed = await client.commands()
  }

  function define() {
    registry.remove('b.')
    registry.define(listed.map((c) => ({
      name: c.name, kind: c.kind, description: c.description, type: c.type, secret: c.secret,
      values: c.values ? () => c.values : undefined,
      get: () => listed.find((l) => l.name === c.name)?.value,
      set: async (value) => {
        const message = await client.runCommand(c.name, value)
        if (keepHere()) kept.set('engine-settings', { ...keptSettings(), [c.name]: value })
        await refresh()
        prune()
        return message
      },
      run: async () => {
        const message = await client.runCommand(c.name)
        await refresh()
        prune()
        return message
      },
    })))
  }

  async function connected() {
    try {
      await refresh()
      if (keepHere()) {
        // Kept here, but not set there: the engine has restarted. Sent again.
        const missing = Object.entries(keptSettings()).filter(([name]) => listed.find((c) => c.name === name)?.set === false)
        for (const [name, value] of missing) await client.runCommand(name, value).catch(() => {})
        if (missing.length) await refresh()
      } else {
        // The engine keeps them, per user: nothing (no secret) stays here.
        kept.set('engine-settings', null)
      }
      registry.unavailable('b.', null)
      define()
    } catch {
      // The next connection tries again.
    }
  }

  watch(
    () => client.status.state,
    (state) => {
      if (state === 'connected') return connected()
      registry.remove('b.')
      registry.unavailable(
        'b.',
        client.status.disconnected
          ? `b. commands run on ${engineName}, which is disconnected in this browser (f.Security.EnableBackend).`
          : `b. commands run on ${engineName}, which isn't available.`,
      )
    },
    { immediate: true },
  )
}

// Whether a kept theme can still be used (the app may have dropped it).
export const usableTheme = (name) => (typeof name === 'string' && hasTheme(name) ? name : null)
