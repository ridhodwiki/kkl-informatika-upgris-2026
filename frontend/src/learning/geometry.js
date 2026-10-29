/**
 * sceneProgress — maps window.scrollY to a 0–1 progress value for Scene 3.
 *
 * Animation begins shortly after the top of the section crosses into view
 * (start = top + viewportHeight * 0.125) and completes at the section midpoint
 * (end = top + height * 0.5). This keeps the full bottom half of the section
 * at rest, giving readers time to absorb each chapter before scrolling on.
 *
 * @param {number} scrollY         window.scrollY
 * @param {number} top             element.offsetTop
 * @param {number} height          element.offsetHeight
 * @param {number} viewportHeight  window.innerHeight
 * @returns {number} progress in [0, 1]
 */
export function sceneProgress(scrollY, top, height, viewportHeight) {
  const start = top + viewportHeight * 0.125
  const end = top + height * 0.5
  const travel = Math.max(end - start, 1)
  return Math.min(1, Math.max(0, (scrollY - start) / travel))
}

/**
 * chapterProgress — maps overall scene progress to per-chapter progress.
 *
 * Chapters are equally spaced across the full scene progress range [0, 1].
 * Chapter i occupies [i/count, (i+1)/count] and its local progress runs 0→1
 * within that window.
 *
 * @param {number} progress scene-level progress in [0, 1]
 * @param {number} index    zero-based chapter index
 * @param {number} count    total chapter count
 * @returns {number} chapter progress in [0, 1]
 */
export function chapterProgress(progress, index, count) {
  const start = index / count
  return Math.min(1, Math.max(0, (progress - start) * count))
}
