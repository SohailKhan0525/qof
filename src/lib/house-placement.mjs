// The operator lists its own site directly. This record never enters paid ranks.
export const HOUSE_PLACEMENT = Object.freeze({
  id: 'qofeno-placement',
  title: 'Qofeno',
  website: 'https://loopproof.me/',
  host: 'loopproof.me',
  tagline: 'A shared board where independent websites can be discovered.',
  status: 'active',
  kind: 'owner',
  label: 'Active · Owner placement',
  disclosure: 'Listed by Qofeno and excluded from paid ranking.',
});

const visitArrowPath = 'M3 13 13 3M5 3h8v8';

// The field values are authored constants shared with the server-rendered board.
export function housePlacementMarkup() {
  const site = HOUSE_PLACEMENT;
  return `<article class="house-placement" id="${site.id}" aria-labelledby="house-placement-title"><div class="house-placement-layout"><div class="house-placement-copy"><p class="house-placement-label">${site.label}</p><h3 class="house-placement-title" id="house-placement-title">${site.title}</h3><p class="house-placement-host">${site.host}</p><p>${site.tagline}</p><p class="house-placement-disclosure">${site.disclosure}</p><a class="house-placement-link" href="${site.website}">Visit website <svg aria-hidden="true" viewBox="0 0 16 16" width="13" height="13"><path d="${visitArrowPath}" fill="none" stroke="currentColor" stroke-width="1.5"/></svg></a></div><div class="house-placement-art" aria-hidden="true"><img src="/brand/qofeno-icon.svg" alt="" width="96" height="96"/></div></div></article>`;
}

export function housePlacementElement({ jsx, jsxs }) {
  const site = HOUSE_PLACEMENT;
  return jsx('article', {
    className: 'house-placement', id: site.id, 'aria-labelledby': 'house-placement-title',
    children: jsxs('div', { className: 'house-placement-layout', children: [
      jsxs('div', { className: 'house-placement-copy', children: [
        jsx('p', { className: 'house-placement-label', children: site.label }),
        jsx('h3', { className: 'house-placement-title', id: 'house-placement-title', children: site.title }),
        jsx('p', { className: 'house-placement-host', children: site.host }),
        jsx('p', { children: site.tagline }),
        jsx('p', { className: 'house-placement-disclosure', children: site.disclosure }),
        jsxs('a', { className: 'house-placement-link', href: site.website, children: [
          'Visit website ', jsx('svg', {
            'aria-hidden': true, viewBox: '0 0 16 16', width: 13, height: 13,
            children: jsx('path', { d: visitArrowPath, fill: 'none', stroke: 'currentColor', strokeWidth: 1.5 }),
          }),
        ] }),
      ] }),
      jsx('div', { className: 'house-placement-art', 'aria-hidden': true,
        children: jsx('img', { src: '/brand/qofeno-icon.svg', alt: '', width: 96, height: 96 }) }),
    ] }),
  });
}
