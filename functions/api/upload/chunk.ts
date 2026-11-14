import { json, requireAdmin, type Env } from '../_shared/runtime';
import { readRequestJson } from '../_shared/request';
import {
  MAX_CHUNK_CHARS,
  MAX_CHUNKS,
  UPLOAD_TTL_SECONDS,
  isUploadId,
  uploadKey,
} from '../_shared/uploads';

interface Context {
  request: Request;
  env: Env;
}

interface ChunkBody {
  uploadId?: string;
  index?: number;
  data?: string;
}

/** در حالت GET داده به‌صورت base64url می‌آید تا نیازی به percent-encoding نباشد. */
function fromBase64UrlChars(value: string): string {
  return value.replace(/-/g, '+').replace(/_/g, '/');
}

async function readBody(request: Request): Promise<ChunkBody | null> {
  if (request.method.toUpperCase() === 'GET') {
    const params = new URL(request.url).searchParams;
    const data = params.get('data');
    if (!data) return null;
    return {
      uploadId: params.get('uploadId') || undefined,
      index: Number(params.get('index')),
      data: fromBase64UrlChars(data),
    };
  }
  return readRequestJson<ChunkBody>(request);
}

async function handle(request: Request, env: Env): Promise<Response> {
  const session = await requireAdmin(request, env);
  if (!session) return json({ success: false, error: 'Unauthorized.' }, 401);
  if (!env.ADMIN_KV) {
    return json({ success: false, error: 'ADMIN_KV در Cloudflare تنظیم نشده است.' }, 503);
  }

  const body = await readBody(request);
  if (!body) return json({ success: false, error: 'Invalid JSON body.' }, 400);

  if (!isUploadId(body.uploadId)) {
    return json({ success: false, error: 'شناسه آپلود نامعتبر است.' }, 400);
  }
  const index = Number(body.index);
  if (!Number.isInteger(index) || index < 0 || index >= MAX_CHUNKS) {
    return json({ success: false, error: 'شماره تکه نامعتبر است.' }, 400);
  }
  const data = body.data;
  if (typeof data !== 'string' || data.length > MAX_CHUNK_CHARS) {
    return json({ success: false, error: 'اندازه تکه بیش از حد مجاز است.' }, 413);
  }

  await env.ADMIN_KV.put(uploadKey(body.uploadId, index), data, {
    expirationTtl: UPLOAD_TTL_SECONDS,
  });

  return json({ success: true, index });
}

export async function onRequestPost({ request, env }: Context): Promise<Response> {
  return handle(request, env);
}

export async function onRequestGet({ request, env }: Context): Promise<Response> {
  return handle(request, env);
}
