import { Env, json, PagesContext, requireAdmin } from '../_shared/runtime';

export const onRequestPost = async ({ request, env }: PagesContext<Env & { TELEGRAM_BOT_TOKEN?: string; TELEGRAM_CHAT_ID?: string }>) => {
  const denied = await requireAdmin(request, env);
  if (denied) return denied;
  if (!env.TELEGRAM_BOT_TOKEN || !env.TELEGRAM_CHAT_ID) return json({ success: false, message: 'اعلان تلگرام پیکربندی نشده است.' }, 503);
  const today = new Date().toISOString().slice(0, 10);
  const { results } = await env.DB.prepare('SELECT event_type, COUNT(*) AS count FROM analytics_events WHERE created_at >= ? GROUP BY event_type').bind(today).all<{ event_type: string; count: number }>();
  const counts = Object.fromEntries(results.map((row) => [row.event_type, row.count]));
  const message = `📊 <b>گزارش روزانه وب‌سایت</b>\nبازدید صفحه: ${counts.page_view || 0}\nمشاهده عکس: ${counts.photo_view || 0}\nسبدهای رهاشده: ${counts.abandon_checkout || 0}\nسفارش‌های تکمیل‌شده: ${counts.complete_order || 0}`;
  try {
    const response = await fetch(`https://api.telegram.org/bot${env.TELEGRAM_BOT_TOKEN}/sendMessage`, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ chat_id: env.TELEGRAM_CHAT_ID, text: message, parse_mode: 'HTML' }) });
    const result = await response.json() as { ok?: boolean };
    return json({ success: response.ok && result.ok === true, message: response.ok ? 'گزارش به تلگرام ارسال شد.' : 'خطا در ارسال گزارش.' }, response.ok ? 200 : 502);
  } catch {
    return json({ success: false, message: 'خطای شبکه در ارتباط با تلگرام.' }, 502);
  }
};
