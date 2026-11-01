# خلاصه و وضعیت کامل پروژه سینا ضرغامی

**آخرین بازبینی:** ۳۱ اکتبر ۲۰۲۶  
**وضعیت:** مهاجرت اولیه APIها برای Cloudflare Pages در کد پیاده‌سازی شده؛ برای فعال‌شدن در محیط واقعی، ساخت منابع D1/R2، پرکردن شناسه D1 و تنظیم Secrets و دامنه رسانه لازم است. این تغییرات هنوز در Cloudflare منتشر یا با منابع واقعی آن end-to-end آزمایش نشده‌اند.

---

## ۱. خلاصه اجرایی

- محصول یک وب‌سایت تک‌صفحه‌ای React 19 و TypeScript است؛ با Vite ساخته می‌شود و خروجی فرانت‌اند در `dist/` قرار می‌گیرد.
- میزبان production طبق تأیید مالک پروژه، **Cloudflare Pages** است و مخزن متصل `szarghami/sinazarghami-aistudio-site` است. فایل `.github/workflows/deploy.yml` یک workflow قدیمی GitHub Pages است و معماری استقرار production محسوب نمی‌شود.
- Pages به‌تنهایی سرور Express را اجرا نمی‌کند. APIهای لازم پنل اکنون در `functions/api/` به‌صورت Pages Functions پیاده‌سازی شده‌اند؛ `server.ts` عمداً باقی مانده تا مسیر بازگشت موجود باشد، اما هنوز باید جداگانه از نظر syntax و کارکرد اصلاح/بررسی شود.
- معماری هدف: **Cloudflare Pages Functions + D1 برای داده و analytics + R2 برای عکس + Cloudflare Secrets برای کلیدها**.
- پنل مدیر، ترجمه و تحلیل تصویر Gemini، ذخیره محتوا، analytics، اعلان تلگرام و همگام‌سازی اختیاری GitHub دارای routeهای متناظر Pages Functions هستند.
- ویدیوها فعلاً فقط با URL/embed نمایش داده می‌شوند؛ upload و transcode ویدیو خارج از این مرحله است.
- تا زمان ساخت منابع Cloudflare، تنظیم متغیرها و تست preview، APIهای جدید برای production آماده cutover نیستند. از deploy کردن این کد با bindings ناقص خودداری شود.

## ۲. معماری و مسیر داده

```text
مرورگر
  ├─ Vite/React SPA (src/ → dist/)
  ├─ localStorage: فقط cache و fallback محلی محتوا؛ نه مرجع مجاز احراز هویت
  └─ same-origin /api/*
       └─ Cloudflare Pages Functions (functions/api/)
            ├─ D1 (DB): محتوای سایت، credential hash، رخدادهای analytics و rate limit
            ├─ R2 (MEDIA): عکس‌ها و تصاویر مهاجرت‌یافته از data URL
            ├─ Cloudflare Secrets: Gemini / Telegram / GitHub / رمز اولیه / session HMAC
            └─ APIهای خارجی: Google Gemini، Telegram، GitHub Contents API

Fallback محتوای اولیه: /site-data.json (از public/site-data.json در build کپی می‌شود)
ویدیوها: URL/embedهای فعلی — بدون تغییر به upload جدید
```

### جریان محتوای سایت

1. `GET /api/site-data` ابتدا محتوا را از D1 می‌خواند؛ اگر هنوز در D1 نیست، با `context.next()` فایل استاتیک `/site-data.json` را می‌خواند.
2. تغییرات کاربر در localStorage cache می‌شوند و به `POST /api/site-data` می‌روند. ذخیره پایدار نیازمند session مدیر معتبر است.
3. POST مدیر پیش از ثبت محتوا، data URLهای معتبر JPEG/PNG/WebP را پیدا می‌کند، در R2 قرار می‌دهد و رشته‌ها را با URL عمومی جایگزین می‌کند؛ سپس محتوای نرمال‌شده را در D1 ذخیره و برمی‌گرداند.
4. دکمه انتشار در پنل نتیجه ذخیره سرور را بررسی می‌کند. اگر GitHub Secrets فعال باشد، همگام‌سازی اختیاری به فایل `public/site-data.json` در شاخه `main` انجام می‌شود؛ token/repo/path از مرورگر پذیرفته نمی‌شود.

### جریان احراز هویت مدیر

- `POST /api/auth/verify` رمز ورودی را با credential اولیه Cloudflare یا hash موجود در D1 بررسی می‌کند.
- رمز bootstrap در اولین ورود موفق با PBKDF2-SHA-256 و salt تصادفی در D1 hash می‌شود. رمز در پاسخ API یا localStorage بازگردانده نمی‌شود.
- session با HMAC-SHA-256 امضا و در کوکی `HttpOnly; Secure; SameSite=Strict` با عمر ۱۲ ساعت قرار می‌گیرد.
- تمام APIهای mutation و عملیات حساس (ذخیره محتوا، تغییر رمز، upload، Gemini، sync GitHub و analytics summary/report) session را سمت سرور بررسی می‌کنند. رخداد عمومی analytics و اعلان‌های عمومی فرم تماس مسیرهای public محدودشده‌اند.
- رمز حداقل ۸ نویسه لازم دارد. بازیابی خودکار رمز از Telegram غیرفعال است؛ رمزهای قدیمی مرورگر به سرور منتقل نمی‌شوند.

### رسانه و فایل‌ها

- تصاویر جدید در پنل با WebP فشرده و از `POST /api/upload-r2` بارگذاری می‌شوند.
- API فقط JPEG/PNG/WebP قبول می‌کند، امضای باینری را بررسی می‌کند و سقف فایل ۱۰ MiB دارد؛ در خطا، تصویر Base64 به‌عنوان بارگذاری موفق استفاده نمی‌شود.
- R2 به یک دامنه HTTPS عمومی/مخصوص رسانه نیاز دارد که در `MEDIA_PUBLIC_URL` تنظیم می‌شود. Bucket نباید عمومیِ قابل‌نوشتن باشد؛ دسترسی نوشتن فقط از Function دارای binding انجام می‌شود.
- تبدیل data URLهای ذخیره‌شده در محتوای موجود فقط هنگام اولین POST موفق محتوای سایت انجام می‌شود. پیش از آن backup بگیرید و دامنه R2 را آزمایش کنید.

## ۳. APIهای Pages Functions پیاده‌سازی‌شده

| Route | کاربرد و دسترسی |
|---|---|
| `GET /api/site-data` | خواندن از D1؛ fallback به asset استاتیک در نبود رکورد |
| `POST /api/site-data` | مدیر-محافظت‌شده؛ اعتبارسنجی ساختار، انتقال data URLها به R2 و ذخیره D1 |
| `POST /api/auth/verify` | ورود مدیر و تنظیم کوکی session |
| `GET /api/auth/verify` | بررسی اعتبار session؛ پاسخ فقط authenticated boolean |
| `DELETE /api/auth/verify` | خروج و پاک‌کردن کوکی session |
| `GET /api/passcode` | عمداً رمز را برنمی‌گرداند؛ پاسخ 405 |
| `POST /api/passcode` | تغییر رمز مدیر با session معتبر؛ PBKDF2 در D1 |
| `POST /api/upload-r2` | آپلود مدیر-محافظت‌شده به R2؛ فقط JPEG/PNG/WebP و حداکثر ۱۰ MiB |
| `POST /api/translate` | ترجمه Gemini برای مدیر احراز‌شده؛ کلید فقط در Secret سرور |
| `POST /api/gemini/suggest-photo-details` | تحلیل عکس Gemini برای مدیر؛ URL عکس HTTPS و allowlist شده |
| `POST /api/github/sync` | sync مدیر با Secret سرور؛ repo از تنظیمات، مسیر ثابت `public/site-data.json` |
| `POST /api/analytics/event` | ثبت رخداد public؛ payload حداکثر ۲ KiB، محدودیت ۴۰ درخواست/IP/دقیقه، retention برابر ۱۸۰ روز |
| `GET /api/analytics/summary` | خلاصه analytics برای مدیر احراز‌شده |
| `POST /api/analytics/send-telegram-report` | ارسال گزارش analytics به Telegram برای مدیر |
| `POST /api/telegram/notify` | اعلان عمومی فرم‌ها/پنل؛ محدودیت ۱۰ درخواست/IP/ساعت؛ token فقط Secret |

پیاده‌سازی و helperهای مشترک در `functions/api/` قرار دارند. routeهای Gemini، analytics، GitHub، Telegram و auth زیرپوشه‌های هم‌نام دارند.

## ۴. ساختار پوشه‌های پروژه و مسئولیت‌ها

### پوشه‌های اصلی پروژه

```text
.claude/                 تنظیمات محلی Claude Code (از runtime سایت نیست)
.github/workflows/       workflowهای قدیمی GitHub Actions
.vscode/                 تنظیمات و پیشنهاد افزونه‌های VS Code
api/                     فایل پایتون موجود content_models.py؛ مستقل از Pages Functions
functions/api/           Cloudflare Pages Functions برای APIهای /api/*
migrations/              migrationهای SQL پایگاه داده D1
public/                  فایل‌های استاتیک Vite که بدون پردازش به dist کپی می‌شوند
  portfolio/             مسیر placeholder برای فایل/مدیای استاتیک
src/                     کد اپ React، صفحات، داده اولیه، utilityها و typeها
dist/                    خروجی تولیدشده build؛ نباید منبع اصلی ویرایش باشد
node_modules/             وابستگی‌های نصب‌شده؛ تولیدی و خارج از کنترل نسخه
.git/                    metadata داخلی مخزن Git
```

### ساختار جزئی و ارتباط اجزا

```text
src/
  App.tsx                 state اصلی محتوا، routing با History API و اتصال به صفحات
  main.tsx                نقطه ورود React
  index.css               استایل سراسری و Tailwind
  components/             UI سایت و admin
    AdminStudioModal.tsx  مدیریت محتوا، ورود مدیر، upload، Gemini، انتشار و sync
    AdminAnalyticsTab.tsx پنل گزارش analytics
    Hero.tsx, Navbar.tsx, Footer.tsx و بخش‌های گالری/سفر/رزومه/مقالات/خدمات...
  data/initialData.ts     محتوای اولیه/fallback برای SiteContent
  types/index.ts          مدل SiteContent و انواع UI/analytics
  utils/
    storage.ts            cache محلی، fetch/save محتوای سایت، helpers compression و auth client
    supabase.ts           نام فایل قدیمی؛ اکنون upload به R2 و helper URL، بدون Supabase upload
    aiTranslator.ts       caller سمت مرورگر برای /api/translate و fallback محلی متن
    analytics.ts          ثبت event و خواندن analytics از API
    telegram.ts           caller same-origin به API تلگرام؛ بدون bot token در bundle
    githubMediaService.ts image upload را به R2 می‌فرستد؛ دیگر GitHub Contents API مستقیم ندارد
    cryptoVault.ts        utility قدیمی رمزنگاری مرورگر؛ در مسیر جاری call site ندارد

functions/
  api/
    _shared/runtime.ts    env/bindings، JSON response، auth/session، hash passcode و مهاجرت تصاویر embedded
    site-data.ts          GET/POST محتوای D1 و fallback asset
    passcode.ts           تغییر رمز و ردّ GET رمز
    auth/verify.ts        login/session check/logout
    upload-r2.ts          اعتبارسنجی عکس و ذخیره در R2
    translate.ts          proxy ترجمه Gemini
    gemini/suggest-photo-details.ts تحلیل عکس Gemini
    github/sync.ts        GitHub sync سمت سرور
    analytics/            event، summary و Telegram report
    telegram/notify.ts    ارسال اعلان از Cloudflare به Telegram

migrations/0001_initial.sql
  app_state              key/value محتوای سایت
  admin_credentials      salt و PBKDF2 hash مدیر
  analytics_events       رخدادها و indexها
  api_limits             شمارنده‌های محدودیت نرخ بر مبنای IP hash
```

### پوشه‌ها/فایل‌های دیگر

- `public/site-data.json`: داده استاتیک fallback؛ در build به `/site-data.json` تبدیل می‌شود.
- `public/CNAME`: دامنه‌ی static site.
- `public/portfolio/`: در حال حاضر placeholder (`.gitkeep`).
- `api/content_models.py`: محتوای جداگانه در Python؛ در API Pages این مهاجرت استفاده نمی‌شود.
- `.github/workflows/deploy.yml`: deploy قدیمی GitHub Pages؛ Cloudflare Pages منبع production است.
- `.github/workflows/video-processor.yml`: workflow قدیمی FFmpeg برای چانک ویدیو؛ در این مهاجرت فعال/تغییر داده نشده و ویدیوها URL/embed می‌مانند.
- `dist/`: خروجی build. محتویات تولیدی و قابل بازتولید است.
- `node_modules/`, `.git/`, `.claude/`, `.vscode/`: ابزار/تنظیمات توسعه، نه منطق runtime سایت.

## ۵. فایل‌های اصلی تغییرکرده در این مرحله

- `functions/api/**`: اضافه‌شدن endpointها و helperهای Pages Functions.
- `migrations/0001_initial.sql`: schema اولیه D1.
- `wrangler.toml`: تعریف خروجی Pages و bindingهای D1/R2؛ شناسه D1 عمداً placeholder است.
- `.dev.vars.example`: نمونه نام متغیرهای local؛ حاوی credential واقعی نیست.
- `tsconfig.functions.json`: type-check مستقل برای Pages Functions.
- `package.json`: اسکریپت‌های `lint:pages` و `pages:dev`.
- `.gitignore`: نادیده‌گرفتن `.dev.vars`.
- `src/utils/storage.ts`: حذف رمز محلی/دریافت passcode و ورود از مسیر سرور.
- `src/utils/supabase.ts`: جایگزینی Supabase/local-server/Base64 fallback با upload صریح R2.
- `src/utils/telegram.ts`: حذف token از frontend و ارسال از API same-origin.
- `src/utils/githubMediaService.ts`: حذف استفاده مستقیم از GitHub Contents API برای آپلود عکس و واگذاری عکس به R2.
- `src/App.tsx`, `src/components/AdminStudioModal.tsx`: اتصال workflow مدیر به session cookie، upload R2 و GitHub Secret سمت سرور.
- `src/utils/aiTranslator.ts`, `src/utils/analytics.ts`: callerهای موجود برای APIهای حفظ‌شده.
- `CLOUDFLARE_SETUP.md`: راهنمای راه‌اندازی، migration و rollback.

## ۶. راه‌اندازی موردنیاز Cloudflare (هنوز اجرا نشده)

1. در حساب Cloudflare متصل به Pages، D1 به نام `sina-site-data` و R2 به نام `sina-site-images` بسازید.
2. شناسه واقعی D1 را جایگزین `REPLACE_WITH_CLOUDFLARE_D1_DATABASE_ID` در `wrangler.toml` کنید. نام bindingها باید `DB` و `MEDIA` بماند.
3. migration را با `npx wrangler d1 migrations apply sina-site-data --remote` اجرا کنید.
4. برای R2 یک دامنه HTTPS مناسب media بسازید و `MEDIA_PUBLIC_URL` را بدون slash انتهایی تنظیم کنید.
5. در محیط‌های Preview و Production متغیرها/Secrets لازم را جداگانه اضافه کنید:
   - Secrets: `ADMIN_INITIAL_PASSCODE`, `ADMIN_SESSION_SECRET`, `GEMINI_API_KEY`.
   - اختیاری: `TELEGRAM_BOT_TOKEN`, `TELEGRAM_CHAT_ID`, `GITHUB_TOKEN`.
   - Variable: `MEDIA_PUBLIC_URL`; برای GitHub sync همچنین `GITHUB_REPOSITORY=szarghami/sinazarghami-aistudio-site`.
6. یک password اولیه جدید و یکتا (حداقل ۸ نویسه) تعیین کنید. بعد از login اولیه و ذخیره hash در D1، Secret اولیه را حذف و رمز را از پنل تغییر دهید.
7. token قدیمی Telegram را باطل/تعویض کنید چون قبلاً در frontend source موجود بوده؛ token جدید را فقط به‌عنوان Secret اضافه کنید.
8. build command در Cloudflare Pages: `npm run build` و output directory: `dist`. وجود `functions/` در ریشه مخزن باید در deployment باقی بماند.
9. در local، `.dev.vars.example` را به `.dev.vars` کپی و مقادیر آزمایشی را جایگزین کنید؛ `.dev.vars` در Git ignore شده است. `npm run pages:dev` از Wrangler برای اجرای واقعی Pages Functions استفاده می‌کند؛ `npm run dev` همچنان Express قدیمی را اجرا می‌کند.
10. پیش از production cutover، backup `site-data.json` و محتوای جاری بگیرید و Preview را با D1/R2 واقعی یا منابع آزمایشی end-to-end بررسی کنید.

جزئیات دستورها و rollback در [CLOUDFLARE_SETUP.md](CLOUDFLARE_SETUP.md) است.

## ۷. وضعیت بررسی و آزمون

| بررسی | نتیجه |
|---|---|
| `npm run build` | موفق؛ Vite build کامل شد. هشدار bundle جاوااسکریپت بالای 500 KiB باقی است. |
| `npm run lint:pages` | موفق؛ تمام Pages Functions با `tsconfig.functions.json` type-check شدند. |
| `npm run lint` | ناموفق به‌علت خطاهای syntax از قبل موجود در `server.ts` (از جمله خط ۳۳ و تعداد زیادی خط بعدی). این خطا به Pages Functions محدود نیست و در baseline هم مشاهده شد. |
| Pages runtime محلی / Wrangler | اجرا نشد؛ Wrangler نصب نیست و Cloudflare bindings/credentials هنوز ساخته یا تنظیم نشده‌اند. |
| Cloudflare Preview/Production end-to-end | انجام نشده؛ نیازمند دسترسی و تنظیمات حساب Cloudflare است. |
| تست واحد/Integration runner | در `package.json` test script یا test runner تعریف نشده است. |

**نتیجه:** build فرانت‌اند و type-check مستقل Functions سبز است؛ اما تا راه‌اندازی منابع و تست Pages runtime، نباید ادعا کرد APIهای production کاملاً فعال یا parity end-to-end تأیید شده است.

## ۸. موارد قدیمی/حذفیات و توضیح تغییر آن‌ها

این بخش، اطلاعات قبلی همین فایل را که دیگر توصیف وضعیت فعلی نیستند، نگه می‌دارد تا سابقه گم نشود. موارد «پیشنهادی» قدیمی را نباید اجرای واقعی تلقی کرد.

### مواردی که قبلاً توصیف شده بودند و اکنون جایگزین/اصلاح شدند

- **LocalStorage به‌عنوان دیتابیس اصلی:** در گزارش قبلی به‌عنوان دیتابیس آمده بود. اکنون فقط cache/fallback مرورگر است؛ منبع پایدار هدف D1 است. تا ساخته‌شدن D1، fallback static JSON وجود دارد.
- **Express به‌عنوان backend production:** گزارش قبلی آن را backend پروژه می‌دانست. production طبق تأیید مالک Cloudflare Pages است؛ Express در `server.ts` برای سابقه و rollback حفظ شده، اما Pages آن را اجرا نمی‌کند.
- **Supabase و upload-local/Base64 به‌عنوان مسیر upload:** قبلاً در `src/utils/supabase.ts` استفاده می‌شد. اکنون مسیر جدید فقط R2 است و در شکست upload موفقیت جعلی یا data URL جایگزین نمی‌سازد. فایل قدیمی `src/utils/supabase.ts` به‌دلیل importهای موجود باقی مانده، ولی دیگر ارتباطی با Supabase ندارد.
- **رمز مدیر در localStorage یا API قابل بازیابی:** مسیر قبلی حذف/بی‌اثر شد. اکنون passcode از browser خوانده یا بازگردانده نمی‌شود؛ hash در D1 و session در HttpOnly cookie است. ارسال رمز به Telegram و recovery خودکار حذف شده است.
- **توکن GitHub یا Telegram در frontend:** از مسیر جاری حذف شد. GitHub/Gemini/Telegram credentialها باید فقط Cloudflare Secrets باشند. توکن Telegram قدیمی باید rotate شود چون از source قبلی قابل افشا بوده است.
- **GitHub مستقیم برای آپلود تصاویر:** مسیر فعال جدید R2 است. همگام‌سازی فایل داده به GitHub هنوز optional است، اما فقط backend secret-based و با مقصد محدود `public/site-data.json`.
- **مهاجرت به پوشه‌های فرضی مثل `src/components/portfolio`, `src/utils/ai`, `src/data/content` و ...:** این‌ها در فایل قدیمی به‌عنوان طرح پیشنهاد شده بودند، اما عملاً در repository وجود ندارند و در این کار ایجاد نشده‌اند. ساختار واقعی همان پوشه‌های موجود در بخش ۴ است.
- **`AdminSettings` با فیلدهای passcode/GitHub/Gemini key و فایل‌های `/data/config/*.json`:** الگوی پیشنهادی قبلی است و storage فعلی نیست. credentialها در Cloudflare Secrets/D1 مدیریت می‌شوند؛ هیچ فایل JSON کلیددار در این ساختار ساخته نشده است.
- **فرض وجود تست‌های Jest/Cypress/Playwright یا تست رمزنگاری/مرورگر:** در پروژه test script یا runner تنظیم نشده است. موارد قبلی پیشنهاد بودند، نه تست‌های واقعاً موجود.
- **ترتیب کارهای قدیمی (اصلاح TypeScript، چندصفحه‌ای کردن، HLS، انتقال IndexedDB، Redis):** آن فهرست پیشنهاد گذشته بود و وضعیت اجرا را نشان نمی‌داد. این مرحله سایت را به routing جدید تبدیل نکرده، Redis/IndexedDB اضافه نکرده و upload/transcode ویدیو را انجام نداده است.
- **HLS و مخزن ویدیو:** `.github/workflows/video-processor.yml` و تنظیمات فعلی ویدیو در این مرحله تغییر نکرده‌اند؛ ویدیوها فعلاً فقط URL/embed هستند.

### ادعاهای قدیمی که تأیید نشده‌اند

- خطای قدیمی «`equipment` در `SiteContent` وجود ندارد» با source فعلی همخوان نیست؛ `SiteContent` باید از `src/types/index.ts` بررسی شود.
- پیشنهادهای مربوط به Safari، `scroll-behavior`, نرخ ۵۰ درخواست، PBKDF2 ۵۰٬۰۰۰ تکرار، Redis، IndexedDB، Zod، Jest، Cypress، Playwright، ZAP و Burp در گزارش قبلی مستند شده بودند؛ هیچ‌کدام به‌عنوان تست/تغییر انجام‌شده در این مرحله تأیید نشده‌اند.
- اعداد تکرار PBKDF2 گزارش قبلی (۱۰۰٬۰۰۰) اکنون معیار پیاده‌سازی نیست؛ helper جدید در `functions/api/_shared/runtime.ts` از ۱۵۰٬۰۰۰ iteration استفاده می‌کند.

## ۹. محدودیت‌ها و کارهای بعدی

1. ساخت و تنظیم D1، R2، bindingها، secrets، `MEDIA_PUBLIC_URL` و جایگزینی شناسه‌ی placeholder.
2. rotate کردن Telegram bot token قدیمی و افزودن نسخه جدید فقط در Cloudflare Secret.
3. گرفتن backup از محتوا، اجرای migration و اولین login/publish در Preview؛ شناسایی و بررسی تعداد و انتقال data URLهای تصویری موجود در `site-data.json` به R2.
4. تست ورود/خروج، حفظ/انقضای cookie، تغییر رمز، ممنوعیت write بدون auth، ذخیره/خواندن D1، upload و نمایش عمومی عکس، Gemini، GitHub sync، analytics و Telegram.
5. بررسی code review امنیتی مستقل برای rate limiting، اعتبارسنجی payloadها، و متد fallback `context.next()` با Wrangler واقعی.
6. تصمیم جداگانه درباره رفع یا کنارگذاشتن `server.ts` نامعتبر؛ فعلاً حذف نشده است.
7. بررسی اینکه workflow قدیمی `.github/workflows/deploy.yml` را غیرفعال/آرشیو کنیم یا خیر؛ طبق درخواست مالک، فعلاً دست‌نخورده است.
8. اجرای `npm run lint` بعد از اصلاح syntax baseline در `server.ts`؛ هشدار bundle بالای 500 KiB نیز می‌تواند در کار performance مستقل بررسی شود.

---

## ۱۰. فرمان‌های پروژه

- `npm run build` — build فرانت‌اند در `dist/`.
- `npm run lint` — `tsc --noEmit` کل پروژه؛ فعلاً به‌دلیل `server.ts` fail است.
- `npm run lint:pages` — type-check مستقل Pages Functions.
- `npm run pages:dev` — ابتدا build و سپس `wrangler pages dev dist`؛ نیازمند Wrangler و bindingهای local.
- `npm run dev` — سرور قدیمی `tsx server.ts`؛ Pages Functions را شبیه‌سازی نمی‌کند.
- `npm run preview` — Vite preview؛ Pages runtime و APIهای Functions را اجرا نمی‌کند.
- test script در حال حاضر تعریف نشده است.
