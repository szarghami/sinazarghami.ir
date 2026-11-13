import { json, listDevices, requireAdmin, type Env } from '../../_shared/runtime';

interface Context {
  request: Request;
  env: Env;
}

export async function onRequestGet({ request, env }: Context): Promise<Response> {
  const session = await requireAdmin(request, env);
  if (!session) return json({ success: false, error: 'Unauthorized.' }, 401);
  if (!env.ADMIN_KV) {
    return json({ success: true, devices: [], warning: 'ADMIN_KV is not configured.' });
  }
  const devices = await listDevices(env);
  return json({ success: true, devices, currentDeviceId: session.deviceId });
}
