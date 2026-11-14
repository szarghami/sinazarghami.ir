import {
  clearSessionCookie,
  createDeviceId,
  getSession,
  getSessionSecret,
  json,
  makeSessionCookie,
  registerDevice,
  verifyPasscode,
  type Env,
} from '../_shared/runtime';
import { readRequestJson } from '../_shared/request';

interface Context {
  request: Request;
  env: Env;
}

export async function onRequestGet({ request, env }: Context): Promise<Response> {
  const session = await getSession(request, env);
  return json({
    authenticated: Boolean(session),
    deviceId: session?.deviceId || null,
  });
}

export async function onRequestPost({ request, env }: Context): Promise<Response> {
  if (!getSessionSecret(env)) {
    return json({ authenticated: false, error: 'ADMIN_SESSION_SECRET is not configured.' }, 503);
  }

  const body =
    (await readRequestJson<{ passcode?: string; deviceLabel?: string }>(request)) ?? {};

  const passcode = (body.passcode || '').trim();
  if (!passcode) return json({ authenticated: false, error: 'Passcode is required.' }, 400);

  if (!(await verifyPasscode(env, passcode))) {
    return json({ authenticated: false, error: 'رمز عبور نادرست است.' }, 401);
  }

  const deviceId = createDeviceId();
  const deviceLabel = (body.deviceLabel || request.headers.get('User-Agent') || 'Trusted device').slice(0, 120);
  await registerDevice(env, deviceId, deviceLabel);

  return json(
    { authenticated: true, deviceId },
    200,
    { 'Set-Cookie': await makeSessionCookie(request, env, deviceId) },
  );
}

export async function onRequestDelete({ request }: Context): Promise<Response> {
  return json(
    { authenticated: false },
    200,
    { 'Set-Cookie': clearSessionCookie(request) },
  );
}
