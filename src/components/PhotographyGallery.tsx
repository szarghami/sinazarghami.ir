import React, { useState, useEffect, useRef } from 'react';
import { Language, PhotoCategory, PhotoItem } from '../types';
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
  Download,
  Tag,
  CheckCircle,
  Eye,
  Play,
  Film,
  ExternalLink,
  Server,
  MessageSquare,
  ThumbsUp,
  ShieldAlert,
  Radio,
  Lock,
  Zap,
} from 'lucide-react';
import { getReliableImageUrl } from '../utils/supabase';
import { trackEvent } from '../utils/analytics';
import { parseAparatUrl, parseYoutubeUrl } from '../utils/githubMediaService';

interface PhotographyGalleryProps {
  photos: PhotoItem[];
  language: Language;
  onSelectPrint: (photo: PhotoItem) => void;
}

export const PhotographyGallery: React.FC<PhotographyGalleryProps> = ({
  photos,
  language,
  onSelectPrint,
}) => {
  const isFa = language === 'fa';
  const [selectedCategory, setSelectedCategory] = useState<PhotoCategory>('all');
  const [activePhoto, setActivePhoto] = useState<PhotoItem | null>(null);
  const [activeImageIndex, setActiveImageIndex] = useState<number>(0);
  const [failedImages, setFailedImages] = useState<Record<string, boolean>>({});

  // سرور فعال پخش ویدیو در لایت‌باکس (گیت‌هاب / آپارات / یوتیوب)
  const [activeVideoServer, setActiveVideoServer] = useState<'github' | 'aparat' | 'youtube'>('github');
  const [autoSwitchedToAparat, setAutoSwitchedToAparat] = useState<boolean>(false);
  const videoTimeoutRef = useRef<any>(null);
  const videoPlayerRef = useRef<HTMLVideoElement | null>(null);

  // دسته‌بندی‌های غنی و صنعتی گالری
  const categories = [
    { id: 'all', labelFa: 'همه آثار', labelEn: 'All Works' },
    { id: 'commercial-shoes', labelFa: 'عکاسی صنعتی کفش', labelEn: 'Footwear & Shoes' },
    { id: 'commercial-jewelry', labelFa: 'عکاسی صنعتی جواهرات', labelEn: 'Jewelry & Gems' },
    { id: 'commercial-video', labelFa: 'تیزر و ویدیوی صنعتی', labelEn: 'Industrial Video' },
    { id: 'video', labelFa: 'ویدیو و تیزر سینمایی', labelEn: 'Cinematography & Video' },
    { id: 'landscape', labelFa: 'طبیعت و کویر', labelEn: 'Landscape & Desert' },
    { id: 'aerial', labelFa: 'دید ۳۶۰ و هوایی', labelEn: '360° & Aerial' },
    { id: 'portrait', labelFa: 'هایپرمکرو و چهره', labelEn: 'Macro & Portrait' },
    { id: 'architecture', labelFa: 'صنعتی و معماری', labelEn: 'Architecture' },
    { id: 'documentary', labelFa: 'مستند سفر', labelEn: 'Expedition Documentary' },
  ];

  const filteredPhotos = selectedCategory === 'all'
    ? photos
    : selectedCategory === 'video'
    ? photos.filter((p) => p.category === 'video' || p.category === 'commercial-video' || p.isVideo)
    : selectedCategory === 'commercial-video'
    ? photos.filter((p) => p.category === 'commercial-video' || (p.isVideo && p.titleFa.includes('صنعتی')))
    : selectedCategory === 'commercial-shoes'
    ? photos.filter((p) => p.category === 'commercial-shoes')
    : selectedCategory === 'commercial-jewelry'
    ? photos.filter((p) => p.category === 'commercial-jewelry')
    : photos.filter((p) => p.category === selectedCategory);

  const openLightbox = (photo: PhotoItem) => {
    setActivePhoto(photo);
    setActiveImageIndex(0);
    setAutoSwitchedToAparat(false);

    // تعیین سرور اولیه پخش ویدیو
    if (photo.defaultServer) {
      setActiveVideoServer(photo.defaultServer);
    } else if (photo.githubVideoUrl || photo.videoUrl) {
      setActiveVideoServer('github');
    } else if (photo.aparatUrl) {
      setActiveVideoServer('aparat');
    } else if (photo.youtubeUrl) {
      setActiveVideoServer('youtube');
    } else {
      setActiveVideoServer('github');
    }

    trackEvent('photo_view', {
      photoId: photo.id,
      photoTitle: photo.titleFa,
      selectedFormat: photo.isAlbum ? 'digital' : 'print',
    });
  };

  // بررسی سوییچ خودکار در ۴ ثانیه به آپارات در صورت تاخیر سرور اصلی
  useEffect(() => {
    if (!activePhoto) return;
    const isVideo = activePhoto.isVideo || activePhoto.category === 'video' || activePhoto.category === 'commercial-video';
    if (!isVideo) return;

    if (activeVideoServer === 'github' && activePhoto.aparatUrl) {
      if (videoTimeoutRef.current) clearTimeout(videoTimeoutRef.current);
      videoTimeoutRef.current = setTimeout(() => {
        // اگر ویدیو تا ۴ ثانیه آماده نشد، خودکار به آپارات سوییچ کن
        if (videoPlayerRef.current && (videoPlayerRef.current.readyState < 2 || videoPlayerRef.current.paused)) {
          setActiveVideoServer('aparat');
          setAutoSwitchedToAparat(true);
        }
      }, 4000);
    }

    return () => {
      if (videoTimeoutRef.current) {
        clearTimeout(videoTimeoutRef.current);
      }
    };
  }, [activePhoto, activeVideoServer]);

  const handleSelectPrint = (photo: PhotoItem) => {
    trackEvent('open_buy_modal', {
      photoId: photo.id,
      photoTitle: photo.titleFa,
      priceToman: photo.printPriceToman,
      priceUsd: photo.printPriceUsd,
    });
    onSelectPrint(photo);
  };

  const currentPhotoImages = activePhoto
    ? [activePhoto.imageUrl, ...(activePhoto.galleryImages || [])]
    : [];

  return (
    <section id="photography" className="py-24 bg-stone-50 border-b border-stone-200">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Section Header */}
        <div className="flex flex-col md:flex-row md:items-end justify-between mb-12 gap-6">
          <div className="space-y-3">
            <div className="flex items-center gap-2 text-xs font-mono tracking-widest text-amber-800 uppercase">
              <Camera className="w-4 h-4 text-amber-700" />
              <span>{isFa ? 'آثار برگزیده، گالری و فروش مستقیم' : 'Curated Works & Print Sales'}</span>
            </div>
            <h2 className="text-3xl sm:text-4xl lg:text-5xl font-black text-stone-900 tracking-tight">
              {isFa ? 'روایت چشم‌اندازها، ماکرو و سفر' : 'Visual Narratives & Monograph Series'}
            </h2>
            <p className="text-sm sm:text-base text-stone-600 max-w-2xl leading-relaxed">
              {isFa
                ? 'ثبت اختصاصی با تجهیزات پیشرفته سینمایی و عکاسی ماکرو (Canon R8، رینگ معکوس، دوربین ۳۶۰ گوپرو و تجهیزات نوری). امکان سفارش چاپ موزه و دانلود لایسنس دیجیتال برای تمامی آثار مهیا است.'
                : 'Fine-art landscape, high-magnification hyper-macro, and aerial captures available as archival limited editions and commercial master licenses.'}
            </p>
          </div>

          {/* Category Filter Pills */}
          <div className="flex flex-wrap gap-2">
            {categories.map((cat) => (
              <button
                key={cat.id}
                onClick={() => setSelectedCategory(cat.id as PhotoCategory)}
                className={`px-3.5 py-1.5 rounded-full text-xs font-medium transition-all duration-200 cursor-pointer ${
                  selectedCategory === cat.id
                    ? 'bg-stone-900 text-white shadow-sm'
                    : 'bg-white text-stone-600 hover:text-stone-950 hover:bg-stone-100 border border-stone-200/80'
                }`}
              >
                {isFa ? cat.labelFa : cat.labelEn}
              </button>
            ))}
          </div>
        </div>

        {/* Masonry / Bento Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 sm:gap-8">
          {filteredPhotos.map((photo, index) => {
            const isLarge = index === 0 || index === 3;
            const hasMultiple = photo.galleryImages && photo.galleryImages.length > 0;
            const totalCount = 1 + (photo.galleryImages?.length || 0);
            const isFailed = failedImages[photo.id];
            const displayUrl = getReliableImageUrl(photo.imageUrl);

            return (
              <div
                key={photo.id}
                className={`group relative rounded-2xl overflow-hidden bg-white border border-stone-200/90 shadow-xs hover:shadow-lg transition-all duration-300 flex flex-col justify-between ${
                  isLarge ? 'md:col-span-2 lg:col-span-2' : 'col-span-1'
                }`}
              >
                {/* Upper Section (Image + Info) */}
                <div>
                  {/* Image/Video Container */}
                  <div
                    className="relative aspect-16/10 sm:aspect-16/9 overflow-hidden cursor-pointer bg-stone-900 select-none"
                    onClick={() => openLightbox(photo)}
                    onContextMenu={(e) => e.preventDefault()}
                    draggable={false}
                  >
                    {!isFailed ? (
                      (() => {
                        const isVideoFile = Boolean(
                          photo.isVideo ||
                          photo.category === 'video' ||
                          photo.category === 'commercial-video' ||
                          /\.(mp4|webm|mov|m4v)($|\?)/i.test(photo.videoUrl || '') ||
                          /\.(mp4|webm|mov|m4v)($|\?)/i.test(photo.imageUrl || '')
                        );
                        const mediaSrc = photo.videoUrl || photo.imageUrl;

                        // اگر ویدیو است و تصویر بندانگشتی جداگانه ندارد، از المنت ویدیو استفاده می‌کنیم
                        if (isVideoFile && (!photo.thumbnailUrl || /\.(mp4|webm|mov|m4v)($|\?)/i.test(photo.thumbnailUrl))) {
                          return (
                            <video
                              src={mediaSrc}
                              preload="metadata"
                              muted
                              loop
                              playsInline
                              controlsList="nodownload"
                              disablePictureInPicture
                              onContextMenu={(e) => e.preventDefault()}
                              onMouseEnter={(e) => {
                                try {
                                  e.currentTarget.play();
                                } catch (_) {}
                              }}
                              onMouseLeave={(e) => {
                                try {
                                  e.currentTarget.pause();
                                  e.currentTarget.currentTime = 0;
                                } catch (_) {}
                              }}
                              className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-104 bg-black select-none pointer-events-auto"
                            />
                          );
                        }

                        // نمایش تصویر با قفل دانلود و قفل کلیک راست
                        return (
                          <img
                            src={displayUrl}
                            alt={isFa ? photo.titleFa : photo.titleEn}
                            className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-104 select-none pointer-events-auto"
                            loading="lazy"
                            draggable={false}
                            onDragStart={(e) => e.preventDefault()}
                            onContextMenu={(e) => e.preventDefault()}
                            referrerPolicy="no-referrer"
                            onError={(e) => {
                              const target = e.currentTarget;
                              if (photo.imageUrl && target.src !== photo.imageUrl) {
                                target.src = photo.imageUrl;
                              } else {
                                setFailedImages((prev) => ({ ...prev, [photo.id]: true }));
                              }
                            }}
                          />
                        );
                      })()
                    ) : (
                      /* کارت زیبای جایگزین عکاسی فاین‌آرت در صورت عدم دسترسی شبکه */
                      <div className="absolute inset-0 bg-gradient-to-br from-stone-850 via-stone-900 to-stone-950 flex flex-col items-center justify-center p-6 text-center text-white select-none">
                        <div className="p-3 bg-amber-600/20 text-amber-400 rounded-full mb-3 ring-1 ring-amber-500/30">
                          <Camera className="w-8 h-8" />
                        </div>
                        <h4 className="font-bold text-sm text-stone-100 mb-1">
                          {isFa ? photo.titleFa : photo.titleEn}
                        </h4>
                        <p className="text-xs text-stone-400 font-mono mb-2">
                          {isFa ? photo.locationFa : photo.locationEn} · {photo.year}
                        </p>
                        <span className="text-[11px] text-amber-300 bg-stone-800/80 px-2.5 py-0.5 rounded-full font-mono border border-stone-700">
                          {photo.camera}
                        </span>
                      </div>
                    )}

                    {/* نشانگر گالری چندعکسی (آلبوم) */}
                    {hasMultiple && (
                      <div className="absolute top-3 right-3 bg-stone-900/85 backdrop-blur-md text-white text-xs px-2.5 py-1 rounded-md flex items-center gap-1.5 font-mono shadow-md z-10 select-none">
                        <Images className="w-3.5 h-3.5 text-amber-400" />
                        <span>{isFa ? `${totalCount} تصویر` : `${totalCount} Photos`}</span>
                      </div>
                    )}

                    {/* نشانگرهای دسته‌بندی صنعتی، ویدیو یا قابلیت فروش */}
                    {photo.category === 'commercial-shoes' ? (
                      <div className="absolute top-3 left-3 bg-amber-950/90 border border-amber-700/60 backdrop-blur-md text-amber-300 text-[10.5px] font-bold px-2.5 py-1 rounded-md flex items-center gap-1 shadow-md z-10 select-none font-mono">
                        <span>👞</span>
                        <span>{isFa ? 'صنعتی کفش' : 'Footwear'}</span>
                      </div>
                    ) : photo.category === 'commercial-jewelry' ? (
                      <div className="absolute top-3 left-3 bg-emerald-950/90 border border-emerald-700/60 backdrop-blur-md text-emerald-300 text-[10.5px] font-bold px-2.5 py-1 rounded-md flex items-center gap-1 shadow-md z-10 select-none font-mono">
                        <span>💎</span>
                        <span>{isFa ? 'صنعتی جواهرات' : 'Jewelry'}</span>
                      </div>
                    ) : (photo.category === 'commercial-video' || (photo.isVideo && photo.category !== 'video')) ? (
                      <div className="absolute top-3 left-3 bg-red-900/90 border border-red-700/60 backdrop-blur-md text-white text-[10.5px] font-bold px-2.5 py-1 rounded-md flex items-center gap-1.5 shadow-md z-10 select-none font-mono">
                        <Film className="w-3 h-3 text-red-300" />
                        <span>{isFa ? 'تیزر صنعتی' : 'Industrial'}</span>
                        {photo.videoDuration && <span className="opacity-80">· {photo.videoDuration}</span>}
                      </div>
                    ) : (photo.isVideo || photo.category === 'video') ? (
                      <div className="absolute top-3 left-3 bg-red-600/95 backdrop-blur-md text-white text-[11px] font-bold px-2.5 py-1 rounded-md flex items-center gap-1.5 shadow-md z-10 font-mono select-none">
                        <Play className="w-3 h-3 fill-white" />
                        <span>{photo.videoQuality || '4K CINEMA'}</span>
                        {photo.videoDuration && <span className="opacity-80">· {photo.videoDuration}</span>}
                      </div>
                    ) : photo.printAvailable ? (
                      <div className="absolute top-3 left-3 bg-amber-600/90 backdrop-blur-md text-white text-[11px] font-bold px-2.5 py-1 rounded-md flex items-center gap-1 shadow-md z-10 select-none">
                        <Tag className="w-3 h-3" />
                        <span>{isFa ? 'فروش نسخه چاپ و دیجیتال' : 'Print & License'}</span>
                      </div>
                    ) : null}

                    {/* دکمه Play مرکزی برای ویدیوها */}
                    {(photo.isVideo || photo.category === 'video' || photo.category === 'commercial-video') && (
                      <div className="absolute inset-0 flex items-center justify-center pointer-events-none z-10 select-none">
                        <div className="w-12 h-12 rounded-full bg-stone-950/75 border border-white/50 backdrop-blur-xs flex items-center justify-center text-white shadow-2xl group-hover:scale-115 group-hover:bg-red-600/90 transition-all duration-300">
                          <Play className="w-5 h-5 fill-white translate-x-0.5" />
                        </div>
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
                        title={isFa ? 'مشاهده بزرگ‌نمایی و پلیر' : 'Inspect Details'}
                      >
                        <Maximize2 className="w-4 h-4" />
                      </button>

                      {/* اگر اثر ویدیو باشد دکمه سفارش تیزر یا لایسنس 4K نمایش می‌یابد، نه چاپ! */}
                      {photo.isVideo || photo.category === 'video' || photo.category === 'commercial-video' ? (
                        <a
                          href="#services"
                          onClick={(e) => e.stopPropagation()}
                          className="px-4 py-2 bg-red-600 hover:bg-red-500 text-white text-xs font-bold rounded-full shadow-lg transition-transform hover:scale-105 flex items-center gap-1.5 cursor-pointer"
                        >
                          <Film className="w-4 h-4" />
                          <span>{isFa ? 'سفارش تیزر' : 'Order Video'}</span>
                        </a>
                      ) : photo.printAvailable ? (
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            handleSelectPrint(photo);
                          }}
                          className="px-4 py-2 bg-amber-600 hover:bg-amber-500 text-white text-xs font-bold rounded-full shadow-lg transition-transform hover:scale-105 flex items-center gap-1.5 cursor-pointer"
                        >
                          <ShoppingBag className="w-4 h-4" />
                          <span>{isFa ? 'خرید این اثر' : 'Purchase Work'}</span>
                        </button>
                      ) : null}
                    </div>
                  </div>

                  {/* Metadata Bar */}
                  <div className="p-5 sm:p-6 pb-2">
                    <div className="flex items-center justify-between text-xs text-stone-500 font-mono mb-2">
                      <div className="flex items-center gap-1.5 text-amber-800">
                        <MapPin className="w-3.5 h-3.5" />
                        <span>{isFa ? photo.locationFa : photo.locationEn}</span>
                      </div>
                      <span>{photo.year}</span>
                    </div>

                    <h3 className="text-base sm:text-lg font-bold text-stone-900 group-hover:text-amber-800 transition-colors line-clamp-1 mb-2">
                      {isFa ? photo.titleFa : photo.titleEn}
                    </h3>

                    <p className="text-xs sm:text-sm text-stone-600 line-clamp-2 leading-relaxed">
                      {isFa ? photo.descriptionFa : photo.descriptionEn}
                    </p>

                    {/* مشخصات تجهیزات به کار رفته */}
                    <div className="mt-4 pt-3 border-t border-stone-100 flex flex-wrap items-center justify-between text-[11px] text-stone-500 font-mono gap-2">
                      <span className="flex items-center gap-1">
                        <Camera className="w-3 h-3 text-stone-400" />
                        {photo.camera}
                      </span>
                      <span className="text-stone-400">{photo.lens}</span>
                    </div>
                  </div>
                </div>

                {/* Bottom Action Footer */}
                <div className="p-4 sm:p-5 pt-3 border-t border-stone-100 bg-stone-50/50 flex items-center justify-between mt-2">
                  <div>
                    {photo.isVideo || photo.category === 'video' || photo.category === 'commercial-video' ? (
                      <div className="space-y-0.5">
                        <span className="text-[10px] uppercase tracking-wider text-stone-500 block">
                          {isFa ? 'کیفیت و کدک:' : 'Format:'}
                        </span>
                        <div className="text-xs font-black text-red-600 font-mono">
                          {photo.videoQuality || '4K 60fps C-Log3'}
                        </div>
                      </div>
                    ) : photo.printAvailable ? (
                      <div className="space-y-0.5">
                        <span className="text-[10px] uppercase tracking-wider text-stone-600 block">
                          {isFa ? 'شروع قیمت از:' : 'Starts at:'}
                        </span>
                        <div className="text-xs font-black text-stone-900 font-mono">
                          {isFa
                            ? `${(photo.digitalPriceToman || photo.printPriceToman).toLocaleString()} تومان`
                            : `$${photo.digitalPriceUsd || photo.printPriceUsd}`}
                        </div>
                      </div>
                    ) : null}
                  </div>

                  <div className="flex items-center gap-2">
                    <button
                      onClick={() => openLightbox(photo)}
                      className="px-3 py-1.5 text-xs text-stone-700 hover:text-stone-900 hover:bg-stone-200/60 rounded-lg transition-colors cursor-pointer flex items-center gap-1"
                    >
                      <Eye className="w-3.5 h-3.5" />
                      <span>{isFa ? (photo.isVideo ? 'پخش ویدیو' : 'مشاهده') : (photo.isVideo ? 'Play Video' : 'View')}</span>
                    </button>

                    {photo.isVideo || photo.category === 'video' || photo.category === 'commercial-video' ? (
                      <a
                        href="#services"
                        className="px-3.5 py-1.5 bg-red-600 hover:bg-red-500 text-white text-xs font-bold rounded-lg transition-all shadow-xs flex items-center gap-1.5 cursor-pointer"
                      >
                        <Film className="w-3.5 h-3.5" />
                        <span>{isFa ? 'سفارش تیزر' : 'Book Video'}</span>
                      </a>
                    ) : photo.printAvailable ? (
                      <button
                        onClick={() => handleSelectPrint(photo)}
                        className="px-3.5 py-1.5 bg-amber-700 hover:bg-amber-600 text-white text-xs font-bold rounded-lg transition-all shadow-xs flex items-center gap-1.5 cursor-pointer"
                      >
                        <ShoppingBag className="w-3.5 h-3.5" />
                        <span>{isFa ? 'سفارش اثر' : 'Order'}</span>
                      </button>
                    ) : null}
                  </div>
                </div>
              </div>
            );
          })}
        </div>
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
              {/* Media Container with Previous / Next if Album */}
              <div
                className="lg:col-span-8 bg-black flex flex-col items-center justify-center min-h-[340px] sm:min-h-[480px] p-2 relative group select-none"
                onContextMenu={(e) => e.preventDefault()}
              >
                {(() => {
                  const isVideoMedia = Boolean(
                    activePhoto.isVideo ||
                    activePhoto.category === 'video' ||
                    activePhoto.category === 'commercial-video' ||
                    /\.(mp4|webm|mov|m4v)($|\?)/i.test(activePhoto.videoUrl || '') ||
                    /\.(mp4|webm|mov|m4v)($|\?)/i.test(activePhoto.imageUrl || '')
                  );
                  const videoSrc = activePhoto.githubVideoUrl || activePhoto.videoUrl || activePhoto.imageUrl;

                  if (isVideoMedia) {
                    return (
                      <div className="w-full flex flex-col items-center justify-center p-2">
                        {/* پخش‌کننده چندسروره (گیت‌هاب / آپارات / یوتیوب) */}
                        <div className="w-full flex flex-col items-center justify-center">
                          {activeVideoServer === 'github' && (
                            <video
                              key={`github-${videoSrc}`}
                              ref={videoPlayerRef}
                              src={videoSrc}
                              controls
                              autoPlay
                              playsInline
                              controlsList="nodownload"
                              disablePictureInPicture
                              onContextMenu={(e) => e.preventDefault()}
                              onPlay={() => {
                                if (videoTimeoutRef.current) clearTimeout(videoTimeoutRef.current);
                              }}
                              onCanPlay={() => {
                                if (videoTimeoutRef.current) clearTimeout(videoTimeoutRef.current);
                              }}
                              onError={() => {
                                if (activePhoto.aparatUrl) {
                                  setActiveVideoServer('aparat');
                                  setAutoSwitchedToAparat(true);
                                }
                              }}
                              className="max-h-[65vh] w-auto max-w-full rounded-xl shadow-2xl bg-black border border-stone-800"
                            >
                              <source src={videoSrc} type="video/mp4" />
                              مرورگر شما از پخش مستقیم ویدیو پشتیبانی نمی‌کند.
                            </video>
                          )}

                          {activeVideoServer === 'aparat' && activePhoto.aparatUrl && (
                            <div className="relative w-full aspect-video max-w-3xl rounded-xl overflow-hidden shadow-2xl border border-stone-800 bg-black">
                              <iframe
                                src={parseAparatUrl(activePhoto.aparatUrl).embedUrl}
                                allowFullScreen
                                className="w-full h-full border-0"
                                title="Aparat Video Player"
                              />
                            </div>
                          )}

                          {activeVideoServer === 'youtube' && activePhoto.youtubeUrl && (
                            <div className="relative w-full aspect-video max-w-3xl rounded-xl overflow-hidden shadow-2xl border border-stone-800 bg-black">
                              <iframe
                                src={parseYoutubeUrl(activePhoto.youtubeUrl).embedUrl}
                                allowFullScreen
                                allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                                className="w-full h-full border-0"
                                title="YouTube Video Player"
                              />
                            </div>
                          )}
                        </div>

                        {/* اعلان سوییچ خودکار به سرور ایران در صورت کندی */}
                        {autoSwitchedToAparat && (
                          <div className="mt-2 w-full max-w-xl bg-amber-500/20 border border-amber-500/40 text-amber-200 text-xs px-3 py-1.5 rounded-lg flex items-center justify-between">
                            <div className="flex items-center gap-1.5">
                              <Zap className="w-3.5 h-3.5 text-amber-400 shrink-0" />
                              <span>{isFa ? 'سرور ویدیو به دلیل اختلال اینترنت بین‌الملل، خودکار به سرور پرسرعت آپارات (ایران) متصل شد.' : 'Auto-switched to Aparat Iran server.'}</span>
                            </div>
                            <button
                              onClick={() => setAutoSwitchedToAparat(false)}
                              className="text-amber-400 hover:text-white text-xs px-1 cursor-pointer"
                            >
                              ✕
                            </button>
                          </div>
                        )}

                        {/* نوار تغییر سرور هوشمند */}
                        <div className="mt-3 flex flex-wrap items-center justify-center gap-2 bg-stone-950/90 p-2 rounded-xl border border-stone-800/80 w-full max-w-xl">
                          <span className="text-[11px] text-stone-400 font-bold ml-1 flex items-center gap-1">
                            <Server className="w-3.5 h-3.5 text-stone-400" />
                            <span>{isFa ? 'سرور پخش:' : 'Server:'}</span>
                          </span>

                          {/* سرور اصلی (GitHub CDN) */}
                          <button
                            type="button"
                            onClick={() => {
                              setActiveVideoServer('github');
                              setAutoSwitchedToAparat(false);
                            }}
                            className={`px-3 py-1 rounded-lg text-xs font-mono font-bold flex items-center gap-1.5 transition-all cursor-pointer ${
                              activeVideoServer === 'github'
                                ? 'bg-amber-600 text-white shadow-md'
                                : 'bg-stone-800 text-stone-300 hover:bg-stone-700'
                            }`}
                          >
                            <Radio className={`w-3 h-3 ${activeVideoServer === 'github' ? 'animate-pulse text-white' : 'text-stone-400'}`} />
                            <span>{isFa ? 'سرور اصلی (GitHub)' : 'Primary (GitHub)'}</span>
                          </button>

                          {/* سرور ایران (آپارات) */}
                          {activePhoto.aparatUrl && (
                            <button
                              type="button"
                              onClick={() => {
                                setActiveVideoServer('aparat');
                                setAutoSwitchedToAparat(false);
                              }}
                              className={`px-3 py-1 rounded-lg text-xs font-mono font-bold flex items-center gap-1.5 transition-all cursor-pointer ${
                                activeVideoServer === 'aparat'
                                  ? 'bg-pink-600 text-white shadow-md'
                                  : 'bg-stone-800 text-stone-300 hover:bg-stone-700'
                              }`}
                            >
                              <span>🇮🇷</span>
                              <span>{isFa ? 'سرور ایران (آپارات)' : 'Iran (Aparat)'}</span>
                            </button>
                          )}

                          {/* سرور یوتیوب */}
                          {activePhoto.youtubeUrl && (
                            <button
                              type="button"
                              onClick={() => {
                                setActiveVideoServer('youtube');
                                setAutoSwitchedToAparat(false);
                              }}
                              className={`px-3 py-1 rounded-lg text-xs font-mono font-bold flex items-center gap-1.5 transition-all cursor-pointer ${
                                activeVideoServer === 'youtube'
                                  ? 'bg-red-600 text-white shadow-md'
                                  : 'bg-stone-800 text-stone-300 hover:bg-stone-700'
                              }`}
                            >
                              <Play className="w-3 h-3 fill-white" />
                              <span>{isFa ? 'یوتیوب (4K)' : 'YouTube (4K)'}</span>
                            </button>
                          )}
                        </div>

                        {/* اطلاعات کیفیت و لینک مستقیم */}
                        <div className="mt-2 flex items-center justify-between w-full max-w-xl px-2 text-[11px] text-stone-400 font-mono">
                          <span className="text-red-400 font-bold">{activePhoto.videoQuality || '4K Cinema 60fps'}</span>
                          <a
                            href={videoSrc}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="text-amber-500 hover:text-amber-400 underline flex items-center gap-1"
                          >
                            <span>{isFa ? 'پخش مستقیم در برگه جدید' : 'Open direct link'}</span>
                            <ExternalLink className="w-3 h-3" />
                          </a>
                        </div>
                      </div>
                    );
                  }

                  return (
                    <img
                      src={getReliableImageUrl(currentPhotoImages[activeImageIndex] || activePhoto.imageUrl)}
                      alt={isFa ? activePhoto.titleFa : activePhoto.titleEn}
                      className="max-h-[70vh] w-auto max-w-full object-contain select-none pointer-events-auto"
                      draggable={false}
                      onDragStart={(e) => e.preventDefault()}
                      onContextMenu={(e) => e.preventDefault()}
                      referrerPolicy="no-referrer"
                      onError={(e) => {
                        const t = e.currentTarget as HTMLImageElement;
                        t.style.display = 'none';
                      }}
                    />
                  );
                })()}

                {/* دکمه‌های اسلاید برای آلبوم‌های چندعکسی */}
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

                    {/* نوار تصاویر بندانگشتی آلبوم در پایین کادر */}
                    <div className="w-full flex items-center justify-center gap-2 p-2 bg-stone-950/80 overflow-x-auto mt-2">
                      {currentPhotoImages.map((imgUrl, i) => (
                        <button
                          key={i}
                          onClick={() => setActiveImageIndex(i)}
                          className={`w-12 h-10 rounded-md overflow-hidden border-2 transition-all cursor-pointer shrink-0 ${
                            activeImageIndex === i ? 'border-amber-500 scale-105' : 'border-transparent opacity-60 hover:opacity-100'
                          }`}
                        >
                          <img
                            src={getReliableImageUrl(imgUrl)}
                            alt=""
                            className="w-full h-full object-cover select-none"
                            draggable={false}
                            onContextMenu={(e) => e.preventDefault()}
                          />
                        </button>
                      ))}
                    </div>
                  </>
                )}
              </div>

              {/* Sidebar with Metadata, EXIF, Synced Comments & Actions */}
              <div className="lg:col-span-4 p-6 sm:p-8 flex flex-col justify-between space-y-6 bg-stone-900 border-t lg:border-t-0 lg:border-l border-stone-800">
                <div className="space-y-5">
                  <div className="space-y-2">
                    <div className="flex items-center gap-2 text-xs font-mono text-amber-500">
                      <MapPin className="w-3.5 h-3.5" />
                      <span>{isFa ? activePhoto.locationFa : activePhoto.locationEn}</span>
                      <span aria-hidden="true">·</span>
                      <span>{activePhoto.year}</span>
                      {currentPhotoImages.length > 1 && (
                        <>
                          <span aria-hidden="true">·</span>
                          <span className="text-stone-300">
                            {isFa
                              ? `تصویر ${activeImageIndex + 1} از ${currentPhotoImages.length}`
                              : `${activeImageIndex + 1} of ${currentPhotoImages.length}`}
                          </span>
                        </>
                      )}
                    </div>

                    <h3 className="text-xl sm:text-2xl font-bold tracking-tight text-white">
                      {isFa ? activePhoto.titleFa : activePhoto.titleEn}
                    </h3>
                  </div>

                  <p className="text-sm text-stone-300 leading-relaxed">
                    {isFa ? activePhoto.descriptionFa : activePhoto.descriptionEn}
                  </p>

                  {/* Complete Technical EXIF Specifications */}
                  <div className="p-4 bg-stone-950/80 rounded-xl border border-stone-800 space-y-2.5">
                    <div className="text-xs font-mono uppercase tracking-wider text-stone-400 flex items-center gap-1.5 border-b border-stone-800 pb-2">
                      <Camera className="w-3.5 h-3.5 text-amber-500" />
                      <span>{isFa ? 'شناسنامه فنی تصویر (EXIF)' : 'EXIF Technical Data'}</span>
                    </div>

                    <div className="grid grid-cols-2 gap-2 text-xs font-mono text-stone-300">
                      <div>
                        <span className="text-stone-500 block text-[10px]">{isFa ? 'دوربین' : 'Body'}:</span>
                        <span className="font-semibold">{activePhoto.camera}</span>
                      </div>
                      <div>
                        <span className="text-stone-500 block text-[10px]">{isFa ? 'لنز' : 'Lens'}:</span>
                        <span className="font-semibold">{activePhoto.lens}</span>
                      </div>
                      <div>
                        <span className="text-stone-500 block text-[10px]">{isFa ? 'دیافراگم' : 'Aperture'}:</span>
                        <span>{activePhoto.exif.aperture}</span>
                      </div>
                      <div>
                        <span className="text-stone-500 block text-[10px]">{isFa ? 'سرعت شاتر' : 'Shutter'}:</span>
                        <span>{activePhoto.exif.shutter}</span>
                      </div>
                      <div>
                        <span className="text-stone-500 block text-[10px]">{isFa ? 'حساسیت' : 'ISO'}:</span>
                        <span>{activePhoto.exif.iso}</span>
                      </div>
                      <div>
                        <span className="text-stone-500 block text-[10px]">{isFa ? 'فاصله کانونی' : 'Focal'}:</span>
                        <span>{activePhoto.exif.focalLength}</span>
                      </div>
                    </div>
                  </div>

                  {/* نظرات و بازخورد مخاطبان همگام‌سازی‌شده از یوتیوب و آپارات */}
                  <div className="p-4 bg-stone-950/80 rounded-xl border border-stone-800 space-y-3">
                    <div className="flex items-center justify-between border-b border-stone-800 pb-2">
                      <div className="flex items-center gap-2 text-xs font-mono uppercase tracking-wider text-stone-300">
                        <MessageSquare className="w-3.5 h-3.5 text-amber-500" />
                        <span>{isFa ? 'نظرات یوتیوب و آپارات' : 'Synced Community Comments'}</span>
                      </div>
                      {activePhoto.syncedComments && activePhoto.syncedComments.length > 0 && (
                        <span className="text-[10px] bg-stone-800 text-amber-400 px-2 py-0.5 rounded-full font-mono">
                          {activePhoto.syncedComments.length} {isFa ? 'نظر' : 'comments'}
                        </span>
                      )}
                    </div>

                    {activePhoto.syncedComments && activePhoto.syncedComments.length > 0 ? (
                      <div className="space-y-2.5 max-h-48 overflow-y-auto pr-1">
                        {activePhoto.syncedComments.map((comment) => (
                          <div key={comment.id} className="p-2.5 rounded-lg bg-stone-900/90 border border-stone-800 text-xs space-y-1.5">
                            <div className="flex items-center justify-between">
                              <div className="flex items-center gap-1.5 font-bold text-stone-200">
                                <div className="w-5 h-5 rounded-full bg-stone-800 flex items-center justify-center text-[10px] text-amber-400 font-mono">
                                  {comment.authorName.charAt(0)}
                                </div>
                                <span className="text-[11px] truncate max-w-[140px]">{comment.authorName}</span>
                              </div>
                              <div className="flex items-center gap-1.5">
                                {comment.platform === 'youtube' ? (
                                  <span className="text-[9px] bg-red-950 text-red-400 border border-red-800/60 px-1.5 py-0.5 rounded font-mono font-bold">
                                    YouTube
                                  </span>
                                ) : (
                                  <span className="text-[9px] bg-pink-950 text-pink-400 border border-pink-800/60 px-1.5 py-0.5 rounded font-mono font-bold">
                                    آپارات
                                  </span>
                                )}
                                <span className="text-[10px] text-stone-500 font-mono">{comment.date}</span>
                              </div>
                            </div>
                            <p className="text-[11px] text-stone-300 leading-relaxed font-sans">{comment.text}</p>
                            {comment.likesCount !== undefined && comment.likesCount > 0 && (
                              <div className="flex items-center gap-1 text-[10px] text-stone-400 pt-0.5">
                                <ThumbsUp className="w-2.5 h-2.5 text-amber-500" />
                                <span>{comment.likesCount}</span>
                              </div>
                            )}
                          </div>
                        ))}
                      </div>
                    ) : (
                      <p className="text-[11px] text-stone-400 text-center py-2">
                        {isFa
                          ? 'هنوز کامنتی برای این اثر همگام نشده است. از پنل استودیو می‌توانید کامنت‌ها را دریافت کنید.'
                          : 'No synced comments yet. Sync via Admin Studio.'}
                      </p>
                    )}
                    <p className="text-[10px] text-stone-500 text-center font-mono">
                      {isFa ? 'بدون نیاز به فیلترشکن مستقیم از وب‌سایت سینا ضرغامی' : 'Accessible directly without VPN'}
                    </p>
                  </div>
                </div>

                {/* Purchase or Video Commission Call-to-Action inside Lightbox */}
                {activePhoto.isVideo || activePhoto.category === 'video' || activePhoto.category === 'commercial-video' ? (
                  <div className="pt-4 border-t border-stone-800 space-y-3">
                    <div className="flex items-center justify-between text-xs font-mono">
                      <span className="text-stone-400">{isFa ? 'کیفیت و رزولوشن ضبط:' : 'Capture Quality:'}</span>
                      <span className="text-sm font-bold text-red-400 font-mono">
                        {activePhoto.videoQuality || '4K 60fps C-Log3'}
                      </span>
                    </div>

                    <a
                      href="#services"
                      onClick={() => setActivePhoto(null)}
                      className="w-full py-3 bg-red-600 hover:bg-red-500 text-white text-xs sm:text-sm font-bold rounded-xl transition-all shadow-lg flex items-center justify-center gap-2 cursor-pointer"
                    >
                      <Film className="w-4 h-4" />
                      <span>{isFa ? 'سفارش فیلمبرداری و تیزر تبلیغاتی' : 'Book Cinematography Project'}</span>
                    </a>

                    <p className="text-[11px] text-stone-500 text-center">
                      {isFa
                        ? 'تولید تیزر نمایشگاهی، معرفی محصول، تصویربرداری هوایی ۳۶۰ و ریلز اینستاگرام'
                        : 'Commercial teasers, product launch, 360° aerial & social reels.'}
                    </p>
                  </div>
                ) : activePhoto.printAvailable ? (
                  <div className="pt-4 border-t border-stone-800 space-y-3">
                    <div className="flex items-center justify-between text-xs font-mono">
                      <span className="text-stone-400">{isFa ? 'برآورد شروع قیمت:' : 'Starts at:'}</span>
                      <span className="text-base font-black text-amber-400">
                        {isFa
                          ? `${(activePhoto.digitalPriceToman || activePhoto.printPriceToman).toLocaleString()} تومان`
                          : `$${activePhoto.digitalPriceUsd || activePhoto.printPriceUsd}`}
                      </span>
                    </div>

                    <button
                      onClick={() => {
                        const target = activePhoto;
                        setActivePhoto(null);
                        handleSelectPrint(target);
                      }}
                      className="w-full py-3 bg-amber-600 hover:bg-amber-500 text-white text-xs sm:text-sm font-bold rounded-xl transition-all shadow-lg flex items-center justify-center gap-2 cursor-pointer"
                    >
                      <ShoppingBag className="w-4 h-4" />
                      <span>{isFa ? 'سفارش نسخه چاپی موزه یا لایسنس دیجیتال' : 'Order Print or Digital License'}</span>
                    </button>

                    <p className="text-[11px] text-stone-500 text-center">
                      {isFa
                        ? 'شامل صدور فاکتور رسمی، بسته‌بندی نفیس و هماهنگی مستقیم در تلگرام سینا ضرغامی'
                        : 'Includes invoice, archival certificate and direct support.'}
                    </p>
                  </div>
                ) : null}
              </div>
            </div>
          </div>
        </div>
      )}
    </section>
  );
};
