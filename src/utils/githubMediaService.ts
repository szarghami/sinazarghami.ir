// =====================================================================
// سرویس اختصاصی یکپارچه‌سازی و همگام‌سازی رسانه‌ها با گیت‌هاب (GitHub Media Architecture)
// وب‌سایت سینا ضرغامی (sinazarghami.ir)
// =====================================================================

import { SiteContent, PhotoItem, PhotoCategory, SpecificPhotoCategory, SyncedComment } from '../types';
import { compressImageToWebP, WatermarkConfig } from './storage';

export const DEFAULT_MAIN_REPO = 'szarghami/sinazarghami-aistudio-site';
export const DEFAULT_VIDEO_REPO = 'szarghami/video-portfolio';
export const DEFAULT_VIDEO_BASE_URL = 'https://szarghami.github.io/video-portfolio/';
export const DEFAULT_VIDEO_THRESHOLD_MB = 25;

const STORAGE_KEY_GITHUB_TOKEN = 'sina_github_token_saved';
const STORAGE_KEY_MAIN_REPO = 'sina_github_main_repo';
const STORAGE_KEY_VIDEO_REPO = 'sina_github_video_repo';
const STORAGE_KEY_VIDEO_BASE_URL = 'sina_github_video_base_url';
const STORAGE_KEY_VIDEO_THRESHOLD = 'sina_github_video_threshold_mb';
const STORAGE_KEY_FORCE_ALL_VIDEOS = 'sina_github_force_all_videos_to_video_repo';

/**
 * مدیریت توکن گیت‌هاب در LocalStorage
 */
export function getSavedGitHubToken(): string {
  if (typeof window === 'undefined') return '';
  const encryptedToken = localStorage.getItem(STORAGE_KEY_GITHUB_TOKEN);
  if (!encryptedToken) return '';
  try {
    return CryptoJS.AES.decrypt(encryptedToken, ((import.meta as any).env || {}).ENCRYPTION_KEY!).toString(CryptoJS.enc.Utf8);
  } catch {
    return '';
  }
}

export function saveGitHubToken(token: string): void {
  if (typeof window === 'undefined') return;
  if (!token || !token.trim()) {
    throw new Error('GitHub token cannot be empty');
  }
  if (!((import.meta as any).env || {}).ENCRYPTION_KEY) {
    throw new Error('Encryption key not configured');
  }
  const encryptedToken = CryptoJS.AES.encrypt(token.trim(), ((import.meta as any).env || {}).ENCRYPTION_KEY).toString();
  localStorage.setItem(STORAGE_KEY_GITHUB_TOKEN, encryptedToken);
}

/**
 * دریافت و ذخیره تنظیمات ریپازیتوری‌ها
 */
export function getMainRepo(): string {
  if (typeof window === 'undefined') return DEFAULT_MAIN_REPO;
  return localStorage.getItem(STORAGE_KEY_MAIN_REPO) || DEFAULT_MAIN_REPO;
}

export function saveMainRepo(repo: string): void {
  if (typeof window === 'undefined') return;
  localStorage.setItem(STORAGE_KEY_MAIN_REPO, repo.trim() || DEFAULT_MAIN_REPO);
}

export function getVideoRepo(): string {
  if (typeof window === 'undefined') return DEFAULT_VIDEO_REPO;
  return localStorage.getItem(STORAGE_KEY_VIDEO_REPO) || DEFAULT_VIDEO_REPO;
}

export function saveVideoRepo(repo: string): void {
  if (typeof window === 'undefined') return;
  localStorage.setItem(STORAGE_KEY_VIDEO_REPO, repo.trim() || DEFAULT_VIDEO_REPO);
}

export function getVideoBaseUrl(): string {
  if (typeof window === 'undefined') return DEFAULT_VIDEO_BASE_URL;
  let url = localStorage.getItem(STORAGE_KEY_VIDEO_BASE_URL) || DEFAULT_VIDEO_BASE_URL;
  if (!url.endsWith('/')) url += '/';
  return url;
}

export function saveVideoBaseUrl(url: string): void {
  if (typeof window === 'undefined') return;
  let clean = url.trim() || DEFAULT_VIDEO_BASE_URL;
  if (!clean.endsWith('/')) clean += '/';
  localStorage.setItem(STORAGE_KEY_VIDEO_BASE_URL, clean);
}

export function getVideoThresholdMB(): number {
  if (typeof window === 'undefined') return DEFAULT_VIDEO_THRESHOLD_MB;
  const val = parseInt(localStorage.getItem(STORAGE_KEY_VIDEO_THRESHOLD) || '');
  return isNaN(val) ? DEFAULT_VIDEO_THRESHOLD_MB : val;
}

export function saveVideoThresholdMB(mb: number): void {
  if (typeof window === 'undefined') return;
  localStorage.setItem(STORAGE_KEY_VIDEO_THRESHOLD, String(mb));
}

export function getForceAllVideosToVideoRepo(): boolean {
  if (typeof window === 'undefined') return true;
  const val = localStorage.getItem(STORAGE_KEY_FORCE_ALL_VIDEOS);
  return val === null ? true : val === 'true'; // پیش‌فرض: تمام ویدیوها به ریپازیتوری ویدیو بروند
}

export function saveForceAllVideosToVideoRepo(val: boolean): void {
  if (typeof window === 'undefined') return;
  localStorage.setItem(STORAGE_KEY_FORCE_ALL_VIDEOS, String(val));
}

/**
 * پاکسازی نام فایل برای استانداردسازی مسیر در گیت‌هاب
 */
export function sanitizeFilename(filename: string): string {
  const parts = filename.split('.');
  const ext = parts.length > 1 ? parts.pop()?.toLowerCase() : '';
  const base = parts.join('.');
  
  // تبدیل کاراکترهای خاص و فاصله‌ها به خط تیره
  const sanitized = base
    .replace(/[^\w\d\u0600-\u06FF-]/gi, '-')
    .replace(/-+/g, '-')
    .replace(/^-|-$/g, '')
    .toLowerCase();

  return ext ? `${sanitized || 'media'}.${ext}` : (sanitized || 'media');
}

/**
 * تبدیل خودکار نام فایل به عنوان زیبا و تمیز فارسی و انگلیسی
 */
export function inferTitlesFromFilename(filename: string): { titleFa: string; titleEn: string; category: SpecificPhotoCategory } {
  const clean = filename
    .replace(/\.[^/.]+$/, '') // حذف پسوند
    .replace(/[-_]+/g, ' ')
    .trim();

  // تبدیل به Title Case برای انگلیسی
  const titleEn = clean
    .split(' ')
    .map((w) => w.charAt(0).toUpperCase() + w.slice(1))
    .join(' ') || 'Editorial Work';

  // نگاشت کلمات کلیدی به فارسی و دسته‌بندی‌های صنعتی
  const lower = clean.toLowerCase();
  let titleFa = clean;
  let category: SpecificPhotoCategory = 'landscape';

  if (lower.includes('shoe') || lower.includes('shoes') || lower.includes('کفش') || lower.includes('کتونی') || lower.includes('footwear') || lower.includes('leather')) {
    titleFa = `عکاسی صنعتی کفش - ${clean}`;
    category = 'commercial-shoes';
  } else if (lower.includes('jewel') || lower.includes('jewelry') || lower.includes('gold') || lower.includes('جواهر') || lower.includes('طلا') || lower.includes('انگشتر') || lower.includes('ring')) {
    titleFa = `عکاسی صنعتی جواهرات - ${clean}`;
    category = 'commercial-jewelry';
  } else if (lower.includes('industrial') || lower.includes('factory') || lower.includes('صنعتی') || (lower.includes('تیزر') && lower.includes('صنعت'))) {
    titleFa = `تیزر و ویدیوی صنعتی - ${clean}`;
    category = 'commercial-video';
  } else if (lower.includes('lut') || lower.includes('desert') || lower.includes('kalut') || lower.includes('kavir')) {
    titleFa = `کویر لوت - ${clean}`;
    category = 'landscape';
  } else if (lower.includes('damavand') || lower.includes('mountain') || lower.includes('alborz')) {
    titleFa = `قله دماوند و البرز - ${clean}`;
    category = 'landscape';
  } else if (lower.includes('star') || lower.includes('astro') || lower.includes('night') || lower.includes('milky')) {
    titleFa = `آسمان شب و عکاسی نجومی - ${clean}`;
    category = 'landscape';
  } else if (lower.includes('drone') || lower.includes('aerial') || lower.includes('mavic')) {
    titleFa = `تصویربرداری هوایی - ${clean}`;
    category = 'aerial';
  } else if (lower.includes('teaser') || lower.includes('video') || lower.includes('film') || lower.includes('cinema')) {
    titleFa = `تیزر سینمایی - ${clean}`;
    category = 'video';
  } else if (lower.includes('arch') || lower.includes('mosque') || lower.includes('palace')) {
    titleFa = `معماری و بناهای تاریخی - ${clean}`;
    category = 'architecture';
  } else if (lower.includes('portrait') || lower.includes('people') || lower.includes('face')) {
    titleFa = `پرتره و چهره - ${clean}`;
    category = 'portrait';
  } else if (lower.includes('doc') || lower.includes('street') || lower.includes('life')) {
    titleFa = `مستند اجتماعی - ${clean}`;
    category = 'documentary';
  }

  return { titleFa, titleEn, category };
}

/**
 * استخراج شناسه ویدیو و ساخت آدرس Embed استاندارد آپارات
 */
export function parseAparatUrl(rawUrl: string): { embedUrl: string; hash?: string; isAparat: boolean } {
  if (!rawUrl) return { embedUrl: '', isAparat: false };
  const trimmed = rawUrl.trim();

  // استخراج از فرمت‌های مختلف آدرس یا کدهای امبد
  const embedMatch = trimmed.match(/videohash\/([a-zA-Z0-9]+)/i);
  if (embedMatch && embedMatch[1]) {
    return {
      embedUrl: `https://www.aparat.com/video/video/embed/videohash/${embedMatch[1]}/vt/frame`,
      hash: embedMatch[1],
      isAparat: true,
    };
  }

  const vMatch = trimmed.match(/aparat\.com\/v\/([a-zA-Z0-9]+)/i);
  if (vMatch && vMatch[1]) {
    return {
      embedUrl: `https://www.aparat.com/video/video/embed/videohash/${vMatch[1]}/vt/frame`,
      hash: vMatch[1],
      isAparat: true,
    };
  }

  // اگر کاربر مستقیماً شناسه (uid) ویدیو را وارد کرده باشد
  if (/^[a-zA-Z0-9]{4,16}$/.test(trimmed)) {
    return {
      embedUrl: `https://www.aparat.com/video/video/embed/videohash/${trimmed}/vt/frame`,
      hash: trimmed,
      isAparat: true,
    };
  }

  return { embedUrl: trimmed, isAparat: trimmed.includes('aparat.com') };
}

/**
 * دریافت خودکار کامنت‌های آپارات (بدون نیاز به API Key)
 * آدرس رسمی: https://www.aparat.com/api/fa/v1/video/comment/list/videohash/[uid]
 * فراخوانی از طریق پروکسی CORS جهت دور زدن محدودیت‌های مرورگر و کلودفلر
 */
export async function fetchAparatComments(uid: string): Promise<SyncedComment[]> {
  if (!uid || !uid.trim()) return [];
  const cleanUid = uid.trim().replace(/^.*\/videohash\//, '').replace(/^.*\/v\//, '').split('?')[0].replace(/\/.*$/, '');
  const targetAparatUrl = `https://www.aparat.com/api/fa/v1/video/comment/list/videohash/${cleanUid}`;

  try {
    // ۱. ابتدا تلاش از طریق پروکسی سرور اپلت
    let response: Response | null = await fetch(`/api/aparat-comments/${encodeURIComponent(cleanUid)}`).catch(() => null);

    // ۲. در صورت نیاز، فراخوانی از طریق پروکسی CORS عمومی
    if (!response || !response.ok) {
      response = await fetch(`/api/cors-proxy?url=${encodeURIComponent(targetAparatUrl)}`).catch(() => null);
    }

    // ۳. تلاش نهایی مستقیم با مرورگر
    if (!response || !response.ok) {
      response = await fetch(targetAparatUrl, {
        headers: { Accept: 'application/json' },
      }).catch(() => null);
    }

    if (!response || !response.ok) {
      console.warn(`[Aparat Comments] Status ${response?.status} for uid ${cleanUid}`);
      return [];
    }

    const json = await response.json().catch(() => null);
    if (!json) return [];

    let rawList: any[] = [];
    if (Array.isArray(json)) {
      rawList = json;
    } else if (Array.isArray(json.data)) {
      rawList = json.data;
    } else if (Array.isArray(json.included)) {
      rawList = json.included.filter((item: any) => item.type === 'comment' || item.attributes?.body);
    } else if (Array.isArray(json.data?.comments)) {
      rawList = json.data.comments;
    } else if (Array.isArray(json.comments)) {
      rawList = json.comments;
    }

    const comments: SyncedComment[] = [];

    for (let i = 0; i < rawList.length; i++) {
      const item = rawList[i];
      const attrs = item.attributes || {};

      const authorName =
        attrs.name ||
        attrs.sender_name ||
        attrs.username ||
        item.sender_name ||
        item.name ||
        item.username ||
        'کاربر آپارات';

      const text =
        attrs.body ||
        attrs.comment_text ||
        attrs.text ||
        item.comment_text ||
        item.body ||
        item.text ||
        item.content ||
        '';

      const date =
        attrs.sdate ||
        attrs.date ||
        attrs.inserted_at ||
        item.sdate ||
        item.date ||
        'همگام‌سازی‌شده از آپارات';

      const likesCount = Number(
        attrs.like_cnt ?? attrs.likes ?? item.like_cnt ?? item.like ?? item.likes ?? 0
      );

      const authorAvatar = attrs.avatar || attrs.pic || item.avatar || item.pic || undefined;

      if (text && text.trim()) {
        comments.push({
          id: `aparat-${item.id || attrs.id || `${cleanUid}-${i}`}`,
          authorName: authorName.trim(),
          authorAvatar,
          text: text.trim(),
          platform: 'aparat',
          date: String(date),
          likesCount: isNaN(likesCount) ? 0 : likesCount,
        });
      }
    }

    return comments;
  } catch (err) {
    console.warn(`[Aparat Comments] Error fetching for uid ${cleanUid}:`, err);
    return [];
  }
}

/**
 * دریافت خودکار کامنت‌های یوتیوب در صورت وجود API Key
 */
export async function fetchYouTubeComments(videoId: string, apiKey: string): Promise<SyncedComment[]> {
  if (!videoId || !apiKey) return [];
  const cleanId = videoId.trim();
  const url = `https://www.googleapis.com/youtube/v3/commentThreads?part=snippet&videoId=${encodeURIComponent(cleanId)}&key=${encodeURIComponent(apiKey.trim())}&maxResults=20`;

  try {
    const res = (await fetch(`/api/cors-proxy?url=${encodeURIComponent(url)}`).catch(() => null)) ||
      (await fetch(url).catch(() => null));

    if (!res || !res.ok) return [];
    const data = await res.json().catch(() => null);
    if (!data || !Array.isArray(data.items)) return [];

    const comments: SyncedComment[] = [];
    for (const item of data.items) {
      const snippet = item.snippet?.topLevelComment?.snippet;
      if (!snippet) continue;

      const authorName = snippet.authorDisplayName || 'YouTube Viewer';
      const authorAvatar = snippet.authorProfileImageUrl;
      const text = snippet.textDisplay || snippet.textOriginal || '';
      const publishedAt = snippet.publishedAt ? new Date(snippet.publishedAt).toLocaleDateString('fa-IR') : 'YouTube';
      const likesCount = Number(snippet.likeCount || 0);

      if (text.trim()) {
        comments.push({
          id: `yt-${item.id || item.snippet?.topLevelComment?.id || Math.random().toString(36).slice(2, 8)}`,
          authorName,
          authorAvatar,
          text: text.trim(),
          platform: 'youtube',
          date: publishedAt,
          likesCount,
        });
      }
    }
    return comments;
  } catch (err) {
    console.warn('[YouTube Comments] Error fetching:', err);
    return [];
  }
}

/**
 * استخراج شناسه ویدیو و ساخت آدرس Embed استاندارد یوتیوب
 */
export function parseYoutubeUrl(rawUrl: string): { embedUrl: string; videoId?: string; isYoutube: boolean } {
  if (!rawUrl) return { embedUrl: '', isYoutube: false };
  const trimmed = rawUrl.trim();

  const shortMatch = trimmed.match(/youtu\.be\/([a-zA-Z0-9_-]+)/);
  if (shortMatch && shortMatch[1]) {
    return {
      embedUrl: `https://www.youtube-nocookie.com/embed/${shortMatch[1]}?autoplay=1&rel=0`,
      videoId: shortMatch[1],
      isYoutube: true,
    };
  }

  const watchMatch = trimmed.match(/[?&]v=([a-zA-Z0-9_-]+)/);
  if (watchMatch && watchMatch[1]) {
    return {
      embedUrl: `https://www.youtube-nocookie.com/embed/${watchMatch[1]}?autoplay=1&rel=0`,
      videoId: watchMatch[1],
      isYoutube: true,
    };
  }

  const embedMatch = trimmed.match(/youtube\.com\/embed\/([a-zA-Z0-9_-]+)/);
  if (embedMatch && embedMatch[1]) {
    return {
      embedUrl: `https://www.youtube-nocookie.com/embed/${embedMatch[1]}?autoplay=1&rel=0`,
      videoId: embedMatch[1],
      isYoutube: true,
    };
  }

  return { embedUrl: trimmed, isYoutube: trimmed.includes('youtube.com') || trimmed.includes('youtu.be') };
}

/**
 * خواندن فایل به صورت Base64 خالص
 */
export function fileToBase64(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => {
      const result = reader.result as string;
      const commaIdx = result.indexOf(',');
      const base64 = commaIdx >= 0 ? result.slice(commaIdx + 1) : result;
      resolve(base64);
    };
    reader.onerror = (err) => reject(err);
    reader.readAsDataURL(file);
  });
}

/**
 * پارامترهای آپلود مدیا
 */
export interface UploadMediaOptions {
  file: File;
  token?: string;
  mainRepo?: string;
  videoRepo?: string;
  videoBaseUrl?: string;
  maxDimension?: number;
  quality?: number;
  watermark?: WatermarkConfig;
  forceVideoRepo?: boolean;
  onProgress?: (statusText: string, progress?: number) => void;
}

export interface UploadMediaResult {
  success: boolean;
  url: string;
  rawUrl?: string;
  type: 'image' | 'video';
  targetRepo: string;
  targetPath: string;
  fileSize: number;
  error?: string;
}

/**
 * ۱. آپلود هوشمند بر اساس نوع و حجم فایل به ریپازیتوری متناظر در گیت‌هاب
 */
export async function uploadMediaToGitHub(options: UploadMediaOptions): Promise<UploadMediaResult> {
  const {
    file,
    token = getSavedGitHubToken(),
    mainRepo = getMainRepo(),
    videoRepo = getVideoRepo(),
    videoBaseUrl = getVideoBaseUrl(),
    maxDimension = 1800,
    quality = 0.85,
    watermark,
    forceVideoRepo = getForceAllVideosToVideoRepo(),
    onProgress,
  } = options;

  if (!token) {
    throw new Error('توکن دسترسی گیت‌هاب (GitHub Token) یافت نشد. لطفاً در پنل مدیریت توکن خود را ذخیره کنید.');
  }

  const isVideo = file.type.startsWith('video/') || /\.(mp4|webm|mov|mkv)$/i.test(file.name);
  const sizeMB = file.size / (1024 * 1024);
  const thresholdMB = getVideoThresholdMB();

  let targetRepo = mainRepo;
  let targetPath = '';
  let finalUrl = '';
  let base64Content = '';
  let mediaType: 'image' | 'video' = isVideo ? 'video' : 'image';

  if (!isVideo) {
    // -----------------------------------------------------------------------
    // فایل عکس: تبدیل خودکار به WebP بهینه‌شده در مرورگر و آپلود در ریپازیتوری اصلی
    // -----------------------------------------------------------------------
    onProgress?.('در حال بهینه‌سازی و تبدیل تصویر به WebP...', 20);
    const compResult = await compressImageToWebP(file, maxDimension, quality, watermark);
    
    // استخراج Base64 خالص از DataURL
    const commaIndex = compResult.dataUrl.indexOf(',');
    base64Content = commaIndex >= 0 ? compResult.dataUrl.slice(commaIndex + 1) : compResult.dataUrl;

    const baseName = sanitizeFilename(file.name).replace(/\.[^/.]+$/, '');
    const finalFilename = `${baseName}_${Date.now()}.webp`;

    targetRepo = mainRepo;
    targetPath = `public/uploads/${finalFilename}`;
    finalUrl = `/uploads/${finalFilename}`;
  } else {
    // -----------------------------------------------------------------------
    // فایل ویدیو: بررسی حجم و مسیردهی هوشمند
    // اگر حجم > 25MB یا تنظیم کاربر تمام ویدیوها باشد -> به ریپازیتوری ویدیو
    // -----------------------------------------------------------------------
    const shouldUseVideoRepo = forceVideoRepo || sizeMB > thresholdMB;
    const cleanVidName = sanitizeFilename(file.name);

    onProgress?.(`در حال آماده‌سازی فایل ویدیویی (${sizeMB.toFixed(1)} MB)...`, 20);
    base64Content = await fileToBase64(file);

    if (shouldUseVideoRepo) {
      targetRepo = videoRepo;
      targetPath = cleanVidName; // در ریشه ریپازیتوری szarghami/video-portfolio
      finalUrl = `${videoBaseUrl}${cleanVidName}`;
    } else {
      targetRepo = mainRepo;
      targetPath = `public/portfolio/${cleanVidName}`;
      finalUrl = `/portfolio/${cleanVidName}`;
    }
  }

  // -----------------------------------------------------------------------
  // فراخوانی مستقیم GitHub API برای بررسی SHA در صورت وجود و سپس Commit فایل
  // -----------------------------------------------------------------------
  onProgress?.(`در حال ارتباط با گیت‌هاب (${targetRepo})...`, 50);

  let existingSha: string | undefined;
  try {
    const checkRes = await fetch(`https://api.github.com/repos/${targetRepo}/contents/${targetPath}`, {
      headers: {
        Authorization: `token ${token.trim()}`,
        Accept: 'application/vnd.github.v3+json',
      },
    });
    if (checkRes.ok) {
      const checkData = await checkRes.json();
      existingSha = checkData.sha;
    }
  } catch (e) {
    // خطای شبکه را نادیده می‌گیریم و آپلود جدید انجام می‌دهیم
  }

  onProgress?.(`در حال بارگذاری فایل در مخزن ${targetRepo}...`, 75);

  const commitMsg = `Upload ${mediaType} ${targetPath} via Sina Zarghami Studio [${new Date().toISOString()}]`;
  const putRes = await fetch(`https://api.github.com/repos/${targetRepo}/contents/${targetPath}`, {
    method: 'PUT',
    headers: {
      Authorization: `token ${token.trim()}`,
      Accept: 'application/vnd.github.v3+json',
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      message: commitMsg,
      content: base64Content,
      branch: 'main',
      ...(existingSha ? { sha: existingSha } : {}),
    }),
  });

  const putData = await putRes.json();

  if (!putRes.ok) {
    throw new Error(putData.message || `خطا در آپلود به گیت‌هاب (کد وضعیت: ${putRes.status})`);
  }

  onProgress?.('آپلود با موفقیت انجام شد!', 100);

  const rawUrl = putData.content?.download_url || `https://raw.githubusercontent.com/${targetRepo}/main/${targetPath}`;

  return {
    success: true,
    url: finalUrl,
    rawUrl,
    type: mediaType,
    targetRepo,
    targetPath,
    fileSize: file.size,
  };
}

/**
 * اطلاعات یک فایل شناسایی‌شده از گیت‌هاب
 */
export interface DiscoveredGitHubFile {
  name: string;
  path: string;
  sha: string;
  size: number;
  download_url: string;
  type: string;
}

/**
 * ۲. سینک و شناسایی خودکار فایل‌های آپلودشده در گیت‌هاب (Auto-Discovery)
 */
export async function discoverGitHubMedia(params: {
  existingPhotos: PhotoItem[];
  token?: string;
  mainRepo?: string;
  videoRepo?: string;
  videoBaseUrl?: string;
  onLog?: (msg: string) => void;
}): Promise<{
  newPhotos: PhotoItem[];
  totalDiscovered: number;
  scannedMainCount: number;
  scannedVideoCount: number;
  skippedExistingCount: number;
}> {
  const {
    existingPhotos,
    token = getSavedGitHubToken(),
    mainRepo = getMainRepo(),
    videoRepo = getVideoRepo(),
    videoBaseUrl = getVideoBaseUrl(),
    onLog,
  } = params;

  const authHeaders: Record<string, string> = {
    Accept: 'application/vnd.github.v3+json',
  };
  if (token && token.trim()) {
    authHeaders.Authorization = `token ${token.trim()}`;
  }

  const newPhotos: PhotoItem[] = [];
  let scannedMainCount = 0;
  let scannedVideoCount = 0;
  let skippedExistingCount = 0;

  // ساخت یک مجموعه از اسامی فایل‌های موجود برای جلوگیری از تکرار
  const existingIdentifiers = new Set<string>();
  for (const p of existingPhotos) {
    if (p.imageUrl) existingIdentifiers.add(extractFilename(p.imageUrl).toLowerCase());
    if (p.videoUrl) existingIdentifiers.add(extractFilename(p.videoUrl).toLowerCase());
    if (p.galleryImages) {
      for (const g of p.galleryImages) {
        existingIdentifiers.add(extractFilename(g).toLowerCase());
      }
    }
  }

  // -------------------------------------------------------------------------
  // گام ۱: خواندن فایل‌های شاخه public/portfolio از ریپازیتوری اصلی
  // -------------------------------------------------------------------------
  onLog?.(`در حال اسکن شاخه public/portfolio در ریپازیتوری ${mainRepo}...`);
  try {
    const res = await fetch(`https://api.github.com/repos/${mainRepo}/contents/public/portfolio`, {
      headers: authHeaders,
    });

    if (res.ok) {
      const files: DiscoveredGitHubFile[] = await res.json();
      if (Array.isArray(files)) {
        scannedMainCount = files.length;
        for (const f of files) {
          if (f.name === '.gitkeep' || f.name.startsWith('.')) continue;

          const isImg = /\.(webp|jpg|jpeg|png|avif)$/i.test(f.name);
          const isVid = /\.(mp4|webm|mov)$/i.test(f.name);

          if (!isImg && !isVid) continue;

          const cleanName = f.name.toLowerCase();
          if (existingIdentifiers.has(cleanName)) {
            skippedExistingCount++;
            continue;
          }

          const { titleFa, titleEn, category } = inferTitlesFromFilename(f.name);
          const siteUrl = `/portfolio/${f.name}`;

          const newItem: PhotoItem = {
            id: `gh-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`,
            titleFa,
            titleEn,
            category: isVid ? 'video' : category,
            locationFa: 'ایران',
            locationEn: 'Iran',
            year: '1403',
            imageUrl: siteUrl,
            ...(isVid
              ? {
                  isVideo: true,
                  videoUrl: siteUrl,
                  videoQuality: '4K 60fps',
                  videoDuration: '01:00',
                }
              : {}),
            camera: isVid ? 'GoPro Max 360 / Canon R8' : 'Canon R8',
            lens: 'Canon EF 50mm f/1.8',
            exif: {
              aperture: 'f/2.8',
              shutter: '1/250s',
              iso: '100',
              focalLength: '50mm',
            },
            descriptionFa: isVid
              ? 'پروژه ویدیویی و تیزر سینمایی استخراج‌شده از گیت‌هاب'
              : 'اثر عکاسی فاین‌آرت ثبت‌شده در گیت‌هاب سینا ضرغامی',
            descriptionEn: isVid ? 'Cinematic video from GitHub portfolio' : 'Fine art photograph from GitHub portfolio',
            printAvailable: !isVid,
            printPriceToman: 1800000,
            printPriceUsd: 65,
          };

          newPhotos.push(newItem);
          existingIdentifiers.add(cleanName);
        }
      }
    } else if (res.status === 404) {
      onLog?.(`پوشه public/portfolio در مخزن اصلی هنوز ایجاد نشده یا فایلی در آن قرار نگرفته است.`);
    } else {
      onLog?.(`هشدار: ریپازیتوری اصلی (${mainRepo}) پاسخ نداد (وضعیت: ${res.status})`);
    }
  } catch (e: any) {
    onLog?.(`خطا در اسکن ریپازیتوری اصلی: ${e.message}`);
  }

  // -------------------------------------------------------------------------
  // گام ۲: خواندن فایل‌های ویدیویی از ریپازیتوری ویدیو (szarghami/video-portfolio)
  // -------------------------------------------------------------------------
  onLog?.(`در حال اسکن ریپازیتوری اختصاصی ویدیوها (${videoRepo})...`);
  try {
    let videoItemsFound: { name: string; relativePath: string }[] = [];

    // ابتدا تلاش برای دریافت درخت کامل با Git Trees API جهت کشف فایل‌ها حتی در پوشه‌ها
    try {
      const treeRes = await fetch(`https://api.github.com/repos/${videoRepo}/git/trees/main?recursive=1`, {
        headers: authHeaders,
      });
      if (treeRes.ok) {
        const treeData = await treeRes.json();
        if (treeData && Array.isArray(treeData.tree)) {
          for (const item of treeData.tree) {
            if (item.type === 'blob' && /\.(mp4|webm|mov|m4v)$/i.test(item.path)) {
              const filename = item.path.split('/').pop() || item.path;
              videoItemsFound.push({ name: filename, relativePath: item.path });
            }
          }
        }
      }
    } catch (_) {}

    // اگر از طریق tree پیدا نشد، از REST Contents API در ریشه استفاده می‌کنیم
    if (videoItemsFound.length === 0) {
      const res = await fetch(`https://api.github.com/repos/${videoRepo}/contents`, {
        headers: authHeaders,
      });

      if (res.ok) {
        const files: DiscoveredGitHubFile[] = await res.json();
        if (Array.isArray(files)) {
          for (const f of files) {
            if (f.name === '.gitkeep' || f.name.startsWith('.')) continue;
            if (/\.(mp4|webm|mov|m4v)$/i.test(f.name)) {
              videoItemsFound.push({ name: f.name, relativePath: f.name });
            }
          }
        }
      }
    }

    scannedVideoCount = videoItemsFound.length;

    for (const item of videoItemsFound) {
      const cleanName = item.name.toLowerCase();
      if (existingIdentifiers.has(cleanName)) {
        skippedExistingCount++;
        continue;
      }

      const { titleFa, titleEn } = inferTitlesFromFilename(item.name);
      const finalVideoUrl = `${videoBaseUrl}${item.relativePath}`;

      const newItem: PhotoItem = {
        id: `gh-vid-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`,
        titleFa: titleFa.includes('ویدیو') || titleFa.includes('تیزر') ? titleFa : `تیزر سینمایی - ${titleFa}`,
        titleEn: titleEn.includes('Video') || titleEn.includes('Teaser') ? titleEn : `${titleEn} (Cinematic)`,
        category: 'video',
        locationFa: 'ایران',
        locationEn: 'Iran',
        year: '1403',
        imageUrl: finalVideoUrl,
        videoUrl: finalVideoUrl,
        isVideo: true,
        videoQuality: '4K Cinema 60fps',
        videoDuration: '01:30',
        camera: 'GoPro Max 360 / Canon R8',
        lens: 'Wide Cine Optics',
        exif: {
          aperture: 'f/2.8',
          shutter: '1/50s',
          iso: '400',
          focalLength: '24mm',
        },
        descriptionFa: 'پروژه ویدیویی سینمایی میزبانی‌شده روی GitHub Pages با دسترسی پرسرعت',
        descriptionEn: 'High-speed streamable cinematic video hosted on GitHub Pages',
        printAvailable: false,
        printPriceToman: 0,
        printPriceUsd: 0,
      };

      newPhotos.push(newItem);
      existingIdentifiers.add(cleanName);
    }
  } catch (e: any) {
    onLog?.(`خطا در اسکن ریپازیتوری ویدیو: ${e.message}`);
  }

  onLog?.(`اسکن پایان یافت. ${newPhotos.length} آیتم تازه کشف شد.`);

  return {
    newPhotos,
    totalDiscovered: newPhotos.length,
    scannedMainCount,
    scannedVideoCount,
    skippedExistingCount,
  };
}

/**
 * کمکی برای استخراج نام خالص فایل از یک URL یا مسیر
 */
function extractFilename(urlOrPath: string): string {
  try {
    const clean = urlOrPath.split('?')[0].split('#')[0];
    const segments = clean.split('/');
    return segments[segments.length - 1] || '';
  } catch {
    return urlOrPath;
  }
}

/**
 * ۳. آپلود تکه‌تکه (Chunked Upload) برای ویدیوهای سنگین (۲۰۰ تا ۵۰۰ مگابایت)
 * برش فایل با File.slice به قطعات ۱۵ مگابایتی و ارسال مستقیم به temp_raw/{videoId}/ در ریپازیتوری video-portfolio
 */
export async function uploadLargeVideoChunked(params: {
  file: File;
  token?: string;
  videoRepo?: string;
  videoBaseUrl?: string;
  chunkSizeMB?: number;
  onProgress?: (status: string, percent: number) => void;
}): Promise<{
  success: boolean;
  videoId: string;
  originalName: string;
  sanitizedName: string;
  totalChunks: number;
  hlsStreamUrl: string;
  mp4DirectUrl: string;
  manifestPath: string;
}> {
  const {
    file,
    token = getSavedGitHubToken(),
    videoRepo = getVideoRepo(),
    videoBaseUrl = getVideoBaseUrl(),
    chunkSizeMB = 15,
    onProgress,
  } = params;

  if (!token) {
    throw new Error('توکن دسترسی شخصی گیت‌هاب یافت نشد. لطفاً در پنل مدیریت توکن را ذخیره کنید.');
  }

  const chunkSize = chunkSizeMB * 1024 * 1024; // 15MB chunks
  const totalChunks = Math.ceil(file.size / chunkSize);
  const cleanFilename = sanitizeFilename(file.name);
  const videoSlug = cleanFilename.replace(/\.[^/.]+$/, '');
  const videoId = `vid_${Date.now()}_${videoSlug.slice(0, 20)}`;

  onProgress?.(`شروع آپلود تکه‌تکه: حجم فایل ${(file.size / (1024 * 1024)).toFixed(1)} MB در ${totalChunks} قطعه ۱۵ مگابایتی`, 0);

  // ارسال قطعه به قطعه
  for (let i = 0; i < totalChunks; i++) {
    const start = i * chunkSize;
    const end = Math.min(start + chunkSize, file.size);
    const chunkBlob = file.slice(start, end);
    const chunkNumber = i + 1;
    const chunkFilename = `part_${String(chunkNumber).padStart(3, '0')}.bin`;
    const targetPath = `temp_raw/${videoId}/${chunkFilename}`;

    const currentPercent = Math.round((i / totalChunks) * 88);
    onProgress?.(`در حال خواندن و تبدیل قطعه ${chunkNumber} از ${totalChunks} (${(chunkBlob.size / (1024 * 1024)).toFixed(1)} MB)...`, currentPercent);

    // تبدیل تکه به Base64
    const base64Chunk = await new Promise<string>((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = () => {
        const res = reader.result as string;
        const comma = res.indexOf(',');
        resolve(comma >= 0 ? res.slice(comma + 1) : res);
      };
      reader.onerror = (e) => reject(e);
      reader.readAsDataURL(chunkBlob);
    });

    onProgress?.(`در حال بارگذاری قطعه ${chunkNumber} از ${totalChunks} در گیت‌هاب (${videoRepo})...`, currentPercent + 2);

    const putRes = await fetch(`https://api.github.com/repos/${videoRepo}/contents/${targetPath}`, {
      method: 'PUT',
      headers: {
        Authorization: `token ${token.trim()}`,
        Accept: 'application/vnd.github.v3+json',
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        message: `Upload chunk ${chunkNumber}/${totalChunks} for ${cleanFilename} [${videoId}]`,
        content: base64Chunk,
        branch: 'main',
      }),
    });

    if (!putRes.ok) {
      const errData = await putRes.json().catch(() => ({}));
      throw new Error(`خطا در ارسال قطعه ${chunkNumber} به گیت‌هاب: ${errData.message || putRes.statusText}`);
    }
  }

  // ثبت فایل READY_TO_PROCESS.json در پوشه موقت جهت تریگر شدن اکشن
  onProgress?.('تمام قطعات با موفقیت آپلود شدند. در حال ایجاد فایل سیگنال READY_TO_PROCESS.json...', 92);

  const manifest = {
    videoId,
    originalName: file.name,
    sanitizedName: cleanFilename,
    videoSlug,
    totalChunks,
    chunkSize,
    totalSize: file.size,
    targetHlsPath: `videos/${videoSlug}/index.m3u8`,
    targetMp4Path: `videos/${cleanFilename}`,
    timestamp: new Date().toISOString(),
    status: 'ready_for_ffmpeg',
  };

  const manifestJsonString = JSON.stringify(manifest, null, 2);
  const manifestBase64 = btoa(unescape(encodeURIComponent(manifestJsonString)));
  const manifestPath = `temp_raw/${videoId}/READY_TO_PROCESS.json`;

  const manifestRes = await fetch(`https://api.github.com/repos/${videoRepo}/contents/${manifestPath}`, {
    method: 'PUT',
    headers: {
      Authorization: `token ${token.trim()}`,
      Accept: 'application/vnd.github.v3+json',
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      message: `Trigger automated video processing for ${cleanFilename} [${videoId}]`,
      content: manifestBase64,
      branch: 'main',
    }),
  });

  if (!manifestRes.ok) {
    const errData = await manifestRes.json().catch(() => ({}));
    throw new Error(`خطا در ایجاد فایل READY_TO_PROCESS.json: ${errData.message || manifestRes.statusText}`);
  }

  onProgress?.('آپلود تکه‌تکه کامل شد و سیگنال پردازش در گیت‌هاب فعال گردید!', 100);

  const hlsStreamUrl = `${videoBaseUrl}videos/${videoSlug}/index.m3u8`;
  const mp4DirectUrl = `${videoBaseUrl}videos/${cleanFilename}`;

  return {
    success: true,
    videoId,
    originalName: file.name,
    sanitizedName: cleanFilename,
    totalChunks,
    hlsStreamUrl,
    mp4DirectUrl,
    manifestPath,
  };
}

/**
 * تولید کد تمیز و استاندارد ورک‌فلو گیت‌هاب جهت الحاق تکه‌ها و تبدیل با FFmpeg
 */
export function getVideoProcessorWorkflowYaml(): string {
  return `name: Automated Chunked Video Processor (FFmpeg HLS & MP4)

on:
  push:
    paths:
      - 'temp_raw/**/READY_TO_PROCESS.json'
  workflow_dispatch:

permissions:
  contents: write

jobs:
  process-videos:
    runs-on: ubuntu-latest
    steps:
      - name: Checkout Repository
        uses: actions/checkout@v4
        with:
          fetch-depth: 1

      - name: Install FFmpeg
        run: |
          sudo apt-get update
          sudo apt-get install -y ffmpeg

      - name: Merge Chunks and Transcode via FFmpeg
        run: |
          set -e
          echo "Scanning temp_raw for ready manifests..."
          
          find temp_raw -name "READY_TO_PROCESS.json" | while read manifest; do
            dir=$(dirname "$manifest")
            echo "Processing folder: $dir"
            
            SAN_NAME=$(python3 -c "import json; d=json.load(open('$manifest')); print(d.get('sanitizedName', 'output.mp4'))")
            SLUG=$(python3 -c "import json; d=json.load(open('$manifest')); print(d.get('videoSlug', 'video'))")
            
            echo "Merging chunk files in $dir..."
            cat "$dir"/part_*.bin > merged_raw.tmp
            
            mkdir -p videos
            mkdir -p "videos/$SLUG"
            
            echo "Generating web-optimized MP4 with faststart..."
            ffmpeg -y -i merged_raw.tmp -vcodec libx264 -crf 22 -preset fast -acodec aac -b:a 192k -movflags +faststart "videos/$SAN_NAME"
            
            echo "Generating HLS multi-segment stream (<10MB chunks)..."
            ffmpeg -y -i merged_raw.tmp -profile:v baseline -level 3.0 -s 1920x1080 -start_number 0 -hls_time 6 -hls_list_size 0 -f hls "videos/$SLUG/index.m3u8"
            
            echo "Cleaning up temp files for $dir..."
            rm -f merged_raw.tmp
            rm -rf "$dir"
          done

      - name: Commit and Push Processed Videos
        run: |
          git config user.name "Sina Zarghami Video Engine"
          git config user.email "bot@sinazarghami.ir"
          git add videos/
          git rm -rf temp_raw/ 2>/dev/null || true
          if git diff --staged --quiet; then
            echo "No changes to commit."
          else
            git commit -m "Transcode processed videos & cleanup temp_raw [skip ci]"
            git push origin main
          fi
`;
}

/**
 * ارسال و ایجاد مستقیم فایل ورک‌فلو به ریپازیتوری szarghami/video-portfolio
 */
export async function deployVideoProcessorWorkflowToGitHub(
  token?: string,
  repo: string = DEFAULT_VIDEO_REPO
): Promise<{ success: boolean; msg: string }> {
  const ghToken = token || getSavedGitHubToken();
  if (!ghToken) {
    throw new Error('توکن گیت‌هاب موجود نیست.');
  }

  const workflowPath = '.github/workflows/video-processor.yml';
  const contentYaml = getVideoProcessorWorkflowYaml();
  const base64Content = btoa(unescape(encodeURIComponent(contentYaml)));

  let sha: string | undefined;
  try {
    const checkRes = await fetch(`https://api.github.com/repos/${repo}/contents/${workflowPath}`, {
      headers: {
        Authorization: `token ${ghToken.trim()}`,
        Accept: 'application/vnd.github.v3+json',
      },
    });
    if (checkRes.ok) {
      const data = await checkRes.json();
      sha = data.sha;
    }
  } catch (_) {}

  const putRes = await fetch(`https://api.github.com/repos/${repo}/contents/${workflowPath}`, {
    method: 'PUT',
    headers: {
      Authorization: `token ${ghToken.trim()}`,
      Accept: 'application/vnd.github.v3+json',
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      message: `Setup automated video processor workflow in ${repo}`,
      content: base64Content,
      branch: 'main',
      ...(sha ? { sha } : {}),
    }),
  });

  if (!putRes.ok) {
    const err = await putRes.json().catch(() => ({}));
    throw new Error(err.message || `کد خطا: ${putRes.status}`);
  }

  return {
    success: true,
    msg: `ورک‌فلو پردازش خودکار ویدیوها با موفقیت در ریپازیتوری ${repo} در برنچ main مستقر شد!`,
  };
}

/**
 * کامیت مستقیم و امن هر فایلی در مخزن گیت‌هاب از داخل مرورگر
 * دریافت مقدار sha قبلی فایل در صورت وجود تا خطای 409/422 رخ ندهد
 */
export async function commitFileToGitHub(
  repoFullName: string,
  filePath: string,
  contentBase64: string,
  commitMessage: string,
  token: string,
  branch: string = 'main'
): Promise<{ success: boolean; sha?: string; content?: any; error?: string }> {
  if (!token || !token.trim()) {
    throw new Error('توکن دسترسی گیت‌هاب (Personal Access Token) الزامی است.');
  }
  const cleanToken = token.trim();
  const cleanRepo = repoFullName.trim();
  const cleanPath = filePath.replace(/^\/+/, '');

  let existingSha: string | undefined;

  // الف) بررسی وجود فایل و استخراج sha فعلی
  try {
    const checkRes = await fetch(
      `https://api.github.com/repos/${cleanRepo}/contents/${cleanPath}?ref=${encodeURIComponent(branch)}`,
      {
        headers: {
          Authorization: `Bearer ${cleanToken}`,
          Accept: 'application/vnd.github+json',
        },
      }
    );
    if (checkRes.ok) {
      const data = await checkRes.json();
      existingSha = data.sha;
    }
  } catch (err) {
    console.warn(`[GitHub] Checking ${cleanPath} failed, attempting clean commit:`, err);
  }

  // ب) ارسال درخواست PUT با هدرهای استاندارد گیت‌هاب
  const putRes = await fetch(`https://api.github.com/repos/${cleanRepo}/contents/${cleanPath}`, {
    method: 'PUT',
    headers: {
      Authorization: `Bearer ${cleanToken}`,
      Accept: 'application/vnd.github+json',
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      message: commitMessage,
      content: contentBase64,
      branch,
      ...(existingSha ? { sha: existingSha } : {}),
    }),
  });

  const putData = await putRes.json().catch(() => ({}));

  if (!putRes.ok) {
    const errorMsg = putData.message || `خطای گیت‌هاب (کد وضعیت ${putRes.status})`;
    throw new Error(errorMsg);
  }

  return {
    success: true,
    sha: putData.content?.sha,
    content: putData.content,
  };
}

/**
 * انتشار و همگام‌سازی مستقیم داده‌های سایت (site-data.json) با مخزن گیت‌هاب
 * پشتیبانی کامل از UTF-8 Safe Base64 برای حفظ متون فارسی
 * کامیت همزمان در دو مسیر: public/site-data.json و ریشه site-data.json
 */
export async function publishSiteDataToGitHub(
  siteData: SiteContent,
  token?: string,
  repoFullName?: string
): Promise<{ success: boolean; msg: string }> {
  const ghToken = token || getSavedGitHubToken();
  if (!ghToken) {
    throw new Error('توکن دسترسی گیت‌هاب برای انتشار مستقیم الزامی است.');
  }
  const targetRepo = repoFullName || getMainRepo();

  const jsonString = JSON.stringify(siteData, null, 2);

  // تبدیل امن UTF-8 به Base64 با TextEncoder جهت حفظ دقیق حروف فارسی
  const utf8Bytes = new TextEncoder().encode(jsonString);
  let binary = '';
  for (let i = 0; i < utf8Bytes.length; i++) {
    binary += String.fromCharCode(utf8Bytes[i]);
  }
  const contentBase64 = btoa(binary);

  const commitMsg = `Update site-data.json via Sina Zarghami Pure Static Git-CMS [${new Date().toISOString()}]`;

  // ۱. کامیت در public/site-data.json جهت دسترسی کلاینت
  await commitFileToGitHub(targetRepo, 'public/site-data.json', contentBase64, commitMsg, ghToken, 'main');

  // ۲. کامیت در ریشه site-data.json
  await commitFileToGitHub(targetRepo, 'site-data.json', contentBase64, commitMsg, ghToken, 'main');

  return {
    success: true,
    msg: `داده‌های وب‌سایت با موفقیت در مخزن ${targetRepo} کامیت و مستقر شدند.`,
  };
}

/**
 * آپلود تصویر به صورت مستقیم در پوشه public/uploads/ مخزن گیت‌هاب
 * و بازگرداندن آدرس نسبی و بدون فیلتر /uploads/...
 */
export async function uploadImageToGitHub(
  blobOrFile: Blob | File | string,
  fileName: string,
  token?: string,
  repoFullName?: string
): Promise<{ success: boolean; publicUrl: string; path: string }> {
  const ghToken = token || getSavedGitHubToken();
  if (!ghToken) {
    throw new Error('توکن دسترسی گیت‌هاب برای بارگذاری تصویر الزامی است.');
  }
  const targetRepo = repoFullName || getMainRepo();

  let base64Content = '';

  if (typeof blobOrFile === 'string') {
    const commaIdx = blobOrFile.indexOf(',');
    base64Content = commaIdx >= 0 ? blobOrFile.slice(commaIdx + 1) : blobOrFile;
  } else {
    base64Content = await new Promise<string>((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = () => {
        const res = reader.result as string;
        const commaIdx = res.indexOf(',');
        resolve(commaIdx >= 0 ? res.slice(commaIdx + 1) : res);
      };
      reader.onerror = reject;
      reader.readAsDataURL(blobOrFile);
    });
  }

  const baseClean = sanitizeFilename(fileName).replace(/\.[^/.]+$/, '');
  const cleanFileName = `${baseClean || 'photo'}_${Date.now()}.webp`;
  const filePath = `public/uploads/${cleanFileName}`;

  await commitFileToGitHub(
    targetRepo,
    filePath,
    base64Content,
    `Upload image ${cleanFileName} via Sina Zarghami Studio`,
    ghToken,
    'main'
  );

  // آدرس کاملاً نسبی و تمیز در دسترس مرورگر بدون نیاز به دامنه فیلترشده raw.githubusercontent
  const publicUrl = `/uploads/${cleanFileName}`;

  return {
    success: true,
    publicUrl,
    path: filePath,
  };
}

