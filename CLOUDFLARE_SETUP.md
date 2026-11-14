# راهنمای راه‌اندازی سایت روی Cloudflare Pages

این سایت یک اپلیکیشن استاتیک React است که در Cloudflare Pages میزبانی می‌شود.
تنها بک‌اند آن Pages Functions است (پوشه `functions/`) و محتوا در مخزن گیت‌هاب نگهداری می‌شود.
هیچ D1، R2، Supabase یا سرور Expressی در پروژه وجود ندارد.

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

اندازه‌گیری روی همین دامنه نشان داد بدنه‌های بزرگ‌تر از حدود ۴۴ کیلوبایت روی برخی
شبکه‌ها (به‌خصوص موبایل ایران) بی‌صدا قطع می‌شوند: درخواست ۱۵ ثانیه معلق می‌ماند و
بعد `ERR_CONNECTION_RESET` می‌دهد. به همین دلیل پنل محتوا و عکس را به تکه‌های
۸ تا ۲۴ کیلوبایتی می‌شکند، هر تکه را جدا می‌فرستد و در پایان سرور آن‌ها را به هم
می‌چسباند و در گیت‌هاب کامیت می‌کند. اگر شبکه خراب باشد، اندازه‌ی تکه خودکار نصف
می‌شود. این کار از «صفحه‌ی سفید و اسپینر بی‌پایان» بعد از هر تغییر جلوگیری می‌کند.

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
| صفحه سفید بعد از تغییر | نسخه‌ی قدیمی فونت/تصاویر خارجی را blocking لود می‌کرد | با نسخه‌ی فعلی برطرف شده؛ کش مرورگر را پاک کن |

## اجرای محلی (اختیاری)

```bash
npm install
npm run build
npx wrangler pages dev dist
```

فایل `.dev.vars.example` را به `.dev.vars` کپی کن و مقادیر تست را داخلش بگذار.
