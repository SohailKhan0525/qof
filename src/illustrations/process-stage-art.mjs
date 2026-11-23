// All four scenes share the same drawing area. Their invisible slots give Flip
// the destination rectangles while the site's one card and mark stay above the scene wipes.
const browserDots = '<i></i><i></i><i></i>';
const rows = [1, 2, 3].map(position => `
  <div class="qofeno-process-rank-row qofeno-process-rank-row--${position}">
    <span>${position.toString().padStart(2, '0')}</span><i></i>
  </div>`).join('');
const days = '<i></i>'.repeat(30);

const scenes = [
  ['submit', `
    <div class="qofeno-process-paper qofeno-process-form">
      <div class="qofeno-process-browser-bar">${browserDots}<span>Placement form</span></div>
      <span class="qofeno-process-form-label">Website address</span>
      <div class="qofeno-process-form-line"><i></i><i></i></div>
      <span class="qofeno-process-form-description">Name and description</span>
      <div class="qofeno-process-form-rule"></div>
    </div>`],
  ['review', `
    <div class="qofeno-process-paper qofeno-process-review-sheet">
      <span class="qofeno-process-docket-title">Review desk</span>
      <div class="qofeno-process-docket-checklist"><span>Website</span><span>Ad standards</span></div>
      <div class="qofeno-process-docket-line"></div>
      <span class="qofeno-process-docket-note">Before publication</span>
    </div>`],
  ['ranking', `
    <div class="qofeno-process-paper qofeno-process-rank-sheet"></div>
    <span class="qofeno-process-rank-title">Illustrative ranking</span>
    <div class="qofeno-process-rank-rows">${rows}</div>`],
  ['expiry', `
    <div class="qofeno-process-paper qofeno-process-calendar">
      <div class="qofeno-process-calendar-top"></div>
      <div class="qofeno-process-calendar-term"><strong>30</strong><span>days<span>From approval</span></span></div>
      <div class="qofeno-process-calendar-days">${days}</div>
    </div>`],
];

export function createProcessStage(chapter) {
  const stage = document.createElement('div');
  stage.className = 'qofeno-process-stage';
  stage.setAttribute('aria-hidden', 'true');
  const visibleScenes = chapter === undefined ? scenes : [scenes[chapter]];
  stage.innerHTML = visibleScenes.map(([name, scene]) => `
    <div class="qofeno-process-scene qofeno-process-scene--${name}" data-scene="${name}">
      ${scene}
      <i class="qofeno-process-item-slot"></i>
      <i class="qofeno-process-tab-slot"></i>
    </div>`).join('') + `
    <div class="qofeno-process-item">
      <span class="qofeno-process-item-mark">
        <svg viewBox="0 0 28 28" fill="none" stroke="currentColor" stroke-width="1.4" focusable="false">
          <circle cx="14" cy="14" r="9.5"/><ellipse cx="14" cy="14" rx="4.3" ry="9.5"/><path d="M4.5 14h19"/>
        </svg>
      </span>
      <div class="qofeno-process-item-name"><strong>Your website</strong><span></span></div>
    </div>
    <div class="qofeno-process-tab">
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.6" stroke-linecap="round" focusable="false">
        <circle cx="12" cy="12" r="3.2"/><path d="M12 3.7v3.6m0 9.4v3.6M3.7 12h3.6m9.4 0h3.6"/>
      </svg>
    </div>`;
  return stage;
}
