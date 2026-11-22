import { json, type Env } from './_shared/runtime';
import { translateLatestContent } from './_shared/translationJob';

interface Context { request: Request; env: Env }
export async function onRequestPost({ request, env }: Context): Promise<Response> {
  const secret = env.TRANSLATION_CRON_SECRET;
  if (!secret || secret.length < 24 || request.headers.get('Authorization') !== `Bearer ${secret}`) return json({ success: false, error: 'Unauthorized' }, 401);
  try { return json({ success: true, report: await translateLatestContent(env) }); }
  catch { return json({ success: false, error: 'Translation retry failed' }, 503); }
}
