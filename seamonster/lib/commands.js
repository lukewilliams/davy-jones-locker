import { reactive } from 'vue'

// The Terminal's commands (roadmap 8f): a registry the host fills, the
// parser, completion, and running one. SEAMONSTER knows no commands itself:
// DAVY JONES' LOCKER defines `f.` (the browser's) and `b.` (the engine's), and
// an app adds its own.
//
// A command is named by a dotted path, `f.Security.DisconnectBackend`, its
// parts namespaces; names match whatever the case, and show as defined. Typed
// in the Terminal:
//
//   f.Security.DisconnectBackend      runs an action
//   f.Theme = "FLOW"                  sets a setting
//   f.Theme                           prints it
//   f.Security                        lists what's in a namespace
//
// Values are quoted text ("..." or '...', with \" and \\), numbers, or true
// and false. Commands are parsed, never evaluated as code.
//
// A definition: { name, kind: 'action' | 'setting', description, and
//   for an action  run(ctx)
//   for a setting  type ('string', 'number' or 'boolean'; 'string' by
//                  default), get() (its value now), set(value, ctx), values()
//                  (the values it takes, when they're fixed: listed after =),
//                  secret (its value is never shown, echoed or kept: it shows
//                  only whether it's set, and get() says that)
// }. run and set may be async; they return what to print (text), or throw an
// Error, whose message is printed as an error. `ctx` is { graph, registry }.

const NAME = /^[A-Za-z_][A-Za-z0-9_]*(\.[A-Za-z_][A-Za-z0-9_]*)+$/

// What FlowgraphEditor provides its `terminalCommands` registry under.
export const TERMINAL_COMMANDS = Symbol('flow-terminal-commands')

// What a secret shows instead of its value.
export const MASK = '••••'

export function createCommandRegistry() {
  const commands = reactive([])
  const missing = reactive([]) // [{ prefix, message }]

  const lower = (s) => s.toLowerCase()

  return {
    commands,

    // Add commands (one, or a list); one of the same name is replaced.
    define(definitions) {
      for (const def of [definitions].flat()) {
        if (!NAME.test(def?.name ?? '')) {
          throw new Error(`A command's name is dotted words, its namespace first (f.Theme): "${def?.name}" isn't.`)
        }
        if (!['action', 'setting'].includes(def.kind)) throw new Error(`Command ${def.name} needs kind 'action' or 'setting'.`)
        if (def.kind === 'action' && typeof def.run !== 'function') throw new Error(`Command ${def.name} needs run.`)
        if (def.kind === 'setting' && typeof def.get !== 'function') throw new Error(`Command ${def.name} needs get.`)
        const i = commands.findIndex((c) => lower(c.name) === lower(def.name))
        if (i >= 0) commands.splice(i, 1, def)
        else commands.push(def)
      }
    },

    // Remove every command under `prefix` ('b.').
    remove(prefix) {
      for (let i = commands.length - 1; i >= 0; i--) {
        if (lower(commands[i].name).startsWith(lower(prefix))) commands.splice(i, 1)
      }
    },

    // What to say for a command under `prefix` that isn't defined (b.
    // commands while the engine is away). Null forgets it.
    unavailable(prefix, message) {
      const i = missing.findIndex((m) => lower(m.prefix) === lower(prefix))
      if (i >= 0) missing.splice(i, 1)
      if (message) missing.push({ prefix, message })
    },

    find: (name) => commands.find((c) => lower(c.name) === lower(name)) ?? null,

    missingMessage: (name) => missing.find((m) => lower(name).startsWith(lower(m.prefix)))?.message ?? null,
  }
}

// ---- Parsing ----

// A typed command: { name, value? (when there's `=`), error? }.
export function parseCommand(text) {
  const match = /^\s*([^=\s]+)\s*(?:=\s*(.*?))?\s*$/s.exec(text)
  if (!match) return { error: 'Type a command, like f.Help.' }
  const [, name, raw] = match
  if (raw === undefined) return { name: name.replace(/\.$/, '') }
  const value = parseValue(raw)
  return value.error ? { name, error: value.error } : { name, value: value.value }
}

function parseValue(raw) {
  if (raw === '') return { error: 'Give it a value after =: quoted text, a number, or true or false.' }
  if (/^(true|false)$/i.test(raw)) return { value: raw.toLowerCase() === 'true' }
  if (/^[-+]?(\d+\.?\d*|\.\d+)([eE][-+]?\d+)?$/.test(raw)) return { value: Number(raw) }
  const quote = raw[0]
  if ((quote === '"' || quote === "'") && raw.length >= 2 && raw.at(-1) === quote) {
    let out = ''
    for (let i = 1; i < raw.length - 1; i++) {
      const c = raw[i]
      if (c === '\\' && i < raw.length - 2) out += raw[++i]
      else if (c === quote) return { error: `There's a ${quote} inside the text: put \\ before it.` }
      else out += c
    }
    return { value: out }
  }
  return { error: `Values are quoted text ("${raw}"), numbers, or true or false.` }
}

const show = (value) => (typeof value === 'string' ? JSON.stringify(value) : String(value))

// A command as it's echoed and kept in history: a secret's value masked
// (echo), or left out (history, so recalling it asks for it again).
export function maskCommand(registry, text) {
  const parsed = parseCommand(text)
  const command = parsed.name && registry.find(parsed.name)
  if (!command?.secret || parsed.value === undefined) return { echo: text.trim(), history: text.trim() }
  return { echo: `${command.name} = ${MASK}`, history: `${command.name} = ` }
}

// ---- Running ----

// Run a typed command. Resolves to { echo, history, entries: [{ type,
// text }] }: what to show of the command, what history keeps, and what it
// printed ('result', 'output' for a list, or 'error').
export async function runCommand(registry, text, ctx) {
  const { echo, history } = maskCommand(registry, text)
  const result = (type, text) => ({ echo, history, entries: [{ type, text }] })
  const parsed = parseCommand(text)
  if (parsed.error && !parsed.name) return result('error', parsed.error)
  const command = registry.find(parsed.name)
  if (!command) {
    const inside = registry.commands.filter((c) => c.name.toLowerCase().startsWith(`${parsed.name.toLowerCase()}.`))
    if (inside.length && parsed.value === undefined) return result('output', listing(registry, inside))
    return result('error', registry.missingMessage(parsed.name) ?? `There's no command called ${parsed.name}. f.Help lists them.`)
  }
  if (parsed.error) return result('error', parsed.error)
  try {
    if (command.kind === 'action') {
      if (parsed.value !== undefined) return result('error', `${command.name} is an action: it takes no value.`)
      return result('result', (await command.run(ctx)) || 'Done.')
    }
    if (parsed.value === undefined) return result('result', `${command.name} = ${valueText(command)}`)
    const value = checkValue(command, parsed.value)
    return result('result', (await command.set(value, ctx)) || `${command.name} = ${command.secret ? MASK : show(value)}`)
  } catch (e) {
    return result('error', e?.message ?? String(e))
  }
}

// A setting's value as printed: a secret's only as set or not.
function valueText(command) {
  const value = command.get()
  if (command.secret) return value ? `${MASK} (set)` : '(not set)'
  return value === undefined || value === null || value === '' ? '(not set)' : show(value)
}

// A value checked against what a setting takes: its type, and its fixed
// values (matched whatever the case, kept as they're defined).
function checkValue(command, value) {
  const type = command.type ?? 'string'
  if (type !== typeof value) {
    const wanted = { string: 'quoted text', number: 'a number', boolean: 'true or false' }[type]
    throw new Error(`${command.name} takes ${wanted}.`)
  }
  const values = command.values?.()
  if (values?.length && type === 'string') {
    const found = values.find((v) => v.toLowerCase() === value.toLowerCase())
    if (!found) throw new Error(`${command.name} takes one of ${values.map(show).join(', ')}.`)
    return found
  }
  return value
}

// Commands as f.Help lists them: each name (a setting's with = …), and what
// it does on the line under it (the Terminal is narrow).
export function listing(registry, commands = registry.commands) {
  return [...commands]
    .sort((a, b) => a.name.localeCompare(b.name))
    .map((c) => `${c.kind === 'setting' ? `${c.name} = …` : c.name}${c.description ? `\n  ${c.description}` : ''}`)
    .join('\n')
}

// ---- Completion ----

// What could come next after `text`: { items, ghost }. `items` are
// [{ label, insert, kind ('namespace', 'action', 'setting' or 'value'),
// detail, description }], `insert` the field's text once picked; `ghost` the
// rest of the only match, shown after what's typed. A setting's fixed values
// are offered after =.
export function completions(registry, text) {
  const eq = text.indexOf('=')
  if (eq >= 0) return valueCompletions(registry, text, eq)
  const typed = text.trimStart()
  const dot = typed.lastIndexOf('.')
  const parent = dot >= 0 ? typed.slice(0, dot + 1) : ''
  const partial = typed.slice(dot + 1).toLowerCase()
  const next = new Map() // next part's name (lower case) -> item
  for (const c of registry.commands) {
    if (!c.name.toLowerCase().startsWith(parent.toLowerCase())) continue
    const rest = c.name.slice(parent.length)
    const part = rest.split('.')[0]
    if (!part.toLowerCase().startsWith(partial) || next.has(part.toLowerCase())) continue
    const deeper = rest.length > part.length
    const shown = c.name.slice(0, parent.length) + part
    next.set(part.toLowerCase(), deeper
      ? { label: part, insert: `${shown}.`, kind: 'namespace', detail: '›', description: '' }
      : {
          label: part, insert: shown, kind: c.kind, description: c.description ?? '',
          detail: c.kind === 'setting' ? valueText(c) : '',
        })
  }
  const items = [...next.values()].sort((a, b) => a.label.localeCompare(b.label))
  const only = items.length === 1 ? items[0] : null
  const ghost = only && partial.length && only.insert.length > typed.length ? only.insert.slice(typed.length) : ''
  return { items, ghost }
}

function valueCompletions(registry, text, eq) {
  const command = registry.find(text.slice(0, eq).trim())
  const values = command?.kind === 'setting' ? (command.values?.() ?? []) : []
  const typed = text.slice(eq + 1).trimStart().replace(/^["']/, '').toLowerCase()
  const items = values
    .filter((v) => v.toLowerCase().startsWith(typed))
    .map((v) => ({ label: v, insert: `${command.name} = ${show(v)}`, kind: 'value', detail: '', description: '' }))
  const only = items.length === 1 ? items[0] : null
  const ghost = only && typed.length && only.insert.length > text.length && only.insert.toLowerCase().startsWith(text.toLowerCase())
    ? only.insert.slice(text.length) : ''
  return { items, ghost }
}
