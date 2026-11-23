import { gsap, ScrollTrigger } from '../navigation/velocity-capsule.mjs';

// The full track is already present so lazy motion cannot shift later sections into new positions.
export function mountBoardTrack(section) {
  const board = section.previousElementSibling;
  if (!section.isConnected || !board?.matches('#board')) return;
  const stage = section.querySelector('.qofeno-board-track-stage');
  const viewport = section.querySelector('.qofeno-board-track-window');
  const rail = section.querySelector('.qofeno-board-track-rail');
  const cards = [...section.querySelectorAll('.qofeno-board-track-card')];
  const cardBodies = cards.map(card => card.firstElementChild);
  const art = [...section.querySelectorAll('.qofeno-board-track-art-inner')];
  const buttons = [...section.querySelectorAll('[data-board-story]')];
  let disposed = false;
  const media = gsap.matchMedia();

  media.add({
    wide: '(min-width: 1000px) and (min-height: 680px)',
    all: 'all',
  }, ({ conditions }) => {
    if (!conditions.wide) {
      // Touch follows ordinary page scrolling; only the decorative art moves.
      art.forEach(inner => gsap.fromTo(inner, { yPercent: -3 }, {
        yPercent: 3, ease: 'none',
        scrollTrigger: { trigger: inner.parentElement, start: 'top bottom', end: 'bottom top', scrub: .4 },
      }));
      return;
    }
    section.dataset.trackLayout = 'horizontal';
    const distance = () => Math.max(0, rail.scrollWidth - viewport.clientWidth);
    const topOffset = () => Math.max(80, (document.querySelector('.qofeno-header')?.offsetHeight || 76) + 14);
    const skews = cardBodies.map(card => gsap.quickTo(card, 'skewX', { duration: .42, ease: 'power3.out' }));
    const compressX = cardBodies.map(card => gsap.quickTo(card, 'scaleX', { duration: .45, ease: 'power3.out' }));
    const compressY = cardBodies.map(card => gsap.quickTo(card, 'scaleY', { duration: .45, ease: 'power3.out' }));
    const settle = gsap.delayedCall(.12, () => {
      skews.forEach(move => move(0));
      compressX.forEach(move => move(1));
      compressY.forEach(move => move(1));
    }).pause();
    let active = -1;
    let branchActive = true;
    let refreshFrame = 0;
    let trigger;
    const setActive = progress => {
      const next = Math.round(progress * (cards.length - 1));
      if (active === next) return;
      active = next;
      section.dataset.trackStep = String(next + 1);
      buttons.forEach((button, index) => {
        if (index === next) button.setAttribute('aria-current', 'step');
        else button.removeAttribute('aria-current');
      });
    };
    const timeline = gsap.timeline({ paused: true, defaults: { ease: 'none' } });
    timeline.to(rail, { x: () => -distance(), duration: 1 }, 0);
    // Rail moves left while the oversize art moves right inside its crop.
    timeline.fromTo(art, { xPercent: -5 }, { xPercent: 5, duration: 1 }, 0);
    trigger = ScrollTrigger.create({
      id: 'qofeno-board-track', trigger: stage,
      start: () => `top ${topOffset()}px`, end: () => `+=${distance()}`,
      pin: stage, pinSpacing: true, anticipatePin: 1, scrub: .65,
      animation: timeline, invalidateOnRefresh: true,
      onUpdate(self) {
        setActive(self.progress);
        const velocity = gsap.utils.clamp(-2200, 2200, self.getVelocity());
        const impulse = Math.abs(velocity) / 2200;
        skews.forEach(move => move(velocity / -850));
        compressX.forEach(move => move(1 - impulse * .014));
        compressY.forEach(move => move(1 - impulse * .009));
        settle.restart(true);
      },
      onRefresh(self) { setActive(self.progress); },
    });
    const jumpTo = index => {
      const progress = index / (cards.length - 1);
      window.scrollTo({ top: trigger.start + (trigger.end - trigger.start) * progress, behavior: 'instant' });
      timeline.progress(progress);
      setActive(progress);
      viewport.scrollLeft = 0;
    };
    const click = event => {
      const button = event.target.closest('[data-board-story]');
      if (button) jumpTo(Number(button.dataset.boardStory));
    };
    const focus = event => {
      const card = event.target.closest('.qofeno-board-track-card');
      if (!card || !event.target.matches('a, button, input, select, textarea')) return;
      jumpTo(cards.indexOf(card));
    };
    section.addEventListener('click', click);
    rail.addEventListener('focusin', focus);
    let previousWidth = viewport.clientWidth;
    let previousBoardHeight = board.offsetHeight;
    const resize = new ResizeObserver(() => {
      if (viewport.clientWidth === previousWidth && board.offsetHeight === previousBoardHeight) return;
      previousWidth = viewport.clientWidth;
      previousBoardHeight = board.offsetHeight;
      cancelAnimationFrame(refreshFrame);
      refreshFrame = requestAnimationFrame(() => trigger.refresh());
    });
    resize.observe(viewport);
    resize.observe(board);
    document.fonts?.ready.then(() => {
      if (!disposed && branchActive && stage.isConnected) {
        cancelAnimationFrame(refreshFrame);
        refreshFrame = requestAnimationFrame(() => trigger.refresh());
      }
    });
    setActive(trigger.progress);
    return () => {
      branchActive = false;
      cancelAnimationFrame(refreshFrame);
      resize.disconnect();
      settle.kill();
      [...skews, ...compressX, ...compressY].forEach(move => move.tween.kill());
      section.removeEventListener('click', click);
      rail.removeEventListener('focusin', focus);
      delete section.dataset.trackLayout;
      delete section.dataset.trackStep;
      buttons.forEach(button => button.removeAttribute('aria-current'));
    };
  });
  return () => {
    disposed = true;
    media.revert();
  };
}
