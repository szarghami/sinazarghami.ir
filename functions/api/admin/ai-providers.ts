import { aiProviderConfigured, getAiSettings, saveAiSettings, type AiProvider } from '../_shared/ai';
import { json, requireAdmin, type Env } from '../_shared/runtime';

interface Context { request: Request; env: Env }
const PROVIDERS: AiProvider[] = ['gemini', 'anthropic', 'openai'];

export async function onRequestGet({ request, env }: Context): Promise<Response> {
  if (!await requireAdmin(request, env)) return json({ success: false, error: 'Unauthorized' }, 401);
  return json({ success: true, settings: await getAiSettings(env), configured: Object.fromEntries(PROVIDERS.map((provider) => [provider, aiProviderConfigured(env, provider)])), writable: !!env.ADMIN_KV });
}

export async function onRequestPost({ request, env }: Context): Promise<Response> {
  if (!await requireAdmin(request, env)) return json({ success: false, error: 'Unauthorized' }, 401);
  if (!env.ADMIN_KV) return json({ success: false, error: 'ADMIN_KV تنظیم نشده است.' }, 503);
  let body: { order?: unknown; paidFallback?: unknown };
  try { body = await request.json() as typeof body; } catch { return json({ success: false, error: 'Invalid JSON' }, 400); }
  if (!Array.isArray(body.order) || body.order.some((name) => !PROVIDERS.includes(name)) || new Set(body.order).size !== body.order.length || (body.paidFallback !== null && !PROVIDERS.includes(body.paidFallback as AiProvider)) || body.order.includes(body.paidFallback)) {
    return json({ success: false, error: 'ترتیب سرویس‌ها معتبر نیست.' }, 400);
  }
  const settings = { order: body.order as AiProvider[], paidFallback: body.paidFallback as AiProvider | null };
  if (!settings.order.length && !settings.paidFallback) return json({ success: false, error: 'حداقل یک سرویس را انتخاب کنید.' }, 400);
  await saveAiSettings(env, settings);
  return json({ success: true, settings });
}
