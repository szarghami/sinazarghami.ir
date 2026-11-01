import { Env, json, migrateEmbeddedImages, PagesContext, requireAdmin } from './_shared/runtime';

const MAX_CONTENT_BYTES = 5 * 1024 * 1024;
const CONTENT_KEY = 'site-content';

export const onRequestGet = async ({ request, env, next }: PagesContext<Env>) => {
  const row = await env.DB.prepare('SELECT value FROM app_state WHERE key = ?').bind(CONTENT_KEY).first<{ value: string }>();
  if (row) {
    try { return new Response(row.value, { headers: { 'Content-Type': 'application/json; charset=utf-8', 'Cache-Control': 'no-store' } }); }
    catch { return json({ error: 'محتوای ذخیره‌شده نامعتبر است.' }, 500); }
  }
  const assetUrl = new URL(request.url);
  assetUrl.pathname = '/site-data.json';
  assetUrl.search = '';
  const asset = await next(new Request(assetUrl, { method: 'GET', headers: request.headers }));
  if (!asset.ok) return json({ error: 'محتوای سایت هنوز در پایگاه داده مقداردهی نشده است.' }, 503);
  return asset;
};

export const onRequestPost = async ({ request, env }: PagesContext<Env>) => {
  const denied = await requireAdmin(request, env);
  if (denied) return denied;
  const declaredLength = Number(request.headers.get('Content-Length') || 0);
  if (declaredLength > MAX_CONTENT_BYTES) return json({ error: 'حجم داده بیش از حد مجاز است.' }, 413);
  const raw = await request.text();
  if (new TextEncoder().encode(raw).byteLength > MAX_CONTENT_BYTES) return json({ error: 'حجم داده بیش از حد مجاز است.' }, 413);
  let content: Record<string, unknown>;
  try { content = JSON.parse(raw); } catch { return json({ error: 'ساختار JSON نامعتبر است.' }, 400); }
  if (!content || typeof content !== 'object' || !content.profile || typeof content.profile !== 'object') {
    return json({ error: 'ساختار محتوای سایت نامعتبر است.' }, 400);
  }
  let normalized: Record<string, unknown>;
  try {
    normalized = await migrateEmbeddedImages(content, env) as Record<string, unknown>;
  } catch (error) {
    console.error('Site content image migration failed:', error);
    return json({ error: 'تبدیل تصویرهای قدیمی به فضای رسانه ناموفق بود؛ تنظیمات R2 را بررسی کنید.' }, 503);
  }
  await env.DB.prepare('INSERT INTO app_state (key, value, updated_at) VALUES (?, ?, CURRENT_TIMESTAMP) ON CONFLICT(key) DO UPDATE SET value = excluded.value, updated_at = CURRENT_TIMESTAMP')
    .bind(CONTENT_KEY, JSON.stringify(normalized)).run();
  return json({ success: true, content: normalized });
};
