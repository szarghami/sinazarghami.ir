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
const MIN_CHUNK = 8 * 1024;
const MAX_CHUNK = 24 * 1024;
const REQUEST_TIMEOUT_MS = 30_000;
const COMPLETE_TIMEOUT_MS = 90_000;

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

function nextChunkSize(current: number): number | null {
  if (current <= MIN_CHUNK) return null;
  return Math.max(MIN_CHUNK, Math.floor(current / 2));
}

async function postJson(path: string, body: unknown, timeoutMs = REQUEST_TIMEOUT_MS): Promise<Response> {
  const controller = new AbortController();
  const timer = window.setTimeout(() => controller.abort(), timeoutMs);
  try {
    return await fetch(path, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      credentials: 'same-origin',
      body: JSON.stringify(body),
      signal: controller.signal,
    });
  } finally {
    window.clearTimeout(timer);
  }
}

async function postWithRetry(
  path: string,
  body: unknown,
  attempts = 3,
  timeoutMs = REQUEST_TIMEOUT_MS,
): Promise<Response> {
  for (let attempt = 0; attempt < attempts; attempt += 1) {
    try {
      return await postJson(path, body, timeoutMs);
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

async function runUpload(
  options: ChunkedUploadOptions,
  chunkSize: number,
): Promise<ChunkedUploadResult> {
  const total = Math.max(1, Math.ceil(options.base64.length / chunkSize));
  const initRes = await postWithRetry('/api/upload/init', {
    kind: options.kind,
    total,
    mimeType: options.mimeType,
  });
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
    const res = await postWithRetry('/api/upload/chunk', {
      uploadId: initData.uploadId,
      index,
      data,
    });
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

  const doneRes = await postWithRetry(
    '/api/upload/complete',
    {
      uploadId: initData.uploadId,
      total,
      kind: options.kind,
      mimeType: options.mimeType,
      filename: options.filename,
    },
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
 * ارسال یک داده‌ی base64 به سرور؛ در صورت قطع اتصال، اندازه‌ی تکه نصف می‌شود
 * و همان آپلود از ابتدا با تکه‌های کوچک‌تر تکرار می‌شود.
 */
export async function sendChunked(
  options: ChunkedUploadOptions,
): Promise<ChunkedUploadResult> {
  let chunkSize = getChunkSize();
  let lastError = 'اتصال به سرور قطع شد.';

  for (let round = 0; round < 4; round += 1) {
    try {
      const result = await runUpload(options, chunkSize);
      if (result.success) setChunkSize(chunkSize);
      return result;
    } catch (error) {
      if (!(error instanceof NetworkError)) {
        return {
          success: false,
          error: error instanceof Error ? error.message : lastError,
          chunkSize,
        };
      }
      lastError = `اتصال هنگام ارسال قطع شد (تکه ${Math.round(chunkSize / 1024)} کیلوبایتی).`;
      const smaller = nextChunkSize(chunkSize);
      if (smaller === null) break;
      chunkSize = smaller;
    }
  }

  return { success: false, error: lastError, chunkSize };
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

/** نردبان اندازه را می‌سنجد تا معلوم شود این شبکه تا چه حجمی را عبور می‌دهد. */
export async function probeConnection(): Promise<{ steps: ProbeStep[]; colo: string | null }> {
  const sizes = [1024, 8192, 24576, 40960, 65536];
  const steps: ProbeStep[] = [];
  let colo: string | null = null;

  for (const bytes of sizes) {
    const started = Date.now();
    try {
      const res = await postJson(
        '/api/health',
        { pad: 'x'.repeat(Math.max(0, bytes - 20)) },
        20_000,
      );
      const payload = (await res.json().catch(() => ({}))) as { colo?: string };
      if (payload.colo) colo = payload.colo;
      steps.push({ bytes, ok: res.ok, status: res.status, elapsedMs: Date.now() - started });
    } catch {
      steps.push({ bytes, ok: false, status: 0, elapsedMs: Date.now() - started });
    }
  }

  return { steps, colo };
}
