import React from 'react';
import { AboutBioContent, Language, ProfileContent } from '../types';
import {
  Camera,
  Compass,
  Code2,
  GraduationCap,
  MapPin,
  Send,
  Instagram,
  Youtube,
  Video,
  Mail,
  Phone,
  MessageCircle,
  Sparkles,
  ArrowRight,
  ArrowLeft,
  CheckCircle2,
} from 'lucide-react';

interface AboutPageProps {
  aboutBio?: AboutBioContent;
  profile: ProfileContent;
  language: Language;
  onNavigate: (path: string) => void;
}

export const AboutPage: React.FC<AboutPageProps> = ({
  aboutBio,
  profile,
  language,
  onNavigate,
}) => {
  const isFa = language === 'fa';

  const headline = isFa
    ? aboutBio?.headlineFa || profile.heroHeadlineMainFa + ' ' + profile.heroHeadlineHighlightFa
    : aboutBio?.headlineEn || profile.heroHeadlineMainEn + ' ' + profile.heroHeadlineHighlightEn;

  const story = isFa
    ? aboutBio?.storyFa || profile.aboutFa
    : aboutBio?.storyEn || profile.aboutEn;

  const philosophy = isFa
    ? aboutBio?.philosophyFa || 'اصالت نور طبیعی، احترام به طبیعت بیابانی، و تعهد به کیفیت موزه در تک تک فریم‌ها.'
    : aboutBio?.philosophyEn || 'Authentic natural light, ecological respect, and archival museum-grade quality in every single frame.';

  const specialties = isFa
    ? aboutBio?.specialtiesFa || [
        'فیلمبرداری صنعتی و تبلیغاتی با استاندارد 4K 10-bit',
        'عکاسی هایپرمکرو میکروسکوپی از حشرات و قطعات دقیق',
        'سرپرستی و اجرای تورهای آفرود و اکوتوریسم در بیراهه‌ها',
        'تدریس در مجتمع فنی تهران و دانشگاه',
        'توسعه نرم‌افزارهای تحت وب و ابزارهای چندرسانه‌ای',
      ]
    : aboutBio?.specialtiesEn || [
        '4K 10-bit Industrial & Commercial Cinematography',
        'Microscopic Hyper-Macro Photography & Focus Stacking',
        'Off-road Wilderness Expedition Leadership',
        'Visual Arts Lecturing at Tehran Technical Complex',
        'Web Application Engineering & Digital Tool Crafting',
      ];

  const phone = aboutBio?.phone || profile.phone || '09127193767';
  const email = aboutBio?.email || profile.email || 'szarghami1995028@gmail.com';
  const telegram = aboutBio?.telegramUrl || profile.telegram || 'https://t.me/sina_zarghami';
  const instagram = aboutBio?.instagramUrl || profile.instagram || 'https://www.instagram.com/sina.zarghami';
  const youtube = aboutBio?.youtubeUrl || profile.youtube || 'https://www.youtube.com/@sina.zarghami';
  const aparat = aboutBio?.aparatUrl || 'https://www.aparat.com/sinazarghami';
  const location = isFa
    ? aboutBio?.locationFa || profile.locationFa
    : aboutBio?.locationEn || profile.locationEn;

  return (
    <div className="py-16 md:py-24 bg-white border-b border-stone-200/80">
      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 space-y-16">
        {/* Top Header */}
        <div className="space-y-4 max-w-3xl">
          <div className="flex items-center gap-2 text-xs font-mono uppercase tracking-wider text-amber-800 font-bold">
            <span className="w-2 h-2 rounded-full bg-amber-700" />
            <span>{isFa ? 'درباره من و هویت استودیو' : 'About Me & Studio Vision'}</span>
          </div>
          <h1 className="text-3xl sm:text-4xl md:text-5xl font-extrabold text-stone-900 tracking-tight leading-[1.2]">
            {headline}
          </h1>
          <p className="text-stone-500 font-mono text-xs sm:text-sm flex items-center gap-1.5">
            <MapPin className="w-3.5 h-3.5 text-amber-700" />
            <span>{location}</span>
          </p>
        </div>

        {/* Narrative & Photo Split */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-12 items-start">
          <div className="lg:col-span-7 space-y-8">
            {/* Story Paragraphs */}
            <div className="prose prose-stone text-base sm:text-lg text-stone-700 leading-relaxed space-y-4">
              <p className="whitespace-pre-line">{story}</p>
            </div>

            {/* Philosophy Callout */}
            <div className="p-6 rounded-2xl bg-stone-50 border border-stone-200/90 space-y-2">
              <div className="text-xs font-mono text-amber-800 font-bold uppercase tracking-wider">
                {isFa ? 'منشور و رویکرد حرفه‌ای:' : 'Artistic Philosophy:'}
              </div>
              <p className="text-sm sm:text-base text-stone-800 font-medium italic">
                «{philosophy}»
              </p>
            </div>

            {/* Core Specialties */}
            <div className="space-y-4">
              <h3 className="text-lg font-bold text-stone-900 tracking-tight">
                {isFa ? 'محورهای تخصصی فعالیت:' : 'Areas of Expertise:'}
              </h3>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                {specialties.map((spec, i) => (
                  <div
                    key={i}
                    className="flex items-start gap-2.5 p-3 rounded-xl bg-stone-50/70 border border-stone-100 text-xs sm:text-sm text-stone-700"
                  >
                    <CheckCircle2 className="w-4 h-4 text-amber-700 shrink-0 mt-0.5" />
                    <span>{spec}</span>
                  </div>
                ))}
              </div>
            </div>

            {/* CTAs */}
            <div className="flex flex-wrap items-center gap-3 pt-4">
              <button
                onClick={() => onNavigate('/order')}
                className="px-6 py-3 bg-amber-600 hover:bg-amber-500 text-white font-bold text-xs sm:text-sm rounded-xl transition-all shadow-xs flex items-center gap-2 cursor-pointer"
              >
                <Sparkles className="w-4 h-4" />
                <span>{isFa ? 'سفارش پروژه و استعلام همکاری' : 'Start a Project'}</span>
              </button>
              <button
                onClick={() => onNavigate('/portfolio')}
                className="px-6 py-3 bg-stone-100 hover:bg-stone-200 text-stone-900 font-semibold text-xs sm:text-sm rounded-xl transition-all cursor-pointer flex items-center gap-2"
              >
                <span>{isFa ? 'مشاهده نمونه‌کارها' : 'View Portfolio'}</span>
                {isFa ? <ArrowLeft className="w-4 h-4" /> : <ArrowRight className="w-4 h-4" />}
              </button>
            </div>
          </div>

          {/* Side Portrait & Direct Contact Grid */}
          <div className="lg:col-span-5 space-y-6">
            <div className="relative aspect-4/5 rounded-2xl overflow-hidden bg-stone-900 shadow-lg border border-stone-200">
              <img
                src="https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?auto=format&fit=crop&w=1000&q=80"
                alt="Sina Zarghami"
                className="w-full h-full object-cover"
              />
              <div className="absolute inset-0 bg-gradient-to-t from-stone-950/80 via-transparent to-transparent pointer-events-none" />
              <div className="absolute bottom-0 inset-x-0 p-6 text-white space-y-1">
                <div className="text-xs font-mono text-amber-400">سینا ضرغامی · Sina Zarghami</div>
                <div className="text-sm font-semibold">
                  {isFa ? 'عکاس، فیلمبردار، راهنمای سفر و برنامه‌نویس' : 'Visual Artist, Expedition Leader & Engineer'}
                </div>
              </div>
            </div>

            {/* Contact Cards in Side Column */}
            <div className="p-6 bg-stone-50 border border-stone-200 rounded-2xl space-y-4">
              <h4 className="text-sm font-bold text-stone-900 tracking-tight">
                {isFa ? 'ارتباط مستقیم و شبکه‌های اجتماعی:' : 'Direct Communication Channels:'}
              </h4>
              <div className="grid grid-cols-2 gap-2 text-xs">
                <a
                  href={`tel:${phone}`}
                  className="p-3 bg-white hover:bg-amber-50/50 border border-stone-200 rounded-xl flex items-center gap-2 text-stone-700 transition-colors"
                >
                  <Phone className="w-4 h-4 text-amber-700 shrink-0" />
                  <span className="font-mono truncate">{phone}</span>
                </a>
                <a
                  href={telegram}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="p-3 bg-white hover:bg-sky-50/50 border border-stone-200 rounded-xl flex items-center gap-2 text-stone-700 transition-colors"
                >
                  <Send className="w-4 h-4 text-sky-600 shrink-0" />
                  <span className="truncate">تلگرام</span>
                </a>
                <a
                  href={instagram}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="p-3 bg-white hover:bg-pink-50/50 border border-stone-200 rounded-xl flex items-center gap-2 text-stone-700 transition-colors"
                >
                  <Instagram className="w-4 h-4 text-pink-600 shrink-0" />
                  <span className="truncate">اینستاگرام</span>
                </a>
                <a
                  href={`https://wa.me/98${phone.replace(/^0/, '')}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="p-3 bg-white hover:bg-emerald-50/50 border border-stone-200 rounded-xl flex items-center gap-2 text-stone-700 transition-colors"
                >
                  <MessageCircle className="w-4 h-4 text-emerald-600 shrink-0" />
                  <span className="truncate">واتساپ</span>
                </a>
                <a
                  href={youtube}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="p-3 bg-white hover:bg-red-50/50 border border-stone-200 rounded-xl flex items-center gap-2 text-stone-700 transition-colors"
                >
                  <Youtube className="w-4 h-4 text-red-600 shrink-0" />
                  <span className="truncate">یوتیوب</span>
                </a>
                <a
                  href={aparat}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="p-3 bg-white hover:bg-rose-50/50 border border-stone-200 rounded-xl flex items-center gap-2 text-stone-700 transition-colors"
                >
                  <Video className="w-4 h-4 text-rose-500 shrink-0" />
                  <span className="truncate">آپارات</span>
                </a>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
