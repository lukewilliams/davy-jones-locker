// The theme registry: the built-in themes, plus any an app defines. A theme is
// a name, the theme it's based on, and token values over that theme's (CSS
// custom properties, set on the window: the brand gradient, say). The four
// built-ins are node looks, each a class in styles.css (.flow-theme-<name>):
//
//   FLOW      rounded, category gradients
//   FLOWDARK  rounded, light to dark grey
//   LUX       sharp, brushed metal in the category's colours
//   LUXDARK   sharp, obsidian; the hovered node shows its category colour
//
// An app defines its own before FlowgraphEditor mounts:
//
//   defineTheme({ name: 'EMBER', base: 'LUX',
//     tokens: { '--flow-brand-from': '#f7b955', '--flow-brand-to': '#d1741f' } })
//
// Names are matched in any case.

const BUILT_IN = ['FLOW', 'FLOWDARK', 'LUX', 'LUXDARK']

const themes = new Map(BUILT_IN.map((name) => [name, { name, base: null, tokens: {} }]))

const key = (name) => String(name).toUpperCase()

export function defineTheme({ name, base = 'FLOW', tokens = {} }) {
  if (!name) throw new Error('A theme needs a name.')
  if (BUILT_IN.includes(key(name))) throw new Error(`${key(name)} is a built-in theme; give yours another name.`)
  if (!themes.has(key(base))) throw new Error(`Theme ${key(name)} is based on ${key(base)}, which isn't defined.`)
  themes.set(key(name), { name: key(name), base: key(base), tokens: { ...tokens } })
}

export const hasTheme = (name) => themes.has(key(name))

export const themeNames = () => [...themes.keys()]

// A theme as the window applies it: the built-in look it comes down to (its
// class) and its tokens over its base's. An unknown name is FLOW.
export function resolveTheme(name) {
  const theme = themes.get(key(name)) ?? themes.get('FLOW')
  if (!theme.base) return { name: theme.name, className: `flow-theme-${theme.name.toLowerCase()}`, tokens: {} }
  const base = resolveTheme(theme.base)
  return { name: theme.name, className: base.className, tokens: { ...base.tokens, ...theme.tokens } }
}
