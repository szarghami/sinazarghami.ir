// =====================================================================
// کامپوننت بخش هیرو (Hero Section) - صفحه اصلی وب‌سایت سینا ضرغامی
// راهنما: این بخش شامل تیتر بزرگ، معرفی، سوییچر چندبعدی و نوار آمار ۴تایی است.
// متن‌ها به صورت پویا از profile لود می‌شوند و از داخل پنل مدیریت قابل ویرایش هستند.
// =====================================================================

import React, { useEffect, useState } from 'react';
import { Language, PhotoItem, SiteContent } from '../types';
import {
  Camera,
  Compass,
  Code2,
  GraduationCap,
  ArrowDown,
  Sparkles,
  Phone,
  ChevronLeft,
  ChevronRight,
  Maximize2,
} from 'lucide-react';
import { getPostCoverUrl, getReliableImageUrl } from '../utils/media';
import { PhotoLightbox } from './PhotoLightbox';

interface HeroProps {
  content: SiteContent;
  language: Language;
  onOpenPrints: () => void;
  onOpenExpeditions: () => void;
  onNavigate?: (path: string) => void;
  onSelectPrint?: (photo: PhotoItem) => void;
}

export const Hero: React.FC<HeroProps> = ({
  content,
  language,
  onOpenPrints,
  onOpenExpeditions,
  onNavigate,
  onSelectPrint,
}) => {
  const isFa = language === 'fa';
  const { profile } = content;

  // تب فعال در انتخاب حوزه‌های فعالیت
  const [activeFacet, setActiveFacet] = useState<'all' | 'photo' | 'expeditions' | 'code' | 'educator'>('all');
  const [slideIndex, setSlideIndex] = useState(0);
  const [lightboxPhoto, setLightboxPhoto] = useState<PhotoItem | null>(null);
  const choices = content.homeSlides || [];
  const slides = [
    ...content.photos.map((item) => ({ id: item.id, collection: 'photos', facet: item.portfolioScope === 'travel' ? 'expeditions' : 'photo', image: getPostCoverUrl(item), titleFa: item.titleFa, titleEn: item.titleEn, legacy: !!item.showOnHome, photo: item })),
    ...content.expeditions.map((item) => ({ id: item.id, collection: 'expeditions', facet: 'expeditions', image: item.coverImage, titleFa: item.titleFa, titleEn: item.titleEn, legacy: false, photo: undefined as PhotoItem | undefined })),
    ...(content.articles || []).filter((item) => item.isPublished).map((item) => ({ id: item.id, collection: 'articles', facet: 'educator', image: item.coverImage || item.coverUrl, titleFa: item.titleFa, titleEn: item.titleEn, legacy: false, photo: undefined as PhotoItem | undefined })),
    ...content.books.map((item) => ({ id: item.id, collection: 'books', facet: 'educator', image: item.coverImage, titleFa: item.titleFa, titleEn: item.titleEn, legacy: false, photo: undefined as PhotoItem | undefined })),
    ...content.software.map((item) => ({ id: item.id, collection: 'software', facet: 'code', image: item.coverImage || '', titleFa: item.title, titleEn: item.title, legacy: false, photo: undefined as PhotoItem | undefined })),
  ].filter((item) => {
    const choice = choices.find((entry) => entry.collection === item.collection && entry.id === item.id);
    return !!item.image && (activeFacet === 'all' ? (choice?.general ?? item.legacy) : item.facet === activeFacet && (choice?.facet ?? item.legacy));
  });
  useEffect(() => { setSlideIndex(0); }, [activeFacet]);
  useEffect(() => {
    if (slides.length < 2 || lightboxPhoto || window.matchMedia('(prefers-reduced-motion: reduce)').matches) return;
    const timer = window.setInterval(() => setSlideIndex((index) => (index + 1) % slides.length), 3000);
    return () => window.clearInterval(timer);
  }, [slides.length, activeFacet, lightboxPhoto]);
  const currentSlide = slides[slideIndex % slides.length];

  const stepSlide = (direction: 1 | -1) => {
    if (slides.length < 2) return;
    setSlideIndex((index) => (index + direction + slides.length) % slides.length);
  };

  const openSlide = () => {
    if (!currentSlide) return;
    if (currentSlide.photo) {
      setLightboxPhoto(currentSlide.photo);
      return;
    }
    const target =
      currentSlide.collection === 'expeditions' ? '/trips'
        : currentSlide.collection === 'articles' ? '/articles'
        : currentSlide.collection === 'books' ? '/resume'
        : currentSlide.collection === 'software' ? '/portfolio'
        : '/';
    onNavigate?.(target);
  };

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
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 lg:gap-10 items-center min-h-[calc(100svh-5rem)]">
          {/* ستون متن و تایپوگرافی */}
          <div className="order-last lg:order-first lg:col-span-5 flex flex-col justify-between space-y-8 py-8 lg:py-12">
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
          <div className="order-first lg:order-last lg:col-span-7 relative flex flex-col justify-center">
            <div className="relative group h-[58svh] min-h-[420px] max-h-[760px] rounded-2xl overflow-hidden bg-stone-950 border border-stone-200/80 shadow-xl">
              <div className="absolute inset-0 bg-gradient-to-br from-stone-900 via-stone-800 to-stone-950 flex flex-col items-center justify-center p-6 text-center text-stone-300">
                <Camera className="w-12 h-12 text-amber-500/70 mb-3" />
                <span className="text-sm font-semibold">{isFa ? 'اثری برای این بخش انتخاب نشده است' : 'No featured items in this section'}</span>
              </div>
              {currentSlide && (
                <img
                  key={`${currentSlide.collection}:${currentSlide.id}`}
                  src={getReliableImageUrl(currentSlide.image)}
                  alt={isFa ? currentSlide.titleFa : currentSlide.titleEn}
                  className="relative w-full h-full object-contain transition-opacity duration-700 z-10"
                  loading="eager"
                  fetchPriority="high"
                  decoding="async"
                  referrerPolicy="no-referrer"
                  onError={(e) => {
                    const target = e.currentTarget as HTMLImageElement;
                    target.style.display = 'none';
                  }}
                />
              )}

              {currentSlide && (
                <button
                  type="button"
                  onClick={openSlide}
                  className="absolute inset-0 z-20 cursor-pointer focus:outline-none focus-visible:ring-2 focus-visible:ring-amber-500/70"
                  aria-label={isFa ? 'مشاهده جزئیات اثر' : 'View item details'}
                  title={isFa ? 'مشاهده جزئیات اثر' : 'View item details'}
                />
              )}

              {currentSlide && (
                <span className="pointer-events-none absolute top-4 left-4 z-30 inline-flex items-center gap-1.5 rounded-full bg-stone-950/55 px-3 py-1.5 text-[11px] font-semibold text-white/90 backdrop-blur-sm opacity-70 transition-opacity group-hover:opacity-100">
                  <Maximize2 className="w-3 h-3" />
                  {currentSlide.photo
                    ? (isFa ? 'مشاهده جزئیات عکس' : 'Photo details')
                    : (isFa ? 'مشاهده بخش' : 'Open section')}
                </span>
              )}

              {slides.length > 1 && (
                <>
                  <button
                    type="button"
                    onClick={() => stepSlide(-1)}
                    className="absolute left-3 top-1/2 -translate-y-1/2 z-30 p-2.5 rounded-full bg-stone-950/55 text-white backdrop-blur-sm hover:bg-stone-900/80 transition-colors cursor-pointer"
                    aria-label={isFa ? 'اسلاید قبلی' : 'Previous slide'}
                    title={isFa ? 'اسلاید قبلی' : 'Previous slide'}
                  >
                    <ChevronLeft className="w-5 h-5" />
                  </button>
                  <button
                    type="button"
                    onClick={() => stepSlide(1)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 z-30 p-2.5 rounded-full bg-stone-950/55 text-white backdrop-blur-sm hover:bg-stone-900/80 transition-colors cursor-pointer"
                    aria-label={isFa ? 'اسلاید بعدی' : 'Next slide'}
                    title={isFa ? 'اسلاید بعدی' : 'Next slide'}
                  >
                    <ChevronRight className="w-5 h-5" />
                  </button>
                </>
              )}

              <div className="absolute inset-x-0 bottom-0 h-1/3 bg-gradient-to-t from-stone-950/80 to-transparent pointer-events-none z-10" />

              {currentSlide && (
                <div className="absolute bottom-0 inset-x-0 p-6 text-white space-y-1 z-20 pointer-events-none">
                  <h3 className="text-lg font-semibold tracking-tight text-white">
                    {isFa ? currentSlide.titleFa : currentSlide.titleEn}
                  </h3>
                  {slides.length > 1 && (
                    <div className="flex items-center gap-1.5 pt-1 pointer-events-auto">
                      {slides.map((slide, index) => (
                        <button
                          key={`${slide.collection}:${slide.id}`}
                          type="button"
                          onClick={() => setSlideIndex(index)}
                          className={`h-1.5 rounded-full transition-all cursor-pointer ${
                            index === slideIndex % slides.length
                              ? 'w-6 bg-amber-400'
                              : 'w-1.5 bg-white/50 hover:bg-white/80'
                          }`}
                          aria-label={isFa ? `اسلاید ${index + 1}` : `Slide ${index + 1}`}
                        />
                      ))}
                    </div>
                  )}
                </div>
              )}
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

      {lightboxPhoto && (
        <PhotoLightbox
          photo={lightboxPhoto}
          language={language}
          equipment={content.equipment}
          definedTechniques={content.definedTechniques}
          onClose={() => setLightboxPhoto(null)}
          onSelectPrint={onSelectPrint}
          onNavigate={onNavigate}
        />
      )}
    </section>
  );
};
