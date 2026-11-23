import gsap from './gsap-OWHkPl-m.js';
import CustomEase from 'gsap/CustomEase.js';

gsap.registerPlugin(CustomEase);
export { CustomEase };
const shutterEase = CustomEase.create('qofenoShutter', 'M0,0 C0.38,0 0.16,1 1,1');
const compact = '(max-width: 730px)';

export function createReferenceHero(hero) {
  const frame = document.createElement('picture');
  frame.className = 'qofeno-hero-background';
  frame.setAttribute('aria-hidden', 'true');
  frame.hidden = true;

  const mobile = document.createElement('source');
  mobile.media = compact;
  mobile.srcset = '/brand/hero-atlas-compact.webp';
  const image = document.createElement('img');
  image.className = 'qofeno-hero-background-image';
  image.alt = '';
  image.width = 1600;
  image.height = 900;
  image.decoding = 'async';
  frame.append(mobile, image);
  hero.prepend(frame);
  image.src = '/brand/hero-atlas.webp';

  let disposed = false;
  let timeline;
  const viewport = new IntersectionObserver(([entry]) => {
    if (!entry.isIntersecting) timeline?.progress(1);
  });

  function finishOnHide() {
    if (document.hidden) timeline?.progress(1);
  }

  function stopWatching() {
    viewport.disconnect();
    document.removeEventListener('visibilitychange', finishOnHide);
  }

  function settle() {
    stopWatching();
    frame.style.removeProperty('clip-path');
    image.style.removeProperty('transform');
    image.style.removeProperty('filter');
    hero.dataset.heroShutter = 'settled';
  }

  function dispose() {
    disposed = true;
    stopWatching();
    timeline?.kill();
    frame.remove();
    delete hero.dataset.heroShutter;
  }

  image.decode().then(() => {
    if (disposed || !hero.isConnected) return;
    const { top, bottom } = hero.getBoundingClientRect();
    frame.hidden = false;
    if (document.hidden || bottom <= 0 || top >= innerHeight) {
      settle();
      return;
    }

    const aperture = matchMedia(compact).matches
      ? 'inset(45% 10% 16% 10% round 2px)'
      : 'inset(16% 8% 21% 55% round 2px)';
    hero.dataset.heroShutter = 'playing';
    timeline = gsap.timeline({
      defaults: { duration: .92, ease: shutterEase },
      onComplete: settle,
    });
    timeline
      .fromTo(frame, { clipPath: aperture }, { clipPath: 'inset(0% 0% 0% 0% round 0px)' }, 0)
      .fromTo(image, { scale: 1.18, filter: 'blur(12px) brightness(0.6)' },
        { scale: 1, filter: 'blur(0px) brightness(1)' }, 0);
    viewport.observe(hero);
    document.addEventListener('visibilitychange', finishOnHide);
  }).catch(() => { if (!disposed) dispose(); });

  return dispose;
}
