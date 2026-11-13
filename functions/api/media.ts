import { json, putGitHubBinary, requireAdmin, type Env } from './_shared/runtime';

interface Context {
  request: Request;
  env: Env;
}

const MAX_IMAGE_BYTES = 5 * 1024 * 1024;
const ALLOWED_TYPES = new Set(['image/jpeg', 'image/png', 'image/webp']);

function decodeBase64(value: string): Uint8Array {
  const binary = atob(value);
  return Uint8Array.from(binary, (char) => char.charCodeAt(0));
}

export async function onRequestPost({ request, env }: Context): Promise<Response> {
  const session = await requireAdmin(request, env);
  if (!session) return json({ success: false, error: 'Unauthorized.' }, 401);

  let body: { dataUrl?: string; filename?: string };
  try {
    body = (await request.json()) as { dataUrl?: string; filename?: string };
  } catch {
    return json({ success: false, error: 'Invalid JSON body.' }, 400);
  }

  const match = (body.dataUrl || '').match(/^data:(image\/(?:jpeg|png|webp));base64,([A-Za-z0-9+/=]+)$/);
  if (!match) return json({ success: false, error: 'فرمت تصویر باید JPEG، PNG یا WebP باشد.' }, 400);

  const mime = match[1];
  if (!ALLOWED_TYPES.has(mime)) return json({ success: false, error: 'نوع تصویر مجاز نیست.' }, 400);

  const bytes = decodeBase64(match[2]);
  if (bytes.byteLength > MAX_IMAGE_BYTES) {
    return json({ success: false, error: 'حجم تصویر پس از فشرده‌سازی باید کمتر از ۵ مگابایت باشد.' }, 413);
  }

  const extension = mime === 'image/jpeg' ? 'jpg' : mime.split('/')[1];
  const now = new Date();
  const folder = `${now.getUTCFullYear()}/${String(now.getUTCMonth() + 1).padStart(2, '0')}`;
  const safeName = (body.filename || 'image')
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
      { success: false, error: error instanceof Error ? error.message : 'بارگذاری تصویر ناموفق بود.' },
      503,
    );
  }
}
