import {
  callGemini,
  friendlyGeminiError,
  getTone,
  imagePartFromDataUrl,
  imagePartFromBytes,
  mimeFromPath,
  parseJsonObject,
} from '../_shared/ai';
import { getGitHubRaw, json, requireAdmin, type Env } from '../_shared/runtime';
import { getArvanConfig, keyFromPublicUrl, presignObject } from '../_shared/arvan';

interface Context {
  request: Request;
  env: Env;
}

const CATEGORIES = ['landscape', 'aerial', 'architecture', 'documentary', 'portrait'] as const;
const MAX_INLINE_BYTES = 5 * 1024 * 1024;

function pickString(value: unknown, max: number): string {
  return typeof value === 'string' ? value.trim().slice(0, max) : '';
}

type RemoteImage =
  | { ok: true; part: { mimeType: string; data: string } }
  | { ok: false; error: string; status: number };

/**
 * عکس را از یک آدرس خارجی (مثل آروان) می‌خواند و دلیل دقیق شکست را برمی‌گرداند.
 * قبلاً هر شکستی با پیام «حجم بیش از ۵ مگابایت» نمایش داده می‌شد که در صورت
 * نبودن دسترسی عمومی باکت، گمراه‌کننده بود.
 */
async function fetchRemoteImage(url: string): Promise<RemoteImage> {
  let response: Response;
  try {
    response = await fetch(url, { headers: { 'User-Agent': 'sinazarghami-site' } });
  } catch {
    return { ok: false, error: 'دریافت تصویر از منبع خارجی ناموفق بود.', status: 0 };
  }

  if (!response.ok) {
    const hint =
      response.status === 403
        ? ' دسترسی خواندن عمومی صندوقچه‌ی آروان (Bucket Policy با s3:GetObject) را فعال کنید.'
        : '';
    return {
      ok: false,
      error: `تصویر در منبع خارجی قابل خواندن نیست (${response.status}).${hint}`,
      status: response.status,
    };
  }

  const mimeType = (response.headers.get('content-type') || '').split(';')[0].trim().toLowerCase();
  if (!/^image\/(jpeg|png|webp)$/.test(mimeType)) {
    return {
      ok: false,
      error: `نوع فایل تصویر معتبر نیست (${mimeType || 'نامشخص'}).`,
      status: 415,
    };
  }

  const buffer = new Uint8Array(await response.arrayBuffer());
  if (buffer.byteLength > MAX_INLINE_BYTES) {
    return {
      ok: false,
      error: `حجم تصویر ${(buffer.byteLength / (1024 * 1024)).toFixed(1)} مگابایت است و بیش از حد ۵ مگابایت Gemini.`,
      status: 413,
    };
  }

  let binary = '';
  const chunk = 0x8000;
  for (let index = 0; index < buffer.length; index += chunk) {
    binary += String.fromCharCode(...buffer.subarray(index, index + chunk));
  }
  return { ok: true, part: { mimeType, data: btoa(binary) } };
}

export async function onRequestPost({ request, env }: Context): Promise<Response> {
  const session = await requireAdmin(request, env);
  if (!session) return json({ success: false, error: 'Unauthorized.' }, 401);

  let body: { imageBase64?: string; imageUrl?: string; titleHint?: string; descriptionHint?: string; categoryHint?: string; mode?: string; galleryImages?: string[]; galleryUrls?: string[] };
  try {
    body = (await request.json()) as typeof body;
  } catch {
    return json({ success: false, error: 'Invalid JSON body.' }, 400);
  }

  let image = body.imageBase64 ? await imagePartFromDataUrl(body.imageBase64) : null;
  if (body.imageBase64 && !image) {
    return json(
      { success: false, error: 'حجم تصویر بیش از ۵ مگابایت است یا فرمت آن پشتیبانی نمی‌شود.' },
      400,
    );
  }

  if (!image && body.imageUrl) {
    const url = body.imageUrl.trim();
    if (url.startsWith('/')) {
      // مسیر داخلی مثل /media/... از مخزن گیت‌هاب خوانده می‌شود
      const repoPath = `public${url}`.replace(/\/{2,}/g, '/');
      try {
        const raw = await getGitHubRaw(env, repoPath);
        if (raw) {
          image = imagePartFromBytes(raw.bytes, mimeFromPath(repoPath) || raw.mimeType);
        }
      } catch {
        image = null;
      }
      if (!image) {
        return json(
          { success: false, error: 'تصویر در مخزن گیت‌هاب پیدا نشد یا حجم آن بیش از ۵ مگابایت است.' },
          400,
        );
      }
    } else if (/^https?:\/\//i.test(url)) {
      // اگر فایل روی صندوقچه‌ی خودمان است، حتی وقتی عمومی نشده باشد با
      // درخواست امضاشده خوانده می‌شود تا تحلیل عکس هیچ‌وقت به تنظیمات
      // دسترسی صندوقچه وابسته نباشد.
      let target = url;
      const arvanConfig = getArvanConfig(env);
      const arvanKey = arvanConfig ? keyFromPublicUrl(arvanConfig, url) : null;
      if (arvanConfig && arvanKey) {
        target = await presignObject(arvanConfig, 'GET', arvanKey, {}, 300);
      }

      const remote = await fetchRemoteImage(target);
      if (!remote.ok) {
        return json({ success: false, error: remote.error }, remote.status === 403 ? 502 : 400);
      }
      image = remote.part;
    }
  }
  if (!image) {
    return json({ success: false, error: 'تصویر معتبری ارسال نشده است.' }, 400);
  }

  const tone = await getTone(env);
  const hint = pickString(body.titleHint, 200);

  const system = `تو دستیار محتوای وب‌سایت شخصی سینا ضرغامی هستی؛ عکاس، فیلمبردار و تورلیدر.
لحن نوشتاری او را دقیقاً رعایت کن:

${tone}

فقط یک شیء JSON معتبر برگردان و هیچ متن اضافه‌ای ننویس. کلیدها:
category (یکی از landscape, aerial, architecture, documentary, portrait)
categoryFa, titleFa, titleOptions (آرایه سه عنوان پیشنهادی فارسی), titleEn, locationFa, locationEn, descriptionFa, descriptionEn, camera, lens, tags (آرایه رشته)
titleFa حداکثر ۹ کلمه و descriptionFa بین ۲ تا ۴ جمله باشد. اگر مطمئن نیستی، حدس محتاطانه بزن و از ذکر جزئیات نادرست پرهیز کن.`;

  const prompt = `این تصاویر یک مجموعه هستند؛ همه را با هم بررسی کن.
دسته: ${pickString(body.categoryHint, 200)}
عنوان نوشته‌شده: ${hint}
توضیح نوشته‌شده: ${pickString(body.descriptionHint, 1200)}
${body.mode === 'title' ? 'عنوان مناسب پیشنهاد بده.' : body.mode === 'description' ? 'توضیح موجود را ویرایش کن یا با توجه به تصاویر و عنوان توضیح بنویس.' : 'برای مجموعه پیشنهاد بده.'}`;
  const extraImages = (await Promise.all((Array.isArray(body.galleryImages) ? body.galleryImages.slice(0, 4) : []).map(imagePartFromDataUrl))).filter((part): part is NonNullable<typeof part> => part !== null);
  for (const url of (Array.isArray(body.galleryUrls) ? body.galleryUrls : []).slice(0, 4 - extraImages.length)) {
    let extra: { mimeType: string; data: string } | null = null;
    if (url.startsWith('/media/') && !url.includes('..')) {
      const path = `public${url}`;
      const raw = await getGitHubRaw(env, path);
      if (raw) extra = imagePartFromBytes(raw.bytes, mimeFromPath(path) || raw.mimeType);
    } else {
      const config = getArvanConfig(env);
      const key = config ? keyFromPublicUrl(config, url) : null;
      if (config && key) {
        const remote = await fetchRemoteImage(await presignObject(config, 'GET', key, {}, 300));
        if (remote.ok) extra = remote.part;
      }
    }
    if (!extra) return json({ success: false, error: 'یکی از تصاویر ذخیره‌شده گالری قابل دریافت نیست؛ دوباره تلاش کنید.' }, 400);
    extraImages.push(extra);
  }

  try {
    const raw = await callGemini(env, {
      system,
      json: true,
      parts: [{ text: prompt }, { inlineData: image }, ...extraImages.map((inlineData) => ({ inlineData }))],
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
        titleOptions: Array.isArray(parsed.titleOptions) ? parsed.titleOptions.map((value) => pickString(value, 120)).filter(Boolean).slice(0, 3) : [],
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
        error: friendlyGeminiError(error),
      },
      502,
    );
  }
}
