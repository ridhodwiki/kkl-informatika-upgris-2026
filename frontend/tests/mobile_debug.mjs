import { Browser, sleep } from 'file:///C:/Users/admin/.config/opencode/skills/taste-skill/skills/taste-skill/scripts/lib/cdp.mjs';

const url = 'http://localhost/kkl-informatika-upgris-2026/public/';
const b = await Browser.launch();
const page = await b.newPage({ width: 390, height: 844, mobile: true });
await page.goto(url);
await sleep(600);

// Get chapter positions and scroll to each one
const data = await page.eval(() => {
  const scene3 = document.querySelector('.learning-scene');
  const chapters = [...document.querySelectorAll('.learning-chapter')];
  const pin = document.querySelector('.learning-pin');
  if (!scene3) return null;
  return {
    scene3Top: scene3.offsetTop,
    scene3Height: scene3.offsetHeight,
    vh: window.innerHeight,
    pinPosition: getComputedStyle(pin).position,
    pinHeight: pin.offsetHeight,
    chapters: chapters.map((ch, i) => ({
      i,
      offsetTop: ch.offsetTop,
      height: ch.offsetHeight,
      mid: ch.offsetTop + ch.offsetHeight / 2,
    })),
  };
});
console.log('Section/chapter data:', JSON.stringify(data, null, 2));

// For each chapter, scroll to its mid and read active state
for (const ch of data.chapters) {
  const scene3Top = data.scene3Top;
  const targetScroll = scene3Top + ch.offsetTop + ch.height / 2 - data.vh / 2;
  await page.eval((y) => {
    window.scrollTo(0, Math.max(0, y));
    window.dispatchEvent(new Event('scroll'));
  }, targetScroll);
  await sleep(400);

  const state = await page.eval(() => {
    const chapters = [...document.querySelectorAll('.learning-chapter')];
    const frames = [...document.querySelectorAll('.learning-frame')];
    const vh = window.innerHeight;
    const viewportMid = vh / 2;
    const chDistances = chapters.map((ch, i) => {
      const rect = ch.getBoundingClientRect();
      const chMid = rect.top + rect.height / 2;
      return { i, top: rect.top.toFixed(0), chMid: chMid.toFixed(0), dist: Math.abs(chMid - viewportMid).toFixed(0) };
    });
    const activeFrame = frames.findIndex((f) => f.dataset.active === 'true');
    return {
      scrollY: window.scrollY,
      viewportMid: viewportMid.toFixed(0),
      chDistances,
      activeFrame,
      activeFrameSrc: frames[activeFrame]?.querySelector('img')?.src?.split('/').pop(),
    };
  });
  console.log(`\nScrolled to ch${ch.i} (scrollY=${state.scrollY}):`);
  console.log('  viewport mid:', state.viewportMid);
  state.chDistances.forEach((d) => console.log(`  ch${d.i}: rect.top=${d.top}, mid=${d.chMid}, dist=${d.dist}`));
  console.log(`  active frame: ${state.activeFrame} (${state.activeFrameSrc})`);
}

await b.close();
