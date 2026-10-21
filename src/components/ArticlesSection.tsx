import React, { useState, useEffect } from 'react';
import { ArticleItem, DefinedTechnique, EquipmentItem, Language } from '../types';
import {
  BookOpen,
  Clock,
  Search,
  ArrowLeft,
  ArrowRight,
  Sparkles,
  Share2,
  Calendar,
  User,
  Camera,
  Wrench,
  Check,
  ChevronRight,
  ChevronLeft,
} from 'lucide-react';
import { getReliableImageUrl } from '../utils/supabase';

interface ArticlesSectionProps {
  articles?: ArticleItem[];
  language: Language;
  onNavigate?: (path: string) => void;
  slug?: string;
  equipment?: EquipmentItem[];
  techniques?: DefinedTechnique[];
}

export const ArticlesSection: React.FC<ArticlesSectionProps> = ({
  articles = [],
  language,
  onNavigate = () => {},
  slug: initialSlug,
  equipment = [],
  techniques = [],
}) => {
  const isFa = language === 'fa';
  const [selectedCategory, setSelectedCategory] = useState<string>('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [activeSlug, setActiveSlug] = useState<string | null>(initialSlug || null);
  const [copied, setCopied] = useState(false);

  // همگام‌سازی با پارامتر slug از URL
  useEffect(() => {
    if (initialSlug) {
      setActiveSlug(initialSlug);
    } else {
      const params = new URLSearchParams(window.location.search);
      const urlSlug = params.get('slug');
      if (urlSlug) {
        setActiveSlug(urlSlug);
      }
    }
  }, [initialSlug]);

  const activeArticle = activeSlug
    ? articles.find((a) => a.slug === activeSlug || a.id === activeSlug) || null
    : null;

  // دسته‌بندی‌های یکتای مقالات
  const categories: string[] = [
    'all',
    ...Array.from(
      new Set(
        articles
          .map((a) => (isFa ? a.categoryFa || a.category : a.categoryEn || a.category))
          .filter((c): c is string => Boolean(c))
      )
    ),
  ];

  const filteredArticles = articles.filter((art) => {
    const artCat = isFa ? art.categoryFa || art.category : art.categoryEn || art.category;
    const matchCat = selectedCategory === 'all' || artCat === selectedCategory;
    const query = searchQuery.trim().toLowerCase();
    const excerptFa = art.excerptFa || art.summaryFa || '';
    const excerptEn = art.excerptEn || art.summaryEn || '';
    const matchQuery =
      !query ||
      art.titleFa.toLowerCase().includes(query) ||
      art.titleEn.toLowerCase().includes(query) ||
      excerptFa.toLowerCase().includes(query) ||
      excerptEn.toLowerCase().includes(query) ||
      art.tags?.some((t) => t.toLowerCase().includes(query));
    return matchCat && matchQuery;
  });

  const getGearName = (gearId: string): string => {
    const item = equipment.find((e) => e.id === gearId);
    return item ? item.name : gearId;
  };

  const getTechniqueName = (techId: string): string => {
    const tech = techniques.find((t) => t.id === techId);
    if (!tech) return techId;
    return isFa ? tech.nameFa : tech.nameEn;
  };

  const handleOpenArticle = (art: ArticleItem) => {
    setActiveSlug(art.slug);
    onNavigate(`/articles?slug=${encodeURIComponent(art.slug)}`);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const handleBackToList = () => {
    setActiveSlug(null);
    onNavigate('/articles');
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const handleShare = () => {
    navigator.clipboard.writeText(window.location.href);
    setCopied(true);
    setTimeout(() => setCopied(false), 2500);
  };

  // -------------------------------------------------------------
  // نمای مطالعه کامل تک‌مقاله (Single Article View)
  // -------------------------------------------------------------
  if (activeArticle) {
    const title = isFa ? activeArticle.titleFa : activeArticle.titleEn;
    const summary = isFa
      ? activeArticle.summaryFa || activeArticle.excerptFa
      : activeArticle.summaryEn || activeArticle.excerptEn;
    const content = isFa ? activeArticle.contentFa : activeArticle.contentEn;
    const cover = getReliableImageUrl(activeArticle.coverImage || activeArticle.coverUrl);
    const readTime = activeArticle.readTimeMinutes || activeArticle.readingTimeMinutes || 6;
    const category = isFa
      ? activeArticle.categoryFa || activeArticle.category
      : activeArticle.categoryEn || activeArticle.category;

    // اسکیمای رسمی سئو Google BlogPosting JSON-LD
    const jsonLdData = {
      '@context': 'https://schema.org',
      '@type': 'BlogPosting',
      headline: title,
      description: summary,
      image: cover,
      author: {
        '@type': 'Person',
        name: activeArticle.author || (isFa ? 'سینا ضرغامی' : 'Sina Zarghami'),
        url: 'https://sinazarghami.ir',
      },
      publisher: {
        '@type': 'Person',
        name: 'Sina Zarghami',
        url: 'https://sinazarghami.ir',
      },
      datePublished: activeArticle.publishedAt,
      dateModified: activeArticle.publishedAt,
      mainEntityOfPage: {
        '@type': 'WebPage',
        '@id': `https://sinazarghami.ir/articles?slug=${activeArticle.slug}`,
      },
    };

    return (
      <article className="py-20 bg-stone-50 border-b border-stone-200 min-h-screen">
        {/* Google Structured Data Injection */}
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLdData) }}
        />

        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 space-y-8">
          {/* نوار ناوبری مقاله */}
          <div className="flex items-center justify-between">
            <button
              onClick={handleBackToList}
              className="flex items-center gap-1.5 text-xs sm:text-sm font-semibold text-stone-600 hover:text-stone-900 transition-colors cursor-pointer"
            >
              {isFa ? <ArrowRight className="w-4 h-4" /> : <ArrowLeft className="w-4 h-4" />}
              <span>{isFa ? 'بازگشت به فهرست مقالات' : 'Back to Articles List'}</span>
            </button>

            <button
              onClick={handleShare}
              className="flex items-center gap-1.5 text-xs font-semibold text-stone-600 hover:text-stone-900 bg-white border border-stone-200 px-3 py-1.5 rounded-lg transition-colors cursor-pointer shadow-2xs"
            >
              {copied ? <Check className="w-3.5 h-3.5 text-emerald-600" /> : <Share2 className="w-3.5 h-3.5 text-amber-700" />}
              <span>{copied ? (isFa ? 'لینک کپی شد' : 'Link Copied') : (isFa ? 'اشتراک‌گذاری' : 'Share')}</span>
            </button>
          </div>

          {/* سربرگ و تیتر مقاله */}
          <header className="space-y-4">
            <div className="flex flex-wrap items-center gap-2 text-xs font-mono text-stone-500">
              <span className="px-2.5 py-0.5 bg-amber-100/80 text-amber-900 font-bold rounded-md">
                {category}
              </span>
              <span aria-hidden="true">·</span>
              <span className="flex items-center gap-1">
                <Calendar className="w-3 h-3 text-stone-400" />
                <span>{activeArticle.publishedAt}</span>
              </span>
              <span aria-hidden="true">·</span>
              <span className="flex items-center gap-1">
                <Clock className="w-3 h-3 text-amber-700" />
                <span>{readTime} {isFa ? 'دقیقه زمان مطالعه' : 'min read'}</span>
              </span>
              <span aria-hidden="true">·</span>
              <span className="flex items-center gap-1">
                <User className="w-3 h-3 text-stone-400" />
                <span>{activeArticle.author || (isFa ? 'سینا ضرغامی' : 'Sina Zarghami')}</span>
              </span>
            </div>

            <h1 className="text-2xl sm:text-4xl md:text-5xl font-black text-stone-900 tracking-tight leading-snug">
              {title}
            </h1>

            {/* چکیده و خلاصه مقاله */}
            <div className="p-4 sm:p-5 bg-white border-r-4 rtl:border-r-4 ltr:border-l-4 border-amber-600 rounded-xl shadow-2xs text-stone-700 text-sm sm:text-base leading-relaxed italic">
              {summary}
            </div>
          </header>

          {/* تصویر شاخص مقاله */}
          <div className="relative aspect-16/9 rounded-2xl overflow-hidden bg-stone-900 shadow-md">
            <img
              src={cover}
              alt={title}
              className="w-full h-full object-cover"
              referrerPolicy="no-referrer"
            />
          </div>

          {/* متن اصلی مقاله با پاراگراف‌بندی و فرمت‌بندی استاندارد */}
          <div className="bg-white rounded-3xl p-6 sm:p-10 border border-stone-200/90 shadow-2xs space-y-6 text-stone-800 leading-relaxed text-sm sm:text-base">
            {content.split('\n\n').map((paragraph, index) => {
              if (paragraph.startsWith('## ')) {
                return (
                  <h2
                    key={index}
                    className="text-xl sm:text-2xl font-bold text-stone-900 pt-4 border-b border-stone-100 pb-2"
                  >
                    {paragraph.replace('## ', '')}
                  </h2>
                );
              }
              if (paragraph.startsWith('### ')) {
                return (
                  <h3 key={index} className="text-lg font-bold text-stone-900 pt-2">
                    {paragraph.replace('### ', '')}
                  </h3>
                );
              }
              return (
                <p key={index} className="leading-loose text-stone-700">
                  {paragraph}
                </p>
              );
            })}

            {/* تگ‌های موضوعی مقاله */}
            {activeArticle.tags && activeArticle.tags.length > 0 && (
              <div className="pt-6 border-t border-stone-100 flex flex-wrap items-center gap-2">
                <span className="text-xs font-mono text-stone-500 font-bold">
                  {isFa ? 'برچسب‌ها:' : 'Tags:'}
                </span>
                {activeArticle.tags.map((tag, i) => (
                  <span
                    key={i}
                    className="px-2.5 py-1 bg-stone-100 text-stone-700 text-xs rounded-md font-mono"
                  >
                    #{tag}
                  </span>
                ))}
              </div>
            )}
          </div>

          {/* بخش تجهیزات و تکنیک‌های مرتبط (کلیک‌پذیر با اتصال به /filter) */}
          <div className="bg-amber-50/60 border border-amber-200/80 rounded-2xl p-6 sm:p-8 space-y-4">
            <div className="flex items-center gap-2 text-xs font-mono uppercase tracking-wider text-amber-900 font-bold">
              <Sparkles className="w-4 h-4 text-amber-700" />
              <span>{isFa ? 'ابزارها و تکنیک‌های مطرح‌شده در این مقاله' : 'Featured Gear & Techniques'}</span>
            </div>

            <p className="text-xs sm:text-sm text-stone-600">
              {isFa
                ? 'برای مشاهده تمام عکس‌ها، ویدیوها و پروژه‌های اجراشده با این تجهیزات یا تکنیک، روی هر گزینه کلیک کنید:'
                : 'Click any gear or technique below to explore all sample works shot using this setup:'}
            </p>

            <div className="flex flex-wrap items-center gap-2 pt-2">
              {activeArticle.relatedGearIds?.map((gearId) => (
                <button
                  key={gearId}
                  onClick={() => onNavigate(`/filter?type=gear&val=${encodeURIComponent(gearId)}`)}
                  className="px-3 py-1.5 bg-white hover:bg-stone-900 hover:text-white text-stone-800 text-xs font-mono font-semibold rounded-lg border border-stone-200 shadow-2xs transition-colors flex items-center gap-1.5 cursor-pointer"
                >
                  <Camera className="w-3.5 h-3.5 text-amber-700" />
                  <span>{getGearName(gearId)}</span>
                </button>
              ))}

              {activeArticle.relatedTechniques?.map((techId) => (
                <button
                  key={techId}
                  onClick={() => onNavigate(`/filter?type=technique&val=${encodeURIComponent(techId)}`)}
                  className="px-3 py-1.5 bg-amber-600 hover:bg-amber-700 text-white text-xs font-medium rounded-lg shadow-2xs transition-colors flex items-center gap-1.5 cursor-pointer"
                >
                  <Wrench className="w-3.5 h-3.5" />
                  <span>{getTechniqueName(techId)}</span>
                </button>
              ))}
            </div>
          </div>

          {/* جعبه گفتگو یا سفارش پروژه بر مبنای این موضوع */}
          <div className="p-6 sm:p-8 bg-stone-900 text-white rounded-2xl flex flex-col sm:flex-row items-center justify-between gap-6 shadow-md">
            <div className="space-y-1 text-center sm:text-right">
              <h3 className="text-lg font-bold">
                {isFa ? 'نیاز به اجرای پروژه‌ای با این استاندارد دارید؟' : 'Need a project shot to this standard?'}
              </h3>
              <p className="text-xs sm:text-sm text-stone-400">
                {isFa
                  ? 'مشاوره مستقیم برای عکاسی هایپرمکرو، هلی‌شات و فیلمبرداری صنعتی با سینا ضرغامی'
                  : 'Direct consultation on hyper-macro, drone cinematography, and industrial video.'}
              </p>
            </div>

            <button
              onClick={() => onNavigate(`/order?ref=${encodeURIComponent(title)}`)}
              className="px-5 py-2.5 bg-amber-600 hover:bg-amber-500 text-white text-xs sm:text-sm font-bold rounded-xl transition-all shadow-md shrink-0 cursor-pointer"
            >
              {isFa ? 'درخواست استعلام پروژه' : 'Inquire Project'}
            </button>
          </div>
        </div>
      </article>
    );
  }

  // -------------------------------------------------------------
  // نمای فهرست مقالات (Articles List View)
  // -------------------------------------------------------------
  return (
    <section className="py-20 sm:py-24 bg-stone-50 border-b border-stone-200 min-h-[80vh]">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 space-y-12">
        {/* Header */}
        <div className="max-w-3xl space-y-3">
          <div className="flex items-center gap-2 text-xs font-mono uppercase tracking-wider text-amber-800 font-bold">
            <BookOpen className="w-4 h-4 text-amber-700" />
            <span>{isFa ? 'یادداشت‌های فنی، اپتیک و مسترکلاس‌ها' : 'Technical Essays & Photography Field Notes'}</span>
          </div>
          <h1 className="text-3xl sm:text-4xl md:text-5xl font-extrabold text-stone-900 tracking-tight">
            {isFa ? 'دانش عکاسی، تکنیک‌ها و تجارب زیسته' : 'Visual Academy & Technical Insights'}
          </h1>
          <p className="text-sm sm:text-base text-stone-600 leading-relaxed">
            {isFa
              ? 'مجموعه مقالات اختصاصی سینا ضرغامی درباره رینگ معکوس، نورپردازی صنعتی با CRI بالا، تکنیک‌های فوکوس استکینگ و آسمان شب کویر لوت.'
              : 'Field-tested insights covering reverse lens optics, high-CRI industrial lighting, focus stacking synthesis, and desert astrophotography.'}
          </p>
        </div>

        {/* Filters & Search */}
        <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-4">
          <div className="flex flex-wrap items-center gap-2">
            {categories.map((cat) => (
              <button
                key={cat}
                onClick={() => setSelectedCategory(cat)}
                className={`px-3.5 py-1.5 text-xs font-medium rounded-lg transition-all cursor-pointer whitespace-nowrap ${
                  selectedCategory === cat
                    ? 'bg-stone-900 text-white font-bold shadow-xs'
                    : 'bg-white text-stone-600 hover:text-stone-900 border border-stone-200'
                }`}
              >
                {cat === 'all' ? (isFa ? 'همه مقالات' : 'All Articles') : cat}
              </button>
            ))}
          </div>

          <div className="relative w-full sm:w-72">
            <input
              type="text"
              placeholder={isFa ? 'جستجو در مقالات...' : 'Search articles...'}
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full bg-white border border-stone-200 rounded-lg px-3.5 py-2 text-xs text-stone-800 placeholder-stone-400 focus:outline-none focus:ring-1 focus:ring-amber-600 pl-9"
            />
            <Search className="w-3.5 h-3.5 text-stone-400 absolute left-3 top-1/2 -translate-y-1/2" />
          </div>
        </div>

        {/* Articles Grid */}
        {filteredArticles.length === 0 ? (
          <div className="p-16 text-center bg-white rounded-2xl border border-stone-200 text-stone-500 text-sm">
            {isFa ? 'مقاله‌ای با این مشخصات یافت نشد.' : 'No articles matched your criteria.'}
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            {filteredArticles.map((art) => {
              const cover = getReliableImageUrl(art.coverImage || art.coverUrl);
              const readTime = art.readTimeMinutes || art.readingTimeMinutes || 6;
              const summary = isFa ? art.summaryFa || art.excerptFa : art.summaryEn || art.excerptEn;
              const title = isFa ? art.titleFa : art.titleEn;
              const category = isFa ? art.categoryFa || art.category : art.categoryEn || art.category;

              return (
                <article
                  key={art.id}
                  onClick={() => handleOpenArticle(art)}
                  className="group bg-white rounded-2xl border border-stone-200/90 overflow-hidden shadow-2xs hover:shadow-md transition-all flex flex-col justify-between cursor-pointer"
                >
                  <div>
                    <div className="relative aspect-16/10 overflow-hidden bg-stone-900">
                      <img
                        src={cover}
                        alt={title}
                        className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-104"
                        loading="lazy"
                        referrerPolicy="no-referrer"
                      />
                      <div className="absolute top-3 left-3 bg-stone-900/80 backdrop-blur-md text-white text-[11px] font-mono px-2.5 py-0.5 rounded-md">
                        {category}
                      </div>
                    </div>

                    <div className="p-6 space-y-3">
                      <div className="flex items-center gap-2 text-xs font-mono text-stone-500">
                        <span>{art.publishedAt}</span>
                        <span aria-hidden="true">·</span>
                        <span className="flex items-center gap-1">
                          <Clock className="w-3 h-3 text-amber-700" />
                          <span>{readTime} {isFa ? 'دقیقه' : 'min'}</span>
                        </span>
                      </div>

                      <h3 className="text-lg font-bold text-stone-900 group-hover:text-amber-800 transition-colors line-clamp-2 leading-snug">
                        {title}
                      </h3>

                      <p className="text-xs sm:text-sm text-stone-600 line-clamp-3 leading-relaxed">
                        {summary}
                      </p>
                    </div>
                  </div>

                  <div className="px-6 py-4 border-t border-stone-100 flex items-center justify-between text-xs font-semibold text-amber-800 group-hover:text-amber-600">
                    <span>{isFa ? 'مطالعه متن کامل مقاله' : 'Read Full Article'}</span>
                    {isFa ? <ArrowLeft className="w-3.5 h-3.5" /> : <ArrowRight className="w-3.5 h-3.5" />}
                  </div>
                </article>
              );
            })}
          </div>
        )}
      </div>
    </section>
  );
};
