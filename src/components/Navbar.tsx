import React, { useState } from 'react';
import { Language } from '../types';
import { Globe, Lock, Menu, X, ArrowUpRight } from 'lucide-react';

interface NavbarProps {
  language: Language;
  onToggleLanguage: () => void;
  onOpenAdmin: () => void;
  onOpenContact: () => void;
}

export const Navbar: React.FC<NavbarProps> = ({
  language,
  onToggleLanguage,
  onOpenAdmin,
  onOpenContact,
}) => {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const isFa = language === 'fa';

  const navLinks = [
    { href: '#photography', labelFa: 'آثار و فروش عکس', labelEn: 'Gallery & Shop' },
    { href: '#gear', labelFa: 'تجهیزات و استودیو', labelEn: 'Gear Arsenal' },
    { href: '#expeditions', labelFa: 'سفرها و تورها', labelEn: 'Expeditions' },
    { href: '#software', labelFa: 'پروژه‌ها و وب', labelEn: 'Projects' },
    { href: '#resume', labelFa: 'رزومه و کتاب‌ها', labelEn: 'Resume & Books' },
    { href: '#services', labelFa: 'سفارش کار', labelEn: 'Services' },
  ];

  return (
    <header className="sticky top-0 z-40 w-full bg-white/85 backdrop-blur-md border-b border-stone-200/70 transition-colors">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-18 flex items-center justify-between gap-8">
        {/* Zone 1: Brand Wordmark (Single Text Element) */}
        <a
          href="#"
          className="text-lg md:text-xl font-bold tracking-tight text-stone-900 whitespace-nowrap shrink-0 hover:text-amber-800 transition-colors"
        >
          {isFa ? 'سینا ضرغامی' : 'Sina Zarghami'}
        </a>

        {/* Zone 2: 4-5 Clean Nav Links */}
        <nav className="hidden lg:flex items-center gap-7 text-sm font-medium text-stone-600">
          {navLinks.map((link) => (
            <a
              key={link.href}
              href={link.href}
              className="hover:text-stone-950 transition-colors whitespace-nowrap shrink-0 relative py-1 after:absolute after:bottom-0 after:left-0 after:right-0 after:h-[1.5px] after:bg-amber-700 after:scale-x-0 hover:after:scale-x-100 after:transition-transform"
            >
              {isFa ? link.labelFa : link.labelEn}
            </a>
          ))}
        </nav>

        {/* Zone 3: 1 Primary Action + Utility Controls */}
        <div className="flex items-center gap-3 shrink-0">
          {/* Language Toggle Button */}
          <button
            onClick={onToggleLanguage}
            title={isFa ? 'Switch to English' : 'تغییر به فارسی'}
            className="flex items-center gap-1.5 px-2.5 py-1.5 text-xs font-medium text-stone-700 bg-stone-100 hover:bg-stone-200/80 rounded-md transition-colors whitespace-nowrap shrink-0 cursor-pointer"
          >
            <Globe className="w-3.5 h-3.5 text-stone-500" />
            <span className="font-semibold">{isFa ? 'EN' : 'فا'}</span>
          </button>

          {/* Discreet Admin Lock Trigger */}
          <button
            onClick={onOpenAdmin}
            title={isFa ? 'ورود به پنل اختصاصی سینا ضرغامی' : 'Creator Studio (Admin)'}
            className="p-2 text-stone-400 hover:text-stone-800 hover:bg-stone-100 rounded-md transition-colors shrink-0 cursor-pointer"
            aria-label="Admin Portal"
          >
            <Lock className="w-4 h-4" />
          </button>

          {/* Primary CTA */}
          <button
            onClick={onOpenContact}
            className="hidden sm:inline-flex items-center gap-1.5 px-4 py-2 text-xs md:text-sm font-medium text-white bg-stone-900 hover:bg-stone-800 rounded-md transition-all shadow-xs whitespace-nowrap shrink-0 cursor-pointer"
          >
            <span>{isFa ? 'همکاری و سفارش' : 'Commission Project'}</span>
            <ArrowUpRight className="w-3.5 h-3.5 text-stone-300" />
          </button>

          {/* Mobile Menu Toggle */}
          <button
            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
            className="lg:hidden p-2 text-stone-700 hover:bg-stone-100 rounded-md cursor-pointer"
            aria-label="Toggle Menu"
          >
            {mobileMenuOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
          </button>
        </div>
      </div>

      {/* Mobile Drawer */}
      {mobileMenuOpen && (
        <div className="lg:hidden bg-white border-b border-stone-200 px-6 py-5 shadow-lg space-y-4 animate-in fade-in slide-in-from-top-2 duration-150">
          <div className="flex flex-col space-y-3">
            {navLinks.map((link) => (
              <a
                key={link.href}
                href={link.href}
                onClick={() => setMobileMenuOpen(false)}
                className="text-base font-medium text-stone-800 hover:text-amber-800 py-1 transition-colors"
              >
                {isFa ? link.labelFa : link.labelEn}
              </a>
            ))}
          </div>
          <div className="pt-3 border-t border-stone-100 flex items-center justify-between">
            <button
              onClick={() => {
                setMobileMenuOpen(false);
                onOpenContact();
              }}
              className="w-full py-2.5 px-4 text-sm font-medium text-white bg-stone-900 rounded-md text-center"
            >
              {isFa ? 'همکاری و سفارش پروژه' : 'Commission Project'}
            </button>
          </div>
        </div>
      )}
    </header>
  );
};
