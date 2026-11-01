import { bodyJson, Env, json, PagesContext, requireAdmin } from '../_shared/runtime';

interface SuggestionBody { imageBase64?: string; imageUrl?: string; titleHint?: string }
const ALLOWED_IMAGE_HOSTS = new Set(['sinazarghami.ir', 'www.sinazarghami.ir', 'sinazarghami-aistudio-site.pages.dev', 'hvuguccbyyttxiyytsbk.supabase.co']);

function encodeBase64(bytes: Uint8Array): string {
  let binary = '';
  for (let start = 0; start < bytes.length; start += 0x8000) {
    binary += String.fromCharCode(...bytes.subarray(start, start + 0x8000));
  }
  return btoa(binary);
}

export const onRequestPost = async ({ request, env }: PagesContext<Env>) => {
  const denied = await requireAdmin(request, env);
  if (denied) return denied;
  const body = await bodyJson<SuggestionBody>(request);
  if (!env.GEMINI_API_KEY) return json({ success: false, error: 'کلید سرویس هوش مصنوعی تنظیم نشده است.' }, 503);
  let mimeType = '';
  let base64Data = '';
  if (typeof body?.imageBase64 === 'string') {
    const match = body.imageBase64.match(/^data:(image\/(?:jpeg|png|webp));base64,([A-Za-z0-9+/=]+)$/);
    if (!match || match[2].length > 12_000_000) return json({ success: false, error: 'تصویر نامعتبر یا بزرگ‌تر از حد مجاز است.' }, 400);
    mimeType = match[1];
    base64Data = match[2];
  } else if (typeof body?.imageUrl === 'string') {
    let imageUrl: URL;
    try { imageUrl = new URL(body.imageUrl); } catch { return json({ success: false, error: 'آدرس تصویر نامعتبر است.' }, 400); }
    const allowedHosts = new Set(ALLOWED_IMAGE_HOSTS);
    if (env.MEDIA_PUBLIC_URL) {
      try { allowedHosts.add(new URL(env.MEDIA_PUBLIC_URL).hostname.toLowerCase()); } catch { /* Ignore invalid optional configuration. */ }
    }
    if (imageUrl.protocol !== 'https:' || !allowedHosts.has(imageUrl.hostname.toLowerCase())) return json({ success: false, error: 'دامنه تصویر مجاز نیست.' }, 400);
    try {
      const image = await fetch(imageUrl, { signal: AbortSignal.timeout(10000) });
      if (!image.ok) return json({ success: false, error: 'دریافت تصویر ناموفق بود.' }, 400);
      const type = image.headers.get('Content-Type')?.split(';')[0] || '';
      if (!['image/jpeg', 'image/png', 'image/webp'].includes(type)) return json({ success: false, error: 'نوع تصویر پشتیبانی نمی‌شود.' }, 400);
      const bytes = await image.arrayBuffer();
      if (bytes.byteLength > 8 * 1024 * 1024) return json({ success: false, error: 'حجم تصویر بیش از حد مجاز است.' }, 413);
      mimeType = type;
      base64Data = encodeBase64(new Uint8Array(bytes));
    } catch { return json({ success: false, error: 'دریافت تصویر ناموفق بود.' }, 400); }
  } else {
    return json({ success: false, error: 'تصویر لازم است.' }, 400);
  }

  const prompt = `Analyze this photograph for a professional Iranian photography portfolio. ${body.titleHint ? `Title hint: ${body.titleHint}.` : ''} Return only valid JSON with keys titleFa, titleEn, category (one of landscape, aerial, architecture, documentary, portrait), locationFa, locationEn, descriptionFa, descriptionEn, camera, lens, suggestedPriceToman, suggestedPriceUsd. Do not invent specific camera or lens models; use empty strings if unknown.`;
  try {
    const upstream = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent?key=${encodeURIComponent(env.GEMINI_API_KEY)}`, {
      method: 'POST', headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ contents: [{ parts: [{ text: prompt }, { inline_data: { mime_type: mimeType, data: base64Data } }] }], generationConfig: { responseMimeType: 'application/json' } }),
    });
    const data = await upstream.json() as { candidates?: Array<{ content?: { parts?: Array<{ text?: string }> } }> };
    if (!upstream.ok) return json({ success: false, error: 'سرویس تحلیل تصویر در دسترس نیست.' }, 502);
    const output = data.candidates?.[0]?.content?.parts?.map((part) => part.text || '').join('').trim();
    if (!output) return json({ success: false, error: 'پاسخی از سرویس تحلیل دریافت نشد.' }, 502);
    let suggestion: unknown;
    try { suggestion = JSON.parse(output); } catch { return json({ success: false, error: 'پاسخ سرویس قابل پردازش نیست.' }, 502); }
    return json({ success: true, suggestion });
  } catch {
    return json({ success: false, error: 'خطا در ارتباط با سرویس تحلیل تصویر.' }, 502);
  }
};
