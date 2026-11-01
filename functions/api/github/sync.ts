import { bodyJson, Env, json, PagesContext, requireAdmin } from '../_shared/runtime';

interface SyncBody { content?: Record<string, unknown> }

export const onRequestPost = async ({ request, env }: PagesContext<Env & { GITHUB_TOKEN?: string; GITHUB_REPOSITORY?: string }>) => {
  const denied = await requireAdmin(request, env);
  if (denied) return denied;
  if (!env.GITHUB_TOKEN || !env.GITHUB_REPOSITORY || !/^[A-Za-z0-9_.-]+\/[A-Za-z0-9_.-]+$/.test(env.GITHUB_REPOSITORY)) {
    return json({ success: false, error: 'همگام‌سازی گیت‌هاب در تنظیمات سرور فعال نشده است.' }, 503);
  }
  const body = await bodyJson<SyncBody>(request);
  if (!body?.content || typeof body.content !== 'object' || !body.content.profile) return json({ success: false, error: 'محتوای سایت نامعتبر است.' }, 400);
  const [owner, repo] = env.GITHUB_REPOSITORY.split('/');
  const endpoint = `https://api.github.com/repos/${owner}/${repo}/contents/public/site-data.json`;
  const headers = { Authorization: `Bearer ${env.GITHUB_TOKEN}`, Accept: 'application/vnd.github+json', 'X-GitHub-Api-Version': '2022-11-28', 'User-Agent': 'sinazarghami-pages-functions' };
  try {
    const current = await fetch(endpoint, { headers });
    let sha: string | undefined;
    if (current.ok) sha = ((await current.json()) as { sha?: string }).sha;
    else if (current.status !== 404) return json({ success: false, error: 'دریافت وضعیت فایل از گیت‌هاب ناموفق بود.' }, 502);
    const encoded = btoa(unescape(encodeURIComponent(JSON.stringify(body.content, null, 2))));
    const update = await fetch(endpoint, {
      method: 'PUT', headers: { ...headers, 'Content-Type': 'application/json' },
      body: JSON.stringify({ message: 'Update site content from admin studio', content: encoded, ...(sha ? { sha } : {}), branch: 'main' }),
    });
    if (!update.ok) return json({ success: false, error: 'ثبت فایل در گیت‌هاب ناموفق بود.' }, 502);
    return json({ success: true });
  } catch {
    return json({ success: false, error: 'خطا در ارتباط با گیت‌هاب.' }, 502);
  }
};
