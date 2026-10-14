import express from 'express';
import path from 'path';
import fs from 'fs';
import { fileURLToPath } from 'url';
import dotenv from 'dotenv';
import { GoogleGenAI } from '@google/genai';

dotenv.config();

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
const PORT = 3000;

app.use(express.json({ limit: '50mb' }));

// مسیرهای ذخیره‌سازی داده‌ها
const DATA_FILE = path.join(__dirname, 'site-data.json');
const PASSCODE_FILE = path.join(__dirname, 'admin-passcode.json');
const ANALYTICS_FILE = path.join(__dirname, 'analytics-data.json');
const PUBLIC_DIR = path.join(__dirname, 'public');
const DEFAULT_PASSCODE = 'sina2026';

// توکن و چت‌آیدی تلگرام سینا ضرغامی جهت ارسال خودکار اعلانات
const TELEGRAM_BOT_TOKEN = '8961351294:AAGqsMYUXBFS38uhdMvJjwnRh1FbxGdRGkQ';
const SINA_CHAT_ID = '86050350';

async function sendTelegramMessage(text: string): Promise<boolean> {
  try {
    const res = await fetch(`https://api.telegram.org/bot${TELEGRAM_BOT_TOKEN}/sendMessage`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        chat_id: SINA_CHAT_ID,
        text,
        parse_mode: 'HTML',
      }),
    });
    const data = await res.json();
    return data.ok === true;
  } catch (err) {
    console.warn('Telegram notification failed:', err);
    return false;
  }
}

// مقداردهی هوش مصنوعی جمینای
const apiKey = process.env.GEMINI_API_KEY || '';
const ai = new GoogleGenAI(apiKey ? { apiKey } : {});

// =========================================================================
// ۱. پروکسی امن تصاویر (حل قطعی مشکل بارگذاری عکس‌ها در مرورگر Edge و اینترنت ایران)
// =========================================================================
app.get('/api/image-proxy', async (req, res) => {
  try {
    const imageUrl = req.query.url as string;
    if (!imageUrl) {
      return res.status(400).send('آدرس تصویر ارسال نشده است.');
    }

    // هدایت درخواست از سرور کلود جهت دور زدن محدودیت‌های منطقه‌ای و آنتی‌ترکینگ Edge
    const response = await fetch(imageUrl, {
      headers: {
        'User-Agent':
          'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0.0.0 Safari/537.36 Edg/124.0.0.0',
        Accept: 'image/avif,image/webp,image/apng,image/svg+xml,image/*,*/*;q=0.8',
      },
    });

    if (!response.ok) {
      return res.status(response.status).send('خطا در دریافت تصویر از سرور مبدا.');
    }

    const contentType = response.headers.get('content-type') || 'image/jpeg';
    const buffer = await response.arrayBuffer();

    res.setHeader('Content-Type', contentType);
    res.setHeader('Cache-Control', 'public, max-age=31536000, immutable');
    res.setHeader('Access-Control-Allow-Origin', '*');
    return res.send(Buffer.from(buffer));
  } catch (err: any) {
    console.error('Image proxy error:', err);
    return res.status(500).send('خطا در پروکسی تصویر: ' + err.message);
  }
});

// =========================================================================
// ۲. آپلود محلی و ذخیره دائمی تصویر روی سرور (جایگزین مستقل و امن برای Supabase)
// =========================================================================
app.post('/api/upload-local', (req, res) => {
  try {
    const { dataUrl, filename } = req.body;
    if (!dataUrl || typeof dataUrl !== 'string') {
      return res.status(400).json({ error: 'داده تصویر معتبر نیست.' });
    }

    const uploadsDir = path.join(PUBLIC_DIR, 'uploads');
    if (!fs.existsSync(uploadsDir)) {
      fs.mkdirSync(uploadsDir, { recursive: true });
    }

    const matches = dataUrl.match(/^data:([A-Za-z-+\/]+);base64,(.+)$/);
    if (!matches || matches.length !== 3) {
      return res.status(400).json({ error: 'فرمت DataURL نامعتبر است.' });
    }

    const mime = matches[1];
    const ext = mime.includes('webp') ? 'webp' : mime.includes('png') ? 'png' : 'jpg';
    const cleanName = `${(filename || 'photo_' + Date.now()).replace(/[^a-zA-Z0-9_-]/g, '_')}.${ext}`;
    const filePath = path.join(uploadsDir, cleanName);

    fs.writeFileSync(filePath, Buffer.from(matches[2], 'base64'));

    return res.json({
      success: true,
      publicUrl: `/uploads/${cleanName}`,
      sizeKB: Math.round(matches[2].length * 0.75 / 1024),
    });
  } catch (err: any) {
    return res.status(500).json({ error: err.message });
  }
});

// =========================================================================
// ۳. هوش مصنوعی جمینای: تحلیل بصری عکس و پیشنهاد عنوان، دسته‌بندی و داستان
// =========================================================================
app.post('/api/gemini/suggest-photo-details', async (req, res) => {
  try {
    const { imageBase64, imageUrl, titleHint } = req.body;

    if (!process.env.GEMINI_API_KEY) {
      return res.status(503).json({ error: 'GEMINI_API_KEY تنظیم نشده است.' });
    }

    let mimeType = 'image/jpeg';
    let base64Data = '';

    if (imageBase64 && typeof imageBase64 === 'string') {
      const parts = imageBase64.split(';base64,');
      if (parts.length === 2) {
        mimeType = parts[0].replace('data:', '') || 'image/jpeg';
        base64Data = parts[1];
      } else {
        base64Data = imageBase64;
      }
    } else if (imageUrl && typeof imageUrl === 'string') {
      try {
        const imgRes = await fetch(imageUrl);
        const arrayBuf = await imgRes.arrayBuffer();
        mimeType = imgRes.headers.get('content-type') || 'image/jpeg';
        base64Data = Buffer.from(arrayBuf).toString('base64');
      } catch {
        // Fallback without image payload
      }
    }

    const promptText = `
You are the senior art director and monograph curator for Sina Zarghami (sinazarghami.ir).
Sina is an accomplished Iranian fine-art landscape, hyper-macro, and documentary photographer, filmmaker, and expedition leader.

Your task is to analyze the provided photograph and generate evocative, museum-quality titles, categorization, and narrative storytelling in both Persian and artistic English.

${titleHint ? `User initial note/hint: "${titleHint}"` : ''}

REQUIREMENTS:
1. Category must be one of: "landscape", "portrait", "architecture", "aerial", "documentary".
2. Persian title (titleFa): Poetic, authentic, deeply rooted in Iranian culture or landscape (e.g. سکوت صخره‌های زاگرس, معماری میکرومتری چشم سنجاقک, امواج فیروزه‌ای خلیج فارس).
3. English title (titleEn): Evocative, gallery-grade English (e.g. "Silence of Zagros Horizons", "Microscopic Symmetries of the Odonata Eye").
4. Category label in Persian (categoryFa): e.g. "منظره و طبیعت", "هایپرمکرو حشرات", "دید هوایی", "پرتره و کاراکتر".
5. Location (locationFa & locationEn): Infer or suggest authentic Iranian landscape or setting.
6. Persian Description (descriptionFa): 2-3 poetic, informative sentences explaining the lighting, emotional depth, mood, and photographic vision.
7. English Description (descriptionEn): Museum wall-label style English monograph text.
8. Equipment Guess: Camera (e.g. Canon R8, GoPro Max 360, Canon 70D, iPhone 13 Pro Max) and Lens (e.g. Canon EF 50mm f/1.8, EF-S 18–55mm, Reverse Macro Ring, RF 24–50mm).
9. Suggested Price: suggestedPriceToman (between 1,800,000 to 4,500,000) and suggestedPriceUsd (between 30 to 70).
10. Tags: 3 to 6 keywords.

OUTPUT FORMAT: Strict JSON only, no markdown wrapping, no codeblock backticks:
{
  "category": "landscape",
  "categoryFa": "چشم‌انداز و کویر",
  "titleFa": "...",
  "titleEn": "...",
  "locationFa": "...",
  "locationEn": "...",
  "descriptionFa": "...",
  "descriptionEn": "...",
  "camera": "Canon R8",
  "lens": "Canon EF 50mm f/1.8",
  "suggestedPriceToman": 2800000,
  "suggestedPriceUsd": 45,
  "tags": ["کویر لوت", "عکاسی فاین‌آرت", "غروب آفتاب"]
}
`.trim();

    let contents: any;
    if (base64Data) {
      contents = [
        {
          role: 'user',
          parts: [
            { text: promptText },
            {
              inlineData: {
                mimeType: mimeType.includes('png') ? 'image/png' : mimeType.includes('webp') ? 'image/webp' : 'image/jpeg',
                data: base64Data,
              },
            },
          ],
        },
      ];
    } else {
      contents = promptText;
    }

    const response = await ai.models.generateContent({
      model: 'gemini-3.8-flash',
      contents,
    });

    const rawText = response.text || '';
    const cleanJson = rawText.replace(/```json/g, '').replace(/```/g, '').trim();
    const parsed = JSON.parse(cleanJson);

    return res.json({ success: true, suggestion: parsed });
  } catch (err: any) {
    console.error('Gemini vision suggestion error:', err);
    return res.status(500).json({ error: err.message || 'خطا در پردازش تصویر با هوش مصنوعی' });
  }
});

// =========================================================================
// ۴. ترجمه ادبی و هنری با Gemini
// =========================================================================
app.post('/api/translate', async (req, res) => {
  try {
    const { text, type, category } = req.body;
    if (!text || typeof text !== 'string') {
      return res.status(400).json({ error: 'متن فارسی الزامی است' });
    }

    if (!process.env.GEMINI_API_KEY) {
      return res.status(503).json({ error: 'GEMINI_API_KEY روی سرور تنظیم نشده است' });
    }

    const prompt = `You are a world-class bilingual literary editor and art curator specializing in fine-art photography monographs and modern tech architecture for Sina Zarghami.
Translate the following Persian text into evocative, museum-grade, natural English.
- DO NOT provide word-by-word mechanical translation.
- For photography titles: craft poetic, atmospheric English reflecting light, shadow, texture, and silence.
- For descriptions: craft curator-grade text.
Target context: ${type || 'title'} (${category || 'general'})
Persian source: "${text.trim()}"

OUTPUT ONLY the final English translation. Do NOT wrap in quotes, do NOT add notes.`;

    const response = await ai.models.generateContent({
      model: 'gemini-3.8-flash',
      contents: prompt,
    });

    const translatedText = response.text ? response.text.trim().replace(/^["']|["']$/g, '') : '';
    return res.json({ translatedText });
  } catch (err: any) {
    return res.status(500).json({ error: err.message || 'خطا در پردازش ترجمه' });
  }
});

// =========================================================================
// ۵. ثبت آمار و رفتار کاربران (Analytics, Device, Browser, Abandoned Checkouts)
// =========================================================================
function readAnalyticsEvents(): any[] {
  try {
    if (fs.existsSync(ANALYTICS_FILE)) {
      return JSON.parse(fs.readFileSync(ANALYTICS_FILE, 'utf-8'));
    }
  } catch {
    // Ignore read error
  }
  return [];
}

function writeAnalyticsEvents(events: any[]) {
  try {
    // حداکثر ۳۰۰۰ رویداد آخر را نگه می‌داریم تا کارایی همواره بالا بماند
    const trimmed = events.slice(-3000);
    fs.writeFileSync(ANALYTICS_FILE, JSON.stringify(trimmed, null, 2), 'utf-8');
  } catch (err) {
    console.warn('Error saving analytics:', err);
  }
}

app.post('/api/analytics/event', async (req, res) => {
  try {
    const event = req.body;
    if (!event || !event.eventType) {
      return res.status(400).json({ error: 'رویداد نامعتبر است' });
    }

    const events = readAnalyticsEvents();
    events.push(event);
    writeAnalyticsEvents(events);

    // در صورت رها شدن خرید در نیمه‌راه یا ثبت سفارش، بلافاصله به تلگرام سینا هشدار فرستاده شود
    if (event.eventType === 'abandon_checkout') {
      const msg = `
⚠️ <b>هشدار رها کردن خرید در وب‌سایت!</b>
مشتری پنجره خرید را باز کرده ولی سفارش را نهایی نکرده است:

• <b>اثر مشاهده‌شده:</b> ${event.photoTitle || 'نامشخص'}
• <b>مرورگر:</b> ${event.browser || 'ناشناس'} (${event.device || 'دستگاه'})
• <b>منبع ورود:</b> ${event.referrer || 'ورود مستقیم'}
• <b>زمان:</b> ${event.persianDate || new Date().toLocaleString('fa-IR')}
`.trim();
      sendTelegramMessage(msg);
    } else if (event.eventType === 'complete_order') {
      const msg = `
🎉 <b>سفارش قطعی جدید در وب‌سایت!</b>
• <b>اثر:</b> ${event.photoTitle || 'اثر هنری'}
• <b>مبلغ:</b> ${event.priceToman ? event.priceToman.toLocaleString() + ' تومان' : 'دیجیتال'}
• <b>دستگاه و مرورگر:</b> ${event.browser} / ${event.device}
• <b>زمان:</b> ${event.persianDate || new Date().toLocaleString('fa-IR')}
`.trim();
      sendTelegramMessage(msg);
    }

    return res.json({ success: true });
  } catch (err: any) {
    return res.status(500).json({ error: err.message });
  }
});

app.get('/api/analytics/summary', (req, res) => {
  try {
    const events = readAnalyticsEvents();
    const now = new Date();
    const todayStr = now.toISOString().split('T')[0];
    const yesterday = new Date(now.getTime() - 24 * 60 * 60 * 1000);
    const yesterdayStr = yesterday.toISOString().split('T')[0];

    const todayEvents = events.filter((e) => (e.clientTimestamp || '').startsWith(todayStr));
    const yesterdayEvents = events.filter((e) => (e.clientTimestamp || '').startsWith(yesterdayStr));

    const sessions = new Set(events.map((e) => e.sessionId)).size;
    const pageViews = events.filter((e) => e.eventType === 'page_view').length;

    // شمارش مرورگرها
    const browserCounts: Record<string, number> = {};
    const deviceCounts: Record<string, number> = {};
    const referrerCounts: Record<string, number> = {};

    events.forEach((e) => {
      const b = e.browser || 'سایر مرورگرها';
      browserCounts[b] = (browserCounts[b] || 0) + 1;

      const d = e.device === 'mobile' ? 'موبایل (Mobile)' : e.device === 'tablet' ? 'تبلت (Tablet)' : 'رایانه رومیزی (Desktop)';
      deviceCounts[d] = (deviceCounts[d] || 0) + 1;

      const r = e.referrer || 'مستقیم';
      referrerCounts[r] = (referrerCounts[r] || 0) + 1;
    });

    const totalEvents = events.length || 1;

    const topBrowsers = Object.entries(browserCounts)
      .map(([name, count]) => ({ name, count, percent: Math.round((count / totalEvents) * 100) }))
      .sort((a, b) => b.count - a.count);

    const topDevices = Object.entries(deviceCounts)
      .map(([name, count]) => ({ name, count, percent: Math.round((count / totalEvents) * 100) }))
      .sort((a, b) => b.count - a.count);

    const topReferrers = Object.entries(referrerCounts)
      .map(([name, count]) => ({ name, count, percent: Math.round((count / totalEvents) * 100) }))
      .sort((a, b) => b.count - a.count);

    // بررسی سبدهای رها شده
    const openModals = events.filter((e) => e.eventType === 'open_buy_modal');
    const completedOrders = events.filter((e) => e.eventType === 'complete_order');
    const abandonedEvents = events.filter((e) => e.eventType === 'abandon_checkout');

    const abandonedCartList = abandonedEvents.slice(-20).reverse().map((e) => ({
      photoTitle: e.photoTitle || 'اثر عکاسی برگزیده',
      photoId: e.photoId,
      priceToman: e.priceToman,
      browser: e.browser,
      device: e.device,
      referrer: e.referrer,
      timestamp: e.clientTimestamp,
      persianDate: e.persianDate || '',
    }));

    const abandonmentRate = openModals.length > 0
      ? Math.round((abandonedEvents.length / openModals.length) * 100)
      : 0;

    return res.json({
      totalPageViews: pageViews || events.length,
      todayViews: todayEvents.length,
      yesterdayViews: yesterdayEvents.length,
      totalSessions: sessions || 1,
      abandonedCheckoutsCount: abandonedEvents.length,
      completedOrdersCount: completedOrders.length,
      abandonmentRate,
      topBrowsers,
      topDevices,
      topReferrers,
      abandonedCartList,
      recentEvents: events.slice(-30).reverse(),
    });
  } catch (err: any) {
    return res.status(500).json({ error: err.message });
  }
});

// ارسال دستی گزارش آمار به تلگرام سینا
app.post('/api/analytics/send-telegram-report', async (req, res) => {
  try {
    const events = readAnalyticsEvents();
    const now = new Date();
    const todayStr = now.toISOString().split('T')[0];
    const todayEvents = events.filter((e) => (e.clientTimestamp || '').startsWith(todayStr));
    const abandonedEvents = events.filter((e) => e.eventType === 'abandon_checkout');
    const completedOrders = events.filter((e) => e.eventType === 'complete_order');

    const edgeVisitors = events.filter((e) => (e.browser || '').includes('Edge')).length;
    const chromeVisitors = events.filter((e) => (e.browser || '').includes('Chrome')).length;

    const report = `
📊 <b>گزارش جامع بازدید و رفتار وب‌سایت سینا ضرغامی</b>
📅 <i>تاریخ: ${new Date().toLocaleDateString('fa-IR')}</i>

• <b>کل رویدادهای ثبت‌شده:</b> ${events.length}
• <b>بازدیدهای امروز:</b> ${todayEvents.length}
• <b>سفارشات قطعی:</b> ${completedOrders.length}
• <b>خریدهای رها شده در نیمه‌راه:</b> ${abandonedEvents.length}

🌐 <b>تفکیک مرورگرها:</b>
• Microsoft Edge: ${edgeVisitors} کاربر
• Google Chrome: ${chromeVisitors} کاربر

✨ گزارش خودکار ربات استودیو سینا ضرغامی
`.trim();

    const ok = await sendTelegramMessage(report);
    return res.json({ success: ok, message: ok ? 'گزارش تحلیلی به تلگرام فرستاده شد.' : 'خطا در ارسال تلگرام' });
  } catch (err: any) {
    return res.status(500).json({ error: err.message });
  }
});

// =========================================================================
// ۶. مدیریت ذخیره و همگام‌سازی ابری داده‌های سایت (Mobile & Desktop Sync)
// =========================================================================
app.get('/api/site-data', (req, res) => {
  try {
    if (fs.existsSync(DATA_FILE)) {
      const content = fs.readFileSync(DATA_FILE, 'utf-8');
      return res.setHeader('Content-Type', 'application/json').send(content);
    }
    const publicDataFile = path.join(PUBLIC_DIR, 'site-data.json');
    if (fs.existsSync(publicDataFile)) {
      const content = fs.readFileSync(publicDataFile, 'utf-8');
      return res.setHeader('Content-Type', 'application/json').send(content);
    }
    return res.status(404).json({ message: 'داده‌ای یافت نشد' });
  } catch (err: any) {
    return res.status(500).json({ error: err.message });
  }
});

app.post('/api/site-data', (req, res) => {
  try {
    const data = req.body;
    fs.writeFileSync(DATA_FILE, JSON.stringify(data, null, 2), 'utf-8');

    if (!fs.existsSync(PUBLIC_DIR)) {
      fs.mkdirSync(PUBLIC_DIR, { recursive: true });
    }
    const publicDataFile = path.join(PUBLIC_DIR, 'site-data.json');
    fs.writeFileSync(publicDataFile, JSON.stringify(data, null, 2), 'utf-8');

    return res.json({ success: true, timestamp: new Date().toISOString() });
  } catch (err: any) {
    return res.status(500).json({ error: err.message });
  }
});

// =========================================================================
// ۶.۱. همگام‌سازی مستقیم و خودکار با مخزن گیت‌هاب (szarghami/sinazarghami.ir)
// =========================================================================
app.post('/api/github/sync', async (req, res) => {
  try {
    const { token, repo = 'szarghami/sinazarghami.ir', path: targetPath = 'site-data.json', content } = req.body;
    const githubToken = token || process.env.GITHUB_TOKEN;

    if (!githubToken) {
      return res.status(400).json({
        error: 'توکن دسترسی گیت‌هاب (Personal Access Token) وارد نشده است.',
      });
    }

    const payloadString = typeof content === 'string'
      ? content
      : JSON.stringify(content || req.body.data, null, 2);
    const base64Content = Buffer.from(payloadString, 'utf-8').toString('base64');

    // دریافت sha فایل در صورت وجود در مخزن گیت‌هاب
    let sha: string | undefined;
    const checkRes = await fetch(`https://api.github.com/repos/${repo}/contents/${targetPath}`, {
      headers: {
        Authorization: `token ${githubToken.trim()}`,
        Accept: 'application/vnd.github.v3+json',
        'User-Agent': 'SinaZarghami-Sync-Engine',
      },
    });

    if (checkRes.ok) {
      const fileInfo = await checkRes.json();
      sha = fileInfo.sha;
    }

    // ارسال درخواست ثبت یا به‌روزرسانی فایل در مخزن گیت‌هاب
    const putRes = await fetch(`https://api.github.com/repos/${repo}/contents/${targetPath}`, {
      method: 'PUT',
      headers: {
        Authorization: `token ${githubToken.trim()}`,
        Accept: 'application/vnd.github.v3+json',
        'Content-Type': 'application/json',
        'User-Agent': 'SinaZarghami-Sync-Engine',
      },
      body: JSON.stringify({
        message: `Auto-sync ${targetPath} via Sina Zarghami Studio [${new Date().toISOString().split('T')[0]}]`,
        content: base64Content,
        sha,
      }),
    });

    const putData = await putRes.json();
    if (!putRes.ok) {
      return res.status(putRes.status).json({
        error: putData.message || 'خطا در ارتباط با گیت‌هاب',
        details: putData,
      });
    }

    return res.json({
      success: true,
      commitUrl: putData.commit?.html_url || `https://github.com/${repo}`,
      message: `فایل ${targetPath} با موفقیت در مخزن ${repo} کامیت شد.`,
    });
  } catch (err: any) {
    return res.status(500).json({ error: err.message });
  }
});

// =========================================================================
// ۷. احراز هویت و رمز عبور دائمی
// =========================================================================
app.get('/api/passcode', (req, res) => {
  try {
    if (fs.existsSync(PASSCODE_FILE)) {
      const data = JSON.parse(fs.readFileSync(PASSCODE_FILE, 'utf-8'));
      return res.json({ passcode: data.passcode || DEFAULT_PASSCODE });
    }
    return res.json({ passcode: DEFAULT_PASSCODE });
  } catch {
    return res.json({ passcode: DEFAULT_PASSCODE });
  }
});

app.post('/api/passcode', (req, res) => {
  try {
    const { passcode } = req.body;
    if (!passcode || typeof passcode !== 'string' || passcode.trim().length < 4) {
      return res.status(400).json({ error: 'رمز عبور باید حداقل ۴ کاراکتر باشد' });
    }
    const cleanPass = passcode.trim();
    fs.writeFileSync(
      PASSCODE_FILE,
      JSON.stringify({ passcode: cleanPass, updatedAt: new Date().toISOString() }),
      'utf-8'
    );
    return res.json({ success: true, passcode: cleanPass });
  } catch (err: any) {
    return res.status(500).json({ error: err.message });
  }
});

// =========================================================================
// ۸. میزبانی استاتیک و Vite
// =========================================================================
// ارائه فایل‌های آپلود شده
app.use('/uploads', express.static(path.join(PUBLIC_DIR, 'uploads')));

if (process.env.NODE_ENV === 'production') {
  app.use(express.static(path.join(__dirname, 'dist')));
  app.get('*', (req, res) => {
    res.sendFile(path.join(__dirname, 'dist', 'index.html'));
  });
} else {
  const { createServer } = await import('vite');
  const vite = await createServer({
    server: { middlewareMode: true, port: PORT, host: '0.0.0.0' },
    appType: 'spa',
  });
  app.use(vite.middlewares);
}

app.listen(PORT, '0.0.0.0', () => {
  console.log(`Server listening on http://0.0.0.0:${PORT}`);
});
