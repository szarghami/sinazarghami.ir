import { callGemini, friendlyGeminiError, getTone, parseJsonObject } from './_shared/ai';
import { json, requireAdmin, type Env } from './_shared/runtime';

interface Context {
  request: Request;
  env: Env;
}

const MAX_TEXT = 4000;

export async function onRequestPost({ request, env }: Context): Promise<Response> {
  const session = await requireAdmin(request, env);
  if (!session) return json({ success: false, error: 'Unauthorized.' }, 401);

  let body: { text?: string; type?: string; category?: string };
  try {
    body = (await request.json()) as typeof body;
  } catch {
    return json({ success: false, error: 'Invalid JSON body.' }, 400);
  }

  const text = (body.text || '').trim();
  if (!text) return json({ success: false, error: 'متن ورودی خالی است.' }, 400);
  if (text.length > MAX_TEXT) return json({ success: false, error: 'متن بیش از حد طولانی است.' }, 413);
  if (!env.GEMINI_API_KEY) {
    return json({ success: false, error: 'GEMINI_API_KEY در Cloudflare تنظیم نشده است.' }, 503);
  }

  const tone = await getTone(env);
  const kind = body.type === 'description' ? 'توضیح اثر' : body.type === 'tagline' ? 'شعار کوتاه' : 'عنوان اثر';
  const category = (body.category || '').trim().slice(0, 60);

  const system = `تو مترجم حرفه‌ای فارسی به انگلیسی برای وب‌سایت عکاسی سینا ضرغامی هستی.
ترجمه باید طبیعی، ادبی و کوتاه باشد؛ نه ترجمه تحت‌اللفظی. لحن مرجع:

${tone}

فقط یک شیء JSON با کلید translatedText برگردان.`;

  const prompt = `نوع متن: ${kind}${category ? ` | دسته‌بندی: ${category}` : ''}
متن فارسی:
${text}`;

  try {
    const raw = await callGemini(env, { system, json: true, temperature: 0.4, parts: [{ text: prompt }] });
    const parsed = parseJsonObject(raw);
    const translatedText =
      typeof parsed?.translatedText === 'string' ? parsed.translatedText.trim() : raw.trim();
    if (!translatedText) throw new Error('ترجمه خالی برگشت.');
    return json({ success: true, translatedText });
  } catch (error) {
    return json(
      { success: false, error: friendlyGeminiError(error) },
      502,
    );
  }
}
