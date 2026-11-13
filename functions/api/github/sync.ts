import { json, requireAdmin, type Env } from '../_shared/runtime';

interface Context {
  request: Request;
  env: Env;
}

export async function onRequestPost({ request, env }: Context): Promise<Response> {
  const session = await requireAdmin(request, env);
  if (!session) return json({ success: false, error: 'Unauthorized.' }, 401);
  return json({ success: true, skipped: true, message: 'Content is committed by /api/site-data.' });
}
