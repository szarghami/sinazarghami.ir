import { json, requireAdmin, revokeDevice, type Env } from '../../_shared/runtime';

interface Context {
  request: Request;
  env: Env;
  params: { id?: string };
}

export async function onRequestDelete({ request, env, params }: Context): Promise<Response> {
  const session = await requireAdmin(request, env);
  if (!session) return json({ success: false, error: 'Unauthorized.' }, 401);
  if (!env.ADMIN_KV) {
    return json({ success: false, error: 'ADMIN_KV is not configured.' }, 503);
  }
  const id = params.id || '';
  if (!id) return json({ success: false, error: 'Device id is required.' }, 400);
  if (id === session.deviceId) {
    return json({ success: false, error: 'برای خارج‌کردن دستگاه فعلی از دکمه خروج استفاده کن.' }, 400);
  }
  await revokeDevice(env, id);
  return json({ success: true });
}
