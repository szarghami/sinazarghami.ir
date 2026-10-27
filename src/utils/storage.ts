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
const DEFAULT_PASSCODE = ((import.meta as any).env || {}).DEFAULT_PASSCODE || 'sina2026';

/**
 * دریافت اطلاعات سایت با اولویت سرور اختصاصی جهت هماهنگی کامل بین لپ‌تاپ و گوشی
 */
export async function fetchRemoteSiteData(): Promise<SiteContent | null> {
  // ۱. تلاش برای خواندن از API سرور فعال
  try {
    const res = await fetch(`/api/site-data?t=${Date.now()}`);
    if (res.ok) {
      const data = await res.json();
      if (data && data.profile) {
        localStorage.setItem(STORAGE_KEY, JSON.stringify(data));
        return data;
      }
    }
  } catch (e) {
    // خطا در دسترسی به API سرور
  }

  // ۲. تلاش برای خواندن از فایل استاتیک site-data.json
  try {
    const res = await fetch(`/site-data.json?t=${Date.now()}`);
    if (res.ok) {
      const data = await res.json();
      if (data && data.profile) {
        localStorage.setItem(STORAGE_KEY, JSON.stringify(data));
        return data;
      }
    }
  } catch (e) {
    // ادامه با حافظه محلی
  }

  return null;
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
      commercialCategories: parsed.commercialCategories || initialSiteContent.commercialCategories,
      travelCategories: parsed.travelCategories || initialSiteContent.travelCategories,
      tripCategories: parsed.tripCategories || initialSiteContent.tripCategories,
      gearCategories: parsed.gearCategories || initialSiteContent.gearCategories,
      definedTechniques: parsed.definedTechniques || initialSiteContent.definedTechniques,
      homeCategoryCards: parsed.homeCategoryCards || initialSiteContent.homeCategoryCards,
      articles: parsed.articles || initialSiteContent.articles,
      navLabels: parsed.navLabels || initialSiteContent.navLabels,
      aboutBio: parsed.aboutBio || initialSiteContent.aboutBio,
      aboutPage: parsed.aboutPage || initialSiteContent.aboutPage,
      homeShowcaseConfig: parsed.homeShowcaseConfig || initialSiteContent.homeShowcaseConfig,
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
  if (!pin || pin.trim().length < 4) {
    return false;
  }
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

export interface CompressedImageResult {
  name: string;
  dataUrl: string;
  originalSize: number;
  compressedSize: number;
  reductionPercent: number;
}

/**
 * فشرده‌سازی یک عکس منفرد با فرمت WebP
 */
export function compressImageToWebP(
  file: File,
  maxDimension = 1400,
  quality = 0.70
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
  quality = 0.70
): Promise<{
  results: CompressedImageResult[];
  totalOriginalKB: number;
  totalCompressedKB: number;
  overallReductionPercent: number;
}> {
  const promises = files.map((f) => compressImageToWebP(f, maxDimension, quality));
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
