import assert from 'node:assert/strict';
import { mkdir, readFile, writeFile } from 'node:fs/promises';
import { chromium, expect } from '@playwright/test';
import AxeBuilder from '@axe-core/playwright';

const origin = new URL(process.env.QOFENO_CHECK_URL || 'http://localhost:8795').origin;
const remote = new URL(origin).protocol === 'https:';
const output = 'test-results/process-story';
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

async function open(width, hash = '') {
  const context = await browser.newContext({
    viewport: { width, height: width > 1000 ? 900 : 850 },
    reducedMotion: 'reduce',
    isMobile: width < 768,
    hasTouch: width < 768,
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
  page.setDefaultTimeout(10000);
  page.on('pageerror', error => report.errors.push({ width, message: error.message }));
  await page.goto(origin + hash, { waitUntil: 'domcontentloaded' });
  await expect(page.locator('.placement-process-card')).toHaveCount(4, { timeout: 10000 });
  await page.evaluate(() => document.fonts.ready);
  return context;
}

async function geometry() {
  return page.locator('.placement-process-grid').evaluate(grid => {
    const track = grid.querySelector('.qofeno-process-track');
    const top = document.querySelector('.qofeno-header').offsetHeight + 24;
    return { start: grid.getBoundingClientRect().top + scrollY - top, distance: grid.clientHeight - track.clientHeight, top };
  });
}

async function sample() {
  return page.locator('.placement-process-grid').evaluate(grid => {
    const rect = element => {
      const { x, y, width, height } = element.getBoundingClientRect();
      return { x, y, width, height };
    };
    const stage = grid.querySelector('.qofeno-process-stage');
    const stageRect = rect(stage);
    const item = stage.querySelector('.qofeno-process-item');
    const itemRect = rect(item);
    return {
      scroll: scrollY,
      step: stage.dataset.processStep,
      stage: stageRect,
      item: { x: itemRect.x - stageRect.x, y: itemRect.y - stageRect.y, width: itemRect.width, height: itemRect.height },
      clips: [...stage.querySelectorAll('.qofeno-process-scene')].map(scene => getComputedStyle(scene).clipPath),
      cards: [...grid.querySelectorAll(':scope > .placement-process-card')].map(card => ({ ...rect(card), title: card.querySelector('h3').textContent.trim() })),
      overflow: document.documentElement.scrollWidth > document.documentElement.clientWidth,
    };
  });
}

async function seek(range, progress) {
  await page.evaluate(y => scrollTo({ top: y, behavior: 'instant' }), range.start + range.distance * progress);
  await page.evaluate(() => new Promise(resolve => requestAnimationFrame(() => requestAnimationFrame(resolve))));
  await page.waitForTimeout(60);
  return sample();
}

function clipEdges(clip) {
  const values = clip.slice(clip.indexOf('(') + 1, clip.lastIndexOf(')')).split(' round ')[0].trim().split(/\s+/).map(Number.parseFloat);
  if (values.length === 1) return Array(4).fill(values[0]);
  if (values.length === 2) return [values[0], values[1], values[0], values[1]];
  if (values.length === 3) return [values[0], values[1], values[2], values[1]];
  return values;
}

function samePose(before, after) {
  before.clips.forEach((clip, index) => {
    const previous = clipEdges(clip);
    const next = clipEdges(after.clips[index]);
    previous.forEach((edge, side) => assert.ok(Math.abs(next[side] - edge) <= .05,
      `Scene ${index + 1} edge ${side + 1} changed at the same scroll position`));
  });
  for (const axis of ['x', 'y', 'width', 'height']) {
    assert.ok(Math.abs(before.item[axis] - after.item[axis]) <= .6, `Shared item ${axis} differs at the same scroll position`);
  }
}

try {
  const desktop = await open(1440);
  await page.locator('.placement-process-heading').scrollIntoViewIfNeeded();
  await expect(page.locator('.qofeno-process-active')).toHaveCount(1, { timeout: 10000 });
  await expect(page.locator('.qofeno-process-stage')).toBeVisible();
  await page.waitForTimeout(250);
  const range = await geometry();
  assert.ok(range.distance > 500);
  const forward = [];
  for (let index = 0; index <= 24; index++) forward.push(await seek(range, index / 24));
  report.samples.desktop = { range, forward };

  await check('Desktop four scenes wipe in distinct directions while scrolling', async () => {
    await expect(page.locator('.qofeno-process-scene')).toHaveCount(4);
    assert.deepEqual([...new Set(forward.map(frame => frame.step))], ['1', '2', '3', '4']);
    for (let scene = 1; scene < 4; scene++) {
      const values = forward.map(frame => frame.clips[scene]);
      assert.ok(new Set(values).size >= 3, `Scene ${scene + 1} did not interpolate`);
      assert.ok(values.some(value => {
        const numbers = value.match(/[\d.]+/g)?.map(Number) || [];
        return numbers.some(number => number > 2 && number < 98);
      }), `Scene ${scene + 1} had no visible intermediate reveal`);
    }
    const closed = forward[0].clips.slice(1).map(clip => clipEdges(clip).join('/'));
    assert.equal(new Set(closed).size, 3, 'Reveals should start from different edges');
  });

  await check('Shared website card interpolates its real position and dimensions', async () => {
    const initialSlot = await page.locator('.qofeno-process-scene').first().locator('.qofeno-process-item-slot').evaluate(element => {
      const target = element.getBoundingClientRect();
      const stage = element.closest('.qofeno-process-stage').getBoundingClientRect();
      return { x: target.x - stage.x, y: target.y - stage.y, width: target.width, height: target.height };
    });
    for (const axis of ['x', 'y', 'width', 'height']) {
      assert.ok(Math.abs(forward[0].item[axis] - initialSlot[axis]) <= 1, `Initial card ${axis} does not match its first slot`);
    }
    const values = axis => forward.map(frame => frame.item[axis]);
    assert.ok(Math.max(...values('x')) - Math.min(...values('x')) > 25);
    assert.ok(Math.max(...values('y')) - Math.min(...values('y')) > 25);
    assert.ok(Math.max(...values('width')) - Math.min(...values('width')) > 15);
    assert.ok(Math.max(...values('height')) - Math.min(...values('height')) > 5);
    assert.ok(new Set(values('width').map(value => value.toFixed(1))).size > 6, 'The shared card jumped between endpoints');
  });

  await check('Pinned stage stays below navigation while all four copy cards flow past', async () => {
    const interior = forward.slice(1, -1);
    for (const frame of interior) {
      assert.ok(Math.abs(frame.stage.y - range.top) <= 1.5, `Pinned y ${frame.stage.y}, expected ${range.top}`);
      assert.equal(frame.overflow, false);
      frame.cards.forEach((card, index) => {
        const first = forward[0].cards[index];
        assert.ok(Math.abs(card.y + frame.scroll - first.y - forward[0].scroll) <= .6, `${card.title} shifted in document flow`);
      });
    }
    assert.ok(interior[0].cards[0].y - interior.at(-1).cards[0].y > 500, 'Left-hand copy did not scroll');
    await expect(page.locator('.placement-process').getByRole('heading', { level: 3 })).toHaveCount(4);
    await expect(page.locator('.qofeno-process-stage')).toHaveAttribute('aria-hidden', 'true');
    await expect(page.locator('.qofeno-process-stage')).toHaveCSS('pointer-events', 'none');
  });

  await check('Reverse scrolling restores the same intermediate poses and idle stops', async () => {
    const reverse = [];
    for (let index = 24; index >= 0; index--) {
      const frame = await seek(range, index / 24);
      samePose(forward[index], frame);
      reverse.push(frame);
    }
    report.samples.desktop.reverse = reverse;
    const mid = await seek(range, .5);
    await page.waitForTimeout(250);
    samePose(mid, await sample());
    await page.screenshot({ path: `${output}/desktop-midpoint.png` });
  });

  await check('Stage unpins normally beyond the last step', async () => {
    const end = await seek(range, 1);
    const after = await seek(range, 1 + 240 / range.distance);
    assert.ok(Math.abs(after.stage.y - end.stage.y + after.scroll - end.scroll) <= 2, 'Stage remained fixed after its track ended');
    assert.ok(after.stage.y < end.stage.y - 150);
    assert.equal(after.step, '4');
  });

  await check('Process links stay operable and semantic content has no accessibility violations', async () => {
    const preview = page.locator('.placement-process-submit button');
    await preview.click();
    await expect(page.locator('dialog[open]')).toBeVisible();
    await page.keyboard.press('Escape');
    await expect(page.locator('dialog[open]')).toHaveCount(0);
    await expect(preview).toBeFocused();
    await expect(page.locator('.placement-process-expiry a')).toHaveAttribute('href', '/terms');
    const audit = await new AxeBuilder({ page }).include('#how-it-works').withTags(['wcag2a', 'wcag2aa', 'wcag21aa']).analyze();
    assert.deepEqual(audit.violations.map(issue => ({ id: issue.id, targets: issue.nodes.map(node => node.target) })), []);
  });

  await check('Short desktop viewport removes pinning and returns to readable cards', async () => {
    await page.setViewportSize({ width: 1440, height: 560 });
    await expect(page.locator('.qofeno-process-stage')).toHaveCount(0);
    await expect(page.locator('.qofeno-process-active')).toHaveCount(0);
    await expect(page.locator('#how-it-works .pin-spacer')).toHaveCount(0);
    await expect(page.locator('.placement-process-card')).toHaveCount(4);
    assert.equal(await page.evaluate(() => document.documentElement.scrollWidth > document.documentElement.clientWidth), false);
  });
  await desktop.close();

  const mobile = await open(390);
  await check('390px keeps four unpinned Canvas-backed cards with no overflow', async () => {
    const cards = page.locator('.placement-process-card');
    for (let index = 0; index < 4; index++) {
      const card = cards.nth(index);
      await card.locator('h3').scrollIntoViewIfNeeded();
      const art = card.locator('.interface-illustration');
      await art.scrollIntoViewIfNeeded();
      const canvas = art.locator('canvas.qofeno-scene-canvas');
      await expect(canvas).toBeVisible();
      assert.ok(await canvas.evaluate(element => {
        const pixels = element.getContext('2d').getImageData(0, 0, element.width, element.height).data;
        let painted = 0;
        for (let offset = 3; offset < pixels.length; offset += 64) if (pixels[offset]) painted++;
        return painted > 30;
      }), 'Mobile process artwork has no painted pixels');
      assert.equal(await card.evaluate(element => getComputedStyle(element).position === 'fixed'), false);
    }
    await expect(page.locator('.qofeno-process-stage, #how-it-works .pin-spacer')).toHaveCount(0);
    assert.equal(await page.evaluate(() => document.documentElement.scrollWidth > document.documentElement.clientWidth), false);
    await page.locator('.placement-process-review').scrollIntoViewIfNeeded();
    await page.screenshot({ path: `${output}/mobile-process.png` });
  });
  await mobile.close();

  const linked = await open(1440, '/#how-it-works');
  await check('Direct How it works link reaches the live section without breaking its story', async () => {
    await expect(page).toHaveURL(/#how-it-works$/);
    await expect(page.locator('.qofeno-process-stage')).toBeVisible({ timeout: 10000 });
    const view = await page.locator('#how-it-works').evaluate(section => {
      const { top, bottom } = section.getBoundingClientRect();
      return { top, bottom, viewport: innerHeight, scroll: scrollY };
    });
    assert.ok(view.scroll > 0 && view.top < view.viewport && view.bottom > 0, 'Fragment did not reach the process section');
    await seek(await geometry(), .55);
    assert.ok(Number(await page.locator('.qofeno-process-stage').getAttribute('data-process-step')) >= 2);
  });
  await linked.close();
  await check('No client runtime errors', async () => assert.deepEqual(report.errors, []));
} catch (error) {
  report.checks.push({ name: 'Page setup', passed: false, message: error.message });
  console.error(error);
} finally {
  await browser.close();
  report.passed = report.checks.length > 0 && report.checks.every(check => check.passed);
  await writeFile(`${output}/report.json`, JSON.stringify(report, null, 2) + '\n');
}
console.log(`${report.checks.filter(check => check.passed).length}/${report.checks.length} process checks passed. Report: ${output}/report.json`);
if (!report.passed) process.exitCode = 1;
