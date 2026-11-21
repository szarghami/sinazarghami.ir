import { json, requireAdmin, type Env } from '../_shared/runtime';
import { readRequestJson } from '../_shared/request';
import {
  ARVAN_MAX_PARTS,
  ARVAN_PART_SIZE,
  ARVAN_PRESIGN_TTL_SECONDS,
  ARVAN_SINGLE_PUT_TTL_SECONDS,
  arvanRequest,
  buildCompleteXml,
  buildObjectKey,
  getArvanConfig,
  isSafeArvanKey,
  parseListParts,
  presignObject,
  publicUrlFor,
  s3Error,
  setObjectAcl,
  listObjectKeys,
  xmlValue,
  type ArvanConfig,
} from '../_shared/arvan';

interface Context {
  request: Request;
  env: Env;
}

type Action = 'single' | 'create' | 'parts' | 'complete' | 'abort' | 'list' | 'acl' | 'acl-scan';

interface ArvanUploadBody {
  action?: Action;
  kind?: 'image' | 'video';
  filename?: string;
  mimeType?: string;
  size?: number;
  key?: string;
  uploadId?: string;
  from?: number;
  to?: number;
  parts?: { partNumber?: number; etag?: string }[];
  all?: boolean;
}

const MAX_IMAGE_BYTES = 20 * 1024 * 1024;
const MAX_VIDEO_BYTES = 5 * 1024 * 1024 * 1024;
const MAX_SINGLE_BYTES = 32 * 1024 * 1024;
const MAX_PART_BATCH = 100;

function fail(message: string, status = 400): Response {
  return json({ success: false, error: message }, status);
}

function isAction(value: unknown): value is Action {
  return (
    value === 'single' ||
    value === 'create' ||
    value === 'parts' ||
    value === 'complete' ||
    value === 'abort' ||
    value === 'list' ||
    value === 'acl' ||
    value === 'acl-scan'
  );
}

function readKey(config: ArvanConfig, value: unknown): string | null {
  if (typeof value !== 'string' || !isSafeArvanKey(config, value)) return null;
  return value;
}

function readUploadId(value: unknown): string | null {
  if (typeof value !== 'string' || !/^[A-Za-z0-9._~+/=-]{8,2048}$/.test(value)) return null;
  return value;
}

async function readS3Response(response: Response): Promise<{ ok: boolean; text: string; error?: string }> {
  const text = await response.text().catch(() => '');
  const error = s3Error(text);
  if (!response.ok) {
    return {
      ok: false,
      text,
      error: error || `آروان درخواست را رد کرد (${response.status}).`,
    };
  }
  if (error) return { ok: false, text, error };
  return { ok: true, text };
}

async function handleSingle(
  config: ArvanConfig,
  body: ArvanUploadBody,
): Promise<Response> {
  const kind = body.kind;
  const size = Number(body.size);
  if (kind !== 'image' && kind !== 'video') return fail('نوع فایل نامعتبر است.');
  if (!Number.isFinite(size) || size <= 0) return fail('حجم فایل نامعتبر است.');
  if (size > MAX_SINGLE_BYTES) {
    return fail('برای فایل‌های بزرگ باید از آپلود چندتکه‌ای استفاده شود.');
  }
  if (kind === 'image' && size > MAX_IMAGE_BYTES) {
    return fail('حجم تصویر بیش از حد مجاز است.');
  }
  if (kind === 'video' && size > MAX_VIDEO_BYTES) {
    return fail('حجم ویدیو بیش از حد مجاز است.');
  }

  const key = buildObjectKey(config, body.filename || 'file', body.mimeType || '');
  if (!key) return fail('فرمت فایل پشتیبانی نمی‌شود.');

  const uploadUrl = await presignObject(
    config,
    'PUT',
    key,
    {},
    ARVAN_SINGLE_PUT_TTL_SECONDS,
  );

  return json({
    success: true,
    key,
    uploadUrl,
    publicUrl: publicUrlFor(config, key),
    expiresIn: ARVAN_SINGLE_PUT_TTL_SECONDS,
  });
}

async function handleCreate(
  config: ArvanConfig,
  body: ArvanUploadBody,
): Promise<Response> {
  const kind = body.kind;
  const size = Number(body.size);
  if (kind !== 'image' && kind !== 'video') return fail('نوع فایل نامعتبر است.');
  if (!Number.isFinite(size) || size <= 0) return fail('حجم فایل نامعتبر است.');
  if (kind === 'image' && size > MAX_IMAGE_BYTES) {
    return fail('حجم تصویر بیش از حد مجاز است.');
  }
  if (kind === 'video' && size > MAX_VIDEO_BYTES) {
    return fail('حجم ویدیو بیش از حد مجاز است.');
  }

  const partCount = Math.ceil(size / ARVAN_PART_SIZE);
  if (partCount < 1 || partCount > ARVAN_MAX_PARTS) {
    return fail('تعداد تکه‌های فایل بیش از حد مجاز است.');
  }

  const key = buildObjectKey(config, body.filename || 'file', body.mimeType || '');
  if (!key) return fail('فرمت فایل پشتیبانی نمی‌شود.');

  const response = await arvanRequest(config, 'POST', key, {
    query: { uploads: '' },
    contentType: (body.mimeType || 'application/octet-stream').toLowerCase(),
  });
  const result = await readS3Response(response);
  if (!result.ok) return fail(result.error || 'شروع آپلود چندتکه‌ای ناموفق بود.', 502);

  const uploadId = xmlValue(result.text, 'UploadId');
  if (!uploadId) return fail('آروان شناسه‌ی آپلود برنگرداند.', 502);

  return json({
    success: true,
    key,
    uploadId,
    partSize: ARVAN_PART_SIZE,
    partCount,
    publicUrl: publicUrlFor(config, key),
  });
}

async function handleParts(
  config: ArvanConfig,
  body: ArvanUploadBody,
): Promise<Response> {
  const key = readKey(config, body.key);
  const uploadId = readUploadId(body.uploadId);
  if (!key) return fail('کلید فایل نامعتبر است.');
  if (!uploadId) return fail('شناسه‌ی آپلود نامعتبر است.');

  const from = Number(body.from);
  const to = Number(body.to);
  if (!Number.isInteger(from) || !Number.isInteger(to) || from < 1 || to < from) {
    return fail('بازه‌ی تکه‌ها نامعتبر است.');
  }
  if (to - from + 1 > MAX_PART_BATCH) {
    return fail('تعداد تکه‌های هر درخواست بیش از حد مجاز است.');
  }
  if (to > ARVAN_MAX_PARTS) return fail('شماره‌ی تکه نامعتبر است.');

  const urls = await Promise.all(
    Array.from({ length: to - from + 1 }, async (_, offset) => {
      const partNumber = from + offset;
      return {
        partNumber,
        url: await presignObject(
          config,
          'PUT',
          key,
          { partNumber: String(partNumber), uploadId },
          ARVAN_PRESIGN_TTL_SECONDS,
        ),
      };
    }),
  );

  return json({ success: true, urls });
}

async function handleComplete(
  config: ArvanConfig,
  body: ArvanUploadBody,
): Promise<Response> {
  const key = readKey(config, body.key);
  const uploadId = readUploadId(body.uploadId);
  if (!key) return fail('کلید فایل نامعتبر است.');
  if (!uploadId) return fail('شناسه‌ی آپلود نامعتبر است.');
  if (!Array.isArray(body.parts) || body.parts.length === 0) {
    return fail('فهرست تکه‌ها خالی است.');
  }

  const parts = body.parts
    .map((part) => ({
      partNumber: Number(part.partNumber),
      etag: typeof part.etag === 'string' ? part.etag.trim() : '',
    }))
    .filter((part) => Number.isInteger(part.partNumber) && part.partNumber > 0 && part.etag)
    .sort((left, right) => left.partNumber - right.partNumber);

  if (parts.length !== body.parts.length) return fail('فهرست تکه‌ها نامعتبر است.');

  const response = await arvanRequest(config, 'POST', key, {
    query: { uploadId },
    body: buildCompleteXml(parts),
    contentType: 'application/xml',
  });
  const result = await readS3Response(response);
  if (!result.ok) return fail(result.error || 'ثبت نهایی آپلود ناموفق بود.', 502);

  // فایل تازه را برای خواندن عمومی باز می‌کنیم تا مستقیم از آروان سرو شود.
  // اگر آروان قبول نکند، آپلود سالم می‌ماند و سایت از مسیر جایگزین استفاده می‌کند.
  let aclWarning: string | null = null;
  try {
    await setObjectAcl(config, key);
  } catch (error) {
    aclWarning = error instanceof Error ? error.message : 'تنظیم دسترسی عمومی ناموفق بود.';
  }

  return json({
    success: true,
    publicUrl: publicUrlFor(config, key),
    ...(aclWarning ? { warning: aclWarning } : {}),
  });
}

async function handleAcl(
  config: ArvanConfig,
  body: ArvanUploadBody,
): Promise<Response> {
  const key = readKey(config, body.key);
  if (!key) return fail('کلید فایل نامعتبر است.');
  try {
    await setObjectAcl(config, key);
    return json({ success: true });
  } catch (error) {
    return fail(
      error instanceof Error ? error.message : 'تنظیم دسترسی عمومی ناموفق بود.',
      502,
    );
  }
}

/**
 * همه‌ی فایل‌های قبلی را یک‌جا عمومی می‌کند؛ برای فایل‌هایی که قبل از این
 * تغییر آپلود شده‌اند و در مرورگر ۴۰۳ می‌گیرند.
 */
async function handleAclScan(config: ArvanConfig): Promise<Response> {
  const keys = await listObjectKeys(config, `${config.prefix}/`, 500);
  let fixed = 0;
  const failed: string[] = [];

  for (const key of keys) {
    try {
      await setObjectAcl(config, key);
      fixed += 1;
    } catch {
      failed.push(key);
    }
  }

  return json({ success: true, total: keys.length, fixed, failed: failed.slice(0, 10) });
}

async function handleAbort(
  config: ArvanConfig,
  body: ArvanUploadBody,
): Promise<Response> {
  const key = readKey(config, body.key);
  const uploadId = readUploadId(body.uploadId);
  if (!key || !uploadId) return fail('درخواست نامعتبر است.');

  const response = await arvanRequest(config, 'DELETE', key, { query: { uploadId } });
  const result = await readS3Response(response);
  if (!result.ok) return fail(result.error || 'لغو آپلود ناموفق بود.', 502);
  return json({ success: true });
}

async function handleList(
  config: ArvanConfig,
  body: ArvanUploadBody,
): Promise<Response> {
  const key = readKey(config, body.key);
  const uploadId = readUploadId(body.uploadId);
  if (!key || !uploadId) return fail('درخواست نامعتبر است.');

  const response = await arvanRequest(config, 'GET', key, { query: { uploadId } });
  const result = await readS3Response(response);
  if (!result.ok) return fail(result.error || 'خواندن وضعیت آپلود ناموفق بود.', 502);

  return json({ success: true, parts: parseListParts(result.text) });
}

async function handle(request: Request, env: Env): Promise<Response> {
  const session = await requireAdmin(request, env);
  if (!session) return json({ success: false, error: 'Unauthorized.' }, 401);

  const config = getArvanConfig(env);
  if (!config) {
    return fail(
      'تنظیمات آروان کامل نیست. ARVAN_S3_ENDPOINT، REGION، BUCKET، ACCESS_KEY و SECRET_KEY را در Cloudflare اضافه کنید.',
      503,
    );
  }

  const body = await readRequestJson<ArvanUploadBody>(request);
  if (!body) return fail('بدنه‌ی درخواست معتبر نیست.');
  if (!isAction(body.action)) return fail('عملیات نامعتبر است.');

  switch (body.action) {
    case 'single':
      return handleSingle(config, body);
    case 'create':
      return handleCreate(config, body);
    case 'parts':
      return handleParts(config, body);
    case 'complete':
      return handleComplete(config, body);
    case 'abort':
      return handleAbort(config, body);
    case 'list':
      return handleList(config, body);
    case 'acl':
      return handleAcl(config, body);
    case 'acl-scan':
      return handleAclScan(config);
    default:
      return fail('عملیات نامعتبر است.');
  }
}

export async function onRequestPost({ request, env }: Context): Promise<Response> {
  return handle(request, env);
}

export async function onRequestGet({ request, env }: Context): Promise<Response> {
  return json(
    {
      success: false,
      error: 'این مسیر فقط POST را می‌پذیرد.',
    },
    405,
  );
}
