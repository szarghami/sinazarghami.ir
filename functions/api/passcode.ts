import { json, requireAdmin, savePasscode, type Env } from './_shared/runtime';

interface Context {
  request: Request;
  env: Env;
}

export async function onRequestPost({ request, env }: Context): Promise<Response> {
  const session = await requireAdmin(request, env);
  if (!session) return json({ success: false, error: 'Unauthorized.' }, 401);
  if (!env.ADMIN_KV) {
    return json(
      { success: false, error: 'برای تغییر رمز، binding با نام ADMIN_KV را در Cloudflare اضافه کن.' },
      503,
    );
  }

  let body: { passcode?: string };
  try {
    body = (await request.json()) as { passcode?: string };
  } catch {
    return json({ success: false, error: 'Invalid JSON body.' }, 400);
  }

  const passcode = (body.passcode || '').trim();
  if (passcode.length < 8 || passcode.length > 128) {
    return json({ success: false, error: 'رمز جدید باید بین ۸ تا ۱۲۸ نویسه باشد.' }, 400);
  }

  await savePasscode(env, passcode);
  return json({ success: true });
}
