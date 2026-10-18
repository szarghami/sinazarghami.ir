import React, { useState } from 'react';
import { Language, PhotoItem } from '../types';
import {
  X,
  ShoppingBag,
  Check,
  ShieldCheck,
  Truck,
  Sparkles,
  Send,
  Download,
  Copy,
  CheckCheck,
  Phone,
  MessageCircle,
  FileCheck,
} from 'lucide-react';
import { notifyPrintOrder } from '../utils/telegram';
import { trackEvent } from '../utils/analytics';
import { getReliableImageUrl } from '../utils/supabase';

interface PrintShopModalProps {
  photo: PhotoItem | null;
  language: Language;
  onClose: () => void;
}

export const PrintShopModal: React.FC<PrintShopModalProps> = ({
  photo,
  language,
  onClose,
}) => {
  const isFa = language === 'fa';

  const isVideoMedia = Boolean(
    photo?.isVideo ||
    photo?.category === 'video' ||
    photo?.category === 'commercial-video'
  );

  // نوع خرید: چاپ دیواری یا لایسنس فایل دیجیتال (برای ویدیو فقط دیجیتال)
  const [purchaseType, setPurchaseType] = useState<'print' | 'digital'>(() => (isVideoMedia ? 'digital' : 'print'));

  // گزینه‌های چاپ
  const [selectedSize, setSelectedSize] = useState<'30x45' | '50x75' | '70x105' | '100x150'>('50x75');
  const [selectedPaper, setSelectedPaper] = useState<'hahnemuhle' | 'canson' | 'matte'>('hahnemuhle');
  const [withFrame, setWithFrame] = useState(false);

  // گزینه‌های فایل دیجیتال
  const [digitalLicenseType, setDigitalLicenseType] = useState<'personal' | 'commercial' | 'exclusive'>('personal');

  // فرم مشخصات خریدار
  const [customerName, setCustomerName] = useState('');
  const [customerContact, setCustomerContact] = useState('');
  const [customerCity, setCustomerCity] = useState('');
  const [notes, setNotes] = useState('');

  const [orderSent, setOrderSent] = useState(false);
  const [copiedInvoice, setCopiedInvoice] = useState(false);

  if (!photo) return null;

  // ضرایب ابعاد چاپ
  const sizeMultipliers = {
    '30x45': 0.75,
    '50x75': 1.0,
    '70x105': 1.6,
    '100x150': 2.5,
  };

  const frameExtraToman = withFrame ? 1200000 : 0;
  const frameExtraUsd = withFrame ? 25 : 0;

  // محاسبه قیمت چاپ
  const basePrintPriceToman = photo.printPriceToman || 2800000;
  const basePrintPriceUsd = photo.printPriceUsd || 45;
  const printFinalPriceToman = Math.round(basePrintPriceToman * sizeMultipliers[selectedSize] + frameExtraToman);
  const printFinalPriceUsd = Math.round(basePrintPriceUsd * sizeMultipliers[selectedSize] + frameExtraUsd);

  // محاسبه قیمت لایسنس دیجیتال
  const baseDigitalPriceToman = photo.digitalPriceToman || 950000;
  const baseDigitalPriceUsd = photo.digitalPriceUsd || 18;
  const digitalMultipliers = {
    personal: 1.0,
    commercial: 2.2,
    exclusive: 5.0,
  };
  const digitalFinalPriceToman = Math.round(baseDigitalPriceToman * digitalMultipliers[digitalLicenseType]);
  const digitalFinalPriceUsd = Math.round(baseDigitalPriceUsd * digitalMultipliers[digitalLicenseType]);

  const activeFinalToman = purchaseType === 'print' ? printFinalPriceToman : digitalFinalPriceToman;
  const activeFinalUsd = purchaseType === 'print' ? printFinalPriceUsd : digitalFinalPriceUsd;

  const photoTitle = isFa ? photo.titleFa : photo.titleEn;
  const paperName =
    selectedPaper === 'hahnemuhle'
      ? 'Hahnemühle Photo Rag 308gsm'
      : selectedPaper === 'canson'
      ? 'Canson Infinity Baryta'
      : 'Archival Matte';
  const frameStatus = withFrame
    ? isFa ? 'با قاب چوب طبیعی و شیشه مات' : 'Framed in Natural Oak'
    : isFa ? 'بدون قاب (چاپ رول شاسی نفیس)' : 'Rolled Archival Print';

  const licenseName =
    digitalLicenseType === 'personal'
      ? isFa ? 'شخصی و دکوراتیو (Full-Res TIFF/JPG)' : 'Personal Non-Commercial'
      : digitalLicenseType === 'commercial'
      ? isFa ? 'تجاری، تبلیغاتی و وب (Commercial Extended)' : 'Commercial & Advertising'
      : isFa ? 'انحصاری کامل (Exclusive Rights)' : 'Exclusive License';

  // ساخت فاکتور خلاصه
  const invoiceText = isFa
    ? `سفارش اثر هنری استودیو سینا ضرغامی\n` +
      `---------------------------------\n` +
      `• اثر: ${photoTitle} (کد: ${photo.id})\n` +
      `• نوع سفارش: ${purchaseType === 'print' ? 'چاپ فاین‌آرت موزه' : 'دانلود لایسنس فایل دیجیتال'}\n` +
      (purchaseType === 'print'
        ? `• ابعاد: ${selectedSize} سانتی‌متر\n• کاغذ: ${paperName}\n• قاب: ${frameStatus}\n`
        : `• نوع لایسنس: ${licenseName}\n• کیفیت: بالاترین رزولوشن اصلی (Original Master Resolution)\n`) +
      `• مبلغ برآوردی: ${activeFinalToman.toLocaleString()} تومان\n` +
      `• نام خریدار: ${customerName || 'مشتری محترم'}\n` +
      `• تماس: ${customerContact || 'در حال پیگیری'}\n` +
      `• شهر: ${customerCity || 'ثبت نشده'}\n` +
      (notes ? `• توضیحات تکمیلی: ${notes}\n` : '') +
      `---------------------------------\n` +
      `جهت هماهنگی پرداخت و ارسال به تلگرام سینا ضرغامی (@sina_zarghami) پیام دهید.`
    : `Artwork Purchase Request - Sina Zarghami Studio\n` +
      `• Title: ${photoTitle} (ID: ${photo.id})\n` +
      `• Type: ${purchaseType === 'print' ? 'Museum Print' : 'Digital License'}\n` +
      `• Est. Total: $${activeFinalUsd}\n` +
      `• Client: ${customerName}\n` +
      `• Contact: ${customerContact}`;

  const telegramDirectUrl = `https://t.me/sina_zarghami?text=${encodeURIComponent(invoiceText)}`;
  const whatsappDirectUrl = `https://wa.me/989127193767?text=${encodeURIComponent(invoiceText)}`;

  const handleClose = () => {
    if (!orderSent && photo) {
      trackEvent('abandon_checkout', {
        photoId: photo.id,
        photoTitle: photo.titleFa,
        priceToman: activeFinalToman,
        priceUsd: activeFinalUsd,
        selectedFormat: purchaseType,
        details: `رها کردن در مرحله انتخاب ${purchaseType === 'print' ? 'چاپ فاین‌آرت' : 'لایسنس دیجیتال'}`,
      });
    }
    onClose();
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setOrderSent(true);

    trackEvent('complete_order', {
      photoId: photo.id,
      photoTitle: photo.titleFa,
      priceToman: activeFinalToman,
      priceUsd: activeFinalUsd,
      clientName: customerName || 'خریدار آنلاین',
      contact: customerContact,
      selectedFormat: purchaseType,
      details: `چاپ: ${selectedSize} ${paperName} | خریدار: ${customerName || 'ناشناس'} (${customerCity || 'ایران'})`,
    });

    // ارسال اعلان آنی به ربات تلگرام سینا ضرغامی
    notifyPrintOrder({
      photoTitle,
      size: purchaseType === 'print' ? selectedSize : `دیجیتال: ${digitalLicenseType}`,
      paper: purchaseType === 'print' ? paperName : 'Original Master File',
      frame: purchaseType === 'print' ? frameStatus : licenseName,
      priceToman: activeFinalToman,
      customerName: customerName || 'نامشخص',
      customerContact: customerContact || 'نامشخص',
      city: customerCity || 'نامشخص',
    });
  };

  const handleCopyInvoice = () => {
    navigator.clipboard.writeText(invoiceText);
    setCopiedInvoice(true);
    setTimeout(() => setCopiedInvoice(false), 2500);
  };

  return (
    <div className="fixed inset-0 z-50 bg-stone-950/85 backdrop-blur-xs flex items-center justify-center p-3 sm:p-6 overflow-y-auto">
      <div className="relative w-full max-w-4xl bg-white rounded-2xl shadow-2xl border border-stone-200 overflow-hidden my-auto max-h-[94vh] flex flex-col">
        {/* Modal Header */}
        <div className="px-6 py-4 border-b border-stone-200 flex items-center justify-between bg-stone-50/90">
          <div className="flex items-center gap-2">
            <ShoppingBag className="w-5 h-5 text-amber-700" />
            <div>
              <h3 className="text-base sm:text-lg font-bold text-stone-900">
                {isVideoMedia
                  ? (isFa ? 'سفارش لایسنس ویدیوی سینمایی و فوتیج اختصاصی' : 'Video Footage Licensing & Master File')
                  : (isFa ? 'سفارش خرید اثر و صدور فاکتور رسمی' : 'Purchase Artwork & Fine-Art Licensing')}
              </h3>
              <p className="text-xs text-stone-500 font-mono">
                {photoTitle} · {photo.camera} {photo.videoQuality ? `· ${photo.videoQuality}` : ''}
              </p>
            </div>
          </div>
          <button
            onClick={handleClose}
            className="p-1.5 text-stone-400 hover:text-stone-700 rounded-md cursor-pointer transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Modal Body */}
        <div className="p-6 overflow-y-auto space-y-6">
          {orderSent ? (
            /* Order Submitted Success View */
            <div className="py-8 px-4 text-center space-y-6 max-w-xl mx-auto">
              <div className="w-16 h-16 bg-emerald-100 text-emerald-700 rounded-full flex items-center justify-center mx-auto shadow-sm">
                <Check className="w-8 h-8" />
              </div>

              <div className="space-y-2">
                <h4 className="text-xl font-bold text-stone-900">
                  {isFa ? 'سفارش شما با موفقیت ثبت شد!' : 'Order Saved Successfully!'}
                </h4>
                <p className="text-xs sm:text-sm text-stone-600 leading-relaxed">
                  {isFa
                    ? 'مشخصات اثر و برآورد قیمت ذخیره و به تلگرام سینا ضرغامی ارسال شد. برای نهایی کردن پرداخت و هماهنگی ارسال می‌توانید مستقیماً از طریق تلگرام یا واتساپ پیام دهید:'
                    : 'Order parameters recorded and dispatched to Sina Zarghami via Telegram bot. Connect directly to finalize coordination:'}
                </p>
              </div>

              {/* Direct Communication Buttons */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-2">
                <a
                  href={telegramDirectUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="px-5 py-3 bg-[#229ED9] hover:bg-[#1E88E5] text-white font-bold text-xs sm:text-sm rounded-xl transition-all shadow-md flex items-center justify-center gap-2"
                >
                  <Send className="w-4 h-4" />
                  <span>{isFa ? 'ارسال در تلگرام سینا ضرغامی' : 'Open in Telegram'}</span>
                </a>

                <a
                  href={whatsappDirectUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="px-5 py-3 bg-[#25D366] hover:bg-[#1EBE5D] text-white font-bold text-xs sm:text-sm rounded-xl transition-all shadow-md flex items-center justify-center gap-2"
                >
                  <MessageCircle className="w-4 h-4" />
                  <span>{isFa ? 'ارسال در واتساپ (۰۹۱۲۷۱۹۳۷۶۷)' : 'WhatsApp (Direct)'}</span>
                </a>
              </div>

              {/* Copy Invoice Button */}
              <div className="pt-2 flex flex-col sm:flex-row items-center justify-center gap-3">
                <button
                  type="button"
                  onClick={handleCopyInvoice}
                  className="w-full sm:w-auto px-4 py-2 border border-stone-300 hover:bg-stone-50 text-stone-700 text-xs font-medium rounded-lg flex items-center justify-center gap-1.5 cursor-pointer"
                >
                  {copiedInvoice ? (
                    <>
                      <CheckCheck className="w-4 h-4 text-emerald-600" />
                      <span className="text-emerald-700 font-bold">{isFa ? 'متن فاکتور کپی شد' : 'Invoice Copied'}</span>
                    </>
                  ) : (
                    <>
                      <Copy className="w-4 h-4 text-stone-500" />
                      <span>{isFa ? 'کپی متن سفارش و مشخصات' : 'Copy Invoice Text'}</span>
                    </>
                  )}
                </button>

                <button
                  type="button"
                  onClick={onClose}
                  className="w-full sm:w-auto px-6 py-2 bg-stone-900 text-white text-xs font-semibold rounded-lg hover:bg-stone-800"
                >
                  {isFa ? 'بستن پنجره' : 'Done & Close'}
                </button>
              </div>
            </div>
          ) : (
            /* Order Formulation Form */
            <form onSubmit={handleSubmit} className="space-y-6">
              {/* Selector Tabs: Print vs Digital License (فقط برای عکس‌ها انتخاب چاپ وجود دارد؛ برای ویدیو فقط لایسنس دیجیتال) */}
              {!isVideoMedia ? (
                <div className="flex p-1 bg-stone-100 rounded-xl border border-stone-200">
                  <button
                    type="button"
                    onClick={() => setPurchaseType('print')}
                    className={`flex-1 py-2.5 rounded-lg text-xs sm:text-sm font-bold transition-all cursor-pointer flex items-center justify-center gap-2 ${
                      purchaseType === 'print'
                        ? 'bg-white text-stone-900 shadow-xs border border-stone-200/80'
                        : 'text-stone-600 hover:text-stone-900'
                    }`}
                  >
                    <ShoppingBag className="w-4 h-4 text-amber-600" />
                    <span>{isFa ? '۱. چاپ نفیس فاین‌آرت موزه و شاسی دیواری' : '1. Archival Fine-Art Print'}</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => setPurchaseType('digital')}
                    className={`flex-1 py-2.5 rounded-lg text-xs sm:text-sm font-bold transition-all cursor-pointer flex items-center justify-center gap-2 ${
                      purchaseType === 'digital'
                        ? 'bg-white text-stone-900 shadow-xs border border-stone-200/80'
                        : 'text-stone-600 hover:text-stone-900'
                    }`}
                  >
                    <Download className="w-4 h-4 text-indigo-600" />
                    <span>{isFa ? '۲. خرید لایسنس و دانلود فایل باکیفیت اصلی' : '2. High-Res Digital License'}</span>
                  </button>
                </div>
              ) : (
                <div className="p-3 bg-red-50 border border-red-200 rounded-xl flex items-center gap-2 text-xs text-red-900 font-bold">
                  <Download className="w-4 h-4 text-red-600 shrink-0" />
                  <span>
                    {isFa
                      ? 'لایسنس فوتیج سینمایی و ویدیوی 4K (دانلود مستقیم فایل مستر با کیفیت اصلی بدون افت کیفیت)'
                      : 'Cinematic 4K Master Video Footage License (Direct Master File Download)'}
                  </span>
                </div>
              )}

              <div className="grid grid-cols-1 md:grid-cols-12 gap-6 items-start">
                {/* Photo Preview & Guarantees */}
                <div className="md:col-span-5 space-y-4">
                  <div className="relative rounded-xl overflow-hidden bg-stone-100 border border-stone-200 aspect-4/3 shadow-xs">
                    <img
                      src={getReliableImageUrl(photo.imageUrl)}
                      alt={photoTitle}
                      className="w-full h-full object-cover"
                      referrerPolicy="no-referrer"
                      onError={(e) => {
                        const target = e.currentTarget;
                        if (photo.imageUrl && target.src !== photo.imageUrl) {
                          target.src = photo.imageUrl;
                        }
                      }}
                    />
                  </div>

                  {/* Pricing Summary Card */}
                  <div className="p-4 rounded-xl bg-amber-50/70 border border-amber-200/80 space-y-2">
                    <div className="flex items-center justify-between text-xs text-amber-900 font-mono">
                      <span>{isFa ? 'مبلغ برآوردی نهایی:' : 'Estimated Total:'}</span>
                      <span className="text-base font-black text-amber-950 font-mono">
                        {isFa ? `${activeFinalToman.toLocaleString()} تومان` : `$${activeFinalUsd}`}
                      </span>
                    </div>
                    <div className="text-[11px] text-amber-800 leading-relaxed">
                      {purchaseType === 'print'
                        ? isFa
                          ? `چاپ ابعاد ${selectedSize} سم، ${paperName}، ${frameStatus}`
                          : `Size: ${selectedSize}cm, Paper: ${paperName}, ${frameStatus}`
                        : isFa
                        ? `لایسنس ${licenseName} با تحویل مستقیم فایل Master RAW/TIFF`
                        : `License: ${licenseName} with Master RAW/TIFF download`}
                    </div>
                  </div>

                  {/* Quality Badges */}
                  <div className="p-3 bg-stone-50 rounded-xl border border-stone-200 space-y-2 text-xs text-stone-600">
                    <div className="flex items-center gap-2">
                      <ShieldCheck className="w-4 h-4 text-emerald-600 shrink-0" />
                      <span>{isFa ? 'ضمانت ماندگاری ۱۰۰ ساله رنگ و اصالت امضا' : '100-Year Color Archival Rating'}</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <Truck className="w-4 h-4 text-stone-500 shrink-0" />
                      <span>{isFa ? 'بسته‌بندی ایمن ضدضربه و ارسال بیمه‌شده به سراسر کشور' : 'Insured Safe Packaging Nationwide'}</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <Phone className="w-4 h-4 text-amber-600 shrink-0" />
                      <span>{isFa ? 'پشتیبانی مستقیم سینا ضرغامی: ۰۹۱۲۷۱۹۳۷۶۷' : 'Direct Line: +98 912 719 3767'}</span>
                    </div>
                  </div>
                </div>

                {/* Form Inputs */}
                <div className="md:col-span-7 space-y-5">
                  {purchaseType === 'print' ? (
                    /* Print Configuration */
                    <div className="space-y-4">
                      {/* Dimensions */}
                      <div>
                        <label className="text-xs font-bold text-stone-700 block mb-2">
                          {isFa ? 'ابعاد چاپ تابلوی دیواری (سانتی‌متر):' : 'Print Dimensions:'}
                        </label>
                        <div className="grid grid-cols-2 gap-2">
                          {[
                            { id: '30x45', label: '۳۰ × ۴۵ سانتی‌متر' },
                            { id: '50x75', label: '۵۰ × ۷۵ سانتی‌متر (استاندارد)' },
                            { id: '70x105', label: '۷۰ × ۱۰۵ سانتی‌متر (بزرگ)' },
                            { id: '100x150', label: '۱۰۰ × ۱۵۰ سانتی‌متر (کلکسیونی)' },
                          ].map((s) => (
                            <button
                              key={s.id}
                              type="button"
                              onClick={() => setSelectedSize(s.id as any)}
                              className={`p-2.5 rounded-lg text-xs font-medium border text-center transition-all cursor-pointer ${
                                selectedSize === s.id
                                  ? 'bg-stone-900 text-white border-stone-900 font-bold'
                                  : 'bg-stone-50 border-stone-200 text-stone-700 hover:bg-stone-100'
                              }`}
                            >
                              {s.label}
                            </button>
                          ))}
                        </div>
                      </div>

                      {/* Paper Type */}
                      <div>
                        <label className="text-xs font-bold text-stone-700 block mb-2">
                          {isFa ? 'نوع کاغذ چاپ فاین‌آرت:' : 'Paper Substrate:'}
                        </label>
                        <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
                          {[
                            { id: 'hahnemuhle', labelFa: 'Hahnemühle ابریشمی', sub: '۱۰۰٪ کتان نفیس' },
                            { id: 'canson', labelFa: 'Canson Baryta', sub: 'درخشش مرواریدی' },
                            { id: 'matte', labelFa: 'Archival Matte', sub: 'مات کلاسیک' },
                          ].map((p) => (
                            <button
                              key={p.id}
                              type="button"
                              onClick={() => setSelectedPaper(p.id as any)}
                              className={`p-2 rounded-lg text-xs border text-center transition-all cursor-pointer ${
                                selectedPaper === p.id
                                  ? 'bg-amber-100 text-amber-950 border-amber-600 font-bold'
                                  : 'bg-stone-50 border-stone-200 text-stone-700 hover:bg-stone-100'
                              }`}
                            >
                              <div className="font-bold">{p.labelFa}</div>
                              <div className="text-[10px] text-stone-500">{p.sub}</div>
                            </button>
                          ))}
                        </div>
                      </div>

                      {/* Frame Option */}
                      <div className="p-3 rounded-lg border border-stone-200 bg-stone-50/80 flex items-center justify-between">
                        <div>
                          <div className="text-xs font-bold text-stone-900">
                            {isFa ? 'قاب چوب طبیعی + پاسپارتو هلندی' : 'Solid Natural Oak Frame & Mat'}
                          </div>
                          <div className="text-[11px] text-stone-500">
                            {isFa ? '+ ۱,۲۰۰,۰۰۰ تومان به مبلغ اضافه می‌شود' : '+$25 add-on'}
                          </div>
                        </div>
                        <input
                          type="checkbox"
                          checked={withFrame}
                          onChange={(e) => setWithFrame(e.target.checked)}
                          className="w-5 h-5 rounded-md accent-amber-600 cursor-pointer"
                        />
                      </div>
                    </div>
                  ) : (
                    /* Digital License Configuration */
                    <div className="space-y-4">
                      <label className="text-xs font-bold text-stone-700 block">
                        {isFa ? 'نوع لایسنس و حقوق استفاده فایل دیجیتال:' : 'Licensing Rights:'}
                      </label>
                      <div className="space-y-2">
                        {[
                          {
                            id: 'personal',
                            titleFa: 'استفاده شخصی، دکوراسیون و چاپ خانگی',
                            descFa: 'دریافت فایل JPG/TIFF رزولوشن ماکزیمم برای دسکتاپ، چاپ روی شاسی شخصی یا کالکشن هنری.',
                            priceRatio: '۱ برابر پایه',
                          },
                          {
                            id: 'commercial',
                            titleFa: 'لایسنس تجاری، وب‌سایت، پوستر و تیزر',
                            descFa: 'مجوز چاپ در کتاب، تبلیغات برند، وب‌سایت‌ها، بیلبورد و استفاده در پروژه‌های رسانه‌ای.',
                            priceRatio: '۲.۲ برابر پایه',
                          },
                          {
                            id: 'exclusive',
                            titleFa: 'لایسنس انحصاری و بایگانی اثر (Exclusive Buyout)',
                            descFa: 'واگذاری انحصاری حقوق تجاری اثر به شما و عدم فروش مجدد به سایر اشخاص.',
                            priceRatio: '۵ برابر پایه',
                          },
                        ].map((lic) => (
                          <div
                            key={lic.id}
                            onClick={() => setDigitalLicenseType(lic.id as any)}
                            className={`p-3 rounded-xl border transition-all cursor-pointer ${
                              digitalLicenseType === lic.id
                                ? 'bg-indigo-50 border-indigo-500 shadow-xs'
                                : 'bg-stone-50 border-stone-200 hover:bg-stone-100'
                            }`}
                          >
                            <div className="flex items-center justify-between">
                              <span className="text-xs font-bold text-stone-900">{lic.titleFa}</span>
                              <span className="text-[11px] font-mono text-indigo-700 font-bold">{lic.priceRatio}</span>
                            </div>
                            <p className="text-[11px] text-stone-600 mt-1 leading-relaxed">{lic.descFa}</p>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* Customer Information Inputs */}
                  <div className="pt-2 border-t border-stone-200 space-y-3">
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                      <div>
                        <label className="text-xs font-medium text-stone-700 block mb-1">
                          {isFa ? 'نام و نام‌خانوادگی:' : 'Your Name:'}
                        </label>
                        <input
                          type="text"
                          required
                          value={customerName}
                          onChange={(e) => setCustomerName(e.target.value)}
                          placeholder={isFa ? 'مثال: رضا محمدی' : 'e.g. Alex Smith'}
                          className="w-full px-3 py-2 rounded-lg border border-stone-300 text-xs focus:ring-2 focus:ring-stone-900 outline-none"
                        />
                      </div>

                      <div>
                        <label className="text-xs font-medium text-stone-700 block mb-1">
                          {isFa ? 'شماره تماس یا آیدی تلگرام:' : 'Phone or Telegram:'}
                        </label>
                        <input
                          type="text"
                          required
                          value={customerContact}
                          onChange={(e) => setCustomerContact(e.target.value)}
                          placeholder="0912..."
                          className="w-full px-3 py-2 rounded-lg border border-stone-300 text-xs focus:ring-2 focus:ring-stone-900 outline-none"
                        />
                      </div>
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                      <div>
                        <label className="text-xs font-medium text-stone-700 block mb-1">
                          {isFa ? 'شهر / استان مقصد:' : 'City / Destination:'}
                        </label>
                        <input
                          type="text"
                          value={customerCity}
                          onChange={(e) => setCustomerCity(e.target.value)}
                          placeholder={isFa ? 'مثال: تهران، اصفهان، مشهد...' : 'Tehran, London, etc.'}
                          className="w-full px-3 py-2 rounded-lg border border-stone-300 text-xs focus:ring-2 focus:ring-stone-900 outline-none"
                        />
                      </div>

                      <div>
                        <label className="text-xs font-medium text-stone-700 block mb-1">
                          {isFa ? 'یادداشت یا ابعاد سفارشی:' : 'Custom Notes:'}
                        </label>
                        <input
                          type="text"
                          value={notes}
                          onChange={(e) => setNotes(e.target.value)}
                          placeholder={isFa ? 'درخواست امضا، ارسال فوری...' : 'Optional notes...'}
                          className="w-full px-3 py-2 rounded-lg border border-stone-300 text-xs focus:ring-2 focus:ring-stone-900 outline-none"
                        />
                      </div>
                    </div>
                  </div>

                  {/* Submit CTA */}
                  <div className="pt-3">
                    <button
                      type="submit"
                      className="w-full py-3.5 px-4 bg-amber-600 hover:bg-amber-700 text-white font-bold text-xs sm:text-sm rounded-xl transition-all shadow-md flex items-center justify-center gap-2 cursor-pointer"
                    >
                      <ShoppingBag className="w-4 h-4" />
                      <span>
                        {isFa
                          ? `ثبت پیش‌فاکتور و ارسال سفارش (${activeFinalToman.toLocaleString()} تومان)`
                          : `Confirm Order & Proceed ($${activeFinalUsd})`}
                      </span>
                    </button>
                    <p className="text-[11px] text-stone-400 text-center mt-2">
                      {isFa
                        ? 'پس از کلیک، اعلان سفارش مستقیماً به تلگرام سینا ضرغامی مخابره خواهد شد.'
                        : 'Dispatched securely to Sina Zarghami Studio.'}
                    </p>
                  </div>
                </div>
              </div>
            </form>
          )}
        </div>
      </div>
    </div>
  );
};
