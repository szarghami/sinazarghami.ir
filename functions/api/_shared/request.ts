/**
 * خواندن بدنه‌ی درخواست از سه کانال مختلف.
 *
 * روی بعضی شبکه‌ها (مثلاً موبایل ایران) بدنه‌ی POST یا با فیلتر رد می‌شود یا
 * وسط کار ریست می‌شود، در حالی که GET سالم است. کلاینت به‌صورت خودکار کانال
 * سالم را پیدا می‌کند و همین تابع هر سه حالت را می‌فهمد:
 *  ۱. POST با JSON معمولی
 *  ۲. POST با text/plain حاوی base64url از JSON
 *  ۳. GET با پارامتر p=base64url(JSON)
 */

export function decodeBase64Url(value: string): string {
  const padded = value.replace(/-/g, '+').replace(/_/g, '/');
  const binary = atob(padded + '='.repeat((4 - (padded.length % 4)) % 4));
  return new TextDecoder().decode(Uint8Array.from(binary, (char) => char.charCodeAt(0)));
}

export async function readRequestJson<T>(request: Request): Promise<T | null> {
  try {
    if (request.method.toUpperCase() === 'GET') {
      const raw = new URL(request.url).searchParams.get('p');
      return raw ? (JSON.parse(decodeBase64Url(raw)) as T) : null;
    }
    const contentType = (request.headers.get('Content-Type') || '').toLowerCase();
    if (contentType.includes('text/plain')) {
      const text = (await request.text()).trim();
      return text ? (JSON.parse(decodeBase64Url(text)) as T) : null;
    }
    return (await request.json()) as T;
  } catch {
    return null;
  }
}
