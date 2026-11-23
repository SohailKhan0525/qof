import assert from 'node:assert/strict';
import { mkdir, readFile, writeFile } from 'node:fs/promises';
import { chromium, expect } from '@playwright/test';
import AxeBuilder from '@axe-core/playwright';

const origin = new URL(process.env.QOFENO_CHECK_URL || 'http://localhost:8796').origin;
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

async function open(width, hash = '', height = width > 1000 ? 900 : 850) {
  const context = await browser.newContext({
    viewport: { width, height },
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
    const top = document.querySelector('.qofeno-header').offsetHeight + (grid.classList.contains('qofeno-process-stacked') ? 8 : 24);
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
      cards: [...grid.querySelectorAll(':scope > .placement-process-card')].map(card => ({
        ...rect(card), title: card.querySelector('h3').textContent.trim(),
        heading: rect(card.querySelector('h3')), body: rect(card.querySelector('.placement-process-copy p')),
      })),
      viewportHeight: innerHeight,
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

async function prepareStory() {
  await page.locator('.placement-process-heading').scrollIntoViewIfNeeded();
  await expect(page.locator('.qofeno-process-active')).toHaveCount(1, { timeout: 10000 });
  await expect(page.locator('.qofeno-process-track .qofeno-process-stage')).toBeVisible();
  await page.waitForTimeout(250);
  return geometry();
}

function assertInterpolates(frames) {
  assert.deepEqual([...new Set(frames.map(frame => frame.step))], ['1', '2', '3', '4']);
  for (let scene = 1; scene < 4; scene++) {
    const values = frames.map(frame => clipEdges(frame.clips[scene]));
    assert.ok(values.some(edges => edges.some(edge => edge > 2 && edge < 98)), `Scene ${scene + 1} lacks an intermediate reveal`);
    assert.ok(new Set(values.map(edges => edges.join('/'))).size >= 3, `Scene ${scene + 1} jumps between endpoints`);
  }
  const span = axis => Math.max(...frames.map(frame => frame.item[axis])) - Math.min(...frames.map(frame => frame.item[axis]));
  assert.ok(span('x') > frames[0].stage.width * .07, 'Shared card does not move horizontally');
  assert.ok(span('y') > frames[0].stage.height * .12, 'Shared card does not move vertically');
  assert.ok(span('width') > frames[0].stage.width * .06, 'Shared card does not resize');
  assert.ok(span('height') > frames[0].stage.height * .015, 'Shared card height does not interpolate');
}

async function assertNoOverflow() {
  assert.equal(await page.evaluate(() => document.documentElement.scrollWidth > document.documentElement.clientWidth), false);
}

async function assertInline() {
  await expect(page.locator('.qofeno-process-inline')).toHaveCount(1);
  await expect(page.locator('.qofeno-process-track, #how-it-works .pin-spacer, .qofeno-process-stacked')).toHaveCount(0);
  const cards = page.locator('.placement-process-card');
  await expect(cards).toHaveCount(4);
  const kinds = [];
  for (let index = 0; index < 4; index++) {
    const card = cards.nth(index);
    const stage = card.locator('.qofeno-process-stage');
    await expect(stage).toHaveCount(1);
    await stage.scrollIntoViewIfNeeded();
    await expect(stage).toBeVisible();
    await expect(stage.locator('.qofeno-process-scene')).toHaveCount(1);
    const panel = await stage.evaluate(element => {
      const scene = element.querySelector('.qofeno-process-scene');
      const bounds = element.getBoundingClientRect();
      const item = element.querySelector('.qofeno-process-item').getBoundingClientRect();
      return {
        kind: scene.dataset.scene, position: getComputedStyle(element).position,
        clip: getComputedStyle(scene).clipPath, width: bounds.width, height: bounds.height,
        itemInside: item.width > 10 && item.height > 10 && item.left >= bounds.left - 1 && item.right <= bounds.right + 1 && item.top >= bounds.top - 1 && item.bottom <= bounds.bottom + 1,
      };
    });
    assert.notEqual(panel.position, 'fixed');
    assert.ok(panel.width > 100 && panel.height > 100 && panel.itemInside, 'Inline art or shared card is missing its authored layout');
    assert.ok(panel.clip === 'none' || clipEdges(panel.clip).every(edge => Math.abs(edge) < .1), 'Inline scene remains clipped away');
    kinds.push(panel.kind);
    await expect(card.locator('.interface-illustration')).toBeHidden();
  }
  assert.deepEqual(kinds, ['submit', 'review', 'ranking', 'expiry']);
  await assertNoOverflow();
}

async function placeBelowStage(locator) {
  const target = await locator.evaluate(element => {
    const stage = document.querySelector('.qofeno-process-track .qofeno-process-stage');
    const offset = document.querySelector('.qofeno-header').offsetHeight + 8;
    return element.getBoundingClientRect().top + scrollY - offset - stage.getBoundingClientRect().height - 24;
  });
  await page.evaluate(y => scrollTo({ top: y, behavior: 'instant' }), target);
  await page.waitForTimeout(120);
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

  await check('1440 by 560 retains a compact pinned story', async () => {
    await page.setViewportSize({ width: 1440, height: 560 });
    const shortRange = await prepareStory();
    await expect(page.locator('#how-it-works .pin-spacer')).toHaveCount(1);
    const frames = [];
    for (let index = 0; index <= 24; index++) frames.push(await seek(shortRange, index / 24));
    report.samples.shortDesktop = { range: shortRange, forward: frames };
    assertInterpolates(frames);
    for (const frame of frames.slice(1, -1)) {
      assert.ok(Math.abs(frame.stage.y - shortRange.top) <= 1.5);
      assert.ok(frame.stage.y + frame.stage.height <= frame.viewportHeight - 8, 'Compact desktop stage extends below the viewport');
      assert.equal(frame.overflow, false);
    }
  });
  await desktop.close();

  for (const [width, height] of [[390, 850], [320, 700]]) {
    const mobile = await open(width, '/#how-it-works', height);
    let phoneRange;
    const frames = [];
    await check(`${width}px uses a pinned stage above copy with actual scene and card interpolation`, async () => {
      phoneRange = await prepareStory();
      await expect(page.locator('.qofeno-process-stacked')).toHaveCount(1);
      await expect(page.locator('#how-it-works .pin-spacer')).toHaveCount(1);
      for (let index = 0; index <= 32; index++) frames.push(await seek(phoneRange, index / 32));
      report.samples[`mobile${width}`] = { range: phoneRange, forward: frames };
      assertInterpolates(frames);
      for (const frame of frames.slice(1, -1)) {
        assert.ok(Math.abs(frame.stage.y - phoneRange.top) <= 1.5, `Phone stage y ${frame.stage.y}, expected ${phoneRange.top}`);
        assert.ok(frame.stage.y + frame.stage.height <= height - 200, 'Pinned illustration leaves too little room to read the copy');
        assert.equal(frame.overflow, false);
        frame.cards.forEach((card, index) => assert.ok(Math.abs(card.y + frame.scroll - frames[0].cards[index].y - frames[0].scroll) <= .6, 'Phone copy moved out of document flow'));
      }
      for (let index = 0; index < 4; index++) {
        assert.ok(frames.some(frame => {
          const { heading, body } = frame.cards[index];
          const below = frame.stage.y + frame.stage.height;
          return heading.y >= below + 4 && body.y + body.height < height - 8;
        }), `Step ${index + 1} heading and description cannot be read together below the stage`);
      }
      await expect(page.locator('.qofeno-process-stage')).toHaveAttribute('aria-hidden', 'true');
      await expect(page.locator('.qofeno-process-stage :is(a, button, input, [tabindex])')).toHaveCount(0);
    });

    await check(`${width}px reverses smoothly and releases the stage after the final step`, async () => {
      assert.equal(frames.length, 33, 'Mobile motion setup did not complete');
      for (let index = 32; index >= 0; index -= 2) samePose(frames[index], await seek(phoneRange, index / 32));
      const mid = await seek(phoneRange, .5);
      await page.waitForTimeout(250);
      samePose(mid, await sample());
      await page.screenshot({ path: `${output}/mobile-${width}-midpoint.png` });
      const end = await seek(phoneRange, 1);
      const after = await seek(phoneRange, 1 + 200 / phoneRange.distance);
      assert.ok(Math.abs(after.stage.y - end.stage.y + after.scroll - end.scroll) <= 2, 'Phone stage remained pinned beyond its section');
      assert.ok(after.stage.y < end.stage.y - 150);
      assert.equal(after.step, '4');
    });

    await check(`${width}px keeps preview and terms usable below the illustration`, async () => {
      const preview = page.locator('.placement-process-submit button');
      await placeBelowStage(preview);
      const bounds = await preview.boundingBox();
      const stage = await page.locator('.qofeno-process-stage').boundingBox();
      assert.ok(bounds.y >= stage.y + stage.height && bounds.y + bounds.height < height, 'Preview action is obscured by the pinned artwork');
      await preview.tap();
      await expect(page.locator('dialog[open]')).toBeVisible();
      await page.keyboard.press('Escape');
      await expect(page.locator('dialog[open]')).toHaveCount(0);
      await expect(preview).toBeFocused();
      // Focus must bring a control out from under the pinned illustration.
      await preview.evaluate(element => {
        element.blur();
        const stage = document.querySelector('.qofeno-process-track .qofeno-process-stage').getBoundingClientRect();
        scrollTo({ top: element.getBoundingClientRect().top + scrollY - stage.top - stage.height / 2, behavior: 'instant' });
      });
      await preview.focus();
      await page.waitForTimeout(100);
      const focusedBounds = await preview.boundingBox();
      const focusedStage = await page.locator('.qofeno-process-stage').boundingBox();
      assert.ok(focusedBounds.y >= focusedStage.y + focusedStage.height + 4, 'Keyboard focus left the preview control hidden under the illustration');
      const terms = page.locator('.placement-process-expiry a');
      await placeBelowStage(terms);
      await expect(terms).toHaveAttribute('href', '/terms');
      await terms.tap({ trial: true });
      const audit = await new AxeBuilder({ page }).include('#how-it-works').withTags(['wcag2a', 'wcag2aa', 'wcag21aa']).analyze();
      assert.deepEqual(audit.violations.map(issue => ({ id: issue.id, targets: issue.nodes.map(node => node.target) })), []);
      await assertNoOverflow();
    });
    await mobile.close();
  }

  const landscape = await open(844, '/#how-it-works', 390);
  await check('844 by 390 uses four new inline art panels with no pinning', async () => {
    await page.locator('.placement-process-heading').scrollIntoViewIfNeeded();
    await assertInline();
    await page.screenshot({ path: `${output}/landscape-inline.png` });
  });
  await landscape.close();

  const resizing = await open(1440);
  await check('Resizing between desktop phone and inline modes removes stale pins and duplicate artwork', async () => {
    let resizeRange = await prepareStory();
    await seek(resizeRange, .5);
    for (const viewport of [{ width: 390, height: 850 }, { width: 844, height: 390 }, { width: 320, height: 700 }, { width: 390, height: 500 }, { width: 1440, height: 560 }]) {
      await page.setViewportSize(viewport);
      await page.waitForTimeout(180);
      if (viewport.height < (viewport.width >= 1000 ? 460 : 540)) {
        await assertInline();
        continue;
      }
      resizeRange = await prepareStory();
      await expect(page.locator('.qofeno-process-stage')).toHaveCount(1);
      await expect(page.locator('.qofeno-process-track')).toHaveCount(1);
      await expect(page.locator('#how-it-works .pin-spacer')).toHaveCount(1);
      await expect(page.locator('.qofeno-process-inline')).toHaveCount(0);
      await expect(page.locator('.qofeno-process-scene')).toHaveCount(4);
      await expect(page.locator('.placement-process-card')).toHaveCount(4);
      const frame = await seek(resizeRange, .5);
      assert.ok(Math.abs(frame.stage.y - resizeRange.top) <= 1.5, 'Pin geometry was stale after resizing');
      assert.ok(Number(frame.step) >= 2, 'Story did not resume after resizing');
      await assertNoOverflow();
    }
  });
  await resizing.close();

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
