/**
 * تست fallback صفحه‌ی SPA: ناوبری باید index.html بگیرد، ولی درخواست فایل
 * جاوااسکریپت یا تصویر هرگز نباید HTML بگیرد (علت صفحه‌ی سفید بعد از دیپلوی).
 */

import { onRequest } from '../functions/_middleware.ts';

function makeContext(path, { method = 'GET', accept = '', nextStatus = 404, nextBody = 'not found' } = {}) {
  const assets = [];
  const headers = accept ? { Accept: accept } : {};
  return {
    assets,
    context: {
      request: new Request(`https://example.com${path}`, { method, headers }),
      env: {
        ASSETS: {
          fetch: async (request) => {
            assets.push(new URL(request.url).pathname);
            return new Response('<!doctype html><div id="root"></div>', {
              status: 200,
              headers: { 'Content-Type': 'text/html; charset=utf-8' },
            });
          },
        },
      },
      next: async () => new Response(nextBody, { status: nextStatus }),
    },
  };
}

const results = [];
const check = (name, ok) => results.push([name, ok]);

{
  const { context, assets } = makeContext('/portfolio', { accept: 'text/html,application/xhtml+xml' });
  const response = await onRequest(context);
  check('navigation falls back to index.html', response.status === 200);
  check('fallback serves /index.html', assets.length === 1 && assets[0] === '/index.html');
}

{
  const { context, assets } = makeContext('/assets/index-OLD.js', { accept: '*/*' });
  const response = await onRequest(context);
  check('missing asset stays 404', response.status === 404);
  check('missing asset never gets index.html', assets.length === 0);
  check('missing asset is not cacheable', response.headers.get('Cache-Control') === 'no-store');
  check('missing asset is served as text', (response.headers.get('Content-Type') || '').includes('text/plain'));
}

{
  const { context } = makeContext('/assets/index-OLD.css', { accept: 'text/css,*/*;q=0.1' });
  const response = await onRequest(context);
  check('missing stylesheet stays 404', response.status === 404);
}

{
  const { context, assets } = makeContext('/assets/index-OLD.js', { accept: 'text/html' });
  const response = await onRequest(context);
  check('asset request with html accept still 404', response.status === 404 && assets.length === 0);
}

{
  const { context } = makeContext('/api/health', { accept: '*/*', nextStatus: 200, nextBody: '{"ok":true}' });
  const response = await onRequest(context);
  check('api response passes through', response.status === 200);
}

{
  const { context } = makeContext('/portfolio', { method: 'POST', accept: 'text/html' });
  const response = await onRequest(context);
  check('non-GET navigation is not rewritten', response.status === 404);
}

{
  const { context, assets } = makeContext('/', { accept: 'text/html', nextStatus: 200, nextBody: '<html></html>' });
  const response = await onRequest(context);
  check('existing page is untouched', response.status === 200 && assets.length === 0);
}

for (const [name, ok] of results) console.log(`${ok ? 'PASS' : 'FAIL'} ${name}`);
process.exit(results.every(([, ok]) => ok) ? 0 : 1);
