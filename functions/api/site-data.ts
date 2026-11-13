import {
  getGitHubFile,
  isValidContent,
  json,
  putGitHubFile,
  requireAdmin,
  type Env,
} from './_shared/runtime';

interface Context {
  request: Request;
  env: Env;
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

export async function onRequestPost({ request, env }: Context): Promise<Response> {
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

  const serialized = JSON.stringify(content);
  if (new TextEncoder().encode(serialized).byteLength > MAX_CONTENT_BYTES) {
    return json({ success: false, error: 'حجم محتوا بیش از حد مجاز است.' }, 413);
  }

  try {
    let file = await getGitHubFile(env, CONTENT_PATH);
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
    return json({ success: true, content, commitSha });
  } catch (error) {
    return json(
      { success: false, error: error instanceof Error ? error.message : 'GitHub write failed.' },
      503,
    );
  }
}
