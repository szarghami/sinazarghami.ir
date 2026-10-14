import React from 'react';
import { Language } from '../types';
import { Instagram, Send, Linkedin, Github, Lock, Search, ArrowUp, Youtube, Phone } from 'lucide-react';

interface FooterProps {
  language: Language;
  onOpenAdmin: () => void;
  onOpenSeo: () => void;
}

export const Footer: React.FC<FooterProps> = ({
  language,
  onOpenAdmin,
  onOpenSeo,
}) => {
  const isFa = language === 'fa';

  const scrollToTop = () => {
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  return (
    <footer className="bg-white border-t border-stone-200/80 py-14 text-stone-600">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 space-y-10">
        <div className="flex flex-col md:flex-row items-center justify-between gap-6 pb-8 border-b border-stone-100">
          {/* Brand Identity & Phone */}
          <div className="space-y-2 text-center md:text-start">
            <a href="#" className="text-xl font-bold tracking-tight text-stone-900 hover:text-amber-800 transition-colors">
              {isFa ? 'سینا ضرغامی' : 'Sina Zarghami'}
            </a>
            <p className="text-xs text-stone-500">
              {isFa
                ? 'پایگاه رسمی برند شخصی، آثار عکاسی، سفرهای میدانی و مهندسی نرم‌افزار'
                : 'Official personal flagship: Visual arts, wilderness expeditions & digital craftsmanship'}
            </p>
            <div className="pt-1 flex items-center justify-center md:justify-start gap-3 text-xs">
              <a
                href="tel:09127193767"
                className="inline-flex items-center gap-1.5 text-stone-800 hover:text-amber-800 font-mono font-bold transition-colors"
                title={isFa ? 'تماس مستقیم' : 'Call'}
              >
                <Phone className="w-3.5 h-3.5 text-amber-700" />
                <span>09127193767</span>
              </a>
              <span className="text-stone-300">·</span>
              <a
                href="https://wa.me/989127193767"
                target="_blank"
                rel="noopener noreferrer"
                className="text-stone-500 hover:text-emerald-700 transition-colors"
              >
                {isFa ? 'واتساپ' : 'WhatsApp'}
              </a>
              <span className="text-stone-300">·</span>
              <a
                href="mailto:szarghami1995028@gmail.com"
                className="text-stone-500 hover:text-amber-800 transition-colors font-mono"
              >
                szarghami1995028@gmail.com
              </a>
            </div>
          </div>

          {/* Social Channels */}
          <div className="flex items-center gap-4 text-stone-500">
            <a
              href="https://www.instagram.com/sina.zarghami"
              target="_blank"
              rel="noopener noreferrer"
              className="p-2 hover:text-amber-800 hover:bg-stone-50 rounded-full transition-colors"
              title="Instagram"
            >
              <Instagram className="w-4 h-4" />
            </a>
            <a
              href="https://www.youtube.com/@sina.zarghami"
              target="_blank"
              rel="noopener noreferrer"
              className="p-2 hover:text-red-700 hover:bg-stone-50 rounded-full transition-colors"
              title="YouTube"
            >
              <Youtube className="w-4 h-4" />
            </a>
            <a
              href="https://t.me/sina_zarghami"
              target="_blank"
              rel="noopener noreferrer"
              className="p-2 hover:text-amber-800 hover:bg-stone-50 rounded-full transition-colors"
              title="Telegram"
            >
              <Send className="w-4 h-4" />
            </a>
            <a
              href="https://linkedin.com/in/sinazarghami"
              target="_blank"
              rel="noopener noreferrer"
              className="p-2 hover:text-amber-800 hover:bg-stone-50 rounded-full transition-colors"
              title="LinkedIn"
            >
              <Linkedin className="w-4 h-4" />
            </a>
            <a
              href="https://github.com/szarghami/"
              target="_blank"
              rel="noopener noreferrer"
              className="p-2 hover:text-amber-800 hover:bg-stone-50 rounded-full transition-colors"
              title="GitHub"
            >
              <Github className="w-4 h-4" />
            </a>
          </div>
        </div>

        {/* Bottom row */}
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
