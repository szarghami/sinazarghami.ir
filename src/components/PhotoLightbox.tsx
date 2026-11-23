import React, { useEffect, useState } from 'react';
import {
  X,
  ChevronLeft,
  ChevronRight,
  Play,
  MapPin,
  Briefcase,
  Camera,
  Wrench,
  Sparkles,
  ShoppingBag,
} from 'lucide-react';
import { VideoPlayer } from './VideoPlayer';
import { getReliableImageUrl } from '../utils/media';
import type { DefinedTechnique, EquipmentItem, Language, PhotoItem } from '../types';

interface PhotoLightboxProps {
  photo: PhotoItem;
  language: Language;
  equipment?: EquipmentItem[];
  definedTechniques?: DefinedTechnique[];
  onClose: () => void;
  onSelectPrint?: (photo: PhotoItem) => void;
  onNavigate?: (path: string) => void;
}

/**
 * پنل اطلاعات عکس (لایت‌باکس).
 * هم در صفحه‌ی نمونه‌کارها و هم با کلیک روی اسلایدهای هیرو استفاده می‌شود.
 */
export const PhotoLightbox: React.FC<PhotoLightboxProps> = ({
  photo,
  language,
  equipment = [],
  definedTechniques = [],
  onClose,
  onSelectPrint,
  onNavigate,
}) => {
  const isFa = language === 'fa';
  const [activeImageIndex, setActiveImageIndex] = useState(0);

  useEffect(() => {
    setActiveImageIndex(0);
  }, [photo.id]);

  useEffect(() => {
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') onClose();
    };
    window.addEventListener('keydown', onKeyDown);
    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    return () => {
      window.removeEventListener('keydown', onKeyDown);
      document.body.style.overflow = previousOverflow;
    };
  }, [onClose]);

  const images = [photo.imageUrl, ...(photo.galleryImages || [])].filter(Boolean);
  const videos = photo.videos || [];
  const mediaCount = images.length + videos.length;
  const activeVideo =
    activeImageIndex >= images.length ? videos[activeImageIndex - images.length] : null;

  const getGearName = (gearId: string): string => {
    const item = equipment.find((entry) => entry.id === gearId);
    return item ? item.name : gearId;
  };

  const getTechniqueName = (techId: string): string => {
    const tech = definedTechniques.find((entry) => entry.id === techId);
    if (!tech) return techId;
    return isFa ? tech.nameFa : tech.nameEn;
  };

  const goTo = (path: string) => {
    onClose();
    onNavigate?.(path);
  };

  return (
    <div
      className="fixed inset-0 z-50 bg-stone-950/95 backdrop-blur-md flex items-center justify-center p-3 sm:p-6 overflow-y-auto animate-in fade-in duration-200"
      onClick={onClose}
      role="dialog"
      aria-modal="true"
    >
      <div
        className="relative w-full max-w-5xl bg-stone-900 text-white rounded-2xl overflow-hidden shadow-2xl border border-stone-800 my-auto"
        onClick={(event) => event.stopPropagation()}
      >
        {/* Modal Close Button */}
        <button
          onClick={onClose}
          className="absolute top-4 right-4 z-20 p-2 text-stone-300 hover:text-white bg-stone-800/80 hover:bg-stone-700 rounded-full transition-colors cursor-pointer"
          aria-label={isFa ? 'بستن' : 'Close'}
        >
          <X className="w-5 h-5" />
        </button>

        {/* Modal Layout */}
        <div className="grid grid-cols-1 lg:grid-cols-12 max-h-[90vh] overflow-y-auto">
          {/* Media Container */}
          <div className="lg:col-span-7 bg-black flex flex-col items-center justify-center min-h-[340px] sm:min-h-[480px] p-2 relative group">
            {activeVideo ? (
              <VideoPlayer
                url={activeVideo.url}
                sources={activeVideo.sources}
                poster={photo.imageUrl || undefined}
                language={isFa ? 'fa' : 'en'}
                title={
                  (isFa ? activeVideo.titleFa : activeVideo.titleEn) ||
                  (isFa ? photo.titleFa : photo.titleEn)
                }
              />
            ) : (
              <img
                src={getReliableImageUrl(images[activeImageIndex] || photo.imageUrl)}
                alt={isFa ? photo.titleFa : photo.titleEn}
                className="max-h-[70vh] w-auto max-w-full object-contain"
                referrerPolicy="no-referrer"
              />
            )}

            {/* اسلایدر آلبوم چندعکسی */}
            {mediaCount > 1 && (
              <>
                <button
                  onClick={() =>
                    setActiveImageIndex((prev) => (prev > 0 ? prev - 1 : mediaCount - 1))
                  }
                  className="absolute left-3 p-2 bg-stone-900/70 hover:bg-stone-800 text-white rounded-full transition-all cursor-pointer"
                  title={isFa ? 'عکس قبلی' : 'Previous'}
                >
                  <ChevronLeft className="w-5 h-5" />
                </button>

                <button
                  onClick={() =>
                    setActiveImageIndex((prev) => (prev < mediaCount - 1 ? prev + 1 : 0))
                  }
                  className="absolute right-3 p-2 bg-stone-900/70 hover:bg-stone-800 text-white rounded-full transition-all cursor-pointer"
                  title={isFa ? 'عکس بعدی' : 'Next'}
                >
                  <ChevronRight className="w-5 h-5" />
                </button>

                <div className="w-full flex items-center justify-center gap-2 p-2 bg-stone-950/80 overflow-x-auto mt-2">
                  {images.map((imgUrl, index) => (
                    <button
                      key={`img-${index}`}
                      onClick={() => setActiveImageIndex(index)}
                      className={`w-12 h-10 rounded-md overflow-hidden border-2 transition-all cursor-pointer shrink-0 ${
                        activeImageIndex === index
                          ? 'border-amber-500 scale-105'
                          : 'border-transparent opacity-60 hover:opacity-100'
                      }`}
                    >
                      <img src={getReliableImageUrl(imgUrl)} alt="" className="w-full h-full object-cover" />
                    </button>
                  ))}
                  {videos.map((video, index) => {
                    const mediaIndex = images.length + index;
                    return (
                      <button
                        key={video.id || `video-${index}`}
                        onClick={() => setActiveImageIndex(mediaIndex)}
                        className={`w-12 h-10 rounded-md overflow-hidden border-2 transition-all cursor-pointer shrink-0 bg-stone-800 flex items-center justify-center ${
                          activeImageIndex === mediaIndex
                            ? 'border-amber-500 scale-105'
                            : 'border-transparent opacity-60 hover:opacity-100'
                        }`}
                        title={isFa ? 'ویدیو' : 'Video'}
                      >
                        <Play className="w-4 h-4 text-white fill-current" />
                      </button>
                    );
                  })}
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
                  <span>{isFa ? photo.locationFa : photo.locationEn}</span>
                  <span aria-hidden="true">·</span>
                  <span>{photo.year}</span>
                </div>

                <h3 className="text-xl sm:text-2xl font-bold tracking-tight text-white">
                  {isFa ? photo.titleFa : photo.titleEn}
                </h3>
              </div>

              {/* کارفرما و مشخصات پروژه */}
              {photo.clientName && (
                <div className="p-3 bg-stone-800/80 border border-stone-700/80 rounded-xl space-y-1">
                  <div className="flex items-center gap-1.5 text-xs font-bold text-amber-400">
                    <Briefcase className="w-3.5 h-3.5" />
                    <span>{isFa ? 'کارفرما / پروژه:' : 'Client / Project:'}</span>
                    <span>{photo.clientName}</span>
                  </div>
                  {photo.clientInfo && (
                    <p className="text-xs text-stone-300 leading-relaxed">{photo.clientInfo}</p>
                  )}
                </div>
              )}

              <p className="text-xs sm:text-sm text-stone-300 leading-relaxed">
                {isFa ? photo.descriptionFa : photo.descriptionEn}
              </p>

              {/* تگ‌های تجهیزات و تکنیک‌های به‌کار رفته با پیوند به /filter */}
              {(photo.gearIds?.length || photo.techniques?.length) ? (
                <div className="space-y-2 pt-2 border-t border-stone-800">
                  <span className="text-xs font-mono text-stone-400 block">
                    {isFa
                      ? 'تکنیک‌ها و ابزارهای مرتبط (کلیک برای آرشیو):'
                      : 'Applied Tech & Gear (Click to filter):'}
                  </span>
                  <div className="flex flex-wrap gap-2">
                    {photo.gearIds?.map((gearId) => (
                      <button
                        key={gearId}
                        onClick={() => goTo(`/filter?type=gear&val=${encodeURIComponent(gearId)}`)}
                        className="px-2.5 py-1 bg-stone-800 hover:bg-amber-600 hover:text-white text-stone-300 text-xs font-mono rounded-lg transition-colors flex items-center gap-1 cursor-pointer"
                      >
                        <Camera className="w-3 h-3 text-amber-400" />
                        <span>{getGearName(gearId)}</span>
                      </button>
                    ))}

                    {photo.techniques?.map((techId) => (
                      <button
                        key={techId}
                        onClick={() => goTo(`/filter?type=technique&val=${encodeURIComponent(techId)}`)}
                        className="px-2.5 py-1 bg-amber-950/70 hover:bg-amber-600 hover:text-white text-amber-300 text-xs rounded-lg transition-colors flex items-center gap-1 cursor-pointer border border-amber-800/60"
                      >
                        <Wrench className="w-3 h-3" />
                        <span>{getTechniqueName(techId)}</span>
                      </button>
                    ))}
                  </div>
                </div>
              ) : null}

              {/* EXIF Data */}
              {photo.exif && (
                <div className="p-3 bg-stone-950/80 rounded-xl border border-stone-800 text-xs font-mono text-stone-300 space-y-1.5">
                  <div className="text-[11px] text-stone-500 uppercase">
                    {isFa ? 'تنظیمات فنی ثبت:' : 'Camera Specs:'}
                  </div>
                  <div className="grid grid-cols-2 gap-2 text-[11px]">
                    <div>{photo.camera}</div>
                    <div>{photo.lens}</div>
                    <div>
                      {photo.exif.aperture} · {photo.exif.shutter}
                    </div>
                    <div>
                      ISO {photo.exif.iso} · {photo.exif.focalLength}
                    </div>
                  </div>
                </div>
              )}
            </div>

            {/* Action CTA */}
            <div className="pt-4 border-t border-stone-800 space-y-3">
              <button
                onClick={() => goTo(`/order?ref=${encodeURIComponent(photo.titleFa)}`)}
                className="w-full py-3 bg-amber-600 hover:bg-amber-500 text-white text-xs sm:text-sm font-bold rounded-xl transition-all shadow-lg flex items-center justify-center gap-2 cursor-pointer"
              >
                <Sparkles className="w-4 h-4" />
                <span>
                  {isFa ? 'ثبت سفارش پروژه مشابه این اثر' : 'Inquire Similar Production Project'}
                </span>
              </button>

              {photo.printAvailable && onSelectPrint && (
                <button
                  onClick={() => {
                    onClose();
                    onSelectPrint(photo);
                  }}
                  className="w-full py-2.5 bg-stone-800 hover:bg-stone-700 text-stone-200 text-xs font-semibold rounded-xl transition-all flex items-center justify-center gap-2 cursor-pointer"
                >
                  <ShoppingBag className="w-4 h-4 text-amber-400" />
                  <span>
                    {isFa
                      ? 'خرید نسخه چاپی فاین‌آرت یا لایسنس دیجیتال'
                      : 'Purchase Archival Print / License'}
                  </span>
                </button>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
