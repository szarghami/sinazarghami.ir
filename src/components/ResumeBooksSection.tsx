import React, { useState } from 'react';
import { BookItem, Language, ResumeEntry } from '../types';
import {
  Briefcase,
  Award,
  GraduationCap,
  BookOpen,
  Download,
  Mail,
  Check,
  Bell,
  ExternalLink,
  ShoppingBag,
} from 'lucide-react';
import { getReliableImageUrl } from '../utils/supabase';

interface ResumeBooksSectionProps {
  resume: ResumeEntry[];
  books: BookItem[];
  language: Language;
}

export const ResumeBooksSection: React.FC<ResumeBooksSectionProps> = ({
  resume,
  books,
  language,
}) => {
  const isFa = language === 'fa';
  const [activeTab, setActiveTab] = useState<'all' | 'experience' | 'exhibition' | 'award' | 'education'>('all');
  const [bookInterestEmail, setBookInterestEmail] = useState('');
  const [bookInterestRegistered, setBookInterestRegistered] = useState(false);
  const [failedBookCovers, setFailedBookCovers] = useState<Record<string, boolean>>({});

  const filteredResume = activeTab === 'all'
    ? resume
    : resume.filter((r) => r.type === activeTab);

  const handleBookNotify = (e: React.FormEvent) => {
    e.preventDefault();
    if (!bookInterestEmail) return;
    setBookInterestRegistered(true);
  };

  return (
    <section id="resume" className="py-20 bg-white border-b border-stone-200/70">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 space-y-20">
        {/* PART 1: Interactive Resume */}
        <div>
          <div className="flex flex-col md:flex-row md:items-end justify-between gap-6 mb-12">
            <div className="space-y-3">
              <div className="flex items-center gap-2 text-xs font-mono uppercase tracking-wider text-stone-500">
                <span>05</span>
                <span aria-hidden="true">·</span>
                <span>{isFa ? 'سوابق، نمایشگاه‌ها و تجارب' : 'Curriculum Vitae'}</span>
              </div>
              <h2 className="text-2xl sm:text-3xl md:text-4xl font-extrabold text-stone-900 tracking-tight">
                {isFa ? 'سوابق کاری، تدریس در مجتمع فنی و افتخارات' : 'Career Trajectory, Lecturing & Honors'}
              </h2>
              <p className="text-sm sm:text-base text-stone-600 max-w-xl">
                {isFa
                  ? 'مروری بر تجارب مستندسازی، تدریس دوره‌های عکاسی و فیلمبرداری در مجتمع فنی تهران، جوایز نمایشگاه ماکرو و پروژه‌های برندهای معتبر.'
                  : 'A curated timeline spanning wilderness documentation, educational lecturing at Tehran Technical Complex, fine-art macro gallery awards, and corporate production.'}
              </p>
            </div>

            {/* Filter Tabs */}
            <div className="flex items-center gap-1 p-1 bg-stone-100 rounded-lg max-w-fit overflow-x-auto">
              {[
                { id: 'all', labelFa: 'همه موارد', labelEn: 'All' },
                { id: 'experience', labelFa: 'سوابق کاری و تدریس', labelEn: 'Experience' },
                { id: 'award', labelFa: 'جوایز و رتبه‌ها', labelEn: 'Awards' },
                { id: 'exhibition', labelFa: 'نمایشگاه‌ها', labelEn: 'Exhibitions' },
                { id: 'education', labelFa: 'تحصیلات و دوره‌ها', labelEn: 'Education' },
              ].map((tab) => (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id as any)}
                  className={`px-3 py-1.5 text-xs font-medium rounded-md transition-all cursor-pointer whitespace-nowrap ${
                    activeTab === tab.id ? 'bg-white text-stone-900 shadow-xs font-bold' : 'text-stone-600 hover:text-stone-900'
                  }`}
                >
                  {isFa ? tab.labelFa : tab.labelEn}
                </button>
              ))}
            </div>
          </div>

          {/* Timeline List */}
          <div className="space-y-6 max-w-4xl">
            {filteredResume.map((item) => {
              const Icon = item.type === 'experience'
                ? Briefcase
                : item.type === 'award' || item.type === 'exhibition'
                ? Award
                : GraduationCap;

              return (
                <div
                  key={item.id}
                  className="p-6 rounded-2xl bg-stone-50/70 border border-stone-200/90 hover:bg-stone-50 hover:border-stone-300 transition-all flex flex-col sm:flex-row gap-5 items-start shadow-2xs"
                >
                  <div className="p-2.5 bg-white border border-stone-200 rounded-xl text-amber-800 shrink-0 shadow-2xs">
                    <Icon className="w-5 h-5" />
                  </div>

                  <div className="space-y-2 flex-1">
                    <div className="flex flex-wrap items-center justify-between gap-2">
                      <h3 className="text-base sm:text-lg font-bold text-stone-900">
                        {isFa ? item.titleFa : item.titleEn}
                      </h3>
                      <span className="text-xs font-mono text-stone-500 tabular-nums bg-white px-2.5 py-1 rounded-md border border-stone-200">
                        {item.period}
                      </span>
                    </div>

                    <div className="flex items-center gap-2">
                      <span className="text-xs font-bold text-amber-800 font-mono">
                        {isFa ? item.organizationFa : item.organizationEn}
                      </span>
                      {item.linkUrl && (
                        <a
                          href={item.linkUrl}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="inline-flex items-center gap-1 text-[11px] text-stone-500 hover:text-amber-700 underline font-mono"
                        >
                          <ExternalLink className="w-3 h-3" />
                          <span>{isFa ? 'مشاهده سند / گزارش' : 'Verify'}</span>
                        </a>
                      )}
                    </div>

                    <p className="text-xs sm:text-sm text-stone-600 leading-relaxed pt-1">
                      {isFa ? item.descriptionFa : item.descriptionEn}
                    </p>
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* PART 2: Books & Publications */}
        <div className="pt-12 border-t border-stone-100">
          <div className="max-w-3xl mb-12 space-y-3">
            <div className="flex items-center gap-2 text-xs font-mono uppercase tracking-wider text-stone-500">
              <span>06</span>
              <span aria-hidden="true">·</span>
              <span>{isFa ? 'کتاب‌ها و انتشارات رسمی' : 'Books & Publications'}</span>
            </div>
            <h2 className="text-2xl sm:text-3xl md:text-4xl font-extrabold text-stone-900 tracking-tight">
              {isFa ? 'کتاب‌های تالیفی و مونوگراف‌های سینا ضرغامی' : 'Published Books & Monograph Releases'}
            </h2>
            <p className="text-sm sm:text-base text-stone-600 leading-relaxed">
              {isFa
                ? 'ثبت و تدوین دستاوردهای اپتیکال و عکاسی در قالب کتاب‌های چاپی مرجع و راهنماهای میدانی.'
                : 'Distilling optical mastery into published photography manuals and luxury hardbound monographs.'}
            </p>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
            {books.map((book) => (
              <div
                key={book.id}
                className="bg-stone-50/80 rounded-2xl p-6 sm:p-8 border border-stone-200/90 flex flex-col sm:flex-row gap-6 items-start justify-between shadow-2xs hover:shadow-md transition-shadow"
              >
                {/* Book Cover Container */}
                {failedBookCovers[book.id] ? (
                  <div className="w-full sm:w-44 shrink-0 aspect-3/4 rounded-xl overflow-hidden bg-stone-800 flex items-center justify-center p-4 text-white text-center shadow-md border border-stone-700">
                    <span className="text-xs font-mono select-none">{isFa ? book.titleFa : book.titleEn}</span>
                  </div>
                ) : (
                  <div className="w-full sm:w-44 shrink-0 aspect-3/4 rounded-xl overflow-hidden bg-white shadow-md border border-stone-200 relative group">
                    <img
                      src={getReliableImageUrl(book.coverImage)}
                      alt={isFa ? book.titleFa : book.titleEn}
                      className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105"
                      referrerPolicy="no-referrer"
                      onError={(e) => {
                        const target = e.currentTarget as HTMLImageElement;
                        if (book.coverImage && target.src !== book.coverImage) {
                          target.src = book.coverImage;
                          return;
                        }
                        setFailedBookCovers((prev) => ({ ...prev, [book.id]: true }));
                      }}
                    />
                    <div className="absolute inset-0 bg-stone-950/15 pointer-events-none" />
                  </div>
                )}

                {/* Book Content */}
                <div className="space-y-4 flex-1 flex flex-col justify-between h-full">
                  <div className="space-y-2">
                    <span className="text-xs font-mono text-amber-800 font-bold block bg-amber-100/70 w-fit px-2.5 py-0.5 rounded-md">
                      {isFa ? book.statusFa : book.statusEn}
                    </span>
                    <h3 className="text-lg sm:text-xl font-bold text-stone-900 tracking-tight">
                      {isFa ? book.titleFa : book.titleEn}
                    </h3>
                    <p className="text-xs font-medium text-stone-500">
                      {isFa ? book.subtitleFa : book.subtitleEn}
                    </p>
                    <p className="text-xs sm:text-sm text-stone-600 leading-relaxed pt-1">
                      {isFa ? book.descriptionFa : book.descriptionEn}
                    </p>
                  </div>

                  <div className="pt-3 border-t border-stone-200/80 space-y-3">
                    <div className="text-[11px] font-mono text-stone-500 space-y-0.5">
                      <div>{isFa ? 'مشخصات: ' : 'Format: '}{book.pages}</div>
                      <div>{isFa ? 'ناشر: ' : 'Publisher: '}{isFa ? book.publisherFa : book.publisherEn}</div>
                    </div>

                    {book.purchaseUrl ? (
                      <div className="pt-1">
                        <a
                          href={book.purchaseUrl}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="w-full sm:w-auto px-4 py-2.5 bg-amber-700 hover:bg-amber-800 text-white text-xs font-bold rounded-xl transition-all shadow-xs flex items-center justify-center gap-2"
                        >
                          <ShoppingBag className="w-4 h-4" />
                          <span>{isFa ? 'تهیه کتاب از وب‌سایت کتاب‌عکس' : 'Purchase Book at Ketab-e-Aks'}</span>
                          <ExternalLink className="w-3.5 h-3.5" />
                        </a>
                      </div>
                    ) : (
                      <>
                        {bookInterestRegistered ? (
                          <div className="p-2.5 bg-emerald-50 text-emerald-800 rounded-lg text-xs font-medium flex items-center gap-1.5 border border-emerald-200">
                            <Check className="w-4 h-4 text-emerald-600" />
                            <span>{isFa ? 'ایمیل شما برای پیش‌فروش کتاب ثبت شد.' : 'Email registered for pre-order launch.'}</span>
                          </div>
                        ) : (
                          <form onSubmit={handleBookNotify} className="flex gap-2">
                            <input
                              type="email"
                              required
                              placeholder={isFa ? 'ایمیل جهت اطلاع از انتشار' : 'Email for launch notice'}
                              value={bookInterestEmail}
                              onChange={(e) => setBookInterestEmail(e.target.value)}
                              className="flex-1 px-3 py-1.5 text-xs bg-white border border-stone-300 rounded-lg focus:outline-none focus:ring-1 focus:ring-amber-600"
                            />
                            <button
                              type="submit"
                              className="px-3.5 py-1.5 bg-stone-900 hover:bg-stone-800 text-white text-xs font-medium rounded-lg whitespace-nowrap flex items-center gap-1 cursor-pointer"
                            >
                              <Bell className="w-3.5 h-3.5" />
                              <span>{isFa ? 'اطلاع‌رسانی' : 'Notify'}</span>
                            </button>
                          </form>
                        )}
                      </>
                    )}
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
};
