# راهنمای راه‌اندازی سایت روی Cloudflare Pages

این سایت یک اپلیکیشن استاتیک React است که در Cloudflare Pages میزبانی می‌شود.
تنها بک‌اند آن Pages Functions است (پوشه `functions/`) و محتوا در مخزن گیت‌هاب نگهداری می‌شود.
هیچ D1، R2، Supabase یا سرور Expressی در پروژه وجود ندارد.

## چرا بعد از هر deploy سایت چند دقیقه سفید می‌شد؟

فایل `public/_redirects` قاعده‌ی `/*  /index.html  200` داشت. این قاعده فقط وقتی
اجرا می‌شود که فایل استاتیک پیدا نشود؛ پس درخواست `/assets/index-OLD.js` هم
`index.html` می‌گرفت. چون `public/_headers` برای `/assets/*` مقدار
`Cache-Control: immutable` می‌گذاشت، همان HTML با کد ۲۰۰ به مدت یک سال در کش
لبه‌ی کلادفلر و مرورگر ذخیره می‌شد. نتیجه: مرورگر به‌جای جاوااسکریپت، HTML
می‌گرفت، ماژول اجرا نمی‌شد و صفحه سفید می‌ماند تا آن ورودی کش منقضی شود.

نکته‌ی مهم‌تری که در عمل معلوم شد: Cloudflare Pages وقتی فایلی پیدا نکند، حتی به
خودِ `context.next()` هم `200 text/html` برمی‌گرداند (یعنی همان `index.html`).
پس `_middleware` هرگز کد ۴۰۴ نمی‌بیند و تنها راه تشخیص «فایل گم‌شده» این است که
به نوع پاسخ نگاه کنیم.

الان:

- `_redirects` هیچ fallbackی ندارد.
- `functions/_middleware.ts` فقط درخواست‌های ناوبری (`Accept: text/html`) را به
  `index.html` می‌فرستد. هر مسیری که پسوند فایل دارد و پاسخش HTML باشد،
  ۴۰۴ ساده با `Cache-Control: no-store` می‌گیرد.
- کش `/assets/*` از «یک سال immutable» به ۵ دقیقه تغییر کرد تا هر خرابی موقت
  خودش ترمیم شود.
- یک اسکریپت کوچک در `index.html` اگر ماژول اصلی بارگذاری نشود، یک بار با آدرس
  تازه صفحه را دوباره بارگذاری می‌کند و تا آن لحظه «در حال بارگذاری…» نشان
  می‌دهد، نه صفحه سفید.

آزمون دستی سریع بعد از هر deploy:

```powershell
curl.exe -sS -o NUL -w "%{http_code} %{content_type}`n" https://sinazarghami.ir/assets/does-not-exist.js
# باید 404 text/plain; charset=utf-8 باشد، نه 200 text/html
```

## چرا ورود به پنل قبلاً کار نمی‌کرد؟

پنل مدیریت رمز را به آدرس `/api/auth/verify` می‌فرستاد، اما در نسخه‌ی منتشرشده پوشه‌ی
`functions/` وجود نداشت؛ یعنی هیچ کدی روی سرور نبود که رمز را بررسی کند. برای همین هر رمزی
اشتباه حساب می‌شد. حالا این مسیر ساخته شده و بعد از اولین deploy کار می‌کند.

`ADMIN_SESSION_SECRET` تنها وقتی مقصر است که تنظیم نشده باشد؛ در آن صورت پاسخ خطای
`503 ADMIN_SESSION_SECRET is not configured` برمی‌گردد.

## ۱. تنظیمات پروژه Pages

Cloudflare Dashboard → Workers & Pages → پروژه‌ی سایت → Settings → Builds & deployments:

| فیلد | مقدار |
| --- | --- |
| Production branch | `main` |
| Build command | `npm run build` |
| Build output directory | `dist` |
| Root directory | `/` |
| Node version | `22` |

پوشه‌ی `functions/` به‌صورت خودکار شناسایی می‌شود و نیازی به تنظیم جداگانه ندارد.
مطمئن شو پروژه به مخزن `szarghami/sinazarghami.ir` وصل است.

## ۲. Variables و Secrets

مسیر: پروژه → Settings → Variables and Secrets → Production (و در صورت نیاز Preview).

### مقادیر عادی (Plaintext)

| نام | مقدار |
| --- | --- |
| `GITHUB_REPO` | `szarghami/sinazarghami.ir` |
| `GITHUB_BRANCH` | `main` |
| `SITE_URL` | `https://sinazarghami.ir` |
| `GEMINI_MODEL` | `gemini-2.5-flash` |
| `NODE_VERSION` | `22` |
| `ARVAN_S3_ENDPOINT` | `https://s3.ir-thr-at1.arvanstorage.ir` |
| `ARVAN_S3_REGION` | `ir-thr-at1` |
| `ARVAN_S3_BUCKET` | `sinazarghamimedia` |
| `ARVAN_PUBLIC_BASE` | `https://s3.ir-thr-at1.arvanstorage.ir/sinazarghamimedia` |
| `ARVAN_MEDIA_PREFIX` | `media` |

### مقادیر محرمانه (Secret)

روی دکمه‌ی Encrypt / Add secret بزن؛ این مقادیر نباید در کد یا چت نوشته شوند.

| نام | کاربرد |
| --- | --- |
| `ADMIN_INITIAL_PASSCODE` | رمز اولیه‌ی ورود به پنل (حداقل ۸ کاراکتر) |
| `ADMIN_SESSION_SECRET` | امضای کوکی نشست (حداقل ۳۲ کاراکتر تصادفی) |
| `GITHUB_TOKEN` | خواندن و نوشتن محتوا و عکس‌ها در مخزن |
| `GEMINI_API_KEY` | پیشنهاد متن و ترجمه‌ی خودکار |
| `TELEGRAM_BOT_TOKEN` | ارسال پیام فرم‌ها و اعلان‌ها |
| `TELEGRAM_CHAT_ID` | مقصد پیام‌های تلگرام |
| `ARTICLE_CRON_SECRET` | محافظ تولید مقاله‌ی روزانه |
| `ARVAN_S3_ACCESS_KEY` | کلید دسترسی فضای ابری آروان (بخش ۳.۲) |
| `ARVAN_S3_SECRET_KEY` | کلید محرمانه‌ی فضای ابری آروان (بخش ۳.۲) |

نکته: کد هم `ADMIN_SESSION_SECRET` و هم `SESSION_SECRET` را می‌پذیرد؛ فقط یکی کافی است.

## ۳. KV برای رمز، دستگاه‌ها و آپلود تکه‌ای

KV برای سه چیز لازم است: تغییر رمز، فهرست دستگاه‌ها، و **انتشار محتوا/آپلود عکس**
(تکه‌های آپلود یک ساعت در KV نگه داشته می‌شوند و بعد از ساخت فایل نهایی پاک می‌شوند).
بدون KV فقط ورود با رمز اولیه کار می‌کند و هر ذخیره‌سازی با خطای
`ADMIN_KV is not configured` متوقف می‌شود.

1. Workers & Pages → KV → Create a namespace
2. نام: `sinazarghami-admin`
3. پروژه‌ی سایت → Settings → Functions → KV namespace bindings
4. Variable name: `ADMIN_KV` — Namespace: `sinazarghami-admin`
5. برای Production و Preview جداگانه اضافه کن.

بعد از وصل‌کردن، یک‌بار `https://sinazarghami.ir/api/health?deep=1` را باز کن؛ باید
`"kv": { "bound": true, "ok": true }` ببینی.

## ۳.۱. چرا ارسال‌ها تکه‌تکه می‌شوند؟

اندازه‌گیری روی همین دامنه نشان داد درخواست‌های سنگین روی برخی شبکه‌ها (به‌خصوص
موبایل ایران) بی‌صدا قطع می‌شوند: درخواست حدود ۱۵ ثانیه معلق می‌ماند و بعد
`ERR_CONNECTION_RESET` می‌دهد. مرزهای اندازه‌گیری‌شده:

- بدنه‌ی `POST` تا ۴۰ کیلوبایت سالم است و از حدود ۴۸ کیلوبایت قطع می‌شود.
- `URL` تا حدود ۲۴ هزار کاراکتر سالم است و از ۳۲ هزار کاراکتر قطع می‌شود.

به همین دلیل پنل محتوا و عکس را به تکه‌های ۱۲ کیلوبایتی می‌شکند، هر تکه را جدا
می‌فرستد و در پایان سرور آن‌ها را به هم می‌چسباند و در گیت‌هاب کامیت می‌کند.
تکه‌ها سه‌تا سه‌تا ارسال می‌شوند و اگر یکی قطع شود فقط همان تکه دوباره فرستاده
می‌شود؛ آپلود از صفر شروع نمی‌شود. این کار از «صفحه‌ی سفید و اسپینر بی‌پایان»
بعد از هر تغییر جلوگیری می‌کند.

بعضی شبکه‌ها (از جمله برخی اپراتورهای ایران) بدنه‌ی POST را کند می‌کنند یا
می‌اندازند، در حالی که GET سالم و سریع است. به همین دلیل کانال پیش‌فرض `GET`
است و پنل فقط در صورت شکست آن سراغ POST می‌رود:

1. `GET` با داده در query string (`?p=` یا `?data=`) — پیش‌فرض
2. `POST` با `application/json`
3. `POST` با `text/plain` و بدنه‌ی base64url

دکمه‌ی «اجرای تست اتصال» در تب انتشار، وضعیت هر سه کانال و بزرگ‌ترین اندازه‌ی سالم
را نشان می‌دهد. اگر کانال اول قطع شد، لازم نیست کاری کنی؛ ذخیره و انتشار خودش
کانال بعدی را انتخاب می‌کند.

## ۳.۲. آروان کلاود — فضای ابری عکس و ویدیو (S3)

عکس‌ها و ویدیوهای پنل مستقیم در «فضای ابری آروان» (Object Storage سازگار با S3)
ذخیره می‌شوند و فقط آدرس عمومی آن‌ها داخل `site-data.json` می‌نشیند. اگر آروان
تنظیم نشده باشد یا آپلود شکست بخورد، مسیر قدیمی گیت‌هاب به‌عنوان جایگزین اجرا
می‌شود؛ پس پنل هیچ‌وقت قفل نمی‌شود. کلیدها هرگز به مرورگر نمی‌روند؛ مرورگر فقط
لینک امضاشده‌ی کوتاه‌عمر (presigned) می‌گیرد.

### ۳.۲.۱. ساخت باکت

1. پنل آروان → «فضای ابری» (Object Storage) → فعال‌سازی سرویس.
2. باکت جدید:
   - نام: `sinazarghamimedia` (فقط حروف کوچک انگلیسی و رقم؛ نقطه و خط تیره نگذار)
   - سطح دسترسی: **عمومی (Public Read)**
   - منطقه: `ir-thr-at1` (تهران)
3. آدرس عمومی فایل‌ها: `https://s3.ir-thr-at1.arvanstorage.ir/sinazarghamimedia/media/...`

### ۳.۲.۲. کلید دسترسی

Object Storage → «کلیدهای دسترسی» → ساخت کلید جدید. `Access Key` و `Secret Key`
را همان لحظه کپی کن؛ Secret بعداً نمایش داده نمی‌شود.

### ۳.۲.۳. CORS باکت (اجباری)

بدون CORS آپلود مستقیم از مرورگر شکست می‌خورد. تنظیمات باکت → CORS:

| فیلد | مقدار |
| --- | --- |
| AllowedOrigins | `https://sinazarghami.ir`، `https://www.sinazarghami.ir`، `http://localhost:5173`، `http://localhost:8788` |
| AllowedMethods | `GET, HEAD, PUT` |
| AllowedHeaders | `*` |
| ExposeHeaders | `ETag` ← **بدون این، آپلود چندتکه‌ای تمام نمی‌شود** |
| MaxAgeSeconds | `3600` |

### ۳.۲.۴. متغیرهای Cloudflare Pages

مسیر: پروژه → Settings → Variables and Secrets → Production.

| نام | نوع | مقدار |
| --- | --- | --- |
| `ARVAN_S3_ENDPOINT` | Plaintext | `https://s3.ir-thr-at1.arvanstorage.ir` |
| `ARVAN_S3_REGION` | Plaintext | `ir-thr-at1` |
| `ARVAN_S3_BUCKET` | Plaintext | `sinazarghamimedia` |
| `ARVAN_PUBLIC_BASE` | Plaintext | `https://s3.ir-thr-at1.arvanstorage.ir/sinazarghamimedia` |
| `ARVAN_MEDIA_PREFIX` | Plaintext | `media` |
| `ARVAN_S3_ACCESS_KEY` | Secret | Access Key آروان |
| `ARVAN_S3_SECRET_KEY` | Secret | Secret Key آروان |

بعد از ثبت، یک‌بار Redeploy بزن. `https://sinazarghami.ir/api/health` باید
`"arvan": { "configured": true, ... }` برگرداند.

### ۳.۲.۵. تست

1. یک فایل تست در باکت بگذار و آدرس عمومی‌اش را در مرورگر باز کن؛ باید تصویر/فایل را ببینی.
2. با `curl.exe -I` روی همان آدرس، هدر `Content-Type` درست و کد `200` را ببین.
3. برای ویدیو، درخواست بازه‌ای بزن؛ باید `206 Partial Content` بدهد:

```powershell
curl.exe -sS -o NUL -w "%{http_code}`n" -H "Range: bytes=0-1023" "https://s3.ir-thr-at1.arvanstorage.ir/sinazarghamimedia/media/test.mp4"
```

4. از پنل یک عکس آپلود کن؛ در تب شبکه باید یک `PUT` به `arvanstorage.ir` ببینی و
   آدرس نهایی داخل `site-data.json` با `https://s3.ir-thr-at1.arvanstorage.ir/` شروع شود.

### ۳.۲.۶. محدودیت‌ها و هزینه

- پلن رایگان: ۵ گیگابایت فضا و ۲۰ گیگابایت ترافیک در ماه.
- ترنسکد ویدیو و CDN آروان **لازم نیست** و در کد استفاده نشده.
- پخش ویدیو با MP4 معمولی و درخواست بازه‌ای (Range) انجام می‌شود؛ اگر بعداً
  پلی‌لیست HLS (`.m3u8` + تکه‌ها) خودت داشتی، همان لینک هم پخش می‌شود.
- آپلودها چندتکه‌ای (۸ مگابایتی) هستند؛ اگر اینترنت وسط کار قطع شود، فقط
  تکه‌های باقی‌مانده دوباره فرستاده می‌شوند.

## ۴. توکن گیت‌هاب

GitHub → Settings → Developer settings → Fine-grained tokens → Generate new token:

- Repository access: فقط `szarghami/sinazarghami.ir`
- Permissions → Contents: **Read and write**
- Permissions → Metadata: **Read-only**
- هیچ دسترسی دیگری (Actions، Workflows، Secrets) لازم نیست.

## ۵. رمز اولیه و ورود

1. `ADMIN_INITIAL_PASSCODE` را در Cloudflare ثبت کن و یک‌بار Redeploy بزن.
2. آدرس `https://sinazarghami.ir/studio` را باز کن.
3. رمز اولیه را وارد کن.
4. بعد از ورود، از تب «امنیت» رمز را عوض کن.

بعد از تغییر رمز، مقدار `ADMIN_INITIAL_PASSCODE` دیگر استفاده نمی‌شود و هش رمز جدید در KV
ذخیره می‌ماند. پیشنهاد می‌شود بعد از تست موفق، مقدار رمز اولیه را از Cloudflare حذف کنی.

## ۶. ثبت در GitHub برای تولید مقاله‌ی روزانه

GitHub → مخزن → Settings → Secrets and variables → Actions → New repository secret:

- Name: `ARTICLE_CRON_TOKEN`
- Value: همان مقدار `ARTICLE_CRON_SECRET` در Cloudflare

## ۷. چک‌لیست بعد از deploy

- [ ] `https://sinazarghami.ir/` بدون اسپینر بی‌پایان باز می‌شود.
- [ ] `https://sinazarghami.ir/studio` صفحه‌ی پنل را نشان می‌دهد.
- [ ] `https://sinazarghami.ir/api/health?deep=1` همه‌ی موارد را «تنظیم شده» نشان می‌دهد.
- [ ] ورود با رمز اولیه موفق است.
- [ ] تغییر رمز از تب امنیت ذخیره می‌شود.
- [ ] آپلود یک عکس تست، فایل را در `public/media/` مخزن می‌گذارد.
- [ ] آپلود یک عکس تست، فایل را در باکت آروان می‌گذارد و آدرس `arvanstorage.ir` برمی‌گردد.
- [ ] آپلود یک ویدیو تست، با آپلود چندتکه‌ای انجام می‌شود و در پلیر پخش می‌شود.
- [ ] دکمه‌ی «ذخیره و انتشار»، فایل `public/site-data.json` و معادل انگلیسی را در مخزن کامیت می‌کند.
- [ ] فرم تماس پیام را به تلگرام می‌فرستد.

## ۸. خطاهای رایج

| نشانه | علت | راه‌حل |
| --- | --- | --- |
| `503 ADMIN_SESSION_SECRET is not configured` | Secret تنظیم نشده | مقدار را در Cloudflare اضافه و Redeploy کن |
| `401 رمز عبور نادرست است` | رمز با مقدار Cloudflare نمی‌خواند | مقدار `ADMIN_INITIAL_PASSCODE` را بررسی کن |
| `503 ADMIN_KV is not configured` هنگام تغییر رمز | KV وصل نیست | بخش ۳ را انجام بده |
| `503 ADMIN_KV is not configured` هنگام ذخیره یا آپلود | KV وصل نیست | بخش ۳ را انجام بده |
| `پاسخ سرور HTML بود` یا `خطای ۴۰۴` هنگام ورود | نسخه‌ی قدیمی سایت بدون `functions/` منتشر شده | آخرین کامیت را push کن و Redeploy بزن |
| انتشار انجام می‌شود ولی سایت تغییر نمی‌کند | کش مرورگر یا کش Pages | چند دقیقه صبر کن و با `Ctrl+Shift+R` صفحه را نو کن |
| `503 GITHUB_TOKEN is not configured` | توکن گیت‌هاب ثبت نشده | بخش ۴ را انجام بده |
| `503 GEMINI_API_KEY در Cloudflare تنظیم نشده است` | کلید جمینای ثبت نشده | Secret را اضافه کن |
| آپلود عکس با خطای CORS در کنسول متوقف می‌شود | CORS باکت آروان تنظیم نشده | بخش ۳.۲.۳ را انجام بده |
| `آروان ETag را برنگرداند` | `ExposeHeaders` شامل `ETag` نیست | در CORS باکت `ETag` را به ExposeHeaders اضافه کن |
| `503 تنظیمات آروان کامل نیست` | متغیرهای `ARVAN_*` ثبت نشده‌اند | بخش ۳.۲.۴ را انجام بده و Redeploy کن |
| آپلود در آروان شکست می‌خورد ولی عکس ذخیره می‌شود | مسیر جایگزین گیت‌هاب فعال شده | پیام هشدار پنل را ببین و تنظیمات آروان را درست کن |
| صفحه سفید بعد از تغییر | نسخه‌ی قدیمی فونت/تصاویر خارجی را blocking لود می‌کرد | با نسخه‌ی فعلی برطرف شده؛ کش مرورگر را پاک کن |

## اجرای محلی (اختیاری)

```bash
npm install
npm run build
npx wrangler pages dev dist
```

فایل `.dev.vars.example` را به `.dev.vars` کپی کن و مقادیر تست را داخلش بگذار.
