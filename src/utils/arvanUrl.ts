/**
 * آدرس عمومی آبجکت‌های آروان را به مسیر هم‌دامنه‌ی سایت تبدیل می‌کند.
 *
 * صندوقچه‌ی آروان به‌صورت پیش‌فرض خواندن عمومی آبجکت‌ها را نمی‌دهد، پس
 * مرورگر با ۴۰۳ روبه‌رو می‌شود. مسیر `/media/arvan/...` همان فایل را با
 * امضای سمت سرور برمی‌گرداند.
 */
const ARVAN_OBJECT_PATTERN = /^https?:\/\/[^/]*arvanstorage\.ir\/[^/]+\/(.+)$/i;

export function arvanProxyUrl(url?: string): string {
  if (!url) return '';
  const trimmed = url.trim();
  const match = ARVAN_OBJECT_PATTERN.exec(trimmed);
  if (!match) return trimmed;
  const key = match[1].split(/[?#]/)[0];
  return key ? `/media/arvan/${key}` : trimmed;
}
