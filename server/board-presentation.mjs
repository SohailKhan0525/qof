import { HOUSE_PLACEMENT, housePlacementMarkup } from './house-placement.mjs';

const homeDescription = 'Explore the Qofeno website placement board. One-time paid placements start at US$10 for 30 days, with human review before publication.';
const missingDescription = 'That page does not exist. Visit the Qofeno board or contact support@loopproof.me.';
const retiredQuestion = 'Are the editorial discoveries paid placements?';
const removeElement = { element: element => element.remove() };

function retiredFeed(response) {
  const headers = new Headers(response.headers);
  headers.set('Content-Type', 'text/plain; charset=utf-8');
  headers.set('Cache-Control', 'no-store');
  headers.set('X-Robots-Tag', 'noindex, nofollow');
  for (const name of ['Content-Length', 'Content-Encoding', 'ETag', 'Last-Modified']) {
    headers.delete(name);
  }
  return new Response(null, { status: 410, headers });
}

async function addHousePlacement(response) {
  if (!response.ok || !response.headers.get('Content-Type')?.includes('application/json')) return response;
  try {
    const board = await response.clone().json();
    if (!Array.isArray(board?.listings)) return response;
    const headers = new Headers(response.headers);
    for (const name of ['Content-Length', 'Content-Encoding', 'ETag']) headers.delete(name);
    return new Response(JSON.stringify({ ...board, housePlacement: HOUSE_PLACEMENT }), {
      status: response.status,
      headers,
    });
  } catch {
    return response;
  }
}

function filterStructuredData(source) {
  let schema;
  try {
    schema = JSON.parse(source);
  } catch {
    return source;
  }
  if (!Array.isArray(schema?.['@graph'])) return source;
  for (const node of schema['@graph']) {
    if (node?.['@type'] === 'WebPage') node.description = homeDescription;
    if (node?.['@type'] === 'FAQPage' && Array.isArray(node.mainEntity)) {
      node.mainEntity = node.mainEntity.filter(question => question?.name !== retiredQuestion);
    }
  }
  // Keep the JSON safe in an HTML script element, including future description edits.
  return JSON.stringify(schema).replace(/[<>&\u2028\u2029]/g, character =>
    `\\u${character.charCodeAt(0).toString(16).padStart(4, '0')}`);
}

function rewriteText(change) {
  let source = '';
  let buffered = false;
  return {
    text(chunk) {
      source += chunk.text;
      if (!chunk.lastInTextNode) {
        chunk.remove();
        buffered = true;
        return;
      }
      const revised = change(source);
      if (buffered || revised !== source) {
        // All input comes from the authored app document. Keep its existing
        // entity escapes when changing an adjacent sentence.
        chunk.replace(revised, { html: true });
      }
      source = '';
      buffered = false;
    },
  };
}

function presentPage(response, pathname) {
  const onHome = pathname === '/' && response.ok;
  const presentation = new HTMLRewriter()
    .on('link[href="/discover.xml"]', removeElement)
    .on('a[href="/discover.xml"]', removeElement)
    .on('a[href="/#discover"]', removeElement)
    .on('a[href="#discover"]', removeElement);

  for (const selector of ['meta[name="description"]', 'meta[property="og:description"]', 'meta[name="twitter:description"]']) {
    presentation.on(selector, {
      element(element) {
        if (onHome) element.setAttribute('content', homeDescription);
        else if (response.status === 404 && element.getAttribute('content')?.includes('editorial discoveries')) {
          element.setAttribute('content', missingDescription);
        }
      },
    });
  }

  if (onHome) {
    presentation
      .on('#discover', removeElement)
      .on('#take-a-look', removeElement)
      .on('.reference-hero-kicker > span:nth-child(2)', {
        element: element => element.setInnerContent('Independent websites. One shared board.'),
      })
      .on('.reference-hero-description', {
        element: element => element.setInnerContent('Browse the board or add your own website. Paid placements run for 30 days after approval.'),
      })
      .on('#board .section-heading .eyebrow', {
        element: element => element.setInnerContent('Active placements'),
      })
      .on('#board .section-heading h2', {
        element: element => element.setInnerContent('The website <span class="muted">board.</span>', { html: true }),
      })
      .on('#board .section-heading > p', {
        element: element => element.setInnerContent('Browse active websites. Paid placements are ordered by active spend.'),
      })
      .on('#questions .faq-list > details:nth-child(5)', removeElement)
      .on('#board > .canvas-panel', {
        element: element => element.before(housePlacementMarkup(), { html: true }),
      })
      .on('script[type="application/ld+json"]', rewriteText(filterStructuredData));
  }

  if (pathname === '/terms' || pathname === '/privacy') {
    presentation.on('.legal-section p', rewriteText(text => text
      .replace(' Editorial discoveries are selected separately from paid placements; payment does not buy editorial selection.', '')
      .replace(' Editorial discoveries are separate from paid advertisements and do not imply a partnership with the featured website.', '')
      .replace('Saved placements and editorial discoveries are stored', 'Saved placements are stored')));
  }

  return presentation.transform(response);
}

export function withBoardPresentation(application) {
  return {
    async fetch(request, env, context) {
      // Let the original app apply canonical routing, method checks, and rate limits first.
      const response = await application.fetch(request, env, context);
      const url = new URL(request.url);
      if (!response.ok && response.status !== 404) return response;

      if (['GET', 'HEAD'].includes(request.method) && /^\/discover\.xml\/?$/.test(url.pathname)) {
        return retiredFeed(response);
      }
      if (request.method !== 'GET') return response;
      if (url.pathname === '/api/board') return addHousePlacement(response);
      if (response.headers.get('Content-Type')?.includes('text/html')) return presentPage(response, url.pathname);
      return response;
    },
    scheduled(controller, env, context) {
      return application.scheduled(controller, env, context);
    },
  };
}
