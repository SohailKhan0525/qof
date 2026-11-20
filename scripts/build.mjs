import { cp, mkdir, readFile, writeFile, rm } from 'node:fs/promises';
import { createHash } from 'node:crypto';
await rm('dist',{recursive:true,force:true});
await mkdir('dist',{recursive:true});
await cp('public','dist',{recursive:true});
const sheets=['light-foundation','light-functional','field-guide','editorial-gallery'];let css='';
for(const name of sheets)css+=`\n/* ${name} */\n`+await readFile(`src/styles/${name}.css`,'utf8');
const hash=createHash('sha256').update(css).digest('hex').slice(0,12);
const name=`qofeno-light-${hash}.css`;await mkdir('dist/assets',{recursive:true});await writeFile('dist/assets/'+name,css);
const adapter=await readFile('public/assets/qofeno-accessibility.js','utf8');
const adapterHash=createHash('sha256').update(adapter).digest('hex').slice(0,12);
const adapterName=`qofeno-accessibility-${adapterHash}.js`;
await writeFile('dist/assets/'+adapterName,adapter);
await rm('dist/assets/qofeno-accessibility.js');

async function writeArtworkModule(label, source) {
  const fingerprint = createHash('sha256').update(source).digest('hex').slice(0, 12);
  const file = `qofeno-${label}-${fingerprint}.js`;
  await writeFile(`dist/assets/${file}`, source);
  return file;
}

const artwork = await readFile('src/illustrations/open-web-art.mjs', 'utf8');
const painterFile = await writeArtworkModule('painter', artwork);
const mountSource = await readFile('src/illustrations/mount-art.mjs', 'utf8');
const mountFile = await writeArtworkModule('artwork', mountSource.replace('./open-web-art.mjs', `./${painterFile}`));
const html=(await readFile('index.html','utf8'))
  .replace('<!-- QOFENO_LIGHT_STYLES -->',`<link rel="stylesheet" href="/assets/${name}"/>`)
  .replace('<!-- QOFENO_ACCESSIBILITY -->',`<script defer src="/assets/${adapterName}"></script>`)
  .replace('<!-- QOFENO_ARTWORK -->',`<script type="module" src="/assets/${mountFile}"></script>`);
await writeFile('dist/index.html',html);
console.log(`Built original light theme: ${name}. Recovered application and payment runtime preserved.`);
