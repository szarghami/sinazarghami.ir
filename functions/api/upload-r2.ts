import { bodyJson, Env, json, PagesContext, requireAdmin } from './_shared/runtime';

interface UploadBody { dataUrl?: string; filename?: string }
const MAX_BYTES = 10 * 1024 * 1024;
const TYPES: Record<string, { ext: string; signature: number[] }> = {
  'image/jpeg': { ext: 'jpg', signature: [0xff, 0xd8, 0xff] },
  'image/png': { ext: 'png', signature: [0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a] },
  'image/webp': { ext: 'webp', signature: [0x52, 0x49, 0x46, 0x46] },
};

export const onRequestPost = async ({ request, env }: PagesContext<Env>) => {
  const denied = await requireAdmin(request, env);
  if (denied) return denied;
  const body = await bodyJson<UploadBody>(request);
  const match = body?.dataUrl?.match(/^data:(image\/(?:jpeg|png|webp));base64,([A-Za-z0-9+/=]+)$/);
  if (!match) return json({ error: 'فرمت تصویر پشتیبانی نمی‌شود.' }, 400);
  const [, type, encoded] = match;
  const spec = TYPES[type];
  let binary: string;
  try { binary = atob(encoded); } catch { return json({ error: 'فایل تصویر نامعتبر است.' }, 400); }
  if (binary.length === 0 || binary.length > MAX_BYTES) return json({ error: 'حداکثر حجم تصویر ۱۰ مگابایت است.' }, 413);
  const bytes = Uint8Array.from(binary, (char) => char.charCodeAt(0));
  if (!spec.signature.every((byte, index) => bytes[index] === byte)) return json({ error: 'محتوای فایل با نوع تصویر اعلام‌شده مطابقت ندارد.' }, 400);
  if (type === 'image/webp' && (binary.slice(8, 12) !== 'WEBP')) return json({ error: 'ساختار WebP نامعتبر است.' }, 400);
  if (!env.MEDIA_PUBLIC_URL) return json({ error: 'آدرس عمومی رسانه پیکربندی نشده است.' }, 503);
  const key = `images/${new Date().toISOString().slice(0, 10)}/${crypto.randomUUID()}.${spec.ext}`;
  await env.MEDIA.put(key, bytes, { httpMetadata: { contentType: type } });
  return json({ success: true, publicUrl: `${env.MEDIA_PUBLIC_URL.replace(/\/$/, '')}/${key}` });
};
