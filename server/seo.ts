import {
  faqEntries,
  missingPageMetadata,
  pageMetadata,
  publicRoutes,
} from "../src/lib/public-content";
import { legalPages, type LegalPart } from "../src/lib/legal-content";
import { QOFENO_SWEEP_PATH, QOFENO_BLADE_PATH } from "../src/lib/brand-paths";
import { legalArtwork, referenceHeroMarkup, productTourMarkup } from "./seo-artwork";
import { editorialPicks } from "../src/lib/editorial-picks";

export const escapeHTML = (value: string) =>
  value.replace(
    /[&<>"']/g,
    (character) =>
      ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" })[
        character
      ]!,
  );
export const serializeStructuredData = (value: unknown) =>
  JSON.stringify(value).replace(
    /[<>&\u2028\u2029]/g,
    (character) =>
      `\\u${character.charCodeAt(0).toString(16).padStart(4, "0")}`,
  );
export const isPublicPage = (path: string) =>
  (publicRoutes as readonly string[]).includes(path);
export const isApplicationPage = (path: string) =>
  isPublicPage(path) || path === "/owner" || path === "/my-spot";
export const SITEMAP_PAGE_SIZE = 1000;
export const SITEMAP_INDEX_LIMIT = 1000;
const sharePath = "/og-reference.png?v=20261108-line-art";
const shareAlt =
  "Qofeno — Make some room. Independent websites. A paid front row. Thirty-day placements from US$10 at loopproof.me.";
const icon = `<svg class="qofeno-brand-symbol" width="27" height="27" viewBox="0 0 202 202" fill="currentColor" aria-hidden="true"><path d="${QOFENO_SWEEP_PATH}"/><path d="${QOFENO_BLADE_PATH}"/></svg>`;
const arrow =
  '<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" aria-hidden="true"><path d="M7 17L17 7M7 7H17V17"/></svg>';
const footerLinks =
  '<a href="/contact">Contact</a> · <a href="/terms">Terms</a> · <a href="/privacy">Privacy</a> · <a href="/refunds">Refunds</a> · <a href="/advertising-policy">Advertising standards</a>';
const header = `<a href="#main" class="skip-link">Skip to content</a><header class="qofeno-header" data-open="false" data-scrolled="false"><div class="qofeno-header-inner"><span class="qofeno-header-shell" aria-hidden="true"></span><a class="qofeno-header-brand" href="/" aria-label="Qofeno. Home"><span class="qofeno-header-mark" aria-hidden="true">${icon}</span><span>Qofeno<span class="qofeno-header-dot">.</span></span></a><nav class="qofeno-header-navigation" aria-label="Main navigation"><a class="qofeno-header-canvas" href="/#board">The paid board</a><a class="qofeno-header-trigger" href="/contact">Contact</a></nav><div class="qofeno-header-actions"><a class="qofeno-header-my-spot" href="/my-spot">My spot ${arrow}</a><a class="qofeno-header-buy" href="/#how-it-works">Get a placement ${arrow}</a></div></div></header>`;

function partsHTML(parts: LegalPart[]) {
  return parts
    .map((part) =>
      part.break
        ? "<br/>"
        : part.href
          ? `<a href="${escapeHTML(part.href)}">${escapeHTML(part.text)}</a>`
          : escapeHTML(part.text),
    )
    .join("");
}
function homeContent(checkoutAvailable: boolean) {
  return `${referenceHeroMarkup}${productTourMarkup}
<section class="canvas-section" id="board"><div class="section-heading"><div><p class="eyebrow">Paid advertising</p><h2>The front <span class="muted">row.</span></h2></div><p>Independent websites, ranked by active paid spend.<br/>Every approved placement gets a readable entry.</p></div><div class="canvas-panel"><p>One-time placements start at US$10 for 30 days. Higher active paid amounts rank first. Equal amounts put the earlier-created listing first. Categories, search and sorting help you explore; they do not change the overall paid rank.</p><p>A displayed price to move up is a current estimate, not a reserved position. Traffic, clicks and sales are not guaranteed.</p><noscript><p>Enable JavaScript to load the current paid ranking, search websites and start a purchase. Public placement pages are also available in the <a href="/sitemap.xml">sitemap</a>.</p></noscript></div></section>
<section class="canvas-section" id="discover"><div class="section-heading"><div><p class="eyebrow">Editorial discoveries · Not paid placements</p><h2>A few good <span class="muted">finds.</span></h2></div><p>Selected separately from the paid board.<br/>Payment does not buy editorial selection.</p></div><ul>${editorialPicks.map((pick) => `<li><h3><a href="${escapeHTML(pick.url)}" rel="noopener noreferrer">${escapeHTML(pick.title)}</a></h3><p>${escapeHTML(pick.description)}</p><p>${escapeHTML(pick.note)}</p></li>`).join("")}</ul><a href="/discover.xml">Follow editorial discoveries by RSS</a></section>
<section class="legal-page" id="how-it-works"><header class="legal-heading"><div class="legal-heading-copy"><p class="eyebrow">How it works</p><h2>A place on the page. On your terms.</h2><p>One-time website advertising from US$10 for 30 days.</p></div></header><div class="legal-sections"><section class="legal-section"><span class="legal-section-number" aria-hidden="true">01</span><div><h3>Introduce your website</h3><p>Submit a working website, a name and a truthful description. Choose a category and your advertising amount in $10 units. You must be authorized to advertise the destination.</p></div></section><section class="legal-section"><span class="legal-section-number" aria-hidden="true">02</span><div><h3>A human takes a look</h3><p>Every new paid listing is reviewed before publication. Its first 30 days start after approval. Rejected paid submissions are eligible for a full refund.</p></div></section><section class="legal-section"><span class="legal-section-number" aria-hidden="true">03</span><div><h3>Your 30 days begin</h3><p>Your active paid amount determines your rank. Each additional purchase has an independent 30-day period. Ranking can change as purchases start, expire or are refunded; every approved active listing remains readable.</p><p>${checkoutAvailable ? "JavaScript is needed to prepare your placement and open the secure checkout." : "Payments are not open yet. You can review the placement terms and contact support@loopproof.me with questions."}</p><p><a href="/terms">Read the terms</a> · <a href="/refunds">Refund policy</a> · <a href="/advertising-policy">Advertising standards</a></p></div></section></div></section>
<section class="questions-section" id="questions"><div><p class="eyebrow">Fair questions</p><h2>The details,<br/>without the tiny type.</h2><a class="text-link" href="mailto:support@loopproof.me">Ask us something ${arrow}</a></div><div class="faq-list">${faqEntries.map(([q, a]) => `<details><summary>${escapeHTML(q)}</summary><p>${escapeHTML(a)}</p></details>`).join("")}</div></section>`;
}
function legalContent(path: string) {
  const page = legalPages[path];
  const index = `<nav class="legal-document-index" aria-label="On this page"><span>In this document</span>${page.sections.map((section, index) => `<a href="#policy-${index + 1}">${escapeHTML(section.title)}</a>`).join("")}</nav>`;
  const sections = page.sections.map((section, index) => `<section class="legal-section" id="policy-${index + 1}" tabindex="-1"><span class="legal-section-number" aria-hidden="true">${String(index + 1).padStart(2, "0")}</span><div><h2>${escapeHTML(section.title)}</h2><p>${partsHTML(section.content)}</p></div></section>`).join("");
  return `<article class="legal-page legal-interface-page"><a class="legal-back" href="/">← Back to the board</a><header class="legal-heading"><div class="legal-heading-copy"><p class="eyebrow">Qofeno / The useful details</p><h1>${escapeHTML(page.title)}</h1><p>${escapeHTML(page.description)}</p></div>${legalArtwork[path] || ""}</header>${index}<div class="legal-sections">${sections}</div></article>`;
}
function utilityContent(path: string) {
  const known = path === "/my-spot" || path === "/owner";
  const title =
    path === "/my-spot"
      ? "Your little corner."
      : path === "/owner"
        ? "The review desk."
        : "Nothing posted here.";
  const text =
    path === "/my-spot"
      ? "Enable JavaScript to restore your purchase with its private recovery code. Never share your recovery code publicly. Contact support@loopproof.me if you need help."
      : path === "/owner"
        ? "This review desk requires authorized access and JavaScript. No private review or customer data is included in this page."
        : missingPageMetadata.description;
  return `<article class="legal-page"><header class="legal-heading"><div class="legal-heading-copy"><p class="eyebrow">Qofeno / ${known ? "Private access" : "Page not found"}</p><h1>${title}</h1><p>${escapeHTML(text)}</p><a href="/">Back to the board</a></div></header></article>`;
}
export interface SearchPage {
  path: string;
  title: string;
  description: string;
  status: number;
  indexable: boolean;
  content: string;
  structuredData?: unknown[];
}
export function staticSearchPage(
  path: string,
  origin: string,
  live: boolean,
  checkoutAvailable: boolean,
): SearchPage {
  const metadata = pageMetadata[path] || missingPageMetadata;
  const indexable = live && isPublicPage(path);
  const organization = {
    "@type": "Organization",
    "@id": `${origin}/#organization`,
    name: "Qofeno",
    url: `${origin}/`,
    email: "support@loopproof.me",
    logo: `${origin}/brand/qofeno-icon.svg`,
    founder: { "@type": "Person", name: "Mohd Zaheeruddin" },
    address: { "@type": "PostalAddress", addressCountry: "IN" },
  };
  const website = {
    "@type": "WebSite",
    "@id": `${origin}/#website`,
    url: `${origin}/`,
    name: "Qofeno",
    inLanguage: "en",
    publisher: { "@id": `${origin}/#organization` },
  };
  const webpage = {
    "@type": path === "/contact" ? "ContactPage" : "WebPage",
    "@id": `${origin}${path}#page`,
    url: `${origin}${path}`,
    name: metadata.title,
    description: metadata.description,
    inLanguage: "en",
    isPartOf: { "@id": `${origin}/#website` },
    publisher: { "@id": `${origin}/#organization` },
  };
  const structuredData: unknown[] = indexable
    ? [organization, website, webpage]
    : [];
  if (indexable && path === "/")
    structuredData.push({
      "@type": "FAQPage",
      "@id": `${origin}/#questions`,
      mainEntity: faqEntries.map(([q, a]) => ({
        "@type": "Question",
        name: q,
        acceptedAnswer: { "@type": "Answer", text: a },
      })),
    });
  return {
    path,
    ...metadata,
    status: isApplicationPage(path) ? 200 : 404,
    indexable,
    structuredData,
    content:
      path === "/"
        ? homeContent(checkoutAvailable)
        : legalPages[path]
          ? legalContent(path)
          : utilityContent(path),
  };
}
export interface SearchPlacement {
  id: string;
  title: string;
  tagline: string;
  host: string;
  activeSpend: number;
  expiresAt: number;
  rank?: number;
  nextRankCost?: number | null;
  category?: string;
}
export function placementSearchPage(
  path: string,
  listing: SearchPlacement | null,
  _share: number,
  live: boolean,
): SearchPage {
  const title = listing
    ? `${listing.title} — Qofeno`
    : "Placement unavailable — Qofeno";
  const description = listing
    ? `${listing.tagline} View its current paid rank and the scheduled expiry of its $${listing.activeSpend} active advertising placement.`
    : "This placement is not currently live. Explore Qofeno’s active paid board and editorial discoveries.";
  const content = listing
    ? `<article class="legal-page"><a class="legal-back" href="/">← Back to the board</a><header class="legal-heading"><div class="legal-heading-copy"><p class="eyebrow">Paid advertising placement</p><h1>${escapeHTML(listing.title)}</h1><p>${escapeHTML(listing.tagline)}</p><p>${escapeHTML(listing.host)}</p><p>Active advertising amount: US$${listing.activeSpend}. ${listing.rank ? `Overall paid rank: #${listing.rank}.` : ""} Latest current expiry: ${new Date(listing.expiresAt).toISOString().slice(0, 10)} UTC.</p><a class="button button-dark" href="/go/${encodeURIComponent(listing.id)}" rel="sponsored noopener noreferrer">Visit website ${arrow}</a><p>This is a reviewed advertising placement, not a Qofeno endorsement. Ranking can change as other purchases start or expire. Traffic, clicks and sales are not guaranteed.</p></div></header></article>`
    : '<article class="legal-page"><h1>This spot isn’t live.</h1><p>This link does not currently have an active public placement. Browse the paid board for websites that are live now.</p><a href="/">Back to the board</a></article>';
  return {
    path,
    title,
    description,
    status: listing ? 200 : 404,
    indexable: !!listing && live,
    content,
  };
}
/** Same initial HTML for people and crawlers; React replaces it after startup. */
export function renderSearchDocument(
  template: string,
  page: SearchPage,
  origin: string,
) {
  const canonical = origin + page.path;
  const robots = page.indexable ? "index,follow" : "noindex,nofollow";
  const metadata = `<title>${escapeHTML(page.title)}</title>\n<meta name="description" content="${escapeHTML(page.description)}" />\n<meta name="robots" content="${robots}" />\n<link rel="canonical" href="${escapeHTML(canonical)}" />\n<meta property="og:title" content="${escapeHTML(page.title)}" />\n<meta property="og:description" content="${escapeHTML(page.description)}" />\n<meta property="og:url" content="${escapeHTML(canonical)}" />\n<meta property="og:type" content="website" />\n<meta property="og:site_name" content="Qofeno" />\n<meta property="og:image" content="${escapeHTML(origin + sharePath)}" />\n<meta property="og:image:width" content="1200" />\n<meta property="og:image:height" content="630" />\n<meta property="og:image:alt" content="${escapeHTML(shareAlt)}" />\n<meta name="twitter:card" content="summary_large_image" />\n<meta name="twitter:title" content="${escapeHTML(page.title)}" />\n<meta name="twitter:description" content="${escapeHTML(page.description)}" />\n<meta name="twitter:image" content="${escapeHTML(origin + sharePath)}" />\n<meta name="twitter:image:alt" content="${escapeHTML(shareAlt)}" />${page.structuredData?.length ? `\n<script type="application/ld+json">${serializeStructuredData({ "@context": "https://schema.org", "@graph": page.structuredData })}</script>` : ""}`;
  let html = template
    .replace(/<title\b[^>]*>[\s\S]*?<\/title>/gi, "")
    .replace(
      /<meta\b[^>]*(?:name|property)=["'](?:description|robots|og:[^"']+|twitter:[^"']+)["'][^>]*>/gi,
      "",
    )
    .replace(/<link\b[^>]*rel=["']canonical["'][^>]*>/gi, "");
  html = /<\/head>/i.test(html)
    ? html.replace(/<\/head>/i, () => `${metadata}\n</head>`)
    : `<!doctype html><html lang="en"><head>${metadata}</head><body><div id="root"></div>${html}</body></html>`;
  const root = `<div id="root"><div class="motion-root">${header}<main id="main">${page.content}</main><footer class="site-footer" style="padding:32px max(24px,calc((100vw - 1200px)/2))"><p>Qofeno · Mohd Zaheeruddin, India · <a href="mailto:support@loopproof.me">support@loopproof.me</a></p><nav aria-label="Footer navigation">${footerLinks}</nav></footer></div></div>`;
  return html.replace(
    /<div\b[^>]*\bid=["']root["'][^>]*>\s*<\/div>/i,
    () => root,
  );
}

export function sitemapIndexXML(origin: string, cursors: string[]) {
  const urls = [
    `${origin}/sitemaps/pages.xml`,
    ...cursors.map(
      (cursor) =>
        `${origin}/sitemaps/placements/${encodeURIComponent(cursor)}.xml`,
    ),
  ];
  return `<?xml version="1.0" encoding="UTF-8"?>\n<sitemapindex xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">${urls.map((url) => `<sitemap><loc>${escapeHTML(url)}</loc></sitemap>`).join("")}</sitemapindex>`;
}
export function sitemapURLsXML(origin: string, paths: readonly string[]) {
  return `<?xml version="1.0" encoding="UTF-8"?>\n<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">${paths.map((path) => `<url><loc>${escapeHTML(origin + path)}</loc></url>`).join("")}</urlset>`;
}
