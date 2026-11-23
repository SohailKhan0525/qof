import gsap from './gsap-OWHkPl-m.js';

export function createNavCapsule(header) {
  const shell = header.querySelector('.qofeno-header-shell');
  const reducedMotion = matchMedia('(prefers-reduced-motion: reduce)');
  const shape = { amount: 0 };
  let lastPosition = Math.max(0, window.scrollY);
  let lastTime = performance.now();
  const move = gsap.quickTo(shape, 'amount', {
    duration: .26,
    ease: 'power3.out',
    onUpdate: () => shell.style.setProperty('--q-nav-morph', shape.amount.toFixed(4)),
  });
  const settle = gsap.delayedCall(.11, () => move(0, shape.amount)).pause();

  function reset() {
    settle.pause();
    move.tween.pause();
    shape.amount = 0;
    shell.style.removeProperty('--q-nav-morph');
    lastPosition = Math.max(0, window.scrollY);
    lastTime = performance.now();
  }

  function sample(scrollY) {
    if (reducedMotion.matches || header.dataset.open === 'true' || header.dataset.mobileDialog === 'true') return;

    const position = Math.max(0, scrollY);
    const distance = Math.abs(position - lastPosition);
    if (!distance) return;
    const now = performance.now();
    const elapsed = Math.max(16, Math.min(now - lastTime, 50));
    lastPosition = position;
    lastTime = now;
    // Measure CSS pixels per millisecond and cap the response to fast flicks.
    const amount = Math.max(0, Math.min(1, (distance / elapsed - .12) / 2.2));
    if (!amount && !shape.amount) return;
    move(amount, shape.amount);
    settle.restart(true);
  }

  const menu = new MutationObserver(reset);
  menu.observe(header, { attributes: true, attributeFilter: ['data-open', 'data-mobile-dialog'] });
  reducedMotion.addEventListener('change', reset);
  document.addEventListener('visibilitychange', reset);

  return {
    sample,
    dispose() {
      menu.disconnect();
      reducedMotion.removeEventListener('change', reset);
      document.removeEventListener('visibilitychange', reset);
      reset();
      settle.kill();
      move.tween.kill();
    },
  };
}
