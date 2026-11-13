import {
  callGemini,
  getTone,
  imagePartFromDataUrl,
  imagePartFromUrl,
  parseJsonObject,
} from '../_shared/ai';
import { json, requireAdmin, type Env } from '../_shared/runtime';

interface Context {
  request: Request;
  env: Env;
}

const CATEGORIES = ['landscape', 'aerial', 'architecture', 'documentary', 'portrait'] as const;

function pickString(value: unknown, max: number): string {
  return typeof value === 'string' ? value.trim().slice(0, max) : '';
}

export async function onRequestPost({ request, env }: Context): Promise<Response> {
  const session = await requireAdmin(request, env);
  if (!session) return json({ success: false, error: 'Unauthorized.' }, 401);
  if (!env.GEMINI_API_KEY) {
    return json({ success: false, error: 'GEMINI_API_KEY در Cloudflare تنظیم نشده است.' }, 503);
  }

  let body: { imageBase64?: string; imageUrl?: string; titleHint?: string };
  try {
    body = (await request.json()) as typeof body;
  } catch {
    return json({ success: false, error: 'Invalid JSON body.' }, 400);
  }

  let image = body.imageBase64 ? await imagePartFromDataUrl(body.imageBase64) : null;
  if (!image && body.imageUrl) {
    const url = body.imageUrl.startsWith('/')
      ? `${(env.SITE_URL || 'https://sinazarghami.ir').replace(/\/$/, '')}${body.imageUrl}`
      : body.imageUrl;
    image = await imagePartFromUrl(url);
  }
  if (!image) {
    return json(
      { success: false, error: 'تصویر معتبر نیست یا حجم آن بیش از ۵ مگابایت است.' },
      400,
    );
  }

  const tone = await getTone(env);
  const hint = pickString(body.titleHint, 200);

  const system = `تو دستیار محتوای وب‌سایت شخصی سینا ضرغامی هستی؛ عکاس، فیلمبردار و تورلیدر.
لحن نوشتاری او را دقیقاً رعایت کن:

${tone}

فقط یک شیء JSON معتبر برگردان و هیچ متن اضافه‌ای ننویس. کلیدها:
category (یکی از landscape, aerial, architecture, documentary, portrait)
categoryFa, titleFa, titleEn, locationFa, locationEn, descriptionFa, descriptionEn, camera, lens, tags (آرایه رشته)
titleFa حداکثر ۹ کلمه و descriptionFa بین ۲ تا ۴ جمله باشد. اگر مطمئن نیستی، حدس محتاطانه بزن و از ذکر جزئیات نادرست پرهیز کن.`;

  const prompt = hint
    ? `این تصویر را تحلیل کن. راهنمای عنوان از خود عکاس: «${hint}»`
    : 'این تصویر را تحلیل کن و پیشنهاد مناسب بده.';

  try {
    const raw = await callGemini(env, {
      system,
      json: true,
      parts: [{ text: prompt }, { inlineData: image }],
    });
    const parsed = parseJsonObject(raw);
    if (!parsed) throw new Error('پاسخ هوش مصنوعی قابل خواندن نبود.');

    const category = CATEGORIES.includes(parsed.category as (typeof CATEGORIES)[number])
      ? (parsed.category as (typeof CATEGORIES)[number])
      : 'landscape';
    const tags = Array.isArray(parsed.tags)
      ? parsed.tags.map((tag) => pickString(tag, 40)).filter(Boolean).slice(0, 8)
      : [];

    return json({
      success: true,
      suggestion: {
        category,
        categoryFa: pickString(parsed.categoryFa, 60),
        titleFa: pickString(parsed.titleFa, 120),
        titleEn: pickString(parsed.titleEn, 160),
        locationFa: pickString(parsed.locationFa, 120),
        locationEn: pickString(parsed.locationEn, 160),
        descriptionFa: pickString(parsed.descriptionFa, 900),
        descriptionEn: pickString(parsed.descriptionEn, 1200),
        camera: pickString(parsed.camera, 80),
        lens: pickString(parsed.lens, 80),
        suggestedPriceToman: 0,
        suggestedPriceUsd: 0,
        tags,
      },
    });
  } catch (error) {
    return json(
      {
        success: false,
        error: error instanceof Error ? error.message : 'تحلیل تصویر ناموفق بود.',
      },
      502,
    );
  }
}
