// Adapter for query results. Kept out of the components so the library never
// assumes your column names: hand a renderer plain layer descriptors if they
// already have the right shape.

const DEFAULT_COLUMNS = {
  id: 'layer_id',
  label: 'label',
  format: 'format',
  url: 'url',
  data: 'data',
  style: 'style',
  visible: 'visible',
}

/**
 * @param {Array<object>} rows  one row per layer, already in draw order
 * @param {{ baseUrl?: string, style?: object } & Partial<typeof DEFAULT_COLUMNS>} [options]
 *   `baseUrl` is prefixed to each relative url. `style` supplies defaults that a
 *   row's own style overrides.
 * @returns {Array<{ id, label, format, url, data, style, visible }>}
 */
export function fromRows(rows, options = {}) {
  const { baseUrl = '', style: baseStyle = null, ...columns } = options
  const col = { ...DEFAULT_COLUMNS, ...columns }

  return rows.map((row) => {
    const url = row[col.url]
    const data = row[col.data]
    const layer = {
      id: row[col.id],
      label: row[col.label] ?? row[col.id],
      format: row[col.format] || 'geojson',
      // An absolute url is left alone, so the same column can hold a local path
      // now and a blob storage url later.
      url: url ? (/^[a-z]+:\/\//i.test(url) ? url : baseUrl + url) : null,
      data: data === '' ? null : (data ?? null),
      style: mergeStyle(baseStyle, row[col.style]),
      visible: row[col.visible] !== false,
    }
    return layer
  })
}

// A style column may be a JSON object, a JSON string, or absent. A string that
// will not parse is ignored rather than thrown, so one bad row cannot take the
// map down.
function mergeStyle(base, value) {
  let own = value
  if (typeof own === 'string') {
    if (own.trim() === '') own = null
    else {
      try {
        own = JSON.parse(own)
      } catch {
        own = null
      }
    }
  }
  if (!base && !own) return null
  return { ...(base ?? {}), ...(own ?? {}) }
}
