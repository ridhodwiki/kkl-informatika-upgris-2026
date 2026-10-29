export const OUTBOUND_DAYS = new Set(['1', '2'])

export function normalizePlace(value) {
  return value.normalize('NFKC').replace(/\s+/g, ' ').trim()
}

export function splitRoute(value) {
  return normalizePlace(value).split(/\s*(?:→|->|\?)\s*/).map(normalizePlace).filter(Boolean)
}

export function normalizeRoute(days) {
  const route = days.flatMap((day) => splitRoute(day.route))
  return route.filter((name, index) => index === 0 || name.toLocaleLowerCase('id') !== route[index - 1].toLocaleLowerCase('id'))
}

export function drawingStops(route) {
  const seen = new Set()
  return route.filter((name) => {
    const key = name.toLocaleLowerCase('id')
    if (seen.has(key)) return false
    seen.add(key)
    return true
  })
}

export function extractOutboundDays(root) {
  return [...root.querySelectorAll('#timeline .journey-day')]
    .filter((day) => OUTBOUND_DAYS.has(day.dataset.day))
    .map((day) => ({
      day: day.dataset.day,
      title: normalizePlace(day.querySelector('.journey-day-title h3')?.textContent || `Hari ${day.dataset.day}`),
      route: normalizePlace((day.querySelector('.journey-route')?.textContent || '').replace(/^Rute perjalanan:\s*/i, '')),
    }))
    .filter((day) => day.route)
}

export function journeyProgress(top, viewportHeight) {
  const span = Math.max(1, viewportHeight * 0.7)
  return Math.min(1, Math.max(0, (viewportHeight * 0.9 - top) / span))
}
