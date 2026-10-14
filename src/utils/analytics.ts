// =====================================================================
// ماژول ثبت رفتار و آمار هوشمند بازدیدکنندگان وب‌سایت سینا ضرغامی
// تحلیل مرورگرها (Edge، کروم، سافاری)، دستگاه‌ها، ارجاع‌دهنده‌ها (گوگل، اینستاگرام)
// و ردیابی دقیق قیف خرید و سبدهای رها شده
// =====================================================================

import { AnalyticsEvent, AnalyticsSummary } from '../types';

const SESSION_KEY = 'sz_session_id';
const EVENTS_CACHE_KEY = 'sz_cached_events';

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

// تشخیص مرورگر واقعی کاربر (مخصوصاً شناسایی دقیق مایکروسافت اج)
function detectBrowser(): string {
  if (typeof window === 'undefined') return 'Unknown';
  const ua = navigator.userAgent;

  if (/Edg\//i.test(ua)) return 'Microsoft Edge';
  if (/Chrome\//i.test(ua) && !/Edg\//i.test(ua) && !/OPR\//i.test(ua)) return 'Google Chrome';
  if (/Safari\//i.test(ua) && !/Chrome\//i.test(ua)) return 'Apple Safari';
  if (/Firefox\//i.test(ua)) return 'Mozilla Firefox';
  if (/SamsungBrowser\//i.test(ua)) return 'Samsung Internet';
  if (/OPR\//i.test(ua) || /Opera/i.test(ua)) return 'Opera';
  return 'Web Browser';
}

// تشخیص سیستم‌عامل
function detectOS(): string {
  if (typeof window === 'undefined') return 'Unknown';
  const ua = navigator.userAgent;

  if (/Windows/i.test(ua)) return 'Windows';
  if (/Macintosh|Mac OS X/i.test(ua)) return 'macOS';
  if (/iPhone|iPad|iPod/i.test(ua)) return 'iOS';
  if (/Android/i.test(ua)) return 'Android';
  if (/Linux/i.test(ua)) return 'Linux';
  return 'Other OS';
}

// تشخیص نوع دستگاه
function detectDevice(): 'mobile' | 'desktop' | 'tablet' {
  if (typeof window === 'undefined') return 'desktop';
  const ua = navigator.userAgent;
  if (/tablet|ipad/i.test(ua)) return 'tablet';
  if (/mobile|iphone|android/i.test(ua)) return 'mobile';
  if (window.innerWidth < 768) return 'mobile';
  if (window.innerWidth <= 1024) return 'tablet';
  return 'desktop';
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
 * ارسال یک رویداد تحلیلی به سرور
 */
export async function trackEvent(
  eventType: AnalyticsEvent['eventType'],
  data?: Partial<AnalyticsEvent>
): Promise<void> {
  if (typeof window === 'undefined') return;

  const event: AnalyticsEvent = {
    id: 'evt_' + Date.now() + '_' + Math.random().toString(36).substring(2, 6),
    sessionId: getSessionId(),
    eventType,
    path: window.location.pathname + window.location.hash,
    referrer: detectReferrer(),
    browser: detectBrowser(),
    os: detectOS(),
    device: detectDevice(),
    screenResolution: `${window.innerWidth}x${window.innerHeight}`,
    clientTimestamp: new Date().toISOString(),
    persianDate: new Date().toLocaleDateString('fa-IR', {
      hour: '2-digit',
      minute: '2-digit',
      second: '2-digit',
      year: 'numeric',
      month: 'numeric',
      day: 'numeric',
    }),
    ...data,
  };

  // ارسال غیرهمگام به سرور بدون ایجاد کندی در تجربه کاربری
  try {
    fetch('/api/analytics/event', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(event),
    }).catch(() => {
      // ذخیره در کش محلی در صورت آفلاین بودن
      saveLocalEvent(event);
    });
  } catch {
    saveLocalEvent(event);
  }
}

// ذخیره محلی رویدادها
function saveLocalEvent(event: AnalyticsEvent) {
  try {
    const stored = JSON.parse(localStorage.getItem(EVENTS_CACHE_KEY) || '[]');
    stored.push(event);
    if (stored.length > 200) stored.shift();
    localStorage.setItem(EVENTS_CACHE_KEY, JSON.stringify(stored));
  } catch {
    // Ignore storage errors
  }
}

/**
 * دریافت گزارش کامل آمار و سبدهای رها شده از سرور
 */
export async function fetchAnalyticsSummary(): Promise<AnalyticsSummary | null> {
  try {
    const res = await fetch('/api/analytics/summary');
    if (!res.ok) throw new Error('Network error');
    return await res.json();
  } catch (err) {
    console.warn('خطا در دریافت آمار از سرور:', err);
    return null;
  }
}

/**
 * ارسال فوری گزارش آمار به تلگرام سینا ضرغامی
 */
export async function sendAnalyticsToTelegram(): Promise<{ success: boolean; message: string }> {
  try {
    const res = await fetch('/api/analytics/send-telegram-report', {
      method: 'POST',
    });
    const data = await res.json();
    return {
      success: res.ok && data.success,
      message: data.message || (res.ok ? 'گزارش به تلگرام ارسال شد.' : 'خطا در ارسال به تلگرام'),
    };
  } catch (err: any) {
    return { success: false, message: err.message || 'خطای شبکه در ارتباط با سرور' };
  }
}
