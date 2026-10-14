import React, { useState, useEffect } from 'react';
import {
  BarChart3,
  TrendingUp,
  Users,
  ShoppingCart,
  AlertTriangle,
  Monitor,
  Smartphone,
  Globe,
  RefreshCw,
  Send,
  CheckCircle2,
  Calendar,
  Clock,
  ArrowDownRight,
  ShieldAlert,
} from 'lucide-react';
import { AnalyticsSummary } from '../types';
import { fetchAnalyticsSummary, sendAnalyticsToTelegram } from '../utils/analytics';

interface AdminAnalyticsTabProps {
  isFa: boolean;
}

export const AdminAnalyticsTab: React.FC<AdminAnalyticsTabProps> = ({ isFa }) => {
  const [summary, setSummary] = useState<AnalyticsSummary | null>(null);
  const [loading, setLoading] = useState(true);
  const [telegramStatus, setTelegramStatus] = useState<string | null>(null);
  const [isSendingTelegram, setIsSendingTelegram] = useState(false);

  const loadData = async () => {
    setLoading(true);
    const data = await fetchAnalyticsSummary();
    if (data) {
      setSummary(data);
    }
    setLoading(false);
  };

  useEffect(() => {
    loadData();
  }, []);

  const handleSendTelegramReport = async () => {
    setIsSendingTelegram(true);
    setTelegramStatus(null);
    const res = await sendAnalyticsToTelegram();
    setTelegramStatus(res.message);
    setIsSendingTelegram(false);
    setTimeout(() => setTelegramStatus(null), 7000);
  };

  if (loading) {
    return (
      <div className="p-12 text-center space-y-4">
        <RefreshCw className="w-8 h-8 text-amber-700 animate-spin mx-auto" />
        <p className="text-xs text-stone-500 font-mono">
          {isFa ? 'در حال بارگذاری آمار بازدیدها و تحلیل قیف فروش...' : 'Loading visitor analytics...'}
        </p>
      </div>
    );
  }

  const s = summary || {
    totalPageViews: 0,
    todayViews: 0,
    yesterdayViews: 0,
    totalSessions: 0,
    abandonedCheckoutsCount: 0,
    completedOrdersCount: 0,
    abandonmentRate: 0,
    topBrowsers: [],
    topDevices: [],
    topReferrers: [],
    abandonedCartList: [],
    recentEvents: [],
  };

  return (
    <div className="p-4 sm:p-6 space-y-6">
      {/* سربرگ تب آمار */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-stone-200 pb-4">
        <div>
          <h4 className="text-base font-bold text-stone-900 flex items-center gap-2">
            <BarChart3 className="w-5 h-5 text-blue-600" />
            <span>{isFa ? 'داشبورد جامع رفتار بازدیدکنندگان و خریداران' : 'Visitor & Sales Analytics'}</span>
          </h4>
          <p className="text-xs text-stone-500 mt-1">
            {isFa
              ? 'ردیابی خودکار دستگاه‌ها، مرورگرهای Edge و کروم، ورودی از گوگل و اینستاگرام، و گزارش خریدهای رها شده'
              : 'Real-time telemetry, device & browser breakdown, and checkout abandonment tracking.'}
          </p>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={loadData}
            className="px-3 py-2 bg-stone-100 hover:bg-stone-200 text-stone-700 text-xs font-medium rounded-lg transition-colors flex items-center gap-1.5 cursor-pointer"
            title="به‌روزرسانی آمار"
          >
            <RefreshCw className="w-3.5 h-3.5" />
            <span>{isFa ? 'تازه‌سازی' : 'Refresh'}</span>
          </button>

          <button
            onClick={handleSendTelegramReport}
            disabled={isSendingTelegram}
            className="px-3.5 py-2 bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold rounded-lg transition-colors flex items-center gap-1.5 shadow-xs cursor-pointer disabled:opacity-50"
          >
            <Send className="w-3.5 h-3.5" />
            <span>
              {isSendingTelegram
                ? isFa ? 'در حال ارسال...' : 'Sending...'
                : isFa ? 'ارسال گزارش به تلگرام' : 'Send to Telegram'}
            </span>
          </button>
        </div>
      </div>

      {telegramStatus && (
        <div className="p-3 bg-blue-50 border border-blue-200 rounded-xl text-xs text-blue-900 flex items-center gap-2 animate-fade-in">
          <CheckCircle2 className="w-4 h-4 text-blue-600 shrink-0" />
          <span>{telegramStatus}</span>
        </div>
      )}

      {/* ۴ کارت شاخص‌های کلیدی (Top KPIs) */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 sm:gap-4">
        <div className="p-4 bg-white rounded-xl border border-stone-200 shadow-xs space-y-1">
          <div className="flex items-center justify-between text-xs text-stone-500 font-mono">
            <span>{isFa ? 'بازدیدهای امروز' : 'Today'}</span>
            <Calendar className="w-4 h-4 text-emerald-600" />
          </div>
          <div className="text-2xl font-black text-stone-900 font-mono">
            {s.todayViews.toLocaleString()}
          </div>
          <div className="text-[11px] text-stone-400 font-mono">
            {isFa ? `دیروز: ${s.yesterdayViews}` : `Yesterday: ${s.yesterdayViews}`}
          </div>
        </div>

        <div className="p-4 bg-white rounded-xl border border-stone-200 shadow-xs space-y-1">
          <div className="flex items-center justify-between text-xs text-stone-500 font-mono">
            <span>{isFa ? 'کل نشست‌ها' : 'Sessions'}</span>
            <Users className="w-4 h-4 text-blue-600" />
          </div>
          <div className="text-2xl font-black text-stone-900 font-mono">
            {s.totalSessions.toLocaleString()}
          </div>
          <div className="text-[11px] text-stone-400 font-mono">
            {isFa ? `کل صفحات: ${s.totalPageViews}` : `Total Views: ${s.totalPageViews}`}
          </div>
        </div>

        <div className="p-4 bg-white rounded-xl border border-stone-200 shadow-xs space-y-1">
          <div className="flex items-center justify-between text-xs text-stone-500 font-mono">
            <span>{isFa ? 'سفارشات قطعی' : 'Orders'}</span>
            <ShoppingCart className="w-4 h-4 text-emerald-600" />
          </div>
          <div className="text-2xl font-black text-emerald-700 font-mono">
            {s.completedOrdersCount}
          </div>
          <div className="text-[11px] text-stone-500">
            {isFa ? 'ثبت‌شده در تلگرام' : 'Recorded in Telegram'}
          </div>
        </div>

        <div className="p-4 bg-white rounded-xl border border-amber-200/80 bg-amber-50/30 shadow-xs space-y-1">
          <div className="flex items-center justify-between text-xs text-amber-800 font-mono">
            <span>{isFa ? 'خریدهای رها شده' : 'Abandoned'}</span>
            <AlertTriangle className="w-4 h-4 text-amber-600" />
          </div>
          <div className="text-2xl font-black text-amber-700 font-mono">
            {s.abandonedCheckoutsCount}
          </div>
          <div className="text-[11px] text-amber-900 font-medium font-mono">
            {isFa ? `نرخ رها کردن: ${s.abandonmentRate}%` : `Abandon Rate: ${s.abandonmentRate}%`}
          </div>
        </div>
      </div>

      {/* بخش تحلیل رفتار و سبدهای رها شده در نیمه‌راه */}
      <div className="p-5 bg-white rounded-2xl border border-stone-200 space-y-4">
        <div className="flex items-center justify-between border-b border-stone-100 pb-3">
          <div className="flex items-center gap-2">
            <ShieldAlert className="w-4 h-4 text-amber-600" />
            <h5 className="text-xs sm:text-sm font-bold text-stone-900">
              {isFa
                ? 'فهرست خریدارانی که تا درگاه/پنجره قیمت پیش رفتند اما خرید را رها کردند'
                : 'Abandoned Checkout Log (High-Intent Visitors)'}
            </h5>
          </div>
          <span className="text-xs font-mono text-stone-500">
            {s.abandonedCartList.length} {isFa ? 'مورد اخیر' : 'recent'}
          </span>
        </div>

        {s.abandonedCartList.length === 0 ? (
          <div className="py-6 text-center text-xs text-stone-400 font-mono">
            {isFa ? 'هنوز سبد خرید یا فاکتور رهاشده‌ای ثبت نشده است.' : 'No abandoned checkouts recorded.'}
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-xs text-right">
              <thead>
                <tr className="border-b border-stone-200 text-stone-500 font-medium">
                  <th className="pb-2 pr-2">{isFa ? 'نام اثر مشاهده‌شده' : 'Artwork'}</th>
                  <th className="pb-2">{isFa ? 'قیمت' : 'Price'}</th>
                  <th className="pb-2">{isFa ? 'مرورگر و دستگاه' : 'Browser & Device'}</th>
                  <th className="pb-2">{isFa ? 'منبع ورود' : 'Referrer'}</th>
                  <th className="pb-2 pl-2">{isFa ? 'زمان' : 'Timestamp'}</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-stone-100">
                {s.abandonedCartList.map((item, idx) => (
                  <tr key={idx} className="hover:bg-amber-50/40 transition-colors">
                    <td className="py-2.5 pr-2 font-bold text-stone-900">{item.photoTitle}</td>
                    <td className="py-2.5 font-mono text-amber-800">
                      {item.priceToman ? `${item.priceToman.toLocaleString()} ت` : '—'}
                    </td>
                    <td className="py-2.5 text-stone-600 font-mono">
                      {item.browser || 'نامشخص'} · {item.device || 'دستگاه'}
                    </td>
                    <td className="py-2.5 text-stone-500">{item.referrer || 'ورود مستقیم'}</td>
                    <td className="py-2.5 pl-2 text-stone-400 font-mono text-[11px]">
                      {item.persianDate || item.timestamp}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* تفکیک مرورگرها، دستگاه‌ها و ورودی‌ها */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {/* ۱. مرورگرها (تشخیص دقیق Edge، کروم، سافاری) */}
        <div className="p-4 bg-white rounded-xl border border-stone-200 space-y-3">
          <div className="flex items-center gap-1.5 text-xs font-bold text-stone-800">
            <Monitor className="w-4 h-4 text-blue-600" />
            <span>{isFa ? 'مرورگرهای کاربران:' : 'Browsers:'}</span>
          </div>

          <div className="space-y-2">
            {s.topBrowsers.length === 0 ? (
              <div className="text-stone-400 text-xs">{isFa ? 'داده‌ای ثبت نشده' : 'No data'}</div>
            ) : (
              s.topBrowsers.map((b, i) => (
                <div key={i} className="space-y-1">
                  <div className="flex justify-between text-xs text-stone-700">
                    <span className="font-medium">{b.name}</span>
                    <span className="font-mono text-stone-500">{b.count} ({b.percent}%)</span>
                  </div>
                  <div className="w-full h-1.5 bg-stone-100 rounded-full overflow-hidden">
                    <div
                      className={`h-full rounded-full ${
                        b.name.includes('Edge')
                          ? 'bg-blue-600'
                          : b.name.includes('Chrome')
                          ? 'bg-amber-600'
                          : 'bg-stone-500'
                      }`}
                      style={{ width: `${b.percent}%` }}
                    />
                  </div>
                </div>
              ))
            )}
          </div>
        </div>

        {/* ۲. نوع دستگاه‌ها (موبایل در برابر دسکتاپ) */}
        <div className="p-4 bg-white rounded-xl border border-stone-200 space-y-3">
          <div className="flex items-center gap-1.5 text-xs font-bold text-stone-800">
            <Smartphone className="w-4 h-4 text-emerald-600" />
            <span>{isFa ? 'دستگاه‌ها (موبایل و لپ‌تاپ):' : 'Devices:'}</span>
          </div>

          <div className="space-y-2">
            {s.topDevices.length === 0 ? (
              <div className="text-stone-400 text-xs">{isFa ? 'داده‌ای ثبت نشده' : 'No data'}</div>
            ) : (
              s.topDevices.map((d, i) => (
                <div key={i} className="space-y-1">
                  <div className="flex justify-between text-xs text-stone-700">
                    <span className="font-medium">{d.name}</span>
                    <span className="font-mono text-stone-500">{d.count} ({d.percent}%)</span>
                  </div>
                  <div className="w-full h-1.5 bg-stone-100 rounded-full overflow-hidden">
                    <div
                      className="h-full bg-emerald-600 rounded-full"
                      style={{ width: `${d.percent}%` }}
                    />
                  </div>
                </div>
              ))
            )}
          </div>
        </div>

        {/* ۳. منابع ترافیک و ارجاع‌دهندگان (گوگل، اینستاگرام، تلگرام) */}
        <div className="p-4 bg-white rounded-xl border border-stone-200 space-y-3">
          <div className="flex items-center gap-1.5 text-xs font-bold text-stone-800">
            <Globe className="w-4 h-4 text-purple-600" />
            <span>{isFa ? 'منابع ورودی (گوگل، اینستاگرام):' : 'Traffic Sources:'}</span>
          </div>

          <div className="space-y-2">
            {s.topReferrers.length === 0 ? (
              <div className="text-stone-400 text-xs">{isFa ? 'داده‌ای ثبت نشده' : 'No data'}</div>
            ) : (
              s.topReferrers.map((r, i) => (
                <div key={i} className="space-y-1">
                  <div className="flex justify-between text-xs text-stone-700 truncate">
                    <span className="font-medium truncate">{r.name}</span>
                    <span className="font-mono text-stone-500 shrink-0">{r.count} ({r.percent}%)</span>
                  </div>
                  <div className="w-full h-1.5 bg-stone-100 rounded-full overflow-hidden">
                    <div
                      className="h-full bg-purple-600 rounded-full"
                      style={{ width: `${r.percent}%` }}
                    />
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      </div>

      {/* آخرین رویدادهای زنده کاربران (Live Visitor Event Stream) */}
      <div className="p-5 bg-white rounded-2xl border border-stone-200 space-y-3">
        <div className="flex items-center justify-between border-b border-stone-100 pb-2">
          <h5 className="text-xs font-bold text-stone-900 flex items-center gap-2">
            <Clock className="w-4 h-4 text-stone-500" />
            <span>{isFa ? 'جریان زنده آخرین فعالیت‌های کاربران در سایت' : 'Recent Activity Stream'}</span>
          </h5>
          <span className="text-[11px] font-mono text-stone-400">
            {s.recentEvents.length} {isFa ? 'رویداد اخیر' : 'events'}
          </span>
        </div>

        <div className="max-h-64 overflow-y-auto divide-y divide-stone-100 text-xs">
          {s.recentEvents.map((ev, idx) => (
            <div key={idx} className="py-2 flex items-center justify-between gap-4">
              <div className="flex items-center gap-2">
                <span
                  className={`w-2 h-2 rounded-full ${
                    ev.eventType === 'complete_order'
                      ? 'bg-emerald-500'
                      : ev.eventType === 'abandon_checkout'
                      ? 'bg-amber-500'
                      : ev.eventType === 'open_buy_modal'
                      ? 'bg-blue-500'
                      : 'bg-stone-300'
                  }`}
                />
                <span className="font-bold text-stone-800">
                  {ev.eventType === 'page_view'
                    ? isFa ? 'مشاهده صفحه' : 'Page View'
                    : ev.eventType === 'photo_view'
                    ? isFa ? `مشاهده اثر: ${ev.photoTitle || ''}` : `Viewed: ${ev.photoTitle || ''}`
                    : ev.eventType === 'open_buy_modal'
                    ? isFa ? `باز کردن پنجره خرید: ${ev.photoTitle || ''}` : `Opened Buy Modal: ${ev.photoTitle || ''}`
                    : ev.eventType === 'abandon_checkout'
                    ? isFa ? `رها کردن خرید: ${ev.photoTitle || ''}` : `Abandoned Cart: ${ev.photoTitle || ''}`
                    : ev.eventType === 'complete_order'
                    ? isFa ? `ثبت قطعی سفارش: ${ev.photoTitle || ''}` : `Order Placed: ${ev.photoTitle || ''}`
                    : ev.eventType}
                </span>
                <span className="text-[11px] text-stone-400 font-mono hidden sm:inline">
                  ({ev.browser || 'مرورگر'} · {ev.device || 'دستگاه'})
                </span>
              </div>
              <span className="text-[11px] text-stone-400 font-mono shrink-0">
                {ev.persianDate || ev.clientTimestamp}
              </span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};
