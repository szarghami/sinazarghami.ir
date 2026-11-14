import { uploadImageFile } from './transport';
import { videoThumbnail } from './videoEmbed';
import type { PhotoItem } from '../types';

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

/**
 * تصویر کاور یک پست. اگر پست عکس نداشته باشد، تصویر بندانگشتی اولین ویدیو
 * (مثلاً کاور یوتیوب) استفاده می‌شود.
 */
export function getPostCoverUrl(photo: Pick<PhotoItem, 'imageUrl' | 'videos'>): string {
  if (photo.imageUrl) return photo.imageUrl;
  const firstVideo = photo.videos?.find((video) => video.url);
  return firstVideo ? videoThumbnail(firstVideo.url) || '' : '';
}
