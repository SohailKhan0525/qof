import { isIP } from 'node:net';

export interface VisitorEnv {
  VISITOR_DB?: D1Database;
  VISITOR_STATS_SECRET?: string;
  /** Operator pause switch; aggregate reads remain available. */
  VISITOR_TRACKING_ENABLED?: string;
  VISITOR_RATE_LIMITER?: RateLimit;
  REQUIRE_REQUEST_PROTECTION?: string;
  PUBLIC_SITE_URL?: string;
}

export interface VisitorSnapshot {
  online: number;
  today: number;
  month: number;
  asOf: number;
  day: string;
  monthKey: string;
  startedAt: number;
  onlineWindowSeconds: 120;
  refreshAfterSeconds: 60;
  timezone: 'UTC';
  metric: 'estimated_visitors';
  trackingEnabled: boolean;
}

export class VisitorError extends Error {
  constructor(public status: number, message: string, public retryAfter?: number) {
    super(message);
  }
}

const WINDOW_MS = 120_000;
const COALESCE_MS = 45_000;
const CLEANUP_LIMIT = 5_000;
const encoder = new TextEncoder();

function json(value: unknown, status = 200, headers: Record<string, string> = {}) {
  return new Response(JSON.stringify(value), {
    status,
    headers: {
      'Content-Type': 'application/json; charset=utf-8',
      'Cache-Control': 'no-store',
      'X-Robots-Tag': 'noindex, nofollow',
      ...headers,
    },
  });
}

function periods(now: number) {
  const date = new Date(now);
  return {
    day: date.toISOString().slice(0, 10),
    month: date.toISOString().slice(0, 7),
    nextDay: Date.UTC(date.getUTCFullYear(), date.getUTCMonth(), date.getUTCDate() + 1),
    nextMonth: Date.UTC(date.getUTCFullYear(), date.getUTCMonth() + 1, 1),
  };
}

function trustedAddress(request: Request) {
  const address = request.headers.get('CF-Connecting-IP');
  if (!address || address.length > 45) return null;
  const version = isIP(address);
  if (version === 4) return address;
  // URL host normalization compresses equivalent IPv6 spellings and casing.
  if (version === 6) return new URL(`http://[${address}]/`).hostname.slice(1, -1);
  return null;
}

async function sha256(value: string) {
  const bytes = new Uint8Array(await crypto.subtle.digest('SHA-256', encoder.encode(value)));
  return Array.from(bytes, byte => byte.toString(16).padStart(2, '0')).join('');
}

/** The visitor limiter is independent of purchasing and private recovery budgets. */
async function protect(request: Request, env: VisitorEnv) {
  if (!env.VISITOR_RATE_LIMITER) {
    if (env.REQUIRE_REQUEST_PROTECTION === 'true')
      throw new VisitorError(503, 'Visitor estimates are temporarily unavailable.');
    return;
  }
  let outcome: RateLimitOutcome;
  try {
    outcome = await env.VISITOR_RATE_LIMITER.limit({
      key: await sha256(trustedAddress(request) || 'unavailable-address'),
    });
  } catch {
    throw new VisitorError(503, 'Visitor estimates are temporarily unavailable.');
  }
  if (outcome?.success === false)
    throw new VisitorError(429, 'Visitor estimates are updating too frequently. Please wait a minute.', 60);
  if (outcome?.success !== true)
    throw new VisitorError(503, 'Visitor estimates are temporarily unavailable.');
}

/** A finite vocabulary prevents arbitrary UA suffixes creating unlimited identities. */
export function coarseBrowser(userAgent: string) {
  const platform = /android/i.test(userAgent) ? 'android'
    : /iphone|ipad|ipod/i.test(userAgent) ? 'ios'
      : /windows/i.test(userAgent) ? 'windows'
        : /macintosh|mac os/i.test(userAgent) ? 'mac'
          : /linux/i.test(userAgent) ? 'linux' : 'other';
  const browser = /edg(?:e|a|ios)?\//i.test(userAgent) ? 'edge'
    : /opr\/|opera/i.test(userAgent) ? 'opera'
      : /firefox\/|fxios\//i.test(userAgent) ? 'firefox'
        : /chrome\/|chromium\/|crios\//i.test(userAgent) ? 'chromium'
          : /safari\//i.test(userAgent) ? 'safari' : 'other';
  return `${platform}:${browser}`;
}

function excluded(request: Request, userAgent: string) {
  return request.headers.get('DNT') === '1' || request.headers.get('Sec-GPC') === '1'
    || /bot|crawler|spider|headless|playwright|puppeteer|curl\/|wget\/|python|uptime|monitor|preview|facebookexternalhit|slurp/i.test(userAgent)
    || (request as Request & { cf?: { botManagement?: { verifiedBot?: boolean } } }).cf?.botManagement?.verifiedBot === true;
}

async function emptyBody(request: Request) {
  if (request.headers.get('Content-Type')?.split(';')[0].trim().toLowerCase() !== 'application/json')
    throw new VisitorError(415, 'Use a JSON request.');
  if (Number(request.headers.get('Content-Length')) > 256)
    throw new VisitorError(413, 'The visitor request is too large.');
  const reader = request.body?.getReader();
  if (!reader) throw new VisitorError(400, 'Send an empty JSON object.');
  const decoder = new TextDecoder();
  let length = 0;
  let raw = '';
  while (true) {
    const part = await reader.read();
    if (part.done) break;
    length += part.value.byteLength;
    if (length > 256) {
      await reader.cancel();
      throw new VisitorError(413, 'The visitor request is too large.');
    }
    raw += decoder.decode(part.value, { stream: true });
  }
  raw += decoder.decode();
  let value: unknown;
  try { value = JSON.parse(raw); } catch { throw new VisitorError(400, 'Send an empty JSON object.'); }
  if (!value || typeof value !== 'object' || Array.isArray(value) || Object.keys(value).length)
    throw new VisitorError(400, 'Visitor identifiers and counts are assigned by the server.');
}

async function identityKeys(request: Request, env: VisitorEnv, now: number, userAgent: string) {
  const address = trustedAddress(request);
  if (!address || !env.VISITOR_STATS_SECRET || env.VISITOR_STATS_SECRET.length < 32)
    throw new VisitorError(503, 'Visitor measurement is temporarily unavailable.');
  const key = await crypto.subtle.importKey('raw', encoder.encode(env.VISITOR_STATS_SECRET), { name: 'HMAC', hash: 'SHA-256' }, false, ['sign']);
  const current = periods(now);
  const identity = `${address}|${coarseBrowser(userAgent)}`;
  const sign = async (purpose: string, period: string) => {
    const bytes = new Uint8Array(await crypto.subtle.sign('HMAC', key, encoder.encode(`qofeno-visitors-v1|${purpose}|${period}|${identity}`)));
    return Array.from(bytes, byte => byte.toString(16).padStart(2, '0')).join('');
  };
  const [day, month, presence] = await Promise.all([
    sign('daily', current.day), sign('monthly', current.month), sign('presence', current.month),
  ]);
  return { day, month, presence, current };
}

async function record(request: Request, env: VisitorEnv, now: number, userAgent: string) {
  const db = env.VISITOR_DB;
  if (!db) throw new VisitorError(503, 'Visitor measurement is temporarily unavailable.');
  const keys = await identityKeys(request, env, now, userAgent);
  const statements: D1PreparedStatement[] = [];
  for (const [kind, period, key, expires] of [
    ['day', keys.current.day, keys.day, keys.current.nextDay],
    ['month', keys.current.month, keys.month, keys.current.nextMonth],
  ] as const) {
    // A single D1 batch is transactional: another tab cannot interleave the
    // conditional increment and dedupe insert, and failures roll them back.
    statements.push(db.prepare(`INSERT INTO visitor_totals (kind,period,visitors)
      SELECT ?,?,1 WHERE NOT EXISTS (
        SELECT 1 FROM visitor_dedupe WHERE kind = ? AND period = ? AND visitor_key = ?
      ) ON CONFLICT(kind,period) DO UPDATE SET visitors = visitors + 1`)
      .bind(kind, period, kind, period, key));
    statements.push(db.prepare('INSERT OR IGNORE INTO visitor_dedupe (kind,period,visitor_key,expires_at) VALUES (?,?,?,?)')
      .bind(kind, period, key, expires));
  }
  statements.push(db.prepare(`INSERT INTO visitor_presence (period,visitor_key,last_seen_at,expires_at) VALUES (?,?,?,?)
    ON CONFLICT(period,visitor_key) DO UPDATE SET last_seen_at = excluded.last_seen_at,expires_at = excluded.expires_at
    WHERE visitor_presence.last_seen_at <= excluded.last_seen_at - ?`)
    .bind(keys.current.month, keys.presence, now, now + WINDOW_MS, COALESCE_MS));
  await db.batch(statements);
}

async function snapshot(env: VisitorEnv, now: number): Promise<VisitorSnapshot> {
  if (!env.VISITOR_DB) throw new VisitorError(503, 'Visitor estimates are temporarily unavailable.');
  const current = periods(now);
  const row = await env.VISITOR_DB.prepare(`SELECT started_at AS startedAt,
    (SELECT COUNT(*) FROM visitor_presence WHERE period = ? AND expires_at > ?) AS online,
    COALESCE((SELECT visitors FROM visitor_totals WHERE kind = 'day' AND period = ?),0) AS today,
    COALESCE((SELECT visitors FROM visitor_totals WHERE kind = 'month' AND period = ?),0) AS month
    FROM visitor_meta WHERE id = 1`).bind(current.month, now, current.day, current.month)
    .first<{ startedAt: number; online: number; today: number; month: number }>();
  if (!row || [row.startedAt, row.online, row.today, row.month].some(value => !Number.isSafeInteger(value) || value < 0))
    throw new VisitorError(503, 'Visitor estimates are temporarily unavailable.');
  return {
    online: row.online, today: row.today, month: row.month, asOf: now,
    day: current.day, monthKey: current.month, startedAt: row.startedAt,
    onlineWindowSeconds: 120, refreshAfterSeconds: 60, timezone: 'UTC', metric: 'estimated_visitors',
    trackingEnabled: env.VISITOR_TRACKING_ENABLED !== 'false',
  };
}

async function publicSnapshot(request: Request, env: VisitorEnv, now: number) {
  const current = periods(now);
  const trackingState = env.VISITOR_TRACKING_ENABLED === 'false' ? 'paused' : 'enabled';
  const key = new Request(`${new URL(request.url).origin}/__qofeno/visitor-snapshot/v1/${current.day}/${trackingState}`);
  let cache: Cache | undefined;
  try { if (typeof caches !== 'undefined') cache = await caches.open('qofeno-visitor-estimates-v1'); } catch { /* Database remains authoritative. */ }
  if (cache) {
    try {
      const hit = await cache.match(key);
      if (hit) {
        const value = await hit.json<VisitorSnapshot>();
        if (value.day === current.day && value.asOf <= now && now - value.asOf < 10_000) return value;
      }
    } catch { /* Cache failure cannot fabricate or suppress authoritative values. */ }
  }
  const value = await snapshot(env, now);
  if (cache) {
    try { await cache.put(key, json(value, 200, { 'Cache-Control': 'public, max-age=10' })); } catch { /* Optional performance cache. */ }
  }
  return value;
}

export async function visitorActivity(request: Request, env: VisitorEnv): Promise<Response> {
  const url = new URL(request.url);
  if (url.pathname === '/api/visitors' && request.method === 'GET') {
    await protect(request, env);
    return json(await publicSnapshot(request, env, Date.now()), 200, { 'Cache-Control': 'public, max-age=10' });
  }
  if (url.pathname !== '/api/visitors/heartbeat' || request.method !== 'POST')
    throw new VisitorError(405, 'Use the visitor activity endpoints with their supported methods.');
  let canonical: URL;
  try { canonical = new URL(env.PUBLIC_SITE_URL || ''); } catch { throw new VisitorError(503, 'Visitor measurement is temporarily unavailable.'); }
  if (url.origin !== canonical.origin || request.headers.get('Origin') !== canonical.origin
    || (request.headers.has('Sec-Fetch-Site') && request.headers.get('Sec-Fetch-Site') !== 'same-origin'))
    throw new VisitorError(403, 'Visitor measurement must come from this website.');
  await protect(request, env);
  await emptyBody(request);
  const userAgent = request.headers.get('User-Agent') || '';
  if (userAgent.length > 1024) throw new VisitorError(413, 'The visitor request is too large.');
  if (env.VISITOR_TRACKING_ENABLED === 'false' || excluded(request, userAgent))
    return new Response(null, { status: 204, headers: { 'Cache-Control': 'no-store', 'X-Robots-Tag': 'noindex, nofollow' } });
  const now = Date.now();
  await record(request, env, now, userAgent);
  return json(await publicSnapshot(request, env, now));
}

/** Hourly bounded pruning: retained totals contain no visitor identifiers. */
export async function cleanupVisitors(env: VisitorEnv, now = Date.now()) {
  if (!env.VISITOR_DB) return;
  const date = new Date(now);
  // Keep the current UTC month plus twelve preceding calendar months.
  const cutoff = new Date(Date.UTC(date.getUTCFullYear(), date.getUTCMonth() - 12, 1)).toISOString();
  await env.VISITOR_DB.batch([
    env.VISITOR_DB.prepare(`DELETE FROM visitor_dedupe WHERE (kind,period,visitor_key) IN
      (SELECT kind,period,visitor_key FROM visitor_dedupe WHERE expires_at <= ? ORDER BY expires_at LIMIT ?)`)
      .bind(now, CLEANUP_LIMIT),
    env.VISITOR_DB.prepare(`DELETE FROM visitor_presence WHERE (period,visitor_key) IN
      (SELECT period,visitor_key FROM visitor_presence WHERE expires_at <= ? ORDER BY expires_at LIMIT ?)`)
      .bind(now, CLEANUP_LIMIT),
    env.VISITOR_DB.prepare(`DELETE FROM visitor_totals WHERE (kind,period) IN
      (SELECT kind,period FROM visitor_totals WHERE (kind = 'day' AND period < ?) OR (kind = 'month' AND period < ?) LIMIT ?)`)
      .bind(cutoff.slice(0, 10), cutoff.slice(0, 7), CLEANUP_LIMIT),
  ]);
}
