import React, { useRef } from 'react';
import { HomeCategoryCard, Language } from '../types';
import { ChevronLeft, ChevronRight, ArrowUpRight, Sparkles, Layers } from 'lucide-react';
import { getReliableImageUrl } from '../utils/supabase';

interface HomeCategoryCardsProps {
  cards?: HomeCategoryCard[];
  language: Language;
  onNavigate: (path: string) => void;
}

export const HomeCategoryCards: React.FC<HomeCategoryCardsProps> = ({
  cards = [],
  language,
  onNavigate,
}) => {
  const isFa = language === 'fa';
  const scrollContainerRef = useRef<HTMLDivElement>(null);

  const scroll = (direction: 'left' | 'right') => {
    if (!scrollContainerRef.current) return;
    const scrollAmount = 360;
    const sign = isFa ? (direction === 'left' ? 1 : -1) : direction === 'left' ? -1 : 1;
    scrollContainerRef.current.scrollBy({ left: sign * scrollAmount, behavior: 'smooth' });
  };

  if (cards.length === 0) return null;

  return (
    <section className="py-16 md:py-20 bg-stone-50/80 border-b border-stone-200/80 overflow-hidden">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 space-y-8">
        {/* Header & Slider Navigation Controls */}
        <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4">
          <div className="space-y-2">
            <div className="flex items-center gap-2 text-xs font-mono uppercase tracking-wider text-amber-800 font-bold">
              <Layers className="w-3.5 h-3.5 text-amber-700" />
              <span>{isFa ? 'کاوش در بخش‌های اصلی استودیو' : 'Explore Core Sections'}</span>
            </div>
            <h2 className="text-2xl sm:text-3xl font-extrabold text-stone-900 tracking-tight">
              {isFa ? 'دسته‌بندی‌های تخصصی و خدمات' : 'Featured Disciplines & Portfolios'}
            </h2>
          </div>

          {/* Navigation Arrows */}
          <div className="flex items-center gap-2 self-end sm:self-auto">
            <button
              onClick={() => scroll('left')}
              className="p-2.5 bg-white hover:bg-stone-100 text-stone-700 border border-stone-200 rounded-full transition-all shadow-2xs hover:scale-105 cursor-pointer"
              aria-label="Previous"
            >
              {isFa ? <ChevronRight className="w-4 h-4" /> : <ChevronLeft className="w-4 h-4" />}
            </button>
            <button
              onClick={() => scroll('right')}
              className="p-2.5 bg-white hover:bg-stone-100 text-stone-700 border border-stone-200 rounded-full transition-all shadow-2xs hover:scale-105 cursor-pointer"
              aria-label="Next"
            >
              {isFa ? <ChevronLeft className="w-4 h-4" /> : <ChevronRight className="w-4 h-4" />}
            </button>
          </div>
        </div>

        {/* Scrollable Cards Track */}
        <div
          ref={scrollContainerRef}
          className="flex gap-6 overflow-x-auto pb-4 pt-1 snap-x scrollbar-none no-scrollbar -mx-4 px-4 sm:mx-0 sm:px-0"
          style={{ scrollbarWidth: 'none', msOverflowStyle: 'none' }}
        >
          {cards.map((card) => {
            const badge = isFa ? card.badgeFa : card.badgeEn;
            const title = isFa ? card.titleFa : card.titleEn;
            const subtitle = isFa ? card.subtitleFa : card.subtitleEn;

            return (
              <div
                key={card.id}
                onClick={() => onNavigate(card.targetPath)}
                className="group relative flex-none w-[280px] sm:w-[320px] md:w-[350px] aspect-4/5 rounded-2xl overflow-hidden bg-stone-900 border border-stone-200/90 shadow-xs hover:shadow-xl transition-all duration-300 cursor-pointer snap-start flex flex-col justify-between p-6"
              >
                {/* Background Image with Hover Zoom */}
                <img
                  src={getReliableImageUrl(card.coverUrl)}
                  alt={title}
                  className="absolute inset-0 w-full h-full object-cover transition-transform duration-700 group-hover:scale-106"
                  loading="lazy"
                  referrerPolicy="no-referrer"
                />

                {/* Scrim Gradient */}
                <div className="absolute inset-0 bg-gradient-to-t from-stone-950/90 via-stone-950/40 to-stone-950/20 group-hover:from-stone-950/95 transition-colors" />

                {/* Top Badge */}
                <div className="relative z-10 flex items-center justify-between">
                  {badge ? (
                    <span className="text-[11px] font-mono text-stone-200 bg-stone-900/80 backdrop-blur-md px-3 py-1 rounded-md">
                      {badge}
                    </span>
                  ) : <span />}

                  <div className="w-8 h-8 rounded-full bg-white/20 backdrop-blur-md text-white flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
                    <ArrowUpRight className="w-4 h-4" />
                  </div>
                </div>

                {/* Bottom Text Content */}
                <div className="relative z-10 space-y-2 text-white">
                  <h3 className="text-lg sm:text-xl font-bold tracking-tight leading-snug group-hover:text-amber-300 transition-colors">
                    {title}
                  </h3>
                  <p className="text-xs sm:text-sm text-stone-300 line-clamp-2 leading-relaxed">
                    {subtitle}
                  </p>
                  <div className="pt-2 flex items-center gap-1.5 text-xs font-semibold text-amber-400 group-hover:translate-x-1 rtl:group-hover:-translate-x-1 transition-transform">
                    <span>{isFa ? 'ورود به این بخش' : 'Explore Section'}</span>
                    <ArrowUpRight className="w-3.5 h-3.5" />
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </section>
  );
};
