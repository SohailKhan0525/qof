import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import { chromium, expect } from '@playwright/test';

const origin = new URL(process.env.QOFENO_CHECK_URL || 'http://localhost:8787').origin;
const isRemote = origin.startsWith('https:');
const bundlePattern = '**/assets/qofeno-placement-3d-*.js';
const fixtures = new Map(await Promise.all(['board', 'session', 'status', 'visitors'].map(async name => [
  `/api/${name}`, await readFile(new URL(`../tests/fixtures/${name}.json`, import.meta.url), 'utf8'),
])));
const browser = await chromium.launch({
  executablePath: process.env.CHROMIUM_PATH || '/usr/bin/chromium',
  args: ['--no-sandbox', '--use-angle=swiftshader', '--enable-unsafe-swiftshader'],
  ...(isRemote && process.env.HTTPS_PROXY ? { proxy: { server: process.env.HTTPS_PROXY } } : {}),
});

async function createPage(width, motion = 'reduce') {
  const context = await browser.newContext({
    viewport: { width, height: 850 },
    deviceScaleFactor: width < 768 ? 3 : 1,
    reducedMotion: motion,
    ignoreHTTPSErrors: true,
    isMobile: width < 768,
    hasTouch: width < 768,
  });
  await context.route('**/api/**', route => {
    if (route.request().method() !== 'GET') return route.abort();
    const body = fixtures.get(new URL(route.request().url()).pathname);
    return body && !isRemote ? route.fulfill({ contentType: 'application/json', body }) : route.continue();
  });
  const page = await context.newPage();
  const errors = [];
  const requests = [];
  page.setDefaultTimeout(10000);
  page.on('pageerror', error => errors.push(error.message));
  page.on('request', request => {
    if (/\/assets\/qofeno-placement-3d-[\da-f]+\.js$/.test(new URL(request.url()).pathname)) requests.push(request.url());
  });
  return { page, errors, requests, card: page.locator('#qofeno-placement'), art: page.locator('.house-placement-art') };
}

async function visit(page) {
  await page.goto(origin, { waitUntil: 'domcontentloaded' });
  await expect(page.locator('.reference-hero[data-qofeno-drawn]')).toBeVisible();
  await page.evaluate(() => document.fonts.ready);
}

function measure(card) {
  return card.evaluate(element => {
    const bounds = node => {
      const { x, y, width, height } = node.getBoundingClientRect();
      return { x, y: y + window.scrollY, width, height };
    };
    const art = bounds(element.querySelector('.house-placement-art'));
    const copy = bounds(element.querySelector('.house-placement-copy'));
    const overlaps = art.x < copy.x + copy.width && art.x + art.width > copy.x &&
      art.y < copy.y + copy.height && art.y + art.height > copy.y;
    return { card: bounds(element), art, copy, overlaps, scrollWidth: document.documentElement.scrollWidth };
  });
}

try {
  for (const width of [1440, 390, 320]) {
    const desktop = width === 1440;
    const { page, errors, requests, card, art } = await createPage(width, 'reduce');
    if (desktop) {
      await page.addInitScript(() => {
        window.drawCalls = 0;
        for (const name of ['drawArrays', 'drawElements']) {
          const draw = WebGL2RenderingContext.prototype[name];
          WebGL2RenderingContext.prototype[name] = function (...args) {
            window.drawCalls++;
            return draw.apply(this, args);
          };
        }
      });
    }
    let releaseBundle;
    const holdBundle = new Promise(resolve => { releaseBundle = resolve; });
    await page.route(bundlePattern, async route => {
      await holdBundle;
      return route.continue();
    });
    await visit(page);
    if (!desktop) assert.equal(requests.length, 0, '3D should stay deferred at the top on mobile');
    await art.scrollIntoViewIfNeeded();
    const fallback = art.locator('img');
    await expect(fallback).toBeVisible();
    await expect(card.getByRole('link', { name: 'Visit website', exact: true })).toHaveAttribute('href', 'https://loopproof.me/');
    const before = await measure(card);
    releaseBundle();

    const canvas = art.locator('canvas.qofeno-placement-scene');
    await expect(canvas).toBeVisible();
    await expect(canvas).toHaveAttribute('aria-hidden', 'true');
    await expect(canvas).toHaveCSS('pointer-events', 'none');
    await expect(fallback).toBeHidden();
    await expect.poll(() => measure(card)).toEqual(before);
    assert.equal(before.scrollWidth, width);
    assert.equal(before.overlaps, false);
    assert.equal(requests.length, 1);
    assert.equal(new URL(requests[0]).origin, origin);
    const pixels = await canvas.evaluate(node => node.width * node.height);
    assert.ok(pixels > 0 && pixels <= 500_000);

    if (desktop) {
      const count = () => page.evaluate(() => window.drawCalls);
      await expect.poll(count).toBeGreaterThan(0);
      await expect.poll(async () => {
        const draws = await count();
        await page.waitForTimeout(250);
        return await count() === draws;
      }, { timeout: 10000 }).toBe(true);
      const initialDraws = await count();
      const original = await canvas.screenshot();
      const bounds = await art.boundingBox();
      await page.mouse.move(bounds.x + bounds.width * .8, bounds.y + bounds.height * .4);
      await expect.poll(count).toBeGreaterThan(initialDraws);
      assert.ok(!(await canvas.screenshot()).equals(original), 'The sculpture should visibly tilt with OS reduce enabled');
      // Preference changes must not change the pointer behavior or its idle stop.
      await page.emulateMedia({ reducedMotion: 'no-preference' });
      await page.emulateMedia({ reducedMotion: 'reduce' });
      const beforeReverse = await count();
      await page.mouse.move(bounds.x + bounds.width * .2, bounds.y + bounds.height * .6);
      await expect.poll(count).toBeGreaterThan(beforeReverse);
      await expect.poll(async () => {
        const draws = await count();
        await page.waitForTimeout(250);
        return await count() === draws;
      }, { timeout: 10000 }).toBe(true);
      const contextLossSupported = await canvas.evaluate(node => {
        const extension = node.getContext('webgl2').getExtension('WEBGL_lose_context');
        if (extension) {
          window.restorePlacementContext = () => extension.restoreContext();
          extension.loseContext();
        }
        return Boolean(extension);
      });
      if (contextLossSupported) {
        await expect(fallback).toBeVisible();
        await page.evaluate(() => window.restorePlacementContext());
        await expect(canvas).toBeVisible();
      }
    }
    assert.deepEqual(errors, []);
    await page.context().close();
    console.log(`PASS ${width}px with OS reduce: lazy artwork renders without overflow, overlap or a card layout shift${desktop ? '; pointer tilt changes pixels and stops when idle' : ''}`);
  }

  for (const mode of ['no WebGL', 'data saver']) {
    const { page, art, requests, errors } = await createPage(390);
    await page.addInitScript(mode => {
      if (mode === 'data saver') {
        Object.defineProperty(navigator.connection, 'saveData', { get: () => true });
      } else {
        const getContext = HTMLCanvasElement.prototype.getContext;
        HTMLCanvasElement.prototype.getContext = function (type, ...args) {
          return type === 'webgl2' ? null : getContext.call(this, type, ...args);
        };
      }
    }, mode);
    await visit(page);
    const attemptedLoad = mode === 'no WebGL' ? page.waitForResponse(bundlePattern) : null;
    await art.scrollIntoViewIfNeeded();
    if (attemptedLoad) assert.equal((await attemptedLoad).status(), 200);
    await expect(art.locator('img')).toBeVisible();
    await expect(art.locator('canvas')).toHaveCount(0);
    if (mode === 'data saver') assert.equal(requests.length, 0);
    assert.deepEqual(errors, []);
    await page.context().close();
    console.log(`PASS ${mode}: original logo stays visible as the static fallback`);
  }
} finally {
  await browser.close();
}
