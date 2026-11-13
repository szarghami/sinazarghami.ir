# وضعیت پروژه‌ی sinazarghami.ir

آخرین به‌روزرسانی: ۱۴۰۵/۰۸/۲۲

## معماری فعلی

- فرانت‌اند: React 19 + TypeScript + Vite + Tailwind 4، بدون React Router.
- میزبانی: Cloudflare Pages (استاتیک + Pages Functions رایگان).
- محتوا: `public/site-data.json` در مخزن گیت‌هاب.
- عکس‌ها: `public/media/` در همان مخزن.
- ویدیو: فقط لینک/embed؛ آپلود و ترنسکد وجود ندارد.
- نشست مدیر: کوکی HttpOnly + HMAC؛ رمز با PBKDF2 در KV.
- بدون D1، R2، Supabase، Express و analytics سروری.

## انجام‌شده

- حذف کامل D1/R2/Supabase/Express/analytics قدیمی از کد و وابستگی‌ها.
- ساخت Pages Functions برای ورود، خروج، تغییر رمز، دستگاه‌ها، محتوا، مدیا، تلگرام و گیت‌هاب.
- اتصال پنل مدیریت به endpointهای واقعی (`/api/auth/verify`، `/api/passcode`، `/api/site-data`، `/api/media`).
- ساخت endpointهای هوش مصنوعی (`/api/gemini/suggest-photo-details`، `/api/translate`) با خواندن لحن از `content/tone.md`.
- ساخت endpoint عمومی فرم تماس (`/api/contact`) با محدودیت نرخ ساده.
- حذف ۳۵ لینک Unsplash و ۷ data URL از محتوا؛ انتقال عکس‌های واقعی به `public/media/legacy/`.
- کاهش حجم `site-data.json` از ۵۲۰ کیلوبایت به حدود ۴۷ کیلوبایت.
- افزودن `public/_redirects` و `public/_headers` برای SPA fallback و کش صحیح.
- افزودن مسیر `/studio`، صفحه‌ی ۴۰۴، ErrorBoundary و ریدایرکت مسیرهای قدیمی.
- غیرفعال‌کردن بارگذاری blocking فونت گوگل (علت اصلی صفحه‌ی سفید و اسپینر بی‌پایان).
- حذف workflowهای خطرناک `pre-check`، `deploy` (GitHub Pages) و `video-processor`.
- افزودن workflow جدید CI برای typecheck و build.

## در انتظار

- **Deploy نسخه‌ی جدید**: تا وقتی تغییرات در `main` کامیت و push نشود، پنل روی سایت زنده کار نمی‌کند.
- تنظیم `ADMIN_KV` برای تغییر رمز و مدیریت دستگاه‌ها.
- اتصال فرم‌های چاپ/تور/پروژه به `/api/contact` (فعلاً از مسیر مدیر استفاده می‌کنند).
- تب «دستگاه‌ها» در پنل مدیریت برای لغو دسترسی دستگاه‌های قدیمی.
- حذف فیلدهای انگلیسی از فرم‌ها و ترجمه‌ی خودکار پس از تأیید متن فارسی.
- تولید مقاله‌ی روزانه با GitHub Actions + Gemini.
- بارگذاری عکس‌های واقعی نمونه‌کار (گالری فعلاً یک اثر دارد).

## نکات امنیتی

- `ADMIN_INITIAL_PASSCODE` بعد از اولین تغییر رمز باید از Cloudflare حذف شود.
- توکن تلگرام قدیمی که در سورس بوده باید rotate شود.
- `GITHUB_TOKEN` فقط دسترسی Contents روی همین مخزن داشته باشد.
