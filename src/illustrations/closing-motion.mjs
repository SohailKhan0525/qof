import { gsap, ScrollTrigger } from '../navigation/velocity-capsule.mjs';
import { CustomEase } from './hero-shutter.mjs';

const openingEase = CustomEase.create('qofenoClosingOpen', 'M0,0 C0.32,0 0.18,1 1,1');

export function mountClosingMotion(section) {
  const art = section.querySelector('.reference-closing-orbit');
  if (!art || !globalThis.CSS?.supports('clip-path', 'inset(4% round 24px)')) return () => {};

  const layout = section.closest('main') ?? section.ownerDocument.body;
  let resize;
  let refreshFrame = 0;
  const context = gsap.context(() => {
    const opening = gsap.timeline({ defaults: { ease: openingEase }, paused: true });

    opening.fromTo(section, {
      clipPath: 'inset(4% 4% 4% 4% round 24px)',
      '--q-closing-scale': .92,
      '--q-closing-radius': '24px',
      '--q-closing-tone': .73,
    }, {
      clipPath: 'inset(0% 0% 0% 0% round 0px)',
      '--q-closing-scale': 1,
      '--q-closing-radius': '0px',
      '--q-closing-tone': 1,
      duration: 1,
    }, 0);

    opening.fromTo(art, { opacity: .72, y: 15, scale: .96 }, {
      opacity: 1,
      y: 0,
      scale: 1,
      duration: 1,
    }, 0);

    const trigger = ScrollTrigger.create({
      trigger: section,
      animation: opening,
      start: 'top 94%',
      end: 'top 41%',
      scrub: true,
    });

    // A lazy-loaded process or opened FAQ can move this banner before it enters view.
    if (typeof ResizeObserver === 'function') {
      resize = new ResizeObserver(() => {
        cancelAnimationFrame(refreshFrame);
        refreshFrame = requestAnimationFrame(() => trigger.refresh());
      });
      resize.observe(layout);
    }
  }, section);

  return () => {
    resize?.disconnect();
    cancelAnimationFrame(refreshFrame);
    context.revert();
  };
}
