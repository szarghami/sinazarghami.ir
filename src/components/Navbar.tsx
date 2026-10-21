import React, { useState } from 'react';
import { Language, NavLabelsItem } from '../types';
import { Globe, Lock, Menu, X, ArrowUpRight, Sparkles } from 'lucide-react';

interface NavbarProps {
  currentPath?: string;
  onNavigate?: (path: string) => void;
  navLabels?: NavLabelsItem;
  language: Language;
  onToggleLanguage: () => void;
  onOpenAdmin: () => void;
  onOpenContact?: () => void;
}

export const Navbar: React.FC<NavbarProps> = ({
  currentPath = '/',
  onNavigate = () => {},
  navLabels,
  language,
  onToggleLanguage,
  onOpenAdmin,
  onOpenContact,
}) => {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const isFa = language === 'fa';

  const menuItems = [
    {
      path: '/',
      labelFa: navLabels?.homeFa || 'صفحه اصلی',
      labelEn: navLabels?.homeEn || 'Home',
    },
    {
      path: '/portfolio',
      labelFa: navLabels?.portfolioFa || 'نمونه‌کارها',
      labelEn: navLabels?.portfolioEn || 'Portfolio',
    },
    {
      path: '/trips',
      labelFa: navLabels?.tripsFa || 'سفر و تورها',
      labelEn: navLabels?.tripsEn || 'Trips & Tours',
    },
    {
      path: '/gear',
      labelFa: navLabels?.gearFa || 'تجهیزات',
      labelEn: navLabels?.gearEn || 'Gear',
    },
    {
      path: '/articles',
      labelFa: navLabels?.articlesFa || 'مقالات',
      labelEn: navLabels?.articlesEn || 'Articles',
    },
    {
      path: '/resume',
      labelFa: navLabels?.resumeFa || 'رزومه',
      labelEn: navLabels?.resumeEn || 'Resume',
    },
    {
      path: '/about',
      labelFa: navLabels?.aboutFa || 'درباره من',
      labelEn: navLabels?.aboutEn || 'About',
    },
  ];

  const orderLabel = isFa
    ? navLabels?.orderFa || 'ثبت پروژه'
    : navLabels?.orderEn || 'Order Project';

  const handleLinkClick = (path: string) => {
    onNavigate(path);
    setMobileMenuOpen(false);
  };

  const isActive = (path: string) => {
    if (path === '/') return currentPath === '/';
    return currentPath.startsWith(path);
  };

  return (
    <header className="sticky top-0 z-40 w-full bg-white/90 backdrop-blur-md border-b border-stone-200/80 transition-colors">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-18 flex items-center justify-between gap-6">
        {/* Zone 1: Brand Wordmark (Single Text Element) */}
        <button
          onClick={() => handleLinkClick('/')}
          className="text-lg md:text-xl font-bold tracking-tight text-stone-900 whitespace-nowrap shrink-0 hover:text-amber-800 transition-colors cursor-pointer text-start"
        >
          {isFa ? 'سینا ضرغامی' : 'Sina Zarghami'}
        </button>

        {/* Zone 2: Clean Dynamic Navigation Links */}
        <nav className="hidden xl:flex items-center gap-6 text-sm font-medium text-stone-600">
          {menuItems.map((item) => {
            const active = isActive(item.path);
            return (
              <button
                key={item.path}
                onClick={() => handleLinkClick(item.path)}
                className={`whitespace-nowrap shrink-0 relative py-1 transition-colors cursor-pointer text-sm ${
                  active
                    ? 'text-amber-800 font-bold'
                    : 'hover:text-stone-950 text-stone-600'
                }`}
              >
                <span>{isFa ? item.labelFa : item.labelEn}</span>
                {active && (
                  <span className="absolute bottom-0 inset-x-0 h-[2px] bg-amber-700 rounded-full" />
                )}
              </button>
            );
          })}
        </nav>

        {/* Zone 3: Distinctive CTA + Utility Controls */}
        <div className="flex items-center gap-2.5 sm:gap-3 shrink-0">
          {/* Distinctive Colored Action Button: /order */}
          <button
            onClick={() => handleLinkClick('/order')}
            className={`inline-flex items-center gap-1.5 px-3.5 py-2 text-xs sm:text-sm font-bold rounded-lg transition-all shadow-xs whitespace-nowrap shrink-0 cursor-pointer ${
              isActive('/order')
                ? 'bg-amber-700 text-white ring-2 ring-amber-500'
                : 'bg-amber-600 hover:bg-amber-500 text-white'
            }`}
          >
            <Sparkles className="w-3.5 h-3.5" />
            <span>{orderLabel}</span>
            <ArrowUpRight className="w-3.5 h-3.5 hidden sm:inline" />
          </button>

          {/* Language Toggle Button */}
          <button
            onClick={onToggleLanguage}
            title={isFa ? 'Switch to English' : 'تغییر به فارسی'}
            className="flex items-center gap-1.5 px-2.5 py-2 text-xs font-medium text-stone-700 bg-stone-100 hover:bg-stone-200/80 rounded-lg transition-colors whitespace-nowrap shrink-0 cursor-pointer"
          >
            <Globe className="w-3.5 h-3.5 text-stone-500" />
            <span className="font-semibold">{isFa ? 'EN' : 'فا'}</span>
          </button>

          {/* Discreet Admin Lock Trigger */}
          <button
            onClick={onOpenAdmin}
            title={isFa ? 'ورود به پنل اختصاصی سینا ضرغامی' : 'Creator Studio (Admin)'}
            className="p-2 text-stone-400 hover:text-stone-800 hover:bg-stone-100 rounded-lg transition-colors shrink-0 cursor-pointer"
            aria-label="Admin Portal"
          >
            <Lock className="w-4 h-4" />
          </button>

          {/* Mobile Menu Toggle */}
          <button
            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
            className="xl:hidden p-2 text-stone-700 hover:bg-stone-100 rounded-lg cursor-pointer"
            aria-label="Toggle Menu"
          >
            {mobileMenuOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
          </button>
        </div>
      </div>

      {/* Mobile Drawer */}
      {mobileMenuOpen && (
        <div className="xl:hidden bg-white border-b border-stone-200 px-6 py-5 shadow-lg space-y-4 animate-in fade-in slide-in-from-top-2 duration-150">
          <div className="flex flex-col space-y-2">
            {menuItems.map((item) => {
              const active = isActive(item.path);
              return (
                <button
                  key={item.path}
                  onClick={() => handleLinkClick(item.path)}
                  className={`text-start text-base py-2 transition-colors cursor-pointer flex items-center justify-between ${
                    active ? 'font-bold text-amber-800' : 'text-stone-700 hover:text-stone-900'
                  }`}
                >
                  <span>{isFa ? item.labelFa : item.labelEn}</span>
                  {active && <span className="w-1.5 h-1.5 rounded-full bg-amber-700" />}
                </button>
              );
            })}
          </div>

          <div className="pt-3 border-t border-stone-100">
            <button
              onClick={() => handleLinkClick('/order')}
              className="w-full py-2.5 px-4 text-sm font-bold text-white bg-amber-600 hover:bg-amber-500 rounded-lg text-center flex items-center justify-center gap-2 cursor-pointer shadow-xs"
            >
              <Sparkles className="w-4 h-4" />
              <span>{orderLabel}</span>
            </button>
          </div>
        </div>
      )}
    </header>
  );
};
