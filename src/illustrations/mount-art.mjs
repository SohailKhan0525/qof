import { drawDiscoveryMark, drawFieldGuide } from './open-web-art.mjs';

const root = document.getElementById('root');
const markKinds = {
  'public-domain-review': 'archive',
  'standard-ebooks': 'books',
  'radio-garden': 'radio',
  'window-swap': 'window',
  'fonts-in-use': 'type',
  'neal-fun': 'play',
};
const markSelector = '.discovery-row[data-placement-id] .discovery-monogram';
const targetSelector = `.reference-hero, .reference-closing-orbit, ${markSelector}`;
const canvases = new Map();

function createCanvas(className) {
  const canvas = document.createElement('canvas');
  canvas.className = className;
  canvas.setAttribute('aria-hidden', 'true');
  return canvas;
}

function paint(canvas) {
  const entry = canvases.get(canvas);
  const { width, height } = canvas.getBoundingClientRect();
  if (!entry || width < 1 || height < 1) return;

  const scale = Math.min(window.devicePixelRatio || 1, 2);
  const pixelWidth = Math.round(width * scale);
  const pixelHeight = Math.round(height * scale);
  if (entry.pixelWidth === pixelWidth && entry.pixelHeight === pixelHeight) return;

  // Resizing resets the bitmap and context, so draw only when the size changes.
  canvas.width = pixelWidth;
  canvas.height = pixelHeight;
  entry.ctx.setTransform(pixelWidth / width, 0, 0, pixelHeight / height, 0, 0);
  entry.draw(entry.ctx, width, height);
  entry.pixelWidth = pixelWidth;
  entry.pixelHeight = pixelHeight;
  entry.host.setAttribute('data-qofeno-drawn', '');
}

const resize = new ResizeObserver(entries => {
  for (const entry of entries) paint(entry.target);
});

function mount(host, canvas, draw, content = canvas) {
  if ([...canvases.values()].some(entry => entry.host === host)) return;
  host.append(content);
  const ctx = canvas.getContext('2d');
  if (!ctx) return;
  canvases.set(canvas, { ctx, host, draw });
  resize.observe(canvas);
  paint(canvas);
}

function mountHero(hero) {
  const figure = document.createElement('figure');
  figure.className = 'qofeno-field-guide';
  const frame = document.createElement('div');
  frame.className = 'qofeno-field-guide-frame';
  const canvas = createCanvas('qofeno-field-guide-canvas');
  frame.append(canvas);
  const caption = document.createElement('figcaption');
  const link = document.createElement('a');
  link.href = '#discover';
  link.className = 'qofeno-field-guide-link';
  link.textContent = 'Browse editorial picks';
  const arrow = document.createElement('span');
  arrow.setAttribute('aria-hidden', 'true');
  arrow.textContent = '↓';
  link.append(arrow);
  caption.append(link);
  figure.append(frame, caption);
  mount(hero, canvas, drawFieldGuide, figure);
}

function refreshArt() {
  for (const [canvas] of canvases) {
    if (!canvas.isConnected) {
      resize.unobserve(canvas);
      canvases.delete(canvas);
    }
  }
  const hero = root.querySelector('.reference-hero');
  if (hero && root.querySelector('.editorial-discovery') && !hero.querySelector('.qofeno-field-guide')) {
    mountHero(hero);
  }

  const closing = root.querySelector('.reference-closing-orbit');
  if (closing && !closing.querySelector('.qofeno-closing-canvas')) {
    mount(closing, createCanvas('qofeno-closing-canvas'), (ctx, width, height) =>
      drawFieldGuide(ctx, width, height, 1, { variant: 'closing' }));
  }

  for (const mark of root.querySelectorAll(markSelector)) {
    const kind = markKinds[mark.closest('.discovery-row').dataset.placementId];
    if (!kind || mark.querySelector('.qofeno-discovery-canvas')) continue;
    mark.dataset.qofenoKind = kind;
    mount(mark, createCanvas('qofeno-discovery-canvas'), (ctx, width, height) =>
      drawDiscoveryMark(ctx, width, height, kind));
  }
}

if (root && typeof ResizeObserver !== 'undefined') {
  let queued = false;
  new MutationObserver(records => {
    if (queued) return;
    const hasNewTarget = records.some(record =>
      [...record.addedNodes, ...record.removedNodes].some(node => node instanceof Element &&
        (node.matches(targetSelector) || node.querySelector(targetSelector))));
    if (!hasNewTarget) return;
    queued = true;
    requestAnimationFrame(() => {
      queued = false;
      refreshArt();
    });
  }).observe(root, { childList: true, subtree: true });
  refreshArt();
}
