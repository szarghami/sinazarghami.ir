import React, { useState } from 'react';
import { ExpeditionItem, Language } from '../types';
import { Compass, Calendar, Clock, MapPin, CheckCircle2, ArrowUpRight, Send, X } from 'lucide-react';
import { notifyExpeditionInquiry } from '../utils/telegram';
import { getReliableImageUrl } from '../utils/supabase';

interface ExpeditionsSectionProps {
  expeditions: ExpeditionItem[];
  language: Language;
}

export const ExpeditionsSection: React.FC<ExpeditionsSectionProps> = ({
  expeditions,
  language,
}) => {
  const isFa = language === 'fa';
  const [selectedExpedition, setSelectedExpedition] = useState<ExpeditionItem | null>(null);
  const [inquiryName, setInquiryName] = useState('');
  const [inquiryContact, setInquiryContact] = useState('');
  const [inquirySent, setInquirySent] = useState(false);

  const handleSubmitInquiry = (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedExpedition) return;
    setInquirySent(true);

    const tripTitle = isFa ? selectedExpedition.titleFa : selectedExpedition.titleEn;

    // ارسال خودکار به بات تلگرام شخصی سینا
    notifyExpeditionInquiry({
      expeditionTitle: tripTitle,
      name: inquiryName,
      contact: inquiryContact,
    });
  };

  return (
    <section id="expeditions" className="py-20 bg-white border-b border-stone-200/70">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Section Header */}
        <div className="max-w-3xl mb-14 space-y-3">
          <div className="flex items-center gap-2 text-xs font-mono uppercase tracking-wider text-stone-500">
            <span>02</span>
            <span aria-hidden="true">·</span>
            <span>{isFa ? 'سفرهای هدایت‌شده و اکوتوریسم' : 'Field Expeditions'}</span>
          </div>
          <h2 className="text-2xl sm:text-3xl md:text-4xl font-extrabold text-stone-900 tracking-tight">
            {isFa ? 'اکتشاف در اقلیم‌های ناشناخته ایران' : 'Wilderness Expeditions & Guiding'}
          </h2>
          <p className="text-sm sm:text-base text-stone-600 leading-relaxed">
            {isFa
              ? 'سفرهای تخصصی عکاسی، نجوم و پیمایش بیراهه‌ها به سرپرستی سینا ضرغامی با مجوز رسمی طبیعت‌گردی و خودروهای مجهز آفرود.'
              : 'Certified guided field expeditions navigating remote deserts, geological wonders, and alpine trails across Iran with specialized photo masterclasses.'}
          </p>
        </div>

        {/* Expeditions Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
          {expeditions.map((exp) => (
            <div
              key={exp.id}
              className="group bg-stone-50/70 rounded-2xl overflow-hidden border border-stone-200/80 shadow-xs hover:shadow-md transition-all flex flex-col justify-between"
            >
              <div>
                {/* Image & Status Tag */}
                <div className="relative aspect-16/10 overflow-hidden bg-stone-100">
                  <img
                    src={getReliableImageUrl(exp.coverImage)}
                    alt={isFa ? exp.titleFa : exp.titleEn}
                    className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-104"
                    loading="lazy"
                    referrerPolicy="no-referrer"
                    onError={(e) => {
                      const t = e.currentTarget as HTMLImageElement;
                      if (exp.coverImage && t.src !== exp.coverImage) {
                        t.src = exp.coverImage;
                      }
                    }}
                  />
                  <div className="absolute top-3 left-3 bg-stone-900/80 backdrop-blur-md text-white text-xs px-3 py-1 rounded-md font-mono">
                    {exp.bookingOpen
                      ? (isFa ? 'ظرفیت باز' : 'Open Registration')
                      : (isFa ? 'تکمیل ظرفیت' : 'Waitlist')}
                  </div>
                </div>

                {/* Details */}
                <div className="p-6 space-y-4">
                  {/* Metadata strip */}
                  <div className="flex flex-wrap items-center gap-3 text-xs text-stone-500 font-mono">
                    <span className="flex items-center gap-1">
                      <MapPin className="w-3.5 h-3.5 text-amber-600" />
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

                  {/* Highlights list */}
                  <div className="pt-2 space-y-1.5 border-t border-stone-200/60">
                    <div className="text-xs font-semibold text-stone-500">
                      {isFa ? 'ویژگی‌های کلیدی سفر:' : 'Key Expedition Highlights:'}
                    </div>
                    <ul className="space-y-1">
                      {(isFa ? exp.highlightsFa : exp.highlightsEn).map((h, i) => (
                        <li key={i} className="text-xs text-stone-700 flex items-start gap-1.5">
                          <CheckCircle2 className="w-3.5 h-3.5 text-amber-600 shrink-0 mt-0.5" />
                          <span>{h}</span>
                        </li>
                      ))}
                    </ul>
                  </div>
                </div>
              </div>

              {/* Bottom CTA */}
              <div className="p-6 pt-0 border-t border-stone-100 flex items-center justify-between">
                <div className="text-xs font-mono text-stone-500">
                  {isFa ? 'سختی: ' : 'Difficulty: '}
                  <span className="font-semibold text-stone-800">
                    {isFa ? exp.difficultyFa : exp.difficultyEn}
                  </span>
                </div>

                <button
                  onClick={() => {
                    setSelectedExpedition(exp);
                    setInquirySent(false);
                  }}
                  className="px-4 py-2 text-xs font-semibold text-stone-900 bg-white hover:bg-stone-100 border border-stone-200 rounded-md transition-colors flex items-center gap-1 cursor-pointer"
                >
                  <span>{isFa ? 'درخواست حضور و رزرو' : 'Book Inquiry'}</span>
                  <ArrowUpRight className="w-3.5 h-3.5 text-amber-700" />
                </button>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Expedition Booking Modal */}
      {selectedExpedition && (
        <div className="fixed inset-0 z-50 bg-stone-950/70 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="relative w-full max-w-lg bg-white rounded-2xl p-6 sm:p-8 shadow-xl border border-stone-200 space-y-5">
            <button
              onClick={() => setSelectedExpedition(null)}
              className="absolute top-4 right-4 p-1.5 text-stone-400 hover:text-stone-700 rounded-md cursor-pointer"
            >
              <X className="w-5 h-5" />
            </button>

            <div className="space-y-1">
              <span className="text-xs font-mono uppercase tracking-wider text-amber-700">
                {isFa ? 'ثبت درخواست شرکت در سفر' : 'Expedition Reservation'}
              </span>
              <h3 className="text-xl font-bold text-stone-900">
                {isFa ? selectedExpedition.titleFa : selectedExpedition.titleEn}
              </h3>
              <p className="text-xs text-stone-500">
                {isFa
                  ? 'پس از ثبت فرم، هماهنگی تجهیزات و برنامه‌ریزی سفر از طریق تلگرام یا تماس با شما انجام می‌شود.'
                  : 'After submission, itinerary & gear coordination will be handled directly with Sina.'}
              </p>
            </div>

            {inquirySent ? (
              <div className="p-6 bg-emerald-50 rounded-xl text-center space-y-2 border border-emerald-200">
                <CheckCircle2 className="w-8 h-8 text-emerald-600 mx-auto" />
                <h4 className="text-sm font-bold text-emerald-900">
                  {isFa ? 'درخواست شما با موفقیت ثبت شد' : 'Inquiry Submitted'}
                </h4>
                <p className="text-xs text-emerald-700">
                  {isFa ? 'در حال اتصال به پیام‌رسان سینا ضرغامی...' : 'Connecting to Sina via Telegram / WhatsApp...'}
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
                    placeholder={isFa ? 'مثال: رضا محمدی' : 'e.g. Alex Morgan'}
                    className="w-full px-3 py-2 text-sm border border-stone-300 rounded-md focus:outline-none focus:ring-1 focus:ring-amber-600"
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
                    className="w-full px-3 py-2 text-sm border border-stone-300 rounded-md focus:outline-none focus:ring-1 focus:ring-amber-600"
                  />
                </div>

                <div className="pt-2">
                  <button
                    type="submit"
                    className="w-full py-2.5 px-4 bg-stone-900 hover:bg-stone-800 text-white text-sm font-medium rounded-md transition-colors flex items-center justify-center gap-2 cursor-pointer"
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
    </section>
  );
};
