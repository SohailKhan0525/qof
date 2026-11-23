import { gsap } from '../navigation/velocity-capsule.mjs';
import { CustomEase } from './hero-shutter.mjs';

const press = CustomEase.create('qofenoInkPress', 'M0,0 C0.26,0 0.14,1 1,1');

export function mountVisitorMotion(section) {
  const drawing = section.querySelector('.visitor-activity-art');
  const metrics = [...section.querySelectorAll('.visitor-activity-metric')];
  if (!drawing || !metrics.length) return;
  section.classList.add('qofeno-visitor-press');
  const ctx = gsap.context(() => {
    const scan = gsap.timeline({
      defaults: { ease: press },
      scrollTrigger: { trigger: section, start: 'top 94%', end: 'top 31%', scrub: true },
    });
    scan.fromTo(drawing,
      { clipPath: 'inset(5% 16% 27% 34% round 16px)', scale: .96, xPercent: 4 },
      { clipPath: 'inset(0% 0% 0% 0% round 0px)', scale: 1, xPercent: 0, duration: 1 }, 0);
    scan.fromTo(metrics, { '--q-ledger-rule': 0 },
      { '--q-ledger-rule': 1, duration: .72, stagger: .14 }, 0);
  }, section);
  return () => {
    ctx.revert();
    section.classList.remove('qofeno-visitor-press');
  };
}

export function mountTrustMotion(section) {
  const seal = section.querySelector('.reference-honest-marker svg');
  if (!seal) return;
  section.classList.add('qofeno-proof-sheet');
  const ctx = gsap.context(() => {
    const sheet = gsap.timeline({
      defaults: { ease: press, duration: 1 },
      scrollTrigger: { trigger: section, start: 'top 94%', end: 'top 40%', scrub: true },
    });
    sheet.fromTo(section, { '--q-proof-open': 0 }, { '--q-proof-open': 1 }, 0);
    sheet.fromTo(seal, { rotate: -42, scale: .66 }, { rotate: 0, scale: 1, transformOrigin: '50% 50%' }, 0);
  }, section);
  return () => {
    ctx.revert();
    section.classList.remove('qofeno-proof-sheet');
  };
}

export function mountFooterMotion(section) {
  const wordmark = section.querySelector('.footer-wordmark-ink');
  const frame = section.querySelector('.footer-wordmark-frame');
  if (!wordmark || !frame) return;
  const ctx = gsap.context(() => {
    const type = gsap.timeline({
      defaults: { ease: press, duration: 1 },
      scrollTrigger: { trigger: frame, start: 'top 96%', end: 'top 60%', scrub: true },
    });
    type.fromTo(wordmark, { '--q-footer-open': '26%' }, { '--q-footer-open': '0%' }, 0);
    type.fromTo(frame, { '--q-footer-rule': 0 }, { '--q-footer-rule': 1 }, 0);
  }, section);
  return () => ctx.revert();
}

const actions = [
  '.reference-hero-actions .button',
  '.rank-empty .button',
  '.honest-section .button',
  '.reference-story-action',
  '.qofeno-header-buy',
  '.qofeno-mobile-purchase button',
].join(', ');

export function mountActionMotion(root) {
  const tweens = new WeakMap();
  const pointing = new WeakSet();

  function setAction(action, highlighted) {
    if (!action || action.matches(':disabled, [aria-disabled="true"]')) return;
    if (!tweens.has(action)) {
      if (!highlighted) return;
      action.classList.add('qofeno-action-foil');
      tweens.set(action, gsap.quickTo(action, '--q-action-ink', { duration: .34, ease: press }));
    }
    tweens.get(action)(highlighted ? 1 : 0);
  }

  function point(event, hovered) {
    if (event.pointerType === 'touch') return;
    const action = event.target.closest?.(actions);
    if (!action || (event.relatedTarget instanceof Node && action.contains(event.relatedTarget))) return;
    if (hovered) pointing.add(action);
    else pointing.delete(action);
    setAction(action, hovered || action.matches(':focus-visible'));
  }

  root.addEventListener('pointerover', event => point(event, true), { passive: true });
  root.addEventListener('pointerout', event => point(event, false), { passive: true });
  root.addEventListener('focusin', event => {
    const action = event.target.closest?.(actions);
    if (action?.matches(':focus-visible')) setAction(action, true);
  });
  root.addEventListener('focusout', event => {
    const action = event.target.closest?.(actions);
    if (action && !pointing.has(action)) setAction(action, false);
  });
  for (const action of root.querySelectorAll(actions)) {
    if (action.matches(':hover') && matchMedia('(any-hover: hover)').matches) {
      pointing.add(action);
      setAction(action, true);
    } else if (action.matches(':focus-visible')) {
      setAction(action, true);
    }
  }
}
