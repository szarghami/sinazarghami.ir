import React from 'react';
import { Language } from '../types';
import { Search, Globe, Share2, Gauge, BookOpen, CheckCircle, X, ExternalLink, Lightbulb } from 'lucide-react';

interface SeoDocumentationModalProps {
  language: Language;
  onClose: () => void;
}

export const SeoDocumentationModal: React.FC<SeoDocumentationModalProps> = ({
  language,
  onClose,
}) => {
  const isFa = language === 'fa';

  return (
    <div className="fixed inset-0 z-50 bg-stone-950/80 backdrop-blur-xs flex items-center justify-center p-3 sm:p-6 overflow-y-auto">
      <div className="relative w-full max-w-3xl bg-white rounded-2xl shadow-2xl border border-stone-200 overflow-hidden my-auto max-h-[92vh] flex flex-col">
        {/* Header */}
        <div className="px-6 py-4 border-b border-stone-200 flex items-center justify-between bg-stone-900 text-white">
          <div className="flex items-center gap-2.5">
            <Search className="w-5 h-5 text-amber-400" />
            <div>
              <h3 className="text-sm sm:text-base font-bold">
                {isFa ? 'راهنمای جامع سئو و استراتژی رشد sinazarghami.ir' : 'SEO Architecture & Growth Strategy'}
              </h3>
              <p className="text-[11px] text-stone-400">
                {isFa ? 'مشخصات فنی پیاده‌شده و نقشه راه رتبه ۱ گوگل برای سینا ضرغامی' : 'Technical implementation details & Google ranking roadmap'}
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 text-stone-400 hover:text-white rounded-md cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content */}
        <div className="p-6 sm:p-8 overflow-y-auto space-y-6 text-stone-700 text-xs sm:text-sm leading-relaxed">
          {/* Card 1: What is already implemented */}
          <div className="p-5 bg-amber-50/50 rounded-xl border border-amber-200/80 space-y-3">
            <h4 className="font-bold text-amber-950 flex items-center gap-2 text-sm sm:text-base">
              <CheckCircle className="w-4 h-4 text-amber-700" />
              <span>{isFa ? '۱. بخش‌های پیاده‌سازی‌شده در سئوی فنی (Technical SEO)' : '1. Implemented Technical SEO'}</span>
            </h4>
            <ul className="space-y-2 text-stone-700">
              <li className="flex items-start gap-2">
                <span className="text-amber-800 font-bold">•</span>
                <span>
                  <strong>داده‌های ساختاریافته (Schema.org JSON-LD):</strong> تعریف موجودیت شخص (Person Entity) برای «سینا ضرغامی» شامل عناوین شغلی (عکاس، فیلمبردار، تور لیدر، برنامه‌نویس) و اتصال به شبکه‌های اجتماعی جهت تشکیل Google Knowledge Panel.
                </span>
              </li>
              <li className="flex items-start gap-2">
                <span className="text-amber-800 font-bold">•</span>
                <span>
                  <strong>کارت‌های اشتراک شبکه‌های اجتماعی (OpenGraph & Twitter):</strong> هنگام اشتراک‌گذاری لینک در تلگرام، واتس‌اپ، لینکدین یا توییتر، پوستر و عنوان جذاب رسمی ظاهر می‌شود.
                </span>
              </li>
              <li className="flex items-start gap-2">
                <span className="text-amber-800 font-bold">•</span>
                <span>
                  <strong>تگ‌های Canonical و Alternate:</strong> ثبت آدرس رسمی <code className="bg-stone-200 px-1 py-0.5 rounded font-mono">https://sinazarghami.ir</code> برای جلوگیری از خطای محتوای تکراری.
                </span>
              </li>
            </ul>
          </div>

          {/* Card 2: Speed and Iran accessibility */}
          <div className="p-5 bg-stone-50 rounded-xl border border-stone-200 space-y-3">
            <h4 className="font-bold text-stone-900 flex items-center gap-2 text-sm sm:text-base">
              <Gauge className="w-4 h-4 text-emerald-600" />
              <span>{isFa ? '۲. بهینه‌سازی سرعت و تجربه کاربری در شبکه ایران (Core Web Vitals)' : '2. Iran Latency & Core Web Vitals'}</span>
            </h4>
            <p className="text-xs text-stone-600">
              گوگل سرعت بارگذاری صفحات را یکی از فاکتورهای اصلی رتبه‌بندی می‌داند. در این سایت:
            </p>
            <ul className="space-y-1.5 text-xs text-stone-600">
              <li>• تصاویر به صورت Lazy-load بارگذاری می‌شوند تا حجم اولیه صفحه فوق‌العاده سبک باشد.</li>
              <li>• ماژول فشرده‌ساز در پنل استودیو، تصاویر خام دوربین را مستقیماً به فرمت بهینه WebP تبدیل می‌کند.</li>
              <li>• هیچ اسکریپت مسدودکننده خارجی که در ایران فیلتر یا کند باشد در سایت قرار نگرفته است.</li>
            </ul>
          </div>

          {/* Card 3: Actionable Next Steps for Sina */}
          <div className="p-5 bg-stone-50 rounded-xl border border-stone-200 space-y-3">
            <h4 className="font-bold text-stone-900 flex items-center gap-2 text-sm sm:text-base">
              <Lightbulb className="w-4 h-4 text-amber-600" />
              <span>{isFa ? '۳. کارهای بعدی که برای ثبت و تبلیغات دامنه باید انجام دهید:' : '3. Recommended Next Actions for sinazarghami.ir'}</span>
            </h4>
            <div className="space-y-3 text-xs text-stone-700">
              <div className="p-3 bg-white rounded-lg border border-stone-200">
                <strong>الف) اتصال به سرچ کنسول گوگل (Google Search Console):</strong>
                <p className="text-stone-500 mt-1">
                  پس از اتصال دامنه sinazarghami.ir، سایت را در سرچ کنسول ثبت کنید تا گوگل بلافاصله صفحات را ایندکس کند.
                </p>
              </div>

              <div className="p-3 bg-white rounded-lg border border-stone-200">
                <strong>ب) افزودن مقالات تخصصی سفر و آموزش عکاسی (Content Marketing):</strong>
                <p className="text-stone-500 mt-1">
                  نوشتن مقالاتی مثل «راهنمای سفر به کلوت‌های لوت»، «تنظیمات عکاسی نجومی در کویر» یا «چک‌لیست تجهیزات سفر به هرمز» رتبه یک کلمات کلیدی گوگل را برای شما تضمین می‌کند.
                </p>
              </div>

              <div className="p-3 bg-white rounded-lg border border-stone-200">
                <strong>ج) تبلیغات گوگل ادز و اینستاگرام:</strong>
                <p className="text-stone-500 mt-1">
                  می‌توانید برای کلمات پربازده نظیر «خرید تابلو عکاسی فاین‌آرت»، «تور اختصاصی کویر لوت» و «استخدام فیلمبردار تیزر معماری» کمپین‌های تبلیغاتی با هدایت مستقیم به فرم سفارش سایت فعال کنید.
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="px-6 py-4 bg-stone-50 border-t border-stone-200 flex justify-end">
          <button
            onClick={onClose}
            className="px-5 py-2 bg-stone-900 hover:bg-stone-800 text-white text-xs font-semibold rounded-lg cursor-pointer"
          >
            {isFa ? 'متوجه شدم، بستن پنجره' : 'Understood, Close'}
          </button>
        </div>
      </div>
    </div>
  );
};
