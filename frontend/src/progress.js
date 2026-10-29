export function segmentProgress(hero, about) {
  const span = about.top - hero.top
  if (span <= 0) return 0
  return Math.max(0, Math.min(1, -hero.top / span))
}

export function pinProgress(scroll, start, end) {
  const span = end - start
  if (span <= 0) return 0
  return Math.max(0, Math.min(1, (scroll - start) / span))
}
