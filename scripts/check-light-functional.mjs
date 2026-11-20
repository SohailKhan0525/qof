import { chromium } from 'playwright';
import AxeBuilder from '@axe-core/playwright';
import { readFile, mkdir, writeFile } from 'node:fs/promises';

// Presentation checks only: every non-GET/HEAD request is aborted, including
// checkout creation, analytics heartbeats and moderation writes.
const base = process.env.QOFENO_CHECK_BASE_URL || 'http://localhost:8787';
const destination = 'test-results/light-2026-11-20';
await mkdir(destination, { recursive: true });
const fixture = JSON.parse(await readFile('tests/fixtures/visitors.json', 'utf8'));
const browser = await chromium.launch({
  executablePath: process.env.CHROMIUM_PATH || '/usr/bin/chromium',
  headless: true,
  args: ['--no-sandbox'],
});
const context = await browser.newContext({ viewport: { width: 1440, height: 1050 } });
const page = await context.newPage();
page.setDefaultTimeout(10000);
const report = { base, stylesheet: null, pages: [], checkout: [], visitorStates: [], errors: [], blockedWrites: 0 };
page.on('pageerror', error => report.errors.push(error.message));
let visitorState = 'available';
await page.route('**/*', async route => {
  if (!['GET', 'HEAD'].includes(route.request().method())) {
    report.blockedWrites += 1;
    return route.abort();
  }
  const path = new URL(route.request().url()).pathname;
  if (path === '/spot/light-theme-unavailable-test' || path === '/spot/light-theme-active-test') {
    // The local database may be empty. Serve the unchanged application shell;
    // only the browser-intercepted public detail response below is synthetic.
    return route.fulfill({ response: await route.fetch({ url: base + '/my-spot' }) });
  }
  if (path === '/api/visitors') {
    const body = { ...fixture, trackingEnabled: visitorState !== 'paused' };
    if (visitorState === 'compact') body.month = 1200000;
    return route.fulfill({
      status: visitorState === 'unavailable' ? 503 : 200,
      contentType: 'application/json',
      body: JSON.stringify(visitorState === 'unavailable' ? { error: 'Unavailable' } : body),
    });
  }
  if (path === '/api/placements/light-theme-unavailable-test') {
    return route.fulfill({ status: 404, contentType: 'application/json', body: '{}' });
  }
  if (path === '/api/placements/light-theme-active-test') {
    const now = Date.now();
    const expiresAt = now + 20 * 86400000;
    return route.fulfill({ status: 200, contentType: 'application/json', body: JSON.stringify({
      asOf: now, totalActiveSpend: 100, share: .3, mode: 'test',
      listing: { id: 'light-theme-active-test', title: 'Fixture Studio',
        tagline: 'A synthetic placement used only for browser layout checks.',
        website: 'https://example.com', host: 'example.com', tone: 'blue', category: 'design',
        rank: 2, nextRankCost: 50, activeSpend: 30, clicks: 4, expiresAt,
        expirations: [{ at: now + 10 * 86400000, amount: 10 }, { at: expiresAt, amount: 20 }],
      },
    }) });
  }
  return route.continue();
});
const violations = async scope => (await new AxeBuilder({ page }).include(scope)
  .withTags(['wcag2a', 'wcag2aa', 'wcag21aa']).analyze()).violations
  .map(issue => ({ id: issue.id, targets: issue.nodes.map(node => node.target) }));
try {
  await page.goto(base + '/my-spot', { waitUntil: 'domcontentloaded' });
  const sheetURL = await page.locator('link[rel="stylesheet"]').evaluateAll(links => links.find(link => link.href.includes('qofeno-light-'))?.href);
  if (!sheetURL) throw new Error('Missing content-hashed light stylesheet.');
  const sheet = await context.request.get(sheetURL);
  report.stylesheet = { url: sheetURL, status: sheet.status(), contentType: sheet.headers()['content-type'] };
  if (!sheet.ok() || !report.stylesheet.contentType?.includes('text/css')) throw new Error('Light stylesheet did not return CSS.');
  for (const width of [1440, 390, 320]) {
    await page.setViewportSize({ width, height: width === 1440 ? 1050 : 844 });
    for (const path of ['/my-spot', '/owner', '/terms', '/contact', '/privacy', '/refunds', '/advertising-policy', '/spot/light-theme-unavailable-test', '/spot/light-theme-active-test']) {
      await page.goto(base + path, { waitUntil: 'domcontentloaded' });
      const scope = path.startsWith('/spot/') ? '.spot-page' : 'main';
      await page.locator(scope).waitFor();
      // Wait for the preserved paper reveal before measuring text contrast.
      await page.waitForTimeout(path.startsWith('/spot/') ? 1400 : 300);
      const result = await page.evaluate(() => ({
        viewport: innerWidth,
        width: document.documentElement.scrollWidth,
        bodyBackground: getComputedStyle(document.body).backgroundColor,
        darkPanels: [...document.querySelectorAll('.account-panel,.owner-signin,.spot-schedule-sheet')]
          .filter(element => getComputedStyle(element).backgroundColor === 'rgb(25, 28, 24)').length,
      }));
      const entry = { path, ...result };
      if (width === 1440) entry.violations = await violations(scope);
      report.pages.push(entry);
    }
  }
  await page.setViewportSize({ width: 1440, height: 1050 });
  await page.goto(base + '/my-spot', { waitUntil: 'domcontentloaded' });
  await page.getByRole('button', { name: /Get a placement/i }).first().click();
  for (const width of [1440, 390, 320]) {
    await page.setViewportSize({ width, height: width === 1440 ? 1050 : 844 });
    await page.waitForTimeout(250);
    report.checkout.push({ width,
      ...(await page.locator('dialog[open]').evaluate(element => ({
        scrollWidth: element.scrollWidth,
        clientWidth: element.clientWidth,
        background: getComputedStyle(element).backgroundColor,
      }))), violations: await violations('dialog[open]'),
    });
  }
  for (const state of ['unavailable', 'available', 'paused', 'compact']) {
    visitorState = state;
    await page.goto(base + '/my-spot', { waitUntil: 'domcontentloaded' });
    await page.waitForFunction(() => document.querySelectorAll('[data-qofeno-metric-description]').length === 3);
    await page.waitForTimeout(300);
    report.visitorStates.push({ state,
      values: await page.locator('[data-visitor-metric]').evaluateAll(elements => elements.map(element => ({
        metric: element.dataset.visitorMetric,
        text: element.textContent,
        prohibitedLabel: element.hasAttribute('aria-label'),
        descriptions: element.querySelectorAll('[data-qofeno-metric-description]').length,
      }))), violations: await violations('.visitor-activity'),
    });
  }
} catch (error) {
  report.errors.push(error.message);
} finally {
  await browser.close();
  await writeFile(`${destination}/functional-report.json`, JSON.stringify(report, null, 2));
}
const failed = report.errors.length || report.pages.some(page => page.width > page.viewport || page.darkPanels || page.bodyBackground !== 'rgb(250, 249, 245)' || page.violations?.length)
  || report.checkout.some(dialog => dialog.scrollWidth > dialog.clientWidth || dialog.violations.length)
  || report.visitorStates.some(state => state.violations.length || state.values.some(value => value.prohibitedLabel || value.descriptions !== 1));
console.log(JSON.stringify({ pages: report.pages.length, checkoutWidths: report.checkout.length, visitorStates: report.visitorStates.length, errors: report.errors, passed: !failed }));
if (failed) process.exitCode = 1;
