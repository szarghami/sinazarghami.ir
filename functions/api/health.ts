import {
  getGitHubFile,
  getInitialPasscode,
  getRepo,
  getSessionSecret,
  json,
  type Env,
} from './_shared/runtime';

const VERSION = '2026-11-14-chunked';
const KV_PROBE_KEY = 'health:probe';

interface RequestWithCf extends Request {
  cf?: { colo?: string; country?: string };
}

interface Context {
  request: Request;
  env: Env;
}

/**
 * تست خواندن/نوشتن KV. مقدار قبلی کلید تست بازگردانده می‌شود تا چیزی خراب نشود.
 * فقط با ?deep=1 اجرا می‌شود تا درخواست‌های عادی هزینه‌ی نوشتن نداشته باشند.
 */
async function probeKv(env: Env): Promise<{ bound: boolean; ok: boolean; error?: string }> {
  if (!env.ADMIN_KV) return { bound: false, ok: false, error: 'binding ADMIN_KV تنظیم نشده است.' };
  try {
    const previous = await env.ADMIN_KV.get(KV_PROBE_KEY);
    const marker = `ok-${Date.now()}`;
    await env.ADMIN_KV.put(KV_PROBE_KEY, marker, { expirationTtl: 120 });
    const value = await env.ADMIN_KV.get(KV_PROBE_KEY);
    if (previous === null) {
      await env.ADMIN_KV.delete(KV_PROBE_KEY);
    } else {
      await env.ADMIN_KV.put(KV_PROBE_KEY, previous, { expirationTtl: 120 });
    }
    return value === marker
      ? { bound: true, ok: true }
      : { bound: true, ok: false, error: 'نوشتن در KV خوانده نشد.' };
  } catch (error) {
    return {
      bound: true,
      ok: false,
      error: error instanceof Error ? error.message : 'خطای نامشخص KV',
    };
  }
}

/**
 * تست خواندن واقعی از مخزن با توکن. اگر توکن منقضی شده باشد یا به مخزن دسترسی نداشته باشد،
 * همین‌جا معلوم می‌شود؛ نه بعد از این‌که کاربر یک پست کامل نوشت و انتشار شکست خورد.
 */
async function probeGitHub(
  env: Env,
): Promise<{ configured: boolean; read: boolean; error?: string }> {
  if (!env.GITHUB_TOKEN) return { configured: false, read: false };
  try {
    const file = await getGitHubFile(env, 'public/site-data.json');
    return { configured: true, read: Boolean(file) };
  } catch (error) {
    return {
      configured: true,
      read: false,
      error: error instanceof Error ? error.message : 'خطای نامشخص گیت‌هاب',
    };
  }
}

export async function onRequestGet({ request, env }: Context): Promise<Response> {
  const cf = (request as RequestWithCf).cf;
  const url = new URL(request.url);
  const deep = url.searchParams.get('deep') === '1';
  const { repo, branch } = getRepo(env);

  let storedPasscode = false;
  if (env.ADMIN_KV) {
    try {
      storedPasscode = Boolean(await env.ADMIN_KV.get('admin:credentials'));
    } catch {
      storedPasscode = false;
    }
  }

  return json({
    ok: true,
    version: VERSION,
    colo: cf?.colo || null,
    country: cf?.country || null,
    checks: {
      sessionSecret: Boolean(getSessionSecret(env)),
      initialPasscode: Boolean(getInitialPasscode(env)),
      passcodeChanged: storedPasscode,
      kv: deep ? await probeKv(env) : { bound: Boolean(env.ADMIN_KV), ok: null },
      github: deep
        ? { repo, branch, ...(await probeGitHub(env)) }
        : { configured: Boolean(env.GITHUB_TOKEN), repo, branch },
      gemini: Boolean(env.GEMINI_API_KEY),
      telegram: Boolean(env.TELEGRAM_BOT_TOKEN && env.TELEGRAM_CHAT_ID),
    },
  });
}

export async function onRequestPost({ request }: { request: Request }): Promise<Response> {
  let received = 0;
  try {
    received = (await request.arrayBuffer()).byteLength;
  } catch {
    received = -1;
  }
  const cf = (request as RequestWithCf).cf;
  return json({ ok: true, version: VERSION, received, colo: cf?.colo || null });
}
