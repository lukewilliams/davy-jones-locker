// A badge is a CSS colour, or { color?, class? }.
export function normalizeBadge(badge) {
  if (!badge) return null
  return typeof badge === 'string' ? { color: badge } : badge
}

// An item's tone is its badge, or the nearest badged submenu above it. A toned
// row gets .wm-toned, the badge's class and --wm-tone-color, so a widget can
// style it (e.g. highlight it in the badge's colours).
export function toneAttrs(tone) {
  if (!tone) return {}
  return {
    class: ['wm-toned', tone.class],
    style: tone.color ? { '--wm-tone-color': tone.color } : undefined,
  }
}
