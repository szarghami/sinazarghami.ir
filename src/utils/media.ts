import { uploadImageFile } from './transport';

export interface UploadResult {
  success: boolean;
  publicUrl?: string;
  error?: string;
}

export async function smartUploadImage(dataUrl: string, customName?: string): Promise<UploadResult> {
  const result = await uploadImageFile(dataUrl, customName || 'image');
  if (!result.success || !result.publicUrl) {
    return { success: false, error: result.error || 'بارگذاری تصویر ناموفق بود.' };
  }
  return { success: true, publicUrl: result.publicUrl };
}

export function getReliableImageUrl(url?: string): string {
  return url || '';
}
