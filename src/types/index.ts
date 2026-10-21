// =====================================================================
// تعاریف تایپ‌ها و ساختار داده‌های وب‌سایت سینا ضرغامی (sinazarghami.ir)
// =====================================================================

// زبان‌های پشتیبانی‌شده: fa = فارسی، en = انگلیسی
export type Language = 'fa' | 'en';

// دسته‌بندی‌های تصاویر گالری
export type PhotoCategory = 'all' | 'landscape' | 'aerial' | 'architecture' | 'documentary' | 'portrait';

// ساختار اطلاعات هر قطعه عکس یا ویدیو
export interface PhotoItem {
  id: string;
  titleFa: string; // عنوان فارسی اثر
  titleEn: string; // عنوان انگلیسی اثر
  category: 'landscape' | 'aerial' | 'architecture' | 'documentary' | 'portrait';
  locationFa: string; // موقعیت مکانی به فارسی (مثلاً: کویر لوت)
  locationEn: string; // موقعیت مکانی به انگلیسی
  year: string; // سال ثبت (مثلاً: 2024 یا 1403)
  imageUrl: string; // آدرس فایل تصویر یا داده فشرده‌شده
  thumbnailUrl?: string;
  camera: string; // مدل دوربین (مثلاً: Canon R8)
  lens: string; // مدل لنز (مثلاً: Canon EF 50mm f/1.8)
  exif: {
    aperture: string; // دیافراگم (f/1.8, f/8)
    shutter: string; // شاتر (1/250s)
    iso: string; // ایزو (100)
    focalLength: string; // فاصله کانونی (50mm)
  };
  descriptionFa: string; // توضیح فارسی اثر
  descriptionEn: string; // توضیح انگلیسی اثر
  // تنظیمات فروش نسخه چاپی
  printAvailable: boolean; // آیا نسخه چاپ فاین‌آرت یا شاسی برای فروش در دسترس است؟
  printPriceToman: number; // قیمت چاپ به تومان
  printPriceUsd: number; // قیمت چاپ به دلار
  // تنظیمات فروش نسخه فایل دیجیتال و لایسنس رزولوشن اصلی
  digitalAvailable?: boolean; // آیا لایسنس دانلود فایل اصلی (Full-Res / RAW / TIFF) برای فروش در دسترس است؟
  digitalPriceToman?: number; // قیمت لایسنس دیجیتال به تومان
  digitalPriceUsd?: number; // قیمت لایسنس دیجیتال به دلار
  // ویدیویی بودن اثر (در صورت فوتیج سینمایی یا تیزر)
  isVideo?: boolean;
  videoDuration?: string;
  videoQuality?: string; // مثلاً 4K / 60fps
  featured?: boolean;
  galleryImages?: string[]; // تصاویر آلبوم (برای پست کردن چند عکس به صورت یک گالری)
  isAlbum?: boolean; // آیا این پست یک آلبوم چندعکسی است؟
  // فیلدهای تکمیلی جهت مدیریت داینامیک CMS و تفکیک نمونه‌کار
  showOnHome?: boolean; // نمایش در پست‌های برگزیده صفحه اصلی
  homeOrder?: number; // ترتیب نمایش در صفحه اصلی برای جابجایی
  portfolioScope?: 'commercial' | 'travel'; // تفکیک نمونه‌کار تخصصی/تجاری از عکس‌های سفر
  commercialCategory?: string; // شناسه یا نام دسته‌بندی تخصصی که ادمین در پنل تعریف می‌کند
  clientName?: string; // نام شرکت/کارفرما
  clientInfo?: string; // توضیحات پروژه برای آن شرکت
  gearIds?: string[]; // تجهیزات استفاده‌شده
  techniques?: string[]; // تکنیک‌های به‌کاررفته در این عکس
}

// ساختار اطلاعات تجهیزات و ابزارهای تولید (Production Gear Locker)
export type EquipmentCategory =
  | 'cameras'
  | 'lenses'
  | 'lighting'
  | 'audio'
  | 'motion'
  | 'studio'
  | 'teleprompter';

export interface EquipmentItem {
  id: string;
  name: string; // نام تجهیز (مثلاً Canon R8 یا Canon EF 50mm f/1.8)
  category: EquipmentCategory;
  categoryLabelFa: string; // دسته‌بندی فارسی (مثلاً: دوربین، لنز، نورپردازی)
  categoryLabelEn: string;
  specs: string; // مشخصات فنی کلیدی
  purposeFa: string; // توضیح کاربردی به زبان عامیانه و روان: این قطعه برای چیست و چرا استفاده می‌شود؟
  purposeEn: string;
  recommendedForFa: string[]; // مناسب برای چه پروژه‌هایی (مثلاً: تیزر تبلیغاتی، پرتره با بوکه رویایی، ماکرو از حشرات)
  recommendedForEn: string[];
  imageUrl?: string;
}

// ساختار اطلاعات سفرهای میدانی و تورها
export interface ExpeditionItem {
  id: string;
  titleFa: string; // عنوان فارسی سفر
  titleEn: string;
  locationFa: string; // مقصد
  locationEn: string;
  durationFa: string; // مدت زمان (مثلاً: ۴ روز و ۳ شب)
  durationEn: string;
  seasonFa: string; // فصل مناسب
  seasonEn: string;
  coverImage: string; // عکس کاور سفر
  descriptionFa: string;
  descriptionEn: string;
  highlightsFa: string[]; // ویژگی‌های کلیدی سفر
  highlightsEn: string[];
  upcomingDate?: string; // تاریخ برگزاری بعدی
  bookingOpen: boolean; // آیا ثبت‌نام باز است؟
  difficultyFa: string; // درجه سختی (آسان، متوسط، سخت)
  difficultyEn: string;
  tripType?: 'guided_tour' | 'personal_expedition' | 'travelogue' | 'tour'; // سفرنامه شخصی یا تور گردشگری
  tourStatus?: 'completed' | 'upcoming' | 'open'; // وضعیت برگزاری تور
  bookingUrl?: string;
  gpxTrackUrl?: string;
  galleryPhotos?: string[]; // تصاویر بیشتر از این سفر/اکسپدیشن
}

// اینترفیس دسته‌بندی‌های داینامیک CMS
export interface CategoryItem {
  id: string;
  titleFa: string;
  titleEn: string;
  descriptionFa?: string;
  descriptionEn?: string;
  iconName?: string;
  order?: number;
  nameFa?: string; // برای سازگاری دوجانبه با کدهای پیشین
  nameEn?: string;
}

// دسته‌بندی‌های نمونه‌کارهای تجاری/تخصصی قابل مدیریت توسط ادمین
export type CommercialCategoryItem = CategoryItem;

// تکنیک‌های عکاسی و تصویربرداری قابل تعریف و انتساب به عکس‌ها و مقالات
export interface DefinedTechnique {
  id: string;
  nameFa: string;
  nameEn: string;
  descriptionFa?: string;
  descriptionEn?: string;
}

// کارت‌های دسته‌بندی و ناوبری در صفحه اصلی
export interface HomeCategoryCard {
  id: string;
  titleFa: string;
  titleEn: string;
  subtitleFa: string;
  subtitleEn: string;
  coverUrl: string;
  targetPath: string;
  badgeFa?: string;
  badgeEn?: string;
}

// ساختار مقالات و یادداشت‌های آموزشی/فنی سینا ضرغامی
export interface ArticleItem {
  id: string;
  slug: string;
  titleFa: string;
  titleEn: string;
  summaryFa: string;
  summaryEn: string;
  contentFa: string;
  contentEn: string;
  coverImage: string;
  publishedAt: string;
  readTimeMinutes: number;
  category: string;
  tags: string[];
  author: string;
  isPublished: boolean;
  // سازگاری کامل با کامپوننت‌های موجود
  excerptFa: string;
  excerptEn: string;
  coverUrl: string;
  readingTimeMinutes: number;
  categoryFa: string;
  categoryEn: string;
  seoKeywords?: string[];
  relatedTechniques?: string[];
  relatedGearIds?: string[];
  featured?: boolean;
}

// ساختار اطلاعات پروژه‌های نرم‌افزاری و وب‌سایت‌های ساخته‌شده
export interface SoftwareItem {
  id: string;
  title: string; // نام نرم‌افزار یا سایت
  taglineFa: string; // شعار کوتاه فارسی
  taglineEn: string;
  descriptionFa: string; // توضیحات فارسی پروژه
  descriptionEn: string;
  techStack: string[]; // زبان‌ها و فریم‌ورک‌های استفاده‌شده
  year: string; // سال ساخت
  liveUrl?: string; // آدرس اینترنتی زنده برای مشاهده
  githubUrl?: string; // لینک گیت‌هاب سورس‌کد
  category: 'web-app' | 'tool' | 'creative-tech';
  featured?: boolean;
}

// ساختار ردیف‌های رزومه کاری
export interface ResumeEntry {
  id: string;
  period: string; // بازه زمانی (مثلاً: ۱۴۰۰ - اکنون)
  titleFa: string; // عنوان سمت یا دستاورد
  titleEn: string;
  organizationFa: string; // سازمان یا گالری
  organizationEn: string;
  descriptionFa: string;
  descriptionEn: string;
  type: 'experience' | 'education' | 'exhibition' | 'award' | 'publication';
  linkUrl?: string; // لینک مستندات یا سایت مرتبط
}

// ساختار کتاب‌ها و مونوگراف‌ها
export interface BookItem {
  id: string;
  titleFa: string; // نام کتاب
  titleEn: string;
  subtitleFa: string; // زیرعنوان کتاب
  subtitleEn: string;
  statusFa: string; // وضعیت (در دست نگارش، چاپ‌شده و...)
  statusEn: string;
  coverImage: string;
  descriptionFa: string;
  descriptionEn: string;
  pages: string;
  publisherFa: string;
  publisherEn: string;
  releaseYear: string;
  purchaseUrl?: string; // لینک خرید یا مطالعه آنلاین کتاب
}

// ساختار ۴ شاخص آماری در صفحه اصلی
export interface StatItem {
  numberFa: string; // مثلاً: ۱۲+ سال
  numberEn: string; // e.g. 12+ Years
  labelFa: string; // مثلاً: تجربه عکاسی و مستندسازی
  labelEn: string;
}

// ساختار کلی پروفایل و متن‌های صفحه اصلی (کاملاً قابل ویرایش توسط سینا)
export interface ProfileContent {
  nameFa: string;
  nameEn: string;
  heroKickerFa: string; // تیتر کوچک بالای صفحه (مثلاً: برند شخصی و آثار برگزیده)
  heroKickerEn: string;
  heroHeadlineMainFa: string; // تیتر اصلی بزرگ (مثلاً: روایت اصیل چشم‌اندازهای ایران،)
  heroHeadlineMainEn: string;
  heroHeadlineHighlightFa: string; // بخش رنگی تیتر (مثلاً: هنر دیدن، کاوش در طبیعت)
  heroHeadlineHighlightEn: string;
  heroHeadlineEndFa: string; // انتهای تیتر (مثلاً: و خلق فناوری.)
  heroHeadlineEndEn: string;
  taglineFa: string;
  taglineEn: string;
  aboutFa: string; // متن پاراگراف معرفی در هیرو
  aboutEn: string;
  locationFa: string;
  locationEn: string;
  email: string;
  phone: string;
  instagram: string;
  telegram: string;
  linkedin: string;
  github: string;
  youtube?: string;
  stats: StatItem[];
}

// عناوین قابل تنظیم منوی اصلی وب‌سایت از پنل مدیریت
export interface NavLabelsItem {
  [key: string]: any;
  homeFa?: string;
  homeEn?: string;
  portfolioFa?: string;
  portfolioEn?: string;
  tripsFa?: string;
  tripsEn?: string;
  gearFa?: string;
  gearEn?: string;
  articlesFa?: string;
  articlesEn?: string;
  resumeFa?: string;
  resumeEn?: string;
  aboutFa?: string;
  aboutEn?: string;
  orderFa?: string;
  orderEn?: string;
}

// اینترفیس محتوای جامع صفحه درباره من
export interface AboutPageContent {
  heroBioFa: string;
  heroBioEn: string;
  detailedBioFa: string;
  detailedBioEn: string;
  avatarUrl: string;
  bannerUrl?: string;
  educationFa?: string[];
  educationEn?: string[];
  philosophyFa?: string;
  philosophyEn?: string;
  stats?: {
    labelFa: string;
    labelEn: string;
    value: string;
  }[];
  contactEmail?: string;
  contactPhone?: string;
  locationFa?: string;
  locationEn?: string;
  telegramUrl?: string;
  instagramUrl?: string;
  youtubeUrl?: string;
  aparatUrl?: string;
  specialtiesFa?: string[];
  specialtiesEn?: string[];
}

// ساختار اختصاصی بیوگرافی و راه‌های ارتباطی در صفحه درباره من و فوتر
export interface AboutBioContent {
  headlineFa?: string;
  headlineEn?: string;
  storyFa?: string;
  storyEn?: string;
  philosophyFa?: string;
  philosophyEn?: string;
  specialtiesFa?: string[];
  specialtiesEn?: string[];
  telegramUrl?: string;
  instagramUrl?: string;
  youtubeUrl?: string;
  aparatUrl?: string;
  email?: string;
  phone?: string;
  locationFa?: string;
  locationEn?: string;
}

// کل محتوای پویای وب‌سایت
export interface SiteContent {
  profile: ProfileContent;
  photos: PhotoItem[];
  expeditions: ExpeditionItem[];
  software: SoftwareItem[];
  resume: ResumeEntry[];
  books: BookItem[];
  equipment: EquipmentItem[];
  // بخش‌های جدید معماری داینامیک CMS (۱۰۰٪ بدون هاردکد)
  articles?: ArticleItem[];
  commercialCategories?: CategoryItem[];
  travelCategories?: CategoryItem[];
  tripCategories?: CategoryItem[];
  gearCategories?: CategoryItem[];
  aboutPage?: AboutPageContent;
  aboutBio?: AboutBioContent;
  navLabels?: NavLabelsItem | { [key: string]: { fa: string; en: string } };
  homeShowcaseConfig?: {
    titleFa: string;
    titleEn: string;
    subtitleFa: string;
    subtitleEn: string;
    maxHomePhotos?: number;
    maxHomeTrips?: number;
  };
  definedTechniques?: DefinedTechnique[];
  homeCategoryCards?: HomeCategoryCard[];
}

// ساختار رویدادهای رفتار و آمار بازدیدکنندگان وب‌سایت
export interface AnalyticsEvent {
  id: string;
  sessionId: string;
  eventType:
    | 'page_view'
    | 'photo_view'
    | 'open_buy_modal'
    | 'select_format'
    | 'abandon_checkout'
    | 'complete_order'
    | 'contact_inquiry'
    | 'download_resume'
    | 'gear_view';
  path?: string;
  referrer?: string;
  browser?: string;
  os?: string;
  device?: 'mobile' | 'desktop' | 'tablet';
  screenResolution?: string;
  photoId?: string;
  photoTitle?: string;
  selectedFormat?: 'print' | 'digital';
  priceToman?: number;
  priceUsd?: number;
  timeSpentSeconds?: number;
  clientTimestamp: string;
  persianDate?: string;
  details?: string;
}

// خلاصه آماری رفتار بازدیدکنندگان و قیف فروش
export interface AnalyticsSummary {
  totalPageViews: number;
  todayViews: number;
  yesterdayViews: number;
  totalSessions: number;
  abandonedCheckoutsCount: number;
  completedOrdersCount: number;
  abandonmentRate: number;
  topBrowsers: { name: string; count: number; percent: number }[];
  topDevices: { name: string; count: number; percent: number }[];
  topReferrers: { name: string; count: number; percent: number }[];
  abandonedCartList: {
    photoTitle: string;
    photoId?: string;
    priceToman?: number;
    browser?: string;
    device?: string;
    referrer?: string;
    timestamp: string;
    persianDate: string;
  }[];
  recentEvents: AnalyticsEvent[];
}

// پیشنهادات تولید شده توسط هوش مصنوعی جمینای برای عکس بارگذاری‌شده
export interface AiPhotoSuggestion {
  category: 'landscape' | 'aerial' | 'architecture' | 'documentary' | 'portrait';
  categoryFa: string;
  titleFa: string;
  titleEn: string;
  locationFa: string;
  locationEn: string;
  descriptionFa: string;
  descriptionEn: string;
  camera: string;
  lens: string;
  suggestedPriceToman: number;
  suggestedPriceUsd: number;
  tags: string[];
}
