import { dataUrlToParts, uploadImageFile } from './transport';
import { uploadFileToArvan } from './arvanUpload';
import { arvanProxyUrl } from './arvanUrl';
import { videoThumbnail } from './videoEmbed';
import type { PhotoItem } from '../types';

export interface UploadResult {
  success: boolean;
  publicUrl?: string;
  error?: string;
  provider?: 'arvan' | 'github';
  warning?: string;
}

function base64ToBlob(base64: string, mimeType: string): Blob {
  const binary = atob(base64);
  const bytes = new Uint8Array(binary.length);
  for (let index = 0; index < binary.length; index += 1) {
    bytes[index] = binary.charCodeAt(index);
  }
  return new Blob([bytes], { type: mimeType });
}

/**
 * اول تصویر را مستقیم در فضای ابری آروان ذخیره می‌کند. اگر آروان تنظیم
 * نشده باشد یا آپلود شکست بخورد، همان مسیر قدیمی گیت‌هاب به‌عنوان
 * جایگزین اجرا می‌شود تا پنل هیچ‌وقت قفل نشود.
 */
export async function smartUploadImage(
  dataUrl: string,
  customName?: string,
  onProgress?: (loaded: number, total: number) => void,
): Promise<UploadResult> {
  const filename = customName || 'image';
  const parts = dataUrlToParts(dataUrl);

  if (parts) {
    try {
      const uploaded = await uploadFileToArvan(base64ToBlob(parts.base64, parts.mimeType), {
        filename,
        mimeType: parts.mimeType,
        kind: 'image',
        onProgress,
      });
      return { success: true, publicUrl: uploaded.publicUrl, provider: 'arvan' };
    } catch (arvanError) {
      const result = await uploadImageFile(dataUrl, filename, onProgress);
      if (!result.success || !result.publicUrl) {
        const arvanMessage =
          arvanError instanceof Error ? arvanError.message : 'آپلود در آروان ناموفق بود.';
        return {
          success: false,
          error: `${arvanMessage} ${result.error || 'بارگذاری جایگزین در گیت‌هاب هم ناموفق بود.'}`,
        };
      }
      return {
        success: true,
        publicUrl: result.publicUrl,
        provider: 'github',
        warning: 'آروان در دسترس نبود؛ تصویر در گیت‌هاب ذخیره شد.',
      };
    }
  }

  const result = await uploadImageFile(dataUrl, filename, onProgress);
  if (!result.success || !result.publicUrl) {
    return { success: false, error: result.error || 'بارگذاری تصویر ناموفق بود.' };
  }
  return { success: true, publicUrl: result.publicUrl, provider: 'github' };
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
