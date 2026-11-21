import { drawFieldGuide } from './open-web-art.mjs';
import { drawPlacementArt } from './placement-art.mjs';
import { drawUtilityArt } from './utility-art.mjs';

const root = document.getElementById('root');
const sceneSelector = '[data-interface-illustration] > svg, .visitor-activity-art > svg';
const sculptureSelector = '.house-placement-art';
const targetSelector = `.reference-hero, .reference-closing-orbit, ${sceneSelector}, ${sculptureSelector}`;
const placementKinds = { submit: 'submit', review: 'review', ranking: 'ranking', expiry: 'expiry', receipt: 'ticket' };
const utilityKinds = { discover: 'discover', contact: 'message', privacy: 'recovery' };
const canvases = new Map();
const layoutTargets = new WeakMap();
const moving = new Set();
const frameInterval = 1000 / 30;
let animationFrame = 0;
let sculptureHost;
let stopSculpture;

function watchSculpture(host) {
  if (navigator.connection?.saveData || typeof WebGL2RenderingContext === 'undefined' ||
      typeof IntersectionObserver === 'undefined') return;
  let active = true;
  let dispose;
  const observer = new IntersectionObserver(async ([entry]) => {
    if (!entry.isIntersecting) return;
    observer.disconnect();
    try {
      const { mountPlacementSculpture } = await import('./placement-view.mjs');
      if (active && host.isConnected) dispose = mountPlacementSculpture(host);
    } catch (error) {
      console.warn('Qofeno is using the static placement artwork.', error);
    }
  }, { rootMargin: '100px 0px' });
  observer.observe(host);
  return () => {
    active = false;
    observer.disconnect();
    dispose?.();
  };
}

function createCanvas(className) {
  const canvas = document.createElement('canvas');
  canvas.className = className;
  canvas.setAttribute('aria-hidden', 'true');
  return canvas;
}

function paint(canvas, force = false) {
  const entry = canvases.get(canvas);
  if (!entry?.active || entry.failed) return;
  // ResizeObserver owns layout reads. Animation frames reuse the last measured size.
  if (!force || !entry.painted) {
    entry.width = entry.layout.clientWidth;
    entry.height = entry.layout.clientHeight;
    entry.scale = Math.min(window.devicePixelRatio || 1, 2);
  }
  const { width, height, scale } = entry;
  if (width < 1 || height < 1) return;

  if (!force && entry.layout !== canvas) {
    canvas.style.width = `${width}px`;
    canvas.style.height = `${height}px`;
  }

  const pixelWidth = Math.round(width * scale);
  const pixelHeight = Math.round(height * scale);
  const resized = canvas.width !== pixelWidth || canvas.height !== pixelHeight;
  if (!force && !resized && entry.painted) return;

  // Only resize the bitmap when layout changes. Every animation frame draws into it.
  if (resized) {
    canvas.width = pixelWidth;
    canvas.height = pixelHeight;
  }
  entry.ctx.setTransform(pixelWidth / width, 0, 0, pixelHeight / height, 0, 0);
  try {
    entry.draw(entry.ctx, width, height, entry.elapsed / entry.duration);
  } catch (error) {
    entry.failed = true;
    moving.delete(canvas);
    entry.host.removeAttribute('data-qofeno-drawn');
    console.warn('A Qofeno illustration used its static fallback.', error);
    return;
  }
  if (!entry.painted) {
    entry.painted = true;
    entry.host.setAttribute('data-qofeno-drawn', '');
    entry.host.dataset.qofenoArtPhase = 'ready';
  }
}

const resize = typeof ResizeObserver === 'function' ? new ResizeObserver(entries => {
  for (const entry of entries) syncMotion(layoutTargets.get(entry.target));
}) : null;

const viewport = typeof IntersectionObserver === 'function' ? new IntersectionObserver(entries => {
  for (const { target, isIntersecting } of entries) {
    const canvas = layoutTargets.get(target);
    const entry = canvases.get(canvas);
    if (!entry) continue;
    entry.inViewport = isIntersecting;
    syncMotion(canvas);
  }
}, { threshold: .1 }) : null;

function scheduleFrame() {
  if (!animationFrame && moving.size && !document.hidden) {
    animationFrame = requestAnimationFrame(animate);
  }
}

function animate(time) {
  animationFrame = 0;
  if (document.hidden) return;
  // Bound concurrent drawing work when several cards share one viewport.
  for (const canvas of [...moving].slice(0, 3)) {
    const entry = canvases.get(canvas);
    if (entry.host.dataset.qofenoArtPhase !== 'drawing') entry.host.dataset.qofenoArtPhase = 'drawing';
    entry.lastFrame ??= time;
    const delta = time - entry.lastFrame;
    if (delta < frameInterval - 1) continue;
    entry.lastFrame = time;
    entry.elapsed = Math.min(entry.elapsed + Math.min(delta, 70), entry.duration);
    paint(canvas, true);
    if (entry.elapsed === entry.duration) {
      moving.delete(canvas);
      entry.host.dataset.qofenoArtPhase = 'settled';
    }
  }
  scheduleFrame();
}

function syncMotion(canvas) {
  const entry = canvases.get(canvas);
  if (!entry) return;
  const visible = entry.inViewport && !document.hidden &&
    !entry.host.closest('[inert], dialog:not([open]), .qofeno-navigation-panel[data-open="false"]');
  entry.active ||= visible;
  paint(canvas);
  if (!visible || !entry.painted || entry.failed || entry.elapsed === entry.duration) {
    if (moving.delete(canvas)) {
      entry.lastFrame = null;
      entry.host.dataset.qofenoArtPhase = 'paused';
    }
    return;
  }
  moving.add(canvas);
  scheduleFrame();
}

function mount(host, canvas, draw, { content = canvas, layout = canvas, kind, duration = 1260 } = {}) {
  if ([...canvases.values()].some(entry => entry.host === host)) return;
  host.append(content);
  const ctx = canvas.getContext('2d');
  if (!ctx) return;
  const active = layout === canvas || !viewport;
  canvases.set(canvas, { ctx, host, draw, layout, kind, active, duration, elapsed: 0, inViewport: !viewport });
  layoutTargets.set(layout, canvas);
  resize.observe(layout);
  viewport?.observe(layout);
  syncMotion(canvas);
}

function forget(canvas) {
  const { host, layout } = canvases.get(canvas);
  resize.unobserve(layout);
  viewport?.unobserve(layout);
  layoutTargets.delete(layout);
  moving.delete(canvas);
  canvases.delete(canvas);
  host.removeAttribute('data-qofeno-drawn');
  host.removeAttribute('data-qofeno-art-phase');
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
  link.href = '#qofeno-placement';
  link.className = 'qofeno-field-guide-link';
  link.textContent = 'View Qofeno’s placement';
  const arrow = document.createElement('span');
  arrow.setAttribute('aria-hidden', 'true');
  arrow.textContent = '↓';
  link.append(arrow);
  caption.append(link);
  figure.append(frame, caption);
  mount(hero, canvas, drawFieldGuide, { content: figure, duration: 1580 });
}

function mountScene(svg) {
  const host = svg.parentElement;
  const illustration = host.dataset.interfaceIllustration;
  const placementKind = host.matches('.checkout-interface-art') ? 'ticket' : placementKinds[illustration];
  const utilityKind = host.matches('.visitor-activity-art') ? 'visitors' : utilityKinds[illustration];
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
  mount(host, canvas, (ctx, width, height, progress) => painter(ctx, width, height, kind, progress), { layout: svg, kind });
}

function refreshArt() {
  const nextSculpture = root.querySelector(sculptureSelector);
  if (nextSculpture !== sculptureHost) {
    stopSculpture?.();
    sculptureHost = nextSculpture;
    stopSculpture = nextSculpture ? watchSculpture(nextSculpture) : null;
  }

  for (const [canvas, entry] of canvases) {
    if (!canvas.isConnected || !entry.layout.isConnected) {
      forget(canvas);
      canvas.remove();
    }
  }
  const hero = root.querySelector('.reference-hero');
  if (hero && root.querySelector('#qofeno-placement') && !hero.querySelector('.qofeno-field-guide')) {
    mountHero(hero);
  }

  const closing = root.querySelector('.reference-closing-orbit');
  if (closing && !closing.querySelector('.qofeno-closing-canvas')) {
    mount(closing, createCanvas('qofeno-closing-canvas'), (ctx, width, height, progress) =>
      drawFieldGuide(ctx, width, height, progress, { variant: 'closing' }));
  }

  for (const svg of root.querySelectorAll(sceneSelector)) mountScene(svg);
  for (const canvas of canvases.keys()) syncMotion(canvas);
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
  }).observe(root, { childList: true, subtree: true, attributes: true, attributeFilter: ['data-interface-illustration', 'data-open', 'inert', 'open'] });
  document.addEventListener('visibilitychange', () => {
    if (document.hidden && animationFrame) {
      cancelAnimationFrame(animationFrame);
      animationFrame = 0;
    }
    for (const canvas of canvases.keys()) syncMotion(canvas);
  });
  refreshArt();
}
