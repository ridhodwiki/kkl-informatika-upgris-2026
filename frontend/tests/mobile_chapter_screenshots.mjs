import { Browser, sleep } from 'file:///C:/Users/admin/.config/opencode/skills/taste-skill/skills/taste-skill/scripts/lib/cdp.mjs';
import { writeFileSync, mkdirSync } from 'node:fs';

const url = 'http://localhost/kkl-informatika-upgris-2026/public/';
const outDir = '../.taste-skill/scene3-screenshots';
try { mkdirSync(outDir, { recursive: true }); } catch {}

const browser = await Browser.launch();

// Capture each chapter at 390px and 768px
for (const [w, h, mobile] of [[390, 844, true], [768, 1024, false]]) {
  const page = await browser.newPage({ width: w, height: h, mobile });
  await page.goto(url);
  await sleep(600);

  const data = await page.eval(() => {
    const scene3 = document.querySelector('.learning-scene');
    const chapters = [...document.querySelectorAll('.learning-chapter')];
    if (!scene3) return null;
    return {
      scene3Top: scene3.offsetTop,
      chapters: chapters.map((ch, i) => ({
        i,
        top: scene3.offsetTop + ch.offsetTop,
        height: ch.offsetHeight,
      })),
    };
  });

  if (!data) { await page.close(); continue; }

  for (const ch of data.chapters) {
    // Scroll so chapter top is near 30% from top of viewport
    const targetScroll = ch.top - Math.round(h * 0.25);
    await page.eval((y) => {
      window.scrollTo(0, Math.max(0, y));
      window.dispatchEvent(new Event('scroll'));
    }, targetScroll);
    await sleep(350);

    const shot = await page.screenshot();
    const fname = `${outDir}/${w}-ch${ch.i}.jpg`;
    writeFileSync(fname, Buffer.from(shot, 'base64'));

    const state = await page.eval(() => {
      const f = document.querySelector('.learning-frame[data-active="true"]');
      return { frameIndex: f?.dataset?.frameIndex, src: f?.querySelector('img')?.src?.split('/').pop() };
    });
    console.log(` ✓ ${w}px ch${ch.i}: frame=${state.frameIndex} (${state.src}) → ${fname}`);
  }

  await page.close();
  await sleep(150);
}

await browser.close();
console.log('\nMobile chapter screenshots captured.');
