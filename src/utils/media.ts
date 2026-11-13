export interface UploadResult {
  success: boolean;
  publicUrl?: string;
  error?: string;
}

export async function smartUploadImage(dataUrl: string, customName?: string): Promise<UploadResult> {
  try {
    const response = await fetch('/api/media', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      credentials: 'same-origin',
      body: JSON.stringify({ dataUrl, filename: customName }),
    });
    const result = await response.json().catch(() => ({}));
    if (!response.ok || !result.success || !result.publicUrl) {
      return { success: false, error: result.error || 'بارگذاری تصویر ناموفق بود.' };
    }
    return { success: true, publicUrl: result.publicUrl };
  } catch (error) {
    return {
      success: false,
      error: error instanceof Error ? error.message : 'خطای ارتباط با سرویس تصویر.',
    };
  }
}

export function getReliableImageUrl(url?: string): string {
  return url || '';
}
