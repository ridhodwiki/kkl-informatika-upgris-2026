/**
 * Scene 3 mobile scroll-animation regression check.
 *
 * Verifies that scrolling forward and backward through chapters
 * actually changes the displayed illustration at 360, 390, and 768px.
 *
 * The check scrolls to each chapter's midpoint, reads which frame is
 * active AND which src is visible, then reverses direction.
 */

import { Browser, sleep } from 'file:///C:/Users/admin/.config/opencode/skills/taste-skill/skills/taste-skill/scripts/lib/cdp.mjs';

const url = process.argv[2] || 'http://localhost/kkl-informatika-upgris-2026/public/';
const viewports = [[360, 812, true], [390, 844, true], [768, 1024, false]]
const failures = []
const check = (cond, msg) => { if (!cond) failures.push(msg) }

const browser = await Browser.launch()

for (const [width, height, mobile] of viewports) {
  const page = await browser.newPage({ width, height, mobile })
  await page.goto(url)
  await sleep(600)

  // Get chapter positions
  const chapterData = await page.eval(() => {
    const scene3 = document.querySelector('.learning-scene')
    const chapters = [...document.querySelectorAll('.learning-chapter')]
    const pin = document.querySelector('.learning-pin')
    if (!scene3 || !chapters.length) return null
    return {
      scene3Top: scene3.offsetTop,
      scene3Height: scene3.offsetHeight,
      chapters: chapters.map((ch, i) => ({
        index: i,
        top: ch.offsetTop + scene3.offsetTop,
        height: ch.offsetHeight,
        mid: ch.offsetTop + scene3.offsetTop + ch.offsetHeight / 2,
      })),
      pinDisplay: pin ? getComputedStyle(pin).display : null,
      pinPosition: pin ? getComputedStyle(pin).position : null,
      totalFrames: document.querySelectorAll('.learning-frame').length,
    }
  })

  if (!chapterData) {
    failures.push(`${width}px: Scene 3 not found`)
    await page.close()
    continue
  }

  // On mobile ≤768px: pin should be hidden; illustration is in inline chapter media
  check(
    chapterData.pinDisplay === 'none',
    `${width}px: .learning-pin should be display:none on mobile (≤768px), got "${chapterData.pinDisplay}"`
  )
  check(chapterData.totalFrames === 4, `${width}px: expected 4 frames, got ${chapterData.totalFrames}`)

  // ── Forward scroll: visit each chapter midpoint ──
  const forwardResults = []
  for (const ch of chapterData.chapters) {
    // Scroll so the chapter midpoint is at viewport center
    const targetScroll = ch.mid - height / 2
    await page.eval((y) => window.scrollTo(0, Math.max(0, y)), targetScroll)
    await sleep(250)

    const state = await page.eval(() => {
      const activeFrame = document.querySelector('.learning-frame[data-active="true"]')
      const allFrames = [...document.querySelectorAll('.learning-frame')]
      const visibleFrames = allFrames.filter((f) => {
        const cs = getComputedStyle(f)
        return cs.display !== 'none' && cs.visibility !== 'hidden' && cs.opacity !== '0'
      })
      return {
        activeFrameIndex: activeFrame?.dataset?.frameIndex ?? null,
        activeFrameSrc: activeFrame?.querySelector('img')?.src?.split('/').pop() ?? null,
        visibleFrameCount: visibleFrames.length,
        visibleFrameSrcs: visibleFrames.map((f) => f.querySelector('img')?.src?.split('/').pop()),
        scrollY: window.scrollY,
      }
    })
    forwardResults.push({ chapterIndex: ch.index, ...state })
  }

  // Forward checks: each chapter should show a different illustration
  const ch0Active = forwardResults[0]?.activeFrameIndex
  const ch1Active = forwardResults[1]?.activeFrameIndex
  const ch2Active = forwardResults[2]?.activeFrameIndex

  check(ch0Active === '0', `${width}px: chapter 0 should show frame 0, got frame ${ch0Active}`)
  check(ch1Active === '1', `${width}px: chapter 1 should show frame 1, got frame ${ch1Active}`)
  // Chapter 2 has 2 photos; frame 2 (ulun) should show when at chapter 2 midpoint
  check(ch2Active === '2' || ch2Active === '3', `${width}px: chapter 2 should show frame 2 or 3, got frame ${ch2Active}`)

  // Verify each chapter shows a different src
  check(
    forwardResults[0]?.activeFrameSrc !== forwardResults[1]?.activeFrameSrc,
    `${width}px: chapter 0 and 1 show same illustration (${forwardResults[0]?.activeFrameSrc})`
  )
  check(
    forwardResults[1]?.activeFrameSrc !== forwardResults[2]?.activeFrameSrc,
    `${width}px: chapter 1 and 2 show same illustration (${forwardResults[1]?.activeFrameSrc})`
  )

  // Each chapter: only 1 frame visible at a time
  forwardResults.forEach((r) => {
    check(
      r.visibleFrameCount === 1,
      `${width}px: chapter ${r.chapterIndex} — ${r.visibleFrameCount} frames visible (expected 1), srcs: ${r.visibleFrameSrcs?.join(', ')}`
    )
  })

  // ── Reverse scroll ──
  const reverseChapters = [...chapterData.chapters].reverse()
  const reverseResults = []
  for (const ch of reverseChapters) {
    const targetScroll = ch.mid - height / 2
    await page.eval((y) => window.scrollTo(0, Math.max(0, y)), targetScroll)
    await sleep(250)

    const state = await page.eval(() => {
      const activeFrame = document.querySelector('.learning-frame[data-active="true"]')
      return {
        activeFrameIndex: activeFrame?.dataset?.frameIndex ?? null,
        activeFrameSrc: activeFrame?.querySelector('img')?.src?.split('/').pop() ?? null,
      }
    })
    reverseResults.push({ chapterIndex: ch.index, ...state })
  }

  // Reverse checks: should mirror forward
  check(
    reverseResults[0]?.activeFrameIndex === ch2Active,
    `${width}px: reverse ch2 — expected frame ${ch2Active}, got ${reverseResults[0]?.activeFrameIndex}`
  )
  check(
    reverseResults[1]?.activeFrameIndex === ch1Active,
    `${width}px: reverse ch1 — expected frame ${ch1Active}, got ${reverseResults[1]?.activeFrameIndex}`
  )
  check(
    reverseResults[2]?.activeFrameIndex === ch0Active,
    `${width}px: reverse ch0 — expected frame ${ch0Active}, got ${reverseResults[2]?.activeFrameIndex}`
  )

  // No horizontal overflow
  const overflow = await page.eval(() => document.body.scrollWidth > document.documentElement.clientWidth + 2)
  check(!overflow, `${width}px: horizontal overflow detected`)

  // No console errors
  check(page.consoleErrors.length === 0, `${width}px: console errors: ${page.consoleErrors.join('; ')}`)

  console.log(`${width}px forward: ${forwardResults.map((r) => `ch${r.chapterIndex}→frame${r.activeFrameIndex}(${r.activeFrameSrc})`).join(', ')}`)
  console.log(`${width}px reverse: ${reverseResults.map((r) => `ch${r.chapterIndex}→frame${r.activeFrameIndex}`).join(', ')}`)

  await page.close()
  await sleep(150)
}

await browser.close()

if (failures.length) {
  console.error(`\nFAIL Scene 3 mobile:\n- ${failures.join('\n- ')}`)
  process.exit(1)
}
console.log('\nPASS Scene 3 mobile scroll checks: 360, 390, 768')
