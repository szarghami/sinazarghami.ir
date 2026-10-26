import express from 'express';
import path from 'path';
import fs from 'fs';
import { fileURLToPath } from 'url';
import dotenv from 'dotenv';
<<<<<<< HEAD
import helmet from 'helmet';
=======
import rateLimit from 'express-rate-limit';
import { body, validationResult } from 'express-validator';
import csrf from 'csurf';
import { createLogger, transports, format } from 'winston';
>>>>>>> a4427df (feat: apply claude updates and fixes)
import { GoogleGenAI } from '@google/genai';

dotenv.config();

const logger = createLogger({
  level: 'info',
  format: format.combine(
    format.timestamp(),
    format.json()
  ),
  transports: [
    new transports.File({ filename: 'error.log', level: 'error' }),
    new transports.File({ filename: 'combined.log' })
  ]
});

const apiLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 100 // limit each IP to 100 requests per windowMs
});

const csrfProtection = csrf({ cookie: true });

// Apply CSRF protection to all routes that need it
app.use(csrfProtection);
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 100 // limit each IP to 100 requests per windowMs
});

app.use('/api/', apiLimiter);

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
const PORT = Number(process.env.PORT) || 3000;

// خاموش کردن هدر افشاکننده تکنولوژی سرور
app.disable('x-powered-by');

// فعال‌سازی Helmet برای اعمال هدرهای امنیتی استاندارد
app.use(
  helmet({
    contentSecurityPolicy: false, // جلوگیری از تداخل با کامپایلر Vite، فونت‌ها و فریم‌های ویدیو در توسعه
    crossOriginEmbedderPolicy: false,
    crossOriginResourcePolicy: { policy: 'cross-origin' },
  })
);

// مسیرهای ذخیره‌سازی داده‌ها
const DATA_FILE = path.join(__dirname, 'site-data.json');
const PASSCODE_FILE = path.join(__dirname, 'admin-passcode.json');
const SETTINGS_FILE = path.join(__dirname, 'studio-settings.json');
const ANALYTICS_FILE = path.join(__dirname, 'analytics-data.json');
const PUBLIC_DIR = path.join(__dirname, 'public');
const DEFAULT_PASSCODE = process.env.DEFAULT_PASSCODE || 'sina2026';

// =========================================================================
// توابع کمکی امنیتی و احراز هویت
// =========================================================================

function getAdminPasscode(): string {
  let currentPass = DEFAULT_PASSCODE;
  if (fs.existsSync(PASSCODE_FILE)) {
    try {
      const data = JSON.parse(fs.readFileSync(PASSCODE_FILE, 'utf-8'));
      if (data.passcode && typeof data.passcode === 'string') {
        currentPass = data.passcode;
      }
    } catch {
      // استفاده از رمز پیش‌فرض در صورت خطا در فایل
    }
  }
  return currentPass.trim();
}

function verifyAdminAuth(req: express.Request): boolean {
  const serverPasscode = getAdminPasscode();
  const headerPin = req.headers['x-admin-passcode'] as string;
  const authHeader = req.headers['authorization'];
  let bearerPin = '';
  if (authHeader && authHeader.startsWith('Bearer ')) {
    bearerPin = authHeader.slice(7).trim();
  }
  const bodyPin = req.body && typeof req.body === 'object' ? req.body.passcode : undefined;

  const provided = (headerPin || bearerPin || bodyPin || '').trim();
  return Boolean(provided && provided === serverPasscode);
}

const requireAdmin: express.RequestHandler = (req, res, next) => {
  if (!verifyAdminAuth(req)) {
    return res.status(401).json({ error: 'دسترسی غیرمجاز: احراز هویت مدیریت الزامی است.' });
  }
  next();
};

// اعتبارسنجی جادویی (Magic Bytes) برای اطمینان از اصالت فرمت‌های تصویر (WebP, PNG, JPEG)
function isValidImageMagicBytes(buffer: Buffer): { valid: boolean; ext: 'png' | 'jpg' | 'webp' | null } {
  if (buffer.length < 12) return { valid: false, ext: null };

  // PNG: 89 50 4E 47
  if (
    buffer[0] === 0x89 &&
    buffer[1] === 0x50 &&
    buffer[2] === 0x4e &&
    buffer[3] === 0x47
  ) {
    return { valid: true, ext: 'png' };
  }

  // JPEG: FF D8 FF
  if (
    buffer[0] === 0xff &&
    buffer[1] === 0xd8 &&
    buffer[2] === 0xff
  ) {
    return { valid: true, ext: 'jpg' };
  }

  // WebP: 'RIFF'....'WEBP'
  const riff = buffer.subarray(0, 4).toString('ascii');
  const webp = buffer.subarray(8, 12).toString('ascii');
  if (riff === 'RIFF' && webp === 'WEBP') {
    return { valid: true, ext: 'webp' };
  }

  return { valid: false, ext: null };
}

// پاکسازی متون قبل از درج در قالب‌های HTML تلگرام (پیشگیری از تزریق کد و خطا)
function escapeHtml(val: any): string {
  if (val === null || val === undefined) return '';
  return String(val)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;');
}

// دامنه‌های مجاز و جلوگیری از آسیب‌پذیری SSRF در پروکسی‌ها
const ALLOWED_PROXY_DOMAINS = [
  'aparat.com',
  'googleapis.com',
  'unsplash.com',
  'images.unsplash.com',
  'github.com',
  'api.github.com',
  'raw.githubusercontent.com',
];

function isPrivateOrLocalHost(hostname: string): boolean {
  const lower = hostname.toLowerCase().trim();
  if (
    lower === 'localhost' ||
    lower.endsWith('.localhost') ||
    lower.endsWith('.local') ||
    lower.endsWith('.internal') ||
    lower === '0.0.0.0' ||
    lower === '::1' ||
    lower === '[::1]'
  ) {
    return true;
  }

  // بررسی آدرس‌های IP نسخه ۴ داخلی و خصوصی
  const ipv4Regex = /^(\d{1,3})\.(\d{1,3})\.(\d{1,3})\.(\d{1,3})$/;
  const match = lower.match(ipv4Regex);
  if (match) {
    const p1 = parseInt(match[1], 10);
    const p2 = parseInt(match[2], 10);
    if (p1 === 127) return true; // 127.*
    if (p1 === 10) return true; // 10.*
    if (p1 === 192 && p2 === 168) return true; // 192.168.*
    if (p1 === 169 && p2 === 254) return true; // 169.254.*
    if (p1 === 172 && p2 >= 16 && p2 <= 31) return true; // 172.16.* - 172.31.*
    if (p1 === 0) return true; // 0.*
  }

  if (lower.startsWith('fe80:') || lower.startsWith('fc00:') || lower.startsWith('fd00:')) {
    return true;
  }

  return false;
}

function validateProxyUrl(inputUrl: string): { valid: boolean; error?: string; url?: URL } {
  try {
    const parsed = new URL(inputUrl);

    // تنها پروتکل امن https مجاز است
    if (parsed.protocol !== 'https:') {
      return { valid: false, error: 'تنها پروتکل امن https مجاز است.' };
    }

    const hostname = parsed.hostname.toLowerCase();

    // مسدودسازی آدرس‌های لوکال، شبکه داخلی و لینک‌لوکال
    if (isPrivateOrLocalHost(hostname)) {
      return { valid: false, error: 'دسترسی به آدرس‌های داخلی و محلی مسدود است.' };
    }

    // بررسی فهرست دامنه‌های مجاز
    const isDomainAllowed = ALLOWED_PROXY_DOMAINS.some(
      (domain) => hostname === domain || hostname.endsWith(`.${domain}`)
    );

    if (!isDomainAllowed) {
      return { valid: false, error: 'دسترسی به این دامنه از طریق پروکسی مجاز نیست.' };
    }

    return { valid: true, url: parsed };
  } catch {
    return { valid: false, error: 'فرمت آدرس ارسالی نامعتبر است.' };
  }
}

// تنظیم امن هدرهای CORS فقط برای دامنه خود سایت
function setRestrictedCorsHeaders(req: express.Request, res: express.Response) {
  const origin = req.headers.origin;
  const host = req.headers.host;
  const appUrl = process.env.APP_URL;

  let allowedOrigin = appUrl || (host ? `${req.protocol || 'https'}://${host}` : '*');
  if (origin && host) {
    try {
      const originHost = new URL(origin).host;
      if (originHost === host) {
        allowedOrigin = origin;
      }
    } catch {}
  }
  res.setHeader('Access-Control-Allow-Origin', allowedOrigin);
  res.setHeader('Vary', 'Origin');
  res.setHeader('X-Content-Type-Options', 'nosniff');
}

// =========================================================================
// ۳. روت اختصاصی آپلود محلی مدیر (سقف ۵۰ مگابایت، احراز هویت، اعتبارسنجی کامل)
// توجه: این روت قبل از محدودیت عمومی ۱۰۰ کیلوبایت بدنه ثبت می‌شود
// =========================================================================
app.post(
  '/api/upload-local',
  express.json({ limit: '50mb' }),
  requireAdmin,
  (req, res) => {
    try {
      const { dataUrl, filename } = req.body || {};
      if (!dataUrl || typeof dataUrl !== 'string') {
        return res.status(400).json({ error: 'داده تصویر معتبر نیست.' });
      }

      const uploadsDir = path.join(PUBLIC_DIR, 'uploads');
      if (!fs.existsSync(uploadsDir)) {
        fs.mkdirSync(uploadsDir, { recursive: true });
      }

      // سقف تعداد فایل‌های پوشه آپلود
      const existingFiles = fs.readdirSync(uploadsDir);
      if (existingFiles.length >= 2000) {
        return res.status(400).json({ error: 'سقف تعداد فایل‌های ذخیره‌شده (۲۰۰۰ عدد) تکمیل شده است.' });
      }

      const matches = dataUrl.match(/^data:([A-Za-z-+\/]+);base64,(.+)$/);
      if (!matches || matches.length !== 3) {
        return res.status(400).json({ error: 'فرمت DataURL نامعتبر است.' });
      }

      const buffer = Buffer.from(matches[2], 'base64');

      // سقف حجم هر فایل آپلودی (حداکثر ۲۰ مگابایت)
      if (buffer.length > 20 * 1024 * 1024) {
        return res.status(413).json({ error: 'حجم فایل آپلودی بیش از سقف مجاز (۲۰ مگابایت) است.' });
      }

      // بررسی بایت‌های جادویی برای اثبات اینکه فایل واقعاً تصویر است
      const magicCheck = isValidImageMagicBytes(buffer);
      if (!magicCheck.valid || !magicCheck.ext) {
        return res.status(400).json({ error: 'محتوای ارسالی یک تصویر معتبر webp/png/jpg نیست.' });
      }

      const ext = magicCheck.ext;
      const baseSanitized = (filename || 'photo_' + Date.now()).replace(/[^a-zA-Z0-9_-]/g, '_');
      let cleanName = `${baseSanitized}.${ext}`;
      let filePath = path.join(uploadsDir, cleanName);

      // جلوگیری از بازنویسی فایل‌های از قبل موجود
      if (fs.existsSync(filePath)) {
        const uniqueSuffix = `${Date.now()}_${Math.random().toString(36).substring(2, 7)}`;
        cleanName = `${baseSanitized}_${uniqueSuffix}.${ext}`;
        filePath = path.join(uploadsDir, cleanName);
      }

      fs.writeFileSync(filePath, buffer);

      return res.json({
        success: true,
        publicUrl: `/uploads/${cleanName}`,
        sizeKB: Math.round(buffer.length / 1024),
      });
    } catch (err) {
      console.error('Upload local error:', err);
      return res.status(500).json({ error: 'خطا در ذخیره‌سازی فایل.' });
    }
  }
);

// =========================================================================
// سقف حجم بدنه برای تمام روت‌های عمومی: حداکثر ۱۰۰ کیلوبایت
// =========================================================================
app.use(express.json({ limit: '100kb' }));

// مدیریت خطاهای اندازه و نحو بدنه درخواست
app.use((err: any, _req: express.Request, res: express.Response, next: express.NextFunction) => {
  if (err instanceof SyntaxError && 'body' in err) {
    return res.status(400).json({ error: 'فرمت داده‌های JSON نامعتبر است.' });
  }
  if (err && err.type === 'entity.too.large') {
    return res.status(413).json({ error: 'حجم داده‌های ارسالی بیش از سقف مجاز (۱۰۰ کیلوبایت) است.' });
  }
  next(err);
});

// توکن و چت‌آیدی تلگرام سینا ضرغامی جهت ارسال خودکار اعلانات
<<<<<<< HEAD
const TELEGRAM_BOT_TOKEN = process.env.TELEGRAM_BOT_TOKEN || '8961351294:AAGqsMYUXBFS38uhdMvJjwnRh1FbxGdRGkQ';
const SINA_CHAT_ID = process.env.TELEGRAM_CHAT_ID || '86050350';
=======
const TELEGRAM_BOT_TOKEN = process.env.TELEGRAM_BOT_TOKEN;
const SINA_CHAT_ID = process.env.SINA_CHAT_ID;
>>>>>>> a4427df (feat: apply claude updates and fixes)

async function sendTelegramMessage(text: string): Promise<boolean> {
  if (!TELEGRAM_BOT_TOKEN || !SINA_CHAT_ID) {
    console.warn('Telegram bot credentials are not configured.');
    return false;
  }
  try {
    const res = await fetch(`https://api.telegram.org/bot${TELEGRAM_BOT_TOKEN}/sendMessage`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        chat_id: SINA_CHAT_ID,
        text,
        parse_mode: 'HTML',
      }),
      signal: AbortSignal.timeout(10000),
    });
    const data = await res.json();
    return data.ok === true;
  } catch (err) {
    console.warn('Telegram notification failed:', err);
    return false;
  }
}

// روت اختصاصی ارسال امن پیام به تلگرام
app.post('/api/telegram/notify', async (req, res) => {
  try {
    const { message, text } = req.body || {};
    const content = message || text;
    if (!content || typeof content !== 'string') {
      return res.status(400).json({ ok: false, error: 'متن پیام الزامی است.' });
    }
    const success = await sendTelegramMessage(content.trim());
    return res.json({ ok: success });
  } catch (err) {
    console.error('Telegram notification route error:', err);
    return res.status(500).json({ ok: false, error: 'خطا در ارسال اعلان تلگرام.' });
  }
});

// مقداردهی هوش مصنوعی جمینای
const apiKey = process.env.GEMINI_API_KEY || '';
const ai = new GoogleGenAI(apiKey ? { apiKey } : {});

// =========================================================================
// ۱. پروکسی امن تصاویر (ضد SSRF، سقف ۱۰ مگابایت، مهلت ۱۰ ثانیه، فقط image/*)
// =========================================================================
app.get('/api/image-proxy', async (req, res) => {
  try {
    const imageUrl = req.query.url as string;
    if (!imageUrl) {
      return res.status(400).json({ error: 'آدرس تصویر ارسال نشده است.' });
    }

    const check = validateProxyUrl(imageUrl);
    if (!check.valid || !check.url) {
      return res.status(403).json({ error: check.error || 'دسترسی به آدرس درخواستی مجاز نیست.' });
    }

    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 10000);

    let response: Response;
    try {
      response = await fetch(check.url.toString(), {
        signal: controller.signal,
        headers: {
          'User-Agent':
            'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0.0.0 Safari/537.36 Edg/124.0.0.0',
          Accept: 'image/avif,image/webp,image/apng,image/svg+xml,image/*,*/*;q=0.8',
        },
      });
    } finally {
      clearTimeout(timeout);
    }

    if (!response.ok) {
      return res.status(response.status).json({ error: 'خطا در دریافت تصویر از سرور مبدا.' });
    }

    // بررسی سقف حجم با توجه به هدر Content-Length
    const contentLength = response.headers.get('content-length');
    if (contentLength && parseInt(contentLength, 10) > 10 * 1024 * 1024) {
      return res.status(413).json({ error: 'حجم تصویر بیش از سقف مجاز (۱۰ مگابایت) است.' });
    }

    // بررسی نوع محتوا: فقط image/* مجاز است
    const rawContentType = response.headers.get('content-type') || '';
    const contentType = rawContentType.split(';')[0].trim().toLowerCase();
    if (!contentType.startsWith('image/')) {
      return res.status(415).json({ error: 'نوع فایل دریافتی تصویر نیست (تنها image/* مجاز است).' });
    }

    // خواندن ایمن استریم با کنترل لحظه‌ای سقف ۱۰ مگابایت
    const chunks: Uint8Array[] = [];
    let totalBytes = 0;
    const reader = response.body?.getReader();

    if (reader) {
      while (true) {
        const { done, value } = await reader.read();
        if (done) break;
        if (value) {
          totalBytes += value.length;
          if (totalBytes > 10 * 1024 * 1024) {
            reader.cancel();
            return res.status(413).json({ error: 'حجم داده تصویر بیش از سقف مجاز (۱۰ مگابایت) است.' });
          }
          chunks.push(value);
        }
      }
    } else {
      const arrayBuf = await response.arrayBuffer();
      if (arrayBuf.byteLength > 10 * 1024 * 1024) {
        return res.status(413).json({ error: 'حجم تصویر بیش از سقف مجاز (۱۰ مگابایت) است.' });
      }
      chunks.push(new Uint8Array(arrayBuf));
    }

    const buffer = Buffer.concat(chunks);

    setRestrictedCorsHeaders(req, res);
    res.setHeader('Content-Type', contentType);
    res.setHeader('Cache-Control', 'public, max-age=31536000, immutable');
    return res.send(buffer);
  } catch (err: any) {
    if (err?.name === 'AbortError') {
      return res.status(504).json({ error: 'مهلت زمانی دریافت تصویر (۱۰ ثانیه) به پایان رسید.' });
    }
    console.error('Image proxy error:', err);
    return res.status(500).json({ error: 'خطا در پردازش تصویر توسط پروکسی.' });
  }
});

// =========================================================================
// ۱.۱ پروکسی CORS برای سرویس‌های عمومی مجاز (ضد SSRF، سقف ۱۰ مگابایت، مهلت ۱۰ ثانیه)
// =========================================================================
app.get('/api/cors-proxy', async (req, res) => {
  try {
    const targetUrl = req.query.url as string;
    if (!targetUrl) {
      return res.status(400).json({ error: 'آدرس مقصد ارسال نشده است.' });
    }

    const check = validateProxyUrl(targetUrl);
    if (!check.valid || !check.url) {
      return res.status(403).json({ error: check.error || 'دسترسی به آدرس درخواستی مجاز نیست.' });
    }

    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 10000);

    let response: Response;
    try {
      response = await fetch(check.url.toString(), {
        signal: controller.signal,
        headers: {
          'User-Agent':
            'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0.0.0 Safari/537.36',
          Accept: 'application/json, text/plain, */*',
          'Accept-Language': 'fa,en;q=0.9',
        },
      });
    } finally {
      clearTimeout(timeout);
    }

    const contentLength = response.headers.get('content-length');
    if (contentLength && parseInt(contentLength, 10) > 10 * 1024 * 1024) {
      return res.status(413).json({ error: 'حجم داده بیش از سقف مجاز (۱۰ مگابایت) است.' });
    }

    const contentType = response.headers.get('content-type') || 'application/json';
    const text = await response.text();

    if (text.length > 10 * 1024 * 1024) {
      return res.status(413).json({ error: 'حجم داده دریافتی بیش از ۱۰ مگابایت است.' });
    }

    setRestrictedCorsHeaders(req, res);
    res.setHeader('Content-Type', contentType);
    res.status(response.status);

    try {
      const json = JSON.parse(text);
      return res.json(json);
    } catch {
      return res.send(text);
    }
  } catch (err: any) {
    if (err?.name === 'AbortError') {
      return res.status(504).json({ error: 'مهلت زمانی دریافت پاسخ (۱۰ ثانیه) به پایان رسید.' });
    }
    console.error('CORS proxy error:', err);
    return res.status(500).json({ error: 'خطا در برقراری ارتباط با سرویس مقصد.' });
  }
});

// =========================================================================
// ۱.۲ دریافت اختصاصی کامنت‌های ویدیوهای آپارات
// =========================================================================
app.get('/api/aparat-comments/:uid', async (req, res) => {
  try {
    const { uid } = req.params;
    if (!uid) {
      return res.status(400).json({ error: 'شناسه ویدیو آپارات الزامی است.' });
    }
    const cleanUid = uid.trim().replace(/[^a-zA-Z0-9_-]/g, '');
    const aparatUrl = `https://www.aparat.com/api/fa/v1/video/comment/list/videohash/${cleanUid}`;

    const response = await fetch(aparatUrl, {
      signal: AbortSignal.timeout(10000),
      headers: {
        'User-Agent':
          'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0.0.0 Safari/537.36',
        Accept: 'application/json, text/plain, */*',
        'Accept-Language': 'fa,en;q=0.9',
      },
    });

    if (!response.ok) {
      return res.status(response.status).json({ error: 'خطا در دریافت دیدگاه‌های آپارات' });
    }

    const data = await response.json();
    setRestrictedCorsHeaders(req, res);
    return res.json(data);
  } catch (err: any) {
    console.error('Aparat comments error:', err);
    return res.status(500).json({ error: 'خطا در ارتباط با سرور دیدگاه‌های آپارات.' });
  }
});

// =========================================================================
// ۲. هوش مصنوعی جمینای: تحلیل بصری عکس با اعتبارسنجی امنیتی URL ورودی
// =========================================================================
app.post('/api/gemini/suggest-photo-details', async (req, res) => {
  try {
    const { imageBase64, imageUrl, titleHint } = req.body || {};

    if (!process.env.GEMINI_API_KEY) {
      return res.status(503).json({ error: 'کلید سرویس هوش مصنوعی تنظیم نشده است.' });
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
      // اعمال اعتبارسنجی دامنه‌های مجاز و ضد SSRF بر روی آدرس تصویر
      const check = validateProxyUrl(imageUrl);
      if (!check.valid || !check.url) {
        return res.status(400).json({ error: check.error || 'آدرس تصویر نامعتبر یا غیرمجاز است.' });
      }

      try {
        const imgRes = await fetch(check.url.toString(), {
          signal: AbortSignal.timeout(10000),
          headers: {
            'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36',
          },
        });

        if (!imgRes.ok) {
          return res.status(400).json({ error: 'خطا در بارگذاری تصویر از آدرس مشخص‌شده.' });
        }

        const rawType = imgRes.headers.get('content-type') || 'image/jpeg';
        const typeOnly = rawType.split(';')[0].trim().toLowerCase();
        if (!typeOnly.startsWith('image/')) {
          return res.status(415).json({ error: 'فایل دریافتی تصویر معتبر نیست.' });
        }

        const arrayBuf = await imgRes.arrayBuffer();
        if (arrayBuf.byteLength > 10 * 1024 * 1024) {
          return res.status(413).json({ error: 'حجم تصویر برای پردازش بیش از ۱۰ مگابایت است.' });
        }

        mimeType = typeOnly;
        base64Data = Buffer.from(arrayBuf).toString('base64');
      } catch {
        return res.status(400).json({ error: 'عدم امکان دریافت تصویر در مهلت زمانی مجاز.' });
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
      model: 'gemini-2.5-flash',
      contents,
    });

    const rawText = response.text || '';
    const cleanJson = rawText.replace(/```json/g, '').replace(/```/g, '').trim();
    const parsed = JSON.parse(cleanJson);

    return res.json({ success: true, suggestion: parsed });
  } catch (err) {
    console.error('Gemini vision suggestion error:', err);
    return res.status(500).json({ error: 'خطا در پردازش تصویر با هوش مصنوعی.' });
  }
});

// =========================================================================
// ۴. ترجمه ادبی و هنری با Gemini
// =========================================================================
app.post('/api/translate', async (req, res) => {
  try {
    const { text, type, category } = req.body || {};
    if (!text || typeof text !== 'string') {
      return res.status(400).json({ error: 'متن فارسی الزامی است' });
    }

    if (!process.env.GEMINI_API_KEY) {
      return res.status(503).json({ error: 'کلید سرویس هوش مصنوعی تنظیم نشده است.' });
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
      model: 'gemini-2.5-flash',
      contents: prompt,
    });

    const translatedText = response.text ? response.text.trim().replace(/^["']|["']$/g, '') : '';
    return res.json({ translatedText });
  } catch (err) {
    console.error('Translate error:', err);
    return res.status(500).json({ error: 'خطا در پردازش ترجمه.' });
  }
});

// =========================================================================
// ۵. ثبت آمار و رفتار کاربران (انواع مجاز، سقف ۲ کیلوبایت، Rate Limit، فیلتر Telegram)
// =========================================================================
const ALLOWED_ANALYTICS_EVENT_TYPES = new Set([
  'page_view',
  'photo_view',
  'open_buy_modal',
  'select_format',
  'abandon_checkout',
  'complete_order',
  'service_inquiry',
  'contact_inquiry',
  'download_resume',
  'section_view',
  'gear_view',
]);

// ریت لیمیت به ازای هر IP (حداکثر ۴۰ رویداد در دقیقه)
interface RateLimitRecord {
  count: number;
  resetAt: number;
}
const analyticsIpRateMap = new Map<string, RateLimitRecord>();

function checkAnalyticsRateLimit(ip: string, maxRequests = 40, windowMs = 60000): boolean {
  const now = Date.now();
  const record = analyticsIpRateMap.get(ip);
  if (!record || now > record.resetAt) {
    analyticsIpRateMap.set(ip, { count: 1, resetAt: now + windowMs });
    return true;
  }
  if (record.count >= maxRequests) {
    return false;
  }
  record.count++;
  return true;
}

// پاکسازی دوره‌ای لاگ‌های ریت لیمیت منقضی‌شده
setInterval(() => {
  const now = Date.now();
  for (const [ip, rec] of analyticsIpRateMap.entries()) {
    if (now > rec.resetAt) {
      analyticsIpRateMap.delete(ip);
    }
  }
}, 5 * 60 * 1000);

function readAnalyticsEvents(): any[] {
  try {
    if (fs.existsSync(ANALYTICS_FILE)) {
      return JSON.parse(fs.readFileSync(ANALYTICS_FILE, 'utf-8'));
    }
  } catch {
    // نادیده گرفتن خطا در خواندن
  }
  return [];
}

function writeAnalyticsEvents(events: any[]) {
  try {
    const trimmed = events.slice(-3000);
    fs.writeFileSync(ANALYTICS_FILE, JSON.stringify(trimmed, null, 2), 'utf-8');
  } catch (err) {
    console.warn('Error saving analytics:', err);
  }
}

app.post('/api/analytics/event', async (req, res) => {
  try {
    // ۱. بررسی سقف حجم درخواست (حداکثر ۲ کیلوبایت)
    const rawLen = req.headers['content-length']
      ? parseInt(req.headers['content-length'], 10)
      : JSON.stringify(req.body || {}).length;

    if (rawLen > 2048) {
      return res.status(413).json({ error: 'حجم رویداد تحلیلی بیش از سقف مجاز (۲ کیلوبایت) است.' });
    }

    // ۲. بررسی Rate Limit برای IP درخواست‌دهنده
    const forwarded = req.headers['x-forwarded-for'];
    const clientIp = typeof forwarded === 'string'
      ? forwarded.split(',')[0].trim()
      : req.socket.remoteAddress || 'unknown_ip';

    if (!checkAnalyticsRateLimit(clientIp, 40, 60000)) {
      return res.status(429).json({ error: 'تعداد درخواست‌ها بیش از سقف مجاز است.' });
    }

    const event = req.body;
    if (!event || typeof event !== 'object' || !event.eventType) {
      return res.status(400).json({ error: 'رویداد نامعتبر است.' });
    }

    // ۳. بررسی نوع رویداد در لیست مجاز
    if (!ALLOWED_ANALYTICS_EVENT_TYPES.has(event.eventType)) {
      return res.status(400).json({ error: 'نوع رویداد ارسالی غیرمجاز است.' });
    }

    const events = readAnalyticsEvents();
    events.push(event);
    writeAnalyticsEvents(events);

    // ۴. ارسال پیام به تلگرام با فراردهی کامل متغیرها (Escape HTML) جهت پیشگیری از خطای تزریق
    if (event.eventType === 'abandon_checkout') {
      const safeTitle = escapeHtml(event.photoTitle || 'نامشخص');
      const safeBrowser = escapeHtml(event.browser || 'ناشناس');
      const safeDevice = escapeHtml(event.device || 'دستگاه');
      const safeReferrer = escapeHtml(event.referrer || 'ورود مستقیم');
      const safeDate = escapeHtml(event.persianDate || new Date().toLocaleString('fa-IR'));

      const msg = `
⚠️ <b>هشدار رها کردن خرید در وب‌سایت!</b>
مشتری پنجره خرید را باز کرده ولی سفارش را نهایی نکرده است:

• <b>اثر مشاهده‌شده:</b> ${safeTitle}
• <b>مرورگر:</b> ${safeBrowser} (${safeDevice})
• <b>منبع ورود:</b> ${safeReferrer}
• <b>زمان:</b> ${safeDate}
`.trim();
      sendTelegramMessage(msg);
    } else if (event.eventType === 'complete_order') {
      const safeTitle = escapeHtml(event.photoTitle || 'اثر هنری');
      const safePrice = event.priceToman ? escapeHtml(Number(event.priceToman).toLocaleString()) + ' تومان' : 'دیجیتال';
      const safeBrowser = escapeHtml(event.browser || 'نامشخص');
      const safeDevice = escapeHtml(event.device || 'دستگاه');
      const safeDate = escapeHtml(event.persianDate || new Date().toLocaleString('fa-IR'));

      const msg = `
🎉 <b>سفارش قطعی جدید در وب‌سایت!</b>
• <b>اثر:</b> ${safeTitle}
• <b>مبلغ:</b> ${safePrice}
• <b>دستگاه و مرورگر:</b> ${safeBrowser} / ${safeDevice}
• <b>زمان:</b> ${safeDate}
`.trim();
      sendTelegramMessage(msg);
    }

    return res.json({ success: true });
  } catch (err) {
    console.error('Analytics event error:', err);
    return res.status(500).json({ error: 'خطا در ثبت رویداد تحلیلی.' });
  }
});

app.get('/api/analytics/summary', (_req, res) => {
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
  } catch (err) {
    console.error('Analytics summary error:', err);
    return res.status(500).json({ error: 'خطا در دریافت خلاصه آمار.' });
  }
});

// ارسال دستی گزارش آمار به تلگرام
app.post('/api/analytics/send-telegram-report', async (_req, res) => {
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
  } catch (err) {
    console.error('Send telegram report error:', err);
    return res.status(500).json({ error: 'خطا در ارسال گزارش به تلگرام.' });
  }
});

// ارسال خودکار گزارش روزانه به تلگرام در پایان هر شب
let lastReportDate = '';
setInterval(async () => {
  try {
    const now = new Date();
    const today = now.toISOString().split('T')[0];
    const currentHour = now.getUTCHours();
    if (currentHour >= 20 && lastReportDate !== today) {
      lastReportDate = today;
      const events = readAnalyticsEvents();
      const todayEvents = events.filter((e) => (e.clientTimestamp || '').startsWith(today));
      const abandonedEvents = events.filter((e) => e.eventType === 'abandon_checkout');
      const completedOrders = events.filter((e) => e.eventType === 'complete_order');
      const photoViews = events.filter((e) => e.eventType === 'photo_view').length;

      const edgeVisitors = events.filter((e) => (e.browser || '').includes('Edge')).length;
      const chromeVisitors = events.filter((e) => (e.browser || '').includes('Chrome')).length;

      const dailyReport = `
📊 <b>گزارش روزانه وب‌سایت سینا ضرغامی (sinazarghami.ir)</b>
📅 <i>تاریخ: ${new Date().toLocaleDateString('fa-IR')}</i>

• <b>کل بازدیدهای امروز:</b> ${todayEvents.length}
• <b>مشاهده آثار در گالری:</b> ${photoViews}
• <b>سفارشات قطعی ثبت‌شده:</b> ${completedOrders.length}
• <b>خریدهای در دست اقدام / رها شده:</b> ${abandonedEvents.length}

🌐 <b>تفکیک مرورگرها:</b>
• Microsoft Edge: ${edgeVisitors} کاربر
• Google Chrome: ${chromeVisitors} کاربر

✨ گزارش خودکار شبانه ربات هوشمند استودیو سینا ضرغامی
`.trim();

      await sendTelegramMessage(dailyReport);
    }
  } catch (err) {
    console.warn('Auto daily report interval error:', err);
  }
}, 30 * 60 * 1000);

// =========================================================================
// ۶. مدیریت ذخیره و همگام‌سازی ابری داده‌های سایت
// =========================================================================
app.get('/api/site-data', (_req, res) => {
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
  } catch (err) {
    console.error('Site data read error:', err);
    return res.status(500).json({ error: 'خطا در بارگذاری اطلاعات سایت.' });
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
  } catch (err) {
    console.error('Site data save error:', err);
    return res.status(500).json({ error: 'خطا در ذخیره‌سازی اطلاعات سایت.' });
  }
});

// =========================================================================
// ۶.۱. همگام‌سازی مستقیم و خودکار با مخزن اصلی گیت‌هاب
// =========================================================================
app.post('/api/github/sync', async (req, res) => {
  try {
    const { token, repo = 'szarghami/sinazarghami-aistudio-site', path: targetPath = 'site-data.json', content } = req.body || {};
    const githubToken = token || process.env.GITHUB_TOKEN;

    if (!githubToken) {
      return res.status(400).json({
        error: 'توکن دسترسی گیت‌هاب (Personal Access Token) وارد نشده است.',
      });
    }

    const payloadString = typeof content === 'string'
      ? content
      : JSON.stringify(content || req.body?.data, null, 2);
    const base64Content = Buffer.from(payloadString, 'utf-8').toString('base64');

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
        error: 'خطا در برقراری ارتباط و همگام‌سازی با مخزن گیت‌هاب.',
      });
    }

    return res.json({
      success: true,
      commitUrl: putData.commit?.html_url || `https://github.com/${repo}`,
      message: `فایل ${targetPath} با موفقیت در مخزن ${repo} کامیت شد.`,
    });
  } catch (err) {
    console.error('GitHub sync error:', err);
    return res.status(500).json({ error: 'خطا در عملیات همگام‌سازی گیت‌هاب.' });
  }
});

// =========================================================================
// ۷. احراز هویت و بررسی رمز عبور دائمی
// =========================================================================
app.get('/api/passcode', (_req, res) => {
  return res.status(403).json({
    error: 'دسترسی مستقیم به رمز عبور مجاز نیست. لطفاً از روت امن POST /api/auth/verify استفاده کنید.',
  });
});

app.post('/api/auth/verify', (req, res) => {
  try {
    const { passcode } = req.body || {};
    if (!passcode || typeof passcode !== 'string') {
      return res.status(400).json({ authenticated: false, error: 'رمز عبور ارسال نشده است.' });
    }
    const currentPass = getAdminPasscode();
    const authenticated = passcode.trim() === currentPass.trim();
    return res.json({ authenticated });
  } catch (err) {
    console.error('Auth verify error:', err);
    return res.status(500).json({ authenticated: false, error: 'خطا در بررسی رمز عبور.' });
  }
});

app.post('/api/passcode', requireAdmin, (req, res) => {
  try {
    const { passcode } = req.body || {};
    if (!passcode || typeof passcode !== 'string' || passcode.trim().length < 4) {
      return res.status(400).json({ error: 'رمز عبور باید حداقل ۴ کاراکتر باشد' });
    }
    const cleanPass = passcode.trim();
    fs.writeFileSync(
      PASSCODE_FILE,
      JSON.stringify({ passcode: cleanPass, updatedAt: new Date().toISOString() }),
      'utf-8'
    );
    return res.json({ success: true, message: 'رمز عبور با موفقیت به‌روزرسانی شد.' });
  } catch (err) {
    console.error('Passcode update error:', err);
    return res.status(500).json({ error: 'خطا در ذخیره‌سازی رمز عبور جدید.' });
  }
});

// =========================================================================
// ۷.۱. ذخیره و همگام‌سازی تنظیمات استودیو
// =========================================================================
app.get('/api/studio-settings', (_req, res) => {
  try {
    if (fs.existsSync(SETTINGS_FILE)) {
      const data = JSON.parse(fs.readFileSync(SETTINGS_FILE, 'utf-8'));
      return res.json(data);
    }
    return res.json({});
  } catch (err) {
    console.error('Studio settings read error:', err);
    return res.status(500).json({ error: 'خطا در خواندن تنظیمات استودیو.' });
  }
});

app.post('/api/studio-settings', requireAdmin, (req, res) => {
  try {
    const existing = fs.existsSync(SETTINGS_FILE)
      ? JSON.parse(fs.readFileSync(SETTINGS_FILE, 'utf-8'))
      : {};

    const safeBody = { ...(req.body || {}) };
    delete safeBody.githubToken;
    delete safeBody.geminiApiKey;
    delete safeBody.passcode;

    const updated = { ...existing, ...safeBody, updatedAt: new Date().toISOString() };
    fs.writeFileSync(SETTINGS_FILE, JSON.stringify(updated, null, 2), 'utf-8');
    return res.json({ success: true, settings: updated });
  } catch (err) {
    console.error('Studio settings save error:', err);
    return res.status(500).json({ error: 'خطا در ذخیره‌سازی تنظیمات استودیو.' });
  }
});

// =========================================================================
// ۶. پاسخ ۴۰۴ به صورت JSON برای تمام روت‌های ناموجود /api/* (جلوگیری از ارسال index.html)
// =========================================================================
app.all('/api/*', (_req, res) => {
  return res.status(404).json({ error: 'مسیر API درخواستی یافت نشد.' });
});

// =========================================================================
// ۸. میزبانی استاتیک و Vite
// =========================================================================
app.use('/uploads', express.static(path.join(PUBLIC_DIR, 'uploads')));

if (process.env.NODE_ENV === 'production') {
  app.use(express.static(path.join(__dirname, 'dist')));
  app.get('*', (_req, res) => {
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

function rotateAnalyticsData() {
  try {
    const events = readAnalyticsEvents();
    if (events.length > 5000) {
      const rotatedEvents = events.slice(-3000); // Keep last 3000 events
      writeAnalyticsEvents(rotatedEvents);
      logger.info('Analytics data rotated', { timestamp: new Date().toISOString() });
    }
  } catch (err) {
    logger.error('Error rotating analytics data:', err);
  }
}

// Call this periodically
setInterval(rotateAnalyticsData, 24 * 60 * 60 * 1000); // Daily

app.listen(PORT, '0.0.0.0', () => {
  logger.info('Server started', { port: PORT, env: process.env.NODE_ENV });
  console.log(`Server listening on http://0.0.0.0:${PORT}`);
});
