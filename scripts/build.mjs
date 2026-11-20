import { createHash } from 'node:crypto';
import { cp, mkdir, readFile, readdir, rm, writeFile } from 'node:fs/promises';

const assetDirectory = 'dist/assets';
const stylesheets = ['light-foundation', 'light-functional', 'field-guide', 'editorial-gallery', 'top-navigation', 'type-and-layout'];
const painters = [
  ['open-web-art', 'painter'],
  ['placement-art', 'placement-art'],
  ['utility-art', 'utility-art'],
];

async function writeAsset(label, extension, contents) {
  const fingerprint = createHash('sha256').update(contents).digest('hex').slice(0, 12);
  const file = `qofeno-${label}-${fingerprint}.${extension}`;
  await writeFile(`${assetDirectory}/${file}`, contents);
  return file;
}

async function integrity(file) {
  const bytes = await readFile(`${assetDirectory}/${file}`);
  return `sha384-${createHash('sha384').update(bytes).digest('base64')}`;
}

async function script(file, mode) {
  return `<script ${mode} src="/assets/${file}" integrity="${await integrity(file)}" crossorigin="anonymous"></script>`;
}

async function stylesheet(file) {
  return `<link rel="stylesheet" href="/assets/${file}" integrity="${await integrity(file)}" crossorigin="anonymous"/>`;
}

await rm('dist', { recursive: true, force: true });
await cp('public', 'dist', { recursive: true });
await mkdir(assetDirectory, { recursive: true });

const styles = await Promise.all(stylesheets.map(async name =>
  `/* ${name} */\n${await readFile(`src/styles/${name}.css`, 'utf8')}`));
const styleFile = await writeAsset('light', 'css', styles.join('\n'));
const adapter = await readFile('public/assets/qofeno-accessibility.js', 'utf8');
const adapterFile = await writeAsset('accessibility', 'js', adapter);
await rm(`${assetDirectory}/qofeno-accessibility.js`);

let mountSource = await readFile('src/illustrations/mount-art.mjs', 'utf8');
for (const [source, label] of painters) {
  const artwork = await readFile(`src/illustrations/${source}.mjs`, 'utf8');
  const painterFile = await writeAsset(label, 'js', artwork);
  mountSource = mountSource.replace(`./${source}.mjs`, `./${painterFile}`);
}
const mountFile = await writeAsset('artwork', 'js', mountSource);

const assets = await Promise.all([
  script('index-SEI-Pf69.js', 'type="module"'),
  stylesheet('index-Dm4cACIa.css'),
  stylesheet(styleFile),
  script(adapterFile, 'defer'),
  script(mountFile, 'type="module"'),
]);
const template = await readFile('index.html', 'utf8');
await writeFile('dist/index.html', template.replace('<!-- QOFENO_ASSETS -->', assets.join('\n')));

// Match existing files individually so the CDN cannot cache asset 404s as immutable.
const headers = await readFile('public/_headers', 'utf8');
const assetFiles = (await readdir(assetDirectory)).sort();
const assetCache = assetFiles.map(file =>
  `/assets/${file}\n  Cache-Control: public, max-age=31536000, immutable`);
await writeFile('dist/_headers', `${headers.trimEnd()}\n\n${assetCache.join('\n\n')}\n`);
console.log(`Built light design and animated Canvas artwork with integrity-checked entry assets: ${styleFile}.`);
