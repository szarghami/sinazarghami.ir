import { json, requireAdmin, type Env } from '../_shared/runtime';
import { MAX_CHUNKS } from '../_shared/uploads';

interface Context {
  request: Request;
  env: Env;
}

export async function onRequestPost({ request, env }: Context): Promise<Response> {
  const session = await requireAdmin(request, env);
  if (!session) return json({ success: false, error: 'Unauthorized.' }, 401);
  if (!env.ADMIN_KV) {
    return json(
      {
        success: false,
        error: 'برای آپلود، binding با نام ADMIN_KV را در Cloudflare اضافه کنید.',
      },
      503,
    );
  }

  let body: { kind?: string; total?: number };
  try {
    body = (await request.json()) as typeof body;
  } catch {
    return json({ success: false, error: 'Invalid JSON body.' }, 400);
  }

  const kind = body.kind === 'content' || body.kind === 'media' ? body.kind : null;
  if (!kind) return json({ success: false, error: 'نوع آپلود نامعتبر است.' }, 400);

  const total = Number(body.total);
  if (!Number.isInteger(total) || total < 1 || total > MAX_CHUNKS) {
    return json({ success: false, error: 'تعداد تکه‌ها نامعتبر است.' }, 400);
  }

  return json({ success: true, uploadId: crypto.randomUUID(), kind, total });
}
