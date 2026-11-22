import { ensureEnglishFields } from './translateContent';
import { getGitHubFile, putGitHubFile, type Env } from './runtime';

const CONTENT_PATH = 'public/site-data.json';

export async function translateLatestContent(env: Env) {
  const file = await getGitHubFile(env, CONTENT_PATH);
  if (!file) throw new Error('site-data.json not found');
  const content = JSON.parse(file.content) as Record<string, unknown>;
  const report = await ensureEnglishFields(env, content);
  if (report.translated) {
    // Never retry a conflicting write with an old snapshot: the next scheduled run reads fresh content.
    await putGitHubFile(env, CONTENT_PATH, `${JSON.stringify(content)}\n`, 'content: translate published content', file.sha);
  }
  if ((report.translated || report.failed || report.pending) && env.TELEGRAM_BOT_TOKEN && env.TELEGRAM_CHAT_ID) {
    try {
      await fetch(`https://api.telegram.org/bot${env.TELEGRAM_BOT_TOKEN}/sendMessage`, {
        method: 'POST', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ chat_id: env.TELEGRAM_CHAT_ID, text: `گزارش ترجمه سایت\nترجمه‌شده: ${report.translated}\nناموفق: ${report.failed}\nدر انتظار: ${report.pending}` }),
      });
    } catch { /* The translation remains saved even if notification fails. */ }
  }
  return report;
}
