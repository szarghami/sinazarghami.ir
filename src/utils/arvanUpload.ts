// =====================================================================
// آپلود مستقیم به فضای ابری آروان (S3) بدون عبور فایل از Cloudflare
// ---------------------------------------------------------------------
// فایل‌های کوچک با یک PUT امضاشده و فایل‌های بزرگ با آپلود چندتکه‌ای
// (multipart) ارسال می‌شوند. تکه‌های موفق روی آروان می‌مانند، پس اگر
// اینترنت قطع شد فقط تکه‌های باقی‌مانده دوباره فرستاده می‌شوند.
// =====================================================================

const API_PATH = '/api/upload/arvan';
const PART_SIZE = 8 * 1024 * 1024;
const SINGLE_LIMIT = 24 * 1024 * 1024;
const PART_BATCH = 40;
const PART_CONCURRENCY = 3;
const PUT_ATTEMPTS = 4;
const STATE_KEY = 'sina_arvan_multipart_v1';

export interface ArvanUploadOptions {
  filename: string;
  mimeType: string;
  kind: 'image' | 'video';
  fingerprint?: string;
  onProgress?: (loaded: number, total: number) => void;
  onStatus?: (message: string) => void;
}

export interface ArvanUploadResult {
  key: string;
  publicUrl: string;
  provider: 'arvan';
  resumed: boolean;
}

interface MultipartState {
  key: string;
  uploadId: string;
  partSize: number;
  partCount: number;
  publicUrl: string;
}

interface PartTicket {
  partNumber: number;
  url: string;
}

class ApiError extends Error {
  retryable: boolean;

  constructor(message: string, retryable: boolean) {
    super(message);
    this.name = 'ApiError';
    this.retryable = retryable;
  }
}

function sleep(ms: number): Promise<void> {
  return new Promise((resolve) => window.setTimeout(resolve, ms));
}

async function callApi<T>(payload: unknown): Promise<T> {
  let lastError: unknown = null;

  for (let attempt = 0; attempt < 3; attempt += 1) {
    try {
      const response = await fetch(API_PATH, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'same-origin',
        cache: 'no-store',
        body: JSON.stringify(payload),
      });
      const data = (await response.json().catch(() => ({}))) as {
        success?: boolean;
        error?: string;
      };
      if (!response.ok || data.success === false) {
        throw new ApiError(
          data.error || `سرور درخواست آپلود را رد کرد (${response.status}).`,
          false,
        );
      }
      return data as T;
    } catch (error) {
      if (error instanceof ApiError && !error.retryable) throw error;
      lastError = error;
      if (attempt < 2) await sleep(400 * (attempt + 1));
    }
  }

  throw lastError instanceof Error
    ? lastError
    : new Error('ارتباط با سرور برای شروع آپلود برقرار نشد.');
}

function putBlob(
  url: string,
  blob: Blob,
  mimeType: string,
  onLoaded?: (loaded: number) => void,
  readEtag = false,
): Promise<string | null> {
  return new Promise((resolve, reject) => {
    const xhr = new XMLHttpRequest();
    xhr.open('PUT', url, true);
    xhr.timeout = 180_000;

    if (mimeType) {
      try {
        xhr.setRequestHeader('Content-Type', mimeType);
      } catch {
        // اگر مرورگر اجازه نداد، آروان نوع پیش‌فرض را ذخیره می‌کند.
      }
    }

    xhr.upload.onprogress = (event) => {
      if (event.lengthComputable) onLoaded?.(event.loaded);
    };
    xhr.onload = () => {
      if (xhr.status >= 200 && xhr.status < 300) {
        // خواندن ETag فقط در آپلود چندتکه لازم است. برای آپلود تک‌تکه این هدر
        // در CORS باکت اکسپوز نشده و خواندنش فقط خطای «unsafe header» در کنسول می‌سازد.
        resolve(readEtag ? xhr.getResponseHeader('ETag') : null);
        return;
      }
      reject(new Error(`آپلود تکه به آروان ناموفق بود (${xhr.status}).`));
    };
    xhr.onerror = () => reject(new Error('اتصال هنگام آپلود به آروان قطع شد.'));
    xhr.ontimeout = () => reject(new Error('آپلود به آروان بیش از حد طول کشید.'));
    xhr.send(blob);
  });
}

async function putWithRetry(
  url: string,
  blob: Blob,
  mimeType: string,
  onLoaded?: (loaded: number) => void,
  readEtag = false,
): Promise<string | null> {
  let lastError: unknown = null;
  for (let attempt = 0; attempt < PUT_ATTEMPTS; attempt += 1) {
    try {
      return await putBlob(url, blob, mimeType, onLoaded, readEtag);
    } catch (error) {
      lastError = error;
      if (attempt < PUT_ATTEMPTS - 1) await sleep(700 * (attempt + 1));
    }
  }
  throw lastError instanceof Error ? lastError : new Error('آپلود تکه ناموفق بود.');
}

async function runPool<T>(
  items: T[],
  concurrency: number,
  worker: (item: T) => Promise<void>,
): Promise<void> {
  let cursor = 0;
  let firstError: unknown = null;
  const runners = Array.from({ length: Math.min(concurrency, items.length) }, async () => {
    while (cursor < items.length) {
      const item = items[cursor];
      cursor += 1;
      try {
        await worker(item);
      } catch (error) {
        if (!firstError) firstError = error;
        return;
      }
    }
  });
  await Promise.all(runners);
  if (firstError) throw firstError;
}

function readStates(): Record<string, MultipartState> {
  try {
    const raw = window.localStorage.getItem(STATE_KEY);
    if (!raw) return {};
    const parsed = JSON.parse(raw) as Record<string, MultipartState>;
    return parsed && typeof parsed === 'object' ? parsed : {};
  } catch {
    return {};
  }
}

function writeStates(states: Record<string, MultipartState>): void {
  try {
    window.localStorage.setItem(STATE_KEY, JSON.stringify(states));
  } catch {
    // اگر حافظه‌ی مرورگر پر بود، آپلود در همین نشست ادامه پیدا می‌کند.
  }
}

function fingerprintOf(options: ArvanUploadOptions, size: number): string {
  return options.fingerprint || `${options.filename}|${size}|${options.mimeType}`;
}

async function uploadSingle(
  file: Blob,
  options: ArvanUploadOptions,
): Promise<ArvanUploadResult> {
  const ticket = await callApi<{
    key: string;
    uploadUrl: string;
    publicUrl: string;
  }>({
    action: 'single',
    kind: options.kind,
    filename: options.filename,
    mimeType: options.mimeType,
    size: file.size,
  });

  await putWithRetry(ticket.uploadUrl, file, options.mimeType, (loaded) => {
    options.onProgress?.(loaded, file.size);
  });
  options.onProgress?.(file.size, file.size);

  // فایل تازه را برای خواندن عمومی باز می‌کنیم تا مرورگر بتواند مستقیم از
  // آروان (سرور ایرانی) بارگذاری کند، نه از مسیر جایگزین.
  try {
    await callApi({ action: 'acl', key: ticket.key });
  } catch {
    // اگر نشد، مسیر جایگزین در نمایش جبران می‌کند.
  }

  return { key: ticket.key, publicUrl: ticket.publicUrl, provider: 'arvan', resumed: false };
}

async function uploadMultipart(
  file: Blob,
  options: ArvanUploadOptions,
): Promise<ArvanUploadResult> {
  const fingerprint = fingerprintOf(options, file.size);
  const states = readStates();
  let state = states[fingerprint];
  let resumed = false;

  if (!state || state.partSize !== PART_SIZE) {
    state = await callApi<MultipartState>({
      action: 'create',
      kind: options.kind,
      filename: options.filename,
      mimeType: options.mimeType,
      size: file.size,
    });
    states[fingerprint] = state;
    writeStates(states);
  } else {
    resumed = true;
    options.onStatus?.('ادامه‌ی آپلود قبلی از همان‌جایی که قطع شد...');
  }

  let uploaded = new Map<number, string>();
  let listedSizes = new Map<number, number>();

  try {
    const listed = await callApi<{
      parts: { partNumber: number; etag: string; size: number }[];
    }>({ action: 'list', key: state.key, uploadId: state.uploadId });
    for (const part of listed.parts) {
      uploaded.set(part.partNumber, part.etag);
      listedSizes.set(part.partNumber, part.size || 0);
    }
  } catch {
    // اگر آپلود قبلی منقضی شده باشد، از صفر شروع می‌کنیم.
    state = await callApi<MultipartState>({
      action: 'create',
      kind: options.kind,
      filename: options.filename,
      mimeType: options.mimeType,
      size: file.size,
    });
    states[fingerprint] = state;
    writeStates(states);
    uploaded = new Map();
    listedSizes = new Map();
    resumed = false;
  }

  const loadedByPart = new Map<number, number>(listedSizes);
  const reportProgress = () => {
    let loaded = 0;
    loadedByPart.forEach((value) => {
      loaded += value;
    });
    options.onProgress?.(Math.min(loaded, file.size), file.size);
  };
  reportProgress();

  const pending: number[] = [];
  for (let partNumber = 1; partNumber <= state.partCount; partNumber += 1) {
    if (!uploaded.has(partNumber)) pending.push(partNumber);
  }

  for (let offset = 0; offset < pending.length; offset += PART_BATCH) {
    const batch = pending.slice(offset, offset + PART_BATCH);
    options.onStatus?.(
      `آپلود تکه‌های ${batch[0]} تا ${batch[batch.length - 1]} از ${state.partCount}`,
    );

    const tickets = await callApi<{ urls: PartTicket[] }>({
      action: 'parts',
      key: state.key,
      uploadId: state.uploadId,
      from: batch[0],
      to: batch[batch.length - 1],
    });
    const urlByPart = new Map(tickets.urls.map((ticket) => [ticket.partNumber, ticket.url]));

    await runPool(batch, PART_CONCURRENCY, async (partNumber) => {
      const start = (partNumber - 1) * state.partSize;
      const end = Math.min(partNumber * state.partSize, file.size);
      const blob = file.slice(start, end);
      const onLoaded = (loaded: number) => {
        loadedByPart.set(partNumber, loaded);
        reportProgress();
      };

      let url = urlByPart.get(partNumber);
      if (!url) throw new Error(`نشانی تکه‌ی ${partNumber} دریافت نشد.`);

      let etag: string | null;
      try {
        etag = await putWithRetry(url, blob, options.mimeType, onLoaded, true);
      } catch {
        const refreshed = await callApi<{ urls: PartTicket[] }>({
          action: 'parts',
          key: state.key,
          uploadId: state.uploadId,
          from: partNumber,
          to: partNumber,
        });
        url = refreshed.urls[0]?.url;
        if (!url) throw new Error(`نشانی تازه‌ی تکه‌ی ${partNumber} دریافت نشد.`);
        etag = await putWithRetry(url, blob, options.mimeType, onLoaded, true);
      }

      if (!etag) {
        throw new Error(
          'آروان ETag را برنگرداند. در CORS باکت باید ExposeHeader = ETag تنظیم شود.',
        );
      }
      uploaded.set(partNumber, etag);
      loadedByPart.set(partNumber, blob.size);
      reportProgress();
    });
  }

  const parts = Array.from(uploaded.entries())
    .sort((left, right) => left[0] - right[0])
    .map(([partNumber, etag]) => ({ partNumber, etag }));

  if (parts.length !== state.partCount) {
    throw new Error('هنوز همه‌ی تکه‌ها آپلود نشده‌اند؛ دوباره تلاش کن.');
  }

  await callApi({
    action: 'complete',
    key: state.key,
    uploadId: state.uploadId,
    parts,
  });

  delete states[fingerprint];
  writeStates(states);
  options.onProgress?.(file.size, file.size);

  return { key: state.key, publicUrl: state.publicUrl, provider: 'arvan', resumed };
}

/**
 * فایل را مستقیم به آروان می‌فرستد. برای فایل‌های بزرگ‌تر از ۲۴ مگابایت
 * از multipart استفاده می‌کند و وضعیت را در localStorage نگه می‌دارد تا
 * بعد از قطعی یا رفرش، با انتخاب دوباره‌ی همان فایل ادامه دهد.
 */
export async function uploadFileToArvan(
  file: Blob,
  options: ArvanUploadOptions,
): Promise<ArvanUploadResult> {
  if (file.size <= 0) throw new Error('فایل خالی است.');
  if (file.size <= SINGLE_LIMIT) return uploadSingle(file, options);
  return uploadMultipart(file, options);
}

export function clearArvanUploadState(): void {
  try {
    window.localStorage.removeItem(STATE_KEY);
  } catch {
    // ignore
  }
}
