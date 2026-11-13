import { json, requireAdmin, type Env } from '../_shared/runtime';

interface Context {
  request: Request;
  env: Env;
}

export async function onRequestPost({ request, env }: Context): Promise<Response> {
  const session = await requireAdmin(request, env);
  if (!session) return json({ success: false, error: 'Unauthorized.' }, 401);
  if (!env.TELEGRAM_BOT_TOKEN || !env.TELEGRAM_CHAT_ID) {
    return json({ success: false, error: 'Telegram secrets are not configured.' }, 503);
  }

  let body: { message?: string };
  try {
    body = (await request.json()) as { message?: string };
  } catch {
    return json({ success: false, error: 'Invalid JSON body.' }, 400);
  }
  const message = (body.message || '').trim();
  if (!message || message.length > 4000) {
    return json({ success: false, error: 'Message must be between 1 and 4000 characters.' }, 400);
  }

  const response = await fetch(`https://api.telegram.org/bot${env.TELEGRAM_BOT_TOKEN}/sendMessage`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      chat_id: env.TELEGRAM_CHAT_ID,
      text: message,
      parse_mode: 'HTML',
      disable_web_page_preview: true,
    }),
  });
  if (!response.ok) {
    return json({ success: false, error: `Telegram failed (${response.status}).` }, 502);
  }
  return json({ success: true });
}
