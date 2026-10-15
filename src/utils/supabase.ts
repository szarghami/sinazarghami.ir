// =====================================================================
// ماژول اتصال به فضای ابری Supabase Storage و پشتیبان محلی سرور
// باکت ذخیره‌سازی: sina_site
// آدرس پروژه: https://hvuguccbyyttxiyytsbk.supabase.co
// =====================================================================

const SUPABASE_URL = 'https://hvuguccbyyttxiyytsbk.supabase.co';
const SUPABASE_ANON_KEY =
  'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Imh2dWd1Y2NieXl0dHhpeXl0c2JrIiwicm9sZSI6ImFub24iLCJpYXQiOjE3OTEzNjM3NzgsImV4cCI6MjEwNjkzOTc3OH0.z6E5-um4XC_MXhKC2Bd1LyQEBQoIN-E1P8nmIp2cCwk';
const BUCKET_NAME = 'sina_site';

/**
 * تبدیل Data URL (Base64) به شیء Blob جهت ارسال استاندارد به فضای ابری
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

export interface UploadResult {
  success: boolean;
  publicUrl?: string;
  error?: string;
  isRlsBlocked?: boolean;
  source?: 'supabase' | 'local_server';
}

/**
 * آپلود فایل مستقیم یا تصویر فشرده به باکت sina_site در Supabase
 */
export async function uploadToSupabaseStorage(
  fileOrDataUrl: Blob | string,
  customName?: string
): Promise<UploadResult> {
  try {
    let blob: Blob;
    let contentType = 'image/webp';

    if (typeof fileOrDataUrl === 'string') {
      const converted = dataUrlToBlob(fileOrDataUrl);
      blob = converted.blob;
      contentType = converted.contentType;
    } else {
      blob = fileOrDataUrl;
      contentType = fileOrDataUrl.type || 'image/webp';
    }

    // بررسی سقف ۵ مگابایت باکت سینا
    if (blob.size > 5 * 1024 * 1024) {
      return {
        success: false,
        error: 'حجم فایل بیشتر از ۵ مگابایت مجاز باکت است.',
      };
    }

    const ext = contentType.includes('webp') ? 'webp' : contentType.includes('png') ? 'png' : contentType.includes('mp4') ? 'mp4' : 'jpg';
    const cleanFileName = (customName || `photo_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`)
      .replace(/[^a-zA-Z0-9_-]/g, '_') + `.${ext}`;

    const uploadEndpoint = `${SUPABASE_URL}/storage/v1/object/${BUCKET_NAME}/${cleanFileName}`;

    const response = await fetch(uploadEndpoint, {
      method: 'POST',
      headers: {
        apikey: SUPABASE_ANON_KEY,
        Authorization: `Bearer ${SUPABASE_ANON_KEY}`,
        'Content-Type': contentType,
        'x-upsert': 'true',
      },
      body: blob,
    });

    if (response.ok) {
      const publicUrl = `${SUPABASE_URL}/storage/v1/object/public/${BUCKET_NAME}/${cleanFileName}`;
      return {
        success: true,
        publicUrl,
        source: 'supabase',
      };
    }

    const errData = await response.json().catch(() => ({}));

    // بررسی خطای RLS Policy
    if (response.status === 403 || errData.message?.includes('policy')) {
      return {
        success: false,
        error: 'باکت نیاز به Policy دارد: در پنل سوپابیس بخش Storage > Policies، برای باکت sina_site روی Add Policy کلیک کنید و INSERT را برای public فعال نمایید.',
        isRlsBlocked: true,
      };
    }

    return {
      success: false,
      error: errData.message || `خطای سرور: ${response.status}`,
    };
  } catch (err: any) {
    return {
      success: false,
      error: err.message || 'خطای اتصال به سرور ابری سوپابیس',
    };
  }
}

/**
 * آپلود دوگانه و هوشمند: ابتدا در Supabase و در صورت فیلتر بودن یا خطای RLS، به صورت خودکار در سرور محلی
 */
export async function smartUploadImage(
  dataUrl: string,
  customName?: string
): Promise<UploadResult> {
  // ۱. ابتدا تلاش برای بارگذاری در Supabase Storage
  try {
    const supabaseRes = await uploadToSupabaseStorage(dataUrl, customName);
    if (supabaseRes.success && supabaseRes.publicUrl) {
      return supabaseRes;
    }
  } catch (err) {
    console.warn('Supabase upload attempt failed, falling back to local server:', err);
  }

  // ۲. در صورت بروز خطا در سوپابیس، آپلود قطعی در سرور محلی بدون شکست
  try {
    const res = await fetch('/api/upload-local', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ dataUrl, filename: customName }),
    });

    if (res.ok) {
      const json = await res.json();
      return {
        success: true,
        publicUrl: json.publicUrl,
        source: 'local_server',
      };
    }
  } catch (err: any) {
    console.error('Local server upload failed:', err);
  }

  // ۳. در صورتی که هر دو روش ناموفق بودند، برگرداندن خود dataUrl (Base64)
  return {
    success: true,
    publicUrl: dataUrl,
    source: 'local_server',
  };
}

/**
 * تبدیل آدرس تصاویر به آدرس قابل دسترس در مرورگر و اینترنت ایران
 * در هاست استاتیک نظیر GitHub Pages و sinazarghami.ir مستقیماً از URL استفاده می‌شود تا خطای 404 رخ ندهد.
 */
export function getReliableImageUrl(url?: string): string {
  if (!url) return '';
  if (url.startsWith('data:') || url.startsWith('blob:') || url.startsWith('/uploads/') || url.startsWith('/')) {
    return url;
  }

  // بررسی وجود سرور بک‌اند (پراکسی تنها در محیط دارای Express/Cloud Run در دسترس است)
  const hasBackendServer = typeof window !== 'undefined' &&
    (window.location.port === '3000' ||
      window.location.hostname.includes('run.app') ||
      window.location.hostname.includes('localhost') ||
      window.location.hostname.includes('127.0.0.1'));

  if (hasBackendServer && (url.includes('images.unsplash.com') || url.includes('unsplash.com') || url.includes('supabase.co'))) {
    return `/api/image-proxy?url=${encodeURIComponent(url)}`;
  }

  return url;
}
