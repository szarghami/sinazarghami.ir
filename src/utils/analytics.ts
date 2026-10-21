// =====================================================================
// ماژول جامع آمارگیر و ردیابی رفتار بازدیدکنندگان وب‌سایت سینا ضرغامی
// تحلیل دقیق مدل دستگاه‌ها (iPhone, iPad, Android, Mac, Windows, Linux)،
// مرورگرها (Safari, Chrome, Firefox, Telegram, Instagram)،
// ثبت سفارشات و پشتیبانی کامل از معماری Pure Static بدون نیاز به سرور
// =====================================================================

import { AnalyticsEvent, AnalyticsSummary } from '../types';
import { sendTelegramNotification } from './telegram';
import { commitFileToGitHub, getMainRepo } from './githubMediaService';
import { getSavedGitHubToken } from './storage';
import { getSessionVault } from './cryptoVault';

const SESSION_KEY = 'sz_session_id';
const EVENTS_CACHE_KEY = 'sz_cached_events_v2';
const ORDERS_CACHE_KEY = 'sz_cached_orders_v2';
const ABANDONED_CACHE_KEY = 'sz_cached_abandoned_v2';

export interface VisitorDeviceInfo {
  deviceModel: 'iPhone' | 'iPad' | 'Android Phone' | 'Mac' | 'Windows PC' | 'Linux' | 'Other Device';
  browser: 'Safari' | 'Chrome' | 'Firefox' | 'Telegram In-App' | 'Instagram In-App' | 'Microsoft Edge' | 'Samsung Internet' | 'Other Browser';
  os: 'iOS' | 'Android' | 'macOS' | 'Windows' | 'Linux' | 'Other OS';
  deviceCategory: 'mobile' | 'desktop' | 'tablet';
  screenResolution: string;
  timestamp: string;
  persianDate: string;
}

/**
 * تشخیص دقیق دستگاه، مرورگر، سیستم‌عامل و زمان بازدید کاربر از روی User Agent و ابعاد صفحه
 */
export function parseVisitorDevice(
  customUa?: string,
  width?: number,
  height?: number
): VisitorDeviceInfo {
  const isClient = typeof window !== 'undefined';
  const ua = customUa || (isClient ? navigator.userAgent : '');
  const w = width ?? (isClient ? window.innerWidth : 1280);
  const h = height ?? (isClient ? window.innerHeight : 800);

  // ۱. تشخیص مرورگر واقعی (با اولویت مرورگرهای درون‌برنامه‌ای اینستاگرام و تلگرام)
  let browser: VisitorDeviceInfo['browser'] = 'Other Browser';
  if (/Instagram/i.test(ua)) {
    browser = 'Instagram In-App';
  } else if (/Telegram/i.test(ua)) {
    browser = 'Telegram In-App';
  } else if (/Edg\//i.test(ua)) {
    browser = 'Microsoft Edge';
  } else if (/SamsungBrowser\//i.test(ua)) {
    browser = 'Samsung Internet';
  } else if (/Firefox\//i.test(ua) || /FxiOS\//i.test(ua)) {
    browser = 'Firefox';
  } else if (/Chrome\//i.test(ua) || /CriOS\//i.test(ua)) {
    browser = 'Chrome';
  } else if (/Safari\//i.test(ua) && !/Chrome|CriOS|Edg|SamsungBrowser/i.test(ua)) {
    browser = 'Safari';
  }

  // ۲. تشخیص دقیق مدل دستگاه و سیستم‌عامل
  let deviceModel: VisitorDeviceInfo['deviceModel'] = 'Other Device';
  let os: VisitorDeviceInfo['os'] = 'Other OS';
  let deviceCategory: VisitorDeviceInfo['deviceCategory'] = 'desktop';

  const isTouchMac = isClient && (navigator.platform === 'MacIntel' || (navigator as any).userAgentData?.platform === 'macOS') && navigator.maxTouchPoints > 1;

  if (/iPad/i.test(ua) || isTouchMac) {
    deviceModel = 'iPad';
    os = 'iOS';
    deviceCategory = 'tablet';
  } else if (/iPhone/i.test(ua)) {
    deviceModel = 'iPhone';
    os = 'iOS';
    deviceCategory = 'mobile';
  } else if (/Android/i.test(ua)) {
    os = 'Android';
    if (!/Mobile/i.test(ua) || w >= 768) {
      deviceModel = 'iPad'; // Tablet form factor
      deviceCategory = 'tablet';
    } else {
      deviceModel = 'Android Phone';
      deviceCategory = 'mobile';
    }
  } else if (/Macintosh|Mac OS X/i.test(ua)) {
    deviceModel = 'Mac';
    os = 'macOS';
    deviceCategory = 'desktop';
  } else if (/Windows/i.test(ua)) {
    deviceModel = 'Windows PC';
    os = 'Windows';
    deviceCategory = 'desktop';
  } else if (/Linux/i.test(ua)) {
    deviceModel = 'Linux';
    os = 'Linux';
    deviceCategory = 'desktop';
  } else {
    deviceCategory = w < 768 ? 'mobile' : w <= 1024 ? 'tablet' : 'desktop';
  }

  const now = new Date();
  const timestamp = now.toISOString();
  const persianDate = now.toLocaleDateString('fa-IR', {
    hour: '2-digit',
    minute: '2-digit',
    second: '2-digit',
    year: 'numeric',
    month: 'numeric',
    day: 'numeric',
  });

  return {
    deviceModel,
    browser,
    os,
    deviceCategory,
    screenResolution: `${w}x${h}`,
    timestamp,
    persianDate,
  };
}

// تولید یا بازخوانی شناسه یکتای نشست مرورگر
function getSessionId(): string {
  if (typeof window === 'undefined') return 'server-session';
  let sid = sessionStorage.getItem(SESSION_KEY);
  if (!sid) {
    sid = 'sess_' + Math.random().toString(36).substring(2, 9) + '_' + Date.now().toString(36);
    sessionStorage.setItem(SESSION_KEY, sid);
  }
  return sid;
}

// شناسایی منبع ارجاع (گوگل، اینستاگرام، تلگرام، ارجاع مستقیم)
function detectReferrer(): string {
  if (typeof document === 'undefined') return 'Direct';
  const ref = document.referrer;
  if (!ref) return 'ورود مستقیم (Direct URL)';
  const lower = ref.toLowerCase();
  if (lower.includes('google.')) return 'جستجوی گوگل (Google Search)';
  if (lower.includes('instagram.')) return 'اینستاگرام (@sina.zarghami)';
  if (lower.includes('t.me') || lower.includes('telegram')) return 'کانال یا پیام تلگرام';
  if (lower.includes('linkedin.')) return 'شبکه لینکدین (LinkedIn)';
  if (lower.includes('github.')) return 'گیت‌هاب (GitHub)';
  if (lower.includes('youtube.') || lower.includes('youtu.be')) return 'یوتیوب (YouTube)';
  try {
    const host = new URL(ref).hostname;
    return `سایت ارجاع‌دهنده: ${host}`;
  } catch {
    return 'ارجاع خارجی';
  }
}

/**
 * ذخیره ایمن در LocalStorage
 */
function appendToStorageList(key: string, item: any, maxCount = 400) {
  if (typeof window === 'undefined') return;
  try {
    const raw = localStorage.getItem(key);
    const list = raw ? JSON.parse(raw) : [];
    list.unshift(item);
    if (list.length > maxCount) list.length = maxCount;
    localStorage.setItem(key, JSON.stringify(list));
  } catch (_) {}
}

/**
 * ثبت رویداد تحلیلی در کلاینت و سرور
 */
export async function trackEvent(
  eventType: AnalyticsEvent['eventType'],
  data?: Partial<AnalyticsEvent>
): Promise<void> {
  if (typeof window === 'undefined') return;

  const devInfo = parseVisitorDevice();

  const event: AnalyticsEvent = {
    id: 'evt_' + Date.now() + '_' + Math.random().toString(36).substring(2, 6),
    sessionId: getSessionId(),
    eventType,
    path: window.location.pathname + window.location.hash,
    referrer: detectReferrer(),
    browser: devInfo.browser,
    exactBrowser: devInfo.browser,
    deviceModel: devInfo.deviceModel,
    os: devInfo.os,
    device: devInfo.deviceCategory,
    screenResolution: devInfo.screenResolution,
    clientTimestamp: devInfo.timestamp,
    persianDate: devInfo.persianDate,
    ...data,
  };

  // ۱. ذخیره رویداد در کش لوکال
  appendToStorageList(EVENTS_CACHE_KEY, event, 500);

  // ۲. در صورت ثبت سفارش قطعی یا استعلام خدمات، در کش دائمی سفارشات ثبت شود
  if (eventType === 'complete_order' || eventType === 'service_inquiry') {
    const orderRecord = {
      id: event.id,
      type: eventType === 'complete_order' ? 'print_shop' : 'service_commission',
      title: event.photoTitle || event.serviceType || 'سفارش اثر',
      priceToman: event.priceToman,
      priceUsd: event.priceUsd,
      clientName: event.clientName || 'مشتری وب‌سایت',
      contact: event.contact,
      device: `${devInfo.deviceModel} · ${devInfo.browser}`,
      browser: devInfo.browser,
      timestamp: devInfo.timestamp,
      persianDate: devInfo.persianDate,
      details: event.details || event.brief || event.selectedFormat,
    };
    appendToStorageList(ORDERS_CACHE_KEY, orderRecord, 200);
  }

  // ۳. در صورت رها شدن سبد خرید
  if (eventType === 'abandon_checkout') {
    const cartRecord = {
      photoTitle: event.photoTitle || 'اثر هنری',
      photoId: event.photoId,
      priceToman: event.priceToman,
      browser: devInfo.browser,
      device: devInfo.deviceModel,
      referrer: event.referrer || 'ورود مستقیم',
      timestamp: devInfo.timestamp,
      persianDate: devInfo.persianDate,
    };
    appendToStorageList(ABANDONED_CACHE_KEY, cartRecord, 100);
  }

  // ۴. ارسال کمکی به سرور (برای محیط محلی AI Studio)
  try {
    fetch('/api/analytics/event', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(event),
    }).catch(() => {});
  } catch (_) {}
}

/**
 * دریافت گزارش کامل آمار با قابلیت پشتیبانی از هاست استاتیک و بدون نیاز به server.ts
 */
export async function fetchAnalyticsSummary(): Promise<AnalyticsSummary> {
  let serverSummary: AnalyticsSummary | null = null;

  // ۱. تلاش برای دریافت آمار از سرور لوکال (در صورت فعال بودن Express)
  try {
    const res = await fetch('/api/analytics/summary');
    if (res.ok) {
      serverSummary = await res.json();
    }
  } catch (_) {}

  // ۲. تلاش برای دریافت فایل لاگ استاتیک مخزن /analytics-data.json
  let remoteEvents: AnalyticsEvent[] = [];
  try {
    const res = await fetch(`/analytics-data.json?t=${Date.now()}`);
    if (res.ok) {
      const data = await res.json();
      if (Array.isArray(data.events)) {
        remoteEvents = data.events;
      }
    }
  } catch (_) {}

  // ۳. خواندن رویدادهای ذخیره‌شده در LocalStorage
  let localEvents: AnalyticsEvent[] = [];
  let localOrders: any[] = [];
  let localAbandoned: any[] = [];
  if (typeof window !== 'undefined') {
    try {
      localEvents = JSON.parse(localStorage.getItem(EVENTS_CACHE_KEY) || '[]');
      localOrders = JSON.parse(localStorage.getItem(ORDERS_CACHE_KEY) || '[]');
      localAbandoned = JSON.parse(localStorage.getItem(ABANDONED_CACHE_KEY) || '[]');
    } catch (_) {}
  }

  // ادغام رویدادها بر پایه شناسه یکتا
  const eventMap = new Map<string, AnalyticsEvent>();
  [...(serverSummary?.recentEvents || []), ...remoteEvents, ...localEvents].forEach((ev) => {
    if (ev && ev.id) eventMap.set(ev.id, ev);
  });
  const allEvents = Array.from(eventMap.values());

  // محاسبه شاخص‌ها
  const now = new Date();
  const todayStr = now.toISOString().split('T')[0];
  const yesterday = new Date(now.getTime() - 86400000);
  const yesterdayStr = yesterday.toISOString().split('T')[0];

  const sessions = new Set<string>();
  let pageViews = 0;
  let todayViews = 0;
  let yesterdayViews = 0;

  const browserCounts: Record<string, number> = {};
  const deviceModelCounts: Record<string, number> = {};
  const deviceCatCounts: Record<string, number> = {};
  const referrerCounts: Record<string, number> = {};
  const sectionCounts: Record<string, number> = {
    'گالری آثار عکاسی': 0,
    'فروشگاه و سفارش چاپ': 0,
    'خدمات تولید و تصویربرداری': 0,
    'سفرها و تورها': 0,
    'کتاب‌ها و مونوگراف‌ها': 0,
    'رزومه و فعالیت‌ها': 0,
    'کمد تجهیزات (Gear Locker)': 0,
  };

  allEvents.forEach((ev) => {
    if (ev.sessionId) sessions.add(ev.sessionId);

    // شمارش مرورگر
    const b = ev.exactBrowser || ev.browser || 'Safari';
    browserCounts[b] = (browserCounts[b] || 0) + 1;

    // شمارش مدل دستگاه
    const dm = ev.deviceModel || (ev.device === 'mobile' ? 'iPhone' : 'Mac');
    deviceModelCounts[dm] = (deviceModelCounts[dm] || 0) + 1;

    // دسته‌بندی کلی
    const dc = ev.device || 'desktop';
    deviceCatCounts[dc] = (deviceCatCounts[dc] || 0) + 1;

    // ارجاع‌دهنده
    const ref = ev.referrer || 'ورود مستقیم (Direct URL)';
    referrerCounts[ref] = (referrerCounts[ref] || 0) + 1;

    // بازدید صفحات و بخش‌ها
    if (ev.eventType === 'page_view' || !ev.eventType) {
      pageViews++;
      const evDate = (ev.clientTimestamp || '').split('T')[0];
      if (evDate === todayStr) todayViews++;
      if (evDate === yesterdayStr) yesterdayViews++;
    }

    if (ev.path?.includes('gallery') || ev.eventType === 'photo_view') sectionCounts['گالری آثار عکاسی']++;
    if (ev.eventType === 'open_buy_modal' || ev.eventType === 'complete_order') sectionCounts['فروشگاه و سفارش چاپ']++;
    if (ev.eventType === 'service_inquiry' || ev.path?.includes('services')) sectionCounts['خدمات تولید و تصویربرداری']++;
    if (ev.path?.includes('expeditions')) sectionCounts['سفرها و تورها']++;
    if (ev.path?.includes('books')) sectionCounts['کتاب‌ها و مونوگراف‌ها']++;
    if (ev.path?.includes('resume')) sectionCounts['رزومه و فعالیت‌ها']++;
    if (ev.eventType === 'gear_view') sectionCounts['کمد تجهیزات (Gear Locker)']++;
  });

  // آمار دقیق و واقعی بازدیدها (بدون هیچ عدد ساختگی)
  const totalPageViews = pageViews;
  const totalSessions = sessions.size;
  const computedTodayViews = todayViews;
  const computedYesterdayViews = yesterdayViews;

  // تبدیل شمارش‌ها به لیست مرتب با درصد
  const toSortedList = (map: Record<string, number>, total: number) => {
    const effectiveTotal = Math.max(total, 1);
    return Object.entries(map)
      .filter(([_, count]) => count > 0)
      .map(([name, count]) => ({
        name,
        count,
        percent: Math.min(100, Math.round((count / effectiveTotal) * 100)),
      }))
      .sort((a, b) => b.count - a.count);
  };

  const topBrowsers = toSortedList(browserCounts, allEvents.length || 1);
  const topDeviceModels = toSortedList(deviceModelCounts, allEvents.length || 1);
  const topDevices = toSortedList(deviceCatCounts, allEvents.length || 1);
  const topReferrers = toSortedList(referrerCounts, allEvents.length || 1);
  const topSections = toSortedList(sectionCounts, allEvents.length || 1);

  // فهرست سفارشات قطعی و استعلام‌ها (صرفاً بر پایه سفارشات واقعی)
  const completedOrdersList: AnalyticsSummary['completedOrdersList'] = localOrders.length > 0
    ? localOrders
    : serverSummary?.completedOrdersList || [];

  const abandonedCartList = localAbandoned.length > 0
    ? localAbandoned
    : serverSummary?.abandonedCartList || [];

  const completedOrdersCount = completedOrdersList.length;
  const abandonedCheckoutsCount = abandonedCartList.length;
  const abandonmentRate = completedOrdersCount + abandonedCheckoutsCount > 0
    ? Math.round((abandonedCheckoutsCount / (completedOrdersCount + abandonedCheckoutsCount)) * 100)
    : 0;

  const recentEvents: AnalyticsEvent[] = allEvents.length > 0
    ? allEvents.slice(0, 40)
    : [];

  return {
    totalPageViews,
    todayViews: computedTodayViews,
    yesterdayViews: computedYesterdayViews,
    totalSessions,
    abandonedCheckoutsCount,
    completedOrdersCount,
    abandonmentRate,
    topBrowsers,
    topDevices,
    topDeviceModels,
    topReferrers,
    topSections,
    completedOrdersList,
    abandonedCartList,
    recentEvents,
  };
}

/**
 * همگام‌سازی و کامیت امن لاگ‌های آمار در مخزن گیت‌هاب (Pure Static Log Storage)
 */
export async function syncAnalyticsToGitHub(
  providedToken?: string,
  providedRepo?: string
): Promise<{ success: boolean; message: string }> {
  const sessionSecrets = getSessionVault();
  const token = (providedToken || sessionSecrets?.githubToken || getSavedGitHubToken()).trim();
  const repo = (providedRepo || sessionSecrets?.githubRepo || getMainRepo()).trim();

  if (!token || !repo) {
    return {
      success: false,
      message: 'توکن یا نام مخزن گیت‌هاب تنظیم نشده است.',
    };
  }

  try {
    const summary = await fetchAnalyticsSummary();
    const payload = {
      updatedAt: new Date().toISOString(),
      summary,
      events: summary.recentEvents,
    };
    const jsonStr = JSON.stringify(payload, null, 2);

    // UTF-8 Safe Base64
    const encoder = new TextEncoder();
    const bytes = encoder.encode(jsonStr);
    let binary = '';
    for (let i = 0; i < bytes.byteLength; i++) {
      binary += String.fromCharCode(bytes[i]);
    }
    const base64 = btoa(binary);

    await commitFileToGitHub(
      repo,
      'public/analytics-data.json',
      base64,
      `📊 بروزرسانی آمار بازدیدها و سفارشات سایت [${new Date().toLocaleDateString('fa-IR')}]`,
      token
    );

    return {
      success: true,
      message: 'لاگ‌های آمار و سفارشات با موفقیت در مخزن گیت‌هاب ذخیره شدند!',
    };
  } catch (err: any) {
    return {
      success: false,
      message: `خطا در ذخیره آمار در گیت‌هاب: ${err.message}`,
    };
  }
}

/**
 * ارسال فوری گزارش آمار به تلگرام شخصی سینا ضرغامی
 */
export async function sendAnalyticsToTelegram(): Promise<{ success: boolean; message: string }> {
  try {
    const s = await fetchAnalyticsSummary();
    const topBrowser = s.topBrowsers[0]?.name || 'Safari';
    const topDevice = s.topDeviceModels[0]?.name || 'iPhone';
    const topRef = s.topReferrers[0]?.name || 'اینستاگرام';

    const text =
      `📊 <b>گزارش آمار هوشمند وب‌سایت sinazarghami.ir</b>\n\n` +
      `👁 <b>بازدیدها:</b>\n` +
      `• امروز: ${s.todayViews.toLocaleString()} بازدید\n` +
      `• دیروز: ${s.yesterdayViews.toLocaleString()} بازدید\n` +
      `• کل نشست‌ها: ${s.totalSessions.toLocaleString()}\n\n` +
      `📱 <b>دیوایس‌ها و مرورگرها:</b>\n` +
      `• محبوب‌ترین دیوایس: ${topDevice}\n` +
      `• محبوب‌ترین مرورگر: ${topBrowser}\n` +
      `• منبع اصلی ورودی: ${topRef}\n\n` +
      `🛍 <b>سفارشات و خریدها:</b>\n` +
      `• سفارشات ثبت‌شده: ${s.completedOrdersCount} مورد\n` +
      `• سبدهای رها شده: ${s.abandonedCheckoutsCount} مورد (${s.abandonmentRate}%)\n\n` +
      `گزارش تفصیلی در پنل مدیریت استودیو ثبت شد.`;

    const ok = await sendTelegramNotification(text);
    return {
      success: ok,
      message: ok
        ? 'گزارش کامل آمار و سفارشات به تلگرام شما ارسال شد.'
        : 'خطا در ارسال به تلگرام. ارتباط اینترنت را بررسی کنید.',
    };
  } catch (err: any) {
    return { success: false, message: err.message || 'خطا در تولید گزارش تلگرام' };
  }
}
