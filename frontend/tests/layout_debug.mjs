import { Browser, sleep } from 'file:///C:/Users/admin/.config/opencode/skills/taste-skill/skills/taste-skill/scripts/lib/cdp.mjs';

const url = process.argv[2] || 'http://localhost/kkl-informatika-upgris-2026/public/';
const b = await Browser.launch();

// Check 360px overflow
const p360 = await b.newPage({ width: 360, height: 812, mobile: true });
await p360.goto(url);
await sleep(600);
const r360 = await p360.eval(() => {
  const scene = document.querySelector('.learning-scene');
  const pin = document.querySelector('.learning-pin');
  if (!scene) return null;
  const sceneRect = scene.getBoundingClientRect();
  const pinRect = pin ? pin.getBoundingClientRect() : null;
  const bodyW = document.body.scrollWidth;
  const vpW = document.documentElement.clientWidth;
  return {
    bodyScrollWidth: bodyW,
    viewportWidth: vpW,
    overflow: bodyW > vpW + 2,
    sceneRight: Math.round(sceneRect.right),
    pinRight: pinRect ? Math.round(pinRect.right) : null,
    pinWidth: pinRect ? Math.round(pinRect.width) : null,
    pinPosition: pin ? getComputedStyle(pin).position : null,
  };
});
console.log('360px:', JSON.stringify(r360, null, 2));
await p360.close();

// Check 1024px layout
const p1024 = await b.newPage({ width: 1024, height: 768, mobile: false });
await p1024.goto(url);
await sleep(600);
const r1024 = await p1024.eval(() => {
  const pin = document.querySelector('.learning-pin');
  const stage = document.querySelector('.learning-stage');
  if (!pin || !stage) return null;
  const pinRect = pin.getBoundingClientRect();
  const stageRect = stage.getBoundingClientRect();
  const cs = getComputedStyle(stage);
  return {
    stagePaddingLeft: cs.paddingLeft,
    stagePaddingRight: cs.paddingRight,
    stageLeft: Math.round(stageRect.left),
    pinLeft: Math.round(pinRect.left),
    pinRight: Math.round(pinRect.right),
    pinWidth: Math.round(pinRect.width),
    pinMarginRight: getComputedStyle(pin).marginRight,
    overflow: document.body.scrollWidth > document.documentElement.clientWidth + 2,
  };
});
console.log('1024px:', JSON.stringify(r1024, null, 2));
await p1024.close();

await b.close();
