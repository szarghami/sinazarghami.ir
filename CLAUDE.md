# راهنمای توسعه‌ی مخزن

## دستورها

- `npm install` — نصب وابستگی‌ها (Node 22 به بالا).
- `npm run dev` — اجرای Vite روی پورت ۵۱۷۳ (فقط فرانت‌اند، بدون Functions).
- `npm run build` — ساخت خروجی production در `dist/`.
- `npm run typecheck` — بررسی تایپ‌های فرانت‌اند.
- `npm run lint:pages` — بررسی تایپ‌های Pages Functions.
- `npm run pages:dev` — بیلد و اجرای کامل سایت همراه Functions با Wrangler.

## معماری

React 19 + TypeScript + Vite + Tailwind 4. مسیریابی دستی با History API داخل `src/App.tsx`
انجام می‌شود؛ React Router وجود ندارد. `App` مالک `SiteContent`، زبان و مودال‌هاست.

- محتوا: `public/site-data.json` (تک‌منبع حقیقت در production).
- عکس‌ها: `public/media/` در همین مخزن.
- ویدیو: فقط لینک یا embed (آپارات، یوتیوب، MP4، HLS). آپلود و ترنسکد نداریم.
- بک‌اند: Pages Functions در `functions/api/` — بدون D1، R2، Supabase یا Express.
- نشست مدیر: کوکی HttpOnly + HMAC؛ رمز با PBKDF2 در KV (`ADMIN_KV`) ذخیره می‌شود.
- انتشار: پنل مدیریت فایل `public/site-data.json` را با GitHub API کامیت می‌کند و
  Cloudflare Pages نسخه‌ی جدید را می‌سازد.
- هوش مصنوعی: `functions/api/gemini/*` و `functions/api/translate.ts` با `GEMINI_API_KEY`.
  لحن نوشتاری از `content/tone.md` خوانده می‌شود.

## قواعد مهم

- هیچ کلیدی در کد یا `localStorage` ذخیره نشود؛ همه در Cloudflare Secrets هستند.
- `localStorage` فقط کش است. ذخیره‌ی پایدار = کامیت گیت‌هاب.
- لینک تصویر خارجی (Unsplash و مشابه) اضافه نکن؛ تصاویر باید در `public/media/` باشند.
- فونت‌ها و منابع خارجی نباید رندر صفحه را block کنند (به‌خصوص برای کاربران ایران).
- صفحه‌های ناشناخته باید به `NotFoundPage` بروند، نه خروجی خالی.
- `public/_redirects` برای SPA fallback ضروری است؛ حذفش نکن.
