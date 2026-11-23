import gsap from './gsap-OWHkPl-m.js';
import Flip from 'gsap/Flip.js';
import ScrollTrigger from 'gsap/ScrollTrigger.js';

gsap.registerPlugin(ScrollTrigger, Flip);

const minimumDetachSpeed = 180;
const minimumDetachPosition = 48;

export function createNavCapsule(header) {
  const shell = header.querySelector('.qofeno-header-shell');
  const mark = header.querySelector('.qofeno-header-mark');
  const ring = document.createElementNS('http://www.w3.org/2000/svg', 'svg');
  ring.setAttribute('class', 'qofeno-nav-progress');
  ring.setAttribute('viewBox', '0 0 40 40');
  ring.setAttribute('aria-hidden', 'true');
  ring.innerHTML = '<circle cx="20" cy="20" r="18"/><circle class="qofeno-nav-progress-fill" cx="20" cy="20" r="18" pathLength="100" stroke-dasharray="100" stroke-dashoffset="100" transform="rotate(-90 20 20)"/>';
  mark.append(ring);

  function menuOrFocusActive() {
    return header.matches('[data-open="true"], [data-mobile-dialog="true"]') ||
      Boolean(header.querySelector(':focus-visible'));
  }

  function morph(floating, instant = false) {
    const shape = floating ? 'floating' : 'wide';
    if (instant) {
      Flip.killFlipsOf(shell);
      header.dataset.navShape = shape;
      return;
    }
    if (header.dataset.navShape === shape) return;
    const state = Flip.getState(shell, { props: 'borderRadius', simple: true, kill: false });
    Flip.killFlipsOf(shell);
    header.dataset.navShape = shape;
    Flip.from(state, {
      scale: true,
      simple: true,
      duration: floating ? .42 : .16,
      ease: 'power3.out',
    });
  }

  function expandForMenu() {
    if (menuOrFocusActive()) morph(false, true);
  }

  function syncViewport() {
    const width = `${document.documentElement.clientWidth}px`;
    if (header.style.getPropertyValue('--q-nav-viewport') === width) return;
    Flip.killFlipsOf(shell);
    header.style.setProperty('--q-nav-viewport', width);
  }

  syncViewport();
  header.dataset.navShape = 'wide';
  const progress = gsap.fromTo(ring.lastElementChild,
    { strokeDashoffset: 100 },
    { strokeDashoffset: 0, ease: 'none', autoRound: false });
  const trigger = ScrollTrigger.create({
    start: 0,
    end: 'max',
    animation: progress,
    scrub: true,
    onUpdate(self) {
      const active = menuOrFocusActive();
      if (self.direction < 0 || self.scroll() < minimumDetachPosition || active) {
        morph(false, active);
      } else if (self.getVelocity() >= minimumDetachSpeed) {
        morph(true);
      }
    },
    onRefresh(self) {
      if (self.scroll() < minimumDetachPosition) morph(false, true);
    },
  });

  const geometry = new ResizeObserver(() => {
    syncViewport();
    trigger.refresh();
  });
  geometry.observe(document.body);
  const menu = new MutationObserver(expandForMenu);
  menu.observe(header, { attributes: true, attributeFilter: ['data-open', 'data-mobile-dialog'] });
  header.addEventListener('focusin', expandForMenu);

  return {
    dispose() {
      geometry.disconnect();
      menu.disconnect();
      header.removeEventListener('focusin', expandForMenu);
      trigger.kill();
      Flip.killFlipsOf(shell);
      ring.remove();
      header.style.removeProperty('--q-nav-viewport');
      delete header.dataset.navShape;
    },
  };
}
