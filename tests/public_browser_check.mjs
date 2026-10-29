import { Browser, sleep } from 'file:///C:/Users/admin/.config/opencode/skills/taste-skill/skills/taste-skill/scripts/lib/cdp.mjs'

const url = process.argv[2] || 'http://localhost/kkl-informatika-upgris-2026/public/'
const viewports = [360, 390, 768, 1024, 1440]
const failures = []
const check = (condition, message) => {
  if (!condition) failures.push(message)
}

const browser = await Browser.launch()
try {
  for (const width of viewports) {
    const page = await browser.newPage({ width, height: 900, mobile: width < 768 })
    await page.goto(url, { settleMs: 2500 })

    const result = await page.eval(() => {
      const click = (selector) => document.querySelector(selector)?.click()
      const nav = document.querySelector('#public-nav')
      const toggle = document.querySelector('.nav-toggle')
      const day = document.querySelector('.day-tab:not([data-day="all"])')
      const rail = document.querySelector('.gallery-rail')
      const next = document.querySelector('.gallery-rail-next')
      const image = rail?.querySelector('.gallery-card img')
      const dialog = document.querySelector('#public-lightbox')
      const before = rail?.scrollLeft ?? 0

      if (toggle) click('.nav-toggle')
      const navOpen = !toggle || (toggle.getAttribute('aria-expanded') === 'true' && nav.classList.contains('is-open'))

      if (day) day.click()
      const dayFiltered = !day || [...document.querySelectorAll('.journey-day')].some((item) => item.classList.contains('hidden'))

      if (image) image.click()
      const lightboxOpen = !image || dialog?.open === true

      if (dialog?.open) dialog.querySelector('[data-lightbox-next]')?.click()
      if (next) next.click()

      return { navOpen, dayFiltered, lightboxOpen, before, hasNext: !!next }
    })

    const diorama = await page.eval(() => {
      const hero = document.querySelector('#beranda')
      const wrap = document.querySelector('.diorama-canvas-wrap')
      const canvas = document.querySelector('#hero-3d-root canvas')
      return {
        state: hero?.dataset.diorama,
        ready: wrap?.getAttribute('data-ready'),
        hasCanvas: !!canvas,
        metrics: window.__DIORAMA_METRICS__ || null,
      }
    })

    const heroCheck = await page.eval(() => new Promise((resolve) => {
      const hero = document.querySelector('#beranda')
      if (hero?.dataset.diorama === 'active') {
        const canvas = document.querySelector('#hero-3d-root canvas')
        const ready = document.querySelector('.diorama-canvas-wrap')?.getAttribute('data-ready') === 'true'
        const metrics = window.__DIORAMA_METRICS__
        resolve(Boolean(canvas && ready && metrics?.bounds))
        return
      }

      const bg = getComputedStyle(document.querySelector('.hero'), '::before').backgroundImage
      if (!bg || bg === 'none') {
        resolve(false)
        return
      }

      const probe = new Image()
      probe.onload = () => resolve(probe.naturalWidth > 0)
      probe.onerror = () => resolve(false)
      probe.src = bg.replace(/^url\("?|"?\)$/g, '')
    }))

    await sleep(500)
    const after = await page.eval(() => ({
      scrollLeft: document.querySelector('.gallery-rail')?.scrollLeft ?? 0,
      touchTargets: [...document.querySelectorAll('.gallery-rail-button,.public-lightbox button')]
        .filter((item) => getComputedStyle(item).display !== 'none')
        .every((item) => {
          const rect = item.getBoundingClientRect()
          return rect.width >= 44 && rect.height >= 44
        }),
    }))

    check(result.navOpen, `${width}px: nav did not open`)
    check(result.dayFiltered, `${width}px: day filter did not update`)
    check(result.lightboxOpen, `${width}px: lightbox did not open`)
    check(!result.hasNext || after.scrollLeft !== result.before, `${width}px: gallery next control did not move`)
    check(after.touchTargets, `${width}px: control smaller than 44px`)
    check(heroCheck, `${width}px: hero visual verification failed (diorama=${JSON.stringify(diorama)})`)
    check(page.consoleErrors.length === 0, `${width}px: browser exception ${page.consoleErrors.join('; ')}`)

    const handoffCheck = await page.eval(() => {
      const hero = document.querySelector('#beranda')
      const stage = hero?.closest('.hero-stage')
      const header = document.querySelector('.site-header')
      const about = document.querySelector('#tentang')
      const heading = about?.querySelector('h2')
      if (!hero || !stage || !about || !heading) return { ok: false, reason: 'missing elements' }

      const headerH = header?.offsetHeight ?? 76
      const start = stage.getBoundingClientRect().top + window.scrollY - headerH
      const aboutTop = about.getBoundingClientRect().top + window.scrollY
      const end = Math.max(start + stage.offsetHeight - hero.offsetHeight, aboutTop - headerH)
      const initialStageHeight = stage.offsetHeight
      const initialAboutTop = aboutTop

      document.querySelector('#public-lightbox')?.close?.()
      window.scrollTo({ top: end, behavior: 'instant' })
      const headingRect = heading.getBoundingClientRect()
      const heroRect = hero.getBoundingClientRect()
      const aboutRect = about.getBoundingClientRect()
      const distBelowHeader = headingRect.top - headerH
      const overlap = !(heroRect.bottom <= aboutRect.top || heroRect.top >= aboutRect.bottom)

      return {
        ok: true,
        headerH,
        end,
        distBelowHeader,
        headingTop: headingRect.top,
        aboutTopViewport: aboutRect.top,
        heroBottom: heroRect.bottom,
        overlap,
        stable: stage.offsetHeight === initialStageHeight && Math.abs(aboutRect.top + scrollY - initialAboutTop) < 1,
        progress: window.__DIORAMA_METRICS__?.progress ?? null,
      }
    })
    check(handoffCheck.ok, `${width}px: handoff elements missing`)
    check(handoffCheck.distBelowHeader >= 0 && handoffCheck.distBelowHeader <= 220, `${width}px: heading out of range below header (${handoffCheck.distBelowHeader}px)`)
    check(!handoffCheck.overlap, `${width}px: hero overlaps about section at end`)
    check(handoffCheck.stable, `${width}px: layout shifted during handoff check`)
    await page.eval(() => window.scrollTo(0, 0))
    await page.close()
  }

  const motionPage = await browser.newPage({ width: 1440, height: 900, reducedMotion: true })
  await motionPage.goto(url, { settleMs: 1500 })
  const motionState = await motionPage.eval(() => ({
    state: document.querySelector('#beranda')?.dataset.diorama,
    canvas: !!document.querySelector('#hero-3d-root canvas'),
  }))
  check(motionState.state === 'fallback' && !motionState.canvas, `Reduced motion did not fall back: ${JSON.stringify(motionState)}`)
  await motionPage.close()

  const failPage = await browser.newPage({ width: 1440, height: 900 })
  await failPage.goto(url, { settleMs: 2500 })
  const fallbackAfterLoss = await failPage.eval(() => {
    const canvas = document.querySelector('#hero-3d-root canvas')
    if (!canvas) return false
    const gl = canvas.getContext('webgl2') || canvas.getContext('webgl')
    const ext = gl?.getExtension('WEBGL_lose_context')
    if (ext) ext.loseContext()
    return document.querySelector('#beranda')?.dataset.diorama
  })
  await sleep(300)
  const lossFinalState = await failPage.eval(() => document.querySelector('#beranda')?.dataset.diorama)
  check(lossFinalState === 'fallback', `Context loss did not enter fallback: ${fallbackAfterLoss} -> ${lossFinalState}`)
  await failPage.close()
} catch (error) {
  failures.push(error.message)
} finally {
  await browser.close()
}

if (failures.length) {
  console.error(`FAIL\n- ${failures.join('\n- ')}`)
  process.exit(1)
}
console.log('PASS public browser checks: 360, 390, 768, 1024, 1440 + reduced motion + webgl context loss')
