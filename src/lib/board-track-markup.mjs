// Original, resolution-independent artwork. All meaningful facts also appear in HTML.
const svg = body => `<svg viewBox="0 0 760 600" xmlns="http://www.w3.org/2000/svg" aria-hidden="true" focusable="false">${body}</svg>`;
const arrow = '<svg viewBox="0 0 20 20" aria-hidden="true"><path d="M4 10h12M11 5l5 5-5 5" fill="none" stroke="currentColor" stroke-width="1.5"/></svg>';

function ownerArt() {
  return svg(`<rect width="760" height="600" fill="#dce8e3"/>
    <path d="M-80 526 497-51h102L22 526Z" fill="#c1d4c8"/><path d="m86 660 675-675h95L181 660Z" fill="#c1d4c8"/>
    <g transform="translate(167 90) rotate(-8 220 220)">
      <path d="M20 32h428v418H20z" fill="#183d3933"/>
      <path d="M0 0h440v440H0z" fill="#fff6df" stroke="#173d39" stroke-width="2"/>
      <path d="M0 0h440v62H0z" fill="#245d4e"/>
      <g fill="#dce8e3"><circle cx="26" cy="31" r="5"/><circle cx="45" cy="31" r="5"/><circle cx="64" cy="31" r="5"/></g>
      <path d="M94 26h302v10H94z" fill="#81a796"/>
      <text x="32" y="145" font-family="Georgia,serif" font-size="66" fill="#183d39">Qofeno.</text>
      <text x="34" y="181" font-family="Arial,sans-serif" font-size="18" fill="#446c5c">loopproof.me</text>
      <path d="M34 209h371" stroke="#9fb3a2"/>
      <path d="M34 244h165v142H34z" fill="#b5d1bc"/>
      <g fill="none" stroke="#245d4e" stroke-width="2.5"><circle cx="116" cy="314" r="49"/><ellipse cx="116" cy="314" rx="22" ry="49"/><path d="M67 314h98M75 288h82M75 340h82"/></g>
      <path d="M224 247h167v10H224zm0 27h142v8H224zm0 26h151v8H224zm0 26h113v8H224z" fill="#abbcaa"/>
      <path d="M224 362h122v27H224z" fill="#245d4e"/><text x="236" y="381" font-family="Arial,sans-serif" font-size="13" fill="#fff6df">Owner placement</text>
    </g>
    <g transform="translate(591 413) rotate(9)"><circle r="72" fill="#c36b46"/><circle r="61" fill="none" stroke="#f7dfbc" stroke-width="1.5"/><path d="m-25 6 16 16 35-41" fill="none" stroke="#fff6df" stroke-width="7" stroke-linecap="round" stroke-linejoin="round"/></g>`);
}

function rankArt() {
  const rows = [
    { y: 145, x: 96, amount: '$30', index: '01', fill: '#295bc0', ink: '#fff6df', bar: 186 },
    { y: 264, x: 117, amount: '$20', index: '02', fill: '#fff6df', ink: '#24436c', bar: 126 },
    { y: 383, x: 138, amount: '$10', index: '03', fill: '#c7d8ee', ink: '#24436c', bar: 65 },
  ];
  return svg(`<rect width="760" height="600" fill="#dce7f5"/>
    <g stroke="#bdcee3" fill="none"><path d="M0 104h760M0 226h760M0 348h760M0 470h760"/><path d="M114 0v600M266 0v600M418 0v600M570 0v600M722 0v600"/></g>
    <g transform="rotate(-7 380 300)">
      <text x="96" y="108" font-family="Arial,sans-serif" font-size="17" fill="#24436c">Example ranking · not live placements</text>
      ${rows.map(row => `<g><path d="M${row.x + 9} ${row.y + 11}h494v93h-494z" fill="#24436c20"/><path d="M${row.x} ${row.y}h494v93h-494z" fill="${row.fill}" stroke="#6385ab" stroke-width="1.5"/><text x="${row.x + 26}" y="${row.y + 60}" font-family="Georgia,serif" font-size="40" fill="${row.ink}">${row.index}</text><path d="M${row.x + 113} ${row.y + 41}h${row.bar}v11h-${row.bar}z" fill="${row.ink}"/><text x="${row.x + 459}" y="${row.y + 61}" text-anchor="end" font-family="Georgia,serif" font-size="43" fill="${row.ink}">${row.amount}</text></g>`).join('')}
    </g><g transform="translate(645 125)"><circle r="48" fill="#df885d"/><path d="M0 24v-48m-17 17 17-17L17-7" stroke="#fff6df" stroke-width="5" fill="none" stroke-linejoin="round"/></g>`);
}

function termArt() {
  const days = Array.from({ length: 30 }, (_, index) => `<rect x="${109 + index % 10 * 27}" y="${363 + Math.floor(index / 10) * 27}" width="16" height="16" rx="2" fill="${index < 5 ? '#c06443' : '#d5b99b'}"/>`).join('');
  return svg(`<rect width="760" height="600" fill="#efd8bd"/>
    <circle cx="657" cy="112" r="201" fill="#dfbd98"/>
    <path d="M-20 506h800v17H-20z" fill="#cfa987"/>
    <g transform="rotate(-8 287 302)"><path d="M89 119h352v351H89z" fill="#80513e24"/><path d="M72 98h352v351H72z" fill="#fff6df" stroke="#af896b" stroke-width="1.5"/>
      <path d="M72 98h352v74H72z" fill="#b96243"/><path d="M130 74v49M365 74v49" stroke="#694c3d" stroke-width="14" stroke-linecap="round"/>
      <text x="106" y="149" font-family="Arial,sans-serif" font-size="19" fill="#fff6df">Placement term</text>
      <text x="101" y="315" font-family="Georgia,serif" font-size="150" fill="#664738">30</text>
      <text x="287" y="306" font-family="Georgia,serif" font-size="44" fill="#664738">days</text>${days}</g>
    <g transform="translate(500 298) rotate(10)"><path d="M0 0h164v177H0z" fill="#d9e5d9" stroke="#7d9b85" stroke-width="1.5"/>
      <path d="M19 25h126M19 138h126" stroke="#9db29d"/><circle cx="82" cy="78" r="28" fill="#688f77"/>
      <circle cx="82" cy="68" r="8" fill="#ecf0d8"/><path d="M66 93c0-21 32-21 32 0" fill="#ecf0d8"/>
      <text x="82" y="124" text-anchor="middle" font-family="Arial,sans-serif" font-size="12" fill="#315b48">Viewer estimates</text>
      <text x="82" y="160" text-anchor="middle" font-family="Arial,sans-serif" font-size="11" fill="#315b48">No traffic promise</text></g>`);
}

const stories = [
  {
    key: 'owner', label: 'The owner placement', title: 'Our own site. Clearly labeled.',
    body: 'Qofeno has a place on its own board. It is marked as an owner placement and stays outside the paid ranking.',
    note: 'An active listing, with the same destination in plain sight.',
    href: '#qofeno-placement', link: 'View the owner placement', short: 'Owner placement', art: ownerArt,
  },
  {
    key: 'rank', label: 'The paid ranking', title: 'More active spend. A higher position.',
    body: 'Active paid amounts set the order. Equal amounts put the earlier-created listing first. As purchases expire, the order can change.',
    note: 'Payment buys advertising weight, not a guaranteed rank.',
    href: '#how-it-works', link: 'See how placements work', short: 'Paid ranking', art: rankArt,
  },
  {
    key: 'terms', label: 'The terms in view', title: 'A clear term. An honest measure.',
    body: 'Your first 30 days begin at approval. Viewer activity shows estimates of people visiting Qofeno; it is not a promise of traffic to your website.',
    note: 'One-time purchases. No automatic renewal.',
    href: '#visitors', link: 'See viewer activity', short: 'Activity & terms', art: termArt,
  },
];

const section = {
  className: 'qofeno-board-track', id: 'board-stories', 'aria-labelledby': 'qofeno-board-track-title',
};

function trackContent() {
  return `<div class="qofeno-board-track-stage">
    <header class="qofeno-board-track-heading"><div><p class="qofeno-board-track-label">A closer look</p><h2 id="qofeno-board-track-title">Behind every placement.</h2></div><p>Three things to know before you put your website on the board.</p></header>
    <div class="qofeno-board-track-window"><div class="qofeno-board-track-rail">${stories.map((story, index) => `<article class="qofeno-board-track-card" id="board-story-${story.key}" aria-labelledby="board-story-title-${story.key}"><div class="qofeno-board-track-card-inner">
      <div class="qofeno-board-track-art q-board-art-${story.key}" aria-hidden="true"><div class="qofeno-board-track-art-inner">${story.art()}</div><span class="qofeno-board-track-art-number">0${index + 1}</span></div>
      <div class="qofeno-board-track-copy"><p class="qofeno-board-track-kicker">${story.label}</p><h3 id="board-story-title-${story.key}">${story.title}</h3><p class="qofeno-board-track-body">${story.body}</p><p class="qofeno-board-track-note">${story.note}</p><a href="${story.href}">${story.link}${arrow}</a></div>
    </div></article>`).join('')}</div></div>
    <nav class="qofeno-board-track-nav" aria-label="Placement stories">${stories.map((story, index) => `<button type="button" aria-controls="board-story-${story.key}" data-board-story="${index}"><span>0${index + 1}</span>${story.short}</button>`).join('')}<span class="qofeno-board-track-scroll-hint" aria-hidden="true">Scroll to explore ${arrow}</span></nav>
  </div>`;
}

const content = trackContent();

export function boardTrackMarkup() {
  return `<section class="${section.className}" id="${section.id}" aria-labelledby="${section['aria-labelledby']}">${content}</section>`;
}

export function boardTrackElement({ jsx }) {
  return jsx('section', { ...section, dangerouslySetInnerHTML: { __html: content } });
}
