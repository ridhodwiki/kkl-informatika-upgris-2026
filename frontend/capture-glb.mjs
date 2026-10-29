import { Browser, sleep } from 'file:///C:/Users/admin/.config/opencode/skills/taste-skill/skills/taste-skill/scripts/lib/cdp.mjs'

const root = 'E:/Aplikasi/xampp/htdocs/kkl-informatika-upgris-2026'
const prefix = process.env.CAPTURE_PREFIX || 'glb-'
const browser = await Browser.launch()
const metrics = []
try {
  for (const [width, height] of [[1440, 900], [390, 844]]) {
    const page = await browser.newPage({ width, height, mobile: width < 768 })
    await page.goto('http://localhost/kkl-informatika-upgris-2026/public/', { timeoutMs: 30000, settleMs: 1500 })
    const base = await page.eval(() => ({
      state: document.querySelector('#beranda')?.dataset.diorama,
      model: document.querySelector('#hero-3d-root')?.dataset.modelUrl,
      canvas: !!document.querySelector('#hero-3d-root canvas'),
      metrics: window.__DIORAMA_METRICS__,
      scripts: [...document.scripts].map((script) => script.src),
    }))
    console.log(width, JSON.stringify(base), page.consoleErrors)
    await page.eval(() => window.scrollTo(0, 0))
    await page.screenshot({ path: `${root}/.taste-skill/${prefix}hero-${width}.jpg` })
    const bounds = await page.eval(() => {
      const hero = document.querySelector('#beranda')
      const stage = hero.closest('.hero-stage')
      const header = document.querySelector('.site-header')
      const about = document.querySelector('#tentang')
      const headerHeight = header?.offsetHeight ?? 76
      const stageTop = stage.getBoundingClientRect().top + window.scrollY
      const stageHeight = stage.offsetHeight
      const heroHeight = hero.offsetHeight
      const start = stageTop - headerHeight
      const aboutTop = about ? about.getBoundingClientRect().top + window.scrollY : 0
       const end = Math.max(start + stageHeight - heroHeight, aboutTop - headerHeight)
      return { start, span: end - start }
    })
    const { start, span } = bounds
    const samples = []
    for (const ratio of [0, 0.75, 0.9, 1]) {
      await page.eval((y) => window.scrollTo(0, y), start + span * ratio)
      await sleep(1400)
      const state = await page.eval(() => ({
        scrollY,
        progress: window.__DIORAMA_METRICS__?.progress,
        camera: window.__DIORAMA_METRICS__?.camera,
        look: window.__DIORAMA_METRICS__?.look,
        drawCalls: window.__DIORAMA_METRICS__?.drawCalls,
        aboutTop: document.querySelector('#tentang')?.getBoundingClientRect().top,
        state: document.querySelector('#beranda')?.dataset.diorama,
      }))
      samples.push(state)
      console.log(width, ratio, JSON.stringify(state))
      await page.screenshot({ path: `${root}/.taste-skill/${prefix}${width}-${String(ratio).replace('.', '')}.jpg` })
    }
    for (const [name, ratio, pauseMs] of [['slow', 0, 80], ['fast', 1, 0], ['reverse', 0, 30]]) {
      await page.eval(([from, to, steps, pause]) => new Promise((resolve) => {
        let index = 0
        const tick = () => {
          window.scrollTo(0, from + (to - from) * index / steps)
          if (index++ < steps) setTimeout(tick, pause)
          else setTimeout(resolve, 300)
        }
        tick()
      }), [await page.eval(() => scrollY), start + span * ratio, 24, pauseMs])
      console.log(width, name, JSON.stringify(await page.eval(() => ({ progress: window.__DIORAMA_METRICS__?.progress, camera: window.__DIORAMA_METRICS__?.camera, look: window.__DIORAMA_METRICS__?.look }))))
    }
    metrics.push({ width, base, samples, errors: page.consoleErrors })
    await page.close()
  }
} finally {
  await browser.close()
}
console.log(JSON.stringify({ metrics }, null, 2))
