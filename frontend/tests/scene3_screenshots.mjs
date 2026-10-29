import { Browser, sleep } from 'file:///C:/Users/admin/.config/opencode/skills/taste-skill/skills/taste-skill/scripts/lib/cdp.mjs';
import { writeFileSync, mkdirSync } from 'node:fs';

const url = process.argv[2] || 'http://localhost/kkl-informatika-upgris-2026/public/';
const outDir = '../.taste-skill/scene3-screenshots';
try { mkdirSync(outDir, { recursive: true }); } catch {}

const browser = await Browser.launch();
const results = [];

// 1440px — 5 scroll positions across Scene 3
const page1440 = await browser.newPage({ width: 1440, height: 900, mobile: false });
await page1440.goto(url);
await sleep(800);

const scene3Info = await page1440.eval(() => {
  const el = document.querySelector('.learning-scene');
  if (!el) return null;
  return { top: el.offsetTop, height: el.offsetHeight };
});

if (scene3Info) {
  for (let i = 0; i <= 4; i++) {
    const pct = i / 4;
    const scrollY = Math.round(scene3Info.top + pct * Math.max(scene3Info.height - 900, 0));
    await page1440.eval((y) => window.scrollTo(0, y), scrollY);
    await sleep(350);
    const shot = await page1440.screenshot();
    const fname = `${outDir}/1440-scroll-${Math.round(pct * 100)}pct.jpg`;
    writeFileSync(fname, Buffer.from(shot, 'base64'));
    results.push(`1440px ${Math.round(pct * 100)}%: scrollY=${scrollY}`);
  }
}
await page1440.close();

// Mobile + tablet folds
for (const [w, h, mobile] of [[360, 812, true], [390, 844, true], [768, 1024, false]]) {
  const page = await browser.newPage({ width: w, height: h, mobile });
  await page.goto(url);
  await sleep(600);

  const info = await page.eval(() => {
    const el = document.querySelector('.learning-scene');
    return el ? { top: el.offsetTop, height: el.offsetHeight } : null;
  });

  if (info) {
    // Capture fold (entry)
    await page.eval((y) => window.scrollTo(0, y), info.top);
    await sleep(300);
    const foldShot = await page.screenshot();
    writeFileSync(`${outDir}/${w}-fold.jpg`, Buffer.from(foldShot, 'base64'));
    results.push(`${w}px fold`);

    // Capture mid-scroll
    const mid = Math.round(info.top + Math.max(info.height - h, 0) * 0.5);
    await page.eval((y) => window.scrollTo(0, y), mid);
    await sleep(300);
    const midShot = await page.screenshot();
    writeFileSync(`${outDir}/${w}-mid.jpg`, Buffer.from(midShot, 'base64'));
    results.push(`${w}px mid-scroll`);
  }
  await page.close();
  await sleep(150);
}

// 1024px fold
const page1024 = await browser.newPage({ width: 1024, height: 768, mobile: false });
await page1024.goto(url);
await sleep(600);
const info1024 = await page1024.eval(() => {
  const el = document.querySelector('.learning-scene');
  return el ? { top: el.offsetTop } : null;
});
if (info1024) {
  await page1024.eval((y) => window.scrollTo(0, y), info1024.top);
  await sleep(300);
  const shot = await page1024.screenshot();
  writeFileSync(`${outDir}/1024-fold.jpg`, Buffer.from(shot, 'base64'));
  results.push('1024px fold');
}
await page1024.close();

await browser.close();

for (const r of results) console.log(' ✓', r);
console.log(`\nScreenshots saved to ${outDir}/`);
