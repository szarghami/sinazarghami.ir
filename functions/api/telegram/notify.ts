import { bodyJson, Env, json, PagesContext } from '../_shared/runtime';

interface NotifyBody { message?: string }

export const onRequestPost = async ({ request, env }: PagesContext<Env & { TELEGRAM_BOT_TOKEN?: string; TELEGRAM_CHAT_ID?: string }>) => {
  if (!env.TELEGRAM_BOT_TOKEN || !env.TELEGRAM_CHAT_ID) return json({ success: false, error: 'اعلان تلگرام پیکربندی نشده است.' }, 503);
  const body = await bodyJson<NotifyBody>(request);
  if (typeof body?.message !== 'string' || !body.message.trim() || body.message.length > 4000) return json({ success: false, error: 'متن پیام نامعتبر است.' }, 400);
  const ip = request.headers.get('CF-Connecting-IP') || 'unknown';
  const encoder = new TextEncoder();
  const digest = await crypto.subtle.digest('SHA-256', encoder.encode(`telegram:${ip}:${env.ADMIN_SESSION_SECRET || 'rate-limit'}`));
  const ipHash = Array.from(new Uint8Array(digest), (byte) => byte.toString(16).padStart(2, '0')).join('');
  const now = Math.floor(Date.now() / 1000);
  const current = await env.DB.prepare('SELECT window_started, request_count FROM api_limits WHERE ip_hash = ?').bind(ipHash).first<{ window_started: number; request_count: number }>();
  if (current && current.window_started > now - 3600 && current.request_count >= 10) return json({ success: false, error: 'تعداد درخواست‌ها بیش از حد مجاز است.' }, 429);
  await env.DB.prepare('INSERT INTO api_limits (ip_hash, window_started, request_count) VALUES (?, ?, 1) ON CONFLICT(ip_hash) DO UPDATE SET window_started = CASE WHEN api_limits.window_started <= ? THEN excluded.window_started ELSE api_limits.window_started END, request_count = CASE WHEN api_limits.window_started <= ? THEN 1 ELSE api_limits.request_count + 1 END')
    .bind(ipHash, now, now - 3600, now - 3600).run();
  try {
    const response = await fetch(`https://api.telegram.org/bot${env.TELEGRAM_BOT_TOKEN}/sendMessage`, {
      method: 'POST', headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ chat_id: env.TELEGRAM_CHAT_ID, text: body.message, parse_mode: 'HTML' }),
    });
    const result = await response.json() as { ok?: boolean };
    return json({ success: response.ok && result.ok === true }, response.ok ? 200 : 502);
  } catch {
    return json({ success: false, error: 'ارتباط با تلگرام برقرار نشد.' }, 502);
  }
};
