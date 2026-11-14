// =====================================================================
// ارسال مقاوم به قطع اتصال
// شبکه‌ی ایران درخواست‌های POST بزرگ به برخی دامنه‌ها را وسط راه قطع می‌کند.
// همه‌ی نوشتن‌ها (انتشار محتوا و آپلود عکس) تکه‌تکه و کوچک ارسال می‌شوند.
// =====================================================================

export class NetworkError extends Error {
  constructor(message = 'اتصال به سرور قطع شد.') {
    super(message);
    this.name = 'NetworkError';
  }
}

const CHUNK_KEY = 'sina_chunk_size';
const MODE_KEY = 'sina_transport_mode';
const MIN_CHUNK = 4 * 1024;
const MAX_CHUNK = 24 * 1024;
const REQUEST_TIMEOUT_MS = 30_000;
const COMPLETE_TIMEOUT_MS = 90_000;

/**
 * کانال ارسال. روی بعضی شبکه‌ها بدنه‌ی POST رد می‌شود ولی GET سالم است،
 * بنابراین کلاینت خودش کانال سالم را پیدا می‌کند:
 *  - json: POST معمولی
 *  - text: POST با text/plain و بدنه‌ی base64url
 *  - get : همه‌ی داده در query string (بدون بدنه)
 */
export type TransportMode = 'json' | 'text' | 'get';

export const TRANSPORT_MODE_LABELS: Record<TransportMode, string> = {
  json: 'POST معمولی',
  text: 'POST متنی',
  get: 'GET رشته‌ای',
};

function isTransportMode(value: string | null): value is TransportMode {
  return value === 'json' || value === 'text' || value === 'get';
}

export function getTransportMode(): TransportMode {
  try {
    const raw = window.localStorage.getItem(MODE_KEY);
    if (isTransportMode(raw)) return raw;
  } catch {
    // ignore storage errors
  }
  return 'json';
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

async function postRaw(
  path: string,
  body: string,
  contentType: string,
  timeoutMs: number,
): Promise<Response> {
  return fetchWithTimeout(
    path,
    {
      method: 'POST',
      headers: { 'Content-Type': contentType },
      credentials: 'same-origin',
      cache: 'no-store',
      body,
    },
    timeoutMs,
  );
}

function encodeBase64Url(text: string): string {
  return toBase64(new TextEncoder().encode(text))
    .replace(/\+/g, '-')
    .replace(/\//g, '_')
    .replace(/=+$/g, '');
}

function getPayloadUrl(path: string, payload: unknown): string {
  return `${path}?p=${encodeBase64Url(JSON.stringify(payload))}&t=${Date.now()}`;
}

function sendJsonOnce(
  path: string,
  payload: unknown,
  mode: TransportMode,
  timeoutMs: number,
): Promise<Response> {
  if (mode === 'get') {
    return fetchWithTimeout(
      getPayloadUrl(path, payload),
      { method: 'GET', credentials: 'same-origin', cache: 'no-store' },
      timeoutMs,
    );
  }
  if (mode === 'text') {
    return postRaw(path, encodeBase64Url(JSON.stringify(payload)), 'text/plain', timeoutMs);
  }
  return postRaw(path, JSON.stringify(payload), 'application/json', timeoutMs);
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
      await sleep(400 * (attempt + 1));
    }
  }
  throw new NetworkError();
}

function sendChunkOnce(
  uploadId: string,
  index: number,
  data: string,
  mode: TransportMode,
  timeoutMs: number,
): Promise<Response> {
  if (mode === 'get') {
    const url =
      `/api/upload/chunk?uploadId=${encodeURIComponent(uploadId)}&index=${index}` +
      `&data=${data.replace(/\+/g, '-').replace(/\//g, '_')}&t=${Date.now()}`;
    return fetchWithTimeout(
      url,
      { method: 'GET', credentials: 'same-origin', cache: 'no-store' },
      timeoutMs,
    );
  }
  return sendJsonOnce('/api/upload/chunk', { uploadId, index, data }, mode, timeoutMs);
}

async function sendChunk(
  uploadId: string,
  index: number,
  data: string,
  mode: TransportMode,
  attempts = 2,
): Promise<Response> {
  for (let attempt = 0; attempt < attempts; attempt += 1) {
    try {
      return await sendChunkOnce(uploadId, index, data, mode, REQUEST_TIMEOUT_MS);
    } catch {
      if (attempt === attempts - 1) throw new NetworkError();
      await sleep(400 * (attempt + 1));
    }
  }
  throw new NetworkError();
}

function toBase64(bytes: Uint8Array): string {
  let binary = '';
  const step = 0x8000;
  for (let index = 0; index < bytes.length; index += step) {
    binary += String.fromCharCode(...bytes.subarray(index, index + step));
  }
  return btoa(binary);
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

interface UploadPlan {
  mode: TransportMode;
  chunkSize: number;
}

async function runUpload(
  options: ChunkedUploadOptions,
  plan: UploadPlan,
): Promise<ChunkedUploadResult> {
  const { mode, chunkSize } = plan;
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
    return {
      success: false,
      error: initData.error || `آماده‌سازی آپلود ناموفق بود (${initRes.status}).`,
      chunkSize,
      chunkCount: total,
    };
  }

  for (let index = 0; index < total; index += 1) {
    const data = options.base64.slice(index * chunkSize, (index + 1) * chunkSize);
    const res = await sendChunk(initData.uploadId, index, data, mode);
    if (!res.ok) {
      const payload = (await res.json().catch(() => ({}))) as { error?: string };
      return {
        success: false,
        error: payload.error || `ارسال تکه ${index + 1} ناموفق بود (${res.status}).`,
        chunkSize,
        chunkCount: total,
      };
    }
    options.onProgress?.(index + 1, total);
  }

  const doneRes = await sendJson(
    '/api/upload/complete',
    {
      uploadId: initData.uploadId,
      total,
      kind: options.kind,
      mimeType: options.mimeType,
      filename: options.filename,
    },
    mode,
    2,
    COMPLETE_TIMEOUT_MS,
  );
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
      chunkCount: total,
    };
  }

  return {
    success: true,
    publicUrl: doneData.publicUrl,
    content: doneData.content,
    translation: doneData.translation,
    chunkSize,
    chunkCount: total,
  };
}

/**
 * ترتیب تلاش: اول کانال و اندازه‌ای که قبلاً جواب داده، بعد همان کانال با تکه‌ی
 * نصف، و در آخر کانال‌های جایگزین. روی شبکه‌ای که POST را می‌اندازد، خودکار
 * سراغ GET می‌رود و بعد از موفقیت همان را برای دفعات بعد به خاطر می‌سپارد.
 */
function buildPlans(): UploadPlan[] {
  const preferred = getTransportMode();
  const start = getChunkSize();
  const others = (['json', 'text', 'get'] as TransportMode[]).filter((mode) => mode !== preferred);
  const plans: UploadPlan[] = [
    { mode: preferred, chunkSize: start },
    { mode: preferred, chunkSize: Math.max(MIN_CHUNK, Math.floor(start / 2)) },
  ];
  for (const mode of others) {
    plans.push({ mode, chunkSize: mode === 'get' ? 12 * 1024 : 12 * 1024 });
  }
  plans.push({ mode: 'get', chunkSize: 6 * 1024 });
  return plans;
}

export async function sendChunked(
  options: ChunkedUploadOptions,
): Promise<ChunkedUploadResult> {
  const plans = buildPlans();
  const deadline = Date.now() + 3 * 60 * 1000;
  let lastError = 'اتصال به سرور قطع شد.';
  let lastChunkSize = plans[0]?.chunkSize ?? getChunkSize();

  for (const plan of plans) {
    if (Date.now() > deadline) break;
    lastChunkSize = plan.chunkSize;
    try {
      const result = await runUpload(options, plan);
      if (result.success) {
        setChunkSize(plan.chunkSize);
        setTransportMode(plan.mode);
      }
      return result;
    } catch (error) {
      if (!(error instanceof NetworkError)) {
        return {
          success: false,
          error: error instanceof Error ? error.message : lastError,
          chunkSize: plan.chunkSize,
        };
      }
      lastError = `اتصال هنگام ارسال قطع شد (${TRANSPORT_MODE_LABELS[plan.mode]}، تکه ${Math.round(
        plan.chunkSize / 1024,
      )} کیلوبایتی).`;
    }
  }

  return { success: false, error: lastError, chunkSize: lastChunkSize };
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
 * سه کانال را جداگانه می‌سنجد و بعد نردبان اندازه را روی کانال سالم اجرا می‌کند.
 * اگر شبکه‌ای POST را بی‌صدا بیندازد، همین‌جا مشخص می‌شود و پنل روی کانال سالم
 * تنظیم می‌شود.
 */
export async function probeConnection(): Promise<{
  steps: ProbeStep[];
  colo: string | null;
  channels: ChannelProbe[];
}> {
  const channels: ChannelProbe[] = [];
  let colo: string | null = null;
  const modes: TransportMode[] = ['json', 'text', 'get'];

  for (const mode of modes) {
    const started = Date.now();
    try {
      const res = await sendJson('/api/health', { pad: 'x'.repeat(1000) }, mode, 1, 20_000);
      const payload = (await res.json().catch(() => ({}))) as { colo?: string };
      if (payload.colo) colo = payload.colo;
      channels.push({ mode, ok: res.ok, status: res.status, elapsedMs: Date.now() - started });
    } catch {
      channels.push({ mode, ok: false, status: 0, elapsedMs: Date.now() - started });
    }
  }

  const working = channels.find((channel) => channel.ok);
  const sizes = working?.mode === 'get' ? [8192, 24576] : [8192, 24576, 40960, 65536];
  const steps: ProbeStep[] = [];

  if (working) {
    setTransportMode(working.mode);
    for (const bytes of sizes) {
      const started = Date.now();
      try {
        const res = await sendJson(
          '/api/health',
          { pad: 'x'.repeat(Math.max(0, bytes - 20)) },
          working.mode,
          1,
          20_000,
        );
        const payload = (await res.json().catch(() => ({}))) as { colo?: string };
        if (payload.colo) colo = payload.colo;
        steps.push({ bytes, ok: res.ok, status: res.status, elapsedMs: Date.now() - started });
      } catch {
        steps.push({ bytes, ok: false, status: 0, elapsedMs: Date.now() - started });
      }
    }
  }

  return { steps, colo, channels };
}
