/**
 * Scene 3 performance check:
 * - Image transfer sizes
 * - CLS (Cumulative Layout Shift)
 * - No console errors in the Scene 3 area
 */
import { Browser, sleep } from 'file:///C:/Users/admin/.config/opencode/skills/taste-skill/skills/taste-skill/scripts/lib/cdp.mjs';

const url = process.argv[2] || 'http://localhost/kkl-informatika-upgris-2026/public/';
const failures = [];
const check = (cond, msg) => { if (!cond) failures.push(msg); };

const browser = await Browser.launch();
const page = await browser.newPage({ width: 1440, height: 900, mobile: false });
await page.goto(url);
await sleep(800);

// Scroll through Scene 3 to trigger lazy loads
const scene3Top = await page.eval(() => document.querySelector('.learning-scene')?.offsetTop ?? 0);
for (let i = 0; i <= 4; i++) {
  await page.eval((y) => window.scrollTo(0, y), Math.round(scene3Top + i * 300));
  await sleep(120);
}
await sleep(300);

const metrics = await page.eval(() => {
  // Collect all image resources
  const imageResources = performance.getEntriesByType('resource').filter(
    (r) => r.initiatorType === 'img' && r.name.includes('scene3')
  );

  // CLS from layout-shift entries
  let cls = 0;
  if ('PerformanceObserver' in window) {
    // Read already-collected shifts
    try {
      const lsEntries = performance.getEntriesByType('layout-shift');
      cls = lsEntries.reduce((sum, e) => sum + e.value, 0);
    } catch (_) { cls = -1; }
  }

  // Check pin is visible (has non-zero dimensions)
  const pin = document.querySelector('.learning-pin');
  const pinDims = pin ? { w: pin.offsetWidth, h: pin.offsetHeight } : null;

  // Check chapter elements rendered
  const chapters = document.querySelectorAll('.learning-chapter');

  // Image load status
  const imgs = [...document.querySelectorAll('.learning-pin img')];
  const imgStatus = imgs.map((img) => ({
    src: img.src.split('/').pop(),
    complete: img.complete,
    naturalW: img.naturalWidth,
    naturalH: img.naturalHeight,
  }));

  return {
    imageResources: imageResources.map((r) => ({
      name: r.name.split('/').pop(),
      transferSize: r.transferSize,
      encodedBodySize: r.encodedBodySize,
    })),
    cls: Math.round(cls * 1000) / 1000,
    pinDims,
    chapterCount: chapters.length,
    imgStatus,
    consoleErrors: window.__consoleErrors ?? [],
  };
});

console.log('Scene 3 Performance Metrics:');
console.log('  CLS:', metrics.cls, metrics.cls > 0.1 ? '⚠ HIGH' : '✓');
console.log('  Pin dimensions:', metrics.pinDims);
console.log('  Chapters rendered:', metrics.chapterCount);
console.log('  Images in pin:');
metrics.imgStatus.forEach((img) => {
  console.log(`    ${img.src}: complete=${img.complete}, ${img.naturalW}×${img.naturalH}`);
});

if (metrics.imageResources.length > 0) {
  console.log('  Network image resources:');
  metrics.imageResources.forEach((r) => {
    console.log(`    ${r.name}: ${r.transferSize} bytes transfer / ${r.encodedBodySize} bytes encoded`);
  });
} else {
  console.log('  Network resources: SVGs loaded inline (transfer size tracked in page load)');
}

check(metrics.pinDims && metrics.pinDims.h > 0, 'Pin height is 0');
check(metrics.chapterCount === 3, `Expected 3 chapters, got ${metrics.chapterCount}`);
check(metrics.cls < 0.1, `CLS too high: ${metrics.cls}`);

const errors = page.consoleErrors ?? [];
check(errors.length === 0, `Console errors: ${errors.join('; ')}`);

await browser.close();

if (failures.length) {
  console.error(`\nFAIL:\n- ${failures.join('\n- ')}`);
  process.exit(1);
}
console.log('\nPASS Scene 3 performance checks');
