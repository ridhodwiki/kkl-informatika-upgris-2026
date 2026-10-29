import { Browser, sleep } from 'file:///C:/Users/admin/.config/opencode/skills/taste-skill/skills/taste-skill/scripts/lib/cdp.mjs';

const url = process.argv[2] || 'http://localhost/kkl-informatika-upgris-2026/public/';
const viewports = [360, 390, 768, 1024, 1440];
const failures = [];
const check = (condition, message) => {
  if (!condition) failures.push(message);
};

const browser = await Browser.launch();
try {
  for (const width of viewports) {
    const page = await browser.newPage({ width, height: 900, mobile: width < 768 });
    await page.goto(url);
    const result = await page.eval(() => {
      const click = (selector) => document.querySelector(selector)?.click();
      const nav = document.querySelector('#public-nav');
      const toggle = document.querySelector('.nav-toggle');
      const day = document.querySelector('.day-tab:not([data-day="all"])');
      const rail = document.querySelector('.gallery-rail');
      const next = document.querySelector('.gallery-rail-next');
      const image = rail?.querySelector('.gallery-card img');
      const dialog = document.querySelector('#public-lightbox');
      const before = rail?.scrollLeft ?? 0;
      if (toggle) click('.nav-toggle');
      const navOpen = !toggle || (toggle.getAttribute('aria-expanded') === 'true' && nav.classList.contains('is-open'));
      if (day) day.click();
      const dayFiltered = !day || [...document.querySelectorAll('.journey-day')].some((item) => item.classList.contains('hidden'));
      if (image) image.click();
      const lightboxOpen = !image || dialog?.open === true;
      if (dialog?.open) dialog.querySelector('[data-lightbox-next]')?.click();
      if (next) next.click();
      return { navOpen, dayFiltered, lightboxOpen, before, hasNext: !!next };
    });
    const heroLoaded = await page.eval(() => new Promise((resolve) => {
      const probe = new Image();
      probe.onload = () => resolve(probe.naturalWidth > 0);
      probe.onerror = () => resolve(false);
      probe.src = getComputedStyle(document.querySelector('.hero'), '::before').backgroundImage.replace(/^url\("?|"?\)$/g, '');
    }));
    await sleep(500);
    const after = await page.eval(() => ({
      scrollLeft: document.querySelector('.gallery-rail')?.scrollLeft ?? 0,
      touchTargets: [...document.querySelectorAll('.gallery-rail-button,.public-lightbox button')].filter((item) => getComputedStyle(item).display !== 'none').every((item) => {
        const rect = item.getBoundingClientRect();
        return rect.width >= 44 && rect.height >= 44;
      }),
    }));
    check(result.navOpen, `${width}px: nav did not open`);
    check(result.dayFiltered, `${width}px: day filter did not update`);
    check(result.lightboxOpen, `${width}px: lightbox did not open`);
    check(!result.hasNext || after.scrollLeft !== result.before, `${width}px: gallery next control did not move`);
    check(after.touchTargets, `${width}px: control smaller than 44px`);
    check(heroLoaded, `${width}px: hero image failed to load`);
    await sleep(200);
    check(page.consoleErrors.length === 0, `${width}px: browser exception ${page.consoleErrors.join('; ')}`);
    await page.close();
  }
} catch (error) {
  failures.push(error.message);
} finally {
  await browser.close();
}

if (failures.length) {
  console.error(`FAIL\n- ${failures.join('\n- ')}`);
  process.exit(1);
}
console.log('PASS public browser checks: 360, 390, 768, 1024, 1440');
