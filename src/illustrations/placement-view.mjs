import { ACESFilmicToneMapping, SRGBColorSpace, WebGLRenderer } from 'three';
import { createPlacementSculpture } from './placement-sculpture.mjs';

const maxPixels = 500_000;
const maxDensity = 1.75;
const maxTilt = .14;

export function mountPlacementSculpture(host) {
  const canvas = document.createElement('canvas');
  canvas.className = 'qofeno-placement-scene';
  canvas.setAttribute('aria-hidden', 'true');
  const attributes = { alpha: true, antialias: true, powerPreference: 'low-power' };
  const context = canvas.getContext('webgl2', attributes);
  if (!context) return;

  let renderer;
  let sculpture;
  try {
    renderer = new WebGLRenderer({ canvas, context, ...attributes });
    sculpture = createPlacementSculpture();
  } catch (error) {
    renderer?.dispose();
    renderer?.forceContextLoss();
    throw error;
  }

  renderer.outputColorSpace = SRGBColorSpace;
  renderer.toneMapping = ACESFilmicToneMapping;
  renderer.toneMappingExposure = 1.16;
  renderer.setClearColor(0x000000, 0);
  host.append(canvas);

  const { scene, camera, pivot, fit } = sculpture;
  const reducedMotion = matchMedia('(prefers-reduced-motion: reduce)');
  let visible = false;
  let lost = false;
  let disposed = false;
  let frame = 0;
  let previousTime = null;
  let width = 0;
  let height = 0;
  let density = 0;
  let targetX = 0;
  let targetY = 0;
  if (!reducedMotion.matches) pivot.rotation.set(-.09, -.17, 0);

  function stopFrame() {
    cancelAnimationFrame(frame);
    frame = 0;
    previousTime = null;
  }

  function requestFrame() {
    if (!frame && visible && !lost && !disposed && width && height && !document.hidden) {
      frame = requestAnimationFrame(render);
    }
  }

  function render(time) {
    frame = 0;
    if (!visible || lost || disposed || document.hidden) return;
    const elapsed = Math.min(time - (previousTime ?? time - 16), 45);
    const interpolation = 1 - Math.exp(-elapsed / 112);
    previousTime = time;
    const moving = !reducedMotion.matches &&
      Math.hypot(targetX - pivot.rotation.x, targetY - pivot.rotation.y) > .001;
    if (moving) {
      pivot.rotation.x += (targetX - pivot.rotation.x) * interpolation;
      pivot.rotation.y += (targetY - pivot.rotation.y) * interpolation;
    } else {
      pivot.rotation.x = targetX;
      pivot.rotation.y = targetY;
      previousTime = null;
    }

    try {
      renderer.render(scene, camera);
      if (!context.isContextLost()) host.dataset.qofenoSculpture = 'ready';
    } catch (error) {
      dispose();
      console.warn('Qofeno is using the static placement artwork.', error);
      return;
    }
    if (moving) requestFrame();
  }

  function resize() {
    const nextWidth = host.clientWidth;
    const nextHeight = host.clientHeight;
    if (!nextWidth || !nextHeight) return;
    const nextDensity = Math.min(devicePixelRatio || 1, maxDensity, Math.sqrt(maxPixels / (nextWidth * nextHeight)));
    if (nextWidth === width && nextHeight === height && nextDensity === density) return;
    width = nextWidth;
    height = nextHeight;
    density = nextDensity;
    fit(width / height);
    renderer.setPixelRatio(density);
    renderer.setSize(width, height, false);
    requestFrame();
  }

  function tilt(event) {
    if (reducedMotion.matches || event.pointerType === 'touch') return;
    const bounds = host.getBoundingClientRect();
    const x = (event.clientX - bounds.left) / bounds.width - .5;
    const y = (event.clientY - bounds.top) / bounds.height - .5;
    targetX = Math.max(-maxTilt, Math.min(maxTilt, y * maxTilt * 2));
    targetY = Math.max(-maxTilt, Math.min(maxTilt, x * maxTilt * 2));
    requestFrame();
  }

  function settle() {
    targetX = 0;
    targetY = 0;
    requestFrame();
  }

  function visibilityChange() {
    if (document.hidden) stopFrame();
    else requestFrame();
  }

  function contextLost(event) {
    event.preventDefault();
    lost = true;
    stopFrame();
    delete host.dataset.qofenoSculpture;
  }

  function contextRestored() {
    lost = false;
    requestFrame();
  }

  const observer = new IntersectionObserver(([entry]) => {
    visible = entry.isIntersecting;
    if (visible) requestFrame();
    else stopFrame();
  });
  const sizeObserver = new ResizeObserver(resize);

  function dispose() {
    if (disposed) return;
    disposed = true;
    stopFrame();
    sizeObserver.disconnect();
    observer.disconnect();
    reducedMotion.removeEventListener('change', settle);
    document.removeEventListener('visibilitychange', visibilityChange);
    window.removeEventListener('resize', resize);
    host.removeEventListener('pointermove', tilt);
    host.removeEventListener('pointerleave', settle);
    canvas.removeEventListener('webglcontextlost', contextLost);
    canvas.removeEventListener('webglcontextrestored', contextRestored);
    delete host.dataset.qofenoSculpture;
    canvas.remove();
    sculpture.dispose();
    renderer.dispose();
    renderer.forceContextLoss();
  }

  observer.observe(host);
  sizeObserver.observe(host);
  reducedMotion.addEventListener('change', settle);
  document.addEventListener('visibilitychange', visibilityChange);
  window.addEventListener('resize', resize, { passive: true });
  host.addEventListener('pointermove', tilt, { passive: true });
  host.addEventListener('pointerleave', settle);
  canvas.addEventListener('webglcontextlost', contextLost);
  canvas.addEventListener('webglcontextrestored', contextRestored);
  resize();
  return dispose;
}
