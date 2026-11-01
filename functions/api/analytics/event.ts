import { bodyJson, Env, json, PagesContext } from '../_shared/runtime';

const EVENT_TYPES = new Set(['page_view', 'photo_view', 'open_buy_modal', 'select_format', 'abandon_checkout', 'complete_order', 'contact_inquiry', 'download_resume', 'gear_view']);

export const onRequestPost = async ({ request, env }: PagesContext<Env>) => {
  const raw = await request.text();
  if (new TextEncoder().encode(raw).byteLength > 2048) return json({ error: 'رویداد بیش از حد مجاز است.' }, 413);
  let event: Record<string, unknown>;
  try { event = JSON.parse(raw); } catch { return json({ error: 'ساختار رویداد نامعتبر است.' }, 400); }
  if (typeof event.id !== 'string' || event.id.length > 100 || typeof event.sessionId !== 'string' || event.sessionId.length > 100 || !EVENT_TYPES.has(String(event.eventType))) return json({ error: 'رویداد نامعتبر است.' }, 400);
  const createdAt = typeof event.clientTimestamp === 'string' && !Number.isNaN(Date.parse(event.clientTimestamp)) ? new Date(event.clientTimestamp).toISOString() : new Date().toISOString();
  const ip = request.headers.get('CF-Connecting-IP') || 'unknown';
  const digest = await crypto.subtle.digest('SHA-256', new TextEncoder().encode(`analytics:${ip}:${env.ADMIN_SESSION_SECRET || 'rate-limit'}`));
  const ipHash = Array.from(new Uint8Array(digest), (byte) => byte.toString(16).padStart(2, '0')).join('');
  const now = Math.floor(Date.now() / 1000);
  const state = await env.DB.prepare('SELECT window_started, request_count FROM api_limits WHERE ip_hash = ?').bind(ipHash).first<{ window_started: number; request_count: number }>();
  if (state && state.window_started > now - 60 && state.request_count >= 40) return json({ error: 'تعداد درخواست‌ها بیش از حد مجاز است.' }, 429);
  await env.DB.prepare('INSERT INTO api_limits (ip_hash, window_started, request_count) VALUES (?, ?, 1) ON CONFLICT(ip_hash) DO UPDATE SET window_started = CASE WHEN api_limits.window_started <= ? THEN excluded.window_started ELSE api_limits.window_started END, request_count = CASE WHEN api_limits.window_started <= ? THEN 1 ELSE api_limits.request_count + 1 END').bind(ipHash, now, now - 60, now - 60).run();
  await env.DB.prepare('INSERT OR IGNORE INTO analytics_events (id, session_id, event_type, created_at, payload) VALUES (?, ?, ?, ?, ?)').bind(event.id, event.sessionId, String(event.eventType), createdAt, JSON.stringify(event)).run();
  await env.DB.prepare('DELETE FROM analytics_events WHERE created_at < ?').bind(new Date(Date.now() - 180 * 86400000).toISOString()).run();
  return json({ success: true }, 202);
};
