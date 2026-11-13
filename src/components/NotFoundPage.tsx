import React from 'react';
import { Compass, ArrowLeft } from 'lucide-react';
import { Language } from '../types';

interface NotFoundPageProps {
  language: Language;
  onNavigate: (path: string) => void;
}

const LINKS = [
  { path: '/portfolio', fa: 'نمونه‌کارها', en: 'Portfolio' },
  { path: '/trips', fa: 'سفرها و تورها', en: 'Trips & Tours' },
  { path: '/articles', fa: 'مقالات', en: 'Articles' },
  { path: '/order', fa: 'تماس و سفارش', en: 'Contact' },
];

export const NotFoundPage: React.FC<NotFoundPageProps> = ({ language, onNavigate }) => {
  const isFa = language === 'fa';
  return (
    <section className="py-24 sm:py-32">
      <div className="max-w-2xl mx-auto px-6 text-center space-y-6">
        <div className="inline-flex items-center gap-2 text-xs font-mono uppercase tracking-wider text-amber-800 font-bold">
          <Compass className="w-4 h-4 text-amber-700" />
          <span>404</span>
        </div>
        <h1 className="text-3xl sm:text-4xl font-extrabold text-stone-900 tracking-tight">
          {isFa ? 'این مسیر پیدا نشد' : 'This path does not exist'}
        </h1>
        <p className="text-sm sm:text-base text-stone-600 leading-relaxed">
          {isFa
            ? 'آدرسی که باز کردید وجود ندارد یا جابه‌جا شده است. از یکی از بخش‌های زیر ادامه بدهید.'
            : 'The address you opened does not exist or has moved. Continue from one of these sections.'}
        </p>
        <div className="flex flex-wrap items-center justify-center gap-2">
          {LINKS.map((link) => (
            <button
              key={link.path}
              onClick={() => onNavigate(link.path)}
              className="px-4 py-2 rounded-xl border border-stone-200 bg-white text-sm font-semibold text-stone-700 hover:border-stone-300 hover:bg-stone-50 transition-colors cursor-pointer"
            >
              {isFa ? link.fa : link.en}
            </button>
          ))}
        </div>
        <button
          onClick={() => onNavigate('/')}
          className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-stone-900 text-white text-sm font-semibold hover:bg-stone-800 transition-colors cursor-pointer"
        >
          <ArrowLeft className="w-4 h-4" />
          {isFa ? 'بازگشت به صفحه اصلی' : 'Back to home'}
        </button>
      </div>
    </section>
  );
};
