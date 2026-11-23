import assert from 'node:assert/strict';
import { mkdir, readFile, writeFile } from 'node:fs/promises';
import { chromium, expect } from '@playwright/test';
import AxeBuilder from '@axe-core/playwright';

const origin = new URL(process.env.QOFENO_CHECK_URL || 'http://localhost:8797').origin;
const remote = new URL(origin).protocol === 'https:';
const output = 'test-results/faq-motion';
const report = { origin, checkedAt: new Date().toISOString(), checks: [], samples: {}, errors: [], blockedWrites: [] };
const fixtures = new Map(await Promise.all(['board', 'session', 'status', 'visitors'].map(async name => [
  `/api/${name}`, await readFile(new URL(`../tests/fixtures/${name}.json`, import.meta.url), 'utf8'),
])));
await mkdir(output, { recursive: true });
const browser = await chromium.launch({
  executablePath: process.env.CHROMIUM_PATH || '/usr/bin/chromium', args: ['--no-sandbox'],
  ...(remote && process.env.HTTPS_PROXY ? { proxy: { server: process.env.HTTPS_PROXY } } : {}),
});
let page;

async function check(name, run) {
  try {
    await run(); report.checks.push({ name, passed: true }); console.log(`PASS ${name}`);
  } catch (error) {
    report.checks.push({ name, passed: false, message: error.message });
    console.error(`FAIL ${name}: ${error.message}`);
    await page?.screenshot({ path: `${output}/${name.replace(/[^a-z0-9]+/gi, '-').toLowerCase()}-failure.png` }).catch(() => {});
  }
}

async function open(width) {
  const context = await browser.newContext({
    viewport: { width, height: width < 700 ? 850 : 900 }, reducedMotion: 'reduce',
    isMobile: width < 700, hasTouch: width < 700, ignoreHTTPSErrors: true,
  });
  await context.route('**/api/**', route => {
    const request = route.request(); const pathname = new URL(request.url()).pathname;
    if (request.method() !== 'GET') { report.blockedWrites.push({ method: request.method(), pathname }); return route.abort(); }
    const body = fixtures.get(pathname);
    return body && !remote ? route.fulfill({ contentType: 'application/json', body }) : route.continue();
  });
  page = await context.newPage();
  page.setDefaultTimeout(10000);
  page.on('pageerror', error => report.errors.push({ width, message: error.message }));
  await page.goto(origin + '/#questions', { waitUntil: 'domcontentloaded' });
  await expect(page.locator('.faq-list[data-faq-motion]')).toBeVisible();
  await page.evaluate(() => document.fonts.ready);
  await page.locator('.faq-list summary').first().scrollIntoViewIfNeeded();
  await page.waitForTimeout(400);
  return context;
}

async function settled() {
  await page.waitForTimeout(550);
  await expect(page.locator('.faq-list')).toHaveAttribute('data-faq-motion', 'ready');
  await expect(page.locator('.qofeno-faq-exit')).toHaveCount(0);
}

async function reset() {
  await page.locator('.faq-list').evaluate(list => list.querySelectorAll('details').forEach(row => { row.open = false; }));
  await settled();
}

async function sampleClick(index) {
  const summary = page.locator('.faq-list summary').nth(index);
  await summary.scrollIntoViewIfNeeded();
  await page.evaluate(() => {
    window.__qFaqFrames = [];
    const list = document.querySelector('.faq-list'); const started = performance.now();
    function sample() {
      window.__qFaqFrames.push({
        time: performance.now() - started, height: list.getBoundingClientRect().height,
        state: list.dataset.faqMotion,
        rows: [...list.querySelectorAll(':scope > details')].map(row => ({
          open: row.open, y: row.getBoundingClientRect().y, height: row.getBoundingClientRect().height,
          opacity: getComputedStyle(row).opacity, transform: getComputedStyle(row).transform,
          legacyHeight: row.getAnimations().some(animation => animation.effect.getKeyframes().some(key => 'height' in key)),
        })),
      });
      if (performance.now() - started < 650) requestAnimationFrame(sample);
    }
    sample();
  });
  await summary.click();
  await page.waitForTimeout(700);
  return page.evaluate(() => window.__qFaqFrames);
}

function interpolates(frames, row) {
  assert.ok(frames.some(frame => frame.state === 'playing'), 'No live Flip interval was observed');
  for (const values of [frames.map(frame => frame.height), frames.map(frame => frame.rows[row].height)]) {
    const low = Math.min(...values), high = Math.max(...values);
    assert.ok(high - low > 25, 'Accordion did not change physical height');
    assert.ok(new Set(values.filter(value => value > low + 2 && value < high - 2).map(value => value.toFixed(1))).size >= 3,
      'Accordion jumped between endpoints instead of interpolating');
    const direction = Math.sign(values.at(-1) - values[0]);
    assert.ok(values.slice(1).every((value, index) => (value - values[index]) * direction >= -2),
      'Accordion briefly painted the final layout before reversing into its animation');
  }
  assert.ok(frames.every(frame => frame.rows.every(row => !row.legacyHeight)), 'Legacy WAAPI and Flip are both animating height');
}

async function assertClean() {
  const state = await page.locator('.faq-list').evaluate(list => ({
    overflow: document.documentElement.scrollWidth > document.documentElement.clientWidth,
    styles: [list, ...list.querySelectorAll(':scope > details')].map(element => ({
      height: element.style.height, width: element.style.width, position: element.style.position, transform: element.style.transform,
    })),
    oldFold: list.querySelector('[data-fold-state]') !== null,
  }));
  assert.equal(state.overflow, false);
  assert.equal(state.oldFold, false);
  assert.ok(state.styles.every(style => Object.values(style).every(value => !value)), `Flip left transient layout styles: ${JSON.stringify(state.styles)}`);
}

try {
  for (const width of [1440, 390, 320]) {
    const context = await open(width);
    const rows = page.locator('.faq-list > details');
    const summaries = page.locator('.faq-list summary');
    await check(`${width}px opens and closes with real native state and interpolated Flip geometry`, async () => {
      await reset();
      const opening = await sampleClick(0);
      interpolates(opening, 0);
      await expect(rows.first()).toHaveAttribute('open', '');
      await expect(page.locator('.faq-list details[open]')).toHaveCount(1);
      await settled();
      const closing = await sampleClick(0);
      interpolates(closing, 0);
      await expect(page.locator('.faq-list details[open]')).toHaveCount(0);
      await settled();
      await assertClean();
      report.samples[width] = { opening, closing };
    });

    await check(`${width}px dims only inactive chrome and preserves contrast and focus`, async () => {
      await summaries.first().click();
      await settled();
      const inactive = rows.nth(1);
      const reading = await inactive.evaluate(row => ({
        rowOpacity: getComputedStyle(row).opacity,
        summaryOpacity: getComputedStyle(row.querySelector('summary')).opacity,
        iconOpacity: getComputedStyle(row.querySelector('.plus')).opacity,
      }));
      assert.equal(reading.rowOpacity, '1');
      assert.equal(reading.summaryOpacity, '1');
      assert.ok(Math.abs(Number(reading.iconOpacity) - .4) < .02);
      await summaries.nth(1).focus();
      await page.waitForTimeout(250);
      await expect(summaries.nth(1)).toBeFocused();
      await expect.poll(() => inactive.locator('.plus').evaluate(icon => Number(getComputedStyle(icon).opacity))).toBeCloseTo(1, 3);
      const audit = await new AxeBuilder({ page }).include('#questions').withTags(['wcag2a', 'wcag2aa', 'wcag21aa']).analyze();
      assert.deepEqual(audit.violations.map(issue => ({ id: issue.id, targets: issue.nodes.map(node => node.target) })), []);
      await page.screenshot({ path: `${output}/faq-${width}.png` });
    });

    await check(`${width}px preserves Enter Space exclusivity and rapid toggles`, async () => {
      await summaries.nth(1).focus();
      await page.keyboard.press('Enter');
      await settled();
      await expect(rows.nth(1)).toHaveAttribute('open', '');
      await expect(rows.first()).not.toHaveAttribute('open', '');
      await page.keyboard.press('Space');
      await settled();
      await expect(page.locator('.faq-list details[open]')).toHaveCount(0);
      await summaries.first().click();
      await page.waitForTimeout(60);
      await summaries.nth(1).evaluate(summary => summary.click());
      await page.waitForTimeout(60);
      await summaries.first().evaluate(summary => summary.click());
      await settled();
      await expect(rows.first()).toHaveAttribute('open', '');
      await expect(page.locator('.faq-list details[open]')).toHaveCount(1);
      await assertClean();
    });

    if (width === 1440) await check('Resizing during a FAQ transition settles to natural mobile layout', async () => {
      await summaries.nth(1).click();
      await page.waitForTimeout(70);
      await page.setViewportSize({ width: 390, height: 850 });
      await settled();
      await assertClean();
      await expect(rows.nth(1)).toHaveAttribute('open', '');
      const answer = rows.nth(1).locator('p');
      await answer.scrollIntoViewIfNeeded();
      await expect(answer).toBeVisible();
    });
    await context.close();
  }
  await check('No FAQ client runtime errors', async () => assert.deepEqual(report.errors, []));
} catch (error) {
  report.checks.push({ name: 'FAQ setup', passed: false, message: error.message }); console.error(error);
} finally {
  await browser.close();
  report.passed = report.checks.length > 0 && report.checks.every(check => check.passed);
  await writeFile(`${output}/report.json`, JSON.stringify(report, null, 2) + '\n');
}
console.log(`${report.checks.filter(check => check.passed).length}/${report.checks.length} FAQ checks passed. Report: ${output}/report.json`);
if (!report.passed) process.exitCode = 1;
