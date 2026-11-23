import assert from 'node:assert/strict';
import { mkdir, readFile, writeFile } from 'node:fs/promises';
import { chromium, expect } from '@playwright/test';

const origin = new URL(process.env.QOFENO_CHECK_URL || 'http://localhost:8794').origin;
const remote = new URL(origin).protocol === 'https:';
const output = 'test-results/hero-shutter';
const report = { origin, checkedAt: new Date().toISOString(), checks: [], samples: {}, errors: [], blockedWrites: [] };
const fixtures = new Map(await Promise.all(['board', 'session', 'status', 'visitors'].map(async name => [
  `/api/${name}`, await readFile(new URL(`../tests/fixtures/${name}.json`, import.meta.url), 'utf8'),
])));
await mkdir(output, { recursive: true });
const browser = await chromium.launch({
  executablePath: process.env.CHROMIUM_PATH || '/usr/bin/chromium',
  args: ['--no-sandbox'],
  ...(remote && process.env.HTTPS_PROXY ? { proxy: { server: process.env.HTTPS_PROXY } } : {}),
});
let page;

async function check(name, run) {
  try {
    await run();
    report.checks.push({ name, passed: true });
    console.log(`PASS ${name}`);
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error);
    report.checks.push({ name, passed: false, message });
    console.error(`FAIL ${name}: ${message}`);
    await page?.screenshot({ path: `${output}/${name.replace(/[^a-z0-9]+/gi, '-').toLowerCase()}-failure.png` }).catch(() => {});
  }
}

async function open(width, blockImage = false) {
  const context = await browser.newContext({
    viewport: { width, height: 850 },
    reducedMotion: 'reduce',
    isMobile: width < 768,
    hasTouch: width < 768,
    ignoreHTTPSErrors: true,
  });
  const requestedImages = [];
  await context.route('**/api/**', route => {
    const request = route.request();
    const pathname = new URL(request.url()).pathname;
    if (request.method() !== 'GET') {
      report.blockedWrites.push({ method: request.method(), pathname });
      return route.abort();
    }
    const body = fixtures.get(pathname);
    return body && !remote ? route.fulfill({ contentType: 'application/json', body }) : route.continue();
  });
  await context.route('**/brand/hero-atlas*.webp', route => {
    requestedImages.push(new URL(route.request().url()).pathname);
    return blockImage ? route.abort() : route.continue();
  });
  page = await context.newPage();
  page.setDefaultTimeout(10000);
  page.on('pageerror', error => report.errors.push({ width, blockImage, message: error.message }));
  await page.addInitScript(() => {
    window.__qofenoShutterSamples = [];
    const started = performance.now();
    let settledFrames = 0;
    const rect = element => {
      const { x, y, width, height } = element.getBoundingClientRect();
      return { x, y: y + scrollY, width, height };
    };
    const physical = element => {
      const style = getComputedStyle(element);
      const matrix = style.transform === 'none' ? new DOMMatrix() : new DOMMatrix(style.transform);
      return {
        clip: style.clipPath,
        scale: Math.hypot(matrix.a, matrix.b),
        blur: Number(style.filter.match(/blur\(([\d.]+)px\)/)?.[1] || 0),
        brightness: Number(style.filter.match(/brightness\(([\d.]+)\)/)?.[1] || 1),
        transform: style.transform,
        filter: style.filter,
        inline: ['clip-path', 'transform', 'filter'].map(property => element.style.getPropertyValue(property)),
      };
    };
    const frame = () => {
      const hero = document.querySelector('.reference-hero');
      const picture = hero?.querySelector('.qofeno-hero-background');
      const image = picture?.querySelector('.qofeno-hero-background-image');
      if (hero && picture && image) {
        const content = [...hero.querySelectorAll('h1, .reference-hero-description, .reference-hero-actions a, .reference-hero-actions button')];
        window.__qofenoShutterSamples.push({
          time: performance.now(),
          phase: hero.dataset.heroShutter,
          fonts: document.fonts.status,
          picture: physical(picture),
          image: physical(image),
          hero: rect(hero),
          content: content.map(element => ({
            text: element.textContent.trim(),
            ...rect(element),
            opacity: getComputedStyle(element).opacity,
            visibility: getComputedStyle(element).visibility,
          })),
          overflow: document.documentElement.scrollWidth > document.documentElement.clientWidth,
        });
        settledFrames = hero.dataset.heroShutter === 'settled' ? settledFrames + 1 : 0;
      }
      if (settledFrames < 12 && performance.now() - started < 25000) requestAnimationFrame(frame);
    };
    requestAnimationFrame(frame);
  });
  await page.goto(origin, { waitUntil: 'domcontentloaded' });
  await expect(page.locator('.reference-hero h1')).toBeVisible();
  await page.evaluate(() => document.fonts.ready);
  return { context, requestedImages };
}

function stableContent(samples) {
  const frames = samples.filter(frame => frame.fonts === 'loaded' && frame.phase === 'playing');
  assert.ok(frames.length >= 4, 'Need several animation frames after the fonts loaded');
  const baseline = frames[0];
  for (const frame of frames) {
    assert.equal(frame.overflow, false);
    assert.equal(frame.content.length, baseline.content.length);
    baseline.content.forEach((item, index) => {
      const current = frame.content[index];
      assert.equal(current.text, item.text);
      assert.equal(current.opacity, '1');
      assert.equal(current.visibility, 'visible');
      for (const axis of ['x', 'y', 'width', 'height']) {
        assert.ok(Math.abs(current[axis] - item[axis]) <= .5, `${item.text}.${axis} moved during the shutter`);
      }
    });
  }
}

try {
  for (const width of [1440, 390, 320]) {
    const { context, requestedImages } = await open(width);
    const hero = page.locator('.reference-hero');
    const picture = hero.locator('picture.qofeno-hero-background');
    const image = picture.locator('img.qofeno-hero-background-image');
    await expect(hero).toHaveAttribute('data-hero-shutter', 'settled', { timeout: 12000 });
    await page.waitForTimeout(250);
    const samples = await page.evaluate(() => window.__qofenoShutterSamples);
    report.samples[width] = { requestedImages, frames: samples };

    await check(`${width}px aperture, scale and light change together`, async () => {
      const playing = samples.filter(frame => frame.phase === 'playing');
      assert.ok(playing.length >= 6, `Only ${playing.length} playing frames were captured`);
      const combined = playing.find(frame =>
        frame.picture.clip.startsWith('inset(') && frame.image.scale > 1.01 && frame.image.scale < 1.175 &&
        frame.image.blur > .2 && frame.image.blur < 11.9 && frame.image.brightness > .6 && frame.image.brightness < .995);
      assert.ok(combined, 'No rendered frame had intermediate clip, scale, blur and brightness together');
      const animated = playing.map(frame => frame.image);
      assert.ok(Math.max(...animated.map(style => style.scale)) - Math.min(...animated.map(style => style.scale)) > .07);
      assert.ok(Math.max(...animated.map(style => style.blur)) - Math.min(...animated.map(style => style.blur)) > 5);
      assert.ok(Math.max(...animated.map(style => style.brightness)) - Math.min(...animated.map(style => style.brightness)) > .15);
      const end = samples.find(frame => frame.phase === 'settled');
      const duration = end.time - playing[0].time;
      assert.ok(duration >= 650 && duration <= 1700, `Unexpected entrance duration ${duration.toFixed(0)}ms`);
    });

    await check(`${width}px copy and actions remain visible and fixed`, async () => stableContent(samples));

    await check(`${width}px final motion styles clear and stay at rest`, async () => {
      const last = samples.at(-1);
      for (const style of [last.picture, last.image]) {
        assert.deepEqual(style.inline, ['', '', '']);
        assert.equal(style.scale, 1);
        assert.equal(style.blur, 0);
        assert.equal(style.brightness, 1);
      }
      const finalFrames = samples.filter(frame => frame.phase === 'settled');
      assert.ok(finalFrames.length >= 4);
      finalFrames.forEach(frame => assert.deepEqual(frame.image, last.image));
      await page.screenshot({ path: `${output}/${width}-settled.png` });
    });

    await check(`${width}px loads only the correct decorative responsive image`, async () => {
      const expected = width < 768 ? '/brand/hero-atlas-compact.webp' : '/brand/hero-atlas.webp';
      assert.deepEqual([...new Set(requestedImages)], [expected]);
      assert.equal(new URL(await image.evaluate(element => element.currentSrc)).pathname, expected);
      assert.equal(await image.evaluate(element => element.complete && element.naturalWidth > 0), true);
      await expect(image).toHaveAttribute('alt', '');
      assert.equal(await picture.evaluate(element => Boolean(element.closest('[aria-hidden="true"]'))), true);
      await expect(picture).toHaveCSS('pointer-events', 'none');
      const dimensions = await picture.evaluate(element => {
        const background = element.getBoundingClientRect();
        const hero = element.closest('.reference-hero').getBoundingClientRect();
        return { background: background.width, hero: hero.width, overflow: document.documentElement.scrollWidth > document.documentElement.clientWidth };
      });
      assert.ok(Math.abs(dimensions.background - dimensions.hero) <= 1, 'Background width does not match its hero');
      assert.equal(dimensions.overflow, false);
    });

    await check(`${width}px Canvas proof and placement link still work`, async () => {
      const canvas = hero.locator('.qofeno-field-guide-canvas');
      await expect(canvas).toBeVisible();
      await expect(hero).toHaveAttribute('data-qofeno-art-phase', 'settled');
      assert.ok(await canvas.evaluate(element => element.width > 0 && element.height > 0));
      await hero.locator('.qofeno-field-guide-link').click();
      await expect(page).toHaveURL(/#qofeno-placement$/);
      await expect(page.locator('#qofeno-placement')).toContainText('Active · Owner placement');
    });
    await context.close();
  }

  await check('Blocked background image preserves readable hero and working proof', async () => {
    const { context, requestedImages } = await open(390, true);
    const hero = page.locator('.reference-hero');
    await expect(hero.locator('h1')).toHaveText('Make room for your website.');
    await expect(hero.locator('.reference-hero-description')).toBeVisible();
    await expect(hero.locator('.reference-hero-actions .button')).toBeVisible();
    await expect(hero).toHaveAttribute('data-qofeno-art-phase', 'settled');
    assert.ok(requestedImages.length > 0, 'No background request was intercepted');
    const fallback = await hero.evaluate(element => ({
      color: getComputedStyle(element).backgroundColor,
      copyOpacity: getComputedStyle(element.querySelector('h1')).opacity,
      overflow: document.documentElement.scrollWidth > document.documentElement.clientWidth,
    }));
    assert.notEqual(fallback.color, 'rgba(0, 0, 0, 0)');
    assert.equal(fallback.copyOpacity, '1');
    assert.equal(fallback.overflow, false);
    await page.screenshot({ path: `${output}/390-image-fallback.png` });
    await hero.locator('.qofeno-field-guide-link').click();
    await expect(page).toHaveURL(/#qofeno-placement$/);
    await context.close();
  });
  await check('No client runtime errors', async () => assert.deepEqual(report.errors, []));
} catch (error) {
  report.checks.push({ name: 'Page setup', passed: false, message: error.message });
  console.error(error);
} finally {
  await browser.close();
  report.passed = report.checks.length > 0 && report.checks.every(check => check.passed);
  await writeFile(`${output}/report.json`, JSON.stringify(report, null, 2) + '\n');
}
console.log(`${report.checks.filter(check => check.passed).length}/${report.checks.length} shutter checks passed. Report: ${output}/report.json`);
if (!report.passed) process.exitCode = 1;
