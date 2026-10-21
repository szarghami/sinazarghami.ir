import React, { useState } from 'react';
import { ExpeditionItem, Language, PhotoItem } from '../types';
import {
  Compass,
  Calendar,
  Clock,
  MapPin,
  CheckCircle2,
  ArrowUpRight,
  Send,
  X,
  Camera,
  Layers,
  Sparkles,
  Eye,
  Maximize2,
  Flag,
} from 'lucide-react';
import { notifyExpeditionInquiry } from '../utils/telegram';
import { getReliableImageUrl } from '../utils/supabase';

interface ExpeditionsSectionProps {
  expeditions: ExpeditionItem[];
  photos?: PhotoItem[];
  language: Language;
  onNavigate?: (path: string) => void;
  onSelectPrint?: (photo: PhotoItem) => void;
}

export const ExpeditionsSection: React.FC<ExpeditionsSectionProps> = ({
  expeditions = [],
  photos = [],
  language,
  onNavigate = () => {},
  onSelectPrint,
}) => {
  const isFa = language === 'fa';
  const [activeTab, setActiveTab] = useState<'all' | 'travelogues' | 'tours' | 'gallery'>('all');
  const [selectedExpedition, setSelectedExpedition] = useState<ExpeditionItem | null>(null);
  const [activePhoto, setActivePhoto] = useState<PhotoItem | null>(null);
  const [inquiryName, setInquiryName] = useState('');
  const [inquiryContact, setInquiryContact] = useState('');
  const [inquirySent, setInquirySent] = useState(false);

  // ۱. سفرهای من (سفرنامه‌های شخصی و اکتشافات میدانی)
  const travelogues = expeditions.filter(
    (e) => !e.tripType || e.tripType === 'travelogue' || e.tripType === 'personal_expedition'
  );

  // ۲. تورها (تورهای هدایت‌شده، اجراشده و در حال ثبت‌نام)
  const tours = expeditions.filter(
    (e) => e.tripType === 'tour' || e.tripType === 'guided_tour'
  );

  // ۳. گالری عکس‌های سفر (عکس‌هایی با portfolioScope === 'travel' یا پیش‌فرض عکس‌های چشم‌انداز و کویر)
  const travelPhotos = photos.filter(
    (p) => p.portfolioScope === 'travel' || p.category === 'landscape' || p.category === 'documentary'
  );

  const handleSubmitInquiry = (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedExpedition) return;
    setInquirySent(true);

    const tripTitle = isFa ? selectedExpedition.titleFa : selectedExpedition.titleEn;

    notifyExpeditionInquiry({
      expeditionTitle: tripTitle,
      name: inquiryName,
      contact: inquiryContact,
    });
  };

  return (
    <section id="expeditions" className="py-20 sm:py-24 bg-white border-b border-stone-200">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 space-y-12">
        {/* Section Header */}
        <div className="flex flex-col md:flex-row md:items-end justify-between gap-6">
          <div className="max-w-3xl space-y-3">
            <div className="flex items-center gap-2 text-xs font-mono uppercase tracking-wider text-amber-800 font-bold">
              <Compass className="w-4 h-4 text-amber-700" />
              <span>{isFa ? 'کاوش در اقلیم‌های بکر و بیراهه‌ها' : 'Wilderness & Guided Expeditions'}</span>
            </div>
            <h1 className="text-3xl sm:text-4xl md:text-5xl font-extrabold text-stone-900 tracking-tight">
              {isFa ? 'سفرنامه‌ها، تورها و مستندهای میدانی' : 'Travelogues, Treks & Field Stories'}
            </h1>
            <p className="text-sm sm:text-base text-stone-600 leading-relaxed">
              {isFa
                ? 'پیمایش اعماق کویر لوت، ریگ یلان، دره‌های زاگرس و جزایر خلیج فارس به سرپرستی سینا ضرغامی با تجهیزات آفرود، مسترکلاس عکاسی نجومی و راهنمای رسمی اکوتوریسم.'
                : 'Certified wilderness navigation across Iran’s untamed deserts, alpine folds, and Persian Gulf salt caves with specialized landscape & astrophotography coaching.'}
            </p>
          </div>

          {/* ۳ بخش مجزا بر اساس درخواست کاربر */}
          <div className="flex flex-wrap items-center gap-2 bg-stone-100 p-1.5 rounded-xl self-start md:self-auto border border-stone-200/80">
            <button
              onClick={() => setActiveTab('all')}
              className={`px-3.5 py-1.5 rounded-lg text-xs font-semibold transition-all cursor-pointer ${
                activeTab === 'all'
                  ? 'bg-white text-stone-900 shadow-xs'
                  : 'text-stone-600 hover:text-stone-900'
              }`}
            >
              {isFa ? 'همه بخش‌ها' : 'All Sections'}
            </button>

            <button
              onClick={() => setActiveTab('travelogues')}
              className={`px-3.5 py-1.5 rounded-lg text-xs font-semibold transition-all cursor-pointer ${
                activeTab === 'travelogues'
                  ? 'bg-white text-stone-900 shadow-xs'
                  : 'text-stone-600 hover:text-stone-900'
              }`}
            >
              {isFa ? 'سفرهای من (سفرنامه‌ها)' : 'Travelogues'}
            </button>

            <button
              onClick={() => setActiveTab('tours')}
              className={`px-3.5 py-1.5 rounded-lg text-xs font-semibold transition-all cursor-pointer ${
                activeTab === 'tours'
                  ? 'bg-white text-stone-900 shadow-xs'
                  : 'text-stone-600 hover:text-stone-900'
              }`}
            >
              {isFa ? 'تورها (اجراشده و پیش‌رو)' : 'Guided Tours'}
            </button>

            <button
              onClick={() => setActiveTab('gallery')}
              className={`px-3.5 py-1.5 rounded-lg text-xs font-semibold transition-all cursor-pointer ${
                activeTab === 'gallery'
                  ? 'bg-white text-stone-900 shadow-xs'
                  : 'text-stone-600 hover:text-stone-900'
              }`}
            >
              {isFa ? 'گالری عکس‌های سفر' : 'Travel Photo Gallery'}
            </button>
          </div>
        </div>

        {/* بخش ۱: سفرهای من (سفرنامه‌ها) */}
        {(activeTab === 'all' || activeTab === 'travelogues') && (
          <div className="space-y-6 pt-6">
            <div className="flex items-center justify-between border-b border-stone-200 pb-3">
              <div className="flex items-center gap-2">
                <Compass className="w-5 h-5 text-amber-700" />
                <h2 className="text-xl sm:text-2xl font-bold text-stone-900">
                  {isFa ? '۱. سفرهای من (سفرنامه‌ها و اکتشافات میدانی)' : '1. Personal Travelogues & Field Journals'}
                </h2>
              </div>
              <span className="text-xs font-mono text-stone-500">
                {travelogues.length} {isFa ? 'سفرنامه' : 'Journals'}
              </span>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
              {travelogues.map((exp) => (
                <div
                  key={exp.id}
                  className="group bg-stone-50/80 rounded-2xl overflow-hidden border border-stone-200/90 shadow-2xs hover:shadow-md transition-all flex flex-col justify-between"
                >
                  <div>
                    <div className="relative aspect-16/10 overflow-hidden bg-stone-900">
                      <img
                        src={getReliableImageUrl(exp.coverImage)}
                        alt={isFa ? exp.titleFa : exp.titleEn}
                        className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-104"
                        loading="lazy"
                        referrerPolicy="no-referrer"
                      />
                      <div className="absolute top-3 left-3 bg-stone-900/85 backdrop-blur-md text-amber-400 text-xs px-2.5 py-1 rounded-md font-mono">
                        {isFa ? 'سفرنامه شخصی' : 'Field Journal'}
                      </div>
                    </div>

                    <div className="p-6 space-y-4">
                      <div className="flex flex-wrap items-center gap-3 text-xs text-stone-500 font-mono">
                        <span className="flex items-center gap-1 text-amber-800">
                          <MapPin className="w-3.5 h-3.5" />
                          {isFa ? exp.locationFa : exp.locationEn}
                        </span>
                        <span aria-hidden="true">·</span>
                        <span className="flex items-center gap-1">
                          <Clock className="w-3.5 h-3.5" />
                          {isFa ? exp.durationFa : exp.durationEn}
                        </span>
                        <span aria-hidden="true">·</span>
                        <span>{isFa ? exp.seasonFa : exp.seasonEn}</span>
                      </div>

                      <h3 className="text-lg font-bold text-stone-900 leading-snug">
                        {isFa ? exp.titleFa : exp.titleEn}
                      </h3>

                      <p className="text-xs sm:text-sm text-stone-600 leading-relaxed line-clamp-3">
                        {isFa ? exp.descriptionFa : exp.descriptionEn}
                      </p>

                      {exp.highlightsFa && exp.highlightsFa.length > 0 && (
                        <div className="pt-2 space-y-1.5 border-t border-stone-200/60">
                          <div className="text-xs font-semibold text-stone-500">
                            {isFa ? 'یادداشت‌های کلیدی:' : 'Field Highlights:'}
                          </div>
                          <ul className="space-y-1">
                            {(isFa ? exp.highlightsFa : exp.highlightsEn || exp.highlightsFa).map((h, i) => (
                              <li key={i} className="text-xs text-stone-700 flex items-start gap-1.5">
                                <CheckCircle2 className="w-3.5 h-3.5 text-amber-700 shrink-0 mt-0.5" />
                                <span>{h}</span>
                              </li>
                            ))}
                          </ul>
                        </div>
                      )}
                    </div>
                  </div>

                  <div className="p-6 pt-0 border-t border-stone-100 flex items-center justify-between mt-4">
                    <span className="text-xs font-mono text-stone-500">
                      {isFa ? 'درجه سختی: ' : 'Difficulty: '}
                      <span className="font-semibold text-stone-800">{isFa ? exp.difficultyFa : exp.difficultyEn}</span>
                    </span>

                    <button
                      onClick={() => onNavigate(`/articles?slug=${encodeURIComponent(exp.id)}`)}
                      className="px-3.5 py-1.5 text-xs font-semibold text-amber-900 bg-amber-50 hover:bg-amber-100 border border-amber-200/80 rounded-lg transition-colors flex items-center gap-1 cursor-pointer"
                    >
                      <span>{isFa ? 'مطالعه سفرنامه' : 'Read Journal'}</span>
                      <ArrowUpRight className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* بخش ۲: تورها (تورهای هدایت‌شده اجراشده و پیش‌رو) */}
        {(activeTab === 'all' || activeTab === 'tours') && (
          <div className="space-y-6 pt-10">
            <div className="flex items-center justify-between border-b border-stone-200 pb-3">
              <div className="flex items-center gap-2">
                <Flag className="w-5 h-5 text-amber-700" />
                <h2 className="text-xl sm:text-2xl font-bold text-stone-900">
                  {isFa ? '۲. تورها و کاروان‌های اکوتوریسم (اجراشده و پیش‌رو)' : '2. Guided Tours & Upcoming Treks'}
                </h2>
              </div>
              <span className="text-xs font-mono text-stone-500">
                {tours.length} {isFa ? 'برنامه' : 'Tours'}
              </span>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
              {(tours.length > 0 ? tours : expeditions).map((exp) => (
                <div
                  key={exp.id}
                  className="group bg-stone-50/80 rounded-2xl overflow-hidden border border-stone-200/90 shadow-2xs hover:shadow-md transition-all flex flex-col justify-between"
                >
                  <div>
                    <div className="relative aspect-16/10 overflow-hidden bg-stone-900">
                      <img
                        src={getReliableImageUrl(exp.coverImage)}
                        alt={isFa ? exp.titleFa : exp.titleEn}
                        className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-104"
                        loading="lazy"
                        referrerPolicy="no-referrer"
                      />
                      <div className="absolute top-3 left-3 bg-stone-900/85 backdrop-blur-md text-white text-xs px-2.5 py-1 rounded-md font-mono">
                        {exp.bookingOpen
                          ? isFa
                            ? 'ظرفیت ثبت‌نام باز'
                            : 'Open Registration'
                          : isFa
                          ? 'تکمیل ظرفیت / پایان اجرا'
                          : 'Completed / Waitlist'}
                      </div>
                      {exp.upcomingDate && (
                        <div className="absolute bottom-3 right-3 bg-amber-700/95 backdrop-blur-md text-white text-[11px] font-bold px-2.5 py-1 rounded-md">
                          {isFa ? `تاریخ: ${exp.upcomingDate}` : `Date: ${exp.upcomingDate}`}
                        </div>
                      )}
                    </div>

                    <div className="p-6 space-y-4">
                      <div className="flex flex-wrap items-center gap-3 text-xs text-stone-500 font-mono">
                        <span className="flex items-center gap-1 text-amber-800">
                          <MapPin className="w-3.5 h-3.5" />
                          {isFa ? exp.locationFa : exp.locationEn}
                        </span>
                        <span aria-hidden="true">·</span>
                        <span className="flex items-center gap-1">
                          <Clock className="w-3.5 h-3.5" />
                          {isFa ? exp.durationFa : exp.durationEn}
                        </span>
                        <span aria-hidden="true">·</span>
                        <span>{isFa ? exp.seasonFa : exp.seasonEn}</span>
                      </div>

                      <h3 className="text-lg font-bold text-stone-900 leading-snug">
                        {isFa ? exp.titleFa : exp.titleEn}
                      </h3>

                      <p className="text-xs sm:text-sm text-stone-600 leading-relaxed line-clamp-3">
                        {isFa ? exp.descriptionFa : exp.descriptionEn}
                      </p>

                      {exp.highlightsFa && exp.highlightsFa.length > 0 && (
                        <div className="pt-2 space-y-1.5 border-t border-stone-200/60">
                          <div className="text-xs font-semibold text-stone-500">
                            {isFa ? 'خدمات و امکانات تور:' : 'Tour Inclusions & Highlights:'}
                          </div>
                          <ul className="space-y-1">
                            {(isFa ? exp.highlightsFa : exp.highlightsEn || exp.highlightsFa).map((h, i) => (
                              <li key={i} className="text-xs text-stone-700 flex items-start gap-1.5">
                                <CheckCircle2 className="w-3.5 h-3.5 text-amber-700 shrink-0 mt-0.5" />
                                <span>{h}</span>
                              </li>
                            ))}
                          </ul>
                        </div>
                      )}
                    </div>
                  </div>

                  <div className="p-6 pt-0 border-t border-stone-100 flex items-center justify-between mt-4">
                    <div className="text-xs font-mono text-stone-500">
                      {isFa ? 'سختی: ' : 'Level: '}
                      <span className="font-semibold text-stone-800">{isFa ? exp.difficultyFa : exp.difficultyEn}</span>
                    </div>

                    <button
                      onClick={() => {
                        setSelectedExpedition(exp);
                        setInquirySent(false);
                      }}
                      className="px-4 py-2 text-xs font-bold text-white bg-stone-900 hover:bg-stone-800 rounded-lg transition-colors flex items-center gap-1 cursor-pointer"
                    >
                      <span>{isFa ? 'رزرو و استعلام تور' : 'Reserve Spot'}</span>
                      <ArrowUpRight className="w-3.5 h-3.5 text-amber-400" />
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* بخش ۳: گالری عکس‌های سفر */}
        {(activeTab === 'all' || activeTab === 'gallery') && (
          <div className="space-y-6 pt-10">
            <div className="flex items-center justify-between border-b border-stone-200 pb-3">
              <div className="flex items-center gap-2">
                <Camera className="w-5 h-5 text-amber-700" />
                <h2 className="text-xl sm:text-2xl font-bold text-stone-900">
                  {isFa ? '۳. گالری عکس‌های سفر و چشم‌اندازهای میدانی' : '3. Travel & Expedition Photo Gallery'}
                </h2>
              </div>
              <span className="text-xs font-mono text-stone-500">
                {travelPhotos.length} {isFa ? 'عکس' : 'Photos'}
              </span>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
              {travelPhotos.map((photo) => (
                <div
                  key={photo.id}
                  onClick={() => setActivePhoto(photo)}
                  className="group bg-stone-50 rounded-2xl overflow-hidden border border-stone-200/80 shadow-2xs hover:shadow-md transition-all cursor-pointer flex flex-col justify-between"
                >
                  <div className="relative aspect-16/10 overflow-hidden bg-stone-900">
                    <img
                      src={getReliableImageUrl(photo.imageUrl)}
                      alt={isFa ? photo.titleFa : photo.titleEn}
                      className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-104"
                      loading="lazy"
                      referrerPolicy="no-referrer"
                    />
                    <div className="absolute top-3 right-3 bg-stone-900/80 backdrop-blur-md text-white text-[11px] font-mono px-2 py-0.5 rounded">
                      {photo.year}
                    </div>
                  </div>

                  <div className="p-4 space-y-2">
                    <div className="flex items-center gap-1.5 text-xs text-amber-800 font-mono">
                      <MapPin className="w-3.5 h-3.5" />
                      <span>{isFa ? photo.locationFa : photo.locationEn}</span>
                    </div>
                    <h3 className="text-base font-bold text-stone-900 group-hover:text-amber-800 transition-colors line-clamp-1">
                      {isFa ? photo.titleFa : photo.titleEn}
                    </h3>
                    <p className="text-xs text-stone-600 line-clamp-2">
                      {isFa ? photo.descriptionFa : photo.descriptionEn}
                    </p>
                  </div>

                  <div className="p-3 border-t border-stone-100 flex items-center justify-between text-xs text-stone-500 font-mono">
                    <span>{photo.camera}</span>
                    <span className="text-amber-800 flex items-center gap-1 font-semibold">
                      <Eye className="w-3.5 h-3.5" />
                      {isFa ? 'مشاهده بزرگ' : 'View'}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>

      {/* فرم مدال رزرو تور */}
      {selectedExpedition && (
        <div className="fixed inset-0 z-50 bg-stone-950/70 backdrop-blur-xs flex items-center justify-center p-4 animate-in fade-in">
          <div className="relative w-full max-w-lg bg-white rounded-2xl p-6 sm:p-8 shadow-2xl border border-stone-200 space-y-5">
            <button
              onClick={() => setSelectedExpedition(null)}
              className="absolute top-4 left-4 p-1.5 text-stone-400 hover:text-stone-700 rounded-md cursor-pointer"
            >
              <X className="w-5 h-5" />
            </button>

            <div className="space-y-1">
              <span className="text-xs font-mono uppercase tracking-wider text-amber-700 font-bold">
                {isFa ? 'ثبت درخواست شرکت در تور و سفر' : 'Expedition Reservation'}
              </span>
              <h3 className="text-xl font-bold text-stone-900">
                {isFa ? selectedExpedition.titleFa : selectedExpedition.titleEn}
              </h3>
              <p className="text-xs text-stone-500">
                {isFa
                  ? 'پس از ثبت فرم، هماهنگی لوازم، تجهیزات شب‌مانی و خودرو با شما انجام خواهد شد.'
                  : 'After submission, itinerary & gear coordination will be handled directly.'}
              </p>
            </div>

            {inquirySent ? (
              <div className="p-6 bg-emerald-50 rounded-xl text-center space-y-2 border border-emerald-200">
                <CheckCircle2 className="w-8 h-8 text-emerald-600 mx-auto" />
                <h4 className="text-sm font-bold text-emerald-900">
                  {isFa ? 'درخواست شما با موفقیت به تلگرام سینا ارسال شد' : 'Inquiry Submitted Successfully'}
                </h4>
                <p className="text-xs text-emerald-700">
                  {isFa ? 'به زودی جهت هماهنگی نهایی با شما تماس گرفته می‌شود.' : 'Sina will contact you shortly.'}
                </p>
              </div>
            ) : (
              <form onSubmit={handleSubmitInquiry} className="space-y-4">
                <div>
                  <label className="block text-xs font-medium text-stone-700 mb-1">
                    {isFa ? 'نام و نام خانوادگی' : 'Full Name'}
                  </label>
                  <input
                    type="text"
                    required
                    value={inquiryName}
                    onChange={(e) => setInquiryName(e.target.value)}
                    placeholder={isFa ? 'مثال: علیرضا فلاحی' : 'e.g. Alex Morgan'}
                    className="w-full px-3 py-2 text-sm border border-stone-300 rounded-lg focus:outline-none focus:ring-1 focus:ring-amber-600"
                  />
                </div>

                <div>
                  <label className="block text-xs font-medium text-stone-700 mb-1">
                    {isFa ? 'شماره تماس یا آیدی تلگرام' : 'Phone or Telegram Handle'}
                  </label>
                  <input
                    type="text"
                    required
                    value={inquiryContact}
                    onChange={(e) => setInquiryContact(e.target.value)}
                    placeholder={isFa ? '۰۹۱۲... یا @username' : '+98 912... or @handle'}
                    className="w-full px-3 py-2 text-sm border border-stone-300 rounded-lg focus:outline-none focus:ring-1 focus:ring-amber-600"
                  />
                </div>

                <div className="pt-2">
                  <button
                    type="submit"
                    className="w-full py-2.5 px-4 bg-stone-900 hover:bg-stone-800 text-white text-sm font-semibold rounded-lg transition-colors flex items-center justify-center gap-2 cursor-pointer shadow-xs"
                  >
                    <Send className="w-4 h-4" />
                    <span>{isFa ? 'ارسال درخواست هماهنگی' : 'Submit Expedition Inquiry'}</span>
                  </button>
                </div>
              </form>
            )}
          </div>
        </div>
      )}

      {/* لایتباکس عکس‌های سفر */}
      {activePhoto && (
        <div className="fixed inset-0 z-50 bg-stone-950/90 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="relative max-w-4xl w-full bg-stone-900 rounded-2xl overflow-hidden shadow-2xl border border-stone-800">
            <button
              onClick={() => setActivePhoto(null)}
              className="absolute top-4 right-4 z-10 p-2 bg-stone-800/80 hover:bg-stone-700 text-white rounded-full cursor-pointer"
            >
              <X className="w-5 h-5" />
            </button>
            <div className="aspect-16/10 bg-black flex items-center justify-center">
              <img
                src={getReliableImageUrl(photoUrl(activePhoto))}
                alt={isFa ? activePhoto.titleFa : activePhoto.titleEn}
                className="max-h-[75vh] w-auto max-w-full object-contain"
              />
            </div>
            <div className="p-6 text-white space-y-2">
              <div className="flex items-center justify-between text-xs font-mono text-amber-400">
                <span>{isFa ? activePhoto.locationFa : activePhoto.locationEn} · {activePhoto.year}</span>
                <span>{activePhoto.camera}</span>
              </div>
              <h3 className="text-xl font-bold">{isFa ? activePhoto.titleFa : activePhoto.titleEn}</h3>
              <p className="text-sm text-stone-300">{isFa ? activePhoto.descriptionFa : activePhoto.descriptionEn}</p>
            </div>
          </div>
        </div>
      )}
    </section>
  );
};

function photoUrl(p: PhotoItem): string {
  return p.imageUrl;
}
