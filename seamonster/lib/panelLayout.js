import { computed, reactive, ref, toValue, watch } from 'vue'
import { isTyping } from './keyboard.js'

export const PANEL_LAYOUT = Symbol('flow-panel-layout')

// Where unlinked rects are saved unless a host names its own key.
const DEFAULT_STORAGE_KEY = 'seamonster:unlinked-panel-rects'
const DOCKS = ['left', 'right', 'bottom']
const Z_BASE = 5

const clamp = (v, lo, hi) => Math.max(lo, Math.min(hi, v))

function loadRects(key) {
  try {
    const rects = JSON.parse(localStorage.getItem(key))
    return rects && typeof rects === 'object' ? rects : {}
  } catch {
    return {}
  }
}

function saveRects(key, rects) {
  try {
    localStorage.setItem(key, JSON.stringify(rects))
  } catch {
    // Storage unavailable (private window, blocked): sizes just don't persist.
  }
}

function validRect(r) {
  return r && ['x', 'y', 'w', 'h'].every((k) => Number.isFinite(r[k])) ? r : null
}

/*
 * Layout state for the panels docked around one window: FlowgraphEditor's, or
 * any PanelHost's.
 *
 * Linked panels share the window: left panels sit side by side from the left
 * edge (below the title bar), right panels full height on the right, and the
 * bottom panel fills the width between them. The last left panels can be
 * marked `aboveBottom`: while the bottom panel is open they stop short of it,
 * and it runs underneath them. Each panel resizes on one axis only, from the
 * edge facing the canvas. They only make room for other linked panels.
 *
 * Unlinked panels ignore their neighbours and can overlap; clicking one brings
 * it to the front. They move by dragging the title and resize from any edge or
 * corner. Their rects are stored as fractions of the window's inner
 * area (the window minus the edge gap), persisted to localStorage, and restored
 * whenever the panel is unlinked again. Linked sizes are fractions too, so both
 * scale with the window, down to each panel's minimum size. If the window gets
 * too narrow for the linked panels at those minimums, they are unlinked.
 *
 * Content panels (`sizing: 'content'`) stay out of all that: linked, they're
 * anchored at the start of their edge (the top of a side, the left of the
 * bottom) and overlay whatever is there. A side panel's width is its size on
 * the linked axis, and its height follows its content; a bottom panel's width
 * and height both follow its content. Either is capped to the window, and its
 * body scrolls beyond that. Unlinked, they behave like any other panel.
 *
 * Options:
 * - `storageKey`: the localStorage key for unlinked rects. Every layout using
 *   one key shares them, by panel name, so a host should name its own
 *   (`'<app>:<host>'`). The default is the editor's.
 * - `autoHideRails` (a boolean, ref or getter; default true): open panels leave
 *   the rails, except as `rails` below says. False keeps every panel's rail.
 */
export function createPanelLayout({ storageKey = DEFAULT_STORAGE_KEY, autoHideRails = true } = {}) {
  // Window size, the gap to the window edge, and where linked left panels start, in px.
  const frame = reactive({ width: 0, height: 0, gap: 0, leftTop: 0 })
  // Registration order: linked left panels sit side by side in this order.
  const panels = reactive([])
  const stack = ref([]) // panel names, back to front
  const active = ref(null)
  const saved = loadRects(storageKey)
  const hiddenByMaximise = ref(null) // panels to restore after maximising the canvas

  const inner = () => ({ w: frame.width - 2 * frame.gap, h: frame.height - 2 * frame.gap })
  const find = (name) => panels.find((p) => p.name === name)
  const isContent = (p) => p.sizing === 'content'
  // Panels taking part in the linked layout. `include` counts one more panel as
  // linked and open, to work out where it would sit if it were.
  const inLinkedLayout = (p, include) => p.name === include || (p.linked && !p.collapsed)
  // Linked, open fill panels on one edge: the ones that pack against each other.
  const linkedOpen = (dock, include = null) =>
    panels.filter((p) => p.dock === dock && !isContent(p) && inLinkedLayout(p, include))

  function register({ name, title, dock, sizing = 'fill', defaultSize, minWidth, minHeight, collapsed, hotkey, aboveBottom }) {
    panels.push({
      name, title, dock, sizing, defaultSize, minWidth, minHeight, collapsed, hotkey, aboveBottom,
      linked: true,
      linkedFrac: null, // null until resized: defaultSize applies
      contentSize: null, // content panels: their natural outer size in px, once measured
      unlinkedRect: validRect(saved[name]),
    })
    stack.value.push(name)
  }

  function unregister(name) {
    panels.splice(panels.indexOf(find(name)), 1)
    stack.value = stack.value.filter((n) => n !== name)
    if (active.value === name) active.value = null
  }

  function setFrame(next) {
    Object.assign(frame, next)
  }

  // A content panel's natural outer size (its content plus the panel's own
  // title, padding and any scrollbars), measured by FlowPanel.
  function setContentSize(name, size) {
    const p = find(name)
    const old = p?.contentSize
    if (!p || (old && Math.abs(old.width - size.width) < 0.5 && Math.abs(old.height - size.height) < 0.5)) return
    p.contentSize = size
  }

  // Size along the axis a linked panel resizes on: width for side panels, height for bottom.
  function linkedSize(p) {
    const { w, h } = inner()
    if (p.dock === 'bottom') {
      return clamp(p.linkedFrac === null ? p.defaultSize : p.linkedFrac * h, p.minHeight, h)
    }
    return clamp(p.linkedFrac === null ? p.defaultSize : p.linkedFrac * w, p.minWidth, w)
  }

  // Linked open left panels: `full` height ones, then `above`, the trailing run
  // marked aboveBottom, which stop above the bottom panel while it's open.
  function leftColumns(include = null) {
    const lefts = linkedOpen('left', include)
    let i = lefts.length
    if (linkedOpen('bottom', include).length) while (i > 0 && lefts[i - 1].aboveBottom) i--
    return { full: lefts.slice(0, i), above: lefts.slice(i) }
  }

  // Tallest a linked bottom panel can be: the window's inner height, less room
  // for any panels above it at their minimum height.
  function bottomMax(above) {
    if (!above.length) return inner().h
    const room = frame.height - 2 * frame.gap - frame.leftTop - Math.max(...above.map((p) => p.minHeight))
    return Math.max(0, room)
  }

  const bottomHeight = (p, above) =>
    clamp(linkedSize(p), p.minHeight, Math.max(p.minHeight, bottomMax(above)))

  function toFrac(r) {
    const { w, h } = inner()
    const g = frame.gap
    return { x: (r.left - g) / w, y: (r.top - g) / h, w: r.width / w, h: r.height / h }
  }

  function unlinkedPx(p) {
    const { w: aw, h: ah } = inner()
    const g = frame.gap
    const r = p.unlinkedRect
    const width = clamp(r.w * aw, p.minWidth, aw)
    const height = clamp(r.h * ah, p.minHeight, ah)
    return {
      left: clamp(g + r.x * aw, g, g + aw - width),
      top: clamp(g + r.y * ah, g, g + ah - height),
      width,
      height,
    }
  }

  // A linked content panel's rect: anchored at the start of its edge, at its
  // content size (side panels: their linked width), within the window.
  function contentRect(p) {
    const { width: W, height: H, gap: g, leftTop } = frame
    const { w, h } = inner()
    const natural = p.contentSize ?? { width: p.minWidth, height: p.minHeight }
    if (p.dock === 'bottom') {
      const width = clamp(natural.width, Math.min(p.minWidth, w), w)
      const height = clamp(natural.height, 0, h)
      return { left: g, top: H - g - height, width, height }
    }
    const width = linkedSize(p)
    if (p.dock === 'left') {
      return { left: g, top: leftTop, width, height: clamp(natural.height, 0, Math.max(0, H - g - leftTop)) }
    }
    return { left: W - g - width, top: g, width, height: clamp(natural.height, 0, h) }
  }

  // px rects of every open panel, keyed by name (plus `include`, placed as if linked and open).
  function layoutRects(include = null) {
    const out = {}
    if (!frame.width) return out
    const { width: W, height: H, gap: g, leftTop } = frame
    const { full, above } = leftColumns(include)
    const bottoms = linkedOpen('bottom', include)
    const bottomTop = H - g - Math.max(0, ...bottoms.map((p) => bottomHeight(p, above)))

    let left = g // next free x after the linked left panels
    for (const p of full) {
      const width = linkedSize(p)
      out[p.name] = { left, top: leftTop, width, height: H - g - leftTop }
      left += width + g
    }
    const bottomLeft = left // the bottom panel runs under the `above` panels
    for (const p of above) {
      const width = linkedSize(p)
      out[p.name] = { left, top: leftTop, width, height: Math.max(0, bottomTop - g - leftTop) }
      left += width + g
    }

    let right = W - g // next free x before the linked right panels
    for (const p of linkedOpen('right', include)) {
      const width = linkedSize(p)
      right -= width
      out[p.name] = { left: right, top: g, width, height: H - 2 * g }
      right -= g
    }

    for (const p of bottoms) {
      const height = bottomHeight(p, above)
      out[p.name] = { left: bottomLeft, top: H - g - height, width: Math.max(0, right - bottomLeft), height }
    }

    for (const p of panels) {
      if (isContent(p) && inLinkedLayout(p, include)) out[p.name] = contentRect(p)
    }

    for (const p of panels) {
      if (!inLinkedLayout(p, include) && !p.linked && !p.collapsed && p.unlinkedRect) {
        out[p.name] = unlinkedPx(p)
      }
    }
    return out
  }

  const rects = computed(() => layoutRects())

  // Width the linked row needs (side panels at their widths, the bottom panel at
  // its minimum, gaps between), optionally leaving one panel out. The bottom
  // panel shares a column with the panels above it, as wide as the wider of the
  // two; leaving out one of those panels leaves the bottom's minimum out too,
  // since a wider panel only widens the bottom panel under it.
  function rowNeed(skip) {
    const { full, above } = leftColumns()
    const sides = [...full, ...linkedOpen('right')].filter((p) => p !== skip)
    const group = above.filter((p) => p !== skip)
    const bottom = linkedOpen('bottom')
    const sum = (list) => list.reduce((s, p) => s + linkedSize(p), 0)
    const groupWidth = sum(group) + frame.gap * Math.max(0, group.length - 1)
    const bottomMin = bottom.length ? Math.max(...bottom.map((p) => p.minWidth)) : 0
    const column = above.includes(skip) ? groupWidth : Math.max(groupWidth, bottomMin)
    const items = sides.length + (column > 0 ? 1 : 0)
    return { width: sum(sides) + column + frame.gap * Math.max(0, items - 1), items }
  }

  function setLinked(targets, linked) {
    // Snapshot first: unlinking one panel moves its linked neighbours.
    const current = rects.value
    for (const p of targets) {
      if (!linked && p.linked && current[p.name]) p.unlinkedRect ??= toFrac(current[p.name])
      p.linked = linked
    }
  }

  function toggleLinked(name) {
    const p = find(name)
    setLinked([p], !p.linked)
  }

  // The window (or an opened panel) left no room for the linked panels at their minimums.
  watch(
    () => [frame.width, frame.height, ...panels.map((p) => `${p.collapsed}:${p.linked}`)],
    () => {
      if (!frame.width || rowNeed(null).width <= inner().w) return
      setLinked(DOCKS.flatMap((dock) => linkedOpen(dock)), false)
    },
  )

  // Move the edge(s) of a panel by the pointer's offset since the drag started.
  // `edge` is n/s/e/w or a corner (ne, nw, se, sw); linked panels only take
  // their one resizable edge.
  function resize(name, edge, start, dx, dy) {
    const p = find(name)
    const { w: aw, h: ah } = inner()
    const g = frame.gap

    if (p.linked) {
      // A content panel overlays the rest: only a side one's width resizes,
      // up to the window's.
      if (isContent(p)) {
        if (p.dock === 'bottom') return
        const grow = p.dock === 'right' ? -dx : dx
        p.linkedFrac = clamp(start.width + grow, p.minWidth, aw) / aw
        return
      }
      if (p.dock === 'bottom') {
        const max = Math.max(p.minHeight, bottomMax(leftColumns().above))
        p.linkedFrac = clamp(start.height - dy, p.minHeight, max) / ah
      } else {
        const { width: others, items } = rowNeed(p)
        const max = aw - others - (items ? g : 0)
        const grow = p.dock === 'right' ? -dx : dx
        p.linkedFrac = clamp(start.width + grow, p.minWidth, max) / aw
      }
      return
    }

    let { left, top, width, height } = start
    const right = left + width
    const bottom = top + height
    if (edge.includes('w')) {
      left = clamp(left + dx, g, right - p.minWidth)
      width = right - left
    }
    if (edge.includes('e')) width = clamp(width + dx, p.minWidth, g + aw - left)
    if (edge.includes('n')) {
      top = clamp(top + dy, g, bottom - p.minHeight)
      height = bottom - top
    }
    if (edge.includes('s')) height = clamp(height + dy, p.minHeight, g + ah - top)
    p.unlinkedRect = toFrac({ left, top, width, height })
  }

  // Drag an unlinked panel by the pointer's offset since the drag started.
  function move(name, start, dx, dy) {
    const p = find(name)
    if (p.linked) return
    const { w: aw, h: ah } = inner()
    const g = frame.gap
    p.unlinkedRect = toFrac({
      ...start,
      left: clamp(start.left + dx, g, g + aw - start.width),
      top: clamp(start.top + dy, g, g + ah - start.height),
    })
  }

  function persist(p) {
    saved[p.name] = p.unlinkedRect
    saveRects(storageKey, saved)
  }

  // End of a resize or move: an unlinked rect is remembered for next time.
  function commitRect(name) {
    const p = find(name)
    if (!p.linked) persist(p)
  }

  // "Set unlinked size to current": the unlinked rect becomes where the panel
  // would sit if it were linked (and open), without linking it. So after this,
  // unlinking a linked panel leaves it where it is, and it stays there when its
  // neighbours move. Called from the title context menu (not built yet).
  function resetUnlinkedRect(name) {
    const r = layoutRects(name)[name]
    if (!r) return
    const p = find(name)
    p.unlinkedRect = toFrac(r)
    persist(p)
  }

  const overlaps = (a, b) =>
    a.left < b.left + b.width && b.left < a.left + a.width &&
    a.top < b.top + b.height && b.top < a.top + a.height

  // Whether any panel above this one in the stack overlaps it.
  function isCovered(name) {
    const all = rects.value
    if (!all[name]) return false
    const above = stack.value.slice(stack.value.indexOf(name) + 1)
    return above.some((n) => all[n] && overlaps(all[name], all[n]))
  }

  const zIndex = (name) => Z_BASE + stack.value.indexOf(name)

  function activate(name) {
    stack.value = [...stack.value.filter((n) => n !== name), name]
    active.value = name
  }

  function deactivate() {
    active.value = null
  }

  function setCollapsed(name, collapsed) {
    find(name).collapsed = collapsed
    if (collapsed && active.value === name) active.value = null
    if (!collapsed) activate(name)
  }

  // Whether an open panel overlaps any other, so one may hide the other.
  function overlapsAnother(name) {
    const all = rects.value
    return !!all[name] && Object.keys(all).some((n) => n !== name && overlaps(all[name], all[n]))
  }

  // Rails show collapsed panels. On an edge shared by several panels, once any
  // of them is unlinked they can cover each other, so all of them show. Content
  // panels float over everything, so each shows while it overlaps another. With
  // autoHideRails off, every panel always shows.
  const rails = computed(() =>
    Object.fromEntries(
      DOCKS.map((dock) => {
        const docked = panels.filter((p) => p.dock === dock)
        const showAll = !toValue(autoHideRails) || (docked.length > 1 && docked.some((p) => !p.linked))
        return [dock, docked.filter((p) => p.collapsed || showAll || (isContent(p) && overlapsAnother(p.name)))]
      }),
    ),
  )

  // A rail click or a panel's hotkey. Like the panel title: a covered panel
  // comes to the front, otherwise it toggles.
  function toggle(name) {
    const p = find(name)
    if (p.collapsed) setCollapsed(name, false)
    else if (isCovered(name)) activate(name)
    else setCollapsed(name, true)
  }

  // What toggleMaximise would do next: 'collapse', 'restore', or null (nothing to do).
  const maximiseAction = computed(() => {
    if (panels.some((p) => !p.collapsed)) return 'collapse'
    return hiddenByMaximise.value ? 'restore' : null
  })

  // Collapse every panel to maximise the canvas, or restore the ones that were open.
  function toggleMaximise() {
    const open = panels.filter((p) => !p.collapsed)
    if (open.length) {
      hiddenByMaximise.value = open.map((p) => p.name)
      open.forEach((p) => (p.collapsed = true))
      active.value = null
    } else if (hiddenByMaximise.value) {
      hiddenByMaximise.value.forEach((n) => find(n) && (find(n).collapsed = false))
      hiddenByMaximise.value = null
    }
  }

  // Ctrl+Space: link/unlink the active panel, or with none active, maximise/restore.
  // A panel's hotkey on its own (no Ctrl, Cmd or Alt; not while typing) toggles
  // it, unless `hotkeys` is false.
  function onKeydown(e, { hotkeys = true } = {}) {
    if (e.ctrlKey && e.code === 'Space') {
      e.preventDefault()
      if (e.repeat) return
      if (active.value) toggleLinked(active.value)
      else toggleMaximise()
      return
    }
    if (!hotkeys || e.ctrlKey || e.metaKey || e.altKey || isTyping(e)) return
    const panel = panels.find((p) => p.hotkey?.toLowerCase() === e.key.toLowerCase())
    if (!panel) return
    e.preventDefault()
    if (!e.repeat) toggle(panel.name)
  }

  return {
    frame, panels, rects, rails, active, maximiseAction,
    find, register, unregister, setFrame, setContentSize,
    resize, move, commitRect, resetUnlinkedRect, toggleLinked,
    isCovered, zIndex, activate, deactivate, setCollapsed, toggle,
    toggleMaximise, onKeydown,
  }
}
