import { gsap, Flip, ScrollTrigger } from '../navigation/velocity-capsule.mjs';
import { createProcessStage } from './process-stage-art.mjs';

const wideStage = '(min-width: 1000px) and (min-height: 620px)';
const closedWipes = [
  'inset(0% 0% 0% 100%)',
  'inset(0% 0% 100% 0%)',
  'inset(100% 0% 0% 0%)',
];
const openWipe = 'inset(0% 0% 0% 0%)';

function mountWideStage(grid) {
  const cards = [...grid.querySelectorAll(':scope > .placement-process-card')];
  if (cards.length !== 4) return;

  const track = document.createElement('div');
  track.className = 'qofeno-process-track';
  const stage = createProcessStage();
  track.append(stage);
  const scenes = [...stage.querySelectorAll('.qofeno-process-scene')];
  const shared = [
    stage.querySelector('.qofeno-process-item'),
    stage.querySelector('.qofeno-process-tab'),
  ];
  const slots = ['.qofeno-process-item-slot', '.qofeno-process-tab-slot'];
  const layouts = scenes.map(scene => slots.map(selector => scene.querySelector(selector)));
  if (scenes.length !== cards.length || shared.some(part => !part) ||
      layouts.some(layout => layout.some(slot => !slot))) return;

  grid.append(track);
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
    const key = [track.clientWidth, track.clientHeight, grid.clientHeight, ...offsets].join('/');
    if (key === measuredLayout) return;
    measuredLayout = key;
    story?.revert();
    chapterPositions = offsets.map((offset, index) => index === 0 ? 0 :
      gsap.utils.clamp(.10, .92, (offset - track.clientHeight * .42) / distance()));

    // Flip measures the same card and tab against the authored layouts once per reflow.
    // The resulting positions and dimensions are scrubbed alongside the image wipes.
    const poses = layouts.map(layout => shared.map((element, index) => {
      const slot = layout[index];
      const { x, y, width, height } = Flip.fit(element, slot, { getVars: true, simple: true });
      return { x, y, width, height, borderRadius: getComputedStyle(slot).borderRadius };
    }));
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
    return (document.querySelector('.qofeno-header')?.offsetHeight ?? 92) + 24;
  }

  function dispose() {
    cancelAnimationFrame(refreshFrame);
    resize?.disconnect();
    trigger?.kill();
    progress?.kill();
    story?.revert();
    activeCard?.classList.remove('qofeno-process-current');
    track.remove();
    grid.classList.remove('qofeno-process-active');
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
      onRefresh(self) {
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
    return dispose;
  } catch (error) {
    dispose();
    throw error;
  }
}

export function mountProcessStory(grid) {
  if (!globalThis.CSS?.supports('clip-path', 'inset(0%)')) return;
  const media = gsap.matchMedia();
  media.add(wideStage, () => mountWideStage(grid));
  return () => media.revert();
}
