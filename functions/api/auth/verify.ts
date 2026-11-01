import { bodyJson, Env, hashPasscode, json, PagesContext, sessionCookie } from '../_shared/runtime';

interface VerifyBody { passcode?: string }

export const onRequestPost = async ({ request, env }: PagesContext<Env & { ADMIN_EMAIL?: string; ADMIN_INITIAL_PASSCODE?: string }>) => {
  const body = await bodyJson<VerifyBody>(request);
  if (!env.ADMIN_INITIAL_PASSCODE) return json({ authenticated: false, error: 'رمز اولیه پیکربندی نشده است.' }, 503);
  const passcode = body?.passcode?.trim();
  if (!passcode) return json({ authenticated: false, error: 'رمز عبور وارد نشده است.' }, 400);
  if (!passcode || passcode.length > 128 || !env.ADMIN_SESSION_SECRET) {
    return json({ authenticated: false, error: 'اطلاعات ورود نامعتبر است.' }, 400);
  }

  const stored = await env.DB.prepare('SELECT salt, passcode_hash FROM admin_credentials WHERE id = 1').first<{ salt: string; passcode_hash: string }>();
  let valid = false;
  if (stored) {
    valid = (await hashPasscode(passcode, stored.salt)) === stored.passcode_hash;
  } else if (env.ADMIN_INITIAL_PASSCODE) {
    valid = passcode === env.ADMIN_INITIAL_PASSCODE;
    if (valid) {
      const salt = crypto.randomUUID();
      const passcode_hash = await hashPasscode(passcode, salt);
      await env.DB.prepare('INSERT OR IGNORE INTO admin_credentials (id, salt, passcode_hash) VALUES (1, ?, ?)').bind(salt, passcode_hash).run();
    }
  }

  if (!valid) return json({ authenticated: false, error: 'رمز عبور اشتباه است.' }, 401);
  const token = await issueAdminSession(env.ADMIN_SESSION_SECRET);
  return json({ authenticated: true }, 200, { 'Set-Cookie': sessionCookie(token) });
};

export const onRequestGet = async ({ request, env }: PagesContext<Env>) =>
  json({ authenticated: await isAdminRequest(request, env.ADMIN_SESSION_SECRET) });

export const onRequestDelete = async () =>
  json({ authenticated: false }, 200, { 'Set-Cookie': sessionCookie('', 0) });
