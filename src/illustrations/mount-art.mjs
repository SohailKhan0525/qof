import { drawDiscoveryMark, drawFieldGuide } from './open-web-art.mjs';
import { drawPlacementArt } from './placement-art.mjs';
import { drawUtilityArt } from './utility-art.mjs';

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
const sceneSelector = '[data-interface-illustration] > svg, .visitor-activity-art > svg, .tour-radio-art > svg';
const targetSelector = `.reference-hero, .reference-closing-orbit, ${markSelector}, ${sceneSelector}`;
const placementKinds = { submit: 'submit', review: 'review', ranking: 'ranking', expiry: 'expiry', receipt: 'ticket' };
const utilityKinds = { discover: 'discover', contact: 'message', privacy: 'recovery' };
const canvases = new Map();
const layoutTargets = new WeakMap();

function createCanvas(className) {
  const canvas = document.createElement('canvas');
  canvas.className = className;
  canvas.setAttribute('aria-hidden', 'true');
  return canvas;
}

function paint(canvas) {
  const entry = canvases.get(canvas);
  if (!entry?.active) return;
  const { clientWidth: width, clientHeight: height } = entry.layout;
  if (width < 1 || height < 1) return;

  if (entry.layout !== canvas) {
    canvas.style.width = `${width}px`;
    canvas.style.height = `${height}px`;
  }

  const scale = Math.min(window.devicePixelRatio || 1, 2);
  const pixelWidth = Math.round(width * scale);
  const pixelHeight = Math.round(height * scale);
  if (entry.pixelWidth === pixelWidth && entry.pixelHeight === pixelHeight) return;

  // Resizing resets the bitmap and context, so draw only when the size changes.
  canvas.width = pixelWidth;
  canvas.height = pixelHeight;
  entry.ctx.setTransform(pixelWidth / width, 0, 0, pixelHeight / height, 0, 0);
  try {
    entry.draw(entry.ctx, width, height);
  } catch (error) {
    entry.host.removeAttribute('data-qofeno-drawn');
    console.warn('A Qofeno illustration used its static fallback.', error);
    return;
  }
  entry.pixelWidth = pixelWidth;
  entry.pixelHeight = pixelHeight;
  entry.host.setAttribute('data-qofeno-drawn', '');
}

const resize = typeof ResizeObserver === 'function' ? new ResizeObserver(entries => {
  for (const entry of entries) paint(layoutTargets.get(entry.target));
}) : null;

const approach = typeof IntersectionObserver === 'function' ? new IntersectionObserver(entries => {
  for (const { target, isIntersecting } of entries) {
    if (!isIntersecting) continue;
    const canvas = layoutTargets.get(target);
    const entry = canvases.get(canvas);
    if (entry) {
      entry.active = true;
      paint(canvas);
    }
    approach.unobserve(target);
  }
}, { rootMargin: '160px 0px' }) : null;

function mount(host, canvas, draw, { content = canvas, layout = canvas, kind } = {}) {
  if ([...canvases.values()].some(entry => entry.host === host)) return;
  host.append(content);
  const ctx = canvas.getContext('2d');
  if (!ctx) return;
  const active = layout === canvas || !approach;
  canvases.set(canvas, { ctx, host, draw, layout, kind, active });
  layoutTargets.set(layout, canvas);
  resize.observe(layout);
  if (!active) approach.observe(layout);
  paint(canvas);
}

function forget(canvas) {
  const { host, layout } = canvases.get(canvas);
  resize.unobserve(layout);
  approach?.unobserve(layout);
  layoutTargets.delete(layout);
  canvases.delete(canvas);
  host.removeAttribute('data-qofeno-drawn');
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
  mount(hero, canvas, drawFieldGuide, { content: figure });
}

function mountScene(svg) {
  const host = svg.parentElement;
  const illustration = host.dataset.interfaceIllustration;
  const placementKind = host.matches('.checkout-interface-art') ? 'ticket' : placementKinds[illustration];
  const utilityKind = host.matches('.visitor-activity-art') ? 'visitors'
    : host.matches('.tour-radio-art') ? 'radio' : utilityKinds[illustration];
  const kind = placementKind || utilityKind;
  if (!kind) return;
  const previous = host.querySelector(':scope > .qofeno-scene-canvas');
  const entry = canvases.get(previous);
  if (previous && (!entry || (entry.layout === svg && entry.kind === kind))) return;
  if (entry) {
    forget(previous);
    previous.remove();
  }
  const canvas = createCanvas('qofeno-scene-canvas');
  canvas.dataset.qofenoScene = kind;
  const painter = placementKind ? drawPlacementArt : drawUtilityArt;
  mount(host, canvas, (ctx, width, height) => painter(ctx, width, height, kind), { layout: svg, kind });
}

function refreshArt() {
  for (const [canvas, entry] of canvases) {
    if (!canvas.isConnected || !entry.layout.isConnected) {
      forget(canvas);
      canvas.remove();
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

  for (const svg of root.querySelectorAll(sceneSelector)) mountScene(svg);
}

if (root && resize) {
  let queued = false;
  new MutationObserver(records => {
    if (queued) return;
    const hasNewTarget = records.some(record => record.type === 'attributes' ||
      [...record.addedNodes, ...record.removedNodes].some(node => node instanceof Element &&
        (node.matches(targetSelector) || node.querySelector(targetSelector))));
    if (!hasNewTarget) return;
    queued = true;
    requestAnimationFrame(() => {
      queued = false;
      refreshArt();
    });
  }).observe(root, { childList: true, subtree: true, attributes: true, attributeFilter: ['data-interface-illustration'] });
  refreshArt();
}
