// =====================================================================
// ابزارهای ذخیره‌سازی، فشرده‌سازی دسته‌ای، احراز هویت و همگام‌سازی ابری
// وب‌سایت رسمی سینا ضرغامی (sinazarghami.ir)
// =====================================================================

import { SiteContent } from '../types';
import { initialSiteContent } from '../data/initialData';
import { notifyPasswordChanged, sendPasswordRecoveryTelegram } from './telegram';

const STORAGE_KEY = 'sina_portfolio_site_data_v4';
const PASSCODE_KEY = 'sina_portfolio_admin_pin_v4';
const SESSION_AUTH_KEY = 'sina_admin_session_auth_v4';
const GITHUB_TOKEN_KEY = 'sina_github_token_saved';

// رمز عبور پیش‌فرض
const DEFAULT_PASSCODE = 'sina2026';

/**
 * دریافت اطلاعات سایت با اولویت ادغام هوشمند داده‌های سرور و محلی تا هیچ عکسی با رفرش پاک نشود
 */
export async function fetchRemoteSiteData(): Promise<SiteContent | null> {
  const localData = loadSiteContent();

  // ۱. تلاش برای خواندن از API سرور فعال
  try {
    const res = await fetch(`/api/site-data?t=${Date.now()}`);
    if (res.ok) {
      const remote = await res.json();
      if (remote && remote.profile) {
        // ادغام هوشمند عکس‌ها: عکس‌های محلی که شاید هنوز به سرور نرسیده‌اند حفظ شوند
        const remotePhotos: any[] = remote.photos || [];
        const localPhotos: any[] = localData.photos || [];
        const remoteIds = new Set(remotePhotos.map((p) => p.id));
        const missingLocal = localPhotos.filter((p) => !remoteIds.has(p.id));

        const merged: SiteContent = {
          ...remote,
          profile: { ...remote.profile, ...(localData.profile || {}) },
          photos: [...missingLocal, ...remotePhotos],
        };

        localStorage.setItem(STORAGE_KEY, JSON.stringify(merged));
        return merged;
      }
    }
  } catch (e) {
    // خطا در دسترسی به API سرور
  }

  // ۲. تلاش برای خواندن از فایل استاتیک site-data.json
  try {
    const res = await fetch(`/site-data.json?t=${Date.now()}`);
    if (res.ok) {
      const remote = await res.json();
      if (remote && remote.profile) {
        const remotePhotos: any[] = remote.photos || [];
        const localPhotos: any[] = localData.photos || [];
        const remoteIds = new Set(remotePhotos.map((p) => p.id));
        const missingLocal = localPhotos.filter((p) => !remoteIds.has(p.id));

        const merged: SiteContent = {
          ...remote,
          photos: [...missingLocal, ...remotePhotos],
        };

        localStorage.setItem(STORAGE_KEY, JSON.stringify(merged));
        return merged;
      }
    }
  } catch (e) {
    // ادامه با حافظه محلی
  }

  return localData;
}

/**
 * همگام‌سازی رمز عبور از سرور به منظور یکسان بودن در گوشی و لپ‌تاپ
 */
export async function syncPasscodeFromServer(): Promise<string> {
  try {
    const res = await fetch(`/api/passcode?t=${Date.now()}`);
    if (res.ok) {
      const data = await res.json();
      if (data.passcode && typeof data.passcode === 'string') {
        localStorage.setItem(PASSCODE_KEY, data.passcode);
        return data.passcode;
      }
    }
  } catch (e) {
    // استفاده از رمز موجود در لوکال
  }
  return localStorage.getItem(PASSCODE_KEY) || DEFAULT_PASSCODE;
}

/**
 * تابع بارگذاری اطلاعات سایت
 */
export function loadSiteContent(): SiteContent {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return initialSiteContent;
    const parsed = JSON.parse(raw);
    return {
      profile: { ...initialSiteContent.profile, ...(parsed.profile || {}) },
      photos: parsed.photos || initialSiteContent.photos,
      expeditions: parsed.expeditions || initialSiteContent.expeditions,
      software: parsed.software || initialSiteContent.software,
      resume: parsed.resume || initialSiteContent.resume,
      books: parsed.books || initialSiteContent.books,
      equipment: parsed.equipment || initialSiteContent.equipment,
    };
  } catch (err) {
    console.warn('خطا در خواندن اطلاعات محلی:', err);
    return initialSiteContent;
  }
}

/**
 * تابع ذخیره اطلاعات در حافظه محلی و ارسال به سرور جهت همگام‌سازی تمام دستگاه‌ها
 */
export function saveSiteContent(content: SiteContent): void {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(content));
  } catch (err) {
    console.error('خطا در ذخیره محلی:', err);
  }

  // ارسال پس‌زمینه به سرور برای اینکه گوشی و لپ‌تاپ هر دو به‌روز شوند
  try {
    fetch('/api/site-data', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(content),
    }).catch(() => {});
  } catch {
    // خطای شبکه را نادیده می‌گیریم تا کاربر متوقف نشود
  }
}

/**
 * بازنشانی اطلاعات سایت به مقادیر اولیه
 */
export function resetSiteContent(): SiteContent {
  try {
    localStorage.removeItem(STORAGE_KEY);
  } catch (err) {
    console.error(err);
  }
  return initialSiteContent;
}

/**
 * بررسی احراز هویت در سشن فعلی مرورگر
 */
export function isSessionAuthenticated(): boolean {
  return sessionStorage.getItem(SESSION_AUTH_KEY) === 'true';
}

/**
 * ثبت ورود موفق در سشن
 */
export function setSessionAuthenticated(auth: boolean): void {
  if (auth) {
    sessionStorage.setItem(SESSION_AUTH_KEY, 'true');
  } else {
    sessionStorage.removeItem(SESSION_AUTH_KEY);
  }
}

/**
 * بررسی رمز عبور ورودی
 */
export function checkAdminPasscode(pin: string): boolean {
  const stored = localStorage.getItem(PASSCODE_KEY) || DEFAULT_PASSCODE;
  return pin.trim() === stored.trim();
}

/**
 * دریافت رمز فعلی جهت ارسال به تلگرام در صورت فراموشی
 */
export function getCurrentPasscode(): string {
  return localStorage.getItem(PASSCODE_KEY) || DEFAULT_PASSCODE;
}

/**
 * تغییر رمز عبور و ذخیره همزمان در سرور، لوکال‌استوریج و ارسال به تلگرام شخصی سینا ضرغامی
 */
export async function updateAdminPasscode(newPin: string): Promise<boolean> {
  if (newPin && newPin.trim().length >= 4) {
    const cleanPin = newPin.trim();
    localStorage.setItem(PASSCODE_KEY, cleanPin);

    // ذخیره در سرور برای هماهنگی بین گوشی و لپ‌تاپ
    try {
      await fetch('/api/passcode', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ passcode: cleanPin }),
      });
    } catch (err) {
      console.warn('عدم امکان ذخیره رمز در سرور:', err);
    }

    // ارسال آنی رمز جدید به تلگرام
    await notifyPasswordChanged(cleanPin);
    return true;
  }
  return false;
}

/**
 * درخواست بازیابی و ارسال رمز به تلگرام در صورت فراموشی
 */
export async function requestPasswordRecoveryToTelegram(): Promise<boolean> {
  const currentPin = getCurrentPasscode();
  return sendPasswordRecoveryTelegram(currentPin);
}

/**
 * دریافت توکن ذخیره‌شده گیت‌هاب جهت انتشار خودکار
 */
export function getSavedGitHubToken(): string {
  return localStorage.getItem(GITHUB_TOKEN_KEY) || '';
}

export function saveGitHubToken(token: string): void {
  localStorage.setItem(GITHUB_TOKEN_KEY, token.trim());
}

/**
 * خروجی گرفتن از تمام اطلاعات سایت در قالب فایل JSON
 */
export function exportSiteContentToJson(content: SiteContent): void {
  const dataStr = 'data:text/json;charset=utf-8,' + encodeURIComponent(JSON.stringify(content, null, 2));
  const downloadAnchor = document.createElement('a');
  downloadAnchor.setAttribute('href', dataStr);
  downloadAnchor.setAttribute('download', `sinazarghami_backup_${new Date().toISOString().slice(0, 10)}.json`);
  document.body.appendChild(downloadAnchor);
  downloadAnchor.click();
  downloadAnchor.remove();
}

/**
 * تبدیل هوشمند لینک‌های گوگل درایو به پیش‌نمایش پرسرعت
 */
export function parseGoogleDriveLink(rawUrl: string): { isDrive: boolean; embedUrl: string; fileId?: string } {
  if (!rawUrl) return { isDrive: false, embedUrl: rawUrl };
  const trimmed = rawUrl.trim();

  const fileDMatch = trimmed.match(/drive\.google\.com\/file\/d\/([a-zA-Z0-9_-]+)/);
  if (fileDMatch && fileDMatch[1]) {
    const fileId = fileDMatch[1];
    return {
      isDrive: true,
      fileId,
      embedUrl: `https://drive.google.com/thumbnail?id=${fileId}&sz=w1600`,
    };
  }

  const idMatch = trimmed.match(/drive\.google\.com\/(?:open|uc)\?id=([a-zA-Z0-9_-]+)/);
  if (idMatch && idMatch[1]) {
    const fileId = idMatch[1];
    return {
      isDrive: true,
      fileId,
      embedUrl: `https://drive.google.com/thumbnail?id=${fileId}&sz=w1600`,
    };
  }

  return { isDrive: false, embedUrl: trimmed };
}

const WATERMARK_IMAGE_KEY = 'sina_watermark_image';
const WATERMARK_OPACITY_KEY = 'sina_watermark_opacity';
const WATERMARK_POSITION_KEY = 'sina_watermark_position';

export const DEFAULT_WATERMARK_SVG = `data:image/svg+xml;utf8,<svg xmlns="http://www.w3.org/2000/svg" width="320" height="90" viewBox="0 0 320 90"><filter id="glow" x="-20%" y="-20%" width="140%" height="140%"><feDropShadow dx="1" dy="1.5" stdDeviation="2.5" flood-color="%23000000" flood-opacity="0.85"/></filter><g filter="url(%23glow)"><path d="M 20 65 Q 40 10, 60 45 T 100 35 T 135 55" fill="none" stroke="%23FFFFFF" stroke-width="2.5" stroke-linecap="round"/><text x="25" y="76" font-family="'Cinzel', 'Playfair Display', Georgia, serif" font-size="14" font-weight="bold" fill="%23FFFFFF" letter-spacing="2">SINA ZARGHAMI</text><text x="180" y="76" font-family="sans-serif" font-size="9" font-weight="600" fill="%23F3F4F6" letter-spacing="1.5">STUDIO</text></g></svg>`;

export interface WatermarkConfig {
  imageDataUrl?: string;
  opacity?: number; // 0 to 1
  position?: 'bottom-right' | 'bottom-left' | 'top-right' | 'top-left' | 'center';
}

export function getSavedWatermarkImage(): string {
  if (typeof window === 'undefined') return DEFAULT_WATERMARK_SVG;
  return localStorage.getItem(WATERMARK_IMAGE_KEY) || DEFAULT_WATERMARK_SVG;
}

export function saveWatermarkImage(img: string): void {
  if (typeof window === 'undefined') return;
  localStorage.setItem(WATERMARK_IMAGE_KEY, img);
}

export function getSavedWatermarkOpacity(): number {
  if (typeof window === 'undefined') return 0.15;
  const val = parseFloat(localStorage.getItem(WATERMARK_OPACITY_KEY) || '');
  return isNaN(val) ? 0.15 : val;
}

export function saveWatermarkOpacity(opacity: number): void {
  if (typeof window === 'undefined') return;
  localStorage.setItem(WATERMARK_OPACITY_KEY, String(opacity));
}

export function getSavedWatermarkPosition(): 'bottom-right' | 'bottom-left' | 'top-right' | 'top-left' | 'center' {
  if (typeof window === 'undefined') return 'bottom-right';
  const pos = localStorage.getItem(WATERMARK_POSITION_KEY) as any;
  return pos || 'bottom-right';
}

export function saveWatermarkPosition(position: string): void {
  if (typeof window === 'undefined') return;
  localStorage.setItem(WATERMARK_POSITION_KEY, position);
}

const SETTINGS_API_URL = '/api/studio-settings';
const STORAGE_KEY_MAIN_REPO = 'sina_github_main_repo';
const STORAGE_KEY_VIDEO_REPO = 'sina_github_video_repo';
const STORAGE_KEY_VIDEO_BASE_URL = 'sina_github_video_base_url';
const STORAGE_KEY_FORCE_ALL_VIDEOS = 'sina_github_force_all_videos_to_video_repo';
const DEFAULT_MAIN_REPO = 'szarghami/sinazarghami-aistudio-site';
const DEFAULT_VIDEO_REPO = 'szarghami/video-portfolio';
const DEFAULT_VIDEO_BASE_URL = 'https://szarghami.github.io/video-portfolio/';

export interface StudioSettings {
  githubToken?: string;
  mainRepo?: string;
  videoRepo?: string;
  videoBaseUrl?: string;
  forceAllVideos?: boolean;
  youtubeApiKey?: string;
  aparatApiKey?: string;
  watermarkImg?: string;
  watermarkOpacity?: number;
  watermarkPosition?: 'bottom-right' | 'bottom-left' | 'top-right' | 'top-left' | 'center';
}

/**
 * همگام‌سازی و خواندن تنظیمات استودیو از سرور جهت ماندگاری دائمی حتی پس از رفرش یا تعویض مرورگر
 */
export async function syncStudioSettingsFromServer(): Promise<StudioSettings> {
  try {
    const res = await fetch(`${SETTINGS_API_URL}?t=${Date.now()}`);
    if (res.ok) {
      const data = await res.json();
      if (data && typeof data === 'object') {
        if (data.githubToken) saveGitHubToken(data.githubToken);
        if (data.mainRepo && typeof window !== 'undefined') localStorage.setItem(STORAGE_KEY_MAIN_REPO, data.mainRepo);
        if (data.videoRepo && typeof window !== 'undefined') localStorage.setItem(STORAGE_KEY_VIDEO_REPO, data.videoRepo);
        if (data.videoBaseUrl && typeof window !== 'undefined') localStorage.setItem(STORAGE_KEY_VIDEO_BASE_URL, data.videoBaseUrl);
        if (data.youtubeApiKey && typeof window !== 'undefined') {
          localStorage.setItem('sina_youtube_api_key', data.youtubeApiKey);
        }
        if (data.aparatApiKey && typeof window !== 'undefined') {
          localStorage.setItem('sina_aparat_api_key', data.aparatApiKey);
        }
        if (data.watermarkImg) saveWatermarkImage(data.watermarkImg);
        if (data.watermarkOpacity !== undefined) saveWatermarkOpacity(data.watermarkOpacity);
        if (data.watermarkPosition) saveWatermarkPosition(data.watermarkPosition);
        return data;
      }
    }
  } catch (err) {
    console.warn('عدم امکان خواندن تنظیمات از سرور:', err);
  }
  return {
    githubToken: getSavedGitHubToken(),
    mainRepo: typeof window !== 'undefined' ? localStorage.getItem(STORAGE_KEY_MAIN_REPO) || DEFAULT_MAIN_REPO : DEFAULT_MAIN_REPO,
    videoRepo: typeof window !== 'undefined' ? localStorage.getItem(STORAGE_KEY_VIDEO_REPO) || DEFAULT_VIDEO_REPO : DEFAULT_VIDEO_REPO,
    videoBaseUrl: typeof window !== 'undefined' ? localStorage.getItem(STORAGE_KEY_VIDEO_BASE_URL) || DEFAULT_VIDEO_BASE_URL : DEFAULT_VIDEO_BASE_URL,
    forceAllVideos: typeof window !== 'undefined' ? localStorage.getItem(STORAGE_KEY_FORCE_ALL_VIDEOS) === 'true' : true,
    youtubeApiKey: typeof window !== 'undefined' ? localStorage.getItem('sina_youtube_api_key') || '' : '',
    aparatApiKey: typeof window !== 'undefined' ? localStorage.getItem('sina_aparat_api_key') || '' : '',
    watermarkImg: getSavedWatermarkImage(),
    watermarkOpacity: getSavedWatermarkOpacity(),
    watermarkPosition: getSavedWatermarkPosition(),
  };
}

/**
 * ذخیره تنظیمات استودیو هم در لوکال‌استوریج و هم در سرور ابری جهت حفظ همیشگی
 */
export async function saveStudioSettingsToServer(settings: Partial<StudioSettings>): Promise<void> {
  if (settings.githubToken !== undefined) saveGitHubToken(settings.githubToken);
  if (settings.mainRepo !== undefined && typeof window !== 'undefined') {
    localStorage.setItem(STORAGE_KEY_MAIN_REPO, settings.mainRepo);
  }
  if (settings.videoRepo !== undefined && typeof window !== 'undefined') {
    localStorage.setItem(STORAGE_KEY_VIDEO_REPO, settings.videoRepo);
  }
  if (settings.videoBaseUrl !== undefined && typeof window !== 'undefined') {
    localStorage.setItem(STORAGE_KEY_VIDEO_BASE_URL, settings.videoBaseUrl);
  }
  if (settings.youtubeApiKey !== undefined && typeof window !== 'undefined') {
    localStorage.setItem('sina_youtube_api_key', settings.youtubeApiKey);
  }
  if (settings.aparatApiKey !== undefined && typeof window !== 'undefined') {
    localStorage.setItem('sina_aparat_api_key', settings.aparatApiKey);
  }
  if (settings.watermarkImg !== undefined) saveWatermarkImage(settings.watermarkImg);
  if (settings.watermarkOpacity !== undefined) saveWatermarkOpacity(settings.watermarkOpacity);
  if (settings.watermarkPosition !== undefined) saveWatermarkPosition(settings.watermarkPosition);

  try {
    await fetch(SETTINGS_API_URL, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(settings),
    });
  } catch (err) {
    console.warn('عدم امکان ذخیره تنظیمات استودیو در سرور:', err);
  }
}

/**
 * ترسیم امضای کاری روی Canvas بدون هیچ‌گونه سایه مشکی یا ضخیم‌شدن ناخواسته
 */
export function drawWatermarkOnCanvas(
  ctx: CanvasRenderingContext2D,
  canvasWidth: number,
  canvasHeight: number,
  wmImg: HTMLImageElement,
  opacity: number = 0.15,
  position: 'bottom-right' | 'bottom-left' | 'top-right' | 'top-left' | 'center' = 'bottom-right'
): void {
  if (opacity <= 0) return;
  ctx.save();
  ctx.globalAlpha = Math.min(1, Math.max(0, opacity));

  const targetWidth = Math.max(100, Math.round(canvasWidth * 0.18));
  const targetHeight = wmImg.width > 0 ? Math.round((wmImg.height / wmImg.width) * targetWidth) : Math.round(targetWidth * 0.3);
  const margin = Math.round(Math.min(canvasWidth, canvasHeight) * 0.035);

  let x = canvasWidth - targetWidth - margin;
  let y = canvasHeight - targetHeight - margin;

  if (position === 'bottom-left') {
    x = margin;
    y = canvasHeight - targetHeight - margin;
  } else if (position === 'top-right') {
    x = canvasWidth - targetWidth - margin;
    y = margin;
  } else if (position === 'top-left') {
    x = margin;
    y = margin;
  } else if (position === 'center') {
    x = Math.round((canvasWidth - targetWidth) / 2);
    y = Math.round((canvasHeight - targetHeight) / 2);
  }

  // حذف سایه تیره که باعث ایجاد هاله دوتایی و حالت بولد ناخواسته می‌شد
  ctx.shadowColor = 'transparent';
  ctx.shadowBlur = 0;
  ctx.shadowOffsetX = 0;
  ctx.shadowOffsetY = 0;

  ctx.drawImage(wmImg, x, y, targetWidth, targetHeight);
  ctx.restore();
}

export interface CompressedImageResult {
  name: string;
  dataUrl: string;
  originalSize: number;
  compressedSize: number;
  reductionPercent: number;
}

/**
 * فشرده‌سازی یک عکس منفرد با فرمت WebP و اعمال اختیاری امضای کاری
 */
export function compressImageToWebP(
  file: File,
  maxDimension = 1400,
  quality = 0.70,
  watermark?: WatermarkConfig
): Promise<CompressedImageResult> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = (e) => {
      const img = new Image();
      img.onload = () => {
        let width = img.width;
        let height = img.height;

        if (width > maxDimension || height > maxDimension) {
          if (width > height) {
            height = Math.round((height * maxDimension) / width);
            width = maxDimension;
          } else {
            width = Math.round((width * maxDimension) / height);
            height = maxDimension;
          }
        }

        const canvas = document.createElement('canvas');
        canvas.width = width;
        canvas.height = height;
        const ctx = canvas.getContext('2d');
        if (!ctx) {
          reject(new Error('محیط Canvas در دسترس نیست'));
          return;
        }

        ctx.imageSmoothingEnabled = true;
        ctx.imageSmoothingQuality = 'high';
        ctx.drawImage(img, 0, 0, width, height);

        const finishExport = () => {
          const dataUrl = canvas.toDataURL('image/webp', quality);
          const compressedSize = Math.round((dataUrl.length * 3) / 4);
          const originalSize = file.size;
          const reductionPercent = Math.max(0, Math.round(((originalSize - compressedSize) / originalSize) * 100));

          resolve({
            name: file.name,
            dataUrl,
            originalSize,
            compressedSize,
            reductionPercent,
          });
        };

        // اعمال امضای کاری در صورت فعال بودن
        const wmOpacity = watermark?.opacity !== undefined ? watermark.opacity : getSavedWatermarkOpacity();
        const wmImgSrc = watermark?.imageDataUrl || getSavedWatermarkImage();

        if (wmOpacity > 0 && wmImgSrc) {
          const wm = new Image();
          wm.crossOrigin = 'anonymous';
          wm.onload = () => {
            drawWatermarkOnCanvas(
              ctx,
              width,
              height,
              wm,
              wmOpacity,
              watermark?.position || getSavedWatermarkPosition()
            );
            finishExport();
          };
          wm.onerror = () => {
            // در صورت خطا در لود امضا، تصویر اصلی ذخیره می‌شود
            finishExport();
          };
          wm.src = wmImgSrc;
        } else {
          finishExport();
        }
      };
      img.onerror = (err) => reject(err);
      img.src = e.target?.result as string;
    };
    reader.onerror = (err) => reject(err);
    reader.readAsDataURL(file);
  });
}

/**
 * فشرده‌سازی همزمان گروهی از عکس‌ها (Batch Multi-Image Compression)
 */
export async function compressMultipleImagesToWebP(
  files: File[],
  maxDimension = 1400,
  quality = 0.70,
  watermark?: WatermarkConfig
): Promise<{
  results: CompressedImageResult[];
  totalOriginalKB: number;
  totalCompressedKB: number;
  overallReductionPercent: number;
}> {
  const promises = files.map((f) => compressImageToWebP(f, maxDimension, quality, watermark));
  const results = await Promise.all(promises);

  const totalOrigBytes = results.reduce((sum, r) => sum + r.originalSize, 0);
  const totalCompBytes = results.reduce((sum, r) => sum + r.compressedSize, 0);

  const totalOriginalKB = Math.round(totalOrigBytes / 1024);
  const totalCompressedKB = Math.round(totalCompBytes / 1024);
  const overallReductionPercent = Math.max(0, Math.round(((totalOrigBytes - totalCompBytes) / totalOrigBytes) * 100));

  return {
    results,
    totalOriginalKB,
    totalCompressedKB,
    overallReductionPercent,
  };
}
