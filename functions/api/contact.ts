import { json, type Env } from './_shared/runtime';

interface Context {
  request: Request;
  env: Env;
}

const WINDOW_MS = 60 * 60 * 1000;
const MAX_PER_WINDOW = 8;
const hits = new Map<string, number[]>();

function rateLimited(key: string): boolean {
  const now = Date.now();
  const recent = (hits.get(key) || []).filter((at) => now - at < WINDOW_MS);
  if (recent.length >= MAX_PER_WINDOW) {
    hits.set(key, recent);
    return true;
  }
  recent.push(now);
  hits.set(key, recent);
  if (hits.size > 5000) hits.clear();
  return false;
}

function escapeHtml(value: string): string {
  return value.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
}

export async function onRequestPost({ request, env }: Context): Promise<Response> {
  if (!env.TELEGRAM_BOT_TOKEN || !env.TELEGRAM_CHAT_ID) {
    return json({ success: false, error: 'ارسال پیام در حال حاضر فعال نیست.' }, 503);
  }

  const ip = request.headers.get('CF-Connecting-IP') || 'unknown';
  if (rateLimited(ip)) {
    return json({ success: false, error: 'تعداد درخواست‌ها زیاد است. کمی بعد تلاش کنید.' }, 429);
  }

  let body: { kind?: string; name?: string; contact?: string; subject?: string; details?: string };
  try {
    body = (await request.json()) as typeof body;
  } catch {
    return json({ success: false, error: 'Invalid JSON body.' }, 400);
  }

  const name = (body.name || '').trim().slice(0, 80);
  const contact = (body.contact || '').trim().slice(0, 120);
  const subject = (body.subject || '').trim().slice(0, 160);
  const details = (body.details || '').trim().slice(0, 2000);
  const kind = (body.kind || 'general').trim().slice(0, 40);

  if (!name || !contact) {
    return json({ success: false, error: 'نام و راه ارتباطی الزامی است.' }, 400);
  }
  if (details.length < 5) {
    return json({ success: false, error: 'متن پیام خیلی کوتاه است.' }, 400);
  }

  const text = [
    '<b>پیام جدید از سایت</b>',
    `• نوع: ${escapeHtml(kind)}`,
    `• نام: ${escapeHtml(name)}`,
    `• تماس: <code>${escapeHtml(contact)}</code>`,
    subject ? `• موضوع: ${escapeHtml(subject)}` : '',
    '',
    escapeHtml(details),
  ]
    .filter(Boolean)
    .join('\n');

  const response = await fetch(`https://api.telegram.org/bot${env.TELEGRAM_BOT_TOKEN}/sendMessage`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      chat_id: env.TELEGRAM_CHAT_ID,
      text,
      parse_mode: 'HTML',
      disable_web_page_preview: true,
    }),
  });
  if (!response.ok) {
    return json({ success: false, error: 'ارسال پیام ناموفق بود.' }, 502);
  }
  return json({ success: true });
}
