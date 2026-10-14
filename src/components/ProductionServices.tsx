import React, { useState } from 'react';
import { Language } from '../types';
import { Video, Camera, Compass, Sparkles, Send, CheckCircle2, MessageSquare, Phone } from 'lucide-react';
import { notifyProjectCommission } from '../utils/telegram';

interface ProductionServicesProps {
  language: Language;
}

export const ProductionServices: React.FC<ProductionServicesProps> = ({ language }) => {
  const isFa = language === 'fa';

  const [serviceType, setServiceType] = useState('commercial-video');
  const [clientName, setClientName] = useState('');
  const [clientContact, setClientContact] = useState('');
  const [projectBrief, setProjectBrief] = useState('');
  const [submitted, setSubmitted] = useState(false);
  const [directTelegramUrl, setDirectTelegramUrl] = useState('');
  const [directWhatsappUrl, setDirectWhatsappUrl] = useState('');

  const services = [
    {
      id: 'commercial-video',
      titleFa: 'تولید تیزر و فیلم‌های مستند و صنعتی',
      titleEn: 'Cinematography & Documentary Film',
      descFa: 'تصویربرداری هوایی، فیلمبرداری ۴K با دوربین فول‌فریم Canon R8، لرزشگیر DJI RS 4 و نورپردازی CRI ۹۷، تدوین و اصلاح رنگ حرفه‌ای در DaVinci Resolve.',
      descEn: 'Full-frame 4K cinematography, DJI RS 4 stabilization, CRI≥97 studio lighting, and color grading in DaVinci Resolve for leading brands.',
      icon: Video,
    },
    {
      id: 'photo-commission',
      titleFa: 'عکاسی صنعتی، کاتالوگ و هایپرمکرو',
      titleEn: 'Industrial, Catalog & Hyper-Macro Photography',
      descFa: 'عکاسی با پس‌زمینه سفید استاندارد دیجی‌کالا و کاتالوگی در محل کارفرما با سیستم پرتابل Ilkeen، و عکاسی هایپرمکرو میکروسکوپی از قطعات و محصولات.',
      descEn: 'Pure white catalog photography on-location, e-commerce assets, and microscopic hyper-macro documentation of precision parts.',
      icon: Camera,
    },
    {
      id: 'custom-expedition',
      titleFa: 'طراحی و هدایت سفرهای VIP و عکاسی',
      titleEn: 'Custom VIP Wilderness Expeditions',
      descFa: 'طراحی تورهای اختصاصی برای گروه‌های خاص، فیلمبرداران و کاوشگران با هماهنگی کامل مجوزها، خودروهای آفرود، امنیت کویر و آموزش عکاسی میدانی.',
      descEn: 'Tailored expedition logistics, certified guiding, and remote location scouting across Iran for international crews and adventure collectors.',
      icon: Compass,
    },
  ];

  const handleServiceSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitted(true);

    const chosenService = services.find((s) => s.id === serviceType);
    const serviceTitle = chosenService ? (isFa ? chosenService.titleFa : chosenService.titleEn) : serviceType;

    // ارسال آنی به ربات تلگرام سینا
    notifyProjectCommission({
      service: serviceTitle,
      clientName,
      contact: clientContact,
      brief: projectBrief,
    });

    const msg = isFa
      ? `درخواست همکاری با استودیو سینا ضرغامی:\n` +
        `• حوزه خدمت: ${serviceTitle}\n` +
        `• نام مشتری/شرکت: ${clientName}\n` +
        `• اطلاعات تماس: ${clientContact}\n` +
        `• شرح نیاز: ${projectBrief}`
      : `Project Commission Request:\n` +
        `• Service: ${serviceTitle}\n` +
        `• Client: ${clientName}\n` +
        `• Contact: ${clientContact}\n` +
        `• Brief: ${projectBrief}`;

    setDirectTelegramUrl(`https://t.me/sina_zarghami?text=${encodeURIComponent(msg)}`);
    setDirectWhatsappUrl(`https://wa.me/989127193767?text=${encodeURIComponent(msg)}`);
  };

  return (
    <section id="services" className="py-20 bg-stone-50/60 border-b border-stone-200/70">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="max-w-3xl mb-14 space-y-3">
          <div className="flex items-center gap-2 text-xs font-mono uppercase tracking-wider text-stone-500">
            <span>07</span>
            <span aria-hidden="true">·</span>
            <span>{isFa ? 'سفارش پروژه و خدمات تولید' : 'Commissions & Services'}</span>
          </div>
          <h2 className="text-2xl sm:text-3xl md:text-4xl font-extrabold text-stone-900 tracking-tight">
            {isFa ? 'خدمات حرفه‌ای تصویربرداری، عکاسی و هدایت سفر' : 'Production Services & Commissioning'}
          </h2>
          <p className="text-sm sm:text-base text-stone-600 leading-relaxed">
            {isFa
              ? 'همکاری با کارخانجات صنعتی، برندهای معتبر، آزمایشگاه‌ها، وزارتخانه‌ها و تیم‌های مستندساز با تجهیزات اختصاصی استودیو.'
              : 'Collaborating with industrial enterprises, luxury brands, pharmaceutical labs, and production studios.'}
          </p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-12 gap-10 items-start">
          {/* Service Cards */}
          <div className="lg:col-span-7 space-y-5">
            {services.map((s) => {
              const Icon = s.icon;
              const isSelected = serviceType === s.id;
              return (
                <div
                  key={s.id}
                  onClick={() => setServiceType(s.id)}
                  className={`p-6 rounded-2xl border transition-all cursor-pointer flex gap-5 items-start ${
                    isSelected
                      ? 'bg-white border-amber-700 shadow-md ring-1 ring-amber-700/20'
                      : 'bg-white/80 border-stone-200/80 hover:bg-white hover:border-stone-300'
                  }`}
                >
                  <div className={`p-3 rounded-xl shrink-0 ${
                    isSelected ? 'bg-amber-100 text-amber-900' : 'bg-stone-100 text-stone-700'
                  }`}>
                    <Icon className="w-5 h-5" />
                  </div>

                  <div className="space-y-1.5 flex-1">
                    <h3 className="text-base sm:text-lg font-bold text-stone-900">
                      {isFa ? s.titleFa : s.titleEn}
                    </h3>
                    <p className="text-xs sm:text-sm text-stone-600 leading-relaxed">
                      {isFa ? s.descFa : s.descEn}
                    </p>
                  </div>
                </div>
              );
            })}
          </div>

          {/* Commission Request Form */}
          <div className="lg:col-span-5 bg-white p-6 sm:p-8 rounded-2xl border border-stone-200/80 shadow-xs space-y-5">
            <div className="space-y-1">
              <h3 className="text-lg font-bold text-stone-900">
                {isFa ? 'استعلام زمان و برآورد پروژه' : 'Initiate Project Dialogue'}
              </h3>
              <p className="text-xs text-stone-500">
                {isFa
                  ? 'اطلاعات پروژه خود را بنویسید تا ظرف کمتر از ۲۴ ساعت جهت بررسی و برنامه‌ریزی با شما تماس گرفته شود.'
                  : 'Submit initial requirements for direct coordination and timeline estimate within 24 hours.'}
              </p>
            </div>

            {submitted ? (
              <div className="p-6 bg-emerald-50 rounded-2xl text-center space-y-4 border border-emerald-200">
                <CheckCircle2 className="w-8 h-8 text-emerald-600 mx-auto" />
                <div className="space-y-1">
                  <h4 className="text-base font-bold text-emerald-950">
                    {isFa ? 'درخواست شما با موفقیت ثبت شد' : 'Request Received'}
                  </h4>
                  <p className="text-xs text-emerald-800 leading-relaxed">
                    {isFa
                      ? 'پیام شما به سیستم تلگرام سینا ضرغامی مخابره شد. برای گفتگوی آنی می‌توانید از طریق تلگرام یا تماس مستقیم ارتباط برقرار کنید:'
                      : 'Connecting to Sina Zarghami via Telegram for direct follow-up:'}
                  </p>
                </div>

                <div className="space-y-2 pt-2">
                  <a
                    href={directTelegramUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="w-full py-2.5 px-4 bg-[#229ED9] hover:bg-[#1E88E5] text-white text-xs font-bold rounded-xl transition-all shadow-sm flex items-center justify-center gap-2"
                  >
                    <Send className="w-4 h-4" />
                    <span>{isFa ? 'گفتگوی مستقیم در تلگرام (@sina_zarghami)' : 'Message on Telegram'}</span>
                  </a>

                  <a
                    href={directWhatsappUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="w-full py-2.5 px-4 bg-[#25D366] hover:bg-[#1EBE5D] text-white text-xs font-bold rounded-xl transition-all shadow-sm flex items-center justify-center gap-2"
                  >
                    <Phone className="w-4 h-4" />
                    <span>{isFa ? 'واتساپ مستقیم: ۰۹۱۲۷۱۹۳۷۶۷' : 'WhatsApp: +98 912 719 3767'}</span>
                  </a>
                </div>
              </div>
            ) : (
              <form onSubmit={handleServiceSubmit} className="space-y-4">
                <div>
                  <label className="block text-xs font-medium text-stone-700 mb-1">
                    {isFa ? 'نام شما یا نام برند / شرکت' : 'Your Name / Company'}
                  </label>
                  <input
                    type="text"
                    required
                    value={clientName}
                    onChange={(e) => setClientName(e.target.value)}
                    placeholder={isFa ? 'مثال: شرکت مهندسی / برند آرایشی...' : 'e.g. Studio Form'}
                    className="w-full px-3 py-2 text-xs sm:text-sm border border-stone-300 rounded-lg focus:outline-none focus:ring-1 focus:ring-amber-600"
                  />
                </div>

                <div>
                  <label className="block text-xs font-medium text-stone-700 mb-1">
                    {isFa ? 'شماره تماس یا ایمیل' : 'Phone, WhatsApp, or Email'}
                  </label>
                  <input
                    type="text"
                    required
                    value={clientContact}
                    onChange={(e) => setClientContact(e.target.value)}
                    placeholder="0912..."
                    className="w-full px-3 py-2 text-xs sm:text-sm border border-stone-300 rounded-lg focus:outline-none focus:ring-1 focus:ring-amber-600"
                  />
                </div>

                <div>
                  <label className="block text-xs font-medium text-stone-700 mb-1">
                    {isFa ? 'خلاصه پروژه و زمان‌بندی مدنظر' : 'Project Brief & Timeline'}
                  </label>
                  <textarea
                    rows={3}
                    required
                    value={projectBrief}
                    onChange={(e) => setProjectBrief(e.target.value)}
                    placeholder={isFa ? 'نوع پروژه، محصول، لوکیشن، اهداف ویدیو یا عکاسی...' : 'Location, scope of deliverables, target dates...'}
                    className="w-full px-3 py-2 text-xs sm:text-sm border border-stone-300 rounded-lg focus:outline-none focus:ring-1 focus:ring-amber-600 resize-none"
                  />
                </div>

                <button
                  type="submit"
                  className="w-full py-3 bg-stone-900 hover:bg-stone-800 text-white text-xs sm:text-sm font-bold rounded-xl transition-colors flex items-center justify-center gap-2 cursor-pointer shadow-sm"
                >
                  <Send className="w-4 h-4 text-amber-400" />
                  <span>{isFa ? 'ارسال درخواست و استعلام پروژه' : 'Submit Project Commission'}</span>
                </button>
              </form>
            )}
          </div>
        </div>
      </div>
    </section>
  );
};
