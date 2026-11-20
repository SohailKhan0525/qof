// Run with Node 24: node --use-env-proxy scripts/check-deployed-http.mjs --environment test --version <deployed-version-id>
// Only GET requests are sent. No checkout, webhook, moderation, recovery, or heartbeat mutations.
import assert from 'node:assert/strict';
import { readFile, mkdir, writeFile } from 'node:fs/promises';
import { createHash } from 'node:crypto';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { HOUSE_PLACEMENT } from '../src/lib/house-placement.mjs';

const project = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const args = process.argv.slice(2);
const argument = flag => { const index = args.indexOf(flag); return index >= 0 ? args[index + 1] : undefined; };
const environment = argument('--environment') || process.env.QOFENO_CHECK_ENVIRONMENT || 'test';
assert.ok(['test', 'production'].includes(environment), '--environment must be test or production');
const isTest = environment === 'test';
const worker = isTest ? 'qofeno-payments-test' : 'qofeno';
const origin = isTest ? 'https://qofeno-payments-test.sohailkhannn-0525.workers.dev' : 'https://loopproof.me';
const expectedVersion = argument('--version') || process.env.QOFENO_EXPECTED_VERSION;
assert.match(expectedVersion || '', /^[a-f0-9-]{36}$/, 'Provide --version <deployed-version-id> explicitly');
const output = path.join(project, `test-results/light-2026-11-20/deployed-http-${environment}.json`);
const report = { checkedAt: new Date().toISOString(), environment, origin, expectedVersion, method: 'GET only', checks: [], notes: [
  'No purchases, payment-provider calls, recovery operations, heartbeat submissions, or database mutations were requested.',
  'Public GET endpoints can use ordinary edge caches and request-rate counters.',
  isTest ? 'This isolated test Worker intentionally disables checkout and has no moderator key; its anonymous moderation request must fail closed with 503.' : 'Production anonymous moderation was not requested: failed sign-in writes a D1 rate-limit record. The unchanged production runtime hash is verified instead.',
  'HTTP checks do not replace browser interaction testing or a payment test.',
] };
const sha256 = value => createHash('sha256').update(value).digest('hex');
const read = relative => readFile(path.join(project, relative));
async function check(name, callback) {
  try { report.checks.push({ name, passed: true, ...(await callback()) }); }
  catch (error) { report.checks.push({ name, passed: false, error: error.message }); }
}
async function get(url, headers = {}) {
  return fetch(url, { method: 'GET', redirect: 'manual', headers: { 'User-Agent': 'Mozilla/5.0 QofenoReadOnlyReleaseCheck/1.0', ...headers }, signal: AbortSignal.timeout(25000) });
}
const security = {
  'x-content-type-options': 'nosniff', 'x-frame-options': 'DENY', 'referrer-policy': 'no-referrer',
  'strict-transport-security': 'max-age=31536000', 'permissions-policy': 'camera=(), microphone=(), geolocation=()',
};
function secure(response) {
  for (const [key, value] of Object.entries(security)) assert.equal(response.headers.get(key), value, `${key} differs`);
  const csp = response.headers.get('content-security-policy') || '';
  for (const directive of ["default-src 'self'", "script-src 'self'", "object-src 'none'", "frame-ancestors 'none'", "base-uri 'none'", "form-action 'self'"]) assert.ok(csp.includes(directive), `CSP missing ${directive}`);
}
function noIndex(response) { assert.match(response.headers.get('x-robots-tag') || '', /noindex/); }
let home = '';
for (const route of ['/', '/terms', '/privacy', '/refunds', '/contact', '/advertising-policy', '/my-spot', '/owner']) {
  await check(`page ${route}: status, SEO, security, and light stylesheet`, async () => {
    const r = await get(origin + route); const html = await r.text();
    assert.equal(r.status, 200); secure(r);
    assert.equal(r.headers.get('cache-control'), 'no-store');
    assert.match(r.headers.get('content-type') || '', /text\/html/);
    assert.match(html, /<title>[^<]*Qofeno[^<]*<\/title>/);
    assert.match(html, /<meta name="description" content="[^\"]+"/);
    assert.ok(html.includes(`href="${origin + route}"`), 'Canonical URL missing');
    if (isTest) {
      noIndex(r); assert.match(html, /<meta name="robots" content="noindex, nofollow, noarchive"/);
      assert.match(html, /Payment test environment/);
    } else if (['/owner', '/my-spot'].includes(route)) {
      noIndex(r); assert.match(html, /<meta name="robots" content="noindex,nofollow"/);
    } else {
      assert.doesNotMatch(r.headers.get('x-robots-tag') || '', /noindex/);
      assert.match(html, /<meta name="robots" content="index,follow"/);
      assert.doesNotMatch(html, /Payment test environment/);
    }
    const stylesheet = html.match(/\/assets\/qofeno-light-[a-f0-9]+\.css/)?.[0];
    assert.ok(stylesheet, 'Light stylesheet missing');
    if (route === '/') home = html;
    return { status: r.status, stylesheet };
  });
}
await check('server-rendered board includes the owner placement and retires the editorial gallery', async () => {
  assert.match(home, /id="qofeno-placement"/);
  assert.ok(home.includes(HOUSE_PLACEMENT.label));
  assert.ok(home.includes(HOUSE_PLACEMENT.disclosure));
  assert.match(home, /href="https:\/\/loopproof\.me\/">Visit website/);
  assert.doesNotMatch(home, /id="(?:discover|take-a-look)"|\/discover\.xml|editorial discoveries|editorial picks/i);
  if (!isTest) {
    const structured = home.match(/<script type="application\/ld\+json">([\s\S]+?)<\/script>/);
    assert.ok(structured, 'JSON-LD missing from homepage.');
    const graph = JSON.parse(structured[1])['@graph'];
    assert.ok(graph.some(node => node['@type'] === 'FAQPage' && node.mainEntity.length === 7));
  }
});
await check('the retired editorial feed returns 410', async () => {
  const r = await get(origin + '/discover.xml'); secure(r); noIndex(r);
  assert.equal(r.status, 410);
  assert.equal(r.headers.get('cache-control'), 'no-store');
});
await check('status: checkout availability matches the deployment environment', async () => {
  const r = await get(origin + '/api/status'); secure(r); noIndex(r); assert.equal(r.status, 200);
  const value = await r.json(); assert.equal(value.checkoutAvailable, !isTest); assert.equal(value.mode, isTest ? 'unconfigured' : 'live');
  assert.equal(value.unitPrice, 10); assert.equal(value.termDays, 30); assert.equal(value.currency, 'USD');
  return { checkoutAvailable: value.checkoutAvailable, mode: value.mode };
});
await check('public board: valid data contract for the deployment environment', async () => {
  const r = await get(origin + '/api/board'); secure(r); noIndex(r); assert.equal(r.status, 200);
  const value = await r.json(); assert.equal(value.mode, isTest ? 'test' : 'live'); assert.equal(value.checkoutAvailable, !isTest);
  assert.ok(Array.isArray(value.listings)); assert.equal(value.activeCount, value.listings.length);
  assert.ok(Number.isFinite(value.totalActiveSpend) && value.totalActiveSpend >= 0);
  assert.ok(Number.isFinite(value.firstPlaceCost) && value.firstPlaceCost >= 10);
  assert.deepEqual(value.housePlacement, HOUSE_PLACEMENT);
  assert.ok(!value.listings.some(placement => placement.id === HOUSE_PLACEMENT.id));
  return { activeCount: value.activeCount, mode: value.mode };
});
await check('visitor estimates: aggregate-only response', async () => {
  const r = await get(origin + '/api/visitors'); secure(r); noIndex(r); assert.equal(r.status, 200);
  const value = await r.json();
  assert.deepEqual(Object.keys(value).sort(), ['online', 'today', 'month', 'asOf', 'day', 'monthKey', 'startedAt', 'onlineWindowSeconds', 'refreshAfterSeconds', 'timezone', 'metric', 'trackingEnabled'].sort());
  for (const key of ['online', 'today', 'month']) assert.ok(Number.isInteger(value[key]) && value[key] >= 0);
  assert.equal(value.metric, 'estimated_visitors'); assert.equal(value.timezone, 'UTC');
  assert.equal(r.headers.get('cache-control'), 'public, max-age=10');
  return { aggregateOnly: true, metric: value.metric };
});
await check('anonymous purchase session reveals no private records', async () => {
  const r = await get(origin + '/api/session'); secure(r); assert.equal(r.status, 200);
  assert.deepEqual(await r.json(), { paid: false, status: 'none' });
  assert.equal(r.headers.get('cache-control'), 'no-store');
});
if (isTest) await check('anonymous moderator request fails closed', async () => {
  const r = await get(origin + '/api/admin/listings'); secure(r); noIndex(r);
  assert.equal(r.status, 503); assert.deepEqual(await r.json(), { error: 'Moderation access is not configured.' });
  return { status: r.status, reason: 'No moderator key is configured on the isolated test Worker.' };
});
for (const route of ['/.env', '/wrangler.jsonc', '/vendor/production-worker.mjs', '/this-page-does-not-exist', '/api/placements/read-only-missing-placement', '/spot/read-only-missing-placement']) {
  await check(`missing/private resource ${route} returns 404`, async () => {
    const r = await get(origin + route); secure(r); noIndex(r); assert.equal(r.status, 404); await r.arrayBuffer();
    return { status: r.status };
  });
}
await check('missing scripts, styles and fonts return 404 without immutable HTML', async () => {
  for (const extension of ['js', 'css', 'woff2']) {
    const r = await get(`${origin}/assets/qofeno-missing-release-asset.${extension}`);
    assert.equal(r.status, 404);
    assert.doesNotMatch(r.headers.get('cache-control') || '', /immutable/);
    assert.doesNotMatch(await r.text(), /<div[^>]+id="root"/);
  }
});
await check('robots and sitemap follow the environment indexing policy', async () => {
  const robots = await get(origin + '/robots.txt'); assert.equal(robots.status, 200);
  const text = await robots.text();
  const sitemap = await get(origin + '/sitemap.xml');
  if (isTest) {
    noIndex(robots); assert.equal(text, 'User-agent: *\nDisallow: /\n');
    noIndex(sitemap); assert.equal(sitemap.status, 404); await sitemap.arrayBuffer();
  } else {
    assert.match(text, /User-agent: \*\s+Allow: \/\s+Disallow: \/api\/\s+Disallow: \/go\//);
    assert.ok(text.includes(`Sitemap: ${origin}/sitemap.xml`));
    assert.equal(sitemap.status, 200); secure(sitemap);
    assert.ok((await sitemap.text()).includes(`<loc>${origin}/sitemaps/pages.xml</loc>`));
    const pages = await get(origin + '/sitemaps/pages.xml'); assert.equal(pages.status, 200); secure(pages);
    const xml = await pages.text();
    for (const route of ['/', '/terms', '/privacy', '/refunds', '/contact', '/advertising-policy']) assert.ok(xml.includes(`<loc>${origin}${route}</loc>`));
    for (const route of ['/owner', '/my-spot']) assert.ok(!xml.includes(`<loc>${origin}${route}</loc>`));
  }
  return { publicIndexing: !isTest, sitemapStatus: sitemap.status };
});
await check('canonical index and slash redirects', async () => {
  for (const [from, to] of [['/index.html', '/'], ['/terms/', '/terms']]) {
    const r = await get(origin + from); assert.equal(r.status, 308); assert.equal(r.headers.get('location'), origin + to); await r.arrayBuffer();
  }
  if (!isTest) {
    const r = await get('https://www.loopproof.me/'); assert.equal(r.status, 308); assert.equal(r.headers.get('location'), origin + '/'); await r.arrayBuffer();
  }
});
const assetResponses = [];
await check('HTML entry assets have valid integrity hashes', async () => {
  const tags = [...home.matchAll(/<(?:script|link)\b[^>]+(?:src|href)="(\/assets\/[^"\s]+)"[^>]*>/g)];
  assert.equal(tags.length, 5);
  for (const [tag, asset] of tags) {
    const expected = `sha384-${createHash('sha384').update(await read('dist' + asset)).digest('base64')}`;
    assert.ok(tag.includes(`integrity="${expected}"`), `Missing integrity for ${asset}`);
  }
});
await check('deployed assets match the local build and original recovery hashes', async () => {
  assert.ok(home, 'Home page check did not return a document');
  const assets = new Set([...home.matchAll(/(?:src|href)="(\/assets\/[^\"]+)"/g)].map(match => match[1]));
  const theme = [...assets].find(asset => /qofeno-light-/.test(asset));
  const themeResponse = await get(origin + theme); const themeCSS = await themeResponse.text();
  for (const match of themeCSS.matchAll(/url\(['"]?(\/(?:assets|brand)\/[^)'"\s]+)['"]?\)/g)) assets.add(match[1]);
  const recovered = JSON.parse(await read('docs/recovered-assets.json'));
  const originalHashes = new Map(recovered.map(asset => [asset.path, asset.sha256]));
  for (const asset of recovered) {
    if (asset.path !== '/discover.xml') assets.add(asset.path);
  }
  const checked = [];
  for (const asset of assets) {
    const r = await get(origin + asset); assert.equal(r.status, 200, asset);
    assetResponses.push({ asset, response: r });
    const bytes = Buffer.from(await r.arrayBuffer()); const local = await read('dist' + asset);
    assert.equal(sha256(bytes), sha256(local), `${asset} differs from local dist`);
    if (originalHashes.has(asset)) assert.equal(sha256(bytes), originalHashes.get(asset), `${asset} differs from original recovery`);
    checked.push({ path: asset, sha256: sha256(bytes), bytes: bytes.length });
  }
  return { assets: checked };
});
await check('all asset responses preserve security and fingerprint cache headers', async () => {
  assert.ok(assetResponses.length > 0);
  for (const { asset, response } of assetResponses) {
    secure(response);
    if (asset.startsWith('/assets/')) {
      assert.match(response.headers.get('cache-control') || '', /max-age=31536000/);
      assert.match(response.headers.get('cache-control') || '', /immutable/);
    }
  }
  return { assetCount: assetResponses.length };
});

const account = process.env.CLOUDFLARE_ACCOUNT_ID;
const token = process.env.CLOUDFLARE_API_TOKEN;
if (!account || !token) {
  report.notes.push('Cloudflare metadata checks skipped: account/token not provided. No secret values are included in this report.');
} else {
  const apiBase = `https://api.cloudflare.com/client/v4/accounts/${account}/workers/scripts/`;
  const authenticatedGet = endpoint => get(apiBase + endpoint, { Authorization: `Bearer ${token}` });
  function normalizedBindings(bindings) { return [...bindings].sort((a, b) => a.name.localeCompare(b.name)); }
  for (const worker of ['qofeno', 'qofeno-payments-test']) {
    await check(`${worker}: original bindings, secret names, and runtime settings retained`, async () => {
      const r = await authenticatedGet(worker + '/settings'); assert.equal(r.status, 200);
      const current = (await r.json()).result;
      const original = JSON.parse(await readFile(`/workspace/qof-recovery/${worker}/settings.json`, 'utf8')).result;
      assert.deepEqual(normalizedBindings(current.bindings), normalizedBindings(original.bindings), 'Binding metadata changed');
      for (const field of ['compatibility_date', 'compatibility_flags', 'usage_model', 'tail_consumers', 'logpush']) assert.deepEqual(current[field], original[field], `${field} changed`);
      return { bindingCount: current.bindings.length, secretNames: current.bindings.filter(binding => binding.type === 'secret_text').map(binding => binding.name).sort() };
    });
  }
  await check(`${environment} deployment runs the expected version at 100%`, async () => {
    const r = await authenticatedGet(worker + '/deployments'); assert.equal(r.status, 200);
    const value = (await r.json()).result;
    const deployments = Array.isArray(value) ? value : value.deployments;
    assert.ok(Array.isArray(deployments) && deployments.length > 0);
    const newest = [...deployments].sort((a, b) => new Date(b.created_on) - new Date(a.created_on))[0];
    assert.deepEqual(newest.versions.map(({ version_id, percentage }) => ({ version_id, percentage })), [{ version_id: expectedVersion, percentage: 100 }]);
    return { version: expectedVersion, percentage: 100 };
  });
  await check(`deployed ${environment} wrapper uses the unchanged recovered runtime`, async () => {
    const r = await authenticatedGet(worker + '/content/v2'); assert.equal(r.status, 200);
    const form = await r.formData(); const modules = new Map();
    for (const [name, value] of form.entries()) {
      if (typeof value !== 'string' && /\.(?:m?js)$/.test(value.name || name)) modules.set(path.basename(value.name || name), value);
    }
    const expected = ['application.mjs', 'board-presentation.mjs', 'house-placement.mjs', 'index.mjs'];
    assert.deepEqual([...modules.keys()].sort(), expected, 'Unexpected deployed modules');
    for (const filename of expected) {
      const bytes = Buffer.from(await modules.get(filename).arrayBuffer());
      assert.equal(sha256(bytes), sha256(await read(`.release/${environment}/${filename}`)), `Deployed ${filename} differs from the release build`);
    }
    const bytes = Buffer.from(await modules.get('application.mjs').arrayBuffer()); const local = await read(`vendor/${environment}-worker.mjs`);
    assert.equal(sha256(bytes), sha256(local));
    assert.equal(sha256(bytes), isTest ? '202dc7ef27aff0dab856995cf167baf86a1d732f1046db02600fdcbd5d2a02a8' : '229975fca6f15e6be4259c898eff5ed23515281afcc3d5b45df436f73678c53d');
    return { sha256: sha256(bytes), bytes: bytes.length };
  });
}
report.passed = report.checks.every(check => check.passed);
await mkdir(path.dirname(output), { recursive: true });
await writeFile(output, JSON.stringify(report, null, 2) + '\n');
for (const item of report.checks.filter(check => !check.passed)) console.log(`FAIL: ${item.name}: ${item.error}`);
console.log(`${report.checks.filter(check => check.passed).length}/${report.checks.length} read-only deployed HTTP checks passed.`);
console.log(`Report: ${path.relative(project, output)}`);
if (!report.passed) process.exitCode = 1;
