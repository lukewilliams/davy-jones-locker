// Reading a node's run result (see graphRunner.js) table by table. Kept free
// of Vue Flow, for panels outside the editor's entry (the Map panel).

// One table of a node's result, as Data shows it: { table, data, extras } for
// the table in `slot` (null: the first) named `table` (null, or one that's
// gone: the first), `table` being its name (null when the slot has just the
// one). Null when the result has no such table.
export function outputAt(result, slot = null, table = null) {
  const shown = slot === null ? result : (result?.slots?.find((s) => s.name === slot) ?? null)
  if (!shown) return null
  if (shown.data) return { table: null, data: shown.data, extras: shown.extras }
  const t = shown.tables?.find((t) => t.name === table) ?? shown.tables?.[0]
  return t ? { table: t.name, data: t.data, extras: t.extras } : null
}

// Every table of a node's result: [{ slot, table, label, data, extras }],
// slot and table null for the first (or only) one. `label` is a sheet's
// label, or a slot's reference name; null for the first slot's one table.
export function outputsOf(result) {
  const out = []
  const add = (slot, shown) => {
    if (shown?.data) out.push({ slot, table: null, label: shown.ref ?? null, data: shown.data, extras: shown.extras })
    for (const t of shown?.tables ?? []) out.push({ slot, table: t.name, label: t.label, data: t.data, extras: t.extras })
  }
  add(null, result)
  for (const s of result?.slots ?? []) add(s.name, s)
  return out
}
