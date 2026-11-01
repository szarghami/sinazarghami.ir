import { bodyJson, Env, hashPasscode, json, PagesContext, requireAdmin, validPasscode } from './_shared/runtime';

interface PasscodeBody { passcode?: string }

export const onRequestGet = async () => json({ error: 'برای امنیت، دریافت رمز عبور پشتیبانی نمی‌شود.' }, 405, { Allow: 'POST' });

export const onRequestPost = async ({ request, env }: PagesContext<Env>) => {
  const denied = await requireAdmin(request, env);
  if (denied) return denied;
  const body = await bodyJson<PasscodeBody>(request);
  const passcode = body?.passcode?.trim();
  if (!validPasscode(passcode)) return json({ error: 'رمز جدید باید حداقل ۸ نویسه داشته باشد.' }, 400);
  const salt = crypto.randomUUID();
  const passcode_hash = await hashPasscode(passcode, salt);
  await env.DB.prepare('INSERT INTO admin_credentials (id, salt, passcode_hash) VALUES (1, ?, ?) ON CONFLICT(id) DO UPDATE SET salt = excluded.salt, passcode_hash = excluded.passcode_hash, updated_at = CURRENT_TIMESTAMP')
    .bind(salt, passcode_hash).run();
  return json({ success: true });
};
