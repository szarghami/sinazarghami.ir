/**
 * SPA fallback.
 *
 * فقط درخواست‌های ناوبری (Accept: text/html) که به فایل واقعی نمی‌رسند
 * index.html می‌گیرند. درخواست فایل‌های جاوااسکریپت و تصویر هرگز HTML
 * نمی‌گیرد؛ قبلاً همین باعث می‌شد یک فایل جاوااسکریپت گم‌شده، صفحه‌ی سفید
 * دائمی بسازد و در کش لبه‌ی کلادفلر برای یک سال ذخیره شود.
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

export async function onRequest(context: Context): Promise<Response> {
  const url = new URL(context.request.url);
  const response = await context.next();
  const probe = new Headers(response.headers);
  probe.set(
    'x-spa-probe',
    `next=${response.status};ct=${response.headers.get('content-type') || '-'};assets=${context.env.ASSETS ? 'yes' : 'no'}`,
  );
  if (url.pathname.startsWith('/__probe')) {
    return new Response(probe.get('x-spa-probe'), { status: 200, headers: probe });
  }
  if (response.status !== 404) return response;

  const method = context.request.method.toUpperCase();
  if (method !== 'GET' && method !== 'HEAD') return response;

  // فایل گم‌شده باید ۴۰۴ تمیز و غیرقابل‌کش بگیرد، نه صفحه‌ی HTML.
  if (ASSET_EXTENSION.test(url.pathname)) {
    return new Response('Not found', {
      status: 404,
      headers: {
        'Content-Type': 'text/plain; charset=utf-8',
        'Cache-Control': 'no-store',
        'X-Content-Type-Options': 'nosniff',
      },
    });
  }

  const accept = context.request.headers.get('Accept') || '';
  if (!accept.includes('text/html')) return response;

  const indexUrl = new URL('/index.html', url);
  if (!context.env.ASSETS) return response;
  return context.env.ASSETS.fetch(new Request(indexUrl.toString(), { method: 'GET' }));
}
