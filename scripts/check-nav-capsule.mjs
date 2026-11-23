import assert from 'node:assert/strict';
import { mkdir, readFile, writeFile } from 'node:fs/promises';
import { chromium, expect } from '@playwright/test';

// Exercise the integrated navbar on the real page; API writes are always blocked.
const origin = new URL(process.env.QOFENO_CHECK_URL || 'http://localhost:8792').origin;
const remote = new URL(origin).protocol === 'https:';
const output = 'test-results/nav-capsule';
const fixtures = new Map(await Promise.all(['board', 'session', 'status', 'visitors'].map(async name => [
  `/api/${name}`, await readFile(new URL(`../tests/fixtures/${name}.json`, import.meta.url), 'utf8'),
])));
const report = { origin, checkedAt: new Date().toISOString(), checks: [], samples: {}, errors: [], blockedWrites: [] };
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

function sample() {
  const header = document.querySelector('.qofeno-header');
  const shell = header.querySelector('.qofeno-header-shell');
  const style = getComputedStyle(shell);
  const rect = element => {
    const { x, y, width, height } = element.getBoundingClientRect();
    return { x, y, width, height };
  };
  const controls = [...header.querySelectorAll('.qofeno-header-inner > a, .qofeno-header-navigation > a, .qofeno-header-trigger, .qofeno-header-actions > a, .qofeno-header-actions > button')]
    .filter(element => element.getClientRects().length > 0)
    .map(element => ({ label: element.getAttribute('aria-label') || element.textContent.trim(), ...rect(element) }));
  const board = document.getElementById('board');
  return {
    time: performance.now(),
    scroll: window.scrollY,
    amount: Number.parseFloat(style.getPropertyValue('--q-nav-morph')) || 0,
    radius: Number.parseFloat(style.borderTopLeftRadius),
    transform: style.transform,
    shell: rect(shell),
    header: rect(header),
    inner: rect(header.querySelector('.qofeno-header-inner')),
    controls,
    boardTop: board ? board.getBoundingClientRect().top + window.scrollY : null,
    overflow: document.documentElement.scrollWidth > innerWidth,
  };
}

async function snapshot() {
  return page.evaluate(sample);
}

// Ordinary scroll events exercise the mounted hook on native touch layouts and
// Lenis-enabled desktop layouts. Sampling every rendered frame catches a real
// response instead of assuming a state attribute proves animation occurred.
async function drive(pixelsPerFrame, frames = 26) {
  return page.evaluate(async ({ pixelsPerFrame, frames }) => {
    const values = [];
    for (let index = 0; index < frames; index++) {
      window.scrollBy({ top: pixelsPerFrame, behavior: 'instant' });
      await new Promise(requestAnimationFrame);
      values.push(window.__qofenoNavTestSample());
    }
    return values;
  }, { pixelsPerFrame, frames });
}

async function atRest() {
  await expect.poll(async () => (await snapshot()).amount, { timeout: 2500 }).toBe(0);
  const state = await snapshot();
  assert.equal(state.radius, 10);
  return state;
}

function unchanged(before, after) {
  for (const part of ['header', 'inner']) {
    for (const axis of ['x', 'y', 'width', 'height']) {
      assert.ok(Math.abs(before[part][axis] - after[part][axis]) <= .25, `${part}.${axis} moved`);
    }
  }
  assert.equal(before.controls.length, after.controls.length, 'Visible navigation controls changed');
  before.controls.forEach((control, index) => {
    const next = after.controls[index];
    assert.equal(next.label, control.label);
    for (const axis of ['x', 'y', 'width', 'height']) {
      assert.ok(Math.abs(control[axis] - next[axis]) <= .25, `${control.label}.${axis} moved`);
    }
    assert.ok(next.height >= 44, `${next.label} lost its 44px target`);
  });
  assert.ok(Math.abs(before.boardTop - after.boardTop) <= .5, 'The board anchor moved in document space');
  assert.equal(after.overflow, false);
}

try {
  for (const width of [1440, 390, 320]) {
    const mobile = width < 768;
    const context = await browser.newContext({
      viewport: { width, height: 850 },
      reducedMotion: 'no-preference',
      isMobile: mobile,
      hasTouch: mobile,
      ignoreHTTPSErrors: true,
    });
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
    page = await context.newPage();
    await page.addInitScript(`window.__qofenoNavTestSample = ${sample.toString()};`);
    page.setDefaultTimeout(10000);
    page.on('pageerror', error => report.errors.push({ width, message: error.message }));
    await page.goto(origin, { waitUntil: 'domcontentloaded' });
    await expect(page.locator('.qofeno-header-trigger')).toBeVisible();
    await page.evaluate(() => document.fonts.ready);
    await page.waitForTimeout(900);
    await page.mouse.move(width - 3, 500);
    await page.evaluate(() => window.scrollTo({ top: 350, behavior: 'instant' }));
    await page.waitForTimeout(500);
    const baseline = await atRest();
    let slow = [];
    let fast = [];

    await check(`${width}px slow and fast scroll produce different capsule shapes`, async () => {
      slow = await drive(1);
      await atRest();
      fast = await drive(42);
      const slowPeak = Math.max(...slow.map(state => state.amount));
      const fastPeak = Math.max(...fast.map(state => state.amount));
      assert.ok(fastPeak > .5, `Fast scroll peak was ${fastPeak}`);
      assert.ok(fastPeak > slowPeak + .35, `Slow ${slowPeak}, fast ${fastPeak}`);
      assert.ok(Math.max(...fast.map(state => state.radius)) > 20, 'The visible shell did not round');
      assert.ok(fast.some(state => state.shell.width < baseline.shell.width - 1), 'The shell did not visibly squeeze');
      report.samples[width] = { baseline, slowPeak, fastPeak, slow, fast };
      await page.screenshot({ path: `${output}/${width}-capsule.png` });
    });

    await check(`${width}px navbar controls and document anchor stay fixed`, async () => {
      [...slow, ...fast].forEach(state => unchanged(baseline, state));
    });

    await check(`${width}px capsule returns to rest and stays still`, async () => {
      const resting = await atRest();
      await page.waitForTimeout(220);
      const later = await snapshot();
      assert.equal(later.amount, 0);
      assert.equal(later.transform, resting.transform);
      assert.deepEqual(later.shell, resting.shell);
      unchanged(baseline, later);
    });

    await check(`${width}px reverse scrolling also rounds the shell`, async () => {
      const reversed = await drive(-35, 20);
      assert.ok(Math.max(...reversed.map(state => state.amount)) > .4);
      reversed.forEach(state => unchanged(baseline, state));
      await atRest();
    });

    await check(`${width}px menu keeps its original geometry and focus behavior`, async () => {
      await drive(30, 15);
      const trigger = page.locator('.qofeno-header-trigger');
      await trigger.click();
      await expect(trigger).toHaveAttribute('aria-expanded', 'true');
      await expect.poll(async () => (await snapshot()).radius).toBe(10);
      await expect.poll(async () => (await snapshot()).amount).toBe(0);
      await page.waitForTimeout(700);
      const panel = await page.locator('#qofeno-navigation-panel').boundingBox();
      assert.ok(panel && panel.width > 0);
      assert.ok(panel.x >= -.5 && panel.x + panel.width <= width + .5, 'Menu extends outside viewport');
      if (mobile) {
        assert.ok(Math.abs(panel.x) < .5 && Math.abs(panel.y) < .5);
        assert.ok(Math.abs(panel.width - width) < .5 && Math.abs(panel.height - 850) < .5, 'Mobile menu is no longer fullscreen');
        await expect(page.locator('html')).toHaveAttribute('data-mobile-navigation', 'open');
      }
      await page.keyboard.press('Escape');
      await expect(trigger).toHaveAttribute('aria-expanded', 'false');
      await expect(trigger).toBeFocused();
      await page.waitForTimeout(700);
      await atRest();
    });

    await check(`${width}px keyboard focus keeps a stable shell`, async () => {
      const trigger = page.locator('.qofeno-header-trigger');
      await page.keyboard.press('Tab');
      await trigger.focus();
      assert.equal(await trigger.evaluate(element => element.matches(':focus-visible')), true);
      const focused = await drive(32, 16);
      focused.forEach(state => assert.equal(state.radius, 10));
      focused.forEach(state => assert.equal(state.transform, 'none'));
      await trigger.evaluate(element => element.blur());
      await atRest();
    });

    await check(`${width}px reduced-motion changes reset and disable the capsule`, async () => {
      await drive(-34, 14);
      await page.emulateMedia({ reducedMotion: 'reduce' });
      await atRest();
      const reduced = await drive(30, 16);
      reduced.forEach(state => {
        assert.equal(state.amount, 0);
        assert.equal(state.radius, 10);
        assert.equal(state.transform, 'none');
      });
      await page.emulateMedia({ reducedMotion: 'no-preference' });
      await atRest();
      const resumed = await drive(-34, 18);
      assert.ok(Math.max(...resumed.map(state => state.amount)) > .4, 'Motion did not resume after preference changed');
      await atRest();
    });

    if (!mobile) {
      await check('1440px actual wheel input drives and settles the capsule', async () => {
        await page.mouse.move(1000, 500);
        await page.mouse.wheel(0, 900);
        await expect.poll(async () => (await snapshot()).radius, { intervals: [20, 30, 50], timeout: 2000 }).toBeGreaterThan(15);
        await atRest();
      });
    }
    await context.close();
  }
  await check('No client runtime errors', async () => assert.deepEqual(report.errors, []));
} finally {
  await browser.close();
  report.passed = report.checks.length > 0 && report.checks.every(check => check.passed);
  await writeFile(`${output}/report.json`, JSON.stringify(report, null, 2) + '\n');
}
console.log(`${report.checks.filter(check => check.passed).length}/${report.checks.length} navbar checks passed. Report: ${output}/report.json`);
if (!report.passed) process.exitCode = 1;
