import { Env, json, PagesContext, requireAdmin } from '../_shared/runtime';

type EventRow = { payload: string; created_at: string; event_type: string; session_id: string };

export const onRequestGet = async ({ request, env }: PagesContext<Env>) => {
  const denied = await requireAdmin(request, env);
  if (denied) return denied;
  const { results } = await env.DB.prepare('SELECT payload, created_at, event_type, session_id FROM analytics_events ORDER BY created_at DESC LIMIT 5000').all<EventRow>();
  const events = results.map((row) => { try { return JSON.parse(row.payload) as Record<string, unknown>; } catch { return {}; } });
  const today = new Date().toISOString().slice(0, 10);
  const yesterdayDate = new Date(Date.now() - 86400000).toISOString().slice(0, 10);
  const count = (type: string) => results.filter((row) => row.event_type === type).length;
  const breakdown = (key: string) => {
    const counts = new Map<string, number>();
    for (const event of events) { const label = typeof event[key] === 'string' ? event[key] as string : 'Unknown'; counts.set(label, (counts.get(label) || 0) + 1); }
    return [...counts].map(([name, value]) => ({ name, count: value, percent: events.length ? Math.round(value * 100 / events.length) : 0 })).sort((a, b) => b.count - a.count).slice(0, 10);
  };
  const abandoned = events.filter((event) => event.eventType === 'abandon_checkout').slice(0, 50).map((event) => ({
    photoTitle: String(event.photoTitle || 'نامشخص'), photoId: typeof event.photoId === 'string' ? event.photoId : undefined,
    priceToman: typeof event.priceToman === 'number' ? event.priceToman : undefined,
    browser: typeof event.browser === 'string' ? event.browser : undefined,
    device: typeof event.device === 'string' ? event.device : undefined,
    referrer: typeof event.referrer === 'string' ? event.referrer : undefined,
    timestamp: String(event.clientTimestamp || ''), persianDate: String(event.persianDate || ''),
  }));
  return json({
    totalPageViews: count('page_view'),
    todayViews: results.filter((row) => row.event_type === 'page_view' && row.created_at.startsWith(today)).length,
    yesterdayViews: results.filter((row) => row.event_type === 'page_view' && row.created_at.startsWith(yesterdayDate)).length,
    totalSessions: new Set(results.map((row) => row.session_id)).size,
    abandonedCheckoutsCount: count('abandon_checkout'), completedOrdersCount: count('complete_order'),
    abandonmentRate: count('abandon_checkout') + count('complete_order') ? Math.round(count('abandon_checkout') * 100 / (count('abandon_checkout') + count('complete_order'))) : 0,
    topBrowsers: breakdown('browser'), topDevices: breakdown('device'), topReferrers: breakdown('referrer'),
    abandonedCartList: abandoned, recentEvents: events.slice(0, 50),
  });
};
