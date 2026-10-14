import React, { useState } from 'react';
import { EquipmentCategory, EquipmentItem, Language } from '../types';
import {
  Camera,
  Compass,
  Sparkles,
  Video,
  Mic,
  Sun,
  Layers,
  MonitorPlay,
  CheckCircle2,
  Sliders,
  ChevronLeft,
  ChevronRight,
  Info,
} from 'lucide-react';

interface GearLockerSectionProps {
  equipment: EquipmentItem[];
  language: Language;
}

export const GearLockerSection: React.FC<GearLockerSectionProps> = ({ equipment, language }) => {
  const isFa = language === 'fa';

  const [activeCategory, setActiveCategory] = useState<EquipmentCategory | 'all'>('all');
  const [selectedProjectType, setSelectedProjectType] = useState<string | null>(null);

  // دسته‌بندی‌های تجهیزات
  const categories: { id: EquipmentCategory | 'all'; labelFa: string; labelEn: string; icon: React.ElementType }[] = [
    { id: 'all', labelFa: 'کل جعبه‌ابزار', labelEn: 'All Gear', icon: Layers },
    { id: 'cameras', labelFa: 'دوربین‌ها', labelEn: 'Cameras', icon: Camera },
    { id: 'lenses', labelFa: 'لنزها و اپتیک', labelEn: 'Lenses', icon: Compass },
    { id: 'lighting', labelFa: 'نورپردازی و مادیفایر', labelEn: 'Lighting', icon: Sun },
    { id: 'motion', labelFa: 'تجهیزات حرکتی و گیمبال', labelEn: 'Stabilizers', icon: Video },
    { id: 'audio', labelFa: 'صدا و میکروفون', labelEn: 'Audio', icon: Mic },
    { id: 'teleprompter', labelFa: 'تله‌پرامپتر', labelEn: 'Teleprompter', icon: MonitorPlay },
    { id: 'studio', labelFa: 'تجهیزات استودیو', labelEn: 'Studio Gear', icon: Sliders },
  ];

  // پروژه‌های متداول جهت تست هوشمند تجهیزات مورد نیاز
  const projectPresets = [
    {
      id: 'commercial',
      labelFa: '🎬 تیزر تبلیغاتی و معرفی برند',
      labelEn: 'Brand Ad & Commercial Video',
      matchKeywords: ['Canon R8', 'DJI RS 4', 'SR-0811 Video Light', 'Septa 330W', 'LARK M2 DUO'],
      descFa: 'ترکیب دوربین فول‌فریم، ریل حرکتی گیمبال و نورهای استودیویی CRI ۹۷ برای کیفیتی در سطح تلویزیون.',
    },
    {
      id: 'macro',
      labelFa: '🔬 عکاسی ماکرو و هایپرمکرو',
      labelEn: 'Hyper-Macro & Microscopic Studies',
      matchKeywords: ['رینگ معکوس', 'Canon EF 50mm', 'خیمه نور', 'NiceFoto 680c', 'iPhone 13 Pro Max'],
      descFa: 'تکنیک ثبت ساختارهای میکروسکوپی چشم حشرات، کریستال‌ها و جواهرات فراتر از توان چشم انسان.',
    },
    {
      id: 'portrait',
      labelFa: '✨ پرتره با بوکه و پس‌زمینه محو',
      labelEn: 'Fine-Art Portrait & Dreamy Bokeh',
      matchKeywords: ['Canon EF 50mm f/1.8', 'Godox Octabox', 'SR-0811 Video Light'],
      descFa: 'استفاده از دیافراگم f/1.8 و سافت‌باکس بزرگ ۱۲۰ سانتی‌متری برای ایجاد نوری مخملی و چشمان درخشان.',
    },
    {
      id: 'course',
      labelFa: '🎙 ضبط آموزش و دوره‌های آنلاین',
      labelEn: 'Course Recording & Masterclasses',
      matchKeywords: ['تله‌پرامپتر', 'LARK M2 DUO', 'Canon R8', 'SR-0811'],
      descFa: 'سخنرانی بدون تپق با تله‌پرامپتر شیشه‌ای جلوی لنز و ضبط صدای کریستالی بدون نویز محیط.',
    },
    {
      id: 'industrial',
      labelFa: '🏭 مستندسازی صنعتی و کارخانه‌ای',
      labelEn: 'Industrial & Factory Coverage',
      matchKeywords: ['Canon 70D', 'GoPro Max 360', 'DJI RS 4', 'Green Line 2in1', 'Ararox G330W'],
      descFa: 'پوشش خط تولید، زوایای ۳۶۰ درجه از ماشین‌آلات و مصاحبه با مهندسان با تجهیزات مقاوم میدانی.',
    },
  ];

  const filteredEquipment = equipment.filter((item) => {
    if (activeCategory !== 'all' && item.category !== activeCategory) {
      return false;
    }
    return true;
  });

  return (
    <section id="gear" className="py-20 bg-stone-900 text-stone-100 border-b border-stone-800 relative overflow-hidden">
      {/* Background Decorative Grid */}
      <div className="absolute inset-0 bg-[linear-gradient(to_right,#262626_1px,transparent_1px),linear-gradient(to_bottom,#262626_1px,transparent_1px)] bg-[size:4rem_4rem] [mask-image:radial-gradient(ellipse_60%_50%_at_50%_0%,#000_70%,transparent_100%)] opacity-30 pointer-events-none" />

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10 space-y-12">
        {/* Header Section */}
        <div className="flex flex-col md:flex-row md:items-end justify-between gap-6">
          <div className="space-y-3">
            <div className="flex items-center gap-2 text-xs font-mono uppercase tracking-wider text-amber-400">
              <span>03</span>
              <span aria-hidden="true">·</span>
              <span>{isFa ? 'ارسنال و جعبه‌ابزار تولید اختصاصی' : 'Production Arsenal & Gear'}</span>
            </div>
            <h2 className="text-2xl sm:text-3xl md:text-4xl font-extrabold text-white tracking-tight">
              {isFa ? 'تجهیزات تخصصی و کاربرد آن‌ها در پروژه‌های شما' : 'Specialized Equipment & Production Arsenal'}
            </h2>
            <p className="text-sm sm:text-base text-stone-400 max-w-2xl leading-relaxed">
              {isFa
                ? 'هر قاب بی‌نقص حاصل هم‌نشینی نور دقیق، اپتیک پیشرفته و ثبات تصویر است. در اینجا با تجهیزات استودیو سینا ضرغامی و دلیل استفاده از هر کدام آشنا شوید.'
                : 'A curated inventory of cinema bodies, specialty optics, high-CRI continuous illumination, stabilization gimbals, and teleprompter systems.'}
            </p>
          </div>

          <div className="flex items-center gap-2 bg-stone-800/80 px-4 py-2.5 rounded-xl border border-stone-700/80 shrink-0 text-xs text-stone-300">
            <Info className="w-4 h-4 text-amber-400 shrink-0" />
            <span>{isFa ? 'تمام تجهیزات متعلق به استودیو و آماده اعزام به لوکیشن است.' : 'All gear owned in-house & expedition-ready.'}</span>
          </div>
        </div>

        {/* Project Selector Helper */}
        <div className="p-5 sm:p-6 rounded-2xl bg-stone-950/70 border border-stone-800 space-y-4">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div className="flex items-center gap-2 text-xs font-mono uppercase text-stone-400">
              <Sparkles className="w-4 h-4 text-amber-400" />
              <span className="font-bold text-stone-200">
                {isFa ? 'راهنمای هوشمند انتخاب تجهیزات بر اساس نوع پروژه شما:' : 'Smart Gear Selector for Your Project:'}
              </span>
            </div>
            {selectedProjectType && (
              <button
                onClick={() => setSelectedProjectType(null)}
                className="text-xs text-stone-400 hover:text-amber-400 underline cursor-pointer"
              >
                {isFa ? 'پاک کردن فیلتر پروژه' : 'Clear Preset'}
              </button>
            )}
          </div>

          <div className="flex flex-wrap gap-2">
            {projectPresets.map((preset) => {
              const isSelected = selectedProjectType === preset.id;
              return (
                <button
                  key={preset.id}
                  onClick={() => setSelectedProjectType(isSelected ? null : preset.id)}
                  className={`px-3.5 py-2 rounded-xl text-xs font-medium transition-all cursor-pointer border ${
                    isSelected
                      ? 'bg-amber-500 text-stone-950 border-amber-400 font-bold shadow-md shadow-amber-500/20'
                      : 'bg-stone-900 text-stone-300 border-stone-800 hover:border-stone-700 hover:bg-stone-800'
                  }`}
                >
                  {isFa ? preset.labelFa : preset.labelEn}
                </button>
              );
            })}
          </div>

          {selectedProjectType && (
            <div className="text-xs text-amber-300/90 bg-amber-950/30 border border-amber-800/40 p-3 rounded-lg flex items-center gap-2">
              <CheckCircle2 className="w-4 h-4 shrink-0 text-amber-400" />
              <span>
                {projectPresets.find((p) => p.id === selectedProjectType)?.descFa}
              </span>
            </div>
          )}
        </div>

        {/* Category Tabs */}
        <div className="flex items-center gap-2 overflow-x-auto pb-2 scrollbar-none">
          {categories.map((cat) => {
            const Icon = cat.icon;
            const isSelected = activeCategory === cat.id;
            return (
              <button
                key={cat.id}
                onClick={() => setActiveCategory(cat.id)}
                className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-medium whitespace-nowrap transition-all cursor-pointer border ${
                  isSelected
                    ? 'bg-white text-stone-950 border-white shadow-sm font-bold'
                    : 'bg-stone-800/60 text-stone-300 border-stone-700/60 hover:bg-stone-800 hover:text-white'
                }`}
              >
                <Icon className={`w-3.5 h-3.5 ${isSelected ? 'text-amber-700' : 'text-stone-400'}`} />
                <span>{isFa ? cat.labelFa : cat.labelEn}</span>
              </button>
            );
          })}
        </div>

        {/* Equipment Cards Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredEquipment.map((item) => {
            const currentPreset = projectPresets.find((p) => p.id === selectedProjectType);
            const isHighlighted =
              currentPreset && currentPreset.matchKeywords.some((kw) => item.name.includes(kw));

            return (
              <div
                key={item.id}
                className={`p-6 rounded-2xl bg-stone-950/60 border transition-all duration-300 flex flex-col justify-between space-y-4 relative overflow-hidden group ${
                  isHighlighted
                    ? 'border-amber-400 ring-2 ring-amber-400/30 shadow-lg shadow-amber-950/40 bg-stone-900/90'
                    : 'border-stone-800 hover:border-stone-700 hover:bg-stone-950'
                }`}
              >
                {/* Highlight Badge if preset matches */}
                {isHighlighted && (
                  <div className="absolute top-0 right-0 bg-amber-500 text-stone-950 text-[10px] font-black px-3 py-1 rounded-bl-xl font-mono uppercase tracking-wide flex items-center gap-1 shadow-sm">
                    <Sparkles className="w-3 h-3" />
                    <span>{isFa ? 'انتخاب طلایی این پروژه' : 'Key Preset Match'}</span>
                  </div>
                )}

                <div className="space-y-3">
                  {/* Category Pill & ID */}
                  <div className="flex items-center justify-between text-xs text-stone-400">
                    <span className="px-2.5 py-0.5 rounded-md bg-stone-800/80 text-amber-300 font-mono text-[11px] border border-stone-700/60">
                      {isFa ? item.categoryLabelFa : item.categoryLabelEn}
                    </span>
                    <span className="font-mono text-stone-500 text-[11px]">{item.id}</span>
                  </div>

                  {/* Gear Name */}
                  <h3 className="text-lg font-bold text-white group-hover:text-amber-300 transition-colors">
                    {item.name}
                  </h3>

                  {/* Technical Specifications */}
                  <div className="p-2.5 rounded-lg bg-stone-900/90 border border-stone-800/90 text-xs font-mono text-stone-300 leading-relaxed">
                    {item.specs}
                  </div>

                  {/* Purpose in Plain Language */}
                  <div className="space-y-1.5 pt-1">
                    <span className="text-[11px] font-bold text-stone-400 uppercase tracking-wider block">
                      {isFa ? '💡 کاربرد و فایده در خروجی کار:' : 'Why It Matters for You:'}
                    </span>
                    <p className="text-xs text-stone-300 leading-relaxed">
                      {isFa ? item.purposeFa : item.purposeEn}
                    </p>
                  </div>
                </div>

                {/* Recommended Projects Tags */}
                <div className="pt-3 border-t border-stone-800/80 space-y-2">
                  <span className="text-[10px] text-stone-400 font-mono block">
                    {isFa ? 'مناسب برای پروژه‌های:' : 'Optimal use-cases:'}
                  </span>
                  <div className="flex flex-wrap gap-1.5">
                    {(isFa ? item.recommendedForFa : item.recommendedForEn).map((tag, idx) => (
                      <span
                        key={idx}
                        className="px-2 py-0.5 rounded-md bg-stone-900 text-stone-300 text-[10px] border border-stone-800 font-sans"
                      >
                        {tag}
                      </span>
                    ))}
                  </div>
                </div>
              </div>
            );
          })}
        </div>

        {/* Bottom Consultation Box */}
        <div className="p-6 sm:p-8 rounded-2xl bg-gradient-to-r from-stone-950 via-stone-900 to-stone-950 border border-stone-800 flex flex-col md:flex-row items-center justify-between gap-6">
          <div className="space-y-2 text-center md:text-right">
            <h4 className="text-lg font-bold text-white">
              {isFa ? 'نمی‌دانید برای پروژه شما کدام تجهیزات مناسب‌تر است؟' : 'Unsure which equipment fits your vision?'}
            </h4>
            <p className="text-xs sm:text-sm text-stone-400 max-w-xl">
              {isFa
                ? 'فقط کافیست ایده، بودجه و هدف خود را در بخش سفارش پروژه مطرح کنید؛ پکیج مناسب تجهیزات بدون تحمیل هزینه اضافه توسط سینا ضرغامی چیده می‌شود.'
                : 'Simply describe your goals; we architect the leanest, most effective production package tailored to your scope.'}
            </p>
          </div>

          <a
            href="#services"
            className="px-6 py-3 bg-amber-500 hover:bg-amber-400 text-stone-950 font-bold text-xs sm:text-sm rounded-xl transition-all shadow-md shrink-0 flex items-center gap-2"
          >
            <span>{isFa ? 'مشاوره و استعلام پروژه' : 'Request Consultation'}</span>
            <ChevronLeft className="w-4 h-4 rtl:block ltr:hidden" />
            <ChevronRight className="w-4 h-4 rtl:hidden ltr:block" />
          </a>
        </div>
      </div>
    </section>
  );
};
