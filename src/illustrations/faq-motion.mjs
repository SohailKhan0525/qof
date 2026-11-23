import { gsap, Flip } from '../navigation/velocity-capsule.mjs';
import { CustomEase } from './hero-shutter.mjs';

const foldEase = CustomEase.create('qofenoFaqFold', 'M0,0 C0.2,0 0.12,1 1,1');
let group = 0;

// Native details owns disclosure and keyboard semantics. Flip only bridges the
// geometry before and after that native change; answers never become fake buttons.
export function mountFaqMotion(list) {
  const rows = [...list.querySelectorAll(':scope > details')];
  if (!rows.length || list.hasAttribute('data-faq-motion')) return () => {};
  const targets = [list, ...rows];
  const originalNames = rows.map(row => row.getAttribute('name'));
  const name = `qofeno-faq-${++group}`;
  const ghosts = new Set();
  let pending;
  let layout;
  let disposed = false;
  let viewportWidth = `${innerWidth}/${list.parentElement?.clientWidth}`;

  list.dataset.faqMotion = 'ready';
  rows.forEach(row => {
    // A lazy mount can arrive while the recovered accordion is still folding.
    // Its click handler is guarded by data-faq-motion in the generated client.
    if (row.dataset.foldState) {
      row.getAnimations().forEach(animation => animation.cancel());
      row.open = row.dataset.foldState === 'opening';
      delete row.dataset.foldState;
      row.style.removeProperty('overflow');
    }
    row.setAttribute('name', name);
  });

  function dim(instant = false) {
    const active = rows.find(row => row.open);
    list.dataset.faqActive = active ? String(rows.indexOf(active) + 1) : 'none';
    rows.forEach(row => {
      // Dimming whole text to .4 would destroy its contrast on the light paper.
      // The border and disclosure mark dim; the question remains readable.
      const value = !active || row === active || row.matches(':hover, :focus-within') ? 1 : .4;
      gsap.to(row, { '--q-faq-chrome': value, duration: instant ? 0 : .18, ease: foldEase, overwrite: 'auto' });
    });
  }

  function removeGhosts() {
    ghosts.forEach(ghost => { gsap.killTweensOf(ghost); ghost.remove(); });
    ghosts.clear();
  }

  function settle() {
    removeGhosts();
    if (!disposed) list.dataset.faqMotion = 'ready';
  }

  function snapshotAnswers() {
    const parent = list.getBoundingClientRect();
    return rows.filter(row => row.open).flatMap(row => [...row.children]
      .filter(child => child.tagName !== 'SUMMARY')
      .map(answer => {
        const bounds = answer.getBoundingClientRect();
        const style = getComputedStyle(answer);
        const ghost = answer.cloneNode(true);
        ghost.classList.add('qofeno-faq-exit');
        ghost.setAttribute('aria-hidden', 'true');
        ghost.inert = true;
        ghost.removeAttribute('id');
        ghost.querySelectorAll('[id]').forEach(element => element.removeAttribute('id'));
        Object.assign(ghost.style, {
          position: 'absolute', boxSizing: 'border-box', margin: '0',
          top: `${bounds.top - parent.top}px`, left: `${bounds.left - parent.left}px`,
          width: `${bounds.width}px`, height: `${bounds.height}px`,
          padding: style.padding, font: style.font, lineHeight: style.lineHeight,
          letterSpacing: style.letterSpacing, color: style.color,
          opacity: style.opacity, transform: 'none',
        });
        return { row, ghost };
      }));
  }

  function beforeToggle(event) {
    const summary = event.target instanceof Element && event.target.closest('summary');
    if (!summary || summary.parentElement.parentElement !== list || event.defaultPrevented ||
        event.target.closest('a, button, input, select, textarea')) return;
    // Capture the current interpolated pose before completing an interrupted
    // Flip so rapid alternating clicks continue from the picture on screen.
    const state = Flip.getState(targets, { simple: true, kill: false });
    const answers = snapshotAnswers();
    Flip.killFlipsOf(targets, true);
    rows.forEach(row => {
      const answers = row.querySelectorAll(':scope > :not(summary)');
      gsap.killTweensOf(answers);
      gsap.set(answers, { clearProps: 'opacity,transform' });
    });
    removeGhosts();
    pending = { state, answers };
  }

  function animateToggle() {
    dim();
    const change = pending;
    pending = undefined;
    if (!change || disposed || !list.isConnected || document.hidden) {
      Flip.killFlipsOf(targets, true);
      settle();
      return;
    }
    list.dataset.faqMotion = 'playing';
    layout = Flip.from(change.state, {
      duration: .44, ease: foldEase, simple: true, nested: true,
      absolute: rows, scale: false, prune: true,
      onComplete: settle,
    });
    for (const { row, ghost } of change.answers) {
      if (row.open) continue;
      ghosts.add(ghost);
      list.append(ghost);
      gsap.to(ghost, { opacity: 0, y: -4, duration: .16, ease: foldEase,
        onComplete: () => { ghost.remove(); ghosts.delete(ghost); } });
    }
    const opening = rows.find(row => row.open);
    if (opening) gsap.fromTo(opening.querySelectorAll(':scope > :not(summary)'),
      { opacity: 0, y: 6 },
      { opacity: 1, y: 0, duration: .3, delay: .04, ease: foldEase, clearProps: 'opacity,transform' });
  }

  function onVisibility() {
    if (document.hidden) { layout?.progress(1); settle(); }
  }

  function onFocus() { dim(); }

  const resize = new ResizeObserver(() => {
    const width = `${innerWidth}/${list.parentElement?.clientWidth}`;
    if (width === viewportWidth) return;
    viewportWidth = width;
    Flip.killFlipsOf(targets, true);
    pending = undefined;
    settle();
  });
  // Native toggle events are queued tasks and can arrive after the next paint.
  // The attribute observer runs before painting, avoiding a final-height flash
  // while keeping the browser's default disclosure and exclusive-group behavior.
  const disclosure = new MutationObserver(records => {
    if (records.some(record => rows.includes(record.target))) animateToggle();
  });
  disclosure.observe(list, { attributes: true, subtree: true, attributeFilter: ['open'] });
  resize.observe(list);
  if (list.parentElement) resize.observe(list.parentElement);
  list.addEventListener('click', beforeToggle, true);
  list.addEventListener('focusin', onFocus);
  list.addEventListener('focusout', onFocus);
  list.addEventListener('pointerover', onFocus);
  list.addEventListener('pointerout', onFocus);
  document.addEventListener('visibilitychange', onVisibility);
  dim(true);

  return () => {
    disposed = true;
    disclosure.disconnect();
    resize.disconnect();
    list.removeEventListener('click', beforeToggle, true);
    list.removeEventListener('focusin', onFocus);
    list.removeEventListener('focusout', onFocus);
    list.removeEventListener('pointerover', onFocus);
    list.removeEventListener('pointerout', onFocus);
    document.removeEventListener('visibilitychange', onVisibility);
    Flip.killFlipsOf(targets, true);
    removeGhosts();
    rows.forEach((row, index) => {
      gsap.killTweensOf(row);
      gsap.killTweensOf(row.querySelectorAll(':scope > :not(summary)'));
      gsap.set(row.querySelectorAll(':scope > :not(summary)'), { clearProps: 'opacity,transform' });
      row.style.removeProperty('--q-faq-chrome');
      if (originalNames[index] === null) row.removeAttribute('name');
      else row.setAttribute('name', originalNames[index]);
    });
    delete list.dataset.faqMotion;
    delete list.dataset.faqActive;
  };
}
