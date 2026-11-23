/**
 * تست مسیر آپلود: تکه‌بندی، ادامه از تکه‌ی قطع‌شده، تغییر کانال و بازیابی ۴۰۹.
 * سرور و شبکه شبیه‌سازی می‌شوند تا رفتار کلاینت بدون نیاز به Cloudflare سنجیده شود.
 */

const store = new Map();
globalThis.window = {
  localStorage: {
    getItem: (key) => (store.has(key) ? store.get(key) : null),
    setItem: (key, value) => store.set(key, String(value)),
    removeItem: (key) => store.delete(key),
  },
  setTimeout: (fn, ms) => setTimeout(fn, ms),
  clearTimeout: (id) => clearTimeout(id),
};

const { sendChunked, getTransportMode } = await import('../src/utils/transport.ts');

const b64urlDecode = (value) => {
  const padded = value.replace(/-/g, '+').replace(/_/g, '/');
  return Buffer.from(padded + '='.repeat((4 - (padded.length % 4)) % 4), 'base64').toString('utf8');
};

function jsonResponse(status, body) {
  return new Response(JSON.stringify(body), {
    status,
    headers: { 'Content-Type': 'application/json' },
  });
}

function modeOf(init) {
  const method = (init.method || 'GET').toUpperCase();
  if (method === 'GET') return 'get';
  const type = (init.headers?.['Content-Type'] || '').toLowerCase();
  return type.includes('text/plain') ? 'text' : 'json';
}

function payloadOf(url, init) {
  const parsed = new URL(url, 'https://example.com');
  if ((init.method || 'GET').toUpperCase() === 'GET') {
    return JSON.parse(b64urlDecode(parsed.searchParams.get('p')));
  }
  const type = (init.headers?.['Content-Type'] || '').toLowerCase();
  return type.includes('text/plain')
    ? JSON.parse(b64urlDecode(init.body))
    : JSON.parse(init.body);
}

function createServer(options = {}) {
  const {
    deadModes = [],
    initDeadModes = [],
    conflictOnce = false,
    failChunkOnce = new Set(),
    failEveryNthChunk = 0,
    deadChunkCalls = 0,
    completeFailures = 0,
  } = options;
  const state = {
    inits: 0,
    completes: 0,
    chunkCalls: 0,
    stored: new Map(),
    assembled: null,
    maxGetUrl: 0,
  };
  const failedOnce = new Set();

  const fetchImpl = async (url, init = {}) => {
    const path = new URL(url, 'https://example.com').pathname;
    const mode = modeOf(init);

    if (path === '/api/upload/init') {
      if (initDeadModes.includes(mode)) throw new TypeError('Failed to fetch');
      state.inits += 1;
      const body = payloadOf(url, init);
      return jsonResponse(200, { success: true, uploadId: 'upload-test-1', total: body.total });
    }

    if (path === '/api/upload/chunk') {
      state.chunkCalls += 1;
      if (deadModes.includes(mode)) throw new TypeError('Failed to fetch');
      if (state.chunkCalls <= deadChunkCalls) throw new TypeError('Failed to fetch');
      if (failEveryNthChunk > 0 && state.chunkCalls % failEveryNthChunk === 0) {
        throw new TypeError('Failed to fetch');
      }
      if (mode === 'get') state.maxGetUrl = Math.max(state.maxGetUrl, url.length);
      const parsed = new URL(url, 'https://example.com');
      const index =
        mode === 'get' ? Number(parsed.searchParams.get('index')) : payloadOf(url, init).index;
      const data =
        mode === 'get'
          ? parsed.searchParams.get('data').replace(/-/g, '+').replace(/_/g, '/')
          : payloadOf(url, init).data;
      if (failChunkOnce.has(index) && !failedOnce.has(index)) {
        failedOnce.add(index);
        throw new TypeError('Failed to fetch');
      }
      state.stored.set(index, data);
      return jsonResponse(200, { success: true, index });
    }

    if (path === '/api/upload/complete') {
      state.completes += 1;
      const body = payloadOf(url, init);
      for (let index = 0; index < body.total; index += 1) {
        if (!state.stored.has(index)) {
          return jsonResponse(409, { success: false, error: 'missing chunks' });
        }
      }
      if (state.completes <= completeFailures) {
        return jsonResponse(503, { success: false, error: 'temporary' });
      }
      if (conflictOnce && state.completes === 1) {
        state.stored.delete(0);
        return jsonResponse(409, { success: false, error: 'missing chunks' });
      }
      state.assembled = Array.from({ length: body.total }, (_, index) => state.stored.get(index)).join('');
      return jsonResponse(200, { success: true, publicUrl: '/media/test.webp' });
    }

    throw new Error(`unexpected path ${path}`);
  };

  return { fetchImpl, state };
}

const results = [];
const check = (name, ok) => results.push([name, ok]);

const base64 = Buffer.from('x'.repeat(60_000), 'utf8').toString('base64');

// ۱) کانال GET سالم است؛ همه‌ی تکه‌ها یک‌جا و بدون تکرار ارسال می‌شوند.
{
  store.clear();
  const { fetchImpl, state } = createServer();
  globalThis.fetch = fetchImpl;
  const result = await sendChunked({ kind: 'media', base64, mimeType: 'image/webp', filename: 'a' });
  check('GET upload succeeds', result.success === true);
  check('GET upload reassembles exact bytes', state.assembled === base64);
  check('GET upload sends each chunk once', state.chunkCalls === result.chunkCount);
  check('GET upload calls init once', state.inits === 1);
  check('GET chunk URL stays under the 4.5KB cap', state.maxGetUrl > 0 && state.maxGetUrl < 4600);
  check('transport mode remembered as get', getTransportMode() === 'get');
}

// ۲) کانال GET قطع می‌شود: باید بدون شروع دوباره، همان آپلود با کانال بعدی ادامه یابد.
{
  store.clear();
  const { fetchImpl, state } = createServer({ deadModes: ['get'] });
  globalThis.fetch = fetchImpl;
  const result = await sendChunked({ kind: 'media', base64, mimeType: 'image/webp', filename: 'b' });
  check('falls back to POST when GET is dead', result.success === true);
  check('fallback reuses the same upload (init once)', state.inits === 1);
  check('fallback reassembles exact bytes', state.assembled === base64);
}

// ۳) یک تکه وسط کار قطع می‌شود: فقط همان تکه دوباره فرستاده می‌شود.
{
  store.clear();
  const { fetchImpl, state } = createServer({ failChunkOnce: new Set([2]) });
  globalThis.fetch = fetchImpl;
  const result = await sendChunked({ kind: 'media', base64, mimeType: 'image/webp', filename: 'c' });
  check('recovers from a single dropped chunk', result.success === true);
  check('dropped chunk is retried, not the whole upload', state.chunkCalls === result.chunkCount + 1);
  check('retry reassembles exact bytes', state.assembled === base64);
}

// ۴) ثبت نهایی ۴۰۹ می‌دهد: تکه‌ها دوباره ارسال و ثبت تکرار می‌شود.
{
  store.clear();
  const { fetchImpl, state } = createServer({ conflictOnce: true });
  globalThis.fetch = fetchImpl;
  const result = await sendChunked({ kind: 'content', base64, filename: 'site-data.json' });
  check('recovers from 409 conflict', result.success === true);
  check('409 triggers a second complete call', state.completes === 2);
  check('409 recovery reassembles exact bytes', state.assembled === base64);
}

// ۵) آماده‌سازی با کانال اول شکست می‌خورد: کانال بعدی انتخاب می‌شود.
{
  store.clear();
  const { fetchImpl, state } = createServer({ initDeadModes: ['get'] });
  globalThis.fetch = fetchImpl;
  const result = await sendChunked({ kind: 'media', base64, mimeType: 'image/webp', filename: 'd' });
  check('falls back when init fails', result.success === true);
  check('init fallback reassembles exact bytes', state.assembled === base64);
}

// ۶) اتصال‌ها روی این شبکه عمر کوتاهی دارند: هر چند درخواست یک‌بار قطع می‌شود.
// آپلود باید با تلاش دوباره روی اتصال تازه کامل شود، نه با شکست.
{
  store.clear();
  const { fetchImpl, state } = createServer({ failEveryNthChunk: 3 });
  globalThis.fetch = fetchImpl;
  const result = await sendChunked({ kind: 'media', base64, mimeType: 'image/webp', filename: 'e' });
  check('survives a connection dropped every few chunks', result.success === true);
  check('flaky connection reassembles exact bytes', state.assembled === base64);
}

// ۷) چند درخواست پشت‌سرهم قطع می‌شوند (قطعی کوتاه شبکه): باید دورهای بعدی جبران کنند.
{
  store.clear();
  const { fetchImpl, state } = createServer({ deadChunkCalls: 5 });
  globalThis.fetch = fetchImpl;
  const result = await sendChunked({ kind: 'media', base64, mimeType: 'image/webp', filename: 'f' });
  check('recovers after a short outage', result.success === true);
  check('outage recovery reassembles exact bytes', state.assembled === base64);
}

// ۸) ثبت نهایی خطای موقت ۵۰۳ می‌دهد: تکته‌ها سمت سرور می‌مانند و همان درخواست دوباره می‌شود.
{
  store.clear();
  const { fetchImpl, state } = createServer({ completeFailures: 1 });
  globalThis.fetch = fetchImpl;
  const result = await sendChunked({ kind: 'content', base64, filename: 'g' });
  check('retries a 503 from complete', result.success === true);
  check('503 retry does not re-upload chunks', state.chunkCalls === result.chunkCount);
  check('503 retry reassembles exact bytes', state.assembled === base64);
}

for (const [name, ok] of results) console.log(`${ok ? 'PASS' : 'FAIL'} ${name}`);
process.exit(results.every(([, ok]) => ok) ? 0 : 1);
