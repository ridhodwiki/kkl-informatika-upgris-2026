import './learning.css'
import { chapterProgress, sceneProgress } from './geometry.js'

// ─── Content ─────────────────────────────────────────────────────────────────
// All institution names, dates, and times verified against KKL itinerary data
// (seed_destinations.sql). The retail photo is a pre-trip illustration; its
// caption does not imply it documents a specific verified Bali location.

const chapters = [
  {
    index: 0,
    number: '01',
    title: 'Industri',
    kicker: 'Kunjungan industri',
    body: 'Balai Diklat Industri Denpasar membuka ruang belajar yang berbeda — mencermati bagaimana pelatihan teknis industri kreatif berlangsung dalam lingkungan profesional.',
    photos: [
      {
        src: 'scene3/bdi.svg',
        width: 1000,
        height: 700,
        alt: 'Gedung Balai Diklat Industri Denpasar, tampak depan',
        caption: 'Balai Diklat Industri Denpasar · 20 Agustus 2026 · 09.00–10.30 WITA · Kunjungan industri',
      },
    ],
  },
  {
    index: 1,
    number: '02',
    title: 'Kriya & Pasar',
    kicker: 'Produksi & distribusi suvenir',
    body: 'Dari meja produksi hingga rak pajang — menjelajahi mata rantai ekonomi kreatif Bali, mulai dari pengrajin lokal hingga ruang ritel yang menjangkau wisatawan nusantara.',
    photos: [
      {
        src: 'scene3/retail.svg',
        width: 1000,
        height: 700,
        alt: 'Display produk kerajinan dan suvenir khas Bali di ruang ritel',
        caption: 'Eksplorasi produksi dan distribusi suvenir khas Bali · 19 Agustus 2026 · 09.30–11.00 WITA · Foto: ilustrasi, bukan dokumentasi lapangan terverifikasi',
      },
    ],
  },
  {
    index: 2,
    number: '03',
    title: 'Warisan & Panggung',
    kicker: 'Warisan budaya Bali',
    body: 'Dari ketenangan Danau Bratan hingga cahaya panggung Devdan — dua wajah pelestarian budaya Bali yang hidup berdampingan: yang sakral di tepi danau, dan yang semarak di atas pentas.',
    photos: [
      {
        src: 'scene3/ulun.svg',
        width: 1000,
        height: 700,
        alt: 'Candi Kuning di tepi Danau Bratan, Ulun Danu Bratan, Bedugul',
        caption: 'Candi Kuning · Ulun Danu Bratan · Bedugul · 19 Agustus 2026 · 11.30–12.30 WITA',
      },
      {
        src: 'scene3/devdan.svg',
        width: 1000,
        height: 700,
        alt: 'Pertunjukan tari Devdan Show di panggung Nusa Dua',
        caption: 'Devdan Show · Nusa Dua · 19 Agustus 2026 · 19.00–20.00 WITA',
      },
    ],
  },
]

// ─── Image builder ────────────────────────────────────────────────────────────
// SVG images are served directly (no srcset needed). When real WebP photos are
// added later, swap .svg for .webp and the srcset derivates will auto-resolve.
function buildImage(photo, position) {
  const img = document.createElement('img')
  const base = document.baseURI

  // If the src is an SVG placeholder, use it directly.
  // When a corresponding .webp exists, use responsive srcset.
  if (photo.src.endsWith('.webp')) {
    const full = new URL(photo.src, base).href
    const w640 = new URL(photo.src.replace('.webp', '-640.webp'), base).href
    const w1600 = new URL(photo.src.replace('.webp', '-1600.webp'), base).href
    img.src = full
    img.srcset = `${w640} 640w, ${full} 1000w, ${w1600} 1600w`
    img.sizes = '(max-width: 768px) 100vw, 50vw'
  } else {
    img.src = new URL(photo.src, base).href
  }

  img.alt = photo.alt
  img.width = photo.width
  img.height = photo.height
  img.loading = position === 0 ? 'eager' : 'lazy'
  img.decoding = 'async'
  return img
}

// ─── DOM construction ────────────────────────────────────────────────────────
export function mountScene3() {
  // Guard: prevent duplicate insertion
  if (document.querySelector('.learning-scene')) return
  const timeline = document.querySelector('#timeline')
  if (!timeline) return

  const root = document.createElement('section')
  root.className = 'learning-scene'
  root.setAttribute('aria-labelledby', 'scene3-title')

  // ── Header ──
  const intro = document.createElement('header')
  intro.className = 'learning-intro'
  intro.innerHTML =
    '<p class="learning-kicker">03 / BEKAL YANG DIBAWA PULANG</p>' +
    '<h2 id="scene3-title">Bekal yang dibawa pulang.</h2>' +
    '<p class="learning-intro-body">Catatan waktu dan tempat dari perjalanan — tanpa menambahkan hasil yang tidak tercatat.</p>'

  // ── Gold thread ──
  const thread = document.createElement('div')
  thread.className = 'learning-thread'
  thread.setAttribute('aria-hidden', 'true')

  // ── Sticky stage wrapper ──
  const stage = document.createElement('div')
  stage.className = 'learning-stage'

  // ── Photo pin (sticky photography stage) ──
  const pin = document.createElement('div')
  pin.className = 'learning-pin'
  pin.setAttribute('aria-hidden', 'true') // Decorative; real content in chapters

  // All photo frames placed in the pin layer (visual only, aria-hidden)
  let photoPosition = 0
  const pinFrames = []
  for (const chapter of chapters) {
    for (const photo of chapter.photos) {
      const frame = document.createElement('div')
      frame.className = 'learning-frame'
      frame.dataset.chapter = String(chapter.index)
      frame.dataset.frameIndex = String(pinFrames.length)
      const img = buildImage(photo, photoPosition)
      frame.append(img)
      pin.append(frame)
      pinFrames.push(frame)
      photoPosition++
    }
  }

  // ── Chapters scroll rail ──
  const rail = document.createElement('div')
  rail.className = 'learning-rail'

  for (const chapter of chapters) {
    const article = document.createElement('article')
    article.className = 'learning-chapter'
    article.dataset.chapter = String(chapter.index)

    const copy = document.createElement('div')
    copy.className = 'learning-copy'
    copy.innerHTML =
      `<span class="learning-chapter-number">${chapter.number}</span>` +
      `<p class="learning-kicker">${chapter.kicker}</p>` +
      `<h3>${chapter.title}</h3>` +
      `<p class="learning-body">${chapter.body}</p>`

    article.append(copy)

    // ── Per-chapter inline media (mobile layout) ──
    // On mobile the sticky pin scrolls away; each chapter gets its own
    // illustration div that stays in flow with the chapter text.
    // On desktop (≥769px) this is hidden — the sticky pin handles display.
    const chapterMedia = document.createElement('div')
    chapterMedia.className = 'learning-chapter-media'
    chapterMedia.setAttribute('aria-hidden', 'true')
    for (const photo of chapter.photos) {
      const mediaImg = buildImage(photo, photoPosition)
      chapterMedia.append(mediaImg)
    }
    article.append(chapterMedia)

    // Figures are accessible content (visible in reduced-motion, keyboard accessible)
    for (const photo of chapter.photos) {
      const figure = document.createElement('figure')
      figure.className = 'learning-photo-credit'
      const cap = document.createElement('figcaption')
      cap.textContent = photo.caption
      // In standard view, the actual photo is shown in the pin layer.
      // In reduced-motion view, we render it here directly inside the figure too.
      const reducedImg = buildImage(photo, photoPosition)
      reducedImg.className = 'learning-reduced-img'
      figure.append(reducedImg, cap)
      article.append(figure)
      photoPosition++
    }

    rail.append(article)
  }

  stage.append(pin, rail)
  root.append(intro, thread, stage)

  timeline.before(root)

  // Pre-initialize: mark frame 0 active synchronously so mobile shows
  // the first illustration immediately without waiting for scroll events.
  pinFrames.forEach((frame, i) => {
    frame.dataset.active = i === 0 ? 'true' : 'false'
  })

  // ─── Scroll animation ────────────────────────────────────────────────────
  const reduced = window.matchMedia?.('(prefers-reduced-motion: reduce)')

  const totalPhotos = pinFrames.length
  let ticking = false

  // Map: which frame index corresponds to which chapter
  // chapters[0] → frames[0], chapters[1] → frames[1], chapters[2] → frames[2,3]
  // We want to show the first photo of the chapter nearest to viewport center.
  function getActivePhotoIndexByViewport() {
    const vh = window.innerHeight
    // Activation threshold: 65% from viewport top.
    // A chapter becomes "active" when its top edge scrolls above this line.
    // At 65%: the chapter has entered the upper two-thirds of the screen,
    // signalling it is the dominant content for this scroll position.
    const threshold = vh * 0.65

    const chapterEls = [...rail.querySelectorAll('.learning-chapter')]

    // Find the LAST chapter whose top edge is above the threshold line.
    // "Last" = deepest in the page that has crossed the threshold = most recently entered.
    let bestChapterIdx = 0
    for (let i = 0; i < chapterEls.length; i++) {
      const rect = chapterEls[i].getBoundingClientRect()
      if (rect.top < threshold) {
        bestChapterIdx = i
      }
    }

    // Map chapter index to first photo frame index for that chapter
    let frameIdx = 0
    for (let ci = 0; ci < bestChapterIdx; ci++) frameIdx += chapters[ci].photos.length
    return Math.min(totalPhotos - 1, Math.max(0, frameIdx))
  }

  function getActivePhotoIndex(progress) {
    // Always use viewport-center chapter detection for reliable photo alignment
    // on both desktop and mobile. The progress parameter is kept for potential
    // future use but viewport-center is more accurate for chapter switching.
    return getActivePhotoIndexByViewport()
  }

  function applyReducedMotion() {
    root.dataset.motion = 'reduced'
    root.style.setProperty('--scene-progress', '1')
    pinFrames.forEach((frame, i) => {
      frame.style.setProperty('--frame-reveal', '1')
      frame.style.setProperty('--frame-parallax', '0')
      frame.dataset.active = i === 0 ? 'true' : 'false'
    })
    document.querySelectorAll('.learning-chapter').forEach((chapter, i) => {
      chapter.style.setProperty('--chapter-progress', '1')
    })
    // Show the gold thread fully
    root.style.setProperty('--thread-progress', '1')
  }

  function update() {
    ticking = false

    if (reduced?.matches) {
      applyReducedMotion()
      return
    }

    const scrollY = window.scrollY
    const rootTop = root.offsetTop
    const rootH = root.offsetHeight
    const vh = window.innerHeight

    const progress = sceneProgress(scrollY, rootTop, rootH, vh)
    root.style.setProperty('--scene-progress', progress.toFixed(4))
    root.style.setProperty('--thread-progress', progress.toFixed(4))

    const activePhotoIndex = getActivePhotoIndex(progress)

    // ── Sticky pin frame transitions ──
    pinFrames.forEach((frame, i) => {
      const isActive = i === activePhotoIndex
      frame.dataset.active = String(isActive)

      // Per-frame reveal progress: each frame has a reveal window
      // The reveal window for frame i occupies [i/n, (i+0.5)/n] of scene progress
      const revealStart = i / totalPhotos
      const revealEnd = revealStart + 0.5 / totalPhotos
      const reveal = Math.min(1, Math.max(0, (progress - revealStart) / (revealEnd - revealStart)))
      frame.style.setProperty('--frame-reveal', reveal.toFixed(4))

      // Subtle parallax: active frame moves slightly with local scroll
      const localProgress = chapterProgress(progress, i, totalPhotos)
      const parallax = (localProgress - 0.5) * -12
      frame.style.setProperty('--frame-parallax', `${parallax.toFixed(2)}px`)
    })

    // ── Chapter copy animation ──
    rail.querySelectorAll('.learning-chapter').forEach((chapter, i) => {
      const cp = chapterProgress(progress, i, chapters.length)
      chapter.style.setProperty('--chapter-progress', cp.toFixed(4))
    })
  }

  function schedule() {
    if (!ticking) {
      ticking = true
      requestAnimationFrame(update)
    }
  }

  window.addEventListener('scroll', schedule, { passive: true })
  window.addEventListener('resize', schedule, { passive: true })
  reduced?.addEventListener('change', () => {
    if (reduced.matches) applyReducedMotion()
    else schedule()
  })

  // Initial paint — defer so layout is settled
  requestAnimationFrame(update)
}
