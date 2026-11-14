import { callGemini, getTone, parseJsonObject } from './ai';
import type { Env } from './runtime';

type TextKind = 'title' | 'description';

interface FieldPair {
  fa: string;
  en: string;
  kind: TextKind;
}

interface CollectionRule {
  key: string;
  pairs: FieldPair[];
}

const COLLECTIONS: CollectionRule[] = [
  {
    key: 'photos',
    pairs: [
      { fa: 'titleFa', en: 'titleEn', kind: 'title' },
      { fa: 'descriptionFa', en: 'descriptionEn', kind: 'description' },
      { fa: 'locationFa', en: 'locationEn', kind: 'title' },
    ],
  },
  {
    key: 'expeditions',
    pairs: [
      { fa: 'titleFa', en: 'titleEn', kind: 'title' },
      { fa: 'descriptionFa', en: 'descriptionEn', kind: 'description' },
      { fa: 'locationFa', en: 'locationEn', kind: 'title' },
      { fa: 'seasonFa', en: 'seasonEn', kind: 'title' },
    ],
  },
  {
    key: 'software',
    pairs: [
      { fa: 'taglineFa', en: 'taglineEn', kind: 'title' },
      { fa: 'descriptionFa', en: 'descriptionEn', kind: 'description' },
    ],
  },
  {
    key: 'books',
    pairs: [
      { fa: 'titleFa', en: 'titleEn', kind: 'title' },
      { fa: 'subtitleFa', en: 'subtitleEn', kind: 'title' },
      { fa: 'descriptionFa', en: 'descriptionEn', kind: 'description' },
    ],
  },
  {
    key: 'articles',
    pairs: [
      { fa: 'titleFa', en: 'titleEn', kind: 'title' },
      { fa: 'summaryFa', en: 'summaryEn', kind: 'description' },
      { fa: 'contentFa', en: 'contentEn', kind: 'description' },
    ],
  },
  {
    key: 'resume',
    pairs: [
      { fa: 'titleFa', en: 'titleEn', kind: 'title' },
      { fa: 'organizationFa', en: 'organizationEn', kind: 'title' },
      { fa: 'descriptionFa', en: 'descriptionEn', kind: 'description' },
    ],
  },
  {
    key: 'commercialCategories',
    pairs: [{ fa: 'titleFa', en: 'titleEn', kind: 'title' }],
  },
  {
    key: 'homeCategoryCards',
    pairs: [
      { fa: 'titleFa', en: 'titleEn', kind: 'title' },
      { fa: 'subtitleFa', en: 'subtitleEn', kind: 'title' },
    ],
  },
];

const MAX_TRANSLATIONS = 12;
const CONCURRENCY = 3;

function text(value: unknown): string {
  return typeof value === 'string' ? value.trim() : '';
}

function withTimeout<T>(promise: Promise<T>, ms: number): Promise<T | null> {
  return Promise.race([
    promise,
    new Promise<null>((resolve) => setTimeout(() => resolve(null), ms)),
  ]);
}

async function translateOne(
  env: Env,
  tone: string,
  source: string,
  kind: TextKind,
  hint: string,
): Promise<string | null> {
  const system = `تو مترجم حرفه‌ای فارسی به انگلیسی برای سایت عکاسی سینا ضرغامی هستی.
ترجمه طبیعی، کوتاه و ادبی باشد؛ نه تحت‌اللفظی. لحن مرجع:

${tone}

فقط یک شیء JSON با کلید translatedText برگردان و هیچ متن اضافه‌ای ننویس.`;

  const prompt = `نوع متن: ${kind === 'title' ? 'عنوان' : 'توضیح'}${hint ? ` | دسته‌بندی: ${hint}` : ''}
متن فارسی:
${source}`;

  try {
    const raw = await withTimeout(
      callGemini(env, { system, json: true, temperature: 0.4, parts: [{ text: prompt }] }),
      8000,
    );
    if (!raw) return null;
    const parsed = parseJsonObject(raw);
    const value =
      typeof parsed?.translatedText === 'string' ? parsed.translatedText.trim() : raw.trim();
    return value || null;
  } catch {
    return null;
  }
}

async function runLimited<T>(items: T[], limit: number, worker: (item: T) => Promise<void>) {
  let cursor = 0;
  const runners = Array.from({ length: Math.min(limit, items.length) }, async () => {
    while (cursor < items.length) {
      const index = cursor;
      cursor += 1;
      await worker(items[index]);
    }
  });
  await Promise.all(runners);
}

export interface TranslationReport {
  translated: number;
  failed: number;
  pending: number;
}

/**
 * فیلدهای انگلیسی را با Gemini پر یا به‌روز می‌کند:
 * - فیلد انگلیسی خالی باشد.
 * - یا متن فارسی نسبت به نسخه‌ی منتشرشده‌ی قبلی عوض شده باشد (تشخیص با id).
 * خطا هرگز انتشار را متوقف نمی‌کند؛ فقط در گزارش شمرده می‌شود.
 */
export async function ensureEnglishFields(
  env: Env,
  content: Record<string, unknown>,
  previous?: Record<string, unknown> | null,
): Promise<TranslationReport> {
  if (!env.GEMINI_API_KEY) return { translated: 0, failed: 0, pending: 0 };

  interface Job {
    item: Record<string, unknown>;
    pair: FieldPair;
    source: string;
    hint: string;
  }

  const jobs: Job[] = [];
  let pending = 0;
  const previousById = new Map<string, Record<string, unknown>>();
  if (previous) {
    for (const rule of COLLECTIONS) {
      const collection = previous[rule.key];
      if (!Array.isArray(collection)) continue;
      for (const raw of collection) {
        if (!raw || typeof raw !== 'object') continue;
        const item = raw as Record<string, unknown>;
        const id = text(item.id);
        if (id) previousById.set(`${rule.key}:${id}`, item);
      }
    }
  }

  for (const rule of COLLECTIONS) {
    const collection = content[rule.key];
    if (!Array.isArray(collection)) continue;
    for (const raw of collection) {
      if (!raw || typeof raw !== 'object') continue;
      const item = raw as Record<string, unknown>;
      const hint = text(item.categoryFa) || text(item.category) || text(item.commercialCategory);
      const id = text(item.id);
      const before = id ? previousById.get(`${rule.key}:${id}`) : undefined;
      for (const pair of rule.pairs) {
        const source = text(item[pair.fa]);
        if (!source) continue;
        const changed = before ? text(before[pair.fa]) !== source : false;
        if (text(item[pair.en]) && !changed) continue;
        if (jobs.length >= MAX_TRANSLATIONS) {
          pending += 1;
          continue;
        }
        jobs.push({ item, pair, source, hint });
      }
    }
  }

  if (jobs.length === 0) return { translated: 0, failed: 0, pending };

  const tone = await getTone(env);
  let translated = 0;
  let failed = 0;

  await runLimited(jobs, CONCURRENCY, async (job) => {
    const value = await translateOne(env, tone, job.source, job.pair.kind, job.hint);
    if (value) {
      job.item[job.pair.en] = value;
      translated += 1;
    } else {
      failed += 1;
    }
  });

  return { translated, failed, pending };
}
