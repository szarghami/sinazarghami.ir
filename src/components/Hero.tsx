// =====================================================================
// کامپوننت بخش هیرو (Hero Section) - صفحه اصلی وب‌سایت سینا ضرغامی
// راهنما: این بخش شامل تیتر بزرگ، معرفی، سوییچر چندبعدی و نوار آمار ۴تایی است.
// متن‌ها به صورت پویا از profile لود می‌شوند و از داخل پنل مدیریت قابل ویرایش هستند.
// =====================================================================

import React, { useState } from 'react';
import { Language, SiteContent } from '../types';
import { Camera, Compass, Code2, GraduationCap, ArrowDown, Sparkles, Phone } from 'lucide-react';
import { getReliableImageUrl } from '../utils/supabase';

interface HeroProps {
  content: SiteContent;
  language: Language;
  onOpenPrints: () => void;
  onOpenExpeditions: () => void;
}

export const Hero: React.FC<HeroProps> = ({
  content,
  language,
  onOpenPrints,
  onOpenExpeditions,
}) => {
  const isFa = language === 'fa';
  const { profile } = content;

  // تب فعال در انتخاب حوزه‌های فعالیت
  const [activeFacet, setActiveFacet] = useState<'all' | 'photo' | 'expeditions' | 'code' | 'educator'>('all');

  const facets = [
    { id: 'all', labelFa: 'همه ابعاد', labelEn: 'Overview' },
    { id: 'photo', labelFa: 'عکاسی و سینما', labelEn: 'Cinematography & Photo', icon: Camera },
    { id: 'expeditions', labelFa: 'اکتشاف و تور لیدر', labelEn: 'Expedition Guiding', icon: Compass },
    { id: 'code', labelFa: 'توسعه نرم‌افزار', labelEn: 'Software Engineering', icon: Code2 },
    { id: 'educator', labelFa: 'آموزش و تالیف', labelEn: 'Education & Mentorship', icon: GraduationCap },
  ];

  return (
    <section className="relative pt-12 pb-16 md:pt-20 md:pb-24 border-b border-stone-200/70 overflow-hidden bg-white">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* چیدمان دو ستونه هیرو (متن در یک ستون و عکس شاخص در ستون دیگر) */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-10 lg:gap-14 items-stretch">
          {/* ستون متن و تایپوگرافی */}
          <div className="lg:col-span-7 flex flex-col justify-between space-y-8">
            <div className="space-y-6">
              {/* نشانگر کوچک بالای تیتر اصلی (Kicker) */}
              <div className="flex items-center gap-3 text-xs tracking-wider uppercase text-stone-500 font-semibold">
                <span className="inline-block w-2 h-2 rounded-full bg-amber-600"></span>
                <span>sinazarghami.ir</span>
                <span aria-hidden="true" className="text-stone-300">/</span>
                <span>{isFa ? (profile.heroKickerFa || 'برند شخصی و آثار برگزیده') : (profile.heroKickerEn || 'Official Portfolio & Studio')}</span>
              </div>

              {/* تیتر بزرگ هیرو - قابل تغییر از پنل مدیریت و فایل initialData.ts */}
              <h1 className="text-3xl sm:text-4xl md:text-5xl lg:text-[3.25rem] font-extrabold text-stone-900 tracking-tight leading-[1.2] text-balance">
                {isFa ? (
                  <>
                    {profile.heroHeadlineMainFa || 'روایت اصیل چشم‌اندازهای ایران،'}{' '}
                    <br className="hidden sm:inline" />
                    <span className="text-amber-800 font-bold">
                      {profile.heroHeadlineHighlightFa || 'هنر دیدن، کاوش در طبیعت'}
                    </span>{' '}
                    {profile.heroHeadlineEndFa || 'و خلق فناوری.'}
                  </>
                ) : (
                  <>
                    {profile.heroHeadlineMainEn || 'Framing Iran’s Raw Landscapes,'}{' '}
                    <br className="hidden sm:inline" />
                    <span className="text-amber-800">
                      {profile.heroHeadlineHighlightEn || 'Visual Cinematography'}
                    </span>{' '}
                    {profile.heroHeadlineEndEn || '& Software Craft.'}
                  </>
                )}
              </h1>

              {/* متن معرفی و خلاصه درباره من */}
              <p className="text-base sm:text-lg text-stone-600 leading-relaxed max-w-2xl">
                {isFa ? profile.aboutFa : profile.aboutEn}
              </p>

              {/* سوییچر تعاملی ابعاد چندگانه برند (عکاس، لیدر، برنامه‌نویس، آموزگار) */}
              <div className="pt-2">
                <p className="text-xs font-semibold text-stone-400 uppercase tracking-wider mb-2.5">
                  {isFa ? 'تمرکز حوزه‌های فعالیت:' : 'Multidisciplinary Dimensions:'}
                </p>
                <div className="flex flex-wrap gap-1.5 p-1 bg-stone-100/90 rounded-lg max-w-fit">
                  {facets.map((facet) => {
                    const Icon = facet.icon;
                    const isActive = activeFacet === facet.id;
                    return (
                      <button
                        key={facet.id}
                        onClick={() => setActiveFacet(facet.id as any)}
                        className={`flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium rounded-md transition-all cursor-pointer whitespace-nowrap ${
                          isActive
                            ? 'bg-white text-stone-900 shadow-xs'
                            : 'text-stone-600 hover:text-stone-900'
                        }`}
                      >
                        {Icon && <Icon className="w-3.5 h-3.5 text-amber-700" />}
                        <span>{isFa ? facet.labelFa : facet.labelEn}</span>
                      </button>
                    );
                  })}
                </div>
              </div>
            </div>

            {/* دکمه‌های اقدام اصلی (CTA) */}
            <div className="flex flex-wrap items-center gap-4 pt-4">
              <a
                href="#photography"
                className="px-6 py-3 text-sm font-semibold text-white bg-stone-950 hover:bg-stone-800 rounded-md transition-all shadow-xs inline-flex items-center gap-2 cursor-pointer"
              >
                <span>{isFa ? 'مشاهده گالری عکس‌ها' : 'Explore Portfolio'}</span>
                <ArrowDown className="w-4 h-4 text-stone-300" />
              </a>

              <button
                onClick={onOpenPrints}
                className="px-6 py-3 text-sm font-semibold text-stone-900 bg-white hover:bg-stone-50 border border-stone-200 rounded-md transition-all shadow-2xs inline-flex items-center gap-2 cursor-pointer"
              >
                <Sparkles className="w-4 h-4 text-amber-600" />
                <span>{isFa ? 'خرید تابلوهای فاین‌آرت' : 'Fine-Art Print Shop'}</span>
              </button>

              <button
                onClick={onOpenExpeditions}
                className="px-5 py-3 text-sm font-medium text-stone-600 hover:text-stone-900 transition-colors inline-flex items-center gap-1.5 cursor-pointer"
              >
                <Compass className="w-4 h-4 text-stone-500" />
                <span>{isFa ? 'تورها و سفرها' : 'Guided Expeditions'}</span>
              </button>

              <a
                href="tel:09127193767"
                className="px-4 py-3 text-sm font-bold text-stone-800 hover:text-amber-800 bg-stone-100/90 hover:bg-stone-200/80 rounded-md transition-colors inline-flex items-center gap-1.5 font-mono cursor-pointer"
                title={isFa ? 'تماس مستقیم با سینا ضرغامی' : 'Call Directly'}
              >
                <Phone className="w-3.5 h-3.5 text-amber-700" />
                <span>09127193767</span>
              </a>
            </div>
          </div>

          {/* ستون قاب تصویر شاخص */}
          <div className="lg:col-span-5 relative flex flex-col justify-center">
            <div className="relative group rounded-2xl overflow-hidden bg-stone-100 border border-stone-200/80 shadow-md">
              <img
                src={getReliableImageUrl(content.photos[0]?.imageUrl || "https://images.unsplash.com/photo-1509316975850-ff9c5deb0cd9?auto=format&fit=crop&w=1200&q=85")}
                alt="Sina Zarghami Photography Showcase"
                className="w-full h-84 sm:h-96 lg:h-[430px] object-cover transition-transform duration-700 group-hover:scale-102"
                loading="eager"
                referrerPolicy="no-referrer"
                onError={(e) => {
                  const target = e.currentTarget as HTMLImageElement;
                  target.style.display = 'none';
                }}
              />
              <div className="absolute inset-0 bg-gradient-to-t from-stone-950/85 via-stone-950/20 to-transparent pointer-events-none" />

              <div className="absolute bottom-0 inset-x-0 p-6 text-white space-y-1">
                <div className="flex items-center justify-between text-xs font-mono text-stone-300">
                  <span>{content.photos[0]?.locationFa || 'LUT DESERT, IRAN'}</span>
                  <span>{content.photos[0]?.camera || 'SONY A7R V'}</span>
                </div>
                <h3 className="text-lg font-semibold tracking-tight text-white">
                  {isFa ? (content.photos[0]?.titleFa || 'کلوت‌های شهداد در غروب آفتاب') : (content.photos[0]?.titleEn || 'Shahdad Kaluts at Twilight')}
                </h3>
                <p className="text-xs text-stone-300 line-clamp-1">
                  {isFa ? 'ثبت‌شده در سفر اکتشافی · اثر سینا ضرغامی' : 'Captured on expedition by Sina Zarghami'}
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* نوار ۴ ستونه شاخص‌های کلیدی زیر هیرو (کاملاً پویا و قابل ویرایش) */}
        <div className="mt-14 pt-10 border-t border-stone-100 grid grid-cols-2 sm:grid-cols-4 gap-6 text-center sm:text-start">
          {(profile.stats || []).map((stat, idx) => (
            <div key={idx} className="space-y-1">
              <div className="text-2xl sm:text-3xl font-extrabold text-stone-900 tabular-nums">
                {isFa ? stat.numberFa : stat.numberEn}
              </div>
              <div className="text-xs font-medium text-stone-500">
                {isFa ? stat.labelFa : stat.labelEn}
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
};
