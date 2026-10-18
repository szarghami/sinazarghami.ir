// =====================================================================
// ماژول ایزوله‌شده و خنثی‌شده Supabase (Pure Static Architecture)
// کلیه اتصالات به دامنه مسدودشده supabase.co به طور کامل خنثی و غیرفعال شده‌اند
// و وب‌سایت کاملاً بر پایه Pure Static Git-CMS و حافظه داخلی کار می‌کند.
// =====================================================================

export interface UploadResult {
  success: boolean;
  publicUrl?: string;
  error?: string;
  isRlsBlocked?: boolean;
  source?: 'github' | 'local_storage';
}

/**
 * تبدیل Data URL (Base64) به شیء Blob
 */
export function dataUrlToBlob(dataUrl: string): { blob: Blob; contentType: string } {
  const parts = dataUrl.split(';base64,');
  const contentType = parts[0].split(':')[1] || 'image/webp';
  const raw = window.atob(parts[1]);
  const rawLength = raw.length;
  const uInt8Array = new Uint8Array(rawLength);

  for (let i = 0; i < rawLength; ++i) {
    uInt8Array[i] = raw.charCodeAt(i);
  }

  return {
    blob: new Blob([uInt8Array], { type: contentType }),
    contentType,
  };
}

/**
 * سازگاری با کدهای پیشین بدون برقراری هرگونه ارتباط شبکه با سرورهای خارجی یا فیلترشده
 */
export async function uploadToSupabaseStorage(
  fileOrDataUrl: Blob | string,
  _customName?: string
): Promise<UploadResult> {
  let publicUrl = '';
  if (typeof fileOrDataUrl === 'string') {
    publicUrl = fileOrDataUrl;
  }
  return {
    success: true,
    publicUrl,
    source: 'local_storage',
  };
}

/**
 * آپلود دوگانه خنثی‌شده - بازگرداندن داده محلی بدون ارسال درخواست به سوپابیس
 */
export async function smartUploadImage(
  dataUrl: string,
  _customName?: string
): Promise<UploadResult> {
  return {
    success: true,
    publicUrl: dataUrl,
    source: 'local_storage',
  };
}

/**
 * تبدیل آدرس تصاویر به آدرس پایدار، محلی و بدون فیلتر در تمام مرورگرها و اینترنت ایران
 */
export function getReliableImageUrl(url?: string): string {
  if (!url) return '';
  return url;
}
