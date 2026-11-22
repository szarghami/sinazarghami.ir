# وضعیت و معماری پروژه‌ی sinazarghami.ir

آخرین بررسی این سند: **۲۲ نوامبر ۲۰۲۶**. این سند وضعیت فایل‌های موجود در فضای کاری را شرح می‌دهد؛ وجود تغییر در فایل‌های محلی به معنی انتشار آن روی سایت نیست. بخش‌های قدیمی‌تر در انتهای سند به عنوان سابقه نگه داشته شده‌اند و در صورت اختلاف، توضیحات جدیدتر ملاک هستند.

## نمای کلی معماری فعلی

- **رابط کاربری:** React 19، TypeScript، Vite و Tailwind CSS 4. نقطه ورود `index.html` و سپس `src/main.tsx` است. مسیریابی در `src/App.tsx` با History API انجام می‌شود و React Router استفاده نشده است. پنل مدیریت فقط هنگام بازشدن بارگذاری می‌شود.
- **میزبانی و سمت سرور:** Cloudflare Pages فایل‌های استاتیک و Pages Functions داخل `functions/` را ارائه می‌کند. `functions/_middleware.ts` مسیرهای SPA و خطای فایل استاتیک را مدیریت می‌کند. خروجی ساخت در `dist/` تولید می‌شود.
- **محتوا و انتشار:** ساختار کلی در `src/types/index.ts` تعریف شده و محتوای اولیه از `public/site-data.json` می‌آید. برنامه نسخه محلی را نیز نگه می‌دارد و پس از شروع، محتوای به‌روز را دریافت می‌کند. پنل محتوا را از طریق درخواست‌های تکه‌ای به API می‌فرستد؛ سرور آن را در فایل محتوای مخزن GitHub ذخیره می‌کند.
- **فایل‌های رسانه‌ای:** تصاویر و ویدیوها عمدتاً از آروان با URL امضاشده و آپلود مستقیم استفاده می‌کنند. برای تصویر، مسیر جایگزین GitHub هم وجود دارد. فایل‌های قدیمی داخل `public/media/legacy/` قرار دارند. ویدیوها می‌توانند چند منبع داشته باشند؛ کاور دستی و برخی کاورهای قابل تشخیص، از جمله یوتیوب، پشتیبانی می‌شوند.
- **دسترسی مدیریت:** نشست از کوکی HttpOnly استفاده می‌کند؛ اعتبارسنجی و ثبت دستگاه‌ها و بخشی از داده‌های موقت در `ADMIN_KV` انجام می‌شود. مقادیر محرمانه باید در تنظیمات امن Cloudflare باشند، نه در فایل محتوای عمومی.
- **هوش مصنوعی:** راهنمای اصلی لحن در `content/tone.md` است. تنظیم ترتیب Gemini، Anthropic و OpenAI در پنل وجود دارد؛ تنظیمات ترتیب در KV و کلیدها و نام مدل‌های ارائه‌دهنده در محیط سرور نگهداری می‌شوند. سرویس انتخاب‌شده به عنوان پشتیبان شارژی در انتهای ترتیب قرار می‌گیرد. نام و دسترسی مدل‌های Anthropic و OpenAI باید جداگانه تنظیم و تأیید شوند.
- **ترجمه:** پس از ذخیره فارسی، درخواست ترجمه پس‌زمینه اجرا می‌شود. مسیر `translation-retry` و گردش کار GitHub Actions برای تلاش مجدد هر ۳۰ دقیقه در کد وجود دارند. نتیجه در صورت تنظیم تلگرام گزارش می‌شود. این گردش کار به استقرار و تنظیم رمز مشترک نیاز دارد و اجرای موفق آن در محیط واقعی هنوز تأیید نشده است.

### جریان انتشار و ترجمه

1. مدیر محتوا را در پنل تغییر می‌دهد؛ کلاینت نسخه محلی و صف انتشار را نگه می‌دارد و درخواست انتشار را به API ارسال می‌کند.
2. سرور فیلدهای انگلیسی نیازمند ترجمه را مشخص می‌کند و محتوای فارسی را در GitHub ثبت می‌کند؛ ترجمه مانع پاسخ موفق انتشار نمی‌شود.
3. اجرای پس‌زمینه آخرین نسخه محتوا را می‌خواند، فیلدهای لازم را ترجمه می‌کند و در صورت امکان نسخه انگلیسی را با کنترل SHA می‌نویسد. در صورت تغییر هم‌زمان، کار با نسخه قدیمی بازنویسی نمی‌شود و باید دوباره تلاش شود.
4. گردش کار زمان‌بندی‌شده، در صورت تنظیم و فعال‌سازی، درخواست تلاش مجدد را به `/api/translation-retry` می‌فرستد. `TRANSLATION_CRON_SECRET` باید در GitHub و Cloudflare یکسان باشد.

### مسیرهای سایت

| مسیر | کاربرد |
| --- | --- |
| `/` | صفحه اصلی، معرفی، حوزه‌های فعالیت و آثار برگزیده |
| `/portfolio` | گالری نمونه‌کارها و فیلتر دسته‌ها |
| `/trips` | سفرنامه‌ها، تورها و گالری سفر |
| `/gear` | تجهیزات و ابزار تولید |
| `/articles` | مقالات؛ جزئیات مقاله با پارامتر `slug` |
| `/resume` | رزومه و کتاب‌ها |
| `/about` | معرفی و راه‌های ارتباطی |
| `/order` | ثبت سفارش و خدمات |
| `/filter` | آرشیو فیلترشده بر اساس تجهیزات یا تکنیک |
| `/studio` | پنل مدیریت |

مسیرهای قدیمی `/expeditions`، `/commercial`، `/prints` و `/works` در `src/App.tsx` به مسیرهای جدید هدایت می‌شوند.

## تغییرات محلی اخیر

این موارد تا ۲۲ نوامبر ۲۰۲۶ به‌صورت محلی تغییر کرده یا فایل جدید بودند و در همان تاریخ
کامیت و push شدند؛ ساخت و انتشار روی Cloudflare Pages پس از push انجام می‌شود. تنظیم
Browser Cache TTL زون هم روی Respect Existing Headers قرار گرفت تا مقادیر `_headers`
بازنویسی نشوند. فعال بودن حساب‌ها، KV، کلیدها، GitHub Actions و تلگرام از این بررسی
مشخص نیست و باید جداگانه تأیید شود.

- **دسته‌بندی:** دسته‌های عکاسی و زیرشاخه‌های جدید در `src/data/photoCategories.ts` تعریف شده‌اند. زیرشاخه اختیاری است و برای طبیعت تگ‌های قابل انتخاب اضافه شده‌اند. داده‌های پست در `PhotoItem` با `photoSubcategory` و `natureTags` توسعه یافته است؛ دسته‌های قدیمی نیز برای سازگاری حفظ شده‌اند.
- **پنل عکس:** انتخاب دسته به قبل از تحلیل منتقل شده، ورودی‌های تکراری دوربین و لنز در فرم بالایی و شماره ترتیب صفحه اصلی حذف شده‌اند. انتخاب تجهیزات با تگ‌ها و امکان تعیین نمایش در اسلایدر عمومی و اسلایدر حوزه باقی است. تعدادی از ورودی‌های انگلیسی حذف شده‌اند؛ فارسی‌سازی همه متن‌ها و گزینه‌های پنل هنوز کامل تأیید نشده است.
- **تحلیل و پیشنهاد متن:** دکمه تحلیل کلی حفظ و دکمه‌های جداگانه پیشنهاد عنوان و توضیح اضافه شده‌اند. عنوان موجود، توضیح، دسته و حداکثر پنج تصویر به تحلیل داده می‌شوند؛ تصاویر ذخیره‌شده مجاز گالری نیز قابل دریافت‌اند. برای عنوان امکان نمایش چند پیشنهاد وجود دارد. محتوای تصاویر به سرویس هوش مصنوعی انتخاب‌شده ارسال می‌شود.
- **چند ارائه‌دهنده:** انتخاب و اولویت سرویس‌ها در `AiProviderSettings.tsx` و `/api/admin/ai-providers` اضافه شده است. در زمان خطا سرویس بعدی امتحان می‌شود و سرویس شارژی انتخاب‌شده در آخر قرار می‌گیرد. کلیدها در پنل محتوایی یا فایل عمومی ذخیره نمی‌شوند.
- **اسلایدرها:** `PhotoSlideshow.tsx` برای گردش تصاویر پست در نمونه‌کار و سفر استفاده می‌شود. دکمه‌های حوزه در بخش نخست صفحه اصلی اسلایدهای انتخاب‌شده مرتبط را نمایش می‌دهند. انتخاب اسلایدهای عمومی و حوزه‌ها برای عکس، سفر، مقاله، کتاب و نرم‌افزار در تنظیمات مدیریت وجود دارد؛ پروژه نرم‌افزاری به کاور نیاز دارد. ویدیو در اسلاید پخش خودکار نمی‌شود.
- **ترجمه و اعلان:** فیلدهای تغییرکرده برای ترجمه علامت‌گذاری می‌شوند، کار ترجمه پس‌زمینه و مسیر تلاش مجدد اضافه شده‌اند، و گزارش به تلگرام در صورت وجود تنظیمات ارسال می‌شود. قالب گردش کار در `.github/workflows/translation-retry.yml` است. تنظیمات لازم در `CLOUDFLARE_SETUP.md` آمده است.
- **جست‌وجو:** توضیح فارسی، داده‌های ساخت‌یافته نام، `robots.txt`، `sitemap.xml` و به‌روزرسانی canonical در مسیریابی اضافه یا اصلاح شده‌اند. این تغییرات رتبه گوگل یا پیشنهاد نوار آدرس مرورگر را تضمین نمی‌کنند.
- **مستندات و پیکربندی:** متغیرهای نمونه سرویس‌ها به `.env.example` و راهنمای تنظیمات به `CLOUDFLARE_SETUP.md` اضافه شده‌اند. هیچ کلید واقعی در این سند درج نشده است.

## محدودیت‌ها و موارد نیازمند بررسی

- تا زمان استقرار و تنظیم واقعی Cloudflare، KV، کلیدها، مدل‌ها، GitHub Actions و تلگرام، رفتار انتها به انتهای تغییر سرویس، تلاش مجدد و ارسال اعلان در محیط عملیاتی تأیید نشده است.
- تست موجود `scripts/test-ai-workflow.ts` با `node --import tsx scripts/test-ai-workflow.ts` در محیط فعلی اجرا شده است، ولی `tsx` وابستگی مستقیم `package.json` نیست و این تست جزو `npm test` یا CI فعلی نیست؛ برای اجرای قابل اتکا در نصب تمیز باید وابستگی یا روش اجرای آن مشخص شود.
- کاور ویدیوی دلخواه قابل تعیین است و برخی سرویس‌ها تصویر بندانگشتی قابل تشخیص دارند؛ استخراج خودکار کاور از همه انواع ویدیو تضمین نشده است.
- ارسال حداکثر پنج تصویر در تحلیل فعلی محدودیت دارد. لحن اختصاصی هر دسته، کیفیت ترجمه، پوشش همه متن‌های انگلیسی و رفتار پنل با انواع محتوای واقعی نیاز به بازبینی کاربر دارند.
- فونت‌های Vazirmatn، Plus Jakarta Sans و JetBrains Mono در `public/fonts/` محلی سرو
  می‌شوند و سایت در بارگذاری فونت به Google Fonts وابسته نیست؛ این تغییر کامیت شده است.
- پیام «در حال بارگذاری» در `index.html` پیش از اجرای React نمایش داده می‌شود. دریافت محتوای به‌روز بعد از نمایش اولیه آغاز می‌شود. علت اصلی زمان انتظار سایت عملیاتی بدون اندازه‌گیری شبکه و اجرای جاوااسکریپت قطعی نیست.
- CI فعلی طبق `.github/workflows/ci.yml` شامل typecheck فرانت‌اند و توابع، `npm test` و build است. در نوبت قبلی همه این موارد و تست مستقل هوش مصنوعی در محیط محلی موفق بودند؛ بررسی مرورگر فقط بخشی از رابط، از جمله جابه‌جایی یک آلبوم، را پوشش داده است.

## فهرست فایل‌های پروژه

فهرست کامل فایل‌های قابل مشاهده پروژه در انتهای این سند آمده است. پوشه‌های وابستگی، خروجی ساخت، داده‌های Git و پوشه‌های محیطی محلی عمداً جزو فایل‌های منبع فهرست نشده‌اند.

---

## سابقه قبلی پروژه

این بخش از نسخه قبلی سند حفظ شده است و بعضی جزئیات آن، از جمله زمان ترجمه و تعداد دکمه‌های هوش مصنوعی، ممکن است به‌روز نباشند.

آخرین به‌روزرسانی سابق: ۱۴۰۵/۰۸/۲۴

## معماری فعلی

- فرانت‌اند: React 19 + TypeScript + Vite + Tailwind 4، بدون React Router.
- میزبانی: Cloudflare Pages (استاتیک + Pages Functions رایگان).
- محتوا: `public/site-data.json` در مخزن گیت‌هاب.
- عکس‌ها: فضای ابری آروان (S3)؛ گیت‌هاب (`public/media/`) فقط جایگزین.
- ویدیو: چند منبع برای هر پست (یوتیوب، آپارات، آروان، MP4، HLS)؛ آپلود مستقیم در
  آروان، بدون ترنسکد و بدون CDN.
- نشست مدیر: کوکی HttpOnly + HMAC؛ رمز با PBKDF2 در KV.
- ذخیره‌سازی: KV با نام `sinazarghami-admin` و binding `ADMIN_KV` (رمز، دستگاه‌ها، تکه‌های آپلود).
- بدون D1، R2، Supabase، Express و analytics سروری.

## انجام‌شده

- حذف کامل D1/R2/Supabase/Express/analytics قدیمی از کد و وابستگی‌ها.
- ساخت Pages Functions برای ورود، خروج، تغییر رمز، دستگاه‌ها، محتوا، مدیا، تلگرام و گیت‌هاب.
- اتصال پنل مدیریت به endpointهای واقعی (`/api/auth/verify`، `/api/passcode`، `/api/upload/*`).
- ساخت endpointهای هوش مصنوعی (`/api/gemini/suggest-photo-details`، `/api/translate`) با خواندن لحن از `content/tone.md`.
- ساخت endpoint عمومی فرم تماس (`/api/contact`) با محدودیت نرخ ساده.
- حذف ۳۵ لینک Unsplash و ۷ data URL از محتوا؛ انتقال عکس‌های واقعی به `public/media/legacy/`.
- حذف مسیرهای بلااستفاده‌ی `/api/media`، `/api/github/sync` و مترجم سمت کلاینت؛
  تنها مسیر نوشتن، `/api/upload/*` است.
- کاهش حجم `site-data.json` از ۵۲۰ کیلوبایت به حدود ۴۷ کیلوبایت.
- SPA fallback به `functions/_middleware.ts` منتقل شد تا درخواست فایل‌های
  `/assets/*` هرگز HTML نگیرد و در کش لبه ذخیره نشود (علت صفحه‌ی سفید بعد از deploy).
  چون Cloudflare Pages برای مسیر ناموجود هم `200 text/html` می‌دهد، تشخیص
  «فایل گم‌شده» بر اساس `Content-Type` انجام می‌شود، نه کد ۴۰۴.
- پست‌ها چندرسانه‌ای شدند: هر پست می‌تواند چند عکس و چند ویدیو (لینک یوتیوب،
  آپارات یا MP4 مستقیم) داشته باشد و در گالری/لایت‌باکس کنار هم نمایش داده شوند.
- بسته‌ی جاوااسکریپت شکسته شد (`react` / `icons` / `hls` / `motion` / `vendor`) و
  پنل مدیریت با lazy loading بارگذاری می‌شود.
- افزودن مسیر `/studio`، صفحه‌ی ۴۰۴، ErrorBoundary و ریدایرکت مسیرهای قدیمی.
- غیرفعال‌کردن بارگذاری blocking فونت گوگل (علت اصلی صفحه‌ی سفید و اسپینر بی‌پایان).
- حذف workflowهای خطرناک `pre-check`، `deploy` (GitHub Pages) و `video-processor`.
- افزودن workflow جدید CI برای typecheck و build.
- **انتشار تکه‌ای (chunked upload)**: هر ذخیره‌سازی و آپلود عکس به تکه‌های ۱۲ کیلوبایتی
  شکسته می‌شود و از کانال GET (بدون بدنه) ارسال می‌شود. علت: بدنه‌های بزرگ‌تر از
  ~۴۸ کیلوبایت و URLهای بلندتر از ~۳۲ هزار کاراکتر روی شبکه‌های ایران بی‌صدا ریست
  می‌شدند. تکه‌ها سه‌تایی موازی می‌روند و آپلود از تکه‌ی قطع‌شده ادامه پیدا می‌کند.
- **عمر کوتاه اتصال به دامنه**: اندازه‌گیری روی همین دامنه نشان داد اتصال بازمانده
  (keep-alive) به `sinazarghami.ir` بعد از حدود ۱۰ تا ۲۰ ثانیه یا بعد از چند درخواست
  بزرگ، بی‌صدا با `ECONNRESET` / `ERR_CONNECTION_CLOSED` قطع می‌شود؛ در حالی که
  `example.com` و `cloudflare.com` همین رفتار را ندارند. نتیجه: آپلود عکس وسط کار
  می‌شکست. اکنون هر تکه با تایم‌اوت ۸ ثانیه (به‌جای ۱۲) و سه تلاش فرستاده می‌شود،
  هر کانال پیش از رفتن به کانال بعدی یک‌بار دیگر امتحان می‌شود، و کل آپلود تا ۴ دور
  با فاصله‌ی ۱/۲٫۵/۵ ثانیه ادامه می‌یابد تا روی اتصال تازه کامل شود.
- آیکون سایت (`/favicon.svg`) اضافه شد و `/favicon.ico` به آن ریدایرکت می‌شود تا
  خطای ۴۰۴ در کنسول نماند.
- **حفظ تغییرات منتشرنشده**: تا وقتی نسخه‌ی تازه روی سرور دیده نشود، داده‌ی محلی
  روی تغییرات کاربر بازنویسی نمی‌شود؛ انتشار ناموفق هم در بار بعدی خودکار تکرار می‌شود.
- یک دکمه‌ی «ذخیره و انتشار» برای هر بخش؛ صف انتشار، آخرین نسخه را کامیت می‌کند.
- ترجمه‌ی خودکار انگلیسی در سرور هنگام انتشار (بدون دکمه‌ی ترجمه برای هر فیلد).
- یک دکمه‌ی هوش مصنوعی که همه‌ی فیلدهای فارسی/انگلیسی عکس را پر می‌کند.
- دسته‌بندی نمونه‌کار به‌صورت کامل در پنل قابل مدیریت است؛ چیپس فیلتر فقط دسته‌هایی را
  نشان می‌دهد که عکس دارند.
- `/api/health?deep=1` وضعیت KV، کلیدها و مخزن را گزارش می‌دهد و در تب انتشار پنل هم دیده می‌شود.
- دیکته‌ی صوتی بازنویسی شد: بدون `alert`، خطای فارسی درون‌خطی، مخفی روی مرورگرهای ناسازگار.
- **آپلود مستقیم در آروان کلاود**: تصاویر WebP و ویدیوها با URL امضاشده (SigV4)
  مستقیم از مرورگر به باکت آروان می‌روند؛ فایل از Cloudflare عبور نمی‌کند، پس
  قطعی keep-alive دامنه دیگر آپلود را نمی‌شکند. مسیر گیت‌هاب به‌عنوان جایگزین
  دست‌نخورده مانده است.
- **آپلود چندتکه‌ای با ادامه‌پذیری**: فایل‌های بزرگ‌تر از ۲۴ مگابایت به تکه‌های
  ۸ مگابایتی شکسته می‌شوند، وضعیت در `localStorage` می‌ماند و بعد از قطعی فقط
  تکه‌های باقی‌مانده دوباره فرستاده می‌شوند.
- **پلیر چندمنبعی**: هر ویدیو می‌تواند هم‌زمان یوتیوب، آپارات، آروان، MP4 و HLS
  داشته باشد و کاربر بین آن‌ها جابه‌جا می‌شود؛ HLS با `hls.js` به‌صورت lazy
  بارگذاری می‌شود.
- امضای SigV4 با بردار رسمی مستندات AWS در `scripts/test-arvan-signature.mjs`
  قفل شده است.

## در انتظار

- اتصال فرم‌های چاپ/تور/پروژه به `/api/contact` (فعلاً از مسیر مدیر استفاده می‌کنند).
- تب «دستگاه‌ها» در پنل مدیریت برای لغو دسترسی دستگاه‌های قدیمی.
- تولید مقاله‌ی روزانه با GitHub Actions + Gemini.
- بارگذاری عکس‌های واقعی نمونه‌کار (گالری فعلاً یک اثر دارد).

## نکات امنیتی

- `ADMIN_INITIAL_PASSCODE` بعد از اولین تغییر رمز باید از Cloudflare حذف شود.
- توکن تلگرام قدیمی که در سورس بوده باید rotate شود.
- `GITHUB_TOKEN` فقط دسترسی Contents روی همین مخزن داشته باشد.

---

## راهنمای فایل‌ها و فهرست کامل

- **ریشه پروژه:** `index.html` سند اولیه و متادیتا؛ `package.json` و `package-lock.json` وابستگی‌ها و فرمان‌ها؛ `vite.config.ts` و `tsconfig*.json` تنظیمات ساخت و TypeScript؛ `.env.example` و `.dev.vars.example` نمونه تنظیمات؛ `CLOUDFLARE_SETUP.md` راهنمای استقرار؛ `CLAUDE.md` و `metadata.json` اطلاعات پروژه؛ `7960200.txt` فایل متنی موجود در ریشه که در این بررسی برای آن نقشی در اجرای سایت تأیید نشده است.
- **`src/`:** کد سمت مرورگر. `App.tsx` مسیریابی و بارگیری محتوا؛ `components/` پنل، صفحات، گالری، اسلایدر، پلیر و اجزای رابط؛ `data/` داده اولیه و دسته‌های عکاسی؛ `types/` قرارداد داده‌ها؛ `utils/` ذخیره، انتقال، آپلود، رسانه و تلگرام؛ `index.css` سبک‌ها.
- **`functions/`:** توابع سرور Cloudflare. پوشه `api/_shared/` کد مشترک احراز هویت، GitHub، آروان، درخواست‌ها، ترجمه و هوش مصنوعی است؛ سایر فایل‌های `api/` مسیرهای HTTP مدیریت، انتشار، آپلود، تماس و سرویس‌ها را پیاده می‌کنند. `media/arvan/[[path]].ts` مسیر میانجی رسانه آروان است.
- **`public/`:** داده و دارایی‌های عمومی شامل `site-data.json`، عکس‌های قدیمی، favicon، راهنمای خزنده‌ها، نقشه سایت، تنظیمات هدر و دامنه. `public/portfolio/.gitkeep` صرفاً پوشه را در Git نگه می‌دارد.
- **`content/`:** سند لحن هوش مصنوعی؛ **`scripts/`:** مهاجرت محتوا و آزمون‌های شبکه، امضا و گردش هوش مصنوعی؛ **`.github/workflows/`:** بررسی خودکار و تلاش دوره‌ای ترجمه؛ **`.vscode/`:** تنظیمات و پیشنهاد افزونه ویرایشگر.
- فهرست زیر فایل‌های پروژه از جمله فایل‌های مخفی قابل مشاهده را شامل می‌شود. `node_modules/`، `dist/`، پوشه‌های داده و تنظیمات محلی ابزارها و محتویات `.git/` برای جلوگیری از حجیم‌شدن یا درج اطلاعات محیطی کنار گذاشته شده‌اند.

### فایل‌ها

- `.dev.vars.example`
- `.env.example`
- `.github/workflows/ci.yml`
- `.github/workflows/translation-retry.yml`
- `.gitignore`
- `.vscode/extensions.json`
- `.vscode/settings.json`
- `7960200.txt`
- `CLAUDE.md`
- `CLOUDFLARE_SETUP.md`
- `PROJECT_STATUS.md`
- `content/tone.md`
- `functions/_middleware.ts`
- `functions/api/_shared/ai.ts`
- `functions/api/_shared/arvan.ts`
- `functions/api/_shared/request.ts`
- `functions/api/_shared/runtime.ts`
- `functions/api/_shared/translateContent.ts`
- `functions/api/_shared/translationJob.ts`
- `functions/api/_shared/uploads.ts`
- `functions/api/admin/ai-providers.ts`
- `functions/api/admin/devices/[id].ts`
- `functions/api/admin/devices/index.ts`
- `functions/api/auth/verify.ts`
- `functions/api/contact.ts`
- `functions/api/gemini/suggest-photo-details.ts`
- `functions/api/health.ts`
- `functions/api/passcode.ts`
- `functions/api/site-data.ts`
- `functions/api/telegram/notify.ts`
- `functions/api/translate.ts`
- `functions/api/translation-retry.ts`
- `functions/api/upload/arvan.ts`
- `functions/api/upload/chunk.ts`
- `functions/api/upload/complete.ts`
- `functions/api/upload/init.ts`
- `functions/media/arvan/[[path]].ts`
- `index.html`
- `metadata.json`
- `package-lock.json`
- `package.json`
- `public/CNAME`
- `public/_headers`
- `public/_redirects`
- `public/favicon.svg`
- `public/media/legacy/photo-1791988017339-01.webp`
- `public/media/legacy/photo-1791988017339-g1-02.webp`
- `public/media/legacy/photo-1791988017339-g2-03.webp`
- `public/media/legacy/photo-1791988017339-g3-04.webp`
- `public/media/legacy/photo-1791988017339-g4-05.webp`
- `public/media/legacy/photo-1791988017339-g5-06.webp`
- `public/media/legacy/photo-1791988017339-g6-07.webp`
- `public/portfolio/.gitkeep`
- `public/robots.txt`
- `public/site-data.json`
- `public/sitemap.xml`
- `scripts/migrate-content.mjs`
- `scripts/test-ai-workflow.ts`
- `scripts/test-arvan-signature.mjs`
- `scripts/test-request-channels.mjs`
- `scripts/test-spa-fallback.mjs`
- `scripts/test-transport.mjs`
- `src/App.tsx`
- `src/components/AboutPage.tsx`
- `src/components/AdminStudioModal.tsx`
- `src/components/AiProviderSettings.tsx`
- `src/components/ArticlesSection.tsx`
- `src/components/DynamicFilterArchive.tsx`
- `src/components/ErrorBoundary.tsx`
- `src/components/ExpeditionsSection.tsx`
- `src/components/Footer.tsx`
- `src/components/GearLockerSection.tsx`
- `src/components/Hero.tsx`
- `src/components/HomeCategoryCards.tsx`
- `src/components/HomeFeaturedWorks.tsx`
- `src/components/Navbar.tsx`
- `src/components/NotFoundPage.tsx`
- `src/components/PhotoSlideshow.tsx`
- `src/components/PhotographyGallery.tsx`
- `src/components/PrintShopModal.tsx`
- `src/components/ProductionServices.tsx`
- `src/components/ResumeBooksSection.tsx`
- `src/components/SeoDocumentationModal.tsx`
- `src/components/SoftwareShowcase.tsx`
- `src/components/ToastHost.tsx`
- `src/components/VideoPlayer.tsx`
- `src/components/VoiceDictationButton.tsx`
- `src/data/initialData.ts`
- `src/data/photoCategories.ts`
- `src/index.css`
- `src/main.tsx`
- `src/types/index.ts`
- `src/utils/arvanUpload.ts`
- `src/utils/arvanUrl.ts`
- `src/utils/media.ts`
- `src/utils/storage.ts`
- `src/utils/telegram.ts`
- `src/utils/transport.ts`
- `src/utils/videoEmbed.ts`
- `tsconfig.functions.json`
- `tsconfig.json`
- `vite.config.ts`
