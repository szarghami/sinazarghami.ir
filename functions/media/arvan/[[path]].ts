import { getArvanConfig, isSafeArvanKey, presignObject } from '../../api/_shared/arvan';
import type { Env } from '../../api/_shared/runtime';

interface Context {
  request: Request;
  env: Env;
  params: { path?: string | string[] };
  waitUntil?: (promise: Promise<unknown>) => void;
}

const CACHE_SECONDS = 60 * 60 * 24 * 30;
const PASSTHROUGH_HEADERS = [
  'content-type',
  'content-length',
  'content-range',
  'accept-ranges',
  'etag',
  'last-modified',
];

interface EdgeCache {
  match: (request: Request) => Promise<Response | undefined>;
  put: (request: Request, response: Response) => Promise<void>;
}

function edgeCache(): EdgeCache | null {
  const storage = (globalThis as { caches?: { default?: EdgeCache } }).caches;
  return storage?.default ?? null;
}

/**
 * سرو رسانه‌ی آروان از دامنه‌ی خود سایت.
 *
 * صندوقچه‌ی آروان در حالت پیش‌فرض آبجکت‌ها را برای خواندن عمومی باز نمی‌کند و
 * نتیجه‌اش ۴۰۳ در مرورگر است. این مسیر با امضای سمت سرور آبجکت را می‌خواند و
 * همان بایت‌ها را برمی‌گرداند، پس نه کلید لو می‌رود و نه به تنظیمات صندوقچه
 * وابسته‌ایم. هدر Range هم عبور داده می‌شود تا پخش ویدیو و seek کار کند.
 */
async function handle(context: Context, method: 'GET' | 'HEAD'): Promise<Response> {
  const config = getArvanConfig(context.env);
  if (!config) {
    return new Response('Arvan is not configured', {
      status: 503,
      headers: { 'Cache-Control': 'no-store' },
    });
  }

  const segments = context.params.path;
  const key = (Array.isArray(segments) ? segments.join('/') : segments || '').replace(/\/{2,}/g, '/');
  if (!key || !isSafeArvanKey(config, key)) {
    return new Response('Not found', { status: 404, headers: { 'Cache-Control': 'no-store' } });
  }

  const signed = await presignObject(config, 'GET', key, {}, 900);
  const range = context.request.headers.get('Range');
  const cache = range ? null : edgeCache();
  const cacheUrl = new URL(context.request.url);
  cacheUrl.search = '';
  const cacheKey = new Request(cacheUrl.toString(), { method: 'GET' });

  if (cache && method === 'GET') {
    const cached = await cache.match(cacheKey);
    if (cached) return cached;
  }

  let upstream: Response;
  try {
    upstream = await fetch(signed, {
      method,
      headers: range ? { Range: range } : undefined,
    });
  } catch {
    return new Response('Upstream unreachable', {
      status: 502,
      headers: { 'Cache-Control': 'no-store' },
    });
  }

  if (upstream.status === 404) {
    return new Response('Not found', { status: 404, headers: { 'Cache-Control': 'no-store' } });
  }
  if (!upstream.ok && upstream.status !== 206) {
    return new Response('Upstream error', {
      status: 502,
      headers: { 'Cache-Control': 'no-store' },
    });
  }

  const headers = new Headers();
  for (const name of PASSTHROUGH_HEADERS) {
    const value = upstream.headers.get(name);
    if (value) headers.set(name, value);
  }
  headers.set('Cache-Control', `public, max-age=${CACHE_SECONDS}, immutable`);
  headers.set('X-Content-Type-Options', 'nosniff');

  const response = new Response(method === 'HEAD' ? null : upstream.body, {
    status: upstream.status,
    headers,
  });

  if (cache && method === 'GET' && context.waitUntil) {
    context.waitUntil(cache.put(cacheKey, response.clone()).catch(() => undefined));
  }

  return response;
}

export function onRequestGet(context: Context): Promise<Response> {
  return handle(context, 'GET');
}

export function onRequestHead(context: Context): Promise<Response> {
  return handle(context, 'HEAD');
}
