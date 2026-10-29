/**
 * Navbar micro-interaction regression check.
 *
 * Tests at 360, 390, 768 (mobile) and verifies 1024, 1440 (desktop unaffected).
 */

import { Browser, sleep } from 'file:///C:/Users/admin/.config/opencode/skills/taste-skill/skills/taste-skill/scripts/lib/cdp.mjs';

const url = process.argv[2] || 'http://localhost/kkl-informatika-upgris-2026/public/';
const failures = []
const check = (cond, msg) => { if (!cond) failures.push(msg) }

const browser = await Browser.launch()

// ── Mobile tests ──────────────────────────────────────────────────────────
for (const [width, height] of [[360, 812], [390, 844], [768, 1024]]) {
  const page = await browser.newPage({ width, height, mobile: width < 768 })
  await page.goto(url)
  await sleep(400)

  const initial = await page.eval(() => {
    const toggle = document.querySelector('.nav-toggle')
    const nav = document.querySelector('#public-nav')
    return {
      toggleVisible: toggle ? getComputedStyle(toggle).display !== 'none' : false,
      toggleAriaExpanded: toggle?.getAttribute('aria-expanded'),
      navIsOpen: nav?.classList.contains('is-open'),
      navHasTransition: nav ? getComputedStyle(nav).transition !== 'none' && getComputedStyle(nav).transition !== '' : false,
      toggleHasBefore: true, // CSS pseudo-elements can't be checked directly
    }
  })

  check(initial.toggleVisible, `${width}px: nav-toggle should be visible`)
  check(initial.toggleAriaExpanded === 'false', `${width}px: toggle should start with aria-expanded=false`)
  check(!initial.navIsOpen, `${width}px: nav should start closed`)

  // Open the menu
  await page.eval(() => document.querySelector('.nav-toggle')?.click())
  await sleep(350)

  const openState = await page.eval(() => {
    const toggle = document.querySelector('.nav-toggle')
    const nav = document.querySelector('#public-nav')
    const links = [...(nav?.querySelectorAll('a') ?? [])]
    return {
      ariaExpanded: toggle?.getAttribute('aria-expanded'),
      isOpen: nav?.classList.contains('is-open'),
      linksVisible: links.filter((a) => getComputedStyle(a).display !== 'none').length,
      linksFocusable: links.every((a) => a.tabIndex !== -1),
      navOpacity: parseFloat(getComputedStyle(nav).opacity),
      navTransformY: getComputedStyle(nav).transform,
    }
  })

  check(openState.ariaExpanded === 'true', `${width}px: aria-expanded should be true when open`)
  check(openState.isOpen, `${width}px: nav should have is-open class`)
  check(openState.linksVisible >= 5, `${width}px: at least 5 nav links should be visible when open, got ${openState.linksVisible}`)
  check(openState.navOpacity > 0.9, `${width}px: nav opacity should be ~1 when open, got ${openState.navOpacity}`)

  // Close via button
  await page.eval(() => document.querySelector('.nav-toggle')?.click())
  await sleep(350)

  const closedState = await page.eval(() => {
    const toggle = document.querySelector('.nav-toggle')
    const nav = document.querySelector('#public-nav')
    return {
      ariaExpanded: toggle?.getAttribute('aria-expanded'),
      isOpen: nav?.classList.contains('is-open'),
    }
  })

  check(closedState.ariaExpanded === 'false', `${width}px: aria-expanded should be false when closed`)
  check(!closedState.isOpen, `${width}px: nav should not have is-open after closing`)

  // Escape key closes menu
  await page.eval(() => document.querySelector('.nav-toggle')?.click())
  await sleep(200)
  await page.eval(() => {
    document.querySelector('#public-nav')?.dispatchEvent(new KeyboardEvent('keydown', { key: 'Escape', bubbles: true }))
  })
  await sleep(200)

  const escapeState = await page.eval(() => ({
    isOpen: document.querySelector('#public-nav')?.classList.contains('is-open'),
    ariaExpanded: document.querySelector('.nav-toggle')?.getAttribute('aria-expanded'),
  }))
  check(!escapeState.isOpen, `${width}px: Escape should close the menu`)
  check(escapeState.ariaExpanded === 'false', `${width}px: Escape should set aria-expanded=false`)

  // Link click closes menu
  await page.eval(() => document.querySelector('.nav-toggle')?.click())
  await sleep(200)
  await page.eval(() => document.querySelector('#public-nav a')?.click())
  await sleep(200)

  const linkClickState = await page.eval(() => ({
    isOpen: document.querySelector('#public-nav')?.classList.contains('is-open'),
  }))
  check(!linkClickState.isOpen, `${width}px: clicking a link should close the menu`)

  // Rapid toggle stability
  for (let i = 0; i < 5; i++) {
    await page.eval(() => document.querySelector('.nav-toggle')?.click())
    await sleep(30)
  }
  await sleep(300)
  const rapidState = await page.eval(() => ({
    ariaExpanded: document.querySelector('.nav-toggle')?.getAttribute('aria-expanded'),
    isOpen: document.querySelector('#public-nav')?.classList.contains('is-open'),
  }))
  // After 5 clicks (odd), should be open
  check(
    rapidState.ariaExpanded === 'true' && rapidState.isOpen,
    `${width}px: after 5 rapid clicks, menu should be open (got expanded=${rapidState.ariaExpanded})`
  )
  // Close it
  await page.eval(() => document.querySelector('.nav-toggle')?.click())
  await sleep(200)

  // No horizontal overflow
  const overflow = await page.eval(() => document.body.scrollWidth > document.documentElement.clientWidth + 2)
  check(!overflow, `${width}px: navbar causes horizontal overflow`)

  check(page.consoleErrors.length === 0, `${width}px: console errors: ${page.consoleErrors.join('; ')}`)

  console.log(`${width}px: navbar checks passed`)
  await page.close()
  await sleep(150)
}

// ── Desktop: nav-toggle hidden, no regressions ────────────────────────────
for (const [width, height] of [[1024, 768], [1440, 900]]) {
  const page = await browser.newPage({ width, height, mobile: false })
  await page.goto(url)
  await sleep(400)

  const desktop = await page.eval(() => {
    const toggle = document.querySelector('.nav-toggle')
    const nav = document.querySelector('#public-nav')
    return {
      toggleHidden: toggle ? getComputedStyle(toggle).display === 'none' : true,
      navVisible: nav ? getComputedStyle(nav).display !== 'none' : false,
      linkCount: nav?.querySelectorAll('a')?.length ?? 0,
    }
  })

  check(desktop.toggleHidden, `${width}px: nav-toggle should be hidden on desktop`)
  check(desktop.navVisible, `${width}px: nav should be visible on desktop without toggle`)
  check(desktop.linkCount >= 5, `${width}px: desktop nav should have ≥5 links, got ${desktop.linkCount}`)
  check(page.consoleErrors.length === 0, `${width}px: desktop console errors: ${page.consoleErrors.join('; ')}`)

  console.log(`${width}px: desktop nav unaffected`)
  await page.close()
  await sleep(100)
}

await browser.close()

if (failures.length) {
  console.error(`\nFAIL navbar checks:\n- ${failures.join('\n- ')}`)
  process.exit(1)
}
console.log('\nPASS navbar checks: 360, 390, 768 (mobile) + 1024, 1440 (desktop)')
