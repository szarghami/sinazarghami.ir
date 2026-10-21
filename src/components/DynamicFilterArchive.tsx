import React, { useState } from 'react';
import {
  ArticleItem,
  DefinedTechnique,
  EquipmentItem,
  Language,
  PhotoItem,
} from '../types';
import {
  Camera,
  Wrench,
  BookOpen,
  ArrowRight,
  ArrowLeft,
  Sparkles,
  MapPin,
  Clock,
  Eye,
  CheckCircle2,
  Briefcase,
  X,
  Layers,
  ShoppingBag,
} from 'lucide-react';
import { getReliableImageUrl } from '../utils/supabase';

interface DynamicFilterArchiveProps {
  type: 'gear' | 'technique';
  val: string;
  photos: PhotoItem[];
  articles: ArticleItem[];
  equipment: EquipmentItem[];
  techniques: DefinedTechnique[];
  language: Language;
  onNavigate: (path: string) => void;
  onSelectPrint: (photo: PhotoItem) => void;
}

export const DynamicFilterArchive: React.FC<DynamicFilterArchiveProps> = ({
  type,
  val,
  photos = [],
  articles = [],
  equipment = [],
  techniques = [],
  language,
  onNavigate,
  onSelectPrint,
}) => {
  const isFa = language === 'fa';
  const [selectedPhoto, setSelectedPhoto] = useState<PhotoItem | null>(null);

  // یافتن تجهیز یا تکنیک متناظر
  const gearItem =
    type === 'gear'
      ? equipment.find(
          (e) =>
            e.id.toLowerCase() === val.toLowerCase() ||
            e.name.toLowerCase() === val.toLowerCase() ||
            val.toLowerCase().includes(e.id.toLowerCase())
        )
      : null;

  const techItem =
    type === 'technique'
      ? techniques.find(
          (t) =>
            t.id.toLowerCase() === val.toLowerCase() ||
            t.nameFa === val ||
            t.nameEn.toLowerCase() === val.toLowerCase()
        )
      : null;

  // فیلتر عکس‌ها و ویدیوهای مرتبط
  const relatedPhotos = photos.filter((p) => {
    if (type === 'gear') {
      const matchId = p.gearIds?.includes(val) || (gearItem && p.gearIds?.includes(gearItem.id));
      const matchCamera = gearItem && p.camera?.toLowerCase().includes(gearItem.name.toLowerCase());
      const matchLens = gearItem && p.lens?.toLowerCase().includes(gearItem.name.toLowerCase());
      return matchId || matchCamera || matchLens;
    } else {
      const matchId = p.techniques?.includes(val) || (techItem && p.techniques?.includes(techItem.id));
      const matchText =
        techItem && (p.descriptionFa?.includes(techItem.nameFa) || p.titleFa?.includes(techItem.nameFa));
      return matchId || matchText;
    }
  });

  // فیلتر مقالات و آموزش‌های مرتبط
  const relatedArticles = articles.filter((a) => {
    if (type === 'gear') {
      const matchId = a.relatedGearIds?.includes(val) || (gearItem && a.relatedGearIds?.includes(gearItem.id));
      const matchText = gearItem && a.contentFa?.includes(gearItem.name);
      return matchId || matchText;
    } else {
      const matchId = a.relatedTechniques?.includes(val) || (techItem && a.relatedTechniques?.includes(techItem.id));
      const matchText = techItem && a.contentFa?.includes(techItem.nameFa);
      return matchId || matchText;
    }
  });

  const headerTitle =
    type === 'gear'
      ? gearItem?.name || val
      : isFa
      ? techItem?.nameFa || val
      : techItem?.nameEn || val;

  const headerDescription =
    type === 'gear'
      ? isFa
        ? gearItem?.purposeFa || gearItem?.specs
        : gearItem?.purposeEn || gearItem?.specs
      : isFa
      ? techItem?.descriptionFa
      : techItem?.descriptionEn;

  return (
    <div className="py-20 sm:py-24 bg-stone-50 border-b border-stone-200 min-h-[80vh]">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 space-y-12">
        {/* نوار بازگشت */}
        <div className="flex items-center justify-between">
          <button
            onClick={() => onNavigate(type === 'gear' ? '/gear' : '/portfolio')}
            className="flex items-center gap-1.5 text-xs sm:text-sm font-semibold text-stone-600 hover:text-stone-900 transition-colors cursor-pointer"
          >
            {isFa ? <ArrowRight className="w-4 h-4" /> : <ArrowLeft className="w-4 h-4" />}
            <span>{isFa ? 'بازگشت به فهرست قبلی' : 'Back to previous list'}</span>
          </button>

          <span className="text-xs font-mono text-amber-800 bg-amber-100/70 px-3 py-1 rounded-full font-bold">
            {type === 'gear'
              ? isFa
                ? 'آرشیو تجهیزات'
                : 'Gear Archive'
              : isFa
              ? 'آرشیو تکنیک‌ها'
              : 'Technique Archive'}
          </span>
        </div>

        {/* کارت معرفی بالا (Hero Summary Card) */}
        <div className="bg-white rounded-3xl p-6 sm:p-10 border border-stone-200/90 shadow-xs space-y-6">
          <div className="flex flex-col md:flex-row md:items-start justify-between gap-6">
            <div className="space-y-3 max-w-3xl">
              <div className="flex items-center gap-2 text-xs font-mono uppercase tracking-wider text-amber-800 font-bold">
                {type === 'gear' ? (
                  <Camera className="w-4 h-4 text-amber-700" />
                ) : (
                  <Wrench className="w-4 h-4 text-amber-700" />
                )}
                <span>
                  {type === 'gear'
                    ? isFa
                      ? gearItem?.categoryLabelFa || 'تجهیزات سینمایی و عکاسی'
                      : gearItem?.categoryLabelEn || 'Production Equipment'
                    : isFa
                    ? 'تکنیک تخصصی تصویربرداری و عکاسی'
                    : 'Cinematic & Visual Technique'}
                </span>
              </div>

              <h1 className="text-2xl sm:text-3xl md:text-4xl font-black text-stone-900 tracking-tight">
                {headerTitle}
              </h1>

              {headerDescription && (
                <p className="text-sm sm:text-base text-stone-600 leading-relaxed">
                  {headerDescription}
                </p>
              )}

              {/* مشخصات فنی برای تجهیزات */}
              {gearItem?.specs && (
                <div className="p-3 bg-stone-100/80 rounded-xl text-xs font-mono text-stone-700 border border-stone-200/70 inline-block">
                  <span className="font-bold ml-1 text-stone-900">{isFa ? 'مشخصات فنی:' : 'Tech Specs:'}</span>
                  <span>{gearItem.specs}</span>
                </div>
              )}
            </div>

            {/* دکمه ثبت سفارش با این تجهیز/تکنیک */}
            <button
              onClick={() => onNavigate(`/order?${type}=${encodeURIComponent(headerTitle)}`)}
              className="px-5 py-3 bg-amber-600 hover:bg-amber-500 text-white text-xs sm:text-sm font-bold rounded-xl transition-all shadow-md flex items-center gap-2 shrink-0 cursor-pointer self-start"
            >
              <Sparkles className="w-4 h-4" />
              <span>
                {type === 'gear'
                  ? isFa
                    ? 'درخواست پروژه با این تجهیز'
                    : 'Book Project with this Gear'
                  : isFa
                  ? 'ثبت سفارش با این تکنیک'
                  : 'Commission using this Technique'}
              </span>
            </button>
          </div>

          {/* پیشنهادهای مناسب برای چه پروژه‌هایی */}
          {gearItem?.recommendedForFa && gearItem.recommendedForFa.length > 0 && (
            <div className="pt-4 border-t border-stone-100 flex flex-wrap items-center gap-2">
              <span className="text-xs font-bold text-stone-500">
                {isFa ? 'بهترین کاربردها:' : 'Recommended For:'}
              </span>
              {(isFa ? gearItem.recommendedForFa : gearItem.recommendedForEn || gearItem.recommendedForFa).map(
                (item, idx) => (
                  <span
                    key={idx}
                    className="px-2.5 py-1 bg-stone-100 text-stone-700 text-xs font-medium rounded-lg"
                  >
                    {item}
                  </span>
                )
              )}
            </div>
          )}
        </div>

        {/* بخش ۱: آثار، عکس‌ها و ویدیوهای ثبت‌شده با این تجهیز یا تکنیک */}
        <div className="space-y-6">
          <div className="flex items-center justify-between border-b border-stone-200 pb-3">
            <div className="flex items-center gap-2">
              <Camera className="w-5 h-5 text-amber-700" />
              <h2 className="text-xl sm:text-2xl font-bold text-stone-900">
                {isFa ? 'آثار و نمونه‌کارهای ثبت‌شده' : 'Visual Portfolio & Works'}
              </h2>
            </div>
            <span className="text-xs font-mono text-stone-500">
              {relatedPhotos.length} {isFa ? 'اثر ثبت‌شده' : 'Works Recorded'}
            </span>
          </div>

          {relatedPhotos.length === 0 ? (
            <div className="p-12 text-center bg-white rounded-2xl border border-stone-200 text-stone-500 text-sm">
              {isFa
                ? 'هنوز عکسی با این برچسب منتشر نشده یا در حال دسته‌بندی است.'
                : 'No photos currently tagged with this item.'}
            </div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
              {relatedPhotos.map((photo) => (
                <div
                  key={photo.id}
                  onClick={() => setSelectedPhoto(photo)}
                  className="group bg-white rounded-2xl overflow-hidden border border-stone-200/90 shadow-2xs hover:shadow-md transition-all cursor-pointer flex flex-col justify-between"
                >
                  <div className="relative aspect-16/10 overflow-hidden bg-stone-900">
                    <img
                      src={getReliableImageUrl(photo.imageUrl)}
                      alt={isFa ? photo.titleFa : photo.titleEn}
                      className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-104"
                      loading="lazy"
                      referrerPolicy="no-referrer"
                    />
                    <div className="absolute top-3 right-3 bg-stone-900/85 backdrop-blur-md text-amber-400 text-xs px-2.5 py-1 rounded-md font-mono">
                      {photo.year}
                    </div>
                  </div>

                  <div className="p-5 space-y-2">
                    <div className="flex items-center gap-1.5 text-xs text-amber-800 font-mono">
                      <MapPin className="w-3.5 h-3.5" />
                      <span>{isFa ? photo.locationFa : photo.locationEn}</span>
                    </div>

                    <h3 className="text-base font-bold text-stone-900 group-hover:text-amber-800 transition-colors line-clamp-1">
                      {isFa ? photo.titleFa : photo.titleEn}
                    </h3>

                    <p className="text-xs text-stone-600 line-clamp-2 leading-relaxed">
                      {isFa ? photo.descriptionFa : photo.descriptionEn}
                    </p>
                  </div>

                  <div className="p-4 border-t border-stone-100 flex items-center justify-between text-xs text-stone-500 font-mono">
                    <span>{photo.camera}</span>
                    <span className="text-amber-800 font-semibold flex items-center gap-1">
                      <Eye className="w-3.5 h-3.5" />
                      {isFa ? 'مشاهده شناسنامه' : 'View Details'}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* بخش ۲: مقالات و آموزش‌های مرتبط */}
        <div className="space-y-6 pt-6">
          <div className="flex items-center justify-between border-b border-stone-200 pb-3">
            <div className="flex items-center gap-2">
              <BookOpen className="w-5 h-5 text-amber-700" />
              <h2 className="text-xl sm:text-2xl font-bold text-stone-900">
                {isFa ? 'مقالات و آموزش‌های مرتبط' : 'Related Technical Articles'}
              </h2>
            </div>
            <span className="text-xs font-mono text-stone-500">
              {relatedArticles.length} {isFa ? 'مقاله' : 'Articles'}
            </span>
          </div>

          {relatedArticles.length === 0 ? (
            <div className="p-8 text-center bg-white rounded-2xl border border-stone-200 text-stone-500 text-sm">
              {isFa
                ? 'مقاله‌ای مستقیماً به این مورد پیوند داده نشده است.'
                : 'No specific articles linked to this item.'}
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {relatedArticles.map((art) => (
                <div
                  key={art.id}
                  onClick={() => onNavigate(`/articles?slug=${encodeURIComponent(art.slug)}`)}
                  className="bg-white rounded-2xl overflow-hidden border border-stone-200/90 shadow-2xs hover:shadow-md transition-all cursor-pointer p-6 space-y-3 flex flex-col justify-between group"
                >
                  <div className="space-y-2">
                    <div className="flex items-center gap-2 text-xs font-mono text-amber-800 font-bold">
                      <span>{art.category || (isFa ? art.categoryFa : art.categoryEn)}</span>
                      <span aria-hidden="true">·</span>
                      <span>{art.readTimeMinutes || art.readingTimeMinutes} {isFa ? 'دقیقه' : 'min'}</span>
                    </div>

                    <h3 className="text-base font-bold text-stone-900 group-hover:text-amber-800 transition-colors leading-snug">
                      {isFa ? art.titleFa : art.titleEn}
                    </h3>

                    <p className="text-xs text-stone-600 line-clamp-3 leading-relaxed">
                      {isFa ? art.summaryFa || art.excerptFa : art.summaryEn || art.excerptEn}
                    </p>
                  </div>

                  <div className="pt-2 text-xs font-semibold text-amber-800 flex items-center justify-between">
                    <span>{isFa ? 'مطالعه متن مقاله' : 'Read Article'}</span>
                    {isFa ? <ArrowLeft className="w-3.5 h-3.5" /> : <ArrowRight className="w-3.5 h-3.5" />}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* مدال بزرگ‌نمایی عکس در صورت کلیک */}
      {selectedPhoto && (
        <div className="fixed inset-0 z-50 bg-stone-950/90 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="relative max-w-4xl w-full bg-stone-900 rounded-2xl overflow-hidden shadow-2xl border border-stone-800">
            <button
              onClick={() => setSelectedPhoto(null)}
              className="absolute top-4 right-4 z-10 p-2 bg-stone-800/80 hover:bg-stone-700 text-white rounded-full cursor-pointer"
            >
              <X className="w-5 h-5" />
            </button>
            <div className="aspect-16/10 bg-black flex items-center justify-center">
              <img
                src={getReliableImageUrl(selectedPhoto.imageUrl)}
                alt={isFa ? selectedPhoto.titleFa : selectedPhoto.titleEn}
                className="max-h-[75vh] w-auto max-w-full object-contain"
              />
            </div>
            <div className="p-6 text-white space-y-3">
              <div className="flex items-center justify-between text-xs font-mono text-amber-400">
                <span>{isFa ? selectedPhoto.locationFa : selectedPhoto.locationEn} · {selectedPhoto.year}</span>
                <span>{selectedPhoto.camera}</span>
              </div>
              <h3 className="text-xl font-bold">{isFa ? selectedPhoto.titleFa : selectedPhoto.titleEn}</h3>
              <p className="text-sm text-stone-300">{isFa ? selectedPhoto.descriptionFa : selectedPhoto.descriptionEn}</p>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
