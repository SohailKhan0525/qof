import assert from 'node:assert/strict';
import { mkdir, readFile, writeFile } from 'node:fs/promises';
import { chromium, expect } from '@playwright/test';

const origin = new URL(process.env.QOFENO_CHECK_URL || 'http://localhost:8793').origin;
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
  const ring = header.querySelector('.qofeno-nav-progress-fill');
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
    maximum: document.scrollingElement.scrollHeight - innerHeight,
    viewport: document.documentElement.clientWidth,
    shape: header.dataset.navShape,
    radius: Number.parseFloat(getComputedStyle(shell).borderTopLeftRadius),
    ringOffset: ring ? Number.parseFloat(getComputedStyle(ring).strokeDashoffset) : null,
    shell: rect(shell),
    header: rect(header),
    inner: rect(header.querySelector('.qofeno-header-inner')),
    controls,
    boardTop: board.getBoundingClientRect().top + window.scrollY,
    overflow: document.documentElement.scrollWidth > document.documentElement.clientWidth,
  };
}

const snapshot = () => page.evaluate(sample);

function drive(pixelsPerFrame, frames, count = frames) {
  return page.evaluate(async ({ pixelsPerFrame, frames, count }) => {
    const states = [];
    for (let frame = 0; frame < frames; frame++) {
      if (frame < count) window.scrollBy({ top: pixelsPerFrame, behavior: 'instant' });
      await new Promise(requestAnimationFrame);
      states.push(window.__qofenoNavTestSample());
    }
    return states;
  }, { pixelsPerFrame, frames, count });
}

function closeTo(actual, expected, tolerance, label) {
  assert.ok(Math.abs(actual - expected) <= tolerance, `${label}: ${actual} differs from ${expected}`);
}

function fitsWide(state) {
  return state.shape === 'wide' && Math.abs(state.shell.x) <= .5 &&
    Math.abs(state.shell.width - state.viewport) <= .5 && state.radius <= .5;
}

function fitsFloating(state) {
  return state.shape === 'floating' && Math.abs(state.shell.x - state.inner.x) <= .5 &&
    Math.abs(state.shell.width - state.inner.width) <= .5 && state.radius >= state.inner.height / 2 - .5;
}

async function settle(fits) {
  await expect.poll(async () => fits(await snapshot()), { timeout: 3000 }).toBe(true);
  return snapshot();
}

function unchanged(before, after) {
  for (const part of ['header', 'inner']) {
    for (const axis of ['x', 'width', 'height']) closeTo(after[part][axis], before[part][axis], .5, `${part}.${axis}`);
  }
  // The test-site banner scrolls away before the header reaches its sticky edge.
  const stickyY = Math.max(0, before.header.y + before.scroll - after.scroll);
  closeTo(after.header.y, stickyY, .5, 'Header sticky position');
  closeTo(after.inner.y - after.header.y, before.inner.y - before.header.y, .5, 'Inner row y relative to header');
  assert.equal(before.controls.length, after.controls.length, 'Visible navigation controls changed');
  before.controls.forEach((control, index) => {
    const next = after.controls[index];
    for (const axis of ['x', 'width', 'height']) closeTo(next[axis], control[axis], .5, `${control.label}.${axis}`);
    closeTo(next.y - after.header.y, control.y - before.header.y, .5, `${control.label} y relative to header`);
    assert.ok(next.height >= 44, `${next.label} lost its 44px target`);
  });
  closeTo(after.boardTop, before.boardTop, .5, 'Board position');
  assert.equal(after.overflow, false);
}

async function jump(top) {
  await page.evaluate(top => window.scrollTo({ top, behavior: 'instant' }), top);
}

async function waitForScrollIdle() {
  // Let the real wheel's smooth scroll finish before using native test jumps.
  await page.evaluate(async () => {
    let lastPosition = window.scrollY;
    let lastMovement = performance.now();
    const deadline = lastMovement + 4000;
    while (performance.now() - lastMovement < 150) {
      await new Promise(requestAnimationFrame);
      const now = performance.now();
      if (now > deadline) throw new Error('Wheel scrolling did not settle');
      if (window.scrollY !== lastPosition) {
        lastPosition = window.scrollY;
        lastMovement = now;
      }
    }
  });
}

try {
  for (const [width, reducedMotion] of [[1440, 'no-preference'], [390, 'no-preference'], [320, 'reduce']]) {
    const mobile = width < 768;
    const context = await browser.newContext({
      viewport: { width, height: 850 },
      reducedMotion,
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
    await expect(page.locator('.qofeno-nav-progress-fill')).toHaveCount(1);
    await page.evaluate(() => document.fonts.ready);
    await page.waitForTimeout(700);
    const baseline = await settle(fitsWide);
    const samples = report.samples[width] = { reducedMotion, baseline };

    await check(`${width}px top and low velocity keep a full-width shell`, async () => {
      assert.equal(baseline.scroll, 0);
      closeTo(baseline.ringOffset, 100, .5, 'Ring offset at top');
      await jump(28);
      await page.waitForTimeout(210);
      assert.ok(fitsWide(await snapshot()), 'Fast motion below 48px detached the shell');
      const slow = await drive(1, 42);
      assert.ok(slow.at(-1).scroll > 48, 'Slow test did not cross 48px');
      slow.forEach(state => {
        assert.ok(fitsWide(state), `Slow motion detached at ${state.scroll}px`);
        unchanged(baseline, state);
      });
    });

    await check(`${width}px fast down animates to a floating pill and stays floating (${reducedMotion})`, async () => {
      const fast = await drive(28, 13);
      assert.ok(fast.some(state => state.shape === 'floating'), 'Fast scroll did not select the floating shape');
      assert.ok(fast.some(state => state.shell.width < baseline.viewport - 1 && state.shell.width > baseline.inner.width + 1), 'FLIP did not paint an intermediate width');
      fast.forEach(state => unchanged(baseline, state));
      const pill = await settle(fitsFloating);
      await page.waitForTimeout(330);
      const idle = await snapshot();
      assert.ok(fitsFloating(idle), 'The pill reverted while idle');
      unchanged(baseline, idle);
      samples.fast = fast;
      samples.idle = pill;
      await page.screenshot({ path: `${output}/${width}-floating.png` });
    });

    await check(`${width}px one upward pixel expands immediately and progress tracks both directions`, async () => {
      const before = await settle(fitsFloating);
      closeTo(before.ringOffset, 100 * (1 - before.scroll / before.maximum), .6, 'Downward ring offset');
      const upward = await drive(-1, 15, 1);
      const changed = upward.findIndex(state => state.shape === 'wide');
      assert.ok(changed >= 0 && changed <= 1, `A one-pixel gesture did not switch to wide by the next frame (index ${changed})`);
      assert.equal(upward.at(-1).scroll, before.scroll - 1, 'The test scrolled more than one pixel');
      assert.ok(upward.some(state => state.shell.width < baseline.viewport - 1 && state.shell.width > baseline.inner.width + 1), 'Expansion skipped the intermediate widths');
      const expanded = await settle(fitsWide);
      closeTo(expanded.ringOffset, 100 * (1 - expanded.scroll / expanded.maximum), .6, 'Upward ring offset');
      assert.ok(expanded.ringOffset > before.ringOffset, 'The ring did not move backward');
      upward.forEach(state => unchanged(baseline, state));
      samples.upward = upward;
      samples.expanded = expanded;
      await page.screenshot({ path: `${output}/${width}-expanded.png` });
    });

    await check(`${width}px open menu stays wide and Escape restores trigger focus`, async () => {
      await drive(30, 10);
      await settle(fitsFloating);
      const trigger = page.locator('.qofeno-header-trigger');
      await trigger.click();
      await expect(trigger).toHaveAttribute('aria-expanded', 'true');
      await settle(fitsWide);
      await expect(page.locator('#qofeno-navigation-panel')).toBeVisible();
      const panel = await page.locator('#qofeno-navigation-panel').boundingBox();
      assert.ok(panel && panel.width > 0);
      assert.ok(panel.x >= -.5 && panel.x + panel.width <= width + .5, 'Menu extends outside viewport');
      if (mobile) {
        closeTo(panel.x, 0, .5, 'Mobile menu x');
        closeTo(panel.y, 0, .5, 'Mobile menu y');
        closeTo(panel.width, width, .5, 'Mobile menu width');
        closeTo(panel.height, 850, .5, 'Mobile menu height');
        await expect(page.locator('html')).toHaveAttribute('data-mobile-navigation', 'open');
      }
      await page.keyboard.press('Escape');
      await expect(trigger).toHaveAttribute('aria-expanded', 'false');
      await expect(trigger).toBeFocused();
      await settle(fitsWide);
    });

    await check(`${width}px keyboard focus keeps hit areas and document position stable`, async () => {
      const trigger = page.locator('.qofeno-header-trigger');
      await page.keyboard.press('Tab');
      await trigger.focus();
      try {
        assert.equal(await trigger.evaluate(element => element.matches(':focus-visible')), true);
        const focused = await drive(32, 10);
        focused.forEach(state => {
          assert.ok(fitsWide(state));
          unchanged(baseline, state);
        });
      } finally {
        await trigger.evaluate(element => element.blur());
      }
    });

    if (!mobile) {
      await check('Desktop wheel input animates the navbar, and the ring completes at the bottom', async () => {
        await page.mouse.move(900, 500);
        await page.mouse.wheel(0, 900);
        await settle(fitsFloating);
        await waitForScrollIdle();
        await jump((await snapshot()).maximum);
        await expect.poll(async () => (await snapshot()).ringOffset).toBeLessThan(.75);
        await jump(0);
        const top = await settle(fitsWide);
        closeTo(top.ringOffset, 100, .5, 'Ring at returned top');
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
