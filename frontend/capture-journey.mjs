import assert from 'node:assert/strict'
import { Browser, sleep } from 'file:///C:/Users/admin/.config/opencode/skills/taste-skill/skills/taste-skill/scripts/lib/cdp.mjs'

const url = process.argv[2] || 'http://localhost/kkl-informatika-upgris-2026/public/'
const output = process.env.CAPTURE_DIR || 'C:/Users/admin/AppData/Local/Temp/opencode'
const widths = [360, 390, 768, 1024, 1440]
const failures = []
const check = (condition, message) => { if (!condition) failures.push(message) }

async function waitFor(page, expression, timeoutMs = 15000) {
  const deadline = Date.now() + timeoutMs
  while (Date.now() < deadline) {
    if (await page.eval(`Boolean(${expression})`)) return true
    await sleep(100)
  }
  return false
}

async function openScene(page) {
  await waitFor(page, "document.querySelector('.journey-scene')")
  await page.eval(() => {
    const root = document.querySelector('.journey-scene')
    scrollTo({ top: root.getBoundingClientRect().top + scrollY - 360, behavior: 'instant' })
  })
  return waitFor(page, "document.querySelector('.journey-scene[data-state=ready]')")
}

const sceneState = () => {
  const root = document.querySelector('.journey-scene')
  if (!root) return { missing: true }
  const labels = [...root.querySelectorAll('.journey-label')]
  const rects = labels.map((label) => label.getBoundingClientRect())
  const stops = [...root.querySelectorAll('.journey-stops li')]
  return {
    state: root.dataset.state,
    stops: stops.length,
    overflow: document.documentElement.scrollWidth > innerWidth + 1,
    small: labels.some((label) => parseFloat(getComputedStyle(label).fontSize) < 14),
    collision: rects.some((a, i) => rects.some((b, j) => j > i && a.left < b.right && a.right > b.left && a.top < b.bottom && a.bottom > b.top)),
    placement: root.previousElementSibling?.id === 'tentang' && root.nextElementSibling?.id === 'timeline',
    canvases: root.querySelectorAll('canvas').length,
    layout: getComputedStyle(document.querySelector('.journey-stops')).flexDirection,
    cls: Number((window.__cls || 0).toFixed(4)),
  }
}

const browser = await Browser.launch()
const cls = {}
try {
  for (const width of widths) {
    const mobile = width < 768
    const page = await browser.newPage({ width, height: mobile ? 844 : 900, mobile })
    await page.send('Page.addScriptToEvaluateOnNewDocument', {
      source: "window.__cls=0;new PerformanceObserver((l)=>{for(const e of l.getEntries())if(!e.hadRecentInput)window.__cls+=e.value}).observe({type:'layout-shift',buffered:true});",
    })
    await page.goto(url)
    const ready = await openScene(page)
    const result = await page.eval(sceneState)
    cls[width] = result.cls
    check(ready, `${width}px: scene never reached ready state`)
    check(result.placement, `${width}px: scene is not between tentang and timeline`)
    check(result.stops >= 4, `${width}px: expected outbound stops, got ${result.stops}`)
    check(!result.overflow, `${width}px: horizontal overflow`)
    check(!result.small, `${width}px: label below 14px`)
    check(!result.collision, `${width}px: label collision`)
    check(result.canvases === 0, `${width}px: unexpected canvas inside scene`)
    check(page.consoleErrors.length === 0, `${width}px: exception ${page.consoleErrors.join('; ')}`)
    if (width > 850) check(result.layout === 'row', `${width}px: desktop layout not applied`)
    if (width <= 850) check(result.layout === 'column', `${width}px: mobile layout not applied`)
    console.log(width, JSON.stringify(result))

    if (width === 390 || width === 1440) {
      for (const target of [0, 0.3, 0.72, 1]) {
        const actual = await page.eval((progress) => {
          const root = document.querySelector('.journey-scene')
          const rect = root.getBoundingClientRect()
          const desired = innerHeight * 0.9 - progress * innerHeight * 0.7
          scrollTo({ top: scrollY + rect.top - desired, behavior: 'instant' })
          return Math.min(1, Math.max(0, (innerHeight * 0.9 - root.getBoundingClientRect().top) / (innerHeight * 0.7)))
        }, target)
        await sleep(300)
        await page.screenshot({ path: `${output}/journey-${width}-${Math.round(target * 100)}.jpg` })
        check(Math.abs(actual - target) < 0.03, `${width}px: progress ${target} resolved to ${actual.toFixed(2)}`)
        const drawn = await page.eval(() => [...document.querySelectorAll('.journey-line')].map((path) => parseFloat(getComputedStyle(path).strokeDashoffset)))
        check(drawn.length === result.stops - 1, `${width}px: ${drawn.length} segments for ${result.stops} stops`)
        drawn.forEach((offset, index) => {
          const expected = 1 - Math.min(1, Math.max(0, actual * drawn.length - index))
          check(Math.abs(offset - expected) < 0.02, `${width}px: segment ${index} at ${target} is ${offset}, expected ${expected.toFixed(3)}`)
        })
        if (target === 1) check(drawn[drawn.length - 1] <= 0.02, `${width}px: route incomplete at 100%`)
      }
    }
    await page.close()
  }

  const reduced = await browser.newPage({ width: 1440, height: 900, reducedMotion: true })
  await reduced.goto(url)
  await openScene(reduced)
  const reducedState = await reduced.eval(() => ({
    offsets: [...document.querySelectorAll('.journey-line')].map((path) => parseFloat(getComputedStyle(path).strokeDashoffset)),
    transform: getComputedStyle(document.querySelector('.journey-stops')).transform,
    transitions: [...document.querySelectorAll('.journey-line')].map((path) => getComputedStyle(path).transitionDuration),
  }))
  check(reducedState.offsets.length > 0 && reducedState.offsets.every((value) => value === 0), 'reduced motion: route not fully drawn')
  check(reducedState.transform === 'none', `reduced motion: unexpected transform ${reducedState.transform}`)
  check(reducedState.transitions.every((value) => value === '0s'), `reduced motion: transition ${reducedState.transitions[0]}`)
  await reduced.close()

  const blocked = await browser.newPage({ width: 1440, height: 900 })
  await blocked.send('Network.enable')
  await blocked.send('Network.setBlockedURLs', { urls: ['*/journey.*.js'] })
  await blocked.goto(url)
  await waitFor(blocked, "document.querySelector('.journey-scene')")
  await blocked.eval(() => document.querySelector('.journey-scene').scrollIntoView({ behavior: 'instant' }))
  await sleep(600)
  const fallback = await blocked.eval(sceneState)
  check(fallback.stops >= 4, 'blocked chunk: static scene lost its stops')
  check(fallback.state === 'fallback', `blocked chunk: expected fallback state, got ${fallback.state}`)
  check(!fallback.overflow, 'blocked chunk: horizontal overflow')
  await blocked.close()

  const baseline = await browser.newPage({ width: 768, height: 900 })
  await baseline.send('Network.enable')
  await baseline.send('Network.setBlockedURLs', { urls: ['*/journey.*.js'] })
  await baseline.send('Page.addScriptToEvaluateOnNewDocument', {
    source: "window.__cls=0;new PerformanceObserver((l)=>{for(const e of l.getEntries())if(!e.hadRecentInput)window.__cls+=e.value}).observe({type:'layout-shift',buffered:true});",
  })
  await baseline.goto(url)
  await sleep(1500)
  const baselineCls = await baseline.eval(() => Number(window.__cls.toFixed(4)))
  await baseline.close()

  console.log('cls', JSON.stringify({ ...cls, baseline768: baselineCls }))
  check(Math.abs(baselineCls - cls[768]) <= 0.01, `768px: CLS ${cls[768]} differs from hero baseline ${baselineCls}`)
  check(Math.max(...Object.values(cls)) <= 0.05, 'page layout shift above 0.05')
} finally {
  await browser.close()
}

assert.deepEqual(failures, [])
console.log('journey checks passed')
