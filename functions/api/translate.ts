import { bodyJson, Env, json, PagesContext, requireAdmin } from './_shared/runtime';

interface TranslateBody { text?: string; type?: 'title' | 'description' | 'tagline'; category?: string }

export const onRequestPost = async ({ request, env }: PagesContext<Env>) => {
  const denied = await requireAdmin(request, env);
  if (denied) return denied;
  const body = await bodyJson<TranslateBody>(request);
  if (typeof body?.text !== 'string' || !body.text.trim() || body.text.length > 5000) return json({ error: 'متن ورودی نامعتبر است.' }, 400);
  if (!env.GEMINI_API_KEY) return json({ error: 'کلید سرویس هوش مصنوعی تنظیم نشده است.' }, 503);
  const type = body.type || 'title';
  const prompt = `Translate the following Persian ${type} into polished, idiomatic English for a professional photography portfolio. Preserve meaning and proper names. ${body.category ? `Category: ${body.category}.` : ''}\nOutput only the final English translation, without quotes or commentary.\n\n${body.text.trim()}`;
  try {
    const upstream = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent?key=${encodeURIComponent(env.GEMINI_API_KEY)}`, {
      method: 'POST', headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ contents: [{ parts: [{ text: prompt }] }] }),
    });
    const data = await upstream.json() as { candidates?: Array<{ content?: { parts?: Array<{ text?: string }> } }> };
    if (!upstream.ok) return json({ error: 'سرویس ترجمه در دسترس نیست.' }, 502);
    const translatedText = data.candidates?.[0]?.content?.parts?.map((part) => part.text || '').join('').trim().replace(/^['"]|['"]$/g, '') || '';
    if (!translatedText) return json({ error: 'ترجمه‌ای از سرویس دریافت نشد.' }, 502);
    return json({ translatedText });
  } catch {
    return json({ error: 'خطا در ارتباط با سرویس ترجمه.' }, 502);
  }
};
