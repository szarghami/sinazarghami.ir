import { getRepo, type Env } from './runtime';

const DEFAULT_TONE = `لحن سینا ضرغامی: صمیمی، دقیق و بی‌ادعا. جمله‌ها کوتاه و تصویری‌اند.
از کلمات پرطمطراق، کلیشه‌های تبلیغاتی و تعریف از خود پرهیز کن.
جزئیات فنی و حسی را کنار هم بگذار: نور، بافت، هوا، صدا و حس لحظه.
هرگز از عبارت‌هایی مثل «بهترین»، «بی‌نظیر» یا «شگفت‌انگیز» استفاده نکن.`;

let toneCache: { value: string; at: number } | null = null;
const TONE_CACHE_MS = 5 * 60 * 1000;

export async function getTone(env: Env): Promise<string> {
  if (toneCache && Date.now() - toneCache.at < TONE_CACHE_MS) return toneCache.value;
  const { repo, branch } = getRepo(env);
  try {
    const response = await fetch(
      `https://raw.githubusercontent.com/${repo}/${encodeURIComponent(branch)}/content/tone.md`,
      { headers: { 'User-Agent': 'sinazarghami-site' } },
    );
    if (response.ok) {
      const text = (await response.text()).trim();
      if (text) {
        toneCache = { value: text.slice(0, 4000), at: Date.now() };
        return toneCache.value;
      }
    }
  } catch {
    // Fall back to the built-in tone guide.
  }
  return DEFAULT_TONE;
}

export function getGeminiModel(env: Env): string {
  return env.GEMINI_MODEL || 'gemini-2.5-flash';
}

interface GeminiPart {
  text?: string;
  inlineData?: { mimeType: string; data: string };
}

interface GeminiOptions {
  system: string;
  parts: GeminiPart[];
  temperature?: number;
  json?: boolean;
}

export async function callGemini(env: Env, options: GeminiOptions): Promise<string> {
  if (!env.GEMINI_API_KEY) throw new Error('GEMINI_API_KEY is not configured.');
  const model = getGeminiModel(env);
  const response = await fetch(
    `https://generativelanguage.googleapis.com/v1beta/models/${encodeURIComponent(model)}:generateContent`,
    {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-goog-api-key': env.GEMINI_API_KEY,
      },
      body: JSON.stringify({
        systemInstruction: { parts: [{ text: options.system }] },
        contents: [{ role: 'user', parts: options.parts }],
        generationConfig: {
          temperature: options.temperature ?? 0.7,
          ...(options.json ? { responseMimeType: 'application/json' } : {}),
        },
      }),
    },
  );

  if (!response.ok) {
    const body = await response.text();
    throw new Error(`Gemini failed (${response.status}): ${body.slice(0, 300)}`);
  }

  const data = (await response.json()) as {
    candidates?: { content?: { parts?: { text?: string }[] } }[];
  };
  const text = data.candidates?.[0]?.content?.parts?.map((part) => part.text || '').join('') || '';
  if (!text.trim()) throw new Error('Gemini returned an empty response.');
  return text.trim();
}

export function parseJsonObject(text: string): Record<string, unknown> | null {
  const trimmed = text.trim().replace(/^```(?:json)?/i, '').replace(/```$/, '').trim();
  const start = trimmed.indexOf('{');
  const end = trimmed.lastIndexOf('}');
  if (start < 0 || end <= start) return null;
  try {
    const parsed = JSON.parse(trimmed.slice(start, end + 1));
    return parsed && typeof parsed === 'object' ? (parsed as Record<string, unknown>) : null;
  } catch {
    return null;
  }
}

const MAX_INLINE_BYTES = 5 * 1024 * 1024;

export async function imagePartFromDataUrl(
  dataUrl: string,
): Promise<{ mimeType: string; data: string } | null> {
  const match = dataUrl.match(/^data:(image\/(?:jpeg|jpg|png|webp));base64,([A-Za-z0-9+/=]+)$/);
  if (!match) return null;
  const mimeType = match[1] === 'image/jpg' ? 'image/jpeg' : match[1];
  const data = match[2];
  if (Math.floor((data.length * 3) / 4) > MAX_INLINE_BYTES) return null;
  return { mimeType, data };
}

export async function imagePartFromUrl(
  url: string,
): Promise<{ mimeType: string; data: string } | null> {
  try {
    const response = await fetch(url);
    if (!response.ok) return null;
    const mimeType = (response.headers.get('content-type') || '').split(';')[0].trim();
    if (!/^image\/(jpeg|png|webp)$/.test(mimeType)) return null;
    const buffer = new Uint8Array(await response.arrayBuffer());
    if (buffer.byteLength > MAX_INLINE_BYTES) return null;
    let binary = '';
    const chunk = 0x8000;
    for (let index = 0; index < buffer.length; index += chunk) {
      binary += String.fromCharCode(...buffer.subarray(index, index + chunk));
    }
    return { mimeType, data: btoa(binary) };
  } catch {
    return null;
  }
}
