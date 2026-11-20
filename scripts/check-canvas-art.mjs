import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import { chromium, expect } from '@playwright/test';
import AxeBuilder from '@axe-core/playwright';

const origin = process.env.QOFENO_CHECK_URL || 'http://localhost:8787';
const isRemote = new URL(origin).protocol === 'https:';
const browser = await chromium.launch({
  executablePath: process.env.CHROMIUM_PATH || '/usr/bin/chromium',
  args: ['--no-sandbox'],
  ...(isRemote && process.env.HTTPS_PROXY ? { proxy: { server: process.env.HTTPS_PROXY } } : {}),
});
const fixtures = new Map();
for (const name of ['board', 'session', 'status', 'visitors']) {
  fixtures.set(`/api/${name}`, await readFile(`tests/fixtures/${name}.json`, 'utf8'));
}

async function createPage(width) {
  const context = await browser.newContext({
    viewport: { width, height: 850 },
    deviceScaleFactor: 2,
    ignoreHTTPSErrors: true,
    reducedMotion: 'reduce',
  });
  await context.route('**/api/**', route => {
    if (route.request().method() !== 'GET') return route.abort();
    const body = fixtures.get(new URL(route.request().url()).pathname);
    return body && !isRemote ? route.fulfill({ contentType: 'application/json', body }) : route.continue();
  });
  const page = await context.newPage();
  page.setDefaultTimeout(10000);
  return page;
}

async function checkScene(page, selector, kind) {
  const canvas = page.locator(`${selector} > canvas[data-qofeno-scene="${kind}"]`).first();
  const fallback = page.locator(`${selector} > svg`).first();
  await fallback.scrollIntoViewIfNeeded();
  await expect(canvas).toBeVisible();
  await expect(fallback).toHaveCSS('visibility', 'hidden');
  const result = await canvas.evaluate(node => {
    const pixels = node.getContext('2d').getImageData(0, 0, node.width, node.height).data;
    let visible = 0;
    for (let index = 3; index < pixels.length; index += 64) {
      if (pixels[index] > 0) visible++;
    }
    return { visible, scale: node.width / node.clientWidth, hidden: node.getAttribute('aria-hidden') };
  });
  assert.ok(result.visible > 30, `${kind} canvas should contain painted pixels`);
  assert.equal(result.scale, 2, `${kind} canvas should render at the configured pixel density`);
  assert.equal(result.hidden, 'true');
}

async function checkDrawing(page) {
  const hero = page.locator('.reference-hero');
  const canvas = hero.locator('.qofeno-field-guide-canvas');
  const bitmap = () => canvas.evaluate(node => node.toDataURL());
  await expect(hero).toHaveAttribute('data-qofeno-art-phase', 'drawing');
  const first = await bitmap();
  await expect.poll(bitmap).not.toEqual(first);
  if (await hero.getAttribute('data-qofeno-art-phase') === 'drawing') {
    await page.evaluate(() => scrollTo({ top: window.innerHeight * 2, behavior: 'instant' }));
    await expect(hero).toHaveAttribute('data-qofeno-art-phase', 'paused');
    const paused = await bitmap();
    await page.waitForTimeout(180);
    assert.equal(await bitmap(), paused, 'An offscreen illustration should stop drawing');
    await page.evaluate(() => scrollTo({ top: 0, behavior: 'instant' }));
  }
  await expect(hero).toHaveAttribute('data-qofeno-art-phase', 'settled');
  assert.notEqual(await bitmap(), first, 'Completed art should contain different pixels');
}

try {
  for (const width of [1440, 390, 320]) {
    const page = await createPage(width);
    const errors = [];
    page.on('pageerror', error => errors.push(error.message));
    await page.goto(origin, { waitUntil: 'domcontentloaded' });
    await expect(page.locator('.reference-hero[data-qofeno-drawn]')).toBeVisible();
    if (width === 1440) await checkDrawing(page);
    await expect(page.locator('.discovery-monogram[data-qofeno-drawn]')).toHaveCount(6);
    if (width === 1440) {
      await page.locator('.qofeno-header-trigger').click();
      await checkScene(page, '.qofeno-navigation-board-art > .interface-illustration', 'ranking');
      await page.keyboard.press('Escape');
      await page.locator('.product-tour-chapter').first().click();
      await checkScene(page, '.tour-radio-art', 'radio');
    }
    await checkScene(page, '.visitor-activity-art', 'visitors');
    for (const kind of ['submit', 'review', 'ranking', 'expiry']) {
      await checkScene(page, `.placement-process-card [data-interface-illustration="${kind}"]`, kind);
    }
    await checkScene(page, '.questions-interface-art', 'message');
    await checkScene(page, '.footer-interface-art', 'discover');
    assert.equal(await page.evaluate(() => document.documentElement.scrollWidth), width);

    await page.goto(origin + '/my-spot');
    await checkScene(page, '.account-interface-heading > .interface-illustration', 'recovery');
    if (width === 1440) {
      await page.locator('.qofeno-header-buy').click();
    } else {
      await page.locator('.qofeno-header-trigger').click();
      await page.locator('.qofeno-mobile-purchase button').click();
    }
    await checkScene(page, '.checkout-interface-art', 'ticket');
    const audit = await new AxeBuilder({ page }).include('dialog[open]')
      .withTags(['wcag2a', 'wcag2aa', 'wcag21aa']).analyze();
    assert.deepEqual(audit.violations.map(issue => issue.id), []);
    await page.keyboard.press('Escape');
    await expect(page.locator('dialog[open]')).toHaveCount(0);
    if (width === 1440) {
      await page.goto(origin + '/contact');
      await checkScene(page, '.legal-interface-art > .interface-illustration', 'message');
      await page.goto(origin + '/owner');
      await checkScene(page, '.owner-review-graphic > .interface-illustration', 'recovery');
    }
    assert.deepEqual(errors, []);
    await page.context().close();
    console.log(`PASS ${width}px: painted scene pixels, placement steps, FAQ, footer, My Spot and checkout`);
  }

  const page = await createPage(390);
  await page.addInitScript(() => { HTMLCanvasElement.prototype.getContext = () => null; });
  await page.goto(origin);
  await expect(page.locator('.qofeno-field-guide-link')).toBeVisible();
  await expect(page.locator('.placement-process-submit [data-interface-illustration] > svg')).toHaveCSS('visibility', 'visible');
  await expect(page.locator('.reference-hero[data-qofeno-drawn]')).toHaveCount(0);
  console.log('PASS Canvas unavailable: static artwork and the gallery link are visible');
} finally {
  await browser.close();
}
