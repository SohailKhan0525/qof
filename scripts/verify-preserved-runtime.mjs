import assert from 'node:assert/strict';
import { createHash } from 'node:crypto';
import { mkdir, readFile, readdir, stat, writeFile } from 'node:fs/promises';
import path from 'node:path';

// Offline provenance and configuration checks. This script makes no API,
// database, payment or visitor-recording requests, and reads no credentials.
const project = process.cwd();
const output = path.join(project, 'test-results/recovery/runtime-verification.json');
const report = { checkedAt: new Date().toISOString(), checks: [], counts: {} };
const digest = data => createHash('sha256').update(data).digest('hex');
const read = file => readFile(path.join(project, file));
const json = async file => JSON.parse((await read(file)).toString());
async function check(name, run) {
  try {
    await run();
    report.checks.push({ name, passed: true });
    console.log(`PASS ${name}`);
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error);
    report.checks.push({ name, passed: false, message });
    console.error(`FAIL ${name}: ${message}`);
  }
}
async function walk(directory) {
  const files = [];
  for (const entry of await readdir(directory, { withFileTypes: true })) {
    const file = path.join(directory, entry.name);
    if (entry.isDirectory()) files.push(...await walk(file));
    else if (entry.isFile()) files.push(file);
  }
  return files;
}
const originalModules = {
  'vendor/production-worker.mjs': '229975fca6f15e6be4259c898eff5ed23515281afcc3d5b45df436f73678c53d',
  'vendor/test-worker.mjs': '202dc7ef27aff0dab856995cf167baf86a1d732f1046db02600fdcbd5d2a02a8',
};
for (const [file, expected] of Object.entries(originalModules)) {
  await check(`${file} is byte-identical to the published Worker`, async () => {
    assert.ok(digest(await read(file)) === expected, 'Published Worker hash differs; investigate before deployment.');
  });
}

let manifest;
await check('recovery manifest has safe, unique asset paths', async () => {
  manifest = await json('docs/recovered-assets.json');
  assert.ok(Array.isArray(manifest) && manifest.length > 0, 'Missing recovery manifest entries.');
  const paths = new Set();
  for (const item of manifest) {
    assert.ok(typeof item.path === 'string' && item.path.startsWith('/') && !item.path.startsWith('//'), 'Unexpected manifest path.');
    assert.ok(!item.path.split('/').includes('..') && !item.path.includes('\\'), 'Unsafe manifest path.');
    assert.ok(!paths.has(item.path), 'Duplicate manifest path.');
    assert.ok(/^[a-f0-9]{64}$/.test(item.sha256) && Number.isSafeInteger(item.bytes) && item.bytes >= 0, 'Invalid recovery hash or byte count.');
    paths.add(item.path);
  }
  report.counts.originalAssets = manifest.length;
});
if (manifest) {
  for (const directory of ['public', 'dist']) {
    await check(`all original assets in ${directory} match the recovery hashes`, async () => {
      for (const item of manifest) {
        const bytes = await read(`${directory}${item.path}`);
        assert.ok(bytes.length === item.bytes && digest(bytes) === item.sha256, `Recovered asset changed: ${directory}${item.path}`);
      }
    });
  }
}

// Covers imports, Vite's dependency maps, CSS url(), and local image/font
// strings. External/data URLs are intentionally outside this offline check.
const assetReference = /["'`(]((?:\.\/|\/|assets\/)[^\s"'`()<>]+?\.(?:js|css|woff2?|ttf|otf|png|jpe?g|webp|avif|gif|svg|ico|mp4))(?:[?#][^\s"'`()<>]*)?["'`)]/g;
for (const directory of ['public', 'dist']) {
  await check(`${directory} local JS/CSS/HTML asset references resolve`, async () => {
    const root = path.join(project, directory);
    const files = (await walk(root)).filter(file => /\.(?:js|css|html)$/.test(file));
    const edges = new Set();
    for (const file of files) {
      const content = await readFile(file, 'utf8');
      for (const [, reference] of content.matchAll(assetReference)) {
        if (reference.startsWith('//')) continue;
        const resolved = reference.startsWith('/') ? path.join(root, reference.slice(1))
          : reference.startsWith('assets/') ? path.join(root, reference)
            : path.resolve(path.dirname(file), reference);
        assert.ok(resolved.startsWith(root + path.sep), 'Asset reference escapes public root.');
        assert.ok((await stat(resolved)).isFile(), `Missing asset from ${path.relative(root, file)}: ${reference}`);
        edges.add(`${path.relative(root, file)} -> ${reference}`);
      }
    }
    report.counts[`${directory}ReferenceEdges`] = edges.size;
  });
}
await check('source theme asset references resolve in public', async () => {
  const files = (await walk(path.join(project, 'src/styles'))).filter(file => file.endsWith('.css'));
  let count = 0;
  for (const file of files) {
    for (const [, reference] of (await readFile(file, 'utf8')).matchAll(assetReference)) {
      if (!reference.startsWith('/') || reference.startsWith('//')) continue;
      assert.ok((await stat(path.join(project, 'public', reference.slice(1)))).isFile(), 'Theme references a missing public asset.');
      count++;
    }
  }
  report.counts.sourceThemeReferences = count;
});

const expected = [
  {
    file: 'wrangler.jsonc', name: 'qofeno', main: 'vendor/production-worker.mjs', dev: false,
    origin: 'https://loopproof.me', mode: 'live_mode', checkout: 'true',
    databases: { DB: ['03cb6051-5e2f-4953-9cc5-a5b08832e8d7', 'qofeno-canvas'], VISITOR_DB: ['1cc78552-dc49-46b9-844e-f2c664353331', 'qofeno-visitor-stats'] },
    namespaces: { PUBLIC_READ_LIMITER: '10812001', SENSITIVE_REQUEST_LIMITER: '10812002', VISITOR_RATE_LIMITER: '10812101' },
  },
  {
    file: 'wrangler.payments-test.jsonc', name: 'qofeno-payments-test', main: 'vendor/test-worker.mjs', dev: true,
    origin: 'https://qofeno-payments-test.sohailkhannn-0525.workers.dev', mode: 'test_mode', checkout: 'false',
    databases: { DB: ['252c616d-56f8-4221-bd66-a39f65823269', 'qofeno-payments-test'], VISITOR_DB: ['02173d49-e80c-4e98-b5fe-d2f4cb17b3e6', 'qofeno-visitor-stats-test'] },
    namespaces: { PUBLIC_READ_LIMITER: '10812011', SENSITIVE_REQUEST_LIMITER: '10812012', VISITOR_RATE_LIMITER: '10812111' },
  },
];
for (const contract of expected) {
  await check(`${contract.file} preserves routing, bindings and payment isolation`, async () => {
    // These checked-in .jsonc files intentionally use comment-free JSON.
    const config = await json(contract.file);
    assert.ok(config.name === contract.name && config.main === contract.main, 'Worker name or entrypoint changed.');
    assert.ok(config.no_bundle === true && config.find_additional_modules === false, 'Compiled Worker must not be rebuilt or discover other modules.');
    assert.ok(config.compatibility_date === '2026-10-01' && JSON.stringify(config.compatibility_flags) === '["nodejs_compat"]', 'Compatibility settings changed.');
    assert.ok(config.workers_dev === contract.dev && config.preview_urls === false, 'Worker URL exposure differs.');
    assert.ok(config.assets?.directory === 'dist' && config.assets?.binding === 'ASSETS', 'Asset binding changed.');
    assert.ok(config.assets?.not_found_handling === 'single-page-application', 'SPA handling changed.');
    assert.ok(JSON.stringify(config.assets?.run_worker_first) === '["/*","!/assets/*"]', 'Worker-first routes changed.');
    assert.ok(config.d1_databases?.length === 2, 'D1 binding count changed.');
    for (const [binding, [id, name]] of Object.entries(contract.databases)) {
      const actual = config.d1_databases.find(item => item.binding === binding);
      assert.ok(actual?.database_id === id && actual?.database_name === name, `Incorrect ${binding} destination.`);
    }
    assert.ok(config.ratelimits?.length === 3, 'Native rate limiter count changed.');
    for (const [name, namespace] of Object.entries(contract.namespaces)) {
      const limiter = config.ratelimits.find(item => item.name === name);
      const limit = name === 'PUBLIC_READ_LIMITER' ? 240 : name === 'SENSITIVE_REQUEST_LIMITER' ? 20 : 60;
      assert.ok(limiter?.namespace_id === namespace && limiter.simple?.limit === limit && limiter.simple?.period === 60, `Incorrect ${name} configuration.`);
    }
    const vars = config.vars || {};
    assert.ok(vars.PUBLIC_SITE_URL === contract.origin && vars.DODO_ENVIRONMENT === contract.mode && vars.CHECKOUT_ENABLED === contract.checkout, 'Payment mode or canonical origin differs.');
    assert.ok(vars.REQUIRE_REQUEST_PROTECTION === 'true' && vars.VISITOR_TRACKING_ENABLED === 'true', 'Request protection or visitor configuration differs.');
    const keys = ['CHECKOUT_ENABLED', 'DODO_ENVIRONMENT', 'PUBLIC_SITE_URL', 'REQUIRE_REQUEST_PROTECTION', 'VISITOR_TRACKING_ENABLED'];
    if (contract.name === 'qofeno') {
      keys.push('DODO_COMPATIBLE_PRODUCT_IDS');
      assert.ok(vars.DODO_COMPATIBLE_PRODUCT_IDS === 'pdt_0NrVusxIHDAL6149udYWe', 'Legacy payment compatibility changed.');
      assert.ok(JSON.stringify(config.routes) === JSON.stringify([{ pattern: 'loopproof.me', custom_domain: true }, { pattern: 'www.loopproof.me', custom_domain: true }]), 'Production domain routes changed.');
    } else assert.ok(!config.routes?.length, 'Test Worker must not take production routes.');
    assert.ok(JSON.stringify(Object.keys(vars).sort()) === JSON.stringify(keys.sort()), 'Unexpected variables: keep credentials in Worker secrets, not this configuration.');
    assert.ok(JSON.stringify(config.triggers?.crons) === '["17 * * * *"]', 'Cleanup schedule changed.');
  });
}

await check('asset security and fingerprinted caching headers are restored', async () => {
  const headers = (await read('public/_headers')).toString();
  const rules = new Map(); let current;
  for (const line of headers.split(/\r?\n/)) {
    if (!line.trim() || line.trimStart().startsWith('#')) continue;
    if (!/^\s/.test(line)) { current = line.trim(); rules.set(current, new Map()); continue; }
    const separator = line.indexOf(':');
    assert.ok(current && separator > 0, 'Invalid header rule syntax.');
    rules.get(current).set(line.slice(0, separator).trim().toLowerCase(), line.slice(separator + 1).trim());
  }
  const global = rules.get('/*');
  const expectedHeaders = {
    'content-security-policy': "default-src 'self'; script-src 'self'; style-src 'self' 'unsafe-inline'; img-src 'self' data:; font-src 'self'; connect-src 'self'; object-src 'none'; frame-ancestors 'none'; base-uri 'none'; form-action 'self'",
    'permissions-policy': 'camera=(), microphone=(), geolocation=()',
    'referrer-policy': 'no-referrer', 'x-content-type-options': 'nosniff',
    'x-frame-options': 'DENY', 'strict-transport-security': 'max-age=31536000',
  };
  for (const [header, value] of Object.entries(expectedHeaders)) assert.ok(global?.get(header) === value, `Global asset ${header} differs from the deployed baseline.`);
  assert.ok(rules.get('/assets/*')?.get('cache-control') === 'public, max-age=31536000, immutable', 'Fingerprint asset cache rule missing.');
  assert.ok((await read('dist/_headers')).equals(await read('public/_headers')), 'Build has stale asset headers.');
});
await check('deployment command preserves dashboard variables', async () => {
  const pkg = await json('package.json');
  assert.ok(/wrangler deploy\b.*--keep-vars\b/.test(pkg.scripts?.deploy || ''), 'Deployment command must include --keep-vars.');
  assert.ok(pkg.devDependencies?.wrangler === '4.156.2', 'Review preservation semantics before changing Wrangler version.');
});

report.passed = report.checks.every(item => item.passed);
await mkdir(path.dirname(output), { recursive: true });
await writeFile(output, JSON.stringify(report, null, 2) + '\n');
console.log(`${report.checks.filter(item => item.passed).length}/${report.checks.length} preservation checks passed.`);
console.log(`Report: ${path.relative(project, output)}`);
if (!report.passed) process.exitCode = 1;
