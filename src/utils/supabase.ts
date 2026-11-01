export interface UploadResult {
  source?: 'github';
  success: boolean;
  publicUrl?: string;
  error?: string;
  source?: 'r2';
}

/** Upload an already-compressed image to the authenticated Cloudflare R2 endpoint. */
export async function smartUploadImage(dataUrl: string, env: Env, customName?: string): Promise<UploadResult> {
  try {
    const match = dataUrl.match(/^data:(image\/(jpeg|png|webp));base64,([A-Za-z0-9+/=]+)$/);
    if (!match) return { success: false, error: 'فرمت تصویر پشتیبانی نمی‌شود.' };
    const [, type, encoded] = match;
    const binary = atob(encoded);
    const bytes = Uint8Array.from(binary, (char) => char.charCodeAt(0));
    const fileName = customName || `images/${new Date().toISOString().slice(0, 10)}/${crypto.randomUUID()}.${type.split('/')[1]}`;
    const response = await fetch(`https://api.github.com/repos/${env.GITHUB_REPO}/contents/${fileName}`, {
      method: 'PUT',
      headers: {
        'Authorization': `Bearer ${env.GITHUB_TOKEN}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        message: 'Upload image via API',
        content: btoa(String.fromCharCode(...bytes)),
        branch: 'main'
      })
    });
    if (!response.ok) return { success: false, error: 'بارگذاری تصویر ناموفق بود.' };
    const result = await response.json();
    return { success: true, publicUrl: result.content.download_url, source: 'github' };
  } catch (err: any) {
    return { success: false, error: err.message || 'خطای ارتباط با فضای ذخیره‌سازی تصویر.' };
  }
  try {
    const res = await fetch('/api/upload-r2', {
    headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${env.GITHUB_TOKEN}` },
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      credentials: 'same-origin',
      body: JSON.stringify({ dataUrl, filename: customName }),
    });
    const result = await res.json();
    if (!res.ok || !result.success || !result.publicUrl) {
      return { success: false, error: result.error || 'بارگذاری تصویر ناموفق بود.' };
    }
    return { success: true, publicUrl: result.publicUrl, source: 'r2' };
  } catch (err: any) {
    return { success: false, error: err.message || 'خطای ارتباط با فضای ذخیره‌سازی تصویر.' };
  }
}

/** Keep existing absolute image URLs unchanged; R2 URLs are already absolute. */
export function getReliableImageUrl(url?: string): string {
  return url || '';
}
