import React, { useState } from 'react';
import {
  CategoryItem,
  DefinedTechnique,
  EquipmentItem,
  Language,
  PhotoItem,
} from '../types';
import {
  Camera,
  ShoppingBag,
  X,
  MapPin,
  Maximize2,
  Images,
  ChevronRight,
  ChevronLeft,
  Sparkles,
  Tag,
  Eye,
  Briefcase,
  Wrench,
  ArrowUpRight,
  SlidersHorizontal,
} from 'lucide-react';
import { getReliableImageUrl } from '../utils/supabase';
import { trackEvent } from '../utils/analytics';

interface PhotographyGalleryProps {
  photos: PhotoItem[];
  language: Language;
  onSelectPrint: (photo: PhotoItem) => void;
  onNavigate?: (path: string) => void;
  commercialCategories?: CategoryItem[];
  definedTechniques?: DefinedTechnique[];
  equipment?: EquipmentItem[];
  isPortfolioPage?: boolean;
}

export const PhotographyGallery: React.FC<PhotographyGalleryProps> = ({
  photos,
  language,
  onSelectPrint,
  onNavigate = () => {},
  commercialCategories = [],
  definedTechniques = [],
  equipment = [],
  isPortfolioPage = false,
}) => {
  const isFa = language === 'fa';
  const [selectedCategory, setSelectedCategory] = useState<string>('all');
  const [activePhoto, setActivePhoto] = useState<PhotoItem | null>(null);
  const [activeImageIndex, setActiveImageIndex] = useState<number>(0);
  const [failedImages, setFailedImages] = useState<Record<string, boolean>>({});

  // تفکیک نمونه‌کارهای تخصصی/تجاری از عکس‌های سفر
  // در صفحه /portfolio تنها آثاری که portfolioScope !== 'travel' هستند نشان داده می‌شوند
  const scopedPhotos = isPortfolioPage
    ? photos.filter((p) => p.portfolioScope !== 'travel')
    : photos;

  // دسته‌بندی‌های داینامیک ۱۰۰٪ خوانده‌شده از SiteContent.commercialCategories
  const dynamicCategories: { id: string; labelFa: string; labelEn: string }[] = [
    { id: 'all', labelFa: 'همه نمونه‌کارها', labelEn: 'All Works' },
    ...commercialCategories.map((c) => ({
      id: c.id,
      labelFa: c.titleFa || c.nameFa || c.id,
      labelEn: c.titleEn || c.nameEn || c.id,
    })),
  ];

  // فیلتر بر اساس دسته‌بندی انتخابی
  const filteredPhotos =
    selectedCategory === 'all'
      ? scopedPhotos
      : scopedPhotos.filter((p) => {
          return (
            p.commercialCategory === selectedCategory ||
            p.category === selectedCategory ||
            (p.category === 'architecture' && selectedCategory.includes('industrial')) ||
            (p.category === 'portrait' && selectedCategory.includes('macro'))
          );
        });

  const openLightbox = (photo: PhotoItem) => {
    setActivePhoto(photo);
    setActiveImageIndex(0);
    trackEvent('photo_view', {
      photoId: photo.id,
      photoTitle: photo.titleFa,
      selectedFormat: photo.isAlbum ? 'digital' : 'print',
    });
  };

  const handleSelectPrint = (photo: PhotoItem) => {
    trackEvent('open_buy_modal', {
      photoId: photo.id,
      photoTitle: photo.titleFa,
      priceToman: photo.printPriceToman,
      priceUsd: photo.printPriceUsd,
    });
    onSelectPrint(photo);
  };

  const getGearName = (gearId: string): string => {
    const item = equipment.find((e) => e.id === gearId);
    return item ? item.name : gearId;
  };

  const getTechniqueName = (techId: string): string => {
    const tech = definedTechniques.find((t) => t.id === techId);
    if (!tech) return techId;
    return isFa ? tech.nameFa : tech.nameEn;
  };

  const currentPhotoImages = activePhoto
    ? [activePhoto.imageUrl, ...(activePhoto.galleryImages || [])]
    : [];

  return (
    <section id="photography" className="py-20 sm:py-24 bg-stone-50 border-b border-stone-200">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Section Header */}
        <div className="flex flex-col md:flex-row md:items-end justify-between mb-12 gap-6">
          <div className="space-y-3">
            <div className="flex items-center gap-2 text-xs font-mono tracking-widest text-amber-800 uppercase font-bold">
              <Camera className="w-4 h-4 text-amber-700" />
              <span>
                {isPortfolioPage
                  ? isFa
                    ? 'نمونه‌کارهای تجاری و پروژه‌های سفارشی'
                    : 'Commercial & Commissioned Works'
                  : isFa
                  ? 'آثار برگزیده، گالری و فروش مستقیم'
                  : 'Curated Works & Print Sales'}
              </span>
            </div>
            <h2 className="text-3xl sm:text-4xl lg:text-5xl font-black text-stone-900 tracking-tight">
              {isPortfolioPage
                ? isFa
                  ? 'ویترین آثار تخصصی، صنعتی و تبلیغاتی'
                  : 'Specialized Commercial Showcase'
                : isFa
                ? 'روایت چشم‌اندازها، ماکرو و سفر'
                : 'Visual Narratives & Monograph Series'}
            </h2>
            <p className="text-sm sm:text-base text-stone-600 max-w-2xl leading-relaxed">
              {isPortfolioPage
                ? isFa
                  ? 'مجموعه پروژه‌های فیلمبرداری صنعتی، کاتالوگ با استاندارد آمازون و دیجی‌کالا، هایپرمکرو میکروسکوپی و تصویربرداری سازمانی سینا ضرغامی با تجهیزات سینمایی 4K.'
                  : 'Curated industrial cinema, pure-white e-commerce catalogs, precision hyper-macro studies, and corporate documentaries shot on 4K 10-bit cinema rigs.'
                : isFa
                ? 'ثبت اختصاصی با تجهیزات پیشرفته سینمایی و عکاسی ماکرو (Canon R8، رینگ معکوس و نورهای پیوسته). امکان سفارش چاپ موزه و ثبت پروژه برای تمامی آثار مهیا است.'
                : 'Fine-art landscapes, high-magnification hyper-macro, and aerial captures available for fine-art prints and client inquiries.'}
            </p>
          </div>

          {/* Dynamic 100% Data-Driven Categories from SiteContent */}
          <div className="flex flex-wrap items-center gap-2">
            <div className="text-xs font-mono text-stone-600 hidden lg:flex items-center gap-1 ml-2">
              <SlidersHorizontal className="w-3.5 h-3.5" />
              <span>{isFa ? 'دسته‌بندی:' : 'Category:'}</span>
            </div>
            {dynamicCategories.map((cat) => {
              const active = selectedCategory === cat.id;
              return (
                <button
                  key={cat.id}
                  onClick={() => setSelectedCategory(cat.id)}
                  className={`px-3.5 py-1.5 rounded-lg text-xs font-semibold transition-all duration-200 cursor-pointer whitespace-nowrap ${
                    active
                      ? 'bg-stone-900 text-white shadow-xs'
                      : 'bg-white text-stone-600 hover:text-stone-950 hover:bg-stone-100 border border-stone-200'
                  }`}
                >
                  {isFa ? cat.labelFa : cat.labelEn}
                </button>
              );
            })}
          </div>
        </div>

        {/* Masonry / Bento Grid */}
        {filteredPhotos.length === 0 ? (
          <div className="p-16 text-center bg-white rounded-2xl border border-stone-200 text-stone-500 text-sm">
            {isFa ? 'اثری در این دسته‌بندی یافت نشد.' : 'No works found in this category.'}
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 sm:gap-8">
            {filteredPhotos.map((photo, index) => {
              const isLarge = index === 0 || index === 4;
              const hasMultiple = photo.galleryImages && photo.galleryImages.length > 0;
              const totalCount = 1 + (photo.galleryImages?.length || 0);
              const isFailed = failedImages[photo.id];
              const displayUrl = getReliableImageUrl(photo.imageUrl);

              return (
                <div
                  key={photo.id}
                  className={`group relative rounded-2xl overflow-hidden bg-white border border-stone-200/90 shadow-2xs hover:shadow-lg transition-all duration-300 flex flex-col justify-between ${
                    isLarge ? 'md:col-span-2 lg:col-span-2' : 'col-span-1'
                  }`}
                >
                  {/* Upper Section */}
                  <div>
                    {/* Image Container */}
                    <div
                      className="relative aspect-16/10 sm:aspect-16/9 overflow-hidden cursor-pointer bg-stone-900"
                      onClick={() => openLightbox(photo)}
                    >
                      {!isFailed ? (
                        <img
                          src={displayUrl}
                          alt={isFa ? photo.titleFa : photo.titleEn}
                          className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-104"
                          loading="lazy"
                          referrerPolicy="no-referrer"
                          onError={() => {
                            setFailedImages((prev) => ({ ...prev, [photo.id]: true }));
                          }}
                        />
                      ) : (
                        <div className="absolute inset-0 bg-gradient-to-br from-stone-850 via-stone-900 to-stone-950 flex flex-col items-center justify-center p-6 text-center text-white">
                          <div className="p-3 bg-amber-600/20 text-amber-400 rounded-full mb-3 ring-1 ring-amber-500/30">
                            <Camera className="w-8 h-8" />
                          </div>
                          <h4 className="font-bold text-sm text-stone-100 mb-1">
                            {isFa ? photo.titleFa : photo.titleEn}
                          </h4>
                          <p className="text-xs text-stone-400 font-mono mb-2">
                            {isFa ? photo.locationFa : photo.locationEn} · {photo.year}
                          </p>
                          <span className="text-[11px] text-amber-300/90 font-mono tracking-wider">
                            {photo.camera}
                          </span>
                        </div>
                      )}

                      {/* نشانگر شرکت/کارفرما در صورت وجود */}
                      {photo.clientName && (
                        <div className="absolute top-3 right-3 bg-stone-900/90 backdrop-blur-md text-amber-400 text-xs px-2.5 py-1 rounded-md flex items-center gap-1.5 font-bold shadow-md z-10 border border-amber-500/30">
                          <Briefcase className="w-3.5 h-3.5" />
                          <span>{photo.clientName}</span>
                        </div>
                      )}

                      {/* نشانگر گالری چندعکسی (آلبوم) */}
                      {hasMultiple && (
                        <div className="absolute top-3 left-3 bg-stone-900/85 backdrop-blur-md text-white text-xs px-2.5 py-1 rounded-md flex items-center gap-1.5 font-mono shadow-md z-10">
                          <Images className="w-3.5 h-3.5 text-amber-400" />
                          <span>{isFa ? `${totalCount} تصویر` : `${totalCount} Photos`}</span>
                        </div>
                      )}

                      {/* Hover Overlay */}
                      <div className="absolute inset-0 bg-stone-950/40 opacity-0 group-hover:opacity-100 transition-opacity duration-300 flex items-center justify-center gap-3">
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            openLightbox(photo);
                          }}
                          className="p-3 bg-white/95 hover:bg-white text-stone-900 rounded-full shadow-lg transition-transform hover:scale-110 cursor-pointer"
                          title={isFa ? 'مشاهده بزرگ‌نمایی و جزئیات' : 'Inspect Details'}
                        >
                          <Maximize2 className="w-4 h-4" />
                        </button>
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            onNavigate(`/order?project=${encodeURIComponent(photo.titleFa)}`);
                          }}
                          className="px-4 py-2 bg-amber-600 hover:bg-amber-500 text-white text-xs font-bold rounded-full shadow-lg transition-transform hover:scale-105 flex items-center gap-1.5 cursor-pointer"
                        >
                          <Sparkles className="w-3.5 h-3.5" />
                          <span>{isFa ? 'سفارش مشابه این پروژه' : 'Order Similar'}</span>
                        </button>
                      </div>
                    </div>

                    {/* Metadata Body */}
                    <div className="p-5 sm:p-6 pb-2 space-y-3">
                      <div className="flex items-center justify-between text-xs text-stone-500 font-mono">
                        <div className="flex items-center gap-1.5 text-amber-800">
                          <MapPin className="w-3.5 h-3.5 shrink-0" />
                          <span>{isFa ? photo.locationFa : photo.locationEn}</span>
                        </div>
                        <span>{photo.year}</span>
                      </div>

                      <h3 className="text-base sm:text-lg font-bold text-stone-900 group-hover:text-amber-800 transition-colors line-clamp-1">
                        {isFa ? photo.titleFa : photo.titleEn}
                      </h3>

                      {/* توضیحات پروژه برای کارفرما (clientInfo) */}
                      {photo.clientInfo && (
                        <div className="p-2.5 bg-amber-50/70 border border-amber-200/70 rounded-lg text-xs text-amber-950 leading-relaxed">
                          <span className="font-bold ml-1">{isFa ? 'روایت پروژه:' : 'Project Log:'}</span>
                          <span>{photo.clientInfo}</span>
                        </div>
                      )}

                      <p className="text-xs sm:text-sm text-stone-600 line-clamp-2 leading-relaxed">
                        {isFa ? photo.descriptionFa : photo.descriptionEn}
                      </p>

                      {/* برچسب‌های قابل کلیک تجهیزات و تکنیک‌ها */}
                      {((photo.gearIds && photo.gearIds.length > 0) ||
                        (photo.techniques && photo.techniques.length > 0)) && (
                        <div className="pt-2 border-t border-stone-100 flex flex-wrap items-center gap-1.5">
                          {/* تگ‌های تجهیزات */}
                          {photo.gearIds?.map((gearId) => (
                            <button
                              key={gearId}
                              onClick={(e) => {
                                e.stopPropagation();
                                onNavigate(`/filter?type=gear&val=${encodeURIComponent(gearId)}`);
                              }}
                              className="px-2 py-0.5 bg-stone-100 hover:bg-stone-200 text-stone-700 text-[10px] font-mono rounded transition-colors flex items-center gap-1 cursor-pointer"
                              title={isFa ? 'مشاهده آثار مرتبط با این تجهیز' : 'Filter by gear'}
                            >
                              <Camera className="w-3 h-3 text-stone-500" />
                              <span>{getGearName(gearId)}</span>
                            </button>
                          ))}

                          {/* تگ‌های تکنیک‌ها */}
                          {photo.techniques?.map((techId) => (
                            <button
                              key={techId}
                              onClick={(e) => {
                                e.stopPropagation();
                                onNavigate(`/filter?type=technique&val=${encodeURIComponent(techId)}`);
                              }}
                              className="px-2 py-0.5 bg-amber-100/70 hover:bg-amber-200/70 text-amber-900 text-[10px] font-medium rounded transition-colors flex items-center gap-1 cursor-pointer"
                              title={isFa ? 'مشاهده آثار این تکنیک' : 'Filter by technique'}
                            >
                              <Wrench className="w-3 h-3 text-amber-700" />
                              <span>{getTechniqueName(techId)}</span>
                            </button>
                          ))}
                        </div>
                      )}
                    </div>
                  </div>

                  {/* Bottom Action Footer */}
                  <div className="p-4 sm:p-5 pt-3 border-t border-stone-100 bg-stone-50/50 flex items-center justify-between mt-2">
                    <button
                      onClick={() => openLightbox(photo)}
                      className="px-3 py-1.5 text-xs text-stone-700 hover:text-stone-900 hover:bg-stone-200/60 rounded-lg transition-colors cursor-pointer flex items-center gap-1 font-medium"
                    >
                      <Eye className="w-3.5 h-3.5" />
                      <span>{isFa ? 'مشاهده شناسنامه و آلبوم' : 'Details'}</span>
                    </button>

                    <button
                      onClick={() => onNavigate(`/order?ref=${encodeURIComponent(photo.titleFa)}`)}
                      className="px-3.5 py-1.5 bg-amber-700 hover:bg-amber-600 text-white text-xs font-bold rounded-lg transition-all shadow-2xs flex items-center gap-1.5 cursor-pointer"
                    >
                      <Briefcase className="w-3.5 h-3.5" />
                      <span>{isFa ? 'ثبت سفارش مشابه این' : 'Inquire Similar'}</span>
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* Fullscreen Lightbox & Gallery Viewer Modal */}
      {activePhoto && (
        <div className="fixed inset-0 z-50 bg-stone-950/95 backdrop-blur-md flex items-center justify-center p-3 sm:p-6 overflow-y-auto animate-in fade-in duration-200">
          <div className="relative w-full max-w-5xl bg-stone-900 text-white rounded-2xl overflow-hidden shadow-2xl border border-stone-800 my-auto">
            {/* Modal Close Button */}
            <button
              onClick={() => setActivePhoto(null)}
              className="absolute top-4 right-4 z-20 p-2 text-stone-300 hover:text-white bg-stone-800/80 hover:bg-stone-700 rounded-full transition-colors cursor-pointer"
              aria-label="Close Lightbox"
            >
              <X className="w-5 h-5" />
            </button>

            {/* Modal Layout */}
            <div className="grid grid-cols-1 lg:grid-cols-12 max-h-[90vh] overflow-y-auto">
              {/* Media Container */}
              <div className="lg:col-span-7 bg-black flex flex-col items-center justify-center min-h-[340px] sm:min-h-[480px] p-2 relative group">
                <img
                  src={getReliableImageUrl(currentPhotoImages[activeImageIndex] || activePhoto.imageUrl)}
                  alt={isFa ? activePhoto.titleFa : activePhoto.titleEn}
                  className="max-h-[70vh] w-auto max-w-full object-contain"
                  referrerPolicy="no-referrer"
                />

                {/* اسلایدر آلبوم چندعکسی */}
                {currentPhotoImages.length > 1 && (
                  <>
                    <button
                      onClick={() => setActiveImageIndex((prev) => (prev > 0 ? prev - 1 : currentPhotoImages.length - 1))}
                      className="absolute left-3 p-2 bg-stone-900/70 hover:bg-stone-800 text-white rounded-full transition-all cursor-pointer"
                      title={isFa ? 'عکس قبلی' : 'Previous'}
                    >
                      <ChevronLeft className="w-5 h-5" />
                    </button>

                    <button
                      onClick={() => setActiveImageIndex((prev) => (prev < currentPhotoImages.length - 1 ? prev + 1 : 0))}
                      className="absolute right-3 p-2 bg-stone-900/70 hover:bg-stone-800 text-white rounded-full transition-all cursor-pointer"
                      title={isFa ? 'عکس بعدی' : 'Next'}
                    >
                      <ChevronRight className="w-5 h-5" />
                    </button>

                    <div className="w-full flex items-center justify-center gap-2 p-2 bg-stone-950/80 overflow-x-auto mt-2">
                      {currentPhotoImages.map((imgUrl, i) => (
                        <button
                          key={i}
                          onClick={() => setActiveImageIndex(i)}
                          className={`w-12 h-10 rounded-md overflow-hidden border-2 transition-all cursor-pointer shrink-0 ${
                            activeImageIndex === i ? 'border-amber-500 scale-105' : 'border-transparent opacity-60 hover:opacity-100'
                          }`}
                        >
                          <img src={getReliableImageUrl(imgUrl)} alt="" className="w-full h-full object-cover" />
                        </button>
                      ))}
                    </div>
                  </>
                )}
              </div>

              {/* Sidebar with Metadata, Client Info & Interactive Filter Tags */}
              <div className="lg:col-span-5 p-6 sm:p-8 flex flex-col justify-between space-y-6 bg-stone-900 border-t lg:border-t-0 lg:border-l border-stone-800">
                <div className="space-y-4">
                  <div className="space-y-1.5">
                    <div className="flex items-center gap-2 text-xs font-mono text-amber-500">
                      <MapPin className="w-3.5 h-3.5" />
                      <span>{isFa ? activePhoto.locationFa : activePhoto.locationEn}</span>
                      <span aria-hidden="true">·</span>
                      <span>{activePhoto.year}</span>
                    </div>

                    <h3 className="text-xl sm:text-2xl font-bold tracking-tight text-white">
                      {isFa ? activePhoto.titleFa : activePhoto.titleEn}
                    </h3>
                  </div>

                  {/* کارفرما و مشخصات پروژه */}
                  {activePhoto.clientName && (
                    <div className="p-3 bg-stone-800/80 border border-stone-700/80 rounded-xl space-y-1">
                      <div className="flex items-center gap-1.5 text-xs font-bold text-amber-400">
                        <Briefcase className="w-3.5 h-3.5" />
                        <span>{isFa ? 'کارفرما / پروژه:' : 'Client / Project:'}</span>
                        <span>{activePhoto.clientName}</span>
                      </div>
                      {activePhoto.clientInfo && (
                        <p className="text-xs text-stone-300 leading-relaxed">
                          {activePhoto.clientInfo}
                        </p>
                      )}
                    </div>
                  )}

                  <p className="text-xs sm:text-sm text-stone-300 leading-relaxed">
                    {isFa ? activePhoto.descriptionFa : activePhoto.descriptionEn}
                  </p>

                  {/* تگ‌های تجهیزات و تکنیک‌های به‌کار رفته با پیوند به /filter */}
                  <div className="space-y-2 pt-2 border-t border-stone-800">
                    <span className="text-xs font-mono text-stone-400 block">
                      {isFa ? 'تکنیک‌ها و ابزارهای مرتبط (کلیک برای آرشیو):' : 'Applied Tech & Gear (Click to filter):'}
                    </span>
                    <div className="flex flex-wrap gap-2">
                      {activePhoto.gearIds?.map((gearId) => (
                        <button
                          key={gearId}
                          onClick={() => {
                            setActivePhoto(null);
                            onNavigate(`/filter?type=gear&val=${encodeURIComponent(gearId)}`);
                          }}
                          className="px-2.5 py-1 bg-stone-800 hover:bg-amber-600 hover:text-white text-stone-300 text-xs font-mono rounded-lg transition-colors flex items-center gap-1 cursor-pointer"
                        >
                          <Camera className="w-3 h-3 text-amber-400" />
                          <span>{getGearName(gearId)}</span>
                        </button>
                      ))}

                      {activePhoto.techniques?.map((techId) => (
                        <button
                          key={techId}
                          onClick={() => {
                            setActivePhoto(null);
                            onNavigate(`/filter?type=technique&val=${encodeURIComponent(techId)}`);
                          }}
                          className="px-2.5 py-1 bg-amber-950/70 hover:bg-amber-600 hover:text-white text-amber-300 text-xs rounded-lg transition-colors flex items-center gap-1 cursor-pointer border border-amber-800/60"
                        >
                          <Wrench className="w-3 h-3" />
                          <span>{getTechniqueName(techId)}</span>
                        </button>
                      ))}
                    </div>
                  </div>

                  {/* EXIF Data */}
                  <div className="p-3 bg-stone-950/80 rounded-xl border border-stone-800 text-xs font-mono text-stone-300 space-y-1.5">
                    <div className="text-[11px] text-stone-500 uppercase">
                      {isFa ? 'تنظیمات فنی ثبت:' : 'Camera Specs:'}
                    </div>
                    <div className="grid grid-cols-2 gap-2 text-[11px]">
                      <div>{activePhoto.camera}</div>
                      <div>{activePhoto.lens}</div>
                      <div>{activePhoto.exif.aperture} · {activePhoto.exif.shutter}</div>
                      <div>ISO {activePhoto.exif.iso} · {activePhoto.exif.focalLength}</div>
                    </div>
                  </div>
                </div>

                {/* Action CTA */}
                <div className="pt-4 border-t border-stone-800 space-y-3">
                  <button
                    onClick={() => {
                      const title = activePhoto.titleFa;
                      setActivePhoto(null);
                      onNavigate(`/order?ref=${encodeURIComponent(title)}`);
                    }}
                    className="w-full py-3 bg-amber-600 hover:bg-amber-500 text-white text-xs sm:text-sm font-bold rounded-xl transition-all shadow-lg flex items-center justify-center gap-2 cursor-pointer"
                  >
                    <Sparkles className="w-4 h-4" />
                    <span>{isFa ? 'ثبت سفارش پروژه مشابه این اثر' : 'Inquire Similar Production Project'}</span>
                  </button>

                  {activePhoto.printAvailable && (
                    <button
                      onClick={() => {
                        const target = activePhoto;
                        setActivePhoto(null);
                        handleSelectPrint(target);
                      }}
                      className="w-full py-2.5 bg-stone-800 hover:bg-stone-700 text-stone-200 text-xs font-semibold rounded-xl transition-all flex items-center justify-center gap-2 cursor-pointer"
                    >
                      <ShoppingBag className="w-4 h-4 text-amber-400" />
                      <span>{isFa ? 'خرید نسخه چاپی فاین‌آرت یا لایسنس دیجیتال' : 'Purchase Archival Print / License'}</span>
                    </button>
                  )}
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </section>
  );
};
