import React from 'react';
import { Language, PhotoItem } from '../types';
import { Camera, MapPin, ArrowRight, ArrowLeft, Eye, ShoppingBag, Sparkles } from 'lucide-react';
import { getReliableImageUrl } from '../utils/supabase';

interface HomeFeaturedWorksProps {
  photos: PhotoItem[];
  language: Language;
  onSelectPrint: (photo: PhotoItem) => void;
  onNavigate: (path: string) => void;
}

export const HomeFeaturedWorks: React.FC<HomeFeaturedWorksProps> = ({
  photos,
  language,
  onSelectPrint,
  onNavigate,
}) => {
  const isFa = language === 'fa';

  // فیلتر پست‌های منتخب صفحه اصلی بر اساس showOnHome (یا فال‌بک به آثار شاخص)
  let homePhotos = photos.filter((p) => p.showOnHome);
  if (homePhotos.length === 0) {
    homePhotos = photos.filter((p) => p.featured).slice(0, 6);
  }
  if (homePhotos.length === 0) {
    homePhotos = photos.slice(0, 6);
  }

  // مرتب‌سازی بر اساس اولویت مشخص‌شده توسط ادمین
  const sortedPhotos = [...homePhotos].sort((a, b) => (a.homeOrder || 999) - (b.homeOrder || 999));

  return (
    <section className="py-20 bg-white border-b border-stone-200/80">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 space-y-12">
        {/* Header */}
        <div className="flex flex-col md:flex-row md:items-end justify-between gap-6">
          <div className="space-y-3">
            <div className="flex items-center gap-2 text-xs font-mono uppercase tracking-wider text-amber-800 font-bold">
              <Camera className="w-4 h-4 text-amber-700" />
              <span>{isFa ? 'پست‌های برگزیده صفحه اصلی' : 'Curated Works on Home'}</span>
            </div>
            <h2 className="text-2xl sm:text-3xl md:text-4xl font-extrabold text-stone-900 tracking-tight">
              {isFa ? 'شاهکارهای منتخب لنز و نور' : 'Selected Fine-Art & Cinematography'}
            </h2>
            <p className="text-sm sm:text-base text-stone-600 max-w-2xl leading-relaxed">
              {isFa
                ? 'مجموعه‌ای گزیده از قاب‌های چشم‌انداز، هایپرمکرو میکروسکوپی و تیزرهای صنعتی به انتخاب استودیو.'
                : 'A curated selection of landscape horizons, microscopic hyper-macro, and industrial cinematography.'}
            </p>
          </div>

          <button
            onClick={() => onNavigate('/portfolio')}
            className="px-5 py-2.5 bg-stone-900 hover:bg-stone-800 text-white text-xs sm:text-sm font-semibold rounded-xl transition-all shadow-xs flex items-center gap-2 self-start md:self-auto cursor-pointer"
          >
            <span>{isFa ? 'مشاهده تمام نمونه‌کارها' : 'View Full Portfolio'}</span>
            {isFa ? <ArrowLeft className="w-4 h-4" /> : <ArrowRight className="w-4 h-4" />}
          </button>
        </div>

        {/* Bento / Grid Showcase */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
          {sortedPhotos.map((photo) => (
            <div
              key={photo.id}
              className="group bg-stone-50/70 rounded-2xl overflow-hidden border border-stone-200/90 hover:shadow-lg transition-all flex flex-col justify-between"
            >
              <div>
                {/* Media Container */}
                <div className="relative aspect-4/3 overflow-hidden bg-stone-900">
                  <img
                    src={getReliableImageUrl(photo.imageUrl)}
                    alt={isFa ? photo.titleFa : photo.titleEn}
                    className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-104"
                    loading="lazy"
                    referrerPolicy="no-referrer"
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-stone-950/70 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity" />

                  {/* Top Location & Year */}
                  <div className="absolute top-3 right-3 bg-stone-900/80 backdrop-blur-md text-white text-xs px-2.5 py-1 rounded-md font-mono flex items-center gap-1.5">
                    <MapPin className="w-3 h-3 text-amber-400" />
                    <span>{isFa ? photo.locationFa : photo.locationEn}</span>
                  </div>

                  {photo.clientName && (
                    <div className="absolute top-3 left-3 bg-amber-700/90 backdrop-blur-md text-white text-[11px] font-medium px-2.5 py-1 rounded-md">
                      {photo.clientName}
                    </div>
                  )}
                </div>

                {/* Details */}
                <div className="p-6 space-y-3">
                  <div className="flex items-center justify-between text-xs font-mono text-stone-500">
                    <span>{photo.camera}</span>
                    <span>{photo.year}</span>
                  </div>

                  <h3 className="text-lg font-bold text-stone-900 group-hover:text-amber-800 transition-colors line-clamp-1 leading-snug">
                    {isFa ? photo.titleFa : photo.titleEn}
                  </h3>

                  <p className="text-xs sm:text-sm text-stone-600 line-clamp-2 leading-relaxed">
                    {isFa ? photo.descriptionFa : photo.descriptionEn}
                  </p>

                  {/* EXIF strip */}
                  <div className="pt-2 text-[11px] font-mono text-stone-400 flex items-center gap-2">
                    <span>{photo.exif.aperture}</span>
                    <span aria-hidden="true">·</span>
                    <span>{photo.exif.shutter}</span>
                    <span aria-hidden="true">·</span>
                    <span>ISO {photo.exif.iso}</span>
                    <span aria-hidden="true">·</span>
                    <span>{photo.lens}</span>
                  </div>
                </div>
              </div>

              {/* Action Footer */}
              <div className="p-4 sm:p-5 pt-3 border-t border-stone-200/70 bg-white/60 flex items-center justify-between">
                <div>
                  {photo.printAvailable ? (
                    <span className="text-xs font-bold text-amber-800 font-mono">
                      {isFa
                        ? `${(photo.digitalPriceToman || photo.printPriceToman).toLocaleString()} تومان`
                        : `$${photo.digitalPriceUsd || photo.printPriceUsd}`}
                    </span>
                  ) : (
                    <span className="text-xs text-stone-400 font-mono">
                      {photo.isVideo ? (isFa ? 'فوتیج سینمایی' : 'Cinematic') : (isFa ? 'اثر هنری' : 'Fine Art')}
                    </span>
                  )}
                </div>

                <div className="flex items-center gap-2">
                  <button
                    onClick={() => onNavigate('/portfolio')}
                    className="px-3 py-1.5 text-xs text-stone-700 hover:text-stone-950 hover:bg-stone-100 rounded-lg transition-colors cursor-pointer flex items-center gap-1"
                  >
                    <Eye className="w-3.5 h-3.5" />
                    <span>{isFa ? 'گالری' : 'Gallery'}</span>
                  </button>

                  {photo.printAvailable && (
                    <button
                      onClick={() => onSelectPrint(photo)}
                      className="px-3.5 py-1.5 bg-amber-600 hover:bg-amber-500 text-white text-xs font-bold rounded-lg transition-all shadow-2xs flex items-center gap-1 cursor-pointer"
                    >
                      <ShoppingBag className="w-3.5 h-3.5" />
                      <span>{isFa ? 'خرید اثر' : 'Order'}</span>
                    </button>
                  )}
                </div>
              </div>
            </div>
          ))}
        </div>

        {/* Big Bottom Action to view all portfolio */}
        <div className="pt-8 text-center">
          <button
            onClick={() => onNavigate('/portfolio')}
            className="px-8 py-3.5 bg-stone-900 hover:bg-stone-800 text-white font-bold text-sm rounded-xl transition-all shadow-md inline-flex items-center gap-2 cursor-pointer"
          >
            <Sparkles className="w-4 h-4 text-amber-400" />
            <span>{isFa ? 'مشاهده تمام آثار و دسته‌بندی‌های نمونه‌کارها' : 'Explore All Portfolios & Categories'}</span>
            {isFa ? <ArrowLeft className="w-4 h-4" /> : <ArrowRight className="w-4 h-4" />}
          </button>
        </div>
      </div>
    </section>
  );
};
