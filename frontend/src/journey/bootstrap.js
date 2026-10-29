import './journey.css'
import { extractOutboundDays, normalizeRoute, drawingStops } from './places.js'

function text(tag, value, className) {
  const node = document.createElement(tag)
  node.textContent = value
  if (className) node.className = className
  return node
}

export function initJourney() {
  const about = document.querySelector('#tentang')
  const timeline = document.querySelector('#timeline')
  if (!about || !timeline || document.querySelector('.journey-scene')) return
  const days = extractOutboundDays(document)
  const all = normalizeRoute(days)
  const arrival = all.findIndex((name) => name.toLowerCase() === 'gilimanuk')
  const route = arrival < 0 ? all : all.slice(0, arrival + 1)
  if (!route.length) return
  const root = document.createElement('section')
  root.className = 'journey-scene'
  root.setAttribute('aria-label', 'Skema perjalanan berangkat')
  const header = document.createElement('header')
  header.append(text('p', '02 / PERJALANAN BERANGKAT', 'journey-kicker'), text('h2', 'Menapaki perjalanan.'), text('p', 'Skema editorial · bukan peta geografis · tidak berskala.', 'journey-disclaimer'))
  const stops = drawingStops(route)
  const list = document.createElement('ol')
  list.className = 'journey-stops'
  for (const [index, name] of stops.entries()) {
    const item = document.createElement('li')
    item.append(text('span', String(index + 1).padStart(2, '0'), 'journey-number'), text('strong', name, 'journey-label'))
    list.append(item)
  }
  const crossing = route.some((name, index) => name.toLowerCase() === 'ketapang' && route[index + 1]?.toLowerCase() === 'gilimanuk')
  const note = text('p', crossing ? 'Ketapang → Gilimanuk: penghubung putus-putus hanya ilustrasi penyeberangan, bukan jalur jalan atau pelayaran terverifikasi.' : 'Urutan mengikuti teks rute hari 1–2. Lokasi dan jalur belum diverifikasi.', 'journey-note')
  root.append(header, list, note)
  about.after(root)
  const load = () => import('./index.js').then(({ enhanceJourney }) => enhanceJourney(root, stops)).catch(() => { root.dataset.state = 'fallback' })
  if (!('IntersectionObserver' in window)) { load(); return }
  const observer = new IntersectionObserver((entries) => {
    if (!entries.some((entry) => entry.isIntersecting)) return
    observer.disconnect()
    load()
  }, { rootMargin: '300px' })
  observer.observe(root)
}
