// =====================================================================
// ارسال مقاوم به قطع اتصال
// شبکه‌ی ایران درخواست‌های سنگین (بدنه‌ی POST یا URL بزرگ) را وسط راه قطع
// می‌کند. اندازه‌ی امن اینجا با تست واقعی روی همین دامنه پیدا شده است:
//   - بدنه‌ی POST تا ۴۰ کیلوبایت سالم است و از حدود ۴۸ کیلوبایت قطع می‌شود.
//   - URL تا حدود ۲۴ هزار کاراکتر سالم است و از ۳۲ هزار کاراکتر قطع می‌شود.
//   - خود اتصال هم عمر کوتاهی دارد: اتصال بازمانده به همین دامنه بعد از حدود
//     ۱۰ تا ۲۰ ثانیه بی‌صدا قطع می‌شود (ECONNRESET / ERR_CONNECTION_CLOSED).
//     بنابراین هر تکه باید سریع شکست بخورد و روی اتصال تازه دوباره فرستاده شود؛
//     منتظر ماندن تا تایم‌اوت طولانی فقط آپلود را کند و ناتمام می‌کند.
// بنابراین همه‌ی نوشتن‌ها تکه‌تکه و کوچک ارسال می‌شوند و کانال GET که روی این
// شبکه سریع‌ترین است، انتخاب پیش‌فرض است.
// =====================================================================

export class NetworkError extends Error {
  constructor(message = 'اتصال به سرور قطع شد.') {
    super(message);
    this.name = 'NetworkError';
  }
}

const CHUNK_KEY = 'sina_chunk_size_v2';
const MODE_KEY = 'sina_transport_mode_v2';
const MIN_CHUNK = 2 * 1024;
const MAX_CHUNK = 12 * 1024;
/**
 * سقف اندازه‌ی تکته روی کانال GET. اندازه‌گیری روی همین دامنه نشان داد URLهای بزرگ‌تر از
 * حدود ۵ کیلوبایت روی این شبکه بی‌صدا معطل می‌مانند (حدود ۲۰ ثانیه) و پیش از رسیدن پاسخ
 * تایم‌اوت می‌شوند؛ URL چهار کیلوبایتی همیشه سالم بود. POST چنین محدودیتی ندارد.
 */
const GET_CHUNK_MAX = 4 * 1024;
const REQUEST_TIMEOUT_MS = 12_000;
const CHUNK_TIMEOUT_MS = 8_000;
const COMPLETE_TIMEOUT_MS = 90_000;
const CHUNK_CONCURRENCY = 2;
const CHUNK_ATTEMPTS = 3;
const MODE_ATTEMPTS = 2;
const MAX_UPLOAD_ATTEMPTS = 4;
const COMPLETE_ATTEMPTS = 3;
const PROBE_FAST_MS = 5_000;
const ROUND_BACKOFF_MS = [1_000, 2_500, 5_000];

/**
 * کانال ارسال. روی بعضی شبکه‌ها بدنه‌ی POST کند یا قطع می‌شود ولی GET سالم است،
 * بنابراین کلاینت خودش کانال سالم را پیدا می‌کند:
 *  - get : همه‌ی داده در query string (بدون بدنه) — پیش‌فرض
 *  - json: POST معمولی
 *  - text: POST با text/plain و بدنه‌ی base64url
 */
export type TransportMode = 'get' | 'json' | 'text';

export const TRANSPORT_MODE_LABELS: Record<TransportMode, string> = {
  get: 'GET رشته‌ای',
  json: 'POST معمولی',
  text: 'POST متنی',
};

const MODE_ORDER: TransportMode[] = ['get', 'json', 'text'];

function isTransportMode(value: string | null): value is TransportMode {
  return value === 'get' || value === 'json' || value === 'text';
}

export function getTransportMode(): TransportMode {
  try {
    const raw = window.localStorage.getItem(MODE_KEY);
    if (isTransportMode(raw)) return raw;
  } catch {
    // ignore storage errors
  }
  return 'get';
}

export function setTransportMode(mode: TransportMode): void {
  try {
    window.localStorage.setItem(MODE_KEY, mode);
  } catch {
    // ignore storage errors
  }
}

function sleep(ms: number): Promise<void> {
  return new Promise((resolve) => window.setTimeout(resolve, ms));
}

export function getChunkSize(): number {
  try {
    const raw = Number(window.localStorage.getItem(CHUNK_KEY));
    if (Number.isFinite(raw) && raw >= MIN_CHUNK && raw <= MAX_CHUNK) return raw;
  } catch {
    // ignore storage errors
  }
  return MAX_CHUNK;
}

export function setChunkSize(size: number): void {
  try {
    window.localStorage.setItem(CHUNK_KEY, String(Math.max(MIN_CHUNK, Math.min(MAX_CHUNK, size))));
  } catch {
    // ignore storage errors
  }
}

/** اندازه‌ی تکته برای هر کانال؛ GET به‌خاطر محدودیت طول URL سقف جداگانه دارد. */
export function chunkSizeFor(mode: TransportMode): number {
  const base = getChunkSize();
  return mode === 'get' ? Math.min(base, GET_CHUNK_MAX) : base;
}

async function fetchWithTimeout(
  url: string,
  init: RequestInit,
  timeoutMs: number,
): Promise<Response> {
  const controller = new AbortController();
  const timer = window.setTimeout(() => controller.abort(), timeoutMs);
  try {
    return await fetch(url, { ...init, signal: controller.signal });
  } finally {
    window.clearTimeout(timer);
  }
}

function toBase64(bytes: Uint8Array): string {
  let binary = '';
  const step = 0x8000;
  for (let index = 0; index < bytes.length; index += step) {
    binary += String.fromCharCode(...bytes.subarray(index, index + step));
  }
  return btoa(binary);
}

function toBase64Url(value: string): string {
  return toBase64(new TextEncoder().encode(value))
    .replace(/\+/g, '-')
    .replace(/\//g, '_')
    .replace(/=+$/g, '');
}

function sendJsonOnce(
  path: string,
  payload: unknown,
  mode: TransportMode,
  timeoutMs: number,
): Promise<Response> {
  if (mode === 'get') {
    const url = `${path}?p=${toBase64Url(JSON.stringify(payload))}&t=${Date.now()}`;
    return fetchWithTimeout(
      url,
      { method: 'GET', credentials: 'same-origin', cache: 'no-store' },
      timeoutMs,
    );
  }
  const body = mode === 'text' ? toBase64Url(JSON.stringify(payload)) : JSON.stringify(payload);
  return fetchWithTimeout(
    path,
    {
      method: 'POST',
      headers: { 'Content-Type': mode === 'text' ? 'text/plain' : 'application/json' },
      credentials: 'same-origin',
      cache: 'no-store',
      body,
    },
    timeoutMs,
  );
}

async function sendJson(
  path: string,
  payload: unknown,
  mode: TransportMode,
  attempts = 2,
  timeoutMs = REQUEST_TIMEOUT_MS,
): Promise<Response> {
  for (let attempt = 0; attempt < attempts; attempt += 1) {
    try {
      return await sendJsonOnce(path, payload, mode, timeoutMs);
    } catch {
      if (attempt === attempts - 1) throw new NetworkError();
      await sleep(300 * (attempt + 1));
    }
  }
  throw new NetworkError();
}

function sendChunkOnce(
  uploadId: string,
  index: number,
  data: string,
  mode: TransportMode,
): Promise<Response> {
  if (mode === 'get') {
    const url =
      `/api/upload/chunk?uploadId=${encodeURIComponent(uploadId)}&index=${index}` +
      `&data=${data.replace(/\+/g, '-').replace(/\//g, '_')}&t=${Date.now()}`;
    return fetchWithTimeout(
      url,
      { method: 'GET', credentials: 'same-origin', cache: 'no-store' },
      CHUNK_TIMEOUT_MS,
    );
  }
  return sendJsonOnce('/api/upload/chunk', { uploadId, index, data }, mode, CHUNK_TIMEOUT_MS);
}

async function sendChunk(
  uploadId: string,
  index: number,
  data: string,
  mode: TransportMode,
): Promise<Response> {
  for (let attempt = 0; attempt < CHUNK_ATTEMPTS; attempt += 1) {
    try {
      return await sendChunkOnce(uploadId, index, data, mode);
    } catch {
      if (attempt === CHUNK_ATTEMPTS - 1) throw new NetworkError();
      await sleep(250 * (attempt + 1));
    }
  }
  throw new NetworkError();
}

export interface ChunkedUploadOptions {
  kind: 'content' | 'media';
  base64: string;
  mimeType?: string;
  filename?: string;
  onProgress?: (done: number, total: number) => void;
}

export interface ChunkedUploadResult {
  success: boolean;
  publicUrl?: string;
  content?: unknown;
  translation?: { translated: number; failed: number; pending: number };
  error?: string;
  chunkSize?: number;
  chunkCount?: number;
}

interface UploadSession {
  uploadId: string;
  total: number;
  chunkSize: number;
  chunks: string[];
  mode: TransportMode;
}

/** آماده‌سازی آپلود روی کانال مشخص. */
async function openUpload(
  options: ChunkedUploadOptions,
  mode: TransportMode,
  chunkSize: number,
): Promise<UploadSession> {
  const total = Math.max(1, Math.ceil(options.base64.length / chunkSize));
  const initRes = await sendJson(
    '/api/upload/init',
    { kind: options.kind, total, mimeType: options.mimeType },
    mode,
  );
  const initData = (await initRes.json().catch(() => ({}))) as {
    success?: boolean;
    uploadId?: string;
    error?: string;
  };
  if (!initRes.ok || !initData.success || !initData.uploadId) {
    throw new Error(initData.error || `آماده‌سازی آپلود ناموفق بود (${initRes.status}).`);
  }
  const chunks: string[] = [];
  for (let index = 0; index < total; index += 1) {
    chunks.push(options.base64.slice(index * chunkSize, (index + 1) * chunkSize));
  }
  return { uploadId: initData.uploadId, total, chunkSize, chunks, mode };
}

/**
 * ارسال تکه‌های باقی‌مانده. تکه‌ها در KV با شماره‌ی خود ذخیره می‌شوند، پس اگر
 * وسط کار اتصال قطع شود، همان شناسه‌ی آپلود و همان ایندکس‌ها ادامه داده می‌شوند
 * و هیچ‌وقت از صفر شروع نمی‌شود.
 */
async function pushChunks(
  session: UploadSession,
  pending: Set<number>,
  onProgress?: (done: number, total: number) => void,
): Promise<void> {
  const queue = Array.from(pending);
  let cursor = 0;
  let firstError: unknown = null;
  const workers = Array.from(
    { length: Math.min(CHUNK_CONCURRENCY, queue.length) },
    async () => {
      while (cursor < queue.length) {
        const index = queue[cursor];
        cursor += 1;
        try {
          const res = await sendChunk(
            session.uploadId,
            index,
            session.chunks[index],
            session.mode,
          );
          if (!res.ok) {
            const payload = (await res.json().catch(() => ({}))) as { error?: string };
            throw new Error(payload.error || `ارسال تکه ${index + 1} ناموفق بود (${res.status}).`);
          }
          pending.delete(index);
          onProgress?.(session.total - pending.size, session.total);
        } catch (error) {
          // بقیه‌ی کارگرها کارشان را تمام می‌کنند تا تکه‌ها دوباره فرستاده نشوند.
          if (!firstError) firstError = error;
          return;
        }
      }
    },
  );
  await Promise.all(workers);
  if (firstError) throw firstError;
}

async function finishUpload(
  session: UploadSession,
  options: ChunkedUploadOptions,
): Promise<Response> {
  return sendJson(
    '/api/upload/complete',
    {
      uploadId: session.uploadId,
      total: session.total,
      kind: options.kind,
      mimeType: options.mimeType,
      filename: options.filename,
    },
    session.mode,
    2,
    COMPLETE_TIMEOUT_MS,
  );
}

/**
 * ثبت نهایی با بازیابی. خطای موقت سرور (5xx) تکته‌ها را از بین نمی‌برد، پس همان درخواست
 * دوباره فرستاده می‌شود؛ فقط در 409 باید تکته‌ها دوباره ارسال شوند.
 */
async function completeUpload(
  session: UploadSession,
  options: ChunkedUploadOptions,
  pending: Set<number>,
): Promise<Response> {
  let response: Response | null = null;
  // اگر اتصال هنگام «ثبت نهایی» قطع شود، تکه‌ها روی سرور مانده‌اند؛ فقط همین
  // درخواست را دوباره می‌فرستیم و کل آپلود را از اول شروع نمی‌کنیم.
  for (let attempt = 0; attempt <= COMPLETE_ATTEMPTS; attempt += 1) {
    try {
      response = await finishUpload(session, options);
      break;
    } catch (error) {
      if (attempt === COMPLETE_ATTEMPTS) throw error;
      await sleep(1_000 * (attempt + 1));
    }
  }
  if (!response) throw new NetworkError();

  for (let attempt = 0; attempt < COMPLETE_ATTEMPTS; attempt += 1) {
    if (response.status === 409) {
      for (let index = 0; index < session.total; index += 1) pending.add(index);
      await pushChunks(session, pending, options.onProgress);
      response = await finishUpload(session, options);
      continue;
    }
    if (response.status >= 500 && attempt < COMPLETE_ATTEMPTS - 1) {
      await sleep(1_000 * (attempt + 1));
      response = await finishUpload(session, options);
      continue;
    }
    break;
  }
  return response;
}

export async function sendChunked(
  options: ChunkedUploadOptions,
): Promise<ChunkedUploadResult> {
  const preferred = getTransportMode();
  let chunkSize = chunkSizeFor(preferred);
  const modes: TransportMode[] = [preferred, ...MODE_ORDER.filter((mode) => mode !== preferred)];
  let lastError = 'اتصال به سرور قطع شد.';
  let networkFailures = 0;

  for (let round = 0; round < MAX_UPLOAD_ATTEMPTS; round += 1) {
    if (round > 0) {
      await sleep(ROUND_BACKOFF_MS[Math.min(round - 1, ROUND_BACKOFF_MS.length - 1)]);
    }
    let session: UploadSession | null = null;
    const pending = new Set<number>();

    for (const mode of modes) {
      const wantChunkSize = mode === 'get' ? Math.min(chunkSize, GET_CHUNK_MAX) : chunkSize;
      // اگر کانال جدید سقف متفاوتی دارد و هنوز تکته‌ای مانده، با اندازه‌ی درست از نو شروع می‌کنیم.
      if (session && session.chunkSize !== wantChunkSize && pending.size > 0) {
        session = null;
        pending.clear();
      }
      if (!session) {
        try {
          session = await openUpload(options, mode, wantChunkSize);
        } catch (error) {
          if (!(error instanceof NetworkError)) {
            return {
              success: false,
              error: error instanceof Error ? error.message : lastError,
              chunkSize,
              chunkCount: 0,
            };
          }
          lastError = `آماده‌سازی آپلود با ${TRANSPORT_MODE_LABELS[mode]} ناموفق بود.`;
          continue;
        }
        chunkSize = session.chunkSize;
        for (let index = 0; index < session.total; index += 1) pending.add(index);
      }

      session.mode = mode;
      // یک قطع اتصال دلیل بر بد بودن کانال نیست؛ خود اتصال‌ها روی این شبکه
      // عمر کوتاهی دارند. پس اول همان کانال را روی اتصال تازه دوباره امتحان
      // می‌کنیم و فقط بعد از شکست دوباره به کانال بعدی می‌رویم.
      let pushed = false;
      for (let attempt = 0; attempt < MODE_ATTEMPTS; attempt += 1) {
        try {
          await pushChunks(session, pending, options.onProgress);
          pushed = true;
          break;
        } catch (error) {
          if (!(error instanceof NetworkError)) {
            return {
              success: false,
              error: error instanceof Error ? error.message : lastError,
              chunkSize,
              chunkCount: session.total,
            };
          }
          networkFailures += 1;
          lastError = `اتصال هنگام ارسال تکه‌ها قطع شد (${TRANSPORT_MODE_LABELS[mode]}).`;
          if (attempt < MODE_ATTEMPTS - 1) await sleep(400 * (attempt + 1));
        }
      }
      if (pushed && pending.size === 0) break;
    }

    if (!session || pending.size > 0) {
      continue;
    }

    try {
      const doneRes = await completeUpload(session, options, pending);
      const doneData = (await doneRes.json().catch(() => ({}))) as {
        success?: boolean;
        publicUrl?: string;
        content?: unknown;
        translation?: { translated: number; failed: number; pending: number };
        error?: string;
      };
      if (!doneRes.ok || !doneData.success) {
        return {
          success: false,
          error: doneData.error || `ثبت نهایی ناموفق بود (${doneRes.status}).`,
          chunkSize,
          chunkCount: session.total,
        };
      }
      setChunkSize(chunkSize);
      setTransportMode(session.mode);
      return {
        success: true,
        publicUrl: doneData.publicUrl,
        content: doneData.content,
        translation: doneData.translation,
        chunkSize,
        chunkCount: session.total,
      };
    } catch (error) {
      if (!(error instanceof NetworkError)) {
        return {
          success: false,
          error: error instanceof Error ? error.message : lastError,
          chunkSize,
          chunkCount: session.total,
        };
      }
      networkFailures += 1;
      lastError = 'اتصال هنگام ثبت نهایی قطع شد.';
    }
  }

  return {
    success: false,
    error: networkFailures > 0 ? lastError : 'آپلود ناموفق بود.',
    chunkSize,
    chunkCount: 0,
  };
}

export function dataUrlToParts(dataUrl: string): { base64: string; mimeType: string } | null {
  const match = dataUrl.match(/^data:(image\/(?:jpeg|jpg|png|webp));base64,(.+)$/);
  if (!match) return null;
  return {
    mimeType: match[1] === 'image/jpg' ? 'image/jpeg' : match[1],
    base64: match[2],
  };
}

export async function publishSiteContent(content: unknown): Promise<ChunkedUploadResult> {
  const bytes = new TextEncoder().encode(JSON.stringify(content));
  return sendChunked({ kind: 'content', base64: toBase64(bytes), filename: 'site-data.json' });
}

export async function uploadImageFile(
  dataUrl: string,
  filename: string,
  onProgress?: (done: number, total: number) => void,
): Promise<ChunkedUploadResult> {
  const parts = dataUrlToParts(dataUrl);
  if (!parts) return { success: false, error: 'فرمت تصویر باید JPEG، PNG یا WebP باشد.' };
  return sendChunked({
    kind: 'media',
    base64: parts.base64,
    mimeType: parts.mimeType,
    filename,
    onProgress,
  });
}

export interface ProbeStep {
  bytes: number;
  ok: boolean;
  status: number;
  elapsedMs: number;
}

export interface ChannelProbe {
  mode: TransportMode;
  ok: boolean;
  status: number;
  elapsedMs: number;
}

/**
 * سه کانال را هم‌زمان می‌سنجد (تا تست طول نکشد) و بعد نردبان اندازه را روی
 * کانال سالم اجرا می‌کند. اگر شبکه‌ای POST را کند یا قطع کند، همین‌جا مشخص
 * می‌شود و پنل روی کانال سالم تنظیم می‌شود.
 */
export async function probeConnection(): Promise<{
  steps: ProbeStep[];
  colo: string | null;
  channels: ChannelProbe[];
}> {
  let colo: string | null = null;

  const channels = await Promise.all(
    MODE_ORDER.map(async (mode): Promise<ChannelProbe> => {
      const started = Date.now();
      try {
        const res = await sendJson(
          '/api/health',
          { pad: 'x'.repeat(1000) },
          mode,
          1,
          mode === 'get' ? 15_000 : 8_000,
        );
        const payload = (await res.json().catch(() => ({}))) as { colo?: string };
        if (payload.colo) colo = payload.colo;
        return { mode, ok: res.ok, status: res.status, elapsedMs: Date.now() - started };
      } catch {
        return { mode, ok: false, status: 0, elapsedMs: Date.now() - started };
      }
    }),
  );

  const working = channels.find((channel) => channel.ok);
  const steps: ProbeStep[] = [];

  if (working) {
    setTransportMode(working.mode);
    if (working.mode === 'get') {
      // روی کانال GET طول URL تعیین‌کننده است، نه حجم داده؛ پس همان اندازه‌هایی سنجیده
      // می‌شود که واقعاً در آدرس تکته‌ها ساخته می‌شوند.
      let best = 0;
      for (const chars of [3_500, 7_500, 11_500]) {
        const started = Date.now();
        try {
          const res = await sendJson('/api/health', { pad: 'x'.repeat(chars) }, 'get', 1, 15_000);
          const payload = (await res.json().catch(() => ({}))) as { colo?: string };
          if (payload.colo) colo = payload.colo;
          const elapsedMs = Date.now() - started;
          const ok = res.ok && elapsedMs < PROBE_FAST_MS;
          steps.push({ bytes: Math.round((chars * 3) / 4), ok, status: res.status, elapsedMs });
          if (ok) best = chars;
        } catch {
          steps.push({
            bytes: Math.round((chars * 3) / 4),
            ok: false,
            status: 0,
            elapsedMs: Date.now() - started,
          });
        }
      }
      setChunkSize(best || MIN_CHUNK);
    } else {
      for (const kb of [8, 24, 40]) {
        const target = kb * 1024;
        const padChars = target - 24;
        const started = Date.now();
        try {
          const res = await sendJson(
            '/api/health',
            { pad: 'x'.repeat(Math.max(0, padChars)) },
            working.mode,
            1,
            15_000,
          );
          const payload = (await res.json().catch(() => ({}))) as { colo?: string };
          if (payload.colo) colo = payload.colo;
          steps.push({
            bytes: target,
            ok: res.ok,
            status: res.status,
            elapsedMs: Date.now() - started,
          });
        } catch {
          steps.push({ bytes: target, ok: false, status: 0, elapsedMs: Date.now() - started });
        }
      }
      setChunkSize(MAX_CHUNK);
    }
  }

  return { steps, colo, channels };
}
