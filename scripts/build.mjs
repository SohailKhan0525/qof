import { createHash } from 'node:crypto';
import { cp, mkdir, readFile, readdir, rm, writeFile } from 'node:fs/promises';
import { boardClient } from './board-client.mjs';
import { build } from 'esbuild';

const assetDirectory = 'dist/assets';
const stylesheets = [
  'light-foundation', 'light-functional', 'field-guide', 'top-navigation', 'type-and-layout',
  'whole-web-board', 'hero-shutter', 'process-story', 'process-stage-art', 'board-track',
  'faq-motion', 'closing-motion', 'home-section-motion', 'interaction-layout',
];
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

async function buildMotion(label, entryPoint) {
  const motion = await build({
    entryPoints: [entryPoint],
    bundle: true,
    write: false,
    minify: true,
    platform: 'browser',
    format: 'esm',
    target: 'es2022',
    external: ['./gsap-OWHkPl-m.js'],
    legalComments: 'eof',
  });
  return writeAsset(label, 'js', motion.outputFiles[0].contents);
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
const painterFiles = new Map();
for (const [source, label] of painters) {
  const artwork = await readFile(`src/illustrations/${source}.mjs`, 'utf8');
  const painterFile = await writeAsset(label, 'js', artwork);
  painterFiles.set(`./${source}.mjs`, `./${painterFile}`);
  mountSource = mountSource.replace(`./${source}.mjs`, `./${painterFile}`);
}
const threeLicense = await readFile('node_modules/three/LICENSE', 'utf8');
const placementView = await build({
  entryPoints: ['src/illustrations/placement-view.mjs'],
  bundle: true,
  write: false,
  minify: true,
  platform: 'browser',
  format: 'esm',
  target: 'es2022',
  legalComments: 'none',
  banner: { js: `/*!\n${threeLicense.trimEnd()}\n*/` },
});
const placementViewFile = await writeAsset('placement-3d', 'js', placementView.outputFiles[0].contents);
mountSource = mountSource.replace('./placement-view.mjs', `./${placementViewFile}`);
const housePlacement = await readFile('src/lib/house-placement.mjs', 'utf8');
const houseFile = await writeAsset('house-placement', 'js', housePlacement);
const trackMarkup = await readFile('src/lib/board-track-markup.mjs', 'utf8');
const trackMarkupFile = await writeAsset('board-track-markup', 'js', trackMarkup);
const [navCapsuleFile, heroShutterFile] = await Promise.all([
  buildMotion('nav-capsule', 'src/navigation/velocity-capsule.mjs'),
  buildMotion('hero-shutter', 'src/illustrations/hero-shutter.mjs'),
]);
const processArt = await readFile('src/illustrations/process-stage-art.mjs', 'utf8');
const processArtFile = await writeAsset('process-stage-art', 'js', processArt);
const processStory = await readFile('src/illustrations/process-story.mjs', 'utf8');
const processStoryFile = await writeAsset('process-story', 'js', processStory
  .replace('../navigation/velocity-capsule.mjs', `./${navCapsuleFile}`)
  .replace('./process-stage-art.mjs', `./${processArtFile}`));
mountSource = mountSource.replace('./process-story.mjs', `./${processStoryFile}`);
const motionImports = new Map([
  ...painterFiles,
  ['../navigation/velocity-capsule.mjs', `./${navCapsuleFile}`],
  ['./hero-shutter.mjs', `./${heroShutterFile}`],
]);
for (const name of ['board-track', 'faq-motion', 'closing-motion', 'home-section-motion']) {
  let source = await readFile(`src/illustrations/${name}.mjs`, 'utf8');
  for (const [original, built] of motionImports) source = source.replaceAll(original, built);
  const module = await writeAsset(name, 'js', source);
  mountSource = mountSource.replaceAll(`./${name}.mjs`, `./${module}`);
}
mountSource = mountSource.replace('../navigation/velocity-capsule.mjs', `./${navCapsuleFile}`);
const mountFile = await writeAsset('artwork', 'js', mountSource);
const recoveredClient = await readFile('public/assets/index-SEI-Pf69.js', 'utf8');
const clientFile = await writeAsset('board-client', 'js', boardClient(recoveredClient, houseFile, trackMarkupFile, navCapsuleFile, heroShutterFile));

const assets = await Promise.all([
  script(clientFile, 'type="module"'),
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

const presentation = await readFile('server/board-presentation.mjs', 'utf8');
const wrapper = `import application from './application.mjs';
import { withBoardPresentation } from './board-presentation.mjs';
export default withBoardPresentation(application);
`;
await rm('.release', { recursive: true, force: true });
for (const environment of ['production', 'test']) {
  const directory = `.release/${environment}`;
  await mkdir(directory, { recursive: true });
  await Promise.all([
    cp(`vendor/${environment}-worker.mjs`, `${directory}/application.mjs`),
    writeFile(`${directory}/index.mjs`, wrapper),
    writeFile(`${directory}/board-presentation.mjs`, presentation),
    writeFile(`${directory}/house-placement.mjs`, housePlacement),
    writeFile(`${directory}/board-track-markup.mjs`, trackMarkup),
  ]);
}
console.log(`Built the light design, Canvas artwork and optional Three.js scene: ${styleFile}.`);
