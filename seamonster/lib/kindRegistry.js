import { markRaw, shallowReactive } from 'vue'

// The node-kind registry: categories and kinds, and the names derived from
// them (node IDs, and the reference names downstream code reads). SEAMONSTER's
// own kinds are defined through it (builtinKinds.js) exactly as an app defines
// its own, before FlowgraphEditor mounts:
//
//   defineNodeCategory({ id: 'geo', label: 'Geo', colors: { from: '#7dd3a8', to: '#2f855a' } })
//   defineNodeKind({ kind: 'geo.buffer', label: 'Buffer', category: 'geo', run: async (ctx) => { … } })
//
// Both are reactive, so a kind defined later (one the server supplies, say)
// appears in the Library and the menus. The built-in categories' colours are
// in styles.css (.flow-node--<category>); a defined category's are set on
// the page, so anything coloured by category takes that class either way.

// In display order: the menus and the Library list categories in this order.
export const NODE_CATEGORIES = shallowReactive([
  { id: 'fetch', label: 'Fetch' },
  { id: 'modify', label: 'Modify' },
  { id: 'debug', label: 'Debug' },
  { id: 'import', label: 'Import' },
  { id: 'export', label: 'Export' },
  { id: 'custom', label: 'Custom' },
])

// Every kind by name, in the order defined (the order within a category).
export const NODE_KINDS = shallowReactive({})

// Categories the canvas colours but nobody defines: a subnet's Input and
// Output nodes, and placeholders for kinds this app doesn't have.
const RESERVED_CATEGORIES = new Set(['boundary', 'unknown'])

const KIND_NAME = /^[a-z0-9][a-z0-9-]*(\.[a-z0-9][a-z0-9-]*)?$/
const CATEGORY_ID = /^[a-z][a-z0-9-]*$/
const HEX_COLOUR = /^#[0-9a-f]{3}([0-9a-f]{3})?$/i

let categoryStyle = null

// A category for the menus and the Library, after the built-in ones, with its
// node colours: `from` and `to` (the face's gradient) and `label` (the name
// on the face; white if not given).
export function defineNodeCategory({ id, label, colors }) {
  if (!CATEGORY_ID.test(id ?? '')) throw new Error(`A category's id is lowercase letters, digits and hyphens: "${id}" isn't.`)
  if (!label) throw new Error(`Category ${id} needs a label.`)
  if (RESERVED_CATEGORIES.has(id) || NODE_CATEGORIES.some((c) => c.id === id)) {
    throw new Error(`There's already a category called ${id}.`)
  }
  const { from, to, label: text = '#fff' } = colors ?? {}
  if (![from, to, text].every((c) => HEX_COLOUR.test(c ?? ''))) {
    throw new Error(`Category ${id} needs colors: { from, to } (and optionally label), each a #hex colour.`)
  }
  if (typeof document !== 'undefined') {
    categoryStyle ??= document.head.appendChild(document.createElement('style'))
    categoryStyle.textContent +=
      `.flow-node--${id} { --node-color-from: ${from}; --node-color-to: ${to}; --node-label-color: ${text}; }\n`
  }
  NODE_CATEGORIES.push({ id, label })
}

/*
 * A node kind. Only `kind`, `label` and `category` are required:
 *
 *   kind        its name, stored in saved graphs: lowercase, digits and
 *               hyphens (sql-query), namespaced with a dot for an app's or a
 *               plugin's (geo.buffer)
 *   label       the name on its face, and the Library's and menus'
 *   category    a category's id (the built-ins, or one defineNodeCategory made)
 *   idPrefix    new nodes' IDs are <idPrefix><n>; by default the label as an
 *               identifier, without underscores (buffer1 for Buffer)
 *   run(ctx)    runs it in the browser (see graphRunner.js for ctx and what
 *               it returns); without it, the node can't run
 *   runs        whether Manage shows Auto Run and Run: by default, whether it
 *               has a `run`
 *   where       'server': it runs only on the server, sending it its inputs;
 *               'browser': never on the server; or a function of the node's
 *               data returning either. Unset: in the browser for now
 *   outputName  whether its output can be named (Manage > Output Name)
 *   fields      what Manage shows for it, in order (see FIELD_TYPES below);
 *               each stored on the node's data under its `key`
 *   canRun(data)   a reason it can't run yet (Manage shows it by Run), or null
 *   runHint     Manage's line under Run (where results go, by default)
 *   slots       its named outputs beyond the first (see SLOTS below):
 *               [{ name, label?, pin? }], or a function of the node's data
 *   inputPins   named input pins beside the main one, for inputs with a
 *               role: [{ name, label?, many? }], or a function of the data
 */

/*
 * SLOTS AND PINS (roadmap 8c). A node's outputs are slots: the first holds
 * what `run` returns as its table (or tables), read downstream by its
 * reference name, <id>_data or <id>_<Output Name>; a kind can declare more,
 * each read as <id>_<slot>, which `run` fills through `slots`. One output pin,
 * the main one (handle source-0), carries every slot, so wiring it gives the
 * node downstream all of them. A slot can also have a pin of its own (handle
 * source:<slot>) carrying just that slot: when its kind says so (`pin: true`),
 * or when the user gives it one (the node's data lists it in `slotPins`). The
 * main pin still carries it, so giving a slot a pin never breaks a wire.
 *
 * Inputs come through the main input pin (target-0), any number of wires,
 * each input known by its reference name. A kind can add named input pins
 * (handle target:<name>) for inputs whose role a name can't carry; `run` sees
 * which pin each input came through (ctx.inputs[i].pin). A named pin takes
 * one wire unless it says `many: true`. Users don't add input pins.
 */

/*
 * A field: { key, label, type, ... }, stored as node.data[key]. For every type:
 *
 *   default     its value until one is set (what `run` sees too)
 *   hint        a line under it: text, with `backticks` for code, or a
 *               function (data, value) returning it (value: what's typed now)
 *   affectsOutput   false for a field that doesn't change the output (a
 *               note, say): editing it doesn't make the node stale
 *   validate    rules, checked as it's edited and before a run: an 'error'
 *               (the default) stops the node running and shows on its face;
 *               a 'warn' shows under the field and as a badge on the face.
 *               Each is { message, severity?, and one of: required: true,
 *               min: n, max: n, pattern: 'regex' (text), when: (value, data)
 *               => true when it's wrong (browser-defined kinds only) }
 *   visible(data)   whether to show it (shown by default)
 *
 * and by type:
 *
 *   text        placeholder, mono (a monospace input)
 *   number      placeholder, min, max, step
 *   select      options: [{ value, label }] or (data) => that list; the
 *               value '' is stored as nothing
 *   checkbox    true or false
 *   code        language ('sql', 'python', 'javascript' or 'text'),
 *               placeholder, rows; Ctrl+Enter commits and runs.
 *               assistant: true puts the AI assistant above it (the server's
 *               assistant writes SQL, Python and JavaScript for the built-ins)
 *   file        accept (like an input's); the chosen file is stored through
 *               the host (FlowgraphEditor's storage) and the field holds
 *               { fileName, fileSize, key }: run reads it with ctx.getFile(key)
 *   readonly    value(data): text to show
 *   custom      component: a Vue component given the node (`node`), for
 *               what no field type does (DataIngest's file chooser)
 */
export const FIELD_TYPES = ['text', 'number', 'select', 'checkbox', 'code', 'file', 'readonly', 'custom']

const RULE_TESTS = ['required', 'min', 'max', 'pattern', 'when']

const PIN_NAME = /^[a-z_][a-z0-9_]*$/

function checkPins(kind, what, list) {
  const names = new Set()
  for (const { name } of list) {
    if (!PIN_NAME.test(name ?? '')) throw new Error(`Node kind ${kind} has a ${what} named "${name}": use lowercase letters, digits and _.`)
    if (what === 'slot' && name === 'data') throw new Error(`Node kind ${kind} has a slot named data: that's the first slot's name.`)
    if (names.has(name)) throw new Error(`Node kind ${kind} has two ${what}s named ${name}.`)
    names.add(name)
  }
}

function checkFields(kind, fields) {
  if (!Array.isArray(fields)) throw new Error(`Node kind ${kind}'s fields must be a list.`)
  const keys = new Set()
  for (const field of fields) {
    const where = `Node kind ${kind}'s field ${field?.key ?? '(no key)'}`
    if (!FIELD_TYPES.includes(field?.type)) throw new Error(`${where} has type "${field?.type}": use one of ${FIELD_TYPES.join(', ')}.`)
    if (field.type === 'custom') {
      if (!field.component) throw new Error(`${where} is custom, so it needs a component.`)
      continue
    }
    if (!/^[A-Za-z_][A-Za-z0-9_]*$/.test(field.key ?? '')) throw new Error(`${where} needs a key that's an identifier.`)
    if (keys.has(field.key)) throw new Error(`${where} is there twice.`)
    keys.add(field.key)
    for (const rule of field.validate ?? []) {
      if (!rule?.message) throw new Error(`${where} has a rule with no message.`)
      if (RULE_TESTS.filter((t) => rule[t] !== undefined).length !== 1) {
        throw new Error(`${where} has a rule that needs exactly one of ${RULE_TESTS.join(', ')}.`)
      }
      if (rule.severity && !['error', 'warn'].includes(rule.severity)) {
        throw new Error(`${where} has a rule whose severity is "${rule.severity}": use 'error' or 'warn'.`)
      }
    }
  }
}
export function defineNodeKind(definition) {
  const { kind, label, category } = definition
  if (!KIND_NAME.test(kind ?? '')) {
    throw new Error(`A node kind's name is lowercase letters, digits and hyphens, with one dot at most: "${kind}" isn't.`)
  }
  if (isKnownKind(kind)) throw new Error(`There's already a node kind called ${kind}.`)
  if (!label) throw new Error(`Node kind ${kind} needs a label.`)
  if (!NODE_CATEGORIES.some((c) => c.id === category)) {
    throw new Error(`Node kind ${kind} is in category "${category}", which isn't defined.`)
  }
  if (definition.run !== undefined && typeof definition.run !== 'function') {
    throw new Error(`Node kind ${kind}'s run must be a function.`)
  }
  if (definition.fields !== undefined) checkFields(kind, definition.fields)
  if (Array.isArray(definition.slots)) checkPins(kind, 'slot', definition.slots)
  else if (definition.slots !== undefined && typeof definition.slots !== 'function') {
    throw new Error(`Node kind ${kind}'s slots must be a list, or a function of the node's data.`)
  }
  if (Array.isArray(definition.inputPins)) checkPins(kind, 'input pin', definition.inputPins)
  else if (definition.inputPins !== undefined && typeof definition.inputPins !== 'function') {
    throw new Error(`Node kind ${kind}'s inputPins must be a list, or a function of the node's data.`)
  }
  const idPrefix = definition.idPrefix ?? toIdentifier(label).replaceAll('_', '')
  if (!/^[a-z][a-z0-9]*$/.test(idPrefix)) {
    throw new Error(`Node kind ${kind} needs an idPrefix of lowercase letters and digits (its label doesn't make one).`)
  }
  NODE_KINDS[kind] = Object.freeze(markRaw({
    runs: typeof definition.run === 'function',
    ...definition,
    fields: (definition.fields ?? []).map((field) => Object.freeze(markRaw({ ...field }))),
    idPrefix,
  }))
}

// A node's data with its kind's field defaults under it: what `run` sees.
export function withDefaults(data) {
  const defaults = {}
  for (const field of kindInfo(data.kind).fields ?? []) {
    if (field.key && field.default !== undefined) defaults[field.key] = field.default
  }
  return { ...defaults, ...data }
}

// Whether editing a data key leaves a node's output as it was: its name, Auto
// Run, what's worked out from its settings, or a field that says so.
const COSMETIC_KEYS = new Set(['label', 'autoRun', 'sqlServerTables'])
export const isCosmetic = (kind, key) =>
  COSMETIC_KEYS.has(key) || kindInfo(kind).fields?.some((f) => f.key === key && f.affectsOutput === false) || false

function broken(rule, value, data) {
  if (rule.when) return !!rule.when(value, data)
  if (rule.required) return value === undefined || value === null || value === ''
  if (rule.min !== undefined) return typeof value === 'number' && value < rule.min
  if (rule.max !== undefined) return typeof value === 'number' && value > rule.max
  if (rule.pattern !== undefined) return typeof value === 'string' && value !== '' && !new RegExp(rule.pattern).test(value)
  return false
}

// What's wrong with one field's value, by its rules: [{ key, label,
// severity, message }]. `data` is the node's data, with defaults. A rule
// whose test throws counts as an error, saying so.
export function checkField(field, value, data) {
  const found = []
  const about = { key: field.key, label: field.label ?? field.key }
  for (const rule of field.validate ?? []) {
    let wrong
    try {
      wrong = broken(rule, value, data)
    } catch (e) {
      found.push({ ...about, severity: 'error', message: `Its check failed: ${e?.message ?? e}` })
      continue
    }
    if (wrong) found.push({ ...about, severity: rule.severity ?? 'error', message: rule.message })
  }
  return found
}

// What's wrong with a node's settings, by its kind's rules, errors first.
export function checkNode(data) {
  const values = withDefaults(data)
  return (kindInfo(data.kind).fields ?? [])
    .filter((field) => field.key && (!field.visible || field.visible(values)))
    .flatMap((field) => checkField(field, values[field.key], values))
    .sort((a, b) => (a.severity === b.severity ? 0 : a.severity === 'error' ? -1 : 1))
}

// Drag-and-drop type for a node kind dragged from the Library onto the canvas.
// The data is JSON: { kind, grab: { x, y } }, grab being where the card was
// held, as fractions of its size (see flowGraph's addNode).
export const NODE_KIND_DRAG_TYPE = 'application/x-flow-node-kind'

export const kindsInCategory = (category) =>
  Object.keys(NODE_KINDS).filter((kind) => NODE_KINDS[kind].category === category)

// A kind this app doesn't have: a saved graph can name one (made by another
// app, or by a plugin this app doesn't install). Its node is kept as a
// placeholder, greyed, labelled with the kind's name, and never run, with its
// data and wires as they were, so saving the graph here loses nothing.
export const isKnownKind = (kind) => typeof kind === 'string' && Object.hasOwn(NODE_KINDS, kind)

// A kind's entry in NODE_KINDS, or the placeholder's for an unknown kind.
export const kindInfo = (kind) =>
  isKnownKind(kind) ? NODE_KINDS[kind] : { label: String(kind), category: 'unknown', unknown: true }

// base1, base2, ...: the first not in `used` (a Set).
function numbered(base, used) {
  let n = 1
  while (used.has(`${base}${n}`)) n++
  return `${base}${n}`
}

// The next free auto ID for a kind: <idPrefix><n>, lowest n not in `usedIds`.
export const nextNodeId = (kind, usedIds) => numbered(NODE_KINDS[kind].idPrefix, new Set(usedIds))

// `base`, or base1, base2, ... if it's taken (sales, sales1).
export function uniqueId(base, usedIds) {
  const used = new Set(usedIds)
  return used.has(base) ? numbered(base, used) : base
}

// Whether an ID is still the one the kind generated (<idPrefix><n>), so
// naming the node may replace it. Never for an unknown kind's: its prefix
// isn't known.
export const isAutoId = (kind, id) => isKnownKind(kind) && new RegExp(`^${NODE_KINDS[kind].idPrefix}\\d+$`).test(id)

// Text as a Python-safe name: lowercase, each run of anything but letters and
// digits as one _, no _ at either end, and a leading _ before a digit.
// "Sales 2024!" -> sales_2024; "3D view" -> _3d_view.
export function toIdentifier(text) {
  const slug = text.toLowerCase().replace(/[^a-z0-9]+/g, '_').replace(/^_+|_+$/g, '')
  return /^\d/.test(slug) ? `_${slug}` : slug
}

// The name a downstream node types to read this node's output: <id>_data, or
// <id>_<outputSuffix> once the output has been named.
export const referenceName = (id, data) => `${id}_${data.outputSuffix || 'data'}`

// Where a node runs: 'server' (sending it the node's input data), 'browser',
// or null (the browser, for now), from its kind's `where`.
export function whereItRuns(data) {
  if (!isKnownKind(data.kind)) return null
  const { where } = NODE_KINDS[data.kind]
  return (typeof where === 'function' ? where(data) : where) ?? null
}

// Whether a node runs on the server, sending it the node's input data: a kind
// that runs only there (PythonScript), or one whose `where` says so for this
// node (SQL reading tables its inputs don't supply).
export const runsOnServer = (data) => whereItRuns(data) === 'server'

// ---- Slots and pins (see SLOTS AND PINS above) ----

const listOf = (value, data) => (typeof value === 'function' ? (value(data) ?? []) : (value ?? []))

// A node's slots: the first ({ name: null }), read by its reference name, then
// its kind's, each { name, label, ref, pin } (pin: whether it has a pin of its
// own). Names that clash with the first slot's are left out.
export function slotsOf(id, data) {
  const first = { name: null, label: data.outputSuffix || 'data', ref: referenceName(id, data), pin: false }
  const promoted = new Set(data.slotPins ?? [])
  const declared = isKnownKind(data.kind) ? listOf(NODE_KINDS[data.kind].slots, withDefaults(data)) : []
  return [
    first,
    ...declared
      .filter((slot) => slot.name !== first.label)
      .map((slot) => ({ name: slot.name, label: slot.label ?? slot.name, ref: `${id}_${slot.name}`, pin: !!slot.pin || promoted.has(slot.name) })),
  ]
}

// A node's output pins, top to bottom: the main one, carrying every slot,
// then one per slot that has its own. Each is { handle, slots }.
export function outputPinsOf(id, data) {
  const slots = slotsOf(id, data)
  return [
    { handle: 'source-0', slots },
    ...slots.filter((s) => s.pin).map((s) => ({ handle: `source:${s.name}`, slots: [s] })),
  ]
}

// The slots a wire from `handle` carries: all of them from the main pin, one
// from a slot's pin (none, if the node no longer has that slot).
export function slotsThrough(handle, id, data) {
  const slots = slotsOf(id, data)
  if (!handle?.startsWith('source:')) return slots
  const name = handle.slice('source:'.length)
  return slots.filter((s) => s.name === name)
}

// A node's input pins, top to bottom: the main one, then its kind's named
// ones, each { handle, name, label, many }.
export function inputPinsOf(data) {
  const named = isKnownKind(data.kind) ? listOf(NODE_KINDS[data.kind].inputPins, withDefaults(data)) : []
  return [
    { handle: 'target-0', name: null, label: null, many: true },
    ...named.map((p) => ({ handle: `target:${p.name}`, name: p.name, label: p.label ?? p.name, many: !!p.many })),
  ]
}

// Where pins sit down a node's side, as a top %: evenly spaced, with equal
// margins above and below (one pin is centred).
export const pinOffsets = (count) =>
  Array.from({ length: count }, (_, i) => `${((i + 1) / (count + 1)) * 100}%`)
