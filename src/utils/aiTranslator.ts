// =====================================================================
// ماژول ترجمه هنری و تحلیل عکس با هوش مصنوعی جمینای (Client-side Gemini API)
// اجرای ۱۰۰٪ مستقیم در مرورگر با مدل gemini-2.5-flash بدون نیاز به سرور
// =====================================================================

import { GoogleGenAI } from '@google/genai';
import { AiPhotoSuggestion, SpecificPhotoCategory } from '../types';
import { getSessionVault } from './cryptoVault';

export const STORAGE_KEY_GEMINI_KEY = 'sina_gemini_api_key';

/**
 * دریافت کلید فعال جمینای (اولویت با گاوصندوق سشن امن > localStorage)
 */
export function getActiveGeminiKey(explicitKey?: string): string {
  if (explicitKey && explicitKey.trim()) return explicitKey.trim();
  const sessionVault = getSessionVault();
  if (sessionVault && sessionVault.geminiApiKey) {
    return sessionVault.geminiApiKey.trim();
  }
  if (typeof window !== 'undefined') {
    return localStorage.getItem(STORAGE_KEY_GEMINI_KEY) || '';
  }
  return '';
}

export function saveLocalGeminiKey(key: string): void {
  if (typeof window === 'undefined') return;
  localStorage.setItem(STORAGE_KEY_GEMINI_KEY, key.trim());
}

// واژه‌نامه تخصصی اصطلاحات عکاسی، طبیعت و اقلیم‌های ایران جهت ترجمه فاخر (Fallback Engine)
const EDITORIAL_DICTIONARY: Record<string, string> = {
  کلوت: 'Kaluts (Wind-Sculpted Megastructures)',
  کلوت‌ها: 'Kaluts',
  'کویر لوت': 'Lut Desert',
  شفق: 'Twilight Glow',
  غروب: 'Dusk / Sunset',
  طلوع: 'Dawn / Sunrise',
  سکوت: 'Silence & Solitude',
  تلاقی: 'Confluence',
  امواج: 'Tides & Swells',
  فیروزه‌ای: 'Turquoise / Cerulean',
  هرمز: 'Hormuz Rainbow Island',
  قشم: 'Qeshm Island',
  دماوند: 'Mount Damavand',
  البرز: 'Alborz Alpine Range',
  هیرکانی: 'Ancient Hyrcanian Forest',
  معماری: 'Architectural Geometry',
  مستند: 'Documentary Storytelling',
  پرتره: 'Intimate Portraiture',
  'هلی‌شات': 'Aerial Cinematography',
  پهپاد: 'Drone Perspective',
  سازه‌ها: 'Structural Forms',
  زاگرس: 'Zagros Range',
  کرمان: 'Kerman',
  یزد: 'Yazd',
  اصفهان: 'Isfahan',
  شیراز: 'Shiraz',
  ریگ: 'Megadunes',
  'ریگ یلان': 'Rig Yalan Megadunes',
  شهداد: 'Shahdad',
};

/**
 * ترجمه هنری و ادبی عنوان، توضیحات یا شعار با Gemini 2.5 Flash در مرورگر
 */
export async function translateToArtisticEnglish(
  persianText: string,
  type: 'title' | 'description' | 'tagline' = 'title',
  category?: string,
  providedApiKey?: string
): Promise<string> {
  const trimmed = persianText.trim();
  if (!trimmed) return '';

  // اگر متن از قبل تماماً انگلیسی باشد
  if (/^[a-zA-Z0-9\s.,'":-]+$/.test(trimmed)) {
    return trimmed;
  }

  const apiKey = getActiveGeminiKey(providedApiKey);

  // ۱. در صورت وجود کلید جمینای: فراخوانی مستقیم GoogleGenAI در مرورگر
  if (apiKey) {
    try {
      const ai = new GoogleGenAI({ apiKey });
      const prompt = `You are an elite fine-art photography curator, poet, and editorial writer for Sina Zarghami's official portfolio.
Translate and elevate the following Persian ${type} (Category: ${category || 'Fine Art Photography'}) into evocative, sophisticated, gallery-grade English.
Ensure the English captures the mood, optical nuance, and atmosphere of Iran's landscapes and art.
Persian input: "${trimmed}"
Rules:
- Return ONLY the translated English text.
- Do NOT include quotes, explanations, prefixes, or markdown formatting.`;

      const response = await ai.models.generateContent({
        model: 'gemini-2.5-flash',
        contents: prompt,
      });

      const text = response.text?.trim();
      if (text) {
        return text.replace(/^["']|["']$/g, '');
      }
    } catch (err) {
      console.warn('Gemini direct API error, using dictionary fallback:', err);
    }
  }

  // ۲. در صورت نبود کلید یا خطای شبکه: استفاده از واژه‌نامه ادبی داخلی (Offline Fallback)
  if (trimmed.includes('سکوت') && trimmed.includes('لوت')) {
    return 'Silence of Horizons: Twilight Shadows Across the Lut Desert';
  }
  if (trimmed.includes('کلوت') && (trimmed.includes('غروب') || trimmed.includes('شفق'))) {
    return 'Sculpted by Winds: Twilight Over the Shahdad Kaluts';
  }
  if (trimmed.includes('هرمز') || trimmed.includes('سرخ')) {
    return 'Chromas of the South: Red Ochre Coastlines of Hormuz';
  }
  if (trimmed.includes('دماوند')) {
    return 'Apex of Solitude: Alpine Dawn on Mount Damavand';
  }
  if (trimmed.includes('معماری') || trimmed.includes('هندسه')) {
    return 'Chiaroscuro & Form: Geometric Light in Contemporary Architecture';
  }
  if (trimmed.includes('مستند') || trimmed.includes('بازار') || trimmed.includes('پیرمرد')) {
    return 'Echoes of Heritage: Documentary Portrait in Traditional Bazaars';
  }
  if (trimmed.includes('هیرکانی') || trimmed.includes('جنگل')) {
    return 'Canopy of Clouds: Misty Mornings in the Ancient Hyrcanian Forest';
  }
  if (trimmed.includes('کفش') || trimmed.includes('چرم')) {
    return 'Handcrafted Leather Heritage: Commercial Footwear Photography';
  }
  if (trimmed.includes('جواهر') || trimmed.includes('طلا')) {
    return 'Prismatic Reflections: Haute Joaillerie & Gemological Still Life';
  }

  // نگارش عمومی بر پایه کلمات کلیدی
  const words = trimmed.split(/\s+/);
  const translatedWords: string[] = [];

  for (const word of words) {
    const cleanWord = word.replace(/[،.؛:؟!]/g, '');
    if (EDITORIAL_DICTIONARY[cleanWord]) {
      translatedWords.push(EDITORIAL_DICTIONARY[cleanWord]);
    } else {
      translatedWords.push(word);
    }
  }

  if (type === 'title') {
    return `Vistas of ${trimmed.slice(0, 32)}: An Exploration`;
  }
  return `A visual documentation and narrative by Sina Zarghami focusing on ${trimmed.slice(0, 40)}.`;
}

/**
 * تحلیل تصویر و پیشنهاد خودکار عنوان، لوکیشن، دوربین و کپشن با Gemini 2.5 Flash در مرورگر
 */
export async function suggestPhotoDetailsDirect(
  imageSource: string,
  providedApiKey?: string
): Promise<AiPhotoSuggestion> {
  const apiKey = getActiveGeminiKey(providedApiKey);

  if (!apiKey) {
    throw new Error('کلید Gemini API در گاوصندوق یا تنظیمات ثبت نشده است. لطفاً در تب تنظیمات استودیو کلید خود را وارد کنید.');
  }

  const ai = new GoogleGenAI({ apiKey });

  const promptText = `You are analyzing a photograph taken by Iranian fine-art photographer Sina Zarghami.
Return a STRICT JSON object with these exact keys:
- "titleFa": Poetic and evocative Persian title (max 7 words)
- "titleEn": Sophisticated English gallery title
- "category": One of "landscape", "aerial", "architecture", "documentary", "portrait"
- "categoryFa": Persian translation of category
- "locationFa": Plausible location in Iran (e.g. کویر لوت، کرمان or جزیره هرمز)
- "locationEn": English location
- "descriptionFa": Rich, 2-sentence Persian description highlighting composition and light
- "descriptionEn": Editorial English description
- "camera": Suggested gear (e.g. Canon R8 or Mavic Mini 3 Pro)
- "lens": Suggested lens (e.g. Canon EF 50mm f/1.8 or RF 24-50mm)
- "suggestedPriceToman": Number between 2500000 and 4500000
- "suggestedPriceUsd": Number between 40 and 75
- "tags": Array of 5 Persian hashtag keywords (without # symbol)

Return ONLY valid JSON. No markdown backticks, no explanatory text.`;

  let contents: any[] = [];

  // بررسی فرمت تصویر (Data URL یا Base64)
  const dataUrlMatch = imageSource.match(/^data:([^;]+);base64,(.+)$/);
  if (dataUrlMatch) {
    const mimeType = dataUrlMatch[1];
    const base64Data = dataUrlMatch[2];
    contents = [
      {
        inlineData: {
          mimeType,
          data: base64Data,
        },
      },
      promptText,
    ];
  } else {
    // در صورتی که فقط متن یا لینک باشد
    contents = [promptText];
  }

  const response = await ai.models.generateContent({
    model: 'gemini-2.5-flash',
    contents,
  });

  const responseText = response.text || '';
  const cleanJson = responseText
    .replace(/^```json\s*/i, '')
    .replace(/^```\s*/i, '')
    .replace(/```$/i, '')
    .trim();

  try {
    const parsed = JSON.parse(cleanJson);
    return {
      titleFa: parsed.titleFa || 'سکوت افق‌ها در کویر',
      titleEn: parsed.titleEn || 'Silence of Horizons in the Desert',
      category: (parsed.category as any) || 'landscape',
      categoryFa: parsed.categoryFa || 'چشم‌انداز و کویر',
      locationFa: parsed.locationFa || 'کویر لوت، کرمان',
      locationEn: parsed.locationEn || 'Lut Desert, Kerman',
      descriptionFa: parsed.descriptionFa || 'روایتی از خطوط هندسی ماسه‌ها و سایه‌روشن غروب در قلب بیابان.',
      descriptionEn: parsed.descriptionEn || 'A narrative of geometric sandlines and twilight shadows in the heart of the desert.',
      camera: parsed.camera || 'Canon R8',
      lens: parsed.lens || 'Canon EF 50mm f/1.8',
      suggestedPriceToman: Number(parsed.suggestedPriceToman) || 2800000,
      suggestedPriceUsd: Number(parsed.suggestedPriceUsd) || 45,
      tags: Array.isArray(parsed.tags) ? parsed.tags : ['عکاسی_فاین_آرت', 'ایران_زیبا', 'کویر_لوت'],
    };
  } catch (parseErr) {
    throw new Error('پاسخ هوش مصنوعی در قالب استاندارد JSON دریافت نشد. لطفاً دوباره تلاش کنید.');
  }
}
