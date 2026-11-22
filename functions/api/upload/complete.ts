import {
  getGitHubFile,
  isValidContent,
  json,
  putGitHubBinary,
  putGitHubFile,
  requireAdmin,
  type Env,
} from '../_shared/runtime';
import { readRequestJson } from '../_shared/request';
import {
  MAX_CHUNKS,
  MAX_UPLOAD_BYTES,
  decodeBase64,
  deleteChunks,
  isUploadId,
  readChunks,
} from '../_shared/uploads';
import { prepareEnglishFields } from '../_shared/translateContent';
import { translateLatestContent } from '../_shared/translationJob';

interface Context {
  request: Request;
  env: Env;
  waitUntil?: (promise: Promise<unknown>) => void;
}

interface CompleteBody {
  uploadId?: string;
  total?: number;
  kind?: string;
  mimeType?: string;
  filename?: string;
}

const CONTENT_PATH = 'public/site-data.json';
const MAX_CONTENT_BYTES = 1_500_000;
const WRITE_ATTEMPTS = 3;

function sleep(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

/**
 * نوشتن فایل محتوا در گیت‌هاب با تلاش مجدد.
 *
 * هر تلاش sha را از نو می‌خواند؛ اگر بین خواندن و نوشتن کسی فایل را تغییر داده
 * باشد (مثلاً انتشار هم‌زمان از گوشی) گیت‌هاب ۴۰۹ می‌دهد و بدون این کار انتشار
 * برای همیشه شکست می‌خورد.
 */
async function writeContentWithRetry(env: Env, content: unknown): Promise<string> {
  let lastError: unknown = null;
  for (let attempt = 0; attempt < WRITE_ATTEMPTS; attempt += 1) {
    if (attempt > 0) await sleep(400 * attempt);
    try {
      const file = await getGitHubFile(env, CONTENT_PATH);
      return await putGitHubFile(
        env,
        CONTENT_PATH,
        `${JSON.stringify(content)}\n`,
        'content: publish from admin studio',
        file?.sha,
      );
    } catch (error) {
      lastError = error;
    }
  }
  throw lastError instanceof Error ? lastError : new Error('ثبت محتوا در گیت‌هاب ناموفق بود.');
}
const MIME_EXTENSIONS: Record<string, string> = {
  'image/jpeg': 'jpg',
  'image/jpg': 'jpg',
  'image/png': 'png',
  'image/webp': 'webp',
};

async function handle(request: Request, env: Env, waitUntil?: (promise: Promise<unknown>) => void): Promise<Response> {
  const session = await requireAdmin(request, env);
  if (!session) return json({ success: false, error: 'Unauthorized.' }, 401);
  if (!env.ADMIN_KV) {
    return json({ success: false, error: 'ADMIN_KV در Cloudflare تنظیم نشده است.' }, 503);
  }

  const body = await readRequestJson<CompleteBody>(request);
  if (!body) return json({ success: false, error: 'Invalid JSON body.' }, 400);

  if (!isUploadId(body.uploadId)) {
    return json({ success: false, error: 'شناسه آپلود نامعتبر است.' }, 400);
  }
  const total = Number(body.total);
  if (!Number.isInteger(total) || total < 1 || total > MAX_CHUNKS) {
    return json({ success: false, error: 'تعداد تکه‌ها نامعتبر است.' }, 400);
  }

  const chunks = await readChunks(env, body.uploadId, total);
  if (!chunks) {
    return json(
      { success: false, error: 'همه تکه‌ها دریافت نشد؛ لطفاً دوباره تلاش کنید.' },
      409,
    );
  }

  let bytes: Uint8Array;
  try {
    bytes = decodeBase64(chunks.join(''));
  } catch {
    return json({ success: false, error: 'داده ارسالی معتبر نیست.' }, 400);
  }
  await deleteChunks(env, body.uploadId, total);

  if (body.kind === 'content') {
    if (bytes.byteLength > MAX_CONTENT_BYTES) {
      return json({ success: false, error: 'حجم محتوا بیش از حد مجاز است.' }, 413);
    }
    let content: unknown;
    try {
      content = JSON.parse(new TextDecoder().decode(bytes));
    } catch {
      return json({ success: false, error: 'ساختار محتوا معتبر نیست.' }, 400);
    }
    if (!isValidContent(content)) {
      return json({ success: false, error: 'ساختار محتوا معتبر نیست.' }, 400);
    }
    try {
      const file = await getGitHubFile(env, CONTENT_PATH);
      let previous: Record<string, unknown> | null = null;
      if (file) {
        try {
          const parsed = JSON.parse(file.content) as unknown;
          if (parsed && typeof parsed === 'object') previous = parsed as Record<string, unknown>;
        } catch {
          previous = null;
        }
      }
      const pending = prepareEnglishFields(content as Record<string, unknown>, previous);
      const translation = { translated: 0, failed: 0, pending };
      const commitSha = await writeContentWithRetry(env, content);
      if (pending && waitUntil) waitUntil(translateLatestContent(env).catch(() => undefined));
      return json({ success: true, content, commitSha, translation });
    } catch (error) {
      return json(
        {
          success: false,
          error: error instanceof Error ? error.message : 'ثبت در گیت‌هاب ناموفق بود.',
        },
        503,
      );
    }
  }

  if (body.kind === 'media') {
    if (bytes.byteLength > MAX_UPLOAD_BYTES) {
      return json({ success: false, error: 'حجم تصویر بیش از حد مجاز است.' }, 413);
    }
    const mimeType = (body.mimeType || '').toLowerCase();
    const extension = MIME_EXTENSIONS[mimeType];
    if (!extension) {
      return json({ success: false, error: 'فرمت تصویر باید JPEG، PNG یا WebP باشد.' }, 400);
    }
    const now = new Date();
    const folder = `${now.getUTCFullYear()}/${String(now.getUTCMonth() + 1).padStart(2, '0')}`;
    const safeName =
      (body.filename || 'image')
        .toLowerCase()
        .replace(/[^a-z0-9-]+/g, '-')
        .replace(/^-+|-+$/g, '')
        .slice(0, 48) || 'image';
    const path = `public/media/${folder}/${safeName}-${crypto.randomUUID()}.${extension}`;
    try {
      await putGitHubBinary(env, path, bytes, `media: add ${safeName}`);
      return json({ success: true, publicUrl: `/${path.replace(/^public\//, '')}`, path });
    } catch (error) {
      return json(
        {
          success: false,
          error: error instanceof Error ? error.message : 'بارگذاری تصویر ناموفق بود.',
        },
        503,
      );
    }
  }

  return json({ success: false, error: 'نوع آپلود نامعتبر است.' }, 400);
}

export async function onRequestPost({ request, env, waitUntil }: Context): Promise<Response> {
  return handle(request, env, waitUntil);
}

export async function onRequestGet({ request, env, waitUntil }: Context): Promise<Response> {
  return handle(request, env, waitUntil);
}
