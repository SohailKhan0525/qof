import { gsap, Flip, ScrollTrigger } from '../navigation/velocity-capsule.mjs';
import { createProcessStage } from './process-stage-art.mjs';

const wideStage = '(min-width: 1000px)';
const pinFits = '(min-width: 1000px) and (min-height: 460px), (min-height: 540px)';
const closedWipes = [
  'inset(0% 0% 0% 100%)',
  'inset(0% 0% 100% 0%)',
  'inset(100% 0% 0% 0%)',
];
const openWipe = 'inset(0% 0% 0% 0%)';
const parts = ['.qofeno-process-item', '.qofeno-process-tab'];
const slots = ['.qofeno-process-item-slot', '.qofeno-process-tab-slot'];

function fitToSlot(element, slot) {
  const { x, y, width, height } = Flip.fit(element, slot, { getVars: true, simple: true });
  return { x, y, width, height, borderRadius: getComputedStyle(slot).borderRadius };
}

function mountPinnedStage(grid, cards, stacked) {

  const track = document.createElement('div');
  track.className = 'qofeno-process-track';
  const stage = createProcessStage();
  track.append(stage);
  const scenes = [...stage.querySelectorAll('.qofeno-process-scene')];
  const shared = parts.map(selector => stage.querySelector(selector));
  const layouts = scenes.map(scene => slots.map(selector => scene.querySelector(selector)));
  if (scenes.length !== cards.length || shared.some(part => !part) ||
      layouts.some(layout => layout.some(slot => !slot))) return;

  if (stacked) {
    grid.prepend(track);
    grid.classList.add('qofeno-process-stacked');
  } else {
    grid.append(track);
  }
  grid.classList.add('qofeno-process-active');
  const playhead = { position: 0 };
  let trigger;
  let progress;
  let resize;
  let story;
  let measuredLayout;
  let activeCard;
  let chapterPositions = [];
  let refreshFrame = 0;

  function distance() {
    return Math.max(1, grid.clientHeight - track.clientHeight);
  }

  function render() {
    story?.time(playhead.position, true);
    const chapter = Math.max(0, chapterPositions.findLastIndex(position => position <= playhead.position));
    if (activeCard !== cards[chapter]) {
      activeCard?.classList.remove('qofeno-process-current');
      activeCard = cards[chapter];
      activeCard.classList.add('qofeno-process-current');
      stage.dataset.processStep = String(chapter + 1);
    }
  }

  function measure() {
    const offsets = cards.map(card => card.offsetTop);
    const key = [track.clientWidth, track.clientHeight, grid.clientHeight, stacked ? window.innerHeight : 0, ...offsets].join('/');
    if (key === measuredLayout) return;
    measuredLayout = key;
    story?.revert();
    const lead = stacked
      ? track.clientHeight + Math.max(0, window.innerHeight - topOffset() - track.clientHeight) * .26
      : track.clientHeight * .42;
    chapterPositions = offsets.map((offset, index) => index === 0 ? 0 :
      gsap.utils.clamp(.10, .92, (offset - lead) / distance()));

    // Flip measures the same card and tab against the authored layouts once per reflow.
    // The resulting positions and dimensions are scrubbed alongside the image wipes.
    const poses = layouts.map(layout => shared.map((element, index) => fitToSlot(element, layout[index])));
    story = gsap.timeline({ paused: true, defaults: { ease: 'sine.inOut' } });
    story.set(scenes[0], { clipPath: openWipe, immediateRender: true }, 0);
    scenes.slice(1).forEach((scene, index) => {
      story.set(scene, { clipPath: closedWipes[index], immediateRender: true }, 0);
    });
    shared.forEach((element, index) => story.set(element, { ...poses[0][index], immediateRender: true }, 0));

    scenes.slice(1).forEach((scene, index) => {
      const chapter = index + 1;
      const start = chapterPositions[chapter] - .07;
      story.to(scene, { clipPath: openWipe, duration: .14 }, start);
      shared.forEach((element, part) => {
        story.to(element, { ...poses[chapter][part], duration: .14 }, start);
      });
    });
    render();
  }

  function topOffset() {
    return (document.querySelector('.qofeno-header')?.offsetHeight ?? 92) + (stacked ? 8 : 24);
  }

  function revealFocusedControl(event) {
    if (!stacked || !trigger?.isActive || !event.target.matches('a, button, input, select, textarea')) return;
    const obscured = stage.getBoundingClientRect().bottom + 12 - event.target.getBoundingClientRect().top;
    if (obscured > 0) window.scrollBy({ top: -obscured, behavior: 'instant' });
  }

  function dispose() {
    cancelAnimationFrame(refreshFrame);
    resize?.disconnect();
    grid.removeEventListener('focusin', revealFocusedControl);
    trigger?.kill();
    progress?.kill();
    story?.revert();
    activeCard?.classList.remove('qofeno-process-current');
    track.remove();
    grid.classList.remove('qofeno-process-active', 'qofeno-process-stacked');
  }

  try {
    measure();
    progress = gsap.fromTo(playhead, { position: 0 },
      { position: 1, duration: 1, ease: 'none', paused: true, onUpdate: render });
    trigger = ScrollTrigger.create({
      trigger: grid,
      start: () => `top ${topOffset()}px`,
      end: () => `+=${distance()}`,
      pin: stage,
      pinSpacing: false,
      scrub: true,
      animation: progress,
      onToggle(self) {
        stage.classList.toggle('qofeno-process-pinned', self.isActive);
      },
      onRefresh(self) {
        stage.classList.toggle('qofeno-process-pinned', self.isActive);
        playhead.position = self.progress;
        measure();
        render();
      },
    });
    resize = new ResizeObserver(() => {
      cancelAnimationFrame(refreshFrame);
      refreshFrame = requestAnimationFrame(() => { if (grid.isConnected) trigger.refresh(); });
    });
    resize.observe(grid);
    grid.addEventListener('focusin', revealFocusedControl);
    return dispose;
  } catch (error) {
    dispose();
    throw error;
  }
}

function mountInlineArt(grid, cards) {
  const panels = cards.map((card, index) => {
    const panel = createProcessStage(index);
    panel.classList.add('qofeno-process-inline-art');
    card.append(panel);
    return panel;
  });
  grid.classList.add('qofeno-process-inline');
  const resize = new ResizeObserver(entries => {
    for (const { target: panel } of entries) {
      parts.forEach((selector, index) => {
        const element = panel.querySelector(selector);
        gsap.set(element, fitToSlot(element, panel.querySelector(slots[index])));
      });
    }
  });
  const reveals = panels.map(panel => {
    resize.observe(panel);
    return gsap.fromTo(panel, { clipPath: 'inset(14% 8% 14% 8%)' }, {
      clipPath: openWipe,
      ease: 'none',
      scrollTrigger: { trigger: panel, start: 'top 94%', end: 'center 56%', scrub: true },
    });
  });
  return () => {
    resize.disconnect();
    reveals.forEach(reveal => reveal.scrollTrigger?.kill());
    panels.forEach(panel => panel.remove());
    grid.classList.remove('qofeno-process-inline');
  };
}

export function mountProcessStory(grid) {
  if (!globalThis.CSS?.supports('clip-path', 'inset(0%)')) return;
  const cards = [...grid.querySelectorAll(':scope > .placement-process-card')];
  if (cards.length !== 4) return;
  const media = gsap.matchMedia();
  media.add({ wide: wideStage, pinned: pinFits, inline: 'all' }, ({ conditions }) => (
    conditions.pinned ? mountPinnedStage(grid, cards, !conditions.wide) : mountInlineArt(grid, cards)
  ));
  return () => media.revert();
}
