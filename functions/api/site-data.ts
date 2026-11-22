import {
  getGitHubFile,
  isValidContent,
  json,
  putGitHubFile,
  requireAdmin,
  type Env,
} from './_shared/runtime';
import { prepareEnglishFields } from './_shared/translateContent';
import { translateLatestContent } from './_shared/translationJob';

interface Context {
  request: Request;
  env: Env;
  waitUntil?: (promise: Promise<unknown>) => void;
}

const CONTENT_PATH = 'public/site-data.json';
const MAX_CONTENT_BYTES = 1_500_000;

export async function onRequestGet({ request, env }: Context): Promise<Response> {
  const session = await requireAdmin(request, env);
  if (!session) return json({ success: false, error: 'Unauthorized.' }, 401);

  try {
    const file = await getGitHubFile(env, CONTENT_PATH);
    if (!file) return json({ success: false, error: 'site-data.json not found.' }, 404);
    return json({ success: true, content: JSON.parse(file.content), sha: file.sha });
  } catch (error) {
    return json(
      { success: false, error: error instanceof Error ? error.message : 'GitHub read failed.' },
      503,
    );
  }
}

export async function onRequestPost({ request, env, waitUntil }: Context): Promise<Response> {
  const session = await requireAdmin(request, env);
  if (!session) return json({ success: false, error: 'Unauthorized.' }, 401);

  let content: unknown;
  try {
    content = await request.json();
  } catch {
    return json({ success: false, error: 'Invalid JSON body.' }, 400);
  }
  if (!isValidContent(content)) {
    return json({ success: false, error: 'ساختار محتوا معتبر نیست.' }, 400);
  }

  try {
    let file = await getGitHubFile(env, CONTENT_PATH);
    let previous: Record<string, unknown> | null = null;
    try { if (file) previous = JSON.parse(file.content) as Record<string, unknown>; } catch { /* no previous snapshot */ }
    const pending = prepareEnglishFields(content as Record<string, unknown>, previous);
    const translation = { translated: 0, failed: 0, pending };
    const serialized = JSON.stringify(content);
    if (new TextEncoder().encode(serialized).byteLength > MAX_CONTENT_BYTES) return json({ success: false, error: 'حجم محتوا بیش از حد مجاز است.' }, 413);
    let commitSha: string;
    try {
      commitSha = await putGitHubFile(
        env,
        CONTENT_PATH,
        `${serialized}\n`,
        'content: publish from admin studio',
        file?.sha,
      );
    } catch (error) {
      if (!String(error).includes('409')) throw error;
      file = await getGitHubFile(env, CONTENT_PATH);
      commitSha = await putGitHubFile(
        env,
        CONTENT_PATH,
        `${serialized}\n`,
        'content: publish from admin studio',
        file?.sha,
      );
    }
    if (pending && waitUntil) waitUntil(translateLatestContent(env).catch(() => undefined));
    return json({ success: true, content, commitSha, translation });
  } catch (error) {
    return json(
      { success: false, error: error instanceof Error ? error.message : 'GitHub write failed.' },
      503,
    );
  }
}
