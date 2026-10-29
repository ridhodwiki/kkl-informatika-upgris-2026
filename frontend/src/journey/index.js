import { journeyProgress } from './places.js'

const SVG_NS = 'http://www.w3.org/2000/svg'

function stopPoints(items, bounds) {
  return items.map((item) => {
    const rect = item.querySelector('.journey-number').getBoundingClientRect()
    return [rect.left - bounds.left + rect.width / 2, rect.top - bounds.top + rect.height / 2]
  })
}

function isCrossing(stops, index) {
  return stops[index]?.toLocaleLowerCase('id') === 'ketapang' && stops[index + 1]?.toLocaleLowerCase('id') === 'gilimanuk'
}

export function enhanceJourney(root, stops) {
  const list = root.querySelector('.journey-stops')
  const items = [...list.children]
  if (items.length < 2) {
    root.dataset.state = 'ready'
    return
  }

  const svg = document.createElementNS(SVG_NS, 'svg')
  svg.setAttribute('aria-hidden', 'true')
  svg.classList.add('journey-lines')

  const track = document.createElementNS(SVG_NS, 'path')
  track.setAttribute('class', 'journey-track')
  svg.append(track)

  const segments = []
  const ferries = []
  for (let index = 0; index < items.length - 1; index += 1) {
    const crossing = isCrossing(stops, index)
    const path = document.createElementNS(SVG_NS, 'path')
    path.setAttribute('class', crossing ? 'journey-line journey-crossing' : 'journey-line')
    path.setAttribute('pathLength', '1')
    path.style.strokeDasharray = '1'
    path.style.strokeDashoffset = '1'
    svg.append(path)
    segments.push(path)
    if (crossing) {
      const ferry = document.createElementNS(SVG_NS, 'path')
      ferry.setAttribute('class', 'journey-ferry')
      const mask = document.createElementNS(SVG_NS, 'path')
      mask.setAttribute('class', 'journey-ferry-mask')
      mask.setAttribute('pathLength', '1')
      mask.style.strokeDasharray = '1'
      mask.style.strokeDashoffset = '0'
      svg.append(ferry, mask)
      ferries.push({ index, ferry, mask })
    }
  }

  list.prepend(svg)

  const render = () => {
    const bounds = list.getBoundingClientRect()
    svg.setAttribute('viewBox', `0 0 ${bounds.width} ${bounds.height}`)
    const points = stopPoints(items, bounds)
    track.setAttribute('d', points.map((point, index) => `${index ? 'L' : 'M'} ${point[0]} ${point[1]}`).join(' '))
    segments.forEach((path, index) => {
      path.setAttribute('d', `M ${points[index][0]} ${points[index][1]} L ${points[index + 1][0]} ${points[index + 1][1]}`)
    })
    ferries.forEach(({ index, ferry, mask }) => {
      const d = `M ${points[index][0]} ${points[index][1]} L ${points[index + 1][0]} ${points[index + 1][1]}`
      ferry.setAttribute('d', d)
      mask.setAttribute('d', d)
    })
  }

  const motion = window.matchMedia('(prefers-reduced-motion: reduce)')
  const reduce = () => {
    segments.forEach((path) => { path.style.strokeDashoffset = '0' })
    ferries.forEach(({ mask }) => { mask.style.strokeDashoffset = '-1' })
    list.style.setProperty('--journey-depth', '0px')
  }

  const update = () => {
    if (motion.matches) {
      reduce()
      return
    }
    const progress = journeyProgress(root.getBoundingClientRect().top, window.innerHeight)
    const total = segments.length
    const local = (index) => Math.min(1, Math.max(0, progress * total - index))
    segments.forEach((path, index) => {
      path.style.strokeDashoffset = String(1 - local(index))
    })
    ferries.forEach(({ index, mask }) => {
      mask.style.strokeDashoffset = String(-local(index))
    })
    list.style.setProperty('--journey-depth', `${((progress - 0.5) * -10).toFixed(1)}px`)
  }

  let queued = false
  const schedule = () => {
    if (queued) return
    queued = true
    requestAnimationFrame(() => {
      queued = false
      update()
    })
  }

  render()
  update()
  new ResizeObserver(() => {
    render()
    schedule()
  }).observe(list)
  window.addEventListener('scroll', schedule, { passive: true })
  window.addEventListener('resize', schedule)
  motion.addEventListener('change', schedule)
  root.dataset.state = 'ready'
}
