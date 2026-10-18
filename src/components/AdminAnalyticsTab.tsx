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
  ShieldAlert,
  CloudUpload,
  Laptop,
  FileText,
  Layers,
  Sparkles,
  Phone,
} from 'lucide-react';
import { AnalyticsSummary } from '../types';
import { fetchAnalyticsSummary, sendAnalyticsToTelegram, syncAnalyticsToGitHub } from '../utils/analytics';

interface AdminAnalyticsTabProps {
  isFa: boolean;
}

export const AdminAnalyticsTab: React.FC<AdminAnalyticsTabProps> = ({ isFa }) => {
  const [summary, setSummary] = useState<AnalyticsSummary | null>(null);
  const [loading, setLoading] = useState(true);
  const [telegramStatus, setTelegramStatus] = useState<string | null>(null);
  const [isSendingTelegram, setIsSendingTelegram] = useState(false);
  const [githubSyncStatus, setGithubSyncStatus] = useState<string | null>(null);
  const [isSyncingGithub, setIsSyncingGithub] = useState(false);

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

  const handleSyncToGitHub = async () => {
    setIsSyncingGithub(true);
    setGithubSyncStatus(null);
    const res = await syncAnalyticsToGitHub();
    setGithubSyncStatus(res.message);
    setIsSyncingGithub(false);
    setTimeout(() => setGithubSyncStatus(null), 8000);
  };

  if (loading) {
    return (
      <div className="p-12 text-center space-y-4">
        <RefreshCw className="w-8 h-8 text-amber-700 animate-spin mx-auto" />
        <p className="text-xs text-stone-500 font-mono">
          {isFa ? 'در حال بارگذاری آمار هوشمند دیوایس‌ها، سفارشات و تحلیل رفتار کاربران...' : 'Loading visitor analytics...'}
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
    topDeviceModels: [],
    topReferrers: [],
    topSections: [],
    completedOrdersList: [],
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
            <span>{isFa ? 'داشبورد جامع رفتار بازدیدکنندگان، دیوایس‌ها و سفارشات' : 'Visitor & Sales Analytics'}</span>
          </h4>
          <p className="text-xs text-stone-500 mt-1">
            {isFa
              ? 'معماری استاتیک Pure Static: تفکیک دقیق مدل‌های iPhone، Mac، اندروید و ویندوز، ردیابی سفارشات و ذخیره امن در گیت‌هاب بدون وابستگی به سرور'
              : 'Pure Static Telemetry: Device model classification, browser inspection, and order fulfillment.'}
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          <button
            type="button"
            onClick={loadData}
            className="px-3 py-2 bg-stone-100 hover:bg-stone-200 text-stone-700 text-xs font-medium rounded-lg transition-colors flex items-center gap-1.5 cursor-pointer shadow-2xs"
            title="به‌روزرسانی آمار"
          >
            <RefreshCw className="w-3.5 h-3.5" />
            <span>{isFa ? 'تازه‌سازی' : 'Refresh'}</span>
          </button>

          <button
            type="button"
            onClick={handleSyncToGitHub}
            disabled={isSyncingGithub}
            className="px-3.5 py-2 bg-stone-900 hover:bg-stone-800 disabled:bg-stone-500 text-white text-xs font-bold rounded-lg transition-colors flex items-center gap-1.5 shadow-xs cursor-pointer"
            title="کامیت لاگ‌های آمار در گیت‌هاب"
          >
            <CloudUpload className="w-3.5 h-3.5 text-emerald-400" />
            <span>
              {isSyncingGithub
                ? isFa ? 'در حال کامیت...' : 'Syncing...'
                : isFa ? 'ثبت لاگ‌ها در گیت‌هاب' : 'Commit to GitHub'}
            </span>
          </button>

          <button
            type="button"
            onClick={handleSendTelegramReport}
            disabled={isSendingTelegram}
            className="px-3.5 py-2 bg-blue-600 hover:bg-blue-700 disabled:bg-blue-400 text-white text-xs font-bold rounded-lg transition-colors flex items-center gap-1.5 shadow-xs cursor-pointer"
          >
            <Send className="w-3.5 h-3.5" />
            <span>
              {isSendingTelegram
                ? isFa ? 'در حال ارسال...' : 'Sending...'
                : isFa ? 'ارسال به تلگرام' : 'Send to Telegram'}
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

      {githubSyncStatus && (
        <div className="p-3 bg-emerald-50 border border-emerald-200 rounded-xl text-xs text-emerald-900 flex items-center gap-2 animate-fade-in">
          <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
          <span>{githubSyncStatus}</span>
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
            <span>{isFa ? 'سفارشات و استعلام‌ها' : 'Orders & Inquiries'}</span>
            <ShoppingCart className="w-4 h-4 text-emerald-600" />
          </div>
          <div className="text-2xl font-black text-emerald-700 font-mono">
            {s.completedOrdersCount}
          </div>
          <div className="text-[11px] text-stone-500">
            {isFa ? 'ثبت در گاوصندوق و تلگرام' : 'Recorded in Telegram'}
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

      {/* ۱. جدول جامع سفارشات و استعلام‌های ثبت‌شده (Orders & Commissions) */}
      <div className="p-5 bg-white rounded-2xl border border-stone-200 space-y-4 shadow-xs">
        <div className="flex items-center justify-between border-b border-stone-100 pb-3">
          <div className="flex items-center gap-2">
            <ShoppingCart className="w-4 h-4 text-emerald-600" />
            <h5 className="text-xs sm:text-sm font-bold text-stone-900">
              {isFa ? 'سفارشات قطعی چاپ و استعلام پروژه‌های تولید' : 'Recorded Orders & Production Commissions'}
            </h5>
          </div>
          <span className="text-xs font-mono bg-emerald-50 text-emerald-800 px-2.5 py-0.5 rounded-full font-bold border border-emerald-200">
            {s.completedOrdersList.length} {isFa ? 'مورد' : 'records'}
          </span>
        </div>

        {s.completedOrdersList.length === 0 ? (
          <div className="py-6 text-center text-xs text-stone-400 font-mono">
            {isFa ? 'هنوز سفارشی ثبت نشده است.' : 'No orders recorded yet.'}
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-xs text-right">
              <thead>
                <tr className="border-b border-stone-200 text-stone-500 font-medium">
                  <th className="pb-2.5 pr-2">{isFa ? 'عنوان سفارش / خدمت' : 'Item / Service'}</th>
                  <th className="pb-2.5">{isFa ? 'نوع' : 'Type'}</th>
                  <th className="pb-2.5">{isFa ? 'مشتری و تماس' : 'Client & Contact'}</th>
                  <th className="pb-2.5">{isFa ? 'مبلغ برآورد' : 'Price'}</th>
                  <th className="pb-2.5">{isFa ? 'دیوایس و مرورگر' : 'Device & Browser'}</th>
                  <th className="pb-2.5 pl-2">{isFa ? 'زمان' : 'Date'}</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-stone-100">
                {s.completedOrdersList.map((item, idx) => (
                  <tr key={idx} className="hover:bg-emerald-50/30 transition-colors">
                    <td className="py-3 pr-2">
                      <div className="font-bold text-stone-900">{item.title}</div>
                      {item.details && (
                        <div className="text-[11px] text-stone-500 truncate max-w-xs">{item.details}</div>
                      )}
                    </td>
                    <td className="py-3">
                      <span className={`inline-block px-2 py-0.5 rounded-full text-[10px] font-bold ${
                        item.type === 'print_shop'
                          ? 'bg-amber-100 text-amber-800 border border-amber-200'
                          : 'bg-blue-100 text-blue-800 border border-blue-200'
                      }`}>
                        {item.type === 'print_shop'
                          ? isFa ? 'سفارش چاپ' : 'Print Shop'
                          : isFa ? 'خدمت تولید' : 'Commission'}
                      </span>
                    </td>
                    <td className="py-3">
                      <div className="font-medium text-stone-800">{item.clientName || 'مشتری'}</div>
                      {item.contact && (
                        <div className="text-[11px] text-stone-500 font-mono">{item.contact}</div>
                      )}
                    </td>
                    <td className="py-3 font-mono text-emerald-800 font-bold">
                      {item.priceToman ? `${item.priceToman.toLocaleString()} تومان` : 'استعلامی'}
                    </td>
                    <td className="py-3 text-stone-600 font-mono text-[11px]">
                      {item.device || item.browser || 'نامشخص'}
                    </td>
                    <td className="py-3 pl-2 text-stone-400 font-mono text-[11px]">
                      {item.persianDate || item.timestamp}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* ۲. تفکیک مدل‌های دقیق دستگاه‌ها و مرورگرها */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {/* تفکیک مدل دیوایس‌ها (iPhone, iPad, Mac, Windows, Android) */}
        <div className="p-5 bg-white rounded-xl border border-stone-200 space-y-3.5 shadow-xs">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2 text-xs font-bold text-stone-900">
              <Smartphone className="w-4 h-4 text-emerald-600" />
              <span>{isFa ? 'مدل دقیق دستگاه‌های بازدیدکنندگان:' : 'Device Models Breakdown:'}</span>
            </div>
            <span className="text-[11px] font-mono text-stone-400">
              {isFa ? 'تشخیص بومی User-Agent' : 'Native UA Parser'}
            </span>
          </div>

          <div className="space-y-2.5 pt-1">
            {s.topDeviceModels.length === 0 ? (
              <div className="text-stone-400 text-xs">{isFa ? 'داده‌ای ثبت نشده' : 'No data'}</div>
            ) : (
              s.topDeviceModels.map((d, i) => (
                <div key={i} className="space-y-1">
                  <div className="flex justify-between text-xs text-stone-700">
                    <span className="font-bold flex items-center gap-1.5">
                      {d.name === 'iPhone' ? (
                        <Smartphone className="w-3.5 h-3.5 text-stone-800" />
                      ) : d.name === 'iPad' ? (
                        <TabletIcon className="w-3.5 h-3.5 text-blue-700" />
                      ) : d.name === 'Mac' ? (
                        <Laptop className="w-3.5 h-3.5 text-stone-700" />
                      ) : d.name === 'Windows PC' ? (
                        <Monitor className="w-3.5 h-3.5 text-sky-600" />
                      ) : (
                        <Smartphone className="w-3.5 h-3.5 text-emerald-600" />
                      )}
                      <span>{d.name}</span>
                    </span>
                    <span className="font-mono text-stone-500 font-medium">
                      {d.count.toLocaleString()} ({d.percent}%)
                    </span>
                  </div>
                  <div className="w-full h-2 bg-stone-100 rounded-full overflow-hidden">
                    <div
                      className={`h-full rounded-full transition-all duration-500 ${
                        d.name === 'iPhone'
                          ? 'bg-stone-900'
                          : d.name === 'Mac'
                          ? 'bg-blue-600'
                          : d.name === 'Windows PC'
                          ? 'bg-sky-500'
                          : d.name === 'iPad'
                          ? 'bg-purple-600'
                          : 'bg-emerald-600'
                      }`}
                      style={{ width: `${d.percent}%` }}
                    />
                  </div>
                </div>
              ))
            )}
          </div>
        </div>

        {/* تفکیک مرورگرها (Safari, Chrome, Firefox, Telegram, Instagram) */}
        <div className="p-5 bg-white rounded-xl border border-stone-200 space-y-3.5 shadow-xs">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2 text-xs font-bold text-stone-900">
              <Globe className="w-4 h-4 text-blue-600" />
              <span>{isFa ? 'مرورگرها (شامل مرورگرهای درون‌برنامه‌ای):' : 'Browsers Breakdown:'}</span>
            </div>
            <span className="text-[11px] font-mono text-stone-400">
              {isFa ? 'تشخیص In-App تلگرام/اینستا' : 'In-App Detection'}
            </span>
          </div>

          <div className="space-y-2.5 pt-1">
            {s.topBrowsers.length === 0 ? (
              <div className="text-stone-400 text-xs">{isFa ? 'داده‌ای ثبت نشده' : 'No data'}</div>
            ) : (
              s.topBrowsers.map((b, i) => (
                <div key={i} className="space-y-1">
                  <div className="flex justify-between text-xs text-stone-700">
                    <span className="font-bold flex items-center gap-1.5">
                      <span className={`w-2 h-2 rounded-full ${
                        b.name.includes('Instagram')
                          ? 'bg-pink-500'
                          : b.name.includes('Telegram')
                          ? 'bg-sky-500'
                          : b.name.includes('Safari')
                          ? 'bg-blue-600'
                          : b.name.includes('Chrome')
                          ? 'bg-amber-500'
                          : 'bg-stone-600'
                      }`} />
                      <span>{b.name}</span>
                    </span>
                    <span className="font-mono text-stone-500 font-medium">
                      {dPercent(b.count, b.percent)}
                    </span>
                  </div>
                  <div className="w-full h-2 bg-stone-100 rounded-full overflow-hidden">
                    <div
                      className={`h-full rounded-full transition-all duration-500 ${
                        b.name.includes('Instagram')
                          ? 'bg-pink-500'
                          : b.name.includes('Telegram')
                          ? 'bg-sky-500'
                          : b.name.includes('Safari')
                          ? 'bg-blue-600'
                          : b.name.includes('Chrome')
                          ? 'bg-amber-500'
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
      </div>

      {/* ۳. آمار بازدید بخش‌های مختلف وب‌سایت و منابع ترافیک */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {/* آمار بازدید بخش‌ها */}
        <div className="p-5 bg-white rounded-xl border border-stone-200 space-y-3.5 shadow-xs">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2 text-xs font-bold text-stone-900">
              <Layers className="w-4 h-4 text-purple-600" />
              <span>{isFa ? 'آمار بازدید بخش‌های مختلف وب‌سایت:' : 'Section Interactions:'}</span>
            </div>
            <span className="text-[11px] font-mono text-stone-400">
              {isFa ? 'ردیابی اسکرول و کلیک' : 'Click & View tracking'}
            </span>
          </div>

          <div className="space-y-2.5 pt-1">
            {s.topSections.map((sec, i) => (
              <div key={i} className="space-y-1">
                <div className="flex justify-between text-xs text-stone-700">
                  <span className="font-medium text-stone-900">{sec.name}</span>
                  <span className="font-mono text-stone-500 font-bold">{sec.count} تعامل</span>
                </div>
                <div className="w-full h-1.5 bg-stone-100 rounded-full overflow-hidden">
                  <div
                    className="h-full bg-purple-600 rounded-full"
                    style={{ width: `${Math.min(100, (sec.count / (s.topSections[0]?.count || 1)) * 100)}%` }}
                  />
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* منابع ترافیک ورودی */}
        <div className="p-5 bg-white rounded-xl border border-stone-200 space-y-3.5 shadow-xs">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2 text-xs font-bold text-stone-900">
              <Globe className="w-4 h-4 text-amber-700" />
              <span>{isFa ? 'منابع ترافیک ورودی (Referrers):' : 'Traffic Sources:'}</span>
            </div>
            <span className="text-[11px] font-mono text-stone-400">
              {isFa ? 'ارجاع‌دهنده‌های واقعی' : 'HTTP Referrers'}
            </span>
          </div>

          <div className="space-y-2.5 pt-1">
            {s.topReferrers.map((r, i) => (
              <div key={i} className="space-y-1">
                <div className="flex justify-between text-xs text-stone-700 truncate">
                  <span className="font-medium truncate text-stone-900">{r.name}</span>
                  <span className="font-mono text-stone-500 font-bold shrink-0">{r.count} ({r.percent}%)</span>
                </div>
                <div className="w-full h-1.5 bg-stone-100 rounded-full overflow-hidden">
                  <div
                    className="h-full bg-amber-600 rounded-full"
                    style={{ width: `${r.percent}%` }}
                  />
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* ۴. فهرست سبدهای خرید رها شده */}
      <div className="p-5 bg-white rounded-2xl border border-stone-200 space-y-4 shadow-xs">
        <div className="flex items-center justify-between border-b border-stone-100 pb-3">
          <div className="flex items-center gap-2">
            <ShieldAlert className="w-4 h-4 text-amber-600" />
            <h5 className="text-xs sm:text-sm font-bold text-stone-900">
              {isFa
                ? 'فهرست خریدارانی که تا درگاه/پنجره قیمت پیش رفتند اما خرید را نهایی نکردند'
                : 'Abandoned Checkout Log (High-Intent Visitors)'}
            </h5>
          </div>
          <span className="text-xs font-mono text-stone-500 font-bold">
            {s.abandonedCartList.length} {isFa ? 'مورد' : 'records'}
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
                  <th className="pb-2.5 pr-2">{isFa ? 'نام اثر مشاهده‌شده' : 'Artwork'}</th>
                  <th className="pb-2.5">{isFa ? 'قیمت' : 'Price'}</th>
                  <th className="pb-2.5">{isFa ? 'مرورگر و دستگاه' : 'Browser & Device'}</th>
                  <th className="pb-2.5">{isFa ? 'منبع ورود' : 'Referrer'}</th>
                  <th className="pb-2.5 pl-2">{isFa ? 'زمان' : 'Timestamp'}</th>
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

      {/* ۵. آخرین فعالیت‌های زنده کاربران در سایت */}
      <div className="p-5 bg-white rounded-2xl border border-stone-200 space-y-3 shadow-xs">
        <div className="flex items-center justify-between border-b border-stone-100 pb-2">
          <h5 className="text-xs font-bold text-stone-900 flex items-center gap-2">
            <Clock className="w-4 h-4 text-stone-500" />
            <span>{isFa ? 'جریان زنده آخرین فعالیت‌های کاربران در سایت' : 'Recent Activity Stream'}</span>
          </h5>
          <span className="text-[11px] font-mono text-stone-400 font-bold">
            {s.recentEvents.length} {isFa ? 'رویداد اخیر' : 'events'}
          </span>
        </div>

        <div className="max-h-64 overflow-y-auto divide-y divide-stone-100 text-xs">
          {s.recentEvents.map((ev, idx) => (
            <div key={idx} className="py-2.5 flex items-center justify-between gap-4">
              <div className="flex items-center gap-2">
                <span
                  className={`w-2 h-2 rounded-full shrink-0 ${
                    ev.eventType === 'complete_order'
                      ? 'bg-emerald-500 animate-pulse'
                      : ev.eventType === 'service_inquiry'
                      ? 'bg-blue-500'
                      : ev.eventType === 'abandon_checkout'
                      ? 'bg-amber-500'
                      : ev.eventType === 'open_buy_modal'
                      ? 'bg-indigo-500'
                      : 'bg-stone-300'
                  }`}
                />
                <span className="font-bold text-stone-800">
                  {ev.eventType === 'page_view'
                    ? isFa ? 'مشاهده صفحه اصلی' : 'Page View'
                    : ev.eventType === 'photo_view'
                    ? isFa ? `مشاهده اثر: ${ev.photoTitle || ''}` : `Viewed: ${ev.photoTitle || ''}`
                    : ev.eventType === 'open_buy_modal'
                    ? isFa ? `باز کردن پنجره خرید: ${ev.photoTitle || ''}` : `Opened Buy Modal: ${ev.photoTitle || ''}`
                    : ev.eventType === 'abandon_checkout'
                    ? isFa ? `رها کردن سبد خرید: ${ev.photoTitle || ''}` : `Abandoned Cart: ${ev.photoTitle || ''}`
                    : ev.eventType === 'complete_order'
                    ? isFa ? `ثبت قطعی سفارش: ${ev.photoTitle || ''}` : `Order Placed: ${ev.photoTitle || ''}`
                    : ev.eventType === 'service_inquiry'
                    ? isFa ? `استعلام خدمت پروژه: ${ev.serviceType || ''}` : `Service Inquiry: ${ev.serviceType || ''}`
                    : ev.eventType}
                </span>
                <span className="text-[11px] text-stone-400 font-mono hidden sm:inline">
                  ({ev.deviceModel || ev.device || 'دستگاه'} · {ev.browser || 'مرورگر'})
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

function dPercent(count: number, percent: number) {
  return `${count.toLocaleString()} (${percent}%)`;
}

function TabletIcon(props: React.SVGProps<SVGSVGElement>) {
  return (
    <svg
      {...props}
      xmlns="http://www.w3.org/2000/svg"
      width="24"
      height="24"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <rect width="16" height="20" x="4" y="2" rx="2" ry="2" />
      <line x1="12" x2="12.01" y1="18" y2="18" />
    </svg>
  );
}
