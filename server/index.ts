import DodoPayments from 'dodopayments';
import { timingSafeEqual } from 'node:crypto';
import { isApplicationPage, placementSearchPage, renderSearchDocument, staticSearchPage, sitemapIndexXML, sitemapURLsXML, SITEMAP_PAGE_SIZE, SITEMAP_INDEX_LIMIT, type SearchPage } from './seo';
import { publicRoutes } from '../src/lib/public-content';
import { isPlacementCategory, type PlacementCategory } from '../src/lib/placement-category';
import { visitorActivity, cleanupVisitors, VisitorError, type VisitorEnv } from './visitors';

export interface Env extends VisitorEnv {
  DB: D1Database;
  ASSETS: Fetcher;
  PUBLIC_SITE_URL?: string;
  DODO_PAYMENTS_API_KEY?: string;
  DODO_PAYMENTS_WEBHOOK_KEY?: string;
  DODO_PRODUCT_ID?: string;
  /** Explicit previous SKUs for the same ranked offer; never a client input. */
  DODO_COMPATIBLE_PRODUCT_IDS?: string;
  DODO_ENVIRONMENT?: 'test_mode' | 'live_mode';
  CHECKOUT_ENABLED?: string;
  QOFENO_ADMIN_KEY?: string;
  /** Native per-location burst guards, configured on both deployed Workers. */
  PUBLIC_READ_LIMITER?: RateLimit;
  SENSITIVE_REQUEST_LIMITER?: RateLimit;
  REQUIRE_REQUEST_PROTECTION?: string;
}
interface Order {
  id: string; listing_id: string; token_hash: string; units: number; product_id: string;
  provider_environment: 'test_mode' | 'live_mode'; checkout_session_id: string | null;
  payment_id: string | null; status: 'pending' | 'paid' | 'revoked';
  starts_at: number | null; expires_at: number | null;
  created_at: number; recovery_expires_at: number | null;
}
interface Listing {
  id: string; title: string; tagline: string; website: string; host: string; tone: string;
  category: PlacementCategory;
  provider_environment: 'test_mode' | 'live_mode'; moderation: 'pending' | 'approved' | 'rejected' | 'suspended';
  review_reason: string | null; clicks: number; created_at: number; updated_at: number;
}
interface PublicListing {
  id: string; title: string; tagline: string; website: string; host: string; tone: string;
  category: PlacementCategory; rank: number; nextRankCost: number | null;
  activeSpend: number; clicks: number; expiresAt: number;
  expirations: { at: number; amount: number }[];
}
class HttpError extends Error {
  constructor(public status: number, message: string, public retryAfter?: number) { super(message); }
}
const COOKIE = 'qofeno_access';
const UNIT_PRICE = 10;
const MAX_CHECKOUT_UNITS = 100;
const TERM_DAYS = 30;
const TERM_MS = TERM_DAYS * 86400000;
const PENDING_RECOVERY_MS = 86400000;
const CLEANUP_BATCH_SIZE = 100;
const securityHeaders = {
  'X-Content-Type-Options': 'nosniff', 'Referrer-Policy': 'no-referrer', 'X-Frame-Options': 'DENY',
  'Strict-Transport-Security': 'max-age=31536000',
  'X-Permitted-Cross-Domain-Policies': 'none',
  'Permissions-Policy': 'camera=(), microphone=(), geolocation=()',
  'Content-Security-Policy': "default-src 'self'; script-src 'self'; style-src 'self' 'unsafe-inline'; img-src 'self' data:; font-src 'self'; connect-src 'self'; object-src 'none'; frame-ancestors 'none'; base-uri 'none'; form-action 'self'",
};
const json = (data: unknown, status = 200, extra: Record<string, string> = {}) => new Response(JSON.stringify(data), {
  status, headers: { ...securityHeaders, 'Content-Type': 'application/json; charset=utf-8', 'Cache-Control': 'no-store', 'X-Robots-Tag': 'noindex, nofollow', ...extra },
});
export async function hashToken(value: string) {
  const result = await crypto.subtle.digest('SHA-256', new TextEncoder().encode(value));
  return Array.from(new Uint8Array(result), byte => byte.toString(16).padStart(2, '0')).join('');
}
function newToken() {
  return 'QF-' + btoa(String.fromCharCode(...crypto.getRandomValues(new Uint8Array(32)))).replace(/\+/g, '-').replace(/\//g, '_').replace(/=/g, '');
}
const isToken = (value: string) => /^QF-[A-Za-z0-9_-]{43}$/.test(value);
const mode = (env: Env) => ['test_mode', 'live_mode'].includes(env.DODO_ENVIRONMENT || '') ? env.DODO_ENVIRONMENT : null;
function compatibleOfferProducts(env: Env): string[] {
  const current = env.DODO_PRODUCT_ID || '';
  const configured = env.DODO_COMPATIBLE_PRODUCT_IDS || '';
  // Fail closed on malformed configuration. Only values enter SQL bindings;
  // placeholder count is bounded and no product ID is interpolated into SQL.
  if (!configured.trim() || configured.length > 2048) return [current];
  const previous = configured.split(',').map(value => value.trim());
  if (previous.length > 16 || previous.some(value => !/^pdt_[A-Za-z0-9]{1,80}$/.test(value))) return [current];
  return [...new Set([current, ...previous])];
}
function baseURL(env: Env): URL | null {
  try {
    const url = new URL(env.PUBLIC_SITE_URL || '');
    if (url.username || url.password || url.search || url.hash || url.pathname !== '/') return null;
    if (url.protocol !== 'https:' && !(url.protocol === 'http:' && ['localhost', '127.0.0.1'].includes(url.hostname))) return null;
    return url;
  } catch { return null; }
}
function ready(env: Env) {
  return !!(env.CHECKOUT_ENABLED === 'true' && env.DB && env.DODO_PAYMENTS_API_KEY && env.DODO_PAYMENTS_WEBHOOK_KEY && env.DODO_PRODUCT_ID && env.QOFENO_ADMIN_KEY && mode(env) && baseURL(env));
}
function status(env: Env) {
  return { checkoutAvailable: ready(env), mode: ready(env) ? (env.DODO_ENVIRONMENT === 'live_mode' ? 'live' : 'test') : 'unconfigured', unitPrice: UNIT_PRICE, maxCheckoutUnits: MAX_CHECKOUT_UNITS, termDays: TERM_DAYS, currency: 'USD' };
}
function provider(env: Env) {
  return new DodoPayments({ bearerToken: env.DODO_PAYMENTS_API_KEY, webhookKey: env.DODO_PAYMENTS_WEBHOOK_KEY,
    environment: env.DODO_ENVIRONMENT === 'live_mode' ? 'live_mode' : 'test_mode', maxRetries: 1, timeout: 15000 });
}
function sessionCookie(token: string, request: Request) {
  return `${COOKIE}=${token}; Path=/; HttpOnly; SameSite=Lax; Max-Age=31536000${new URL(request.url).protocol === 'https:' ? '; Secure' : ''}`;
}
function clearSessionCookie(request: Request) {
  return `${COOKIE}=; Path=/; HttpOnly; SameSite=Lax; Max-Age=0; Expires=Thu, 01 Jan 1970 00:00:00 GMT${new URL(request.url).protocol === 'https:' ? '; Secure' : ''}`;
}
async function boundedText(request: Request, maxBytes = 8192) {
  if (Number(request.headers.get('content-length')) > maxBytes) throw new HttpError(413, 'The request is too large.');
  if (!request.body) return '';
  const reader = request.body.getReader(); const chunks: Uint8Array[] = []; let length = 0;
  while (true) {
    const { done, value } = await reader.read(); if (done) break;
    length += value.length; if (length > maxBytes) { await reader.cancel(); throw new HttpError(413, 'The request is too large.'); }
    chunks.push(value);
  }
  const result = new Uint8Array(length); let offset = 0;
  for (const chunk of chunks) { result.set(chunk, offset); offset += chunk.length; }
  return new TextDecoder().decode(result);
}
async function body(request: Request): Promise<Record<string, unknown>> {
  if (request.headers.get('content-type')?.split(';')[0].trim().toLowerCase() !== 'application/json') throw new HttpError(415, 'Use a JSON request.');
  const raw = await boundedText(request);
  try {
    const input: unknown = JSON.parse(raw);
    if (!input || typeof input !== 'object' || Array.isArray(input)) throw new Error();
    return input as Record<string, unknown>;
  } catch { throw new HttpError(400, 'The request could not be read.'); }
}
async function rateLimit(request: Request, env: Env, action: string, limit: number, seconds: number) {
  const now = Math.floor(Date.now() / 1000);
  const key = `${action}:${Math.floor(now / seconds)}:${await hashToken(request.headers.get('CF-Connecting-IP') || 'local')}`;
  await env.DB.prepare('DELETE FROM rate_limits WHERE key IN (SELECT key FROM rate_limits WHERE expires_at < ? ORDER BY expires_at LIMIT ?)').bind(now, CLEANUP_BATCH_SIZE).run();
  const result = await env.DB.prepare('INSERT INTO rate_limits (key, attempts, expires_at) VALUES (?, 1, ?) ON CONFLICT(key) DO UPDATE SET attempts = attempts + 1 RETURNING attempts')
    .bind(key, now + seconds).first<{ attempts: number }>();
  if (!result || result.attempts > limit) throw new HttpError(429, 'Too many attempts. Please wait a few minutes and try again.');
}
async function nativeRateLimit(request: Request, env: Env, kind: 'read' | 'sensitive') {
  const limiter = kind === 'read' ? env.PUBLIC_READ_LIMITER : env.SENSITIVE_REQUEST_LIMITER;
  // Deployed configurations require the bindings, so accidental omission fails
  // closed. Older local fixtures can omit both the bindings and this flag.
  if (!limiter) {
    if (env.REQUIRE_REQUEST_PROTECTION === 'true')
      throw new HttpError(503, 'Request protection is temporarily unavailable. Please try again shortly.');
    return;
  }
  const key = await hashToken(request.headers.get('CF-Connecting-IP') || 'local');
  let outcome: RateLimitOutcome;
  try { outcome = await limiter.limit({ key }); }
  catch { throw new HttpError(503, 'Request protection is temporarily unavailable. Please try again shortly.'); }
  if (outcome?.success === false) throw new HttpError(429, 'Too many requests. Please wait one minute and try again.', 60);
  if (outcome?.success !== true) throw new HttpError(503, 'Request protection is temporarily unavailable. Please try again shortly.');
}
async function orderFor(request: Request, env: Env): Promise<Order | null> {
  const token = request.headers.get('cookie')?.split(';').map(x => x.trim()).find(x => x.startsWith(`${COOKIE}=`))?.slice(COOKIE.length + 1);
  if (!token || !isToken(token) || !env.DB) return null;
  const order = await env.DB.prepare('SELECT * FROM orders WHERE token_hash = ?').bind(await hashToken(token)).first<Order>();
  return order?.provider_environment === mode(env) ? order : null;
}
async function activeTotals(id: string, env: Env) {
  return await env.DB.prepare("SELECT COALESCE(SUM(units * ?), 0) AS activeSpend, MAX(expires_at) AS expiresAt FROM orders WHERE listing_id = ? AND provider_environment = ? AND status = 'paid' AND starts_at <= ? AND expires_at > ?")
    .bind(UNIT_PRICE, id, mode(env), Date.now(), Date.now()).first<{ activeSpend: number; expiresAt: number | null }>() || { activeSpend: 0, expiresAt: null };
}
function pendingRecoveryExpired(order: Order | null) {
  return !!order && order.status === 'pending' && (order.recovery_expires_at ?? order.created_at + PENDING_RECOVERY_MS) <= Date.now();
}
async function sessionInfo(order: Order | null, env: Env) {
  if (!order) return { paid: false, status: 'none' };
  if (pendingRecoveryExpired(order)) return { paid: false, status: 'expired' };
  const listing = await env.DB.prepare('SELECT * FROM listings WHERE id = ?').bind(order.listing_id).first<Listing>();
  const totals = listing ? await activeTotals(listing.id, env) : null;
  return { paid: order.status === 'paid', status: order.status, checkoutId: order.id,
    order: { units: order.units, amount: order.units * UNIT_PRICE, startsAt: order.starts_at, expiresAt: order.expires_at },
    listing: listing ? { id: listing.id, title: listing.title, tagline: listing.tagline, website: listing.website, host: listing.host, tone: listing.tone, category: listing.category,
      moderation: listing.moderation, reviewReason: listing.review_reason, clicks: listing.clicks, ...totals } : undefined,
  };
}
function textField(input: unknown, name: string, max: number) {
  if (typeof input !== 'string' || !input.trim() || input.trim().length > max || /[\u0000-\u001f\u007f<>]/.test(input)) throw new HttpError(400, `${name} must contain 1–${max} characters without markup or control characters.`);
  return input.trim();
}
function websiteField(input: unknown) {
  if (typeof input !== 'string' || input.length > 2048) throw new HttpError(400, 'Enter a complete public website address.');
  try {
    const url = new URL(input.trim()); const host = url.hostname.toLowerCase();
    if (!['https:', 'http:'].includes(url.protocol) || url.username || url.password || (url.port && !['80', '443'].includes(url.port)) ||
      !host.includes('.') || host.endsWith('.') || host.includes(':') || /^\d+(\.\d+)*$/.test(host) ||
      /(^|\.)(localhost|local|internal|test|invalid|onion)$/.test(host) || !/^[a-z0-9.-]+\.[a-z]{2,}$/.test(host)) throw new Error();
    return { website: url.href, host: host.replace(/^www\./, '') };
  } catch { throw new HttpError(400, 'Use an HTTP or HTTPS address on a public domain, without credentials or a custom port.'); }
}
async function checkout(request: Request, env: Env) {
  if (!ready(env)) throw new HttpError(503, 'Payments are not open yet. No payment has been taken.');
  if (new URL(request.url).origin !== baseURL(env)!.origin) throw new HttpError(403, 'Please purchase from the official Qofeno website.');
  await nativeRateLimit(request, env, 'sensitive');
  await rateLimit(request, env, 'checkout', 4, 600);
  const input = await body(request);
  if (typeof input.email !== 'string' || input.email.length > 254 || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(input.email)) throw new HttpError(400, 'Enter a valid email address for your receipt.');
  if (!Number.isInteger(input.units) || Number(input.units) < 1 || Number(input.units) > MAX_CHECKOUT_UNITS) throw new HttpError(400, 'Choose a whole number of $10 units, from 1 to 100.');
  if (input.category !== undefined && !isPlacementCategory(input.category)) throw new HttpError(400, 'Choose one of the available website categories.');
  const units = Number(input.units); const now = Date.now(); let listing: Listing | null = null;
  if (input.listingId !== undefined) {
    const ownedOrder = await orderFor(request, env);
    if (typeof input.listingId !== 'string' || !ownedOrder || ownedOrder.status !== 'paid' || ownedOrder.listing_id !== input.listingId) throw new HttpError(403, 'Restore a paid purchase for this listing before adding a placement purchase.');
    listing = await env.DB.prepare('SELECT * FROM listings WHERE id = ? AND provider_environment = ?').bind(input.listingId, mode(env)).first<Listing>();
    if (!listing || listing.moderation !== 'approved') throw new HttpError(409, 'Only approved listings can add another placement purchase.');
  } else {
    const title = textField(input.title, 'The listing title', 40); const tagline = textField(input.tagline, 'The tagline', 100);
    const website = websiteField(input.website);
    if (typeof input.tone !== 'string' || !['ink', 'red', 'blue', 'green', 'yellow', 'plum'].includes(input.tone)) throw new HttpError(400, 'Choose one of the available colors.');
    listing = { id: crypto.randomUUID(), title, tagline, ...website, tone: input.tone, category: input.category === undefined ? 'other' : input.category as PlacementCategory, provider_environment: mode(env)!, moderation: 'pending', review_reason: null, clicks: 0, created_at: now, updated_at: now };
  }
  const client = provider(env); let product;
  try { product = await client.products.retrieve(env.DODO_PRODUCT_ID!); }
  catch { throw new HttpError(502, 'The placement price could not be checked. Please try again.'); }
  const price = product.price;
  if (product.product_id !== env.DODO_PRODUCT_ID || product.is_recurring !== false || product.pricing_mode != null || !price || price.type !== 'one_time_price' || price.currency !== 'USD' || price.price !== UNIT_PRICE * 100 || price.pay_what_you_want || price.purchasing_power_parity || price.tax_inclusive === true || (price.discount_bps ?? price.discount ?? 0) !== 0) throw new HttpError(503, 'The placement is not configured at its advertised one-time price. Please contact support@loopproof.me.');
  const id = crypto.randomUUID(); const token = newToken();
  const statements: D1PreparedStatement[] = [];
  if (input.listingId === undefined) statements.push(env.DB.prepare('INSERT INTO listings (id,title,tagline,website,host,tone,category,provider_environment,created_at,updated_at) VALUES (?,?,?,?,?,?,?,?,?,?)').bind(listing.id, listing.title, listing.tagline, listing.website, listing.host, listing.tone, listing.category, mode(env), now, now));
  statements.push(env.DB.prepare('INSERT INTO orders (id,listing_id,token_hash,units,product_id,provider_environment,created_at,updated_at,recovery_expires_at) VALUES (?,?,?,?,?,?,?,?,?)').bind(id, listing.id, await hashToken(token), units, env.DODO_PRODUCT_ID!, mode(env), now, now, now + PENDING_RECOVERY_MS));
  await env.DB.batch(statements);
  let result;
  try {
    result = await client.checkoutSessions.create({ product_cart: [{ product_id: env.DODO_PRODUCT_ID!, quantity: units }], customer: { email: input.email }, metadata: { order_id: id },
      billing_currency: 'USD', feature_flags: { allow_currency_selection: false, allow_discount_code: false },
      customization: { theme: 'dark', show_order_details: true, show_on_demand_tag: false,
        theme_config: { radius: '12px', font_size: 'md', font_weight: 'normal',
          dark: { bg_primary: '#0e100f', bg_secondary: '#191d17', text_primary: '#fffce1', text_secondary: '#bbbaa6',
            text_placeholder: '#a7ad9c', text_error: '#ffb29c', text_success: '#c9ff6b', border_primary: '#505545',
            border_secondary: '#3b4034', button_primary: '#c9ff6b', button_primary_hover: '#dcffa8',
            button_text_primary: '#0e100f', button_secondary: '#252b20', button_secondary_hover: '#343f29',
            button_text_secondary: '#fffce1', input_focus_border: '#c9ff6b' } } },
      return_url: `${baseURL(env)!.origin}/my-spot?checkout=return`, cancel_url: `${baseURL(env)!.origin}/?checkout=cancelled`, });
  } catch { throw new HttpError(502, 'Checkout could not be opened. Please try again.'); }
  if (!result.checkout_url || !result.session_id) throw new HttpError(502, 'The payment provider did not return a checkout. Please try again.');
  let target: URL;
  try { target = new URL(result.checkout_url); } catch { throw new HttpError(502, 'The payment provider returned an invalid checkout address.'); }
  if (target.protocol !== 'https:' || target.username || target.password || target.port ||
    !['checkout.dodopayments.com', 'test.checkout.dodopayments.com'].includes(target.hostname)) throw new HttpError(502, 'The payment provider returned an invalid checkout address.');
  await env.DB.prepare('UPDATE orders SET checkout_session_id = ?, updated_at = ? WHERE id = ?').bind(result.session_id, Date.now(), id).run();
  return json({ checkoutUrl: result.checkout_url, recoveryCode: token, checkoutId: id, recoveryExpiresAt: now + PENDING_RECOVERY_MS }, 200, { 'Set-Cookie': sessionCookie(token, request) });
}
async function leaveCheckout(request: Request, env: Env) {
  if (!env.DB || !mode(env)) throw new HttpError(503, 'Checkout cleanup is temporarily unavailable. Please try again.');
  await nativeRateLimit(request, env, 'sensitive');
  const input = await body(request);
  if (typeof input.checkoutId !== 'string' || !/^[A-Za-z0-9_-]{1,120}$/.test(input.checkoutId)) throw new HttpError(400, 'Choose the checkout you want to close.');
  await rateLimit(request, env, 'checkout-leave', 20, 600);
  const order = await orderFor(request, env);
  // The navigation marker is not a capability. The HttpOnly recovery cookie
  // must identify the same pending checkout, so an old tab cannot clear a
  // newer authenticated checkout merely by submitting its old marker.
  if (!order || order.id !== input.checkoutId || order.status !== 'pending')
    return json({ cleared: false, expired: false, status: pendingRecoveryExpired(order) ? 'expired' : order?.status || 'none' });
  // Only pending access expires. Keep the order and hash: leaving a screen
  // does not cancel a provider payment, and a later signed confirmation must
  // still be recoverable with the originally saved code. The conditional
  // update and reread preserve a payment confirmed during this request.
  const now = Date.now();
  await env.DB.prepare("UPDATE orders SET recovery_expires_at = MIN(COALESCE(recovery_expires_at, created_at + ?), ?),updated_at = ? WHERE id = ? AND provider_environment = ? AND status = 'pending'")
    .bind(PENDING_RECOVERY_MS, now, now, order.id, mode(env)).run();
  const current = await orderFor(request, env);
  if (!current || current.id !== order.id || current.status !== 'pending')
    return json({ cleared: false, expired: false, status: current?.status || 'none' });
  return json({ cleared: true, expired: true, status: 'expired' }, 200, { 'Set-Cookie': clearSessionCookie(request) });
}
const publicMode = (env: Env) => mode(env) === 'test_mode' ? 'test' : mode(env) === 'live_mode' ? 'live' : 'unconfigured';
type PublicRow = Omit<PublicListing, 'expirations'> & { expirationRows: string; boardTotal: number };

/** One authoritative instant and one indexed query for ranks, amounts and schedules.
 * Global window values are calculated before a detail filter. Ties use the older
 * listing, then its ID; buying again never resets that priority. The next-rank
 * quote can therefore match an amount when this listing would win the tie.
 * Quotes are snapshots, not reserved positions. No order identity,
 * payment reference, recovery capability or private moderation state is selected.
 */
async function publicListings(env: Env, asOf: number, onlyId?: string) {
  const rows = (await env.DB.prepare(`WITH active AS (
    SELECT l.id,l.title,l.tagline,l.website,l.host,l.tone,l.category,l.clicks,l.created_at AS sortCreated,
      SUM(o.units * ?) AS activeSpend,MAX(o.expires_at) AS expiresAt,
      json_group_array(json_object('at',o.expires_at,'amount',o.units * ?)) AS expirationRows
    FROM listings l JOIN orders o ON o.listing_id = l.id
    WHERE l.moderation = 'approved' AND l.provider_environment = ? AND o.provider_environment = ?
      AND o.status = 'paid' AND o.starts_at <= ? AND o.expires_at > ?
    GROUP BY l.id
  ), ranked AS (
    SELECT active.*,SUM(activeSpend) OVER () AS boardTotal,
      ROW_NUMBER() OVER standings AS rank,
      LAG(activeSpend) OVER standings AS previousSpend,
      LAG(sortCreated) OVER standings AS previousCreated,
      LAG(id) OVER standings AS previousId
    FROM active WINDOW standings AS (ORDER BY activeSpend DESC,sortCreated ASC,id ASC)
  ) SELECT *,CASE WHEN rank = 1 THEN NULL ELSE previousSpend - activeSpend +
      CASE WHEN sortCreated < previousCreated OR (sortCreated = previousCreated AND id < previousId) THEN 0 ELSE ? END
    END AS nextRankCost FROM ranked
    ${onlyId === undefined ? '' : 'WHERE id = ?'}
    ORDER BY activeSpend DESC,sortCreated ASC,id ASC`)
    .bind(UNIT_PRICE, UNIT_PRICE, mode(env), mode(env), asOf, asOf, UNIT_PRICE, ...(onlyId === undefined ? [] : [onlyId]))
    .all<PublicRow>()).results || [];
  return {
    totalActiveSpend: rows[0]?.boardTotal || 0,
    listings: rows.map((row): PublicListing => {
      const grouped = new Map<number, number>();
      for (const item of JSON.parse(row.expirationRows) as { at: number; amount: number }[])
        grouped.set(item.at, (grouped.get(item.at) || 0) + item.amount);
      return { id: row.id, title: row.title, tagline: row.tagline, website: row.website, host: row.host, tone: row.tone,
        category: row.category, rank: row.rank, nextRankCost: row.nextRankCost,
        clicks: row.clicks, activeSpend: row.activeSpend, expiresAt: row.expiresAt,
        expirations: Array.from(grouped, ([at, amount]) => ({ at, amount })).sort((a, b) => a.at - b.at) };
    }),
  };
}
async function board(env: Env) {
  const asOf = Date.now();
  const { listings, totalActiveSpend } = await publicListings(env, asOf);
  return json({ ...status(env), mode: publicMode(env), asOf, listings, totalActiveSpend, activeCount: listings.length,
    firstPlaceCost: (listings[0]?.activeSpend || 0) + UNIT_PRICE });
}
function placementId(raw: string) {
  try { const id = decodeURIComponent(raw); return /^[A-Za-z0-9_-]{1,120}$/.test(id) ? id : null; }
  catch { return null; }
}
async function placementData(env: Env, rawId: string) {
  const asOf = Date.now(); const id = placementId(rawId);
  const result = id ? await publicListings(env, asOf, id) : { listings: [], totalActiveSpend: 0 };
  const listing = result.listings[0];
  return listing ? { asOf, listing, totalActiveSpend: result.totalActiveSpend, share: listing.activeSpend / result.totalActiveSpend, mode: publicMode(env) } : null;
}
async function publicPlacement(env: Env, rawId: string) {
  const data = await placementData(env, rawId);
  if (!data) throw new HttpError(404, 'This placement is not currently live.');
  return json(data);
}
async function searchDocument(request: Request, env: Env, page: SearchPage) {
  // Fetch the canonical shell without private cookies, range headers or validators.
  const asset = await env.ASSETS.fetch(new Request(new URL('/index.html', request.url), { headers: { Accept: 'text/html' } }));
  if (!asset.ok) throw new HttpError(503, 'The page is temporarily unavailable.');
  const html = renderSearchDocument(await asset.text(), page, baseURL(env)?.origin || 'https://loopproof.me');
  return new Response(request.method === 'HEAD' ? null : html, { status: page.status,
    headers: { ...securityHeaders, 'Content-Type': 'text/html; charset=utf-8', 'Cache-Control': 'no-store',
      ...(page.indexable ? {} : { 'X-Robots-Tag': 'noindex, nofollow' }) } });
}
async function applicationPage(request: Request, env: Env, path: string) {
  return searchDocument(request, env, staticSearchPage(path, baseURL(env)?.origin || 'https://loopproof.me', mode(env) === 'live_mode', ready(env)));
}
async function placementPage(request: Request, env: Env, rawId: string) {
  const data = await placementData(env, rawId);
  const path = `/spot/${encodeURIComponent(placementId(rawId) || 'unavailable')}`;
  return searchDocument(request, env, placementSearchPage(path, data?.listing || null, data?.share || 0, data?.mode === 'live'));
}
const sitemapEligibility = `l.moderation = 'approved' AND l.provider_environment = ?
  AND EXISTS (SELECT 1 FROM orders o WHERE o.listing_id = l.id AND o.provider_environment = ?
    AND o.status = 'paid' AND o.starts_at <= ? AND o.expires_at > ?)`;
async function sitemap(request: Request, env: Env, path: string) {
  if (mode(env) !== 'live_mode') throw new HttpError(404, 'Sitemaps are only available on the live site.');
  const origin = baseURL(env)?.origin || 'https://loopproof.me';
  const now = Date.now();
  let xml: string;
  if (path === '/sitemaps/pages.xml') xml = sitemapURLsXML(origin, publicRoutes);
  else if (path === '/sitemap.xml') {
    // Each public shard and the index have a fixed maximum size. Only IDs are read.
    const rows = (await env.DB.prepare(`SELECT MIN(id) AS cursor FROM (
      SELECT l.id, ROW_NUMBER() OVER (ORDER BY l.id) AS rowNumber FROM listings l WHERE ${sitemapEligibility}
    ) GROUP BY CAST((rowNumber - 1) / ? AS INTEGER) ORDER BY cursor LIMIT ?`)
      .bind(mode(env), mode(env), now, now, SITEMAP_PAGE_SIZE, SITEMAP_INDEX_LIMIT).all<{ cursor: string }>()).results || [];
    xml = sitemapIndexXML(origin, rows.map(row => row.cursor));
  } else {
    const match = path.match(/^\/sitemaps\/placements\/([^/]+)\.xml$/);
    const cursor = match ? placementId(match[1]) : null;
    if (!cursor) throw new HttpError(404, 'This sitemap does not exist.');
    const rows = (await env.DB.prepare(`SELECT l.id FROM listings l WHERE ${sitemapEligibility} AND l.id >= ? ORDER BY l.id LIMIT ?`)
      .bind(mode(env), mode(env), now, now, cursor, SITEMAP_PAGE_SIZE).all<{ id: string }>()).results || [];
    if (!rows.length) throw new HttpError(404, 'This sitemap has no active placements.');
    xml = sitemapURLsXML(origin, rows.map(row => `/spot/${encodeURIComponent(row.id)}`));
  }
  return new Response(request.method === 'HEAD' ? null : xml, { headers: { ...securityHeaders,
    'Content-Type': 'application/xml; charset=utf-8', 'Cache-Control': 'public, max-age=60' } });
}
async function outbound(request: Request, env: Env, id: string) {
  const listing = await env.DB.prepare("SELECT * FROM listings WHERE id = ? AND moderation = 'approved' AND provider_environment = ?").bind(id, mode(env)).first<Listing>();
  if (!listing || (await activeTotals(id, env)).activeSpend <= 0) throw new HttpError(404, 'This placement is no longer active.');
  if (request.method === 'GET') {
    const now = Date.now(); const day = new Date(now).toISOString().slice(0, 10);
    // Hash changes each UTC day; no raw visitor IP is stored. Redirect requests
    // are deduplicated, not certified as human visitors or business leads.
    const visitorHash = await hashToken(`${day}:${request.headers.get('CF-Connecting-IP') || 'local'}`);
    try {
      await env.DB.batch([
        env.DB.prepare('DELETE FROM click_dedupe WHERE rowid IN (SELECT rowid FROM click_dedupe WHERE expires_at < ? ORDER BY expires_at LIMIT ?)').bind(now, CLEANUP_BATCH_SIZE),
        env.DB.prepare('UPDATE listings SET clicks = clicks + 1 WHERE id = ? AND NOT EXISTS(SELECT 1 FROM click_dedupe WHERE listing_id = ? AND visitor_hash = ? AND day = ?)').bind(id, id, visitorHash, day),
        env.DB.prepare('INSERT OR IGNORE INTO click_dedupe (listing_id,visitor_hash,day,expires_at) VALUES (?,?,?,?)').bind(id, visitorHash, day, now + 2 * 86400000),
      ]);
    } catch {
      // Paid navigation remains available when nonessential analytics writes
      // hit a quota or transient failure. Do not log customer data or secrets.
      console.error('Qofeno click metrics could not be recorded.');
    }
  }
  return new Response(null, { status: 302, headers: { ...securityHeaders, Location: listing.website, 'Cache-Control': 'no-store' } });
}
async function admin(request: Request, env: Env, path: string) {
  if (!env.QOFENO_ADMIN_KEY) throw new HttpError(503, 'Moderation access is not configured.');
  const authorization = request.headers.get('authorization') || '';
  const supplied = authorization.length <= 512 ? /^Bearer[ \t]+([^\s]+)[ \t]*$/i.exec(authorization)?.[1] : undefined;
  // Compare fixed-size digests, not variable-length secret strings. Failed
  // attempts share an IP bucket across moderation endpoints; a correct key can
  // still sign in when someone on the same network exhausts that bucket.
  const authenticated = supplied && timingSafeEqual(
    new TextEncoder().encode(await hashToken(supplied)),
    new TextEncoder().encode(await hashToken(env.QOFENO_ADMIN_KEY)),
  );
  if (!authenticated) {
    if (!env.DB) throw new HttpError(503, 'Owner sign-in is temporarily unavailable.');
    await nativeRateLimit(request, env, 'sensitive');
    await rateLimit(request, env, 'owner-signin', 10, 600);
    throw new HttpError(401, 'The owner key was not accepted. Use your private owner key to open the review desk.');
  }
  if (path === '/api/admin/listings' && request.method === 'GET') {
    const listings = (await env.DB.prepare(`SELECT l.*,SUM(CASE WHEN o.status = 'paid' THEN o.units * ? ELSE 0 END) AS paidAmount,
      COUNT(CASE WHEN o.status = 'paid' THEN 1 END) AS paidOrders FROM listings l JOIN orders o ON o.listing_id = l.id
      WHERE l.provider_environment = ? GROUP BY l.id HAVING paidOrders > 0 ORDER BY l.created_at ASC`).bind(UNIT_PRICE, mode(env)).all()).results;
    return json({ listings });
  }
  if (path === '/api/admin/review' && request.method === 'POST') {
    const input = await body(request);
    if (typeof input.listingId !== 'string' || !['approve', 'reject', 'suspend'].includes(String(input.action))) throw new HttpError(400, 'Choose a listing and a valid review action.');
    const listing = await env.DB.prepare('SELECT * FROM listings WHERE id = ? AND provider_environment = ?').bind(input.listingId, mode(env)).first<Listing>();
    if (!listing) throw new HttpError(404, 'The listing could not be found.');
    const now = Date.now();
    const allPaid = (await env.DB.prepare("SELECT id AS orderId,payment_id AS paymentId,units * ? AS amount,starts_at AS startsAt,expires_at AS expiresAt FROM orders WHERE listing_id = ? AND status = 'paid' AND provider_environment = ?")
      .bind(UNIT_PRICE, listing.id, mode(env)).all<{ orderId: string; paymentId: string; amount: number; startsAt: number | null; expiresAt: number | null }>()).results;
    if (!allPaid.length) throw new HttpError(409, 'There is no confirmed payment to review.');
    // Moderation of today's placement must not instruct refunds for old,
    // fully delivered terms. Keep that history separate for exceptional review.
    const paid = allPaid.filter(order => order.startsAt === null || (order.expiresAt !== null && order.expiresAt > now));
    const historicalPayments = allPaid.filter(order => order.startsAt !== null && (order.expiresAt === null || order.expiresAt <= now));
    if (input.action === 'approve') {
      if (listing.moderation === 'rejected') throw new HttpError(409, 'A rejected listing requires refund resolution, not reactivation.');
      // A checkout for a previous offer may settle after the product changes.
      // Keep its verified payment recoverable, but never silently deliver a new
      // offer in place of the purchased one. A started order proves the listing
      // was already approved, preserving history when product IDs rotate. A new
      // listing remains protected if it was suspended before its first approval.
      // A catalog refresh with identical terms may explicitly retain previous
      // ranked SKUs. This never relaxes the webhook's exact stored-order match.
      const compatibleProducts = compatibleOfferProducts(env);
      const placeholders = compatibleProducts.map(() => '?').join(',');
      if (await env.DB.prepare(`SELECT id FROM orders WHERE listing_id = ? AND status = 'paid' AND provider_environment = ? AND product_id NOT IN (${placeholders}) AND NOT EXISTS(SELECT 1 FROM orders AS history WHERE history.listing_id = orders.listing_id AND history.provider_environment = orders.provider_environment AND history.starts_at IS NOT NULL) LIMIT 1`)
        .bind(listing.id, mode(env), ...compatibleProducts).first())
        throw new HttpError(409, 'This payment purchased a previous offer. Its terms cannot be silently changed. Reject the listing and issue a full refund through Dodo before asking the customer to make a new purchase.');
      const approved = await env.DB.batch([
        env.DB.prepare(`UPDATE listings SET moderation = 'approved',review_reason = NULL,updated_at = ? WHERE id = ? AND moderation <> 'rejected' AND NOT EXISTS(SELECT 1 FROM orders WHERE listing_id = listings.id AND status = 'paid' AND provider_environment = ? AND product_id NOT IN (${placeholders}) AND NOT EXISTS(SELECT 1 FROM orders AS history WHERE history.listing_id = orders.listing_id AND history.provider_environment = orders.provider_environment AND history.starts_at IS NOT NULL))`).bind(now, listing.id, mode(env), ...compatibleProducts),
        env.DB.prepare("UPDATE orders SET starts_at = ?,expires_at = ?,updated_at = ? WHERE listing_id = ? AND status = 'paid' AND starts_at IS NULL AND provider_environment = ? AND EXISTS(SELECT 1 FROM listings WHERE listings.id = orders.listing_id AND moderation = 'approved')").bind(now, now + TERM_MS, now, listing.id, mode(env)),
      ]);
      if (!approved[0].meta.changes) throw new HttpError(409, 'The listing was rejected or a payment for a previous offer arrived during this review. Check its payments and resolve any required refund through Dodo before further action.');
      return json({ reviewed: true, moderation: 'approved', refundRequired: false });
    }
    const reason = textField(input.reason, 'The review reason', 300);
    const moderation = input.action === 'reject' ? 'rejected' : 'suspended';
    await env.DB.prepare('UPDATE listings SET moderation = ?,review_reason = ?,updated_at = ? WHERE id = ?').bind(moderation, reason, now, listing.id).run();
    // Financial refunds are completed by the operator in Dodo. Signed refund
    // events revoke the corresponding weights; never report an unperformed refund.
    return json({ reviewed: true, moderation, refundRequired: paid.length > 0, payments: paid, historicalPayments,
      nextAction: paid.length > 0
        ? 'Issue full refunds for the current or unstarted payments listed in payments. Historical payments are not included in this default action. Refund webhooks will update the orders. No refund has been issued by this action.'
        : 'No current or unstarted payments require a refund through this action. Historical payments are listed separately for individual review if needed. No refund has been issued by this action.' });
  }
  throw new HttpError(404, 'This moderation endpoint does not exist.');
}
async function webhook(request: Request, env: Env) {
  if (!env.DODO_PAYMENTS_WEBHOOK_KEY || !env.DODO_PAYMENTS_API_KEY || !mode(env) || !env.DB) throw new HttpError(503, 'Payment notifications are not configured.');
  const raw = await boundedText(request, 262144);
  const headers = Object.fromEntries(['webhook-id', 'webhook-timestamp', 'webhook-signature'].map(key => [key, request.headers.get(key) || '']));
  let event;
  try { event = await provider(env).webhooks.unwrap(raw, { headers }); } catch { throw new HttpError(401, 'Invalid payment notification signature.'); }
  const eventId = `${mode(env)}:${headers['webhook-id']}`;
  if (await env.DB.prepare('SELECT id FROM webhook_events WHERE id = ?').bind(eventId).first()) return json({ received: true });
  const statements: D1PreparedStatement[] = []; const now = Date.now();
  let expectedPayment: { orderId: string; paymentId: string } | undefined;
  if (event.type === 'payment.succeeded') {
    const payment = event.data; const orderId = payment.metadata?.order_id;
    const order = typeof orderId === 'string' ? await env.DB.prepare('SELECT * FROM orders WHERE id = ?').bind(orderId).first<Order>() : null;
    if (!order) return json({ received: true, ignored: true });
    if (!order.checkout_session_id) throw new HttpError(503, 'Checkout is still being recorded. Retry this notification.');
    if (order.provider_environment !== mode(env) || payment.status !== 'succeeded' || !payment.payment_id || payment.checkout_session_id !== order.checkout_session_id || payment.product_cart?.length !== 1 || payment.product_cart[0].product_id !== order.product_id || payment.product_cart[0].quantity !== order.units || (order.payment_id && order.payment_id !== payment.payment_id)) throw new HttpError(400, 'Payment does not match this order.');
    // Dodo's total_amount includes tax, in the customer's currency's minor
    // units. Tax is optional/null when none is collected. Only the advertised
    // USD unit subtotal contributes weight; a signed event alone does not prove
    // its price still matches the product checked before checkout was created.
    const tax = payment.tax ?? 0;
    if (payment.currency !== 'USD' || !Number.isSafeInteger(payment.total_amount) || !Number.isSafeInteger(tax) || tax < 0 || payment.total_amount - tax !== order.units * UNIT_PRICE * 100) throw new HttpError(400, 'Payment currency or amount does not match this order.');
    expectedPayment = { orderId: order.id, paymentId: payment.payment_id };
    statements.push(env.DB.prepare(`UPDATE orders SET payment_id = ?,status = CASE WHEN EXISTS(SELECT 1 FROM payment_blocks WHERE payment_id = ? AND provider_environment = ? AND blocked = 1) THEN 'revoked' ELSE 'paid' END,
      starts_at = CASE WHEN starts_at IS NULL AND EXISTS(SELECT 1 FROM listings WHERE id = listing_id AND moderation = 'approved') THEN ? ELSE starts_at END,
      expires_at = CASE WHEN starts_at IS NULL AND EXISTS(SELECT 1 FROM listings WHERE id = listing_id AND moderation = 'approved') THEN ? ELSE expires_at END,updated_at = ? WHERE id = ? AND (payment_id IS NULL OR payment_id = ?)` )
      .bind(payment.payment_id, payment.payment_id, mode(env), now, now + TERM_MS, now, order.id, payment.payment_id));
  } else if (event.type === 'refund.succeeded') {
    const refund = event.data;
    if (!refund.refund_id || !refund.payment_id || refund.status !== 'succeeded' || typeof refund.is_partial !== 'boolean') throw new HttpError(400, 'The refund notification is incomplete.');
    // Any refund removes this order's full advertising weight. Partial refund
    // allocation requires operator review; retaining the old spend would overstate it.
    {
      statements.push(env.DB.prepare('INSERT INTO payment_blocks (reference,payment_id,provider_environment,blocked,occurred_at) VALUES (?,?,?,1,?) ON CONFLICT(reference) DO NOTHING')
        .bind(`${mode(env)}:refund:${refund.refund_id}`, refund.payment_id, mode(env), now));
      statements.push(env.DB.prepare("UPDATE orders SET status = 'revoked',updated_at = ? WHERE payment_id = ? AND provider_environment = ?").bind(now, refund.payment_id, mode(env)));
    }
  } else if (event.type.startsWith('dispute.')) {
    const dispute = event.data as { dispute_id?: string; payment_id?: string }; const occurredAt = Date.parse(event.timestamp);
    const supported = ['dispute.opened', 'dispute.challenged', 'dispute.won', 'dispute.cancelled', 'dispute.accepted', 'dispute.lost', 'dispute.expired'];
    if (supported.includes(event.type) && dispute.dispute_id && dispute.payment_id && Number.isFinite(occurredAt)) {
      const blocked = ['dispute.won', 'dispute.cancelled'].includes(event.type) ? 0 : 1;
      statements.push(env.DB.prepare('INSERT INTO payment_blocks (reference,payment_id,provider_environment,blocked,occurred_at) VALUES (?,?,?,?,?) ON CONFLICT(reference) DO UPDATE SET blocked = excluded.blocked,occurred_at = excluded.occurred_at WHERE excluded.occurred_at > payment_blocks.occurred_at')
        .bind(`${mode(env)}:dispute:${dispute.dispute_id}`, dispute.payment_id, mode(env), blocked, occurredAt));
      statements.push(env.DB.prepare("UPDATE orders SET status = CASE WHEN EXISTS(SELECT 1 FROM payment_blocks WHERE payment_id = ? AND provider_environment = ? AND blocked = 1) THEN 'revoked' ELSE 'paid' END,updated_at = ? WHERE payment_id = ? AND provider_environment = ?")
        .bind(dispute.payment_id, mode(env), now, dispute.payment_id, mode(env)));
    }
  }
  statements.push(expectedPayment
    ? env.DB.prepare('INSERT OR IGNORE INTO webhook_events (id,event_type,received_at) SELECT ?,?,? WHERE EXISTS(SELECT 1 FROM orders WHERE id = ? AND payment_id = ?)').bind(eventId, event.type, now, expectedPayment.orderId, expectedPayment.paymentId)
    : env.DB.prepare('INSERT OR IGNORE INTO webhook_events (id,event_type,received_at) VALUES (?,?,?)').bind(eventId, event.type, now));
  const processed = await env.DB.batch(statements);
  if (expectedPayment && !processed[0].meta.changes) throw new HttpError(409, 'A different payment is already attached to this order. Contact support@loopproof.me.');
  return json({ received: true });
}
async function route(request: Request, env: Env): Promise<Response> {
  const url = new URL(request.url);
  const canonical = baseURL(env);
  if (url.protocol === 'http:' && canonical?.protocol === 'https:' && url.hostname === canonical.hostname) {
    url.protocol = 'https:'; url.port = canonical.port;
    return new Response(null, { status: 308, headers: { ...securityHeaders, Location: url.href, 'Cache-Control': 'no-store' } });
  }
  if (url.hostname === 'www.loopproof.me') {
    url.hostname = 'loopproof.me'; url.protocol = 'https:'; url.port = '';
    return new Response(null, { status: 308, headers: { ...securityHeaders, Location: url.href, 'Cache-Control': 'no-store' } });
  }
  if (url.pathname.startsWith('/go/') && ['GET', 'HEAD'].includes(request.method)) {
    await nativeRateLimit(request, env, 'read');
    return outbound(request, env, url.pathname.slice(4));
  }
  if (url.pathname.startsWith('/spot/') && ['GET', 'HEAD'].includes(request.method)) {
    await nativeRateLimit(request, env, 'read');
    return placementPage(request, env, url.pathname.slice(6));
  }
  if (!url.pathname.startsWith('/api/')) {
    if (!['GET', 'HEAD'].includes(request.method)) throw new HttpError(405, 'Use GET or HEAD to view this page.');
    const cleanPath = url.pathname.replace(/\/+$/, '') || '/';
    if (url.pathname === '/index.html' || (cleanPath !== url.pathname && isApplicationPage(cleanPath))) {
      url.pathname = url.pathname === '/index.html' ? '/' : cleanPath;
      return new Response(null, { status: 308, headers: { ...securityHeaders, Location: url.href, 'Cache-Control': 'no-store' } });
    }
    if (url.pathname === '/sitemap.xml' || url.pathname.startsWith('/sitemaps/')) {
      if (url.pathname !== '/sitemaps/pages.xml') await nativeRateLimit(request, env, 'read');
      return sitemap(request, env, url.pathname);
    }
    if (url.pathname === '/robots.txt' && mode(env) !== 'live_mode') return new Response(request.method === 'HEAD' ? null : 'User-agent: *\nDisallow: /\n', {
      headers: { ...securityHeaders, 'Content-Type': 'text/plain; charset=utf-8', 'X-Robots-Tag': 'noindex, nofollow', 'Cache-Control': 'no-store' } });
    if (isApplicationPage(url.pathname)) return applicationPage(request, env, url.pathname);
    const asset = await env.ASSETS.fetch(request);
    // SPA asset fallback must never turn an unknown document into an indexable 200.
    if (asset.status === 404 || (asset.status === 200 && asset.headers.get('Content-Type')?.includes('text/html'))) return applicationPage(request, env, url.pathname);
    const response = new Response(request.method === 'HEAD' ? null : asset.body, asset);
    for (const [key, value] of Object.entries(securityHeaders)) response.headers.set(key, value);
    return response;
  }
  if (request.method === 'POST' && url.pathname !== '/api/webhook' && request.headers.get('origin') !== url.origin) throw new HttpError(403, 'This action must be performed from the Qofeno website.');
  if (url.pathname === '/api/visitors' || url.pathname === '/api/visitors/heartbeat') {
    const response = await visitorActivity(request, env);
    for (const [key, value] of Object.entries(securityHeaders)) response.headers.set(key, value);
    return response;
  }
  if (url.pathname === '/api/status' && request.method === 'GET') return json(status(env));
  if (url.pathname === '/api/board' && request.method === 'GET') {
    await nativeRateLimit(request, env, 'read');
    return board(env);
  }
  if (url.pathname.startsWith('/api/placements/') && request.method === 'GET') {
    await nativeRateLimit(request, env, 'read');
    return publicPlacement(env, url.pathname.slice('/api/placements/'.length));
  }
  if (url.pathname === '/api/session' && request.method === 'GET') {
    await nativeRateLimit(request, env, 'read');
    const order = await orderFor(request, env);
    return json(await sessionInfo(order, env), 200, pendingRecoveryExpired(order) ? { 'Set-Cookie': clearSessionCookie(request) } : {});
  }
  if (url.pathname === '/api/checkout' && request.method === 'POST') return checkout(request, env);
  if (url.pathname === '/api/checkout/leave' && request.method === 'POST') return leaveCheckout(request, env);
  if (url.pathname === '/api/webhook' && request.method === 'POST') return webhook(request, env);
  if (url.pathname.startsWith('/api/admin/')) return admin(request, env, url.pathname);
  if (url.pathname === '/api/restore' && request.method === 'POST') {
    if (!env.DB) throw new HttpError(503, 'Purchase recovery is temporarily unavailable.');
    await nativeRateLimit(request, env, 'sensitive');
    await rateLimit(request, env, 'restore', 10, 600); const input = await body(request);
    const code = typeof input.code === 'string' ? input.code.trim() : '';
    if (!isToken(code)) throw new HttpError(400, 'Enter the complete recovery code saved before checkout.');
    const order = await env.DB.prepare('SELECT * FROM orders WHERE token_hash = ?').bind(await hashToken(code)).first<Order>();
    if (!order || order.provider_environment !== mode(env)) throw new HttpError(404, 'That recovery code could not be found. Check the code or contact support@loopproof.me.');
    if (order.status === 'revoked') throw new HttpError(403, 'Access has been suspended for this payment. Contact support@loopproof.me.');
    if (pendingRecoveryExpired(order)) throw new HttpError(410, 'This unfinished checkout code has expired. Start a new checkout. If you already paid, wait for confirmation or contact support@loopproof.me; your saved code will work once payment is confirmed.');
    return json(await sessionInfo(order, env), 200, { 'Set-Cookie': sessionCookie(code, request) });
  }
  throw new HttpError(404, 'This endpoint does not exist.');
}
export default {
  async fetch(request: Request, env: Env): Promise<Response> {
    try { return await route(request, env); }
    catch (error) {
      if (error instanceof HttpError || error instanceof VisitorError) return json({ error: error.message }, error.status, error.status === 429 ? { 'Retry-After': String(error.retryAfter ?? 600) } : {});
      console.error('Qofeno request failed:', error instanceof Error ? error.name : 'Unknown error');
      return json({ error: 'Something went wrong. Please retry or contact support@loopproof.me.' }, 500);
    }
  },
  async scheduled(_controller: ScheduledController, env: Env): Promise<void> {
    await cleanupVisitors(env);
  },
};
