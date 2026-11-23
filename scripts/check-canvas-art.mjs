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

async function createPage(width, options = {}) {
  const context = await browser.newContext({
    viewport: { width, height: 850 },
    deviceScaleFactor: 2,
    ignoreHTTPSErrors: true,
    reducedMotion: 'reduce',
    ...options,
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

const impressionSelector = '.qofeno-field-guide-impression';

async function settledProof(page) {
  await expect(page.locator('.reference-hero')).toHaveAttribute('data-qofeno-art-phase', 'settled');
  const proof = page.locator('.qofeno-field-guide-frame');
  await proof.scrollIntoViewIfNeeded();
  return proof;
}

function changedInkPixels(frame) {
  return frame.evaluate(element => {
    const proof = element.querySelector('.qofeno-field-guide-canvas');
    const impression = element.querySelector('.qofeno-field-guide-impression');
    const { width, height } = proof;
    const base = proof.getContext('2d').getImageData(0, 0, width, height).data;
    const overlay = impression.getContext('2d').getImageData(0, 0, width, height).data;
    let changed = 0;
    for (let y = 0; y < height; y += 8) {
      for (let x = 0; x < width; x += 8) {
        const i = (y * width + x) * 4;
        const difference = Math.abs(overlay[i] - base[i]) + Math.abs(overlay[i + 1] - base[i + 1]) +
          Math.abs(overlay[i + 2] - base[i + 2]);
        if (difference * overlay[i + 3] / 255 > 30) changed++;
      }
    }
    return changed;
  });
}

async function checkPointerImpression(page) {
  const frame = await settledProof(page);
  const impression = frame.locator(impressionSelector);
  const active = page.locator('.qofeno-field-guide-frame[data-qofeno-impression]');
  const canvas = frame.locator('.qofeno-field-guide-canvas');
  const original = await frame.screenshot();
  const bounds = await frame.boundingBox();
  const y = bounds.y + bounds.height * .52;
  const left = bounds.x + bounds.width * .34;
  const right = bounds.x + bounds.width * .68;
  await expect(impression).toHaveCount(0);
  await page.mouse.move(left, y);
  await expect(active).toHaveCount(1);
  await expect(impression).toHaveAttribute('aria-hidden', 'true');
  await expect(impression).toHaveCSS('pointer-events', 'none');
  const dimensions = node => [node.width, node.height, node.clientWidth, node.clientHeight];
  assert.deepEqual(await impression.evaluate(dimensions), await canvas.evaluate(dimensions));
  assert.ok(await changedInkPixels(frame) > 60, 'The print layer should change the look of the artwork');
  await expect(impression).toHaveCSS('opacity', '1');
  await expect(impression).toHaveCSS('mask-image', /radial-gradient/);
  const leftState = await frame.screenshot();
  assert.ok(!leftState.equals(original), 'The artwork should visibly change under the pointer');
  const maskImage = () => impression.evaluate(node => getComputedStyle(node).maskImage);
  const leftMask = await maskImage();
  await page.mouse.move(right, y);
  await expect.poll(maskImage).not.toBe(leftMask);
  assert.ok(!(await frame.screenshot()).equals(leftState), 'Moving the pointer should reveal a different part of the artwork');

  await page.mouse.move(1, 1);
  await expect(active).toHaveCount(0);
  await expect.poll(() => frame.evaluate(element => {
    const layer = element.querySelector('.qofeno-field-guide-impression');
    if (!layer) return true;
    const { visibility, opacity, display } = getComputedStyle(layer);
    return visibility === 'hidden' || Number(opacity) === 0 || display === 'none';
  })).toBe(true);
  assert.ok((await frame.screenshot()).equals(original), 'The effect should restore the original proof on leave');

  await page.mouse.move(right, y);
  await expect(active).toHaveCount(1);
  await page.mouse.click(right, y);
  await expect(page).toHaveURL(/#qofeno-placement$/);
}

try {
  for (const reducedMotion of ['no-preference', 'reduce']) {
    const desktop = await createPage(1440, { reducedMotion });
    await desktop.goto(origin, { waitUntil: 'domcontentloaded' });
    await checkPointerImpression(desktop);
    await desktop.context().close();
    console.log(`PASS desktop impression with OS ${reducedMotion}: localized ink moves with the pointer, clears on leave and preserves the placement link`);
  }

  const touch = await createPage(390, { reducedMotion: 'no-preference', isMobile: true, hasTouch: true });
  await touch.goto(origin, { waitUntil: 'domcontentloaded' });
  const touchFrame = await settledProof(touch);
  const touchBounds = await touchFrame.boundingBox();
  await touch.touchscreen.tap(touchBounds.x + touchBounds.width / 2, touchBounds.y + touchBounds.height / 2);
  await expect(touch).toHaveURL(/#qofeno-placement$/);
  await expect(touchFrame.locator(impressionSelector)).toHaveCount(0);
  await touch.context().close();
  console.log('PASS touch: the placement link works without mounting the impression');

  for (const width of [1440, 390, 320]) {
    const page = await createPage(width, { isMobile: width < 768, hasTouch: width < 768 });
    const errors = [];
    page.on('pageerror', error => errors.push(error.message));
    await page.goto(origin, { waitUntil: 'domcontentloaded' });
    await expect(page.locator('.reference-hero[data-qofeno-drawn]')).toBeVisible();
    await expect(page.getByRole('heading', { level: 1 })).toHaveText('Make room for your website.');
    if (width === 1440) await checkDrawing(page);
    const preview = page.locator('.qofeno-field-guide-frame');
    await preview.scrollIntoViewIfNeeded();
    await expect(page.locator('.reference-hero')).toHaveAttribute('data-qofeno-art-phase', 'settled');
    const frame = await preview.boundingBox();
    if (width === 1440) {
      await page.mouse.move(frame.x + frame.width / 2, frame.y + frame.height / 2);
      await page.evaluate(() => new Promise(resolve => requestAnimationFrame(() => requestAnimationFrame(resolve))));
      await expect(preview.locator(impressionSelector)).toHaveCount(1);
      await expect(preview.locator(impressionSelector)).toHaveCSS('opacity', '1');
    }
    await page.mouse.click(frame.x + frame.width / 2, frame.y + frame.height / 2);
    await expect(page).toHaveURL(/#qofeno-placement$/);
    await expect(preview.locator(impressionSelector)).toHaveCount(width === 1440 ? 1 : 0);
    await expect(page.locator('#qofeno-placement')).toContainText('Active · Owner placement');
    if (width === 1440) {
      await page.locator('.qofeno-header-trigger').click();
      await checkScene(page, '.qofeno-navigation-board-art > .interface-illustration', 'ranking');
      await page.keyboard.press('Escape');
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
    console.log(`PASS ${width}px with OS reduce: painted scene pixels, placement steps, FAQ, footer, My Spot and checkout`);
  }

  const page = await createPage(390);
  await page.addInitScript(() => { HTMLCanvasElement.prototype.getContext = () => null; });
  await page.goto(origin);
  await expect(page.locator('.qofeno-field-guide-link')).toBeVisible();
  await expect(page.locator('.placement-process-submit [data-interface-illustration] > svg')).toHaveCSS('visibility', 'visible');
  await expect(page.locator('.reference-hero[data-qofeno-drawn]')).toHaveCount(0);
  console.log('PASS Canvas unavailable: static artwork and the owner placement link are visible');
} finally {
  await browser.close();
}
