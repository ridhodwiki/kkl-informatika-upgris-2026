import { Browser, sleep } from 'file:///C:/Users/admin/.config/opencode/skills/taste-skill/skills/taste-skill/scripts/lib/cdp.mjs'

const url = process.argv[2] || 'http://localhost/kkl-informatika-upgris-2026/public/'
const browser = await Browser.launch()

async function measure(width) {
  const page = await browser.newPage({ width, height: 900, mobile: width < 768 })
  try {
    await page.goto(url, { timeoutMs: 25000, settleMs: 2000 })
    const summary = await page.eval(async () => {
      const base = {
        model: document.querySelector('#hero-3d-root')?.dataset.modelUrl || null,
        state: document.querySelector('#beranda')?.dataset.diorama,
        canvas: !!document.querySelector('#hero-3d-root canvas'),
        metrics: window.__DIORAMA_METRICS__ || null,
      }
      const frames = []
      await new Promise((resolve) => {
        let count = 0
        let last = null
        const step = (time) => {
          count += 1
          if (last !== null) frames.push(time - last)
          last = time
          if (count === 61) return resolve()
          requestAnimationFrame(step)
        }
        requestAnimationFrame(step)
      })
      return {
        base,
        frame: {
          count: frames.length,
          avg: frames.reduce((a, b) => a + b, 0) / frames.length,
          min: Math.min(...frames),
          p95: frames.slice().sort((a, b) => a - b)[Math.floor(frames.length * 0.95)],
        },
      }
    })
    return { width, summary, errors: page.consoleErrors }
  } finally {
    await page.close()
  }
}

try {
  const desktop = await measure(1440)
  const mobile = await measure(390)
  const failed =
    desktop.summary.base.state !== 'active' ||
    !desktop.summary.base.canvas ||
    (desktop.summary.base.metrics?.paintedAt ?? Infinity) > 8000 ||
    desktop.summary.frame.avg > 33.33 ||
    desktop.summary.frame.count < 60 ||
    mobile.summary.base.state !== 'active' ||
    !mobile.summary.base.canvas

  console.log(JSON.stringify({
    desktop: {
      state: desktop.summary.base.state,
      paintedAt: desktop.summary.base.metrics?.paintedAt,
      drawCalls: desktop.summary.base.metrics?.drawCalls,
      triangles: desktop.summary.base.metrics?.triangles,
      frame: desktop.summary.frame,
      errors: desktop.errors,
    },
    mobile: {
      state: mobile.summary.base.state,
      paintedAt: mobile.summary.base.metrics?.paintedAt,
      frame: mobile.summary.frame,
      errors: mobile.errors,
    },
  }, null, 2))

  if (failed) {
    console.error('Performance assertion failed')
    process.exitCode = 1
  }
} catch (error) {
  console.error(error)
  process.exitCode = 1
} finally {
  await browser.close()
}
