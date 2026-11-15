/**
 * SPA fallback.
 *
 * فقط درخواست‌های ناوبری (Accept: text/html) که به فایل واقعی نمی‌رسند
 * index.html می‌گیرند. درخواست فایل‌های جاوااسکریپت و تصویر هرگز HTML
 * نمی‌گیرد؛ قبلاً همین باعث می‌شد یک فایل جاوااسکریپت گم‌شده، صفحه‌ی سفید
 * دائمی بسازد و در کش لبه‌ی کلادفلر برای یک سال ذخیره شود.
 *
 * نکته‌ی مهم: Cloudflare Pages برای مسیر ناموجود حتی به `context.next()`
 * هم `200 text/html` (همان index.html) برمی‌گرداند، پس نمی‌توان فقط به
 * کد وضعیت ۴۰۴ تکیه کرد. چون هیچ فایل واقعی با پسوند دار، HTML نیست،
 * هر پاسخ HTML برای چنین مسیری «فایل گم‌شده» تلقی می‌شود.
 */

interface AssetsBinding {
  fetch: (request: Request) => Promise<Response>;
}

interface Context {
  request: Request;
  env: { ASSETS?: AssetsBinding };
  next: () => Promise<Response>;
}

const ASSET_EXTENSION =
  /\.(?:js|mjs|css|map|json|txt|xml|png|jpe?g|webp|gif|svg|ico|woff2?|ttf|otf|mp4|webm|m3u8)$/i;

function notFound(): Response {
  return new Response('Not found', {
    status: 404,
    headers: {
      'Content-Type': 'text/plain; charset=utf-8',
      'Cache-Control': 'no-store',
      'X-Content-Type-Options': 'nosniff',
    },
  });
}

function isHtml(response: Response): boolean {
  return (response.headers.get('Content-Type') || '').toLowerCase().includes('text/html');
}

export async function onRequest(context: Context): Promise<Response> {
  const url = new URL(context.request.url);
  const response = await context.next();
  const method = context.request.method.toUpperCase();
  const isRead = method === 'GET' || method === 'HEAD';

  // فایل گم‌شده باید ۴۰۴ تمیز و غیرقابل‌کش بگیرد، نه صفحه‌ی HTML.
  if (isRead && ASSET_EXTENSION.test(url.pathname) && (response.status === 404 || isHtml(response))) {
    return notFound();
  }

  if (response.status !== 404) return response;
  if (!isRead) return response;

  const accept = context.request.headers.get('Accept') || '';
  if (!accept.includes('text/html')) return response;

  const indexUrl = new URL('/index.html', url);
  if (!context.env.ASSETS) return response;
  return context.env.ASSETS.fetch(new Request(indexUrl.toString(), { method: 'GET' }));
}
