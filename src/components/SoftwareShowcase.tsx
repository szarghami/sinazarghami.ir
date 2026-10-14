import React from 'react';
import { Language, SoftwareItem } from '../types';
import { Code2, ExternalLink, Github, Terminal, Sparkles, Layers } from 'lucide-react';

interface SoftwareShowcaseProps {
  software: SoftwareItem[];
  language: Language;
}

export const SoftwareShowcase: React.FC<SoftwareShowcaseProps> = ({
  software,
  language,
}) => {
  const isFa = language === 'fa';

  return (
    <section id="software" className="py-20 bg-stone-50/60 border-b border-stone-200/70">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Section Header */}
        <div className="max-w-3xl mb-14 space-y-3">
          <div className="flex items-center gap-2 text-xs font-mono uppercase tracking-wider text-stone-500">
            <span>03</span>
            <span aria-hidden="true">·</span>
            <span>{isFa ? 'مهندسی نرم‌افزار و محصولات دیجیتال' : 'Software Engineering'}</span>
          </div>
          <h2 className="text-2xl sm:text-3xl md:text-4xl font-extrabold text-stone-900 tracking-tight">
            {isFa ? 'پلتفرم‌ها، ابزارها و وب‌سایت‌های توسعه‌یافته' : 'Digital Craftsmanship & Web Systems'}
          </h2>
          <p className="text-sm sm:text-base text-stone-600 leading-relaxed">
            {isFa
              ? 'تلفیق حس هنری و مهندسی فنی در ساخت پلتفرم‌های پرسرعت وب، ابزارهای تخصصی رسانه و سیستم‌های کاربردی.'
              : 'Synthesizing visual aesthetics with technical rigor to build high-performance web applications, media automation tools, and creative platforms.'}
          </p>
        </div>

        {/* Software Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
          {software.map((item) => (
            <div
              key={item.id}
              className="bg-white rounded-2xl p-7 border border-stone-200/80 shadow-xs hover:shadow-md transition-all flex flex-col justify-between space-y-6"
            >
              <div className="space-y-4">
                {/* Header with category and year */}
                <div className="flex items-center justify-between text-xs font-mono text-stone-500">
                  <div className="flex items-center gap-1.5 text-amber-700 font-semibold">
                    <Terminal className="w-3.5 h-3.5" />
                    <span>{item.category.toUpperCase()}</span>
                  </div>
                  <span>{item.year}</span>
                </div>

                <div className="space-y-1">
                  <h3 className="text-xl font-bold text-stone-900 tracking-tight">
                    {item.title}
                  </h3>
                  <p className="text-xs font-medium text-stone-500">
                    {isFa ? item.taglineFa : item.taglineEn}
                  </p>
                </div>

                <p className="text-xs sm:text-sm text-stone-600 leading-relaxed">
                  {isFa ? item.descriptionFa : item.descriptionEn}
                </p>

                {/* Tech Stack rendered cleanly as unboxed metadata */}
                <div className="pt-2">
                  <div className="text-[11px] font-mono text-stone-400 uppercase tracking-wider mb-2">
                    {isFa ? 'فناوری‌های به‌کاررفته:' : 'Stack:'}
                  </div>
                  <div className="flex flex-wrap gap-2 text-xs font-mono text-stone-700">
                    {item.techStack.map((tech, idx) => (
                      <span key={tech} className="bg-stone-100 px-2 py-0.5 rounded text-stone-800">
                        {tech}
                      </span>
                    ))}
                  </div>
                </div>
              </div>

              {/* Action Links */}
              <div className="pt-4 border-t border-stone-100 flex items-center justify-between text-xs">
                {item.liveUrl ? (
                  <a
                    href={item.liveUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="font-semibold text-stone-900 hover:text-amber-800 inline-flex items-center gap-1.5 transition-colors"
                  >
                    <span>{isFa ? 'مشاهده آنلاین پروژه' : 'Live Preview'}</span>
                    <ExternalLink className="w-3.5 h-3.5" />
                  </a>
                ) : (
                  <span className="text-stone-400 font-mono">{isFa ? 'پروژه اختصاصی' : 'Internal Project'}</span>
                )}

                {item.githubUrl && (
                  <a
                    href={item.githubUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-stone-500 hover:text-stone-900 inline-flex items-center gap-1 transition-colors"
                    title="Source Code"
                  >
                    <Github className="w-4 h-4" />
                    <span>GitHub</span>
                  </a>
                )}
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
};
