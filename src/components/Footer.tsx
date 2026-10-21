import React from 'react';
import { AboutBioContent, Language, NavLabelsItem } from '../types';
import {
  Instagram,
  Send,
  Linkedin,
  Github,
  Lock,
  Search,
  ArrowUp,
  Youtube,
  Phone,
  Mail,
  Video,
  MessageCircle,
  MapPin,
  ExternalLink,
} from 'lucide-react';

interface FooterProps {
  language: Language;
  onOpenAdmin: () => void;
  onOpenSeo: () => void;
  onNavigate?: (path: string) => void;
  aboutBio?: AboutBioContent;
  navLabels?: NavLabelsItem;
}

export const Footer: React.FC<FooterProps> = ({
  language,
  onOpenAdmin,
  onOpenSeo,
  onNavigate = () => {},
  aboutBio,
  navLabels,
}) => {
  const isFa = language === 'fa';

  const scrollToTop = () => {
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const phone = aboutBio?.phone || '09127193767';
  const email = aboutBio?.email || 'szarghami1995028@gmail.com';
  const telegram = aboutBio?.telegramUrl || 'https://t.me/sina_zarghami';
  const instagram = aboutBio?.instagramUrl || 'https://www.instagram.com/sina.zarghami';
  const youtube = aboutBio?.youtubeUrl || 'https://www.youtube.com/@sina.zarghami';
  const aparat = aboutBio?.aparatUrl || 'https://www.aparat.com/sinazarghami';
  const location = isFa
    ? aboutBio?.locationFa || 'تهران و سفر در سراسر ایران'
    : aboutBio?.locationEn || 'Tehran & Across Iran';

  const quickNav = [
    { path: '/', labelFa: navLabels?.homeFa || 'صفحه اصلی', labelEn: navLabels?.homeEn || 'Home' },
    { path: '/portfolio', labelFa: navLabels?.portfolioFa || 'نمونه‌کارها', labelEn: navLabels?.portfolioEn || 'Portfolio' },
    { path: '/trips', labelFa: navLabels?.tripsFa || 'سفر و تورها', labelEn: navLabels?.tripsEn || 'Trips & Tours' },
    { path: '/gear', labelFa: navLabels?.gearFa || 'تجهیزات', labelEn: navLabels?.gearEn || 'Gear' },
    { path: '/articles', labelFa: navLabels?.articlesFa || 'مقالات', labelEn: navLabels?.articlesEn || 'Articles' },
    { path: '/resume', labelFa: navLabels?.resumeFa || 'رزومه', labelEn: navLabels?.resumeEn || 'Resume' },
    { path: '/about', labelFa: navLabels?.aboutFa || 'درباره من', labelEn: navLabels?.aboutEn || 'About' },
    { path: '/order', labelFa: navLabels?.orderFa || 'ثبت پروژه', labelEn: navLabels?.orderEn || 'Order Project' },
  ];

  return (
    <footer className="bg-white border-t border-stone-200/80 pt-12 pb-10 text-stone-600">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 space-y-12">
        {/* ۱. باکس ارتباطی ثابت و دسترسی سریع در بالای فوتر (خوانده‌شده از aboutBio) */}
        <div className="bg-stone-50/80 border border-stone-200 rounded-2xl p-6 sm:p-8 space-y-6">
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-stone-200/80 pb-5">
            <div>
              <h3 className="text-lg sm:text-xl font-bold text-stone-900 tracking-tight">
                {isFa ? 'راه‌های ارتباط مستقیم با استودیو سینا ضرغامی' : 'Direct Studio Communication & Channels'}
              </h3>
              <p className="text-xs sm:text-sm text-stone-500 mt-1 flex items-center gap-1.5">
                <MapPin className="w-3.5 h-3.5 text-amber-700 shrink-0" />
                <span>{location}</span>
              </p>
            </div>
            <button
              onClick={() => onNavigate('/order')}
              className="px-4 py-2 bg-amber-600 hover:bg-amber-500 text-white text-xs sm:text-sm font-bold rounded-lg transition-all shadow-xs cursor-pointer self-start md:self-auto"
            >
              {isFa ? 'ثبت سفارش و استعلام فوری' : 'Inquire Commission'}
            </button>
          </div>

          {/* کارت‌های راه ارتباطی */}
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3">
            {/* تماس */}
            <a
              href={`tel:${phone}`}
              className="p-3 bg-white hover:bg-amber-50/60 border border-stone-200/90 rounded-xl transition-all flex flex-col items-center justify-center text-center gap-1.5 group cursor-pointer"
            >
              <Phone className="w-4 h-4 text-amber-700 group-hover:scale-110 transition-transform" />
              <span className="text-[11px] font-semibold text-stone-800">{isFa ? 'تماس مستقیم' : 'Call'}</span>
              <span className="text-[10px] font-mono text-stone-500 dir-ltr">{phone}</span>
            </a>

            {/* تلگرام */}
            <a
              href={telegram}
              target="_blank"
              rel="noopener noreferrer"
              className="p-3 bg-white hover:bg-sky-50/60 border border-stone-200/90 rounded-xl transition-all flex flex-col items-center justify-center text-center gap-1.5 group cursor-pointer"
            >
              <Send className="w-4 h-4 text-sky-600 group-hover:scale-110 transition-transform" />
              <span className="text-[11px] font-semibold text-stone-800">{isFa ? 'تلگرام' : 'Telegram'}</span>
              <span className="text-[10px] font-mono text-stone-500">@sina_zarghami</span>
            </a>

            {/* اینستاگرام */}
            <a
              href={instagram}
              target="_blank"
              rel="noopener noreferrer"
              className="p-3 bg-white hover:bg-pink-50/60 border border-stone-200/90 rounded-xl transition-all flex flex-col items-center justify-center text-center gap-1.5 group cursor-pointer"
            >
              <Instagram className="w-4 h-4 text-pink-600 group-hover:scale-110 transition-transform" />
              <span className="text-[11px] font-semibold text-stone-800">{isFa ? 'اینستاگرام' : 'Instagram'}</span>
              <span className="text-[10px] font-mono text-stone-500">@sina.zarghami</span>
            </a>

            {/* واتساپ */}
            <a
              href={`https://wa.me/98${phone.replace(/^0/, '')}`}
              target="_blank"
              rel="noopener noreferrer"
              className="p-3 bg-white hover:bg-emerald-50/60 border border-stone-200/90 rounded-xl transition-all flex flex-col items-center justify-center text-center gap-1.5 group cursor-pointer"
            >
              <MessageCircle className="w-4 h-4 text-emerald-600 group-hover:scale-110 transition-transform" />
              <span className="text-[11px] font-semibold text-stone-800">{isFa ? 'واتساپ' : 'WhatsApp'}</span>
              <span className="text-[10px] font-mono text-stone-500">{isFa ? 'گفتگوی آنلاین' : 'Chat'}</span>
            </a>

            {/* یوتیوب */}
            <a
              href={youtube}
              target="_blank"
              rel="noopener noreferrer"
              className="p-3 bg-white hover:bg-red-50/60 border border-stone-200/90 rounded-xl transition-all flex flex-col items-center justify-center text-center gap-1.5 group cursor-pointer"
            >
              <Youtube className="w-4 h-4 text-red-600 group-hover:scale-110 transition-transform" />
              <span className="text-[11px] font-semibold text-stone-800">{isFa ? 'یوتیوب' : 'YouTube'}</span>
              <span className="text-[10px] font-mono text-stone-500">{isFa ? 'ویدیوها' : 'Videos'}</span>
            </a>

            {/* آپارات */}
            <a
              href={aparat}
              target="_blank"
              rel="noopener noreferrer"
              className="p-3 bg-white hover:bg-rose-50/60 border border-stone-200/90 rounded-xl transition-all flex flex-col items-center justify-center text-center gap-1.5 group cursor-pointer"
            >
              <Video className="w-4 h-4 text-rose-500 group-hover:scale-110 transition-transform" />
              <span className="text-[11px] font-semibold text-stone-800">{isFa ? 'آپارات' : 'Aparat'}</span>
              <span className="text-[10px] font-mono text-stone-500">{isFa ? 'کانال رسمی' : 'Channel'}</span>
            </a>
          </div>
        </div>

        {/* ۲. ردیف پیوندهای صفحات و ناوبری داخلی */}
        <div className="flex flex-col md:flex-row items-center justify-between gap-6 pb-6 border-b border-stone-100">
          <div className="space-y-1 text-center md:text-start">
            <button
              onClick={() => onNavigate('/')}
              className="text-lg font-bold tracking-tight text-stone-900 hover:text-amber-800 transition-colors cursor-pointer"
            >
              {isFa ? 'سینا ضرغامی' : 'Sina Zarghami'}
            </button>
            <p className="text-xs text-stone-500">
              {isFa
                ? 'عکاس، فیلمبردار، راهنمای رسمی اکوتوریسم و توسعه‌دهنده نرم‌افزار'
                : 'Photographer, Filmmaker, Certified Tour Leader & Software Creator'}
            </p>
          </div>

          {/* پیوندهای منو در فوتر */}
          <div className="flex flex-wrap items-center justify-center gap-x-5 gap-y-2 text-xs font-medium text-stone-600">
            {quickNav.map((link) => (
              <button
                key={link.path}
                onClick={() => onNavigate(link.path)}
                className="hover:text-amber-800 transition-colors cursor-pointer"
              >
                {isFa ? link.labelFa : link.labelEn}
              </button>
            ))}
          </div>
        </div>

        {/* ۳. ردیف کپی‌رایت، سئو، ورود ادمین و دکمه اسکرول به بالا */}
        <div className="flex flex-col sm:flex-row items-center justify-between gap-4 text-xs text-stone-500 font-mono">
          <div>
            © {new Date().getFullYear()} sinazarghami.ir · {isFa ? 'تمامی حقوق برای سینا ضرغامی محفوظ است.' : 'All rights reserved.'}
          </div>

          <div className="flex items-center gap-4">
            <button
              onClick={onOpenSeo}
              className="hover:text-amber-800 flex items-center gap-1 transition-colors cursor-pointer"
            >
              <Search className="w-3.5 h-3.5" />
              <span>{isFa ? 'گزارش و راهنمای سئو' : 'SEO Architecture'}</span>
            </button>

            <button
              onClick={onOpenAdmin}
              className="hover:text-amber-800 flex items-center gap-1 transition-colors cursor-pointer"
            >
              <Lock className="w-3.5 h-3.5" />
              <span>{isFa ? 'پنل استودیو' : 'Studio'}</span>
            </button>

            <button
              onClick={scrollToTop}
              className="p-1.5 hover:text-stone-900 bg-stone-100 hover:bg-stone-200 rounded-md transition-colors cursor-pointer"
              title={isFa ? 'بازگشت به بالا' : 'Back to top'}
            >
              <ArrowUp className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>
      </div>
    </footer>
  );
};
