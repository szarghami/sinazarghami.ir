// =====================================================================
// پنل جامع استودیو اختصاصی سینا ضرغامی (Private Creator Studio)
// این کامپوننت مرکز کنترل کامل وب‌سایت است و به سینا امکان می‌دهد:
// ۱. عکس‌ها و آلبوم‌ها را به صورت دسته‌ای با فرمت فشرده WebP بارگذاری و در Supabase ذخیره کند
// ۲. عناوین و توضیحات فارسی را با هوش مصنوعی جمینای (Gemini AI) به زبان انگلیسی فاخر گالری‌ها ترجمه کند
// ۳. تمام پلتفرم‌ها، ابزارها، سفرها، کتاب‌ها، رزومه و متن‌ها را ویرایش (Edit)، حذف (Delete) و جابجا (Reorder) کند
// ۴. اطلاعات و رمز عبور را بین لپ‌تاپ و گوشی به صورت یکپارچه همگام نماید
// =====================================================================

import React, { useState, useRef, useEffect } from 'react';
import {
  SiteContent,
  PhotoItem,
  Language,
  ProfileContent,
  SoftwareItem,
  ExpeditionItem,
  ResumeEntry,
  BookItem,
  StatItem,
  AiPhotoSuggestion,
  ArticleItem,
  CategoryItem,
  DefinedTechnique,
  AboutPageContent,
  NavLabelsItem,
} from '../types';
import {
  checkAdminPasscode,
  updateAdminPasscode,
  requestPasswordRecoveryToTelegram,
  exportSiteContentToJson,
  compressMultipleImagesToWebP,
  CompressedImageResult,
  getSavedGitHubToken,
  saveGitHubToken,
  isSessionAuthenticated,
  setSessionAuthenticated,
  saveSiteContent,
} from '../utils/storage';
import { uploadToSupabaseStorage, smartUploadImage } from '../utils/supabase';
import { translateToArtisticEnglish } from '../utils/aiTranslator';
import { sendTelegramNotification } from '../utils/telegram';
import { VoiceDictationButton } from './VoiceDictationButton';
import { AdminAnalyticsTab } from './AdminAnalyticsTab';
import {
  Lock,
  Upload,
  Plus,
  Trash2,
  Download,
  X,
  KeyRound,
  Type,
  CloudUpload,
  Sliders,
  Sparkles,
  Images,
  Send,
  Code2,
  Compass,
  Briefcase,
  ExternalLink,
  Github,
  Wand2,
  Edit3,
  Check,
  BookOpen,
  ArrowUp,
  ArrowDown,
  RefreshCw,
  Eye,
  Globe,
  Phone,
  Mail,
  Camera,
  BarChart3,
  CheckCircle2,
  Star,
  Tag,
  Layers,
  FileText,
  Bookmark,
  Pin,
  ListFilter,
  SlidersHorizontal,
  PlusCircle,
  UserCheck,
} from 'lucide-react';

interface AdminStudioModalProps {
  content: SiteContent;
  onUpdateContent: (content: SiteContent) => void;
  language: Language;
  onClose: () => void;
}

export const AdminStudioModal: React.FC<AdminStudioModalProps> = ({
  content,
  onUpdateContent,
  language,
  onClose,
}) => {
  const isFa = language === 'fa';

  // وضعیت احراز هویت سشن فعلی کاربر
  const [isAuthenticated, setIsAuthenticated] = useState<boolean>(() => isSessionAuthenticated());
  const [pinInput, setPinInput] = useState('');
  const [pinError, setPinError] = useState(false);
  const [newPin, setNewPin] = useState('');
  const [recoverySent, setRecoverySent] = useState(false);

  // تب فعال در پنل استودیو
  const [activeTab, setActiveTab] = useState<
    | 'upload_studio'
    | 'categories_techniques'
    | 'articles'
    | 'about_and_home'
    | 'software'
    | 'expeditions'
    | 'books'
    | 'resume'
    | 'texts'
    | 'analytics'
    | 'publish'
    | 'security'
  >('upload_studio');

  // استیت فرم پروفایل، متن‌ها و اطلاعات تماس
  const [profileForm, setProfileForm] = useState<ProfileContent>(content.profile);

  // استیت‌های آپلود و فشرده‌سازی عکس
  const [rawFiles, setRawFiles] = useState<File[]>([]);
  const [compressedResults, setCompressedResults] = useState<CompressedImageResult[]>([]);
  const [isProcessing, setIsProcessing] = useState(false);
  const [uploadToCloud, setUploadToCloud] = useState(true);
  const [supabaseUploadMsg, setSupabaseUploadMsg] = useState<string | null>(null);
  const [compressQuality, setCompressQuality] = useState<number>(0.68);
  const [compressMaxDim, setCompressMaxDim] = useState<number>(1400);
  const [overallStats, setOverallStats] = useState<{ origKB: number; compKB: number; percent: number } | null>(null);

  // استیت‌های هوش مصنوعی جمینای برای تحلیل عکس
  const [aiSuggestion, setAiSuggestion] = useState<AiPhotoSuggestion | null>(null);
  const [isAiSuggesting, setIsAiSuggesting] = useState<boolean>(false);
  const [aiSuggestError, setAiSuggestError] = useState<string | null>(null);
  const [instantPublishSuccess, setInstantPublishSuccess] = useState<boolean>(false);

  // فرم افزودن یا ویرایش عکس / آلبوم
  const [editingPhotoId, setEditingPhotoId] = useState<string | null>(null);
  const [photoTitleFa, setPhotoTitleFa] = useState('');
  const [photoTitleEn, setPhotoTitleEn] = useState('');
  const [photoCategory, setPhotoCategory] = useState<'landscape' | 'aerial' | 'architecture' | 'documentary' | 'portrait'>('landscape');
  const [photoLocationFa, setPhotoLocationFa] = useState('');
  const [photoLocationEn, setPhotoLocationEn] = useState('');
  const [photoCamera, setPhotoCamera] = useState('Canon R8');
  const [photoLens, setPhotoLens] = useState('Canon EF 50mm f/1.8');
  const [photoYear, setPhotoYear] = useState('1403');
  const [photoDescFa, setPhotoDescFa] = useState('');
  const [photoDescEn, setPhotoDescEn] = useState('');
  const [photoPriceToman, setPhotoPriceToman] = useState<number>(2800000);
  const [photoPriceUsd, setPhotoPriceUsd] = useState<number>(45);
  const [photoPrintAvail, setPhotoPrintAvail] = useState<boolean>(true);
  const [photoImageUrl, setPhotoImageUrl] = useState<string>('');
  const [translatingField, setTranslatingField] = useState<string | null>(null);

  // فیلدهای تکمیلی داینامیک CMS برای اثر
  const [photoShowOnHome, setPhotoShowOnHome] = useState<boolean>(false);
  const [photoHomeOrder, setPhotoHomeOrder] = useState<number>(0);
  const [photoPortfolioScope, setPhotoPortfolioScope] = useState<'commercial' | 'travel'>('commercial');
  const [photoCommercialCategory, setPhotoCommercialCategory] = useState<string>('');
  const [photoClientName, setPhotoClientName] = useState<string>('');
  const [photoClientInfo, setPhotoClientInfo] = useState<string>('');
  const [photoGearIds, setPhotoGearIds] = useState<string[]>([]);
  const [photoTechniques, setPhotoTechniques] = useState<string[]>([]);
  const [quickNewTechInput, setQuickNewTechInput] = useState<string>('');

  // استیت‌های دسته‌بندی‌های نمونه‌کار (commercialCategories)
  const [editingCatId, setEditingCatId] = useState<string | null>(null);
  const [catId, setCatId] = useState('');
  const [catTitleFa, setCatTitleFa] = useState('');
  const [catTitleEn, setCatTitleEn] = useState('');
  const [catDescFa, setCatDescFa] = useState('');
  const [catDescEn, setCatDescEn] = useState('');
  const [catIcon, setCatIcon] = useState('Camera');

  // استیت‌های بانک تکنیک‌ها (definedTechniques)
  const [editingTechId, setEditingTechId] = useState<string | null>(null);
  const [techId, setTechId] = useState('');
  const [techNameFa, setTechNameFa] = useState('');
  const [techNameEn, setTechNameEn] = useState('');
  const [techDescFa, setTechDescFa] = useState('');
  const [techDescEn, setTechDescEn] = useState('');

  // استیت‌های مقالات سئو (articles)
  const [editingArticleId, setEditingArticleId] = useState<string | null>(null);
  const [artTitleFa, setArtTitleFa] = useState('');
  const [artTitleEn, setArtTitleEn] = useState('');
  const [artSlug, setArtSlug] = useState('');
  const [artExcerptFa, setArtExcerptFa] = useState('');
  const [artExcerptEn, setArtExcerptEn] = useState('');
  const [artContentFa, setArtContentFa] = useState('');
  const [artContentEn, setArtContentEn] = useState('');
  const [artCategoryFa, setArtCategoryFa] = useState('آموزش عکاسی');
  const [artCategoryEn, setArtCategoryEn] = useState('Photography Tutorial');
  const [artCoverUrl, setArtCoverUrl] = useState('');
  const [artReadTime, setArtReadTime] = useState<number>(6);
  const [artTags, setArtTags] = useState('');
  const [artSeoKeywords, setArtSeoKeywords] = useState('');
  const [artIsPublished, setArtIsPublished] = useState<boolean>(true);
  const [artFeatured, setArtFeatured] = useState<boolean>(false);

  // استیت‌های صفحه درباره من (aboutPage)
  const [aboutPageForm, setAboutPageForm] = useState<AboutPageContent>(() => {
    return (
      content.aboutPage || {
        heroBioFa: '',
        heroBioEn: '',
        detailedBioFa: '',
        detailedBioEn: '',
        avatarUrl: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=800&q=80',
        philosophyFa: '',
        philosophyEn: '',
        contactEmail: content.profile.email || '',
        contactPhone: content.profile.phone || '',
        locationFa: content.profile.locationFa || '',
        locationEn: content.profile.locationEn || '',
        telegramUrl: content.profile.telegram || '',
        instagramUrl: content.profile.instagram || '',
        youtubeUrl: content.profile.youtube || '',
        aparatUrl: '',
        educationFa: [],
        educationEn: [],
        specialtiesFa: [],
        specialtiesEn: [],
        stats: [],
      }
    );
  });
  const [aboutEduFaText, setAboutEduFaText] = useState(() => (content.aboutPage?.educationFa || []).join('\n'));
  const [aboutSpecFaText, setAboutSpecFaText] = useState(() => (content.aboutPage?.specialtiesFa || []).join('، '));

  // استیت‌های ویترین صفحه اصلی (homeShowcaseConfig)
  const [homeShowcaseForm, setHomeShowcaseForm] = useState(() => {
    return (
      content.homeShowcaseConfig || {
        titleFa: 'ویترین پروژه‌ها و آثار شاخص',
        titleEn: 'Featured Works & Portfolio Showcase',
        subtitleFa: 'منتخبی از پروژه‌های صنعتی، معماری، مستند و آثار فاین‌آرت',
        subtitleEn: 'Selected industrial, architectural, and documentary works',
        maxHomePhotos: 8,
        maxHomeTrips: 4,
      }
    );
  });

  // استیت‌های عناوین منو (navLabels)
  const [navLabelsForm, setNavLabelsForm] = useState<NavLabelsItem>(() => {
    const n = (content.navLabels as NavLabelsItem) || {};
    return {
      homeFa: n.homeFa || 'صفحه اصلی',
      homeEn: n.homeEn || 'Home',
      portfolioFa: n.portfolioFa || 'نمونه‌کارها',
      portfolioEn: n.portfolioEn || 'Portfolio',
      tripsFa: n.tripsFa || 'سفر و تورها',
      tripsEn: n.tripsEn || 'Trips & Tours',
      gearFa: n.gearFa || 'تجهیزات',
      gearEn: n.gearEn || 'Gear',
      articlesFa: n.articlesFa || 'مقالات',
      articlesEn: n.articlesEn || 'Articles',
      resumeFa: n.resumeFa || 'رزومه',
      resumeEn: n.resumeEn || 'Resume',
      aboutFa: n.aboutFa || 'درباره من',
      aboutEn: n.aboutEn || 'About',
      orderFa: n.orderFa || 'ثبت سفارش پروژه',
      orderEn: n.orderEn || 'Hire Me',
    };
  });

  // استیت فرم نرم‌افزار (افزودن و ویرایش)
  const [editingSoftId, setEditingSoftId] = useState<string | null>(null);
  const [softTitle, setSoftTitle] = useState('');
  const [softTaglineFa, setSoftTaglineFa] = useState('');
  const [softTaglineEn, setSoftTaglineEn] = useState('');
  const [softDescFa, setSoftDescFa] = useState('');
  const [softDescEn, setSoftDescEn] = useState('');
  const [softTech, setSoftTech] = useState('React, TypeScript, Tailwind');
  const [softCategory, setSoftCategory] = useState<'web-app' | 'tool' | 'creative-tech'>('web-app');
  const [softLiveUrl, setSoftLiveUrl] = useState('');
  const [softGithubUrl, setSoftGithubUrl] = useState('');

  // استیت فرم سفر و تور (افزودن و ویرایش)
  const [editingExpId, setEditingExpId] = useState<string | null>(null);
  const [expTitleFa, setExpTitleFa] = useState('');
  const [expTitleEn, setExpTitleEn] = useState('');
  const [expLocationFa, setExpLocationFa] = useState('');
  const [expLocationEn, setExpLocationEn] = useState('');
  const [expDurationFa, setExpDurationFa] = useState('۴ روز و ۳ شب');
  const [expDurationEn, setExpDurationEn] = useState('4 Days & 3 Nights');
  const [expSeasonFa, setExpSeasonFa] = useState('پاییز و زمستان');
  const [expSeasonEn, setExpSeasonEn] = useState('Autumn & Winter');
  const [expDifficultyFa, setExpDifficultyFa] = useState('متوسط');
  const [expDifficultyEn, setExpDifficultyEn] = useState('Moderate');
  const [expDescFa, setExpDescFa] = useState('');
  const [expDescEn, setExpDescEn] = useState('');
  const [expImage, setExpImage] = useState('');
  const [expBookingOpen, setExpBookingOpen] = useState(true);

  // استیت فرم کتاب‌ها و مونوگراف‌ها (افزودن و ویرایش)
  const [editingBookId, setEditingBookId] = useState<string | null>(null);
  const [bookTitleFa, setBookTitleFa] = useState('');
  const [bookTitleEn, setBookTitleEn] = useState('');
  const [bookSubtitleFa, setBookSubtitleFa] = useState('');
  const [bookSubtitleEn, setBookSubtitleEn] = useState('');
  const [bookStatusFa, setBookStatusFa] = useState('در دست نگارش');
  const [bookStatusEn, setBookStatusEn] = useState('In Progress');
  const [bookCoverImage, setBookCoverImage] = useState('');
  const [bookDescFa, setBookDescFa] = useState('');
  const [bookDescEn, setBookDescEn] = useState('');
  const [bookPublisherFa, setBookPublisherFa] = useState('انتشارات مستقل');
  const [bookPublisherEn, setBookPublisherEn] = useState('Independent Press');
  const [bookReleaseYear, setBookReleaseYear] = useState('۱۴۰۴');
  const [bookPages, setBookPages] = useState('۲۲۰ صفحه گلاسه');

  // استیت فرم رزومه (افزودن و ویرایش)
  const [editingResId, setEditingResId] = useState<string | null>(null);
  const [resPeriod, setResPeriod] = useState('۱۴۰۳');
  const [resTitleFa, setResTitleFa] = useState('');
  const [resTitleEn, setResTitleEn] = useState('');
  const [resOrgFa, setResOrgFa] = useState('');
  const [resOrgEn, setResOrgEn] = useState('');
  const [resDescFa, setResDescFa] = useState('');
  const [resDescEn, setResDescEn] = useState('');
  const [resType, setResType] = useState<'experience' | 'education' | 'exhibition' | 'award' | 'publication'>('experience');

  // استیت‌های انتشار ابری و پشتیبان‌گیری
  const [githubToken, setGithubToken] = useState(getSavedGitHubToken());
  const [githubRepo, setGithubRepo] = useState('szarghami/sinazarghami.ir');
  const [isPublishing, setIsPublishing] = useState(false);
  const [isSyncingGithub, setIsSyncingGithub] = useState(false);
  const [githubSyncStatus, setGithubSyncStatus] = useState<{ success: boolean; msg: string } | null>(null);
  const [showGithubToken, setShowGithubToken] = useState(false);
  const [publishStatus, setPublishStatus] = useState<{ success: boolean; msg: string } | null>(null);
  const [telegramTestStatus, setTelegramTestStatus] = useState<string | null>(null);

  const fileInputRef = useRef<HTMLInputElement>(null);
  const backupInputRef = useRef<HTMLInputElement>(null);

  /**
   * همگام‌سازی دستی و مستقیم فایل‌ها با مخزن گیت‌هاب
   */
  const handleManualGithubSync = async () => {
    if (!githubToken.trim()) {
      alert(isFa ? 'لطفاً ابتدا توکن دسترسی گیت‌هاب (Personal Access Token) خود را وارد کنید.' : 'Please enter your GitHub token first.');
      return;
    }
    try {
      setIsSyncingGithub(true);
      setGithubSyncStatus(null);
      saveGitHubToken(githubToken.trim());

      const res = await fetch('/api/github/sync', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          token: githubToken.trim(),
          repo: githubRepo.trim(),
          path: 'site-data.json',
          content: content,
        }),
      });

      const data = await res.json();
      if (!res.ok || !data.success) {
        throw new Error(data.error || 'خطا در ارتباط با گیت‌هاب');
      }

      setGithubSyncStatus({
        success: true,
        msg: isFa
          ? `فایل داده‌های وب‌سایت با موفقیت در مخزن ${githubRepo} کامیت و همگام‌سازی شد!`
          : `Successfully committed to ${githubRepo}!`,
      });
    } catch (err: any) {
      setGithubSyncStatus({
        success: false,
        msg: isFa ? `خطا در همگام‌سازی با گیت‌هاب: ${err.message}` : `Error: ${err.message}`,
      });
    } finally {
      setIsSyncingGithub(false);
    }
  };

  // بازفشرده‌سازی در صورت تغییر اسلایدرهای کیفیت یا حداکثر اندازه
  useEffect(() => {
    if (rawFiles.length > 0) {
      processSelectedFiles(rawFiles);
    }
  }, [compressQuality, compressMaxDim]);

  /**
   * تابع فشرده‌سازی خودکار و سریع عکس‌ها به فرمت مدرن WebP با Canvas
   */
  const processSelectedFiles = async (files: File[]) => {
    try {
      setIsProcessing(true);
      const res = await compressMultipleImagesToWebP(files, compressMaxDim, compressQuality);
      setCompressedResults(res.results);
      setOverallStats({
        origKB: res.totalOriginalKB,
        compKB: res.totalCompressedKB,
        percent: res.overallReductionPercent,
      });
    } catch (err) {
      console.error('خطا در فشرده‌سازی:', err);
    } finally {
      setIsProcessing(false);
    }
  };

  /**
   * دریافت فایل‌ها از دیالوگ یا درگ‌اند‌دراپ
   */
  const handleFilesChosen = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files || []);
    if (files.length === 0) return;
    setRawFiles(files);
    processSelectedFiles(files);
  };

  /**
   * بررسی رمز ورود
   */
  const handleLogin = (e: React.FormEvent) => {
    e.preventDefault();
    if (checkAdminPasscode(pinInput)) {
      setIsAuthenticated(true);
      setSessionAuthenticated(true);
      setPinError(false);
    } else {
      setPinError(true);
    }
  };

  /**
   * خروج از پنل مدیریت
   */
  const handleLogout = () => {
    setIsAuthenticated(false);
    setSessionAuthenticated(false);
    setPinInput('');
  };

  /**
   * ارسال آنی رمز به تلگرام سینا در صورت فراموشی
   */
  const handleRequestTelegramRecovery = async () => {
    const ok = await requestPasswordRecoveryToTelegram();
    if (ok) {
      setRecoverySent(true);
      setTimeout(() => setRecoverySent(false), 8000);
    } else {
      alert('خطا در ارسال پیام به تلگرام');
    }
  };

  // =========================================================================
  // توابع ترجمه هوشمند با هوش مصنوعی (AI Translation Helpers)
  // =========================================================================

  /**
   * ترجمه تک‌فیلدی به کمک هوش مصنوعی جمینای
   */
  const handleAiTranslate = async (
    persianText: string,
    targetSetter: (text: string) => void,
    fieldId: string,
    type: 'title' | 'description' | 'tagline' = 'title',
    category?: string
  ) => {
    if (!persianText.trim()) return;
    try {
      setTranslatingField(fieldId);
      const res = await translateToArtisticEnglish(persianText, type, category);
      targetSetter(res);
    } finally {
      setTranslatingField(null);
    }
  };

  /**
   * تحلیل بصری عکس توسط هوش مصنوعی جمینای و ارائه پیشنهادات موضوع، عنوان و داستان
   */
  const handleAiSuggestPhoto = async () => {
    const currentImage = compressedResults.length > 0
      ? compressedResults[0].dataUrl
      : photoImageUrl;

    if (!currentImage) {
      alert(isFa ? 'لطفاً ابتدا یک عکس انتخاب یا آپلود کنید تا هوش مصنوعی آن را تحلیل کند.' : 'Please upload or choose a photo first.');
      return;
    }

    try {
      setIsAiSuggesting(true);
      setAiSuggestError(null);
      const res = await fetch('/api/gemini/suggest-photo-details', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          imageBase64: currentImage.startsWith('data:') ? currentImage : undefined,
          imageUrl: currentImage.startsWith('http') ? currentImage : undefined,
          titleHint: photoTitleFa || undefined,
        }),
      });

      const data = await res.json();
      if (!res.ok || !data.success) {
        throw new Error(data.error || 'خطا در تحلیل عکس با جمینای');
      }

      setAiSuggestion(data.suggestion);
    } catch (err: any) {
      setAiSuggestError(err.message || 'خطا در ارتباط با هوش مصنوعی');
    } finally {
      setIsAiSuggesting(false);
    }
  };

  /**
   * اعمال پیشنهادات هوش مصنوعی در فرم مشخصات اثر
   */
  const handleApplyAiSuggestion = () => {
    if (!aiSuggestion) return;
    if (aiSuggestion.titleFa) setPhotoTitleFa(aiSuggestion.titleFa);
    if (aiSuggestion.titleEn) setPhotoTitleEn(aiSuggestion.titleEn);
    if (aiSuggestion.category) setPhotoCategory(aiSuggestion.category);
    if (aiSuggestion.locationFa) setPhotoLocationFa(aiSuggestion.locationFa);
    if (aiSuggestion.locationEn) setPhotoLocationEn(aiSuggestion.locationEn);
    if (aiSuggestion.descriptionFa) setPhotoDescFa(aiSuggestion.descriptionFa);
    if (aiSuggestion.descriptionEn) setPhotoDescEn(aiSuggestion.descriptionEn);
    if (aiSuggestion.camera) setPhotoCamera(aiSuggestion.camera);
    if (aiSuggestion.lens) setPhotoLens(aiSuggestion.lens);
    if (aiSuggestion.suggestedPriceToman) setPhotoPriceToman(aiSuggestion.suggestedPriceToman);
    if (aiSuggestion.suggestedPriceUsd) setPhotoPriceUsd(aiSuggestion.suggestedPriceUsd);
    alert(isFa ? 'پیشنهادات هوش مصنوعی جمینای در فرم اعمال شدند!' : 'AI suggestions applied to form!');
  };

  // =========================================================================
  // ۱. مدیریت گالری و آثار عکاسی (Photography & Albums)
  // =========================================================================

  /**
   * آماده‌سازی فرم برای ویرایش یک عکس موجود
   */
  /**
   * آماده‌سازی فرم برای ویرایش یک عکس موجود
   */
  const handleStartEditPhoto = (photo: PhotoItem) => {
    setEditingPhotoId(photo.id);
    setPhotoTitleFa(photo.titleFa);
    setPhotoTitleEn(photo.titleEn);
    setPhotoCategory(photo.category);
    setPhotoLocationFa(photo.locationFa);
    setPhotoLocationEn(photo.locationEn);
    setPhotoCamera(photo.camera);
    setPhotoLens(photo.lens);
    setPhotoYear(photo.year);
    setPhotoDescFa(photo.descriptionFa);
    setPhotoDescEn(photo.descriptionEn);
    setPhotoPriceToman(photo.printPriceToman);
    setPhotoPriceUsd(photo.printPriceUsd);
    setPhotoPrintAvail(photo.printAvailable);
    setPhotoImageUrl(photo.imageUrl);
    // فیلدهای تکمیلی داینامیک CMS
    setPhotoShowOnHome(photo.showOnHome || false);
    setPhotoHomeOrder(photo.homeOrder || 0);
    setPhotoPortfolioScope(photo.portfolioScope || 'commercial');
    setPhotoCommercialCategory(photo.commercialCategory || '');
    setPhotoClientName(photo.clientName || '');
    setPhotoClientInfo(photo.clientInfo || '');
    setPhotoGearIds(photo.gearIds || []);
    setPhotoTechniques(photo.techniques || []);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  /**
   * انصراف از ویرایش عکس
   */
  const handleCancelEditPhoto = () => {
    setEditingPhotoId(null);
    setPhotoTitleFa('');
    setPhotoTitleEn('');
    setPhotoLocationFa('');
    setPhotoLocationEn('');
    setPhotoDescFa('');
    setPhotoDescEn('');
    setPhotoImageUrl('');
    setPhotoShowOnHome(false);
    setPhotoHomeOrder(0);
    setPhotoPortfolioScope('commercial');
    setPhotoCommercialCategory('');
    setPhotoClientName('');
    setPhotoClientInfo('');
    setPhotoGearIds([]);
    setPhotoTechniques([]);
    setQuickNewTechInput('');
    setRawFiles([]);
    setCompressedResults([]);
    setOverallStats(null);
  };

  /**
   * ثبت عکس جدید یا به‌روزرسانی عکس در حال ویرایش
   */
  const handleSavePhoto = async (e: React.FormEvent) => {
    e.preventDefault();

    try {
      setIsProcessing(true);
      let mainImageUrl = photoImageUrl;
      let additionalImages: string[] = [];

      // اگر کاربر فایل جدیدی انتخاب کرده باشد، آن را فشرده و آپلود می‌کنیم
      if (compressedResults.length > 0) {
        if (uploadToCloud) {
          setSupabaseUploadMsg('در حال بارگذاری هوشمند در Supabase Storage و سرور...');
          const mainUpload = await smartUploadImage(compressedResults[0].dataUrl, `photo_${Date.now()}`);
          mainImageUrl = mainUpload.success && mainUpload.publicUrl ? mainUpload.publicUrl : compressedResults[0].dataUrl;

          if (compressedResults.length > 1) {
            for (let i = 1; i < compressedResults.length; i++) {
              const subUpload = await smartUploadImage(compressedResults[i].dataUrl, `sub_${Date.now()}_${i}`);
              additionalImages.push(subUpload.success && subUpload.publicUrl ? subUpload.publicUrl : compressedResults[i].dataUrl);
            }
          }
        } else {
          mainImageUrl = compressedResults[0].dataUrl;
          if (compressedResults.length > 1) {
            additionalImages = compressedResults.slice(1).map((r) => r.dataUrl);
          }
        }
      }

      if (!mainImageUrl) {
        alert(isFa ? 'لطفاً یک تصویر بارگذاری کنید یا آدرس آن را وارد نمایید.' : 'Please provide an image.');
        return;
      }

      const isAlbum = additionalImages.length > 0;

      if (editingPhotoId) {
        // به‌روزرسانی اثر موجود
        const updatedPhotos = content.photos.map((p) => {
          if (p.id === editingPhotoId) {
            return {
              ...p,
              titleFa: photoTitleFa || p.titleFa,
              titleEn: photoTitleEn || p.titleEn,
              category: photoCategory,
              locationFa: photoLocationFa || p.locationFa,
              locationEn: photoLocationEn || p.locationEn,
              year: photoYear,
              camera: photoCamera,
              lens: photoLens,
              imageUrl: mainImageUrl,
              galleryImages: additionalImages.length > 0 ? additionalImages : p.galleryImages,
              isAlbum: additionalImages.length > 0 ? true : p.isAlbum,
              descriptionFa: photoDescFa,
              descriptionEn: photoDescEn,
              printAvailable: photoPrintAvail,
              printPriceToman: photoPriceToman,
              printPriceUsd: photoPriceUsd,
              showOnHome: photoShowOnHome,
              homeOrder: Number(photoHomeOrder) || 0,
              portfolioScope: photoPortfolioScope,
              commercialCategory: photoCommercialCategory,
              clientName: photoClientName,
              clientInfo: photoClientInfo,
              gearIds: photoGearIds,
              techniques: photoTechniques,
            };
          }
          return p;
        });

        onUpdateContent({ ...content, photos: updatedPhotos });
        alert(isFa ? 'اثر با موفقیت ویرایش شد!' : 'Photo updated.');
      } else {
        // ایجاد اثر یا آلبوم جدید
        const newPhoto: PhotoItem = {
          id: `photo-${Date.now()}`,
          titleFa: photoTitleFa || (isAlbum ? 'آلبوم عکس‌های تازه' : 'اثر عکاسی برگزیده'),
          titleEn: photoTitleEn || (isAlbum ? 'New Photo Monograph' : 'Selected Fine Art Photograph'),
          category: photoCategory,
          locationFa: photoLocationFa || 'ایران',
          locationEn: photoLocationEn || 'Iran',
          year: photoYear || '1403',
          imageUrl: mainImageUrl,
          galleryImages: additionalImages,
          isAlbum: isAlbum,
          camera: photoCamera,
          lens: photoLens,
          exif: {
            focalLength: '35mm',
            aperture: 'f/4.0',
            shutter: '1/250s',
            iso: '100',
          },
          descriptionFa: photoDescFa || (isAlbum ? `مجموعه شامل ${compressedResults.length} تصویر اختصاصی` : 'ثبت‌شده توسط سینا ضرغامی'),
          descriptionEn: photoDescEn || 'Captured by Sina Zarghami',
          printAvailable: photoPrintAvail,
          printPriceToman: photoPriceToman,
          printPriceUsd: photoPriceUsd,
          showOnHome: photoShowOnHome,
          homeOrder: Number(photoHomeOrder) || 0,
          portfolioScope: photoPortfolioScope,
          commercialCategory: photoCommercialCategory,
          clientName: photoClientName,
          clientInfo: photoClientInfo,
          gearIds: photoGearIds,
          techniques: photoTechniques,
        };

        onUpdateContent({ ...content, photos: [newPhoto, ...content.photos] });
        alert(isFa ? (isAlbum ? `آلبوم با ${1 + additionalImages.length} عکس منتشر شد!` : 'اثر در گالری ثبت گردید!') : 'Published!');
      }

      handleCancelEditPhoto();
    } catch (err: any) {
      alert(`خطا: ${err.message}`);
    } finally {
      setIsProcessing(false);
      setSupabaseUploadMsg(null);
    }
  };

  /**
   * ستاره‌دار کردن یا لغو ستاره برای نمایش در ویترین صفحه اصلی با ۱ کلیک
   */
  const handleTogglePhotoShowOnHome = (id: string) => {
    const updatedPhotos = content.photos.map((p) => {
      if (p.id === id) {
        return { ...p, showOnHome: !p.showOnHome };
      }
      return p;
    });
    onUpdateContent({ ...content, photos: updatedPhotos });
  };

  /**
   * افزودن سریع تکنیک جدید به بانک تکنیک‌ها و انتساب خودکار به فرم جاری
   */
  const handleQuickAddTechnique = () => {
    if (!quickNewTechInput.trim()) return;
    const name = quickNewTechInput.trim();
    const id = `tech-${Date.now()}`;
    const newTech: DefinedTechnique = {
      id,
      nameFa: name,
      nameEn: name,
      descriptionFa: `تکنیک اختصاصی ${name}`,
    };
    const currentList = content.definedTechniques || [];
    onUpdateContent({
      ...content,
      definedTechniques: [...currentList, newTech],
    });
    if (!photoTechniques.includes(name)) {
      setPhotoTechniques([...photoTechniques, name]);
    }
    setQuickNewTechInput('');
  };

  /**
   * حذف قطعی یک عکس از سایت
   */
  const handleDeletePhoto = (id: string) => {
    if (confirm(isFa ? 'آیا از حذف این اثر از گالری اطمینان دارید؟' : 'Delete photo?')) {
      onUpdateContent({
        ...content,
        photos: content.photos.filter((p) => p.id !== id),
      });
      if (editingPhotoId === id) handleCancelEditPhoto();
    }
  };

  /**
   * جابجایی اولویت نمایش اثر در صفحه
   */
  const handleMovePhoto = (index: number, direction: 'up' | 'down') => {
    const newPhotos = [...content.photos];
    const targetIdx = direction === 'up' ? index - 1 : index + 1;
    if (targetIdx < 0 || targetIdx >= newPhotos.length) return;
    const temp = newPhotos[index];
    newPhotos[index] = newPhotos[targetIdx];
    newPhotos[targetIdx] = temp;
    onUpdateContent({ ...content, photos: newPhotos });
  };

  // =========================================================================
  // ۲. مدیریت پلتفرم‌ها و ابزارهای ساخته‌شده (Software & Web Platforms)
  // =========================================================================

  /**
   * شروع ویرایش نرم‌افزار موجود
   */
  const handleStartEditSoftware = (soft: SoftwareItem) => {
    setEditingSoftId(soft.id);
    setSoftTitle(soft.title);
    setSoftTaglineFa(soft.taglineFa);
    setSoftTaglineEn(soft.taglineEn);
    setSoftDescFa(soft.descriptionFa);
    setSoftDescEn(soft.descriptionEn);
    setSoftTech(soft.techStack.join(', '));
    setSoftCategory(soft.category);
    setSoftLiveUrl(soft.liveUrl || '');
    setSoftGithubUrl(soft.githubUrl || '');
  };

  const handleCancelEditSoftware = () => {
    setEditingSoftId(null);
    setSoftTitle('');
    setSoftTaglineFa('');
    setSoftTaglineEn('');
    setSoftDescFa('');
    setSoftDescEn('');
    setSoftLiveUrl('');
    setSoftGithubUrl('');
  };

  /**
   * ثبت یا ذخیره ویرایش نرم‌افزار
   */
  const handleSaveSoftware = (e: React.FormEvent) => {
    e.preventDefault();
    if (!softTitle.trim()) return;

    const techArray = softTech.split(',').map((t) => t.trim()).filter(Boolean);

    if (editingSoftId) {
      const updatedList = content.software.map((s) => {
        if (s.id === editingSoftId) {
          return {
            ...s,
            title: softTitle,
            taglineFa: softTaglineFa,
            taglineEn: softTaglineEn || softTaglineFa,
            descriptionFa: softDescFa,
            descriptionEn: softDescEn || softDescFa,
            techStack: techArray,
            category: softCategory,
            liveUrl: softLiveUrl.trim() || undefined,
            githubUrl: softGithubUrl.trim() || undefined,
          };
        }
        return s;
      });

      onUpdateContent({ ...content, software: updatedList });
      alert(isFa ? 'پروژه نرم‌افزاری ویرایش شد!' : 'Software updated.');
    } else {
      const newSoft: SoftwareItem = {
        id: `soft-${Date.now()}`,
        title: softTitle,
        taglineFa: softTaglineFa || 'پلتفرم نرم‌افزاری اختصاصی',
        taglineEn: softTaglineEn || 'Specialized Software Platform',
        descriptionFa: softDescFa || 'توسعه‌یافته توسط سینا ضرغامی با فناوری‌های روز.',
        descriptionEn: softDescEn || 'Crafted with modern engineering principles.',
        techStack: techArray.length > 0 ? techArray : ['React', 'TypeScript'],
        year: new Date().getFullYear().toString(),
        liveUrl: softLiveUrl.trim() || undefined,
        githubUrl: softGithubUrl.trim() || undefined,
        category: softCategory,
      };

      onUpdateContent({ ...content, software: [newSoft, ...content.software] });
      alert(isFa ? 'پروژه نرم‌افزاری جدید اضافه گردید!' : 'Software created.');
    }

    handleCancelEditSoftware();
  };

  /**
   * حذف پروژه نرم‌افزاری
   */
  const handleDeleteSoftware = (id: string) => {
    if (confirm(isFa ? 'آیا این پروژه نرم‌افزاری حذف شود؟' : 'Delete software?')) {
      onUpdateContent({
        ...content,
        software: content.software.filter((s) => s.id !== id),
      });
      if (editingSoftId === id) handleCancelEditSoftware();
    }
  };

  const handleMoveSoftware = (index: number, direction: 'up' | 'down') => {
    const list = [...content.software];
    const targetIdx = direction === 'up' ? index - 1 : index + 1;
    if (targetIdx < 0 || targetIdx >= list.length) return;
    const temp = list[index];
    list[index] = list[targetIdx];
    list[targetIdx] = temp;
    onUpdateContent({ ...content, software: list });
  };

  // =========================================================================
  // ۳. مدیریت سفرها و تورها (Expeditions & Tours)
  // =========================================================================

  const handleStartEditExpedition = (exp: ExpeditionItem) => {
    setEditingExpId(exp.id);
    setExpTitleFa(exp.titleFa);
    setExpTitleEn(exp.titleEn);
    setExpLocationFa(exp.locationFa);
    setExpLocationEn(exp.locationEn);
    setExpDurationFa(exp.durationFa);
    setExpDurationEn(exp.durationEn);
    setExpSeasonFa(exp.seasonFa);
    setExpSeasonEn(exp.seasonEn);
    setExpDifficultyFa(exp.difficultyFa);
    setExpDifficultyEn(exp.difficultyEn);
    setExpDescFa(exp.descriptionFa);
    setExpDescEn(exp.descriptionEn);
    setExpImage(exp.coverImage);
    setExpBookingOpen(exp.bookingOpen);
  };

  const handleCancelEditExpedition = () => {
    setEditingExpId(null);
    setExpTitleFa('');
    setExpTitleEn('');
    setExpLocationFa('');
    setExpLocationEn('');
    setExpDescFa('');
    setExpDescEn('');
    setExpImage('');
  };

  const handleSaveExpedition = (e: React.FormEvent) => {
    e.preventDefault();
    if (!expTitleFa.trim()) return;

    if (editingExpId) {
      const updatedList = content.expeditions.map((ex) => {
        if (ex.id === editingExpId) {
          return {
            ...ex,
            titleFa: expTitleFa,
            titleEn: expTitleEn || expTitleFa,
            locationFa: expLocationFa,
            locationEn: expLocationEn || expLocationFa,
            durationFa: expDurationFa,
            durationEn: expDurationEn || expDurationFa,
            seasonFa: expSeasonFa,
            seasonEn: expSeasonEn || expSeasonFa,
            difficultyFa: expDifficultyFa,
            difficultyEn: expDifficultyEn,
            coverImage: expImage || ex.coverImage,
            descriptionFa: expDescFa,
            descriptionEn: expDescEn || expDescFa,
            bookingOpen: expBookingOpen,
          };
        }
        return ex;
      });

      onUpdateContent({ ...content, expeditions: updatedList });
      alert(isFa ? 'مشخصات سفر ویرایش شد!' : 'Expedition updated.');
    } else {
      const newExp: ExpeditionItem = {
        id: `exp-${Date.now()}`,
        titleFa: expTitleFa,
        titleEn: expTitleEn || expTitleFa,
        locationFa: expLocationFa || 'ایران',
        locationEn: expLocationEn || 'Iran',
        durationFa: expDurationFa,
        durationEn: expDurationEn || expDurationFa,
        seasonFa: expSeasonFa,
        seasonEn: expSeasonEn || expSeasonFa,
        coverImage: expImage || 'https://images.unsplash.com/photo-1509316975850-ff9c5deb0cd9?auto=format&fit=crop&w=1200&q=80',
        descriptionFa: expDescFa || 'سفر اکتشافی و مسترکلاس میدانی عکاسی به سرپرستی سینا ضرغامی.',
        descriptionEn: expDescEn || 'Field photography expedition led by Sina Zarghami.',
        highlightsFa: ['پیمایش تخصصی با خودروهای آفرود مجهز', 'ورکشاپ عکاسی شب و رصد آسمان تاریک'],
        highlightsEn: ['4x4 Overland Exploration', 'Dark Sky Astrophotography Masterclass'],
        bookingOpen: expBookingOpen,
        difficultyFa: expDifficultyFa,
        difficultyEn: expDifficultyEn,
      };

      onUpdateContent({ ...content, expeditions: [newExp, ...content.expeditions] });
      alert(isFa ? 'سفر جدید با موفقیت اضافه شد!' : 'Expedition added.');
    }

    handleCancelEditExpedition();
  };

  const handleDeleteExpedition = (id: string) => {
    if (confirm(isFa ? 'آیا این سفر از لیست حذف شود؟' : 'Delete expedition?')) {
      onUpdateContent({
        ...content,
        expeditions: content.expeditions.filter((e) => e.id !== id),
      });
      if (editingExpId === id) handleCancelEditExpedition();
    }
  };

  const handleMoveExpedition = (index: number, direction: 'up' | 'down') => {
    const list = [...content.expeditions];
    const targetIdx = direction === 'up' ? index - 1 : index + 1;
    if (targetIdx < 0 || targetIdx >= list.length) return;
    const temp = list[index];
    list[index] = list[targetIdx];
    list[targetIdx] = temp;
    onUpdateContent({ ...content, expeditions: list });
  };

  // =========================================================================
  // ۴. مدیریت کتاب‌ها و انتشارات (Books & Publications)
  // =========================================================================

  const handleStartEditBook = (book: BookItem) => {
    setEditingBookId(book.id);
    setBookTitleFa(book.titleFa);
    setBookTitleEn(book.titleEn);
    setBookSubtitleFa(book.subtitleFa);
    setBookSubtitleEn(book.subtitleEn);
    setBookStatusFa(book.statusFa);
    setBookStatusEn(book.statusEn);
    setBookCoverImage(book.coverImage);
    setBookDescFa(book.descriptionFa);
    setBookDescEn(book.descriptionEn);
    setBookPublisherFa(book.publisherFa);
    setBookPublisherEn(book.publisherEn);
    setBookReleaseYear(book.releaseYear);
    setBookPages(book.pages);
  };

  const handleCancelEditBook = () => {
    setEditingBookId(null);
    setBookTitleFa('');
    setBookTitleEn('');
    setBookSubtitleFa('');
    setBookSubtitleEn('');
    setBookDescFa('');
    setBookDescEn('');
    setBookCoverImage('');
  };

  const handleSaveBook = (e: React.FormEvent) => {
    e.preventDefault();
    if (!bookTitleFa.trim()) return;

    if (editingBookId) {
      const updatedList = (content.books || []).map((b) => {
        if (b.id === editingBookId) {
          return {
            ...b,
            titleFa: bookTitleFa,
            titleEn: bookTitleEn || bookTitleFa,
            subtitleFa: bookSubtitleFa,
            subtitleEn: bookSubtitleEn || bookSubtitleFa,
            statusFa: bookStatusFa,
            statusEn: bookStatusEn,
            coverImage: bookCoverImage || b.coverImage,
            descriptionFa: bookDescFa,
            descriptionEn: bookDescEn || bookDescFa,
            publisherFa: bookPublisherFa,
            publisherEn: bookPublisherEn,
            releaseYear: bookReleaseYear,
            pages: bookPages,
          };
        }
        return b;
      });

      onUpdateContent({ ...content, books: updatedList });
      alert(isFa ? 'اطلاعات کتاب با موفقیت ویرایش شد!' : 'Book updated.');
    } else {
      const newBook: BookItem = {
        id: `book-${Date.now()}`,
        titleFa: bookTitleFa,
        titleEn: bookTitleEn || bookTitleFa,
        subtitleFa: bookSubtitleFa || 'مونوگراف عکاسی و کاوش‌های بصری',
        subtitleEn: bookSubtitleEn || 'Photographic Monograph & Visual Essay',
        statusFa: bookStatusFa,
        statusEn: bookStatusEn,
        coverImage: bookCoverImage || 'https://images.unsplash.com/photo-1544716278-ca5e3f4abd8c?auto=format&fit=crop&w=1000&q=80',
        descriptionFa: bookDescFa || 'کتاب فاین‌آرت و مستندنگاری زیست‌بوم‌های بکر ایران.',
        descriptionEn: bookDescEn || 'Fine art monograph capturing Iran untouched wilderness.',
        pages: bookPages,
        publisherFa: bookPublisherFa,
        publisherEn: bookPublisherEn,
        releaseYear: bookReleaseYear,
      };

      onUpdateContent({ ...content, books: [...(content.books || []), newBook] });
      alert(isFa ? 'کتاب جدید ثبت گردید!' : 'Book created.');
    }

    handleCancelEditBook();
  };

  const handleDeleteBook = (id: string) => {
    if (confirm(isFa ? 'آیا این کتاب از لیست حذف شود؟' : 'Delete book?')) {
      onUpdateContent({
        ...content,
        books: (content.books || []).filter((b) => b.id !== id),
      });
      if (editingBookId === id) handleCancelEditBook();
    }
  };

  // =========================================================================
  // ۵. مدیریت رزومه و سوابق (Resume & Career History)
  // =========================================================================

  const handleStartEditResume = (entry: ResumeEntry) => {
    setEditingResId(entry.id);
    setResPeriod(entry.period);
    setResTitleFa(entry.titleFa);
    setResTitleEn(entry.titleEn);
    setResOrgFa(entry.organizationFa);
    setResOrgEn(entry.organizationEn);
    setResDescFa(entry.descriptionFa);
    setResDescEn(entry.descriptionEn);
    setResType(entry.type);
  };

  const handleCancelEditResume = () => {
    setEditingResId(null);
    setResTitleFa('');
    setResTitleEn('');
    setResOrgFa('');
    setResOrgEn('');
    setResDescFa('');
    setResDescEn('');
  };

  const handleSaveResume = (e: React.FormEvent) => {
    e.preventDefault();
    if (!resTitleFa.trim()) return;

    if (editingResId) {
      const updatedList = content.resume.map((r) => {
        if (r.id === editingResId) {
          return {
            ...r,
            period: resPeriod,
            titleFa: resTitleFa,
            titleEn: resTitleEn || resTitleFa,
            organizationFa: resOrgFa,
            organizationEn: resOrgEn || resOrgFa,
            descriptionFa: resDescFa,
            descriptionEn: resDescEn,
            type: resType,
          };
        }
        return r;
      });

      onUpdateContent({ ...content, resume: updatedList });
      alert(isFa ? 'مورد رزومه ویرایش شد!' : 'Resume updated.');
    } else {
      const newRes: ResumeEntry = {
        id: `res-${Date.now()}`,
        period: resPeriod,
        titleFa: resTitleFa,
        titleEn: resTitleEn || resTitleFa,
        organizationFa: resOrgFa || 'فعالیت مستقل',
        organizationEn: resOrgEn || 'Independent',
        descriptionFa: resDescFa,
        descriptionEn: resDescEn,
        type: resType,
      };

      onUpdateContent({ ...content, resume: [newRes, ...content.resume] });
      alert(isFa ? 'سابقه جدید با موفقیت اضافه شد!' : 'Resume entry added.');
    }

    handleCancelEditResume();
  };

  const handleDeleteResume = (id: string) => {
    if (confirm(isFa ? 'آیا این مورد از رزومه حذف شود؟' : 'Delete item?')) {
      onUpdateContent({
        ...content,
        resume: content.resume.filter((r) => r.id !== id),
      });
      if (editingResId === id) handleCancelEditResume();
    }
  };

  // =========================================================================
  // ۶-الف. مدیریت دسته‌بندی‌های نمونه‌کارهای تخصصی (Commercial Categories)
  // =========================================================================

  const handleStartEditCategory = (cat: CategoryItem) => {
    setEditingCatId(cat.id);
    setCatId(cat.id);
    setCatTitleFa(cat.titleFa || cat.nameFa || '');
    setCatTitleEn(cat.titleEn || cat.nameEn || '');
    setCatDescFa(cat.descriptionFa || '');
    setCatDescEn(cat.descriptionEn || '');
    setCatIcon(cat.iconName || 'Camera');
  };

  const handleCancelEditCategory = () => {
    setEditingCatId(null);
    setCatId('');
    setCatTitleFa('');
    setCatTitleEn('');
    setCatDescFa('');
    setCatDescEn('');
    setCatIcon('Camera');
  };

  const handleSaveCategory = (e: React.FormEvent) => {
    e.preventDefault();
    if (!catTitleFa.trim()) return;
    const finalId = catId.trim() || `comm-${Date.now()}`;
    const currentList = content.commercialCategories || [];

    if (editingCatId) {
      const updated = currentList.map((c) => {
        if (c.id === editingCatId) {
          return {
            ...c,
            id: finalId,
            titleFa: catTitleFa,
            titleEn: catTitleEn || catTitleFa,
            nameFa: catTitleFa,
            nameEn: catTitleEn || catTitleFa,
            descriptionFa: catDescFa,
            descriptionEn: catDescEn,
            iconName: catIcon,
          };
        }
        return c;
      });
      onUpdateContent({ ...content, commercialCategories: updated });
      alert(isFa ? 'دسته‌بندی با موفقیت ویرایش شد!' : 'Category updated.');
    } else {
      const newCat: CategoryItem = {
        id: finalId,
        titleFa: catTitleFa,
        titleEn: catTitleEn || catTitleFa,
        nameFa: catTitleFa,
        nameEn: catTitleEn || catTitleFa,
        descriptionFa: catDescFa,
        descriptionEn: catDescEn,
        iconName: catIcon,
        order: currentList.length + 1,
      };
      onUpdateContent({ ...content, commercialCategories: [...currentList, newCat] });
      alert(isFa ? 'دسته‌بندی جدید با موفقیت اضافه شد!' : 'Category added.');
    }
    handleCancelEditCategory();
  };

  const handleDeleteCategory = (id: string) => {
    if (confirm(isFa ? 'آیا از حذف این دسته‌بندی اطمینان دارید؟' : 'Delete category?')) {
      const currentList = content.commercialCategories || [];
      onUpdateContent({
        ...content,
        commercialCategories: currentList.filter((c) => c.id !== id),
      });
      if (editingCatId === id) handleCancelEditCategory();
    }
  };

  const handleMoveCategory = (index: number, direction: 'up' | 'down') => {
    const list = [...(content.commercialCategories || [])];
    const target = direction === 'up' ? index - 1 : index + 1;
    if (target < 0 || target >= list.length) return;
    const temp = list[index];
    list[index] = list[target];
    list[target] = temp;
    onUpdateContent({ ...content, commercialCategories: list });
  };

  // =========================================================================
  // ۶-ب. مدیریت بانک تکنیک‌های عکاسی و تصویربرداری (Defined Techniques)
  // =========================================================================

  const handleStartEditTechnique = (t: DefinedTechnique) => {
    setEditingTechId(t.id);
    setTechId(t.id);
    setTechNameFa(t.nameFa);
    setTechNameEn(t.nameEn);
    setTechDescFa(t.descriptionFa || '');
    setTechDescEn(t.descriptionEn || '');
  };

  const handleCancelEditTechnique = () => {
    setEditingTechId(null);
    setTechId('');
    setTechNameFa('');
    setTechNameEn('');
    setTechDescFa('');
    setTechDescEn('');
  };

  const handleSaveTechnique = (e: React.FormEvent) => {
    e.preventDefault();
    if (!techNameFa.trim()) return;
    const finalId = techId.trim() || `tech-${Date.now()}`;
    const currentList = content.definedTechniques || [];

    if (editingTechId) {
      const updated = currentList.map((t) => {
        if (t.id === editingTechId) {
          return {
            ...t,
            id: finalId,
            nameFa: techNameFa,
            nameEn: techNameEn || techNameFa,
            descriptionFa: techDescFa,
            descriptionEn: techDescEn,
          };
        }
        return t;
      });
      onUpdateContent({ ...content, definedTechniques: updated });
      alert(isFa ? 'تکنیک با موفقیت ویرایش شد!' : 'Technique updated.');
    } else {
      const newTech: DefinedTechnique = {
        id: finalId,
        nameFa: techNameFa,
        nameEn: techNameEn || techNameFa,
        descriptionFa: techDescFa,
        descriptionEn: techDescEn,
      };
      onUpdateContent({ ...content, definedTechniques: [...currentList, newTech] });
      alert(isFa ? 'تکنیک جدید با موفقیت اضافه شد!' : 'Technique added.');
    }
    handleCancelEditTechnique();
  };

  const handleDeleteTechnique = (id: string) => {
    if (confirm(isFa ? 'آیا این تکنیک حذف شود؟' : 'Delete technique?')) {
      const currentList = content.definedTechniques || [];
      onUpdateContent({
        ...content,
        definedTechniques: currentList.filter((t) => t.id !== id),
      });
      if (editingTechId === id) handleCancelEditTechnique();
    }
  };

  const handleMoveTechnique = (index: number, direction: 'up' | 'down') => {
    const list = [...(content.definedTechniques || [])];
    const target = direction === 'up' ? index - 1 : index + 1;
    if (target < 0 || target >= list.length) return;
    const temp = list[index];
    list[index] = list[target];
    list[target] = temp;
    onUpdateContent({ ...content, definedTechniques: list });
  };

  // =========================================================================
  // ۶-ج. مدیریت مقالات سئو و بلاگ (SEO Articles & Editorial)
  // =========================================================================

  const handleStartEditArticle = (art: ArticleItem) => {
    setEditingArticleId(art.id);
    setArtTitleFa(art.titleFa);
    setArtTitleEn(art.titleEn);
    setArtSlug(art.slug);
    setArtExcerptFa(art.summaryFa || art.excerptFa || '');
    setArtExcerptEn(art.summaryEn || art.excerptEn || '');
    setArtContentFa(art.contentFa);
    setArtContentEn(art.contentEn || '');
    setArtCategoryFa(art.categoryFa || art.category || 'آموزش عکاسی');
    setArtCategoryEn(art.categoryEn || 'Tutorial');
    setArtCoverUrl(art.coverImage || art.coverUrl || '');
    setArtReadTime(art.readTimeMinutes || art.readingTimeMinutes || 6);
    setArtTags((art.tags || []).join(', '));
    setArtSeoKeywords((art.seoKeywords || []).join(', '));
    setArtIsPublished(art.isPublished !== false);
    setArtFeatured(art.featured || false);
  };

  const handleCancelEditArticle = () => {
    setEditingArticleId(null);
    setArtTitleFa('');
    setArtTitleEn('');
    setArtSlug('');
    setArtExcerptFa('');
    setArtExcerptEn('');
    setArtContentFa('');
    setArtContentEn('');
    setArtCoverUrl('');
    setArtTags('');
    setArtSeoKeywords('');
    setArtIsPublished(true);
    setArtFeatured(false);
  };

  const handleSaveArticle = (e: React.FormEvent) => {
    e.preventDefault();
    if (!artTitleFa.trim()) return;

    const tagsArray = artTags.split(/[,،]/).map((t) => t.trim()).filter(Boolean);
    const keywordsArray = artSeoKeywords.split(/[,،]/).map((k) => k.trim()).filter(Boolean);
    const generatedSlug =
      artSlug.trim() ||
      artTitleEn
        .toLowerCase()
        .replace(/[^a-z0-9]+/g, '-')
        .replace(/(^-|-$)/g, '') ||
      `article-${Date.now()}`;
    const currentArticles = content.articles || [];

    if (editingArticleId) {
      const updated = currentArticles.map((a) => {
        if (a.id === editingArticleId) {
          return {
            ...a,
            titleFa: artTitleFa,
            titleEn: artTitleEn || artTitleFa,
            slug: generatedSlug,
            summaryFa: artExcerptFa,
            summaryEn: artExcerptEn || artExcerptFa,
            excerptFa: artExcerptFa,
            excerptEn: artExcerptEn || artExcerptFa,
            contentFa: artContentFa,
            contentEn: artContentEn || artContentFa,
            category: artCategoryFa,
            categoryFa: artCategoryFa,
            categoryEn: artCategoryEn,
            coverImage: artCoverUrl || a.coverImage,
            coverUrl: artCoverUrl || a.coverUrl,
            readTimeMinutes: Number(artReadTime) || 5,
            readingTimeMinutes: Number(artReadTime) || 5,
            tags: tagsArray.length > 0 ? tagsArray : a.tags,
            seoKeywords: keywordsArray,
            isPublished: artIsPublished,
            featured: artFeatured,
          };
        }
        return a;
      });
      onUpdateContent({ ...content, articles: updated });
      alert(isFa ? 'مقاله با موفقیت ویرایش شد!' : 'Article updated.');
    } else {
      const newArticle: ArticleItem = {
        id: `art-${Date.now()}`,
        slug: generatedSlug,
        titleFa: artTitleFa,
        titleEn: artTitleEn || artTitleFa,
        summaryFa: artExcerptFa,
        summaryEn: artExcerptEn || artExcerptFa,
        excerptFa: artExcerptFa,
        excerptEn: artExcerptEn || artExcerptFa,
        contentFa: artContentFa,
        contentEn: artContentEn || artContentFa,
        category: artCategoryFa,
        categoryFa: artCategoryFa,
        categoryEn: artCategoryEn,
        coverImage: artCoverUrl || 'https://images.unsplash.com/photo-1516035069371-29a1b244cc32?auto=format&fit=crop&w=1200&q=80',
        coverUrl: artCoverUrl || 'https://images.unsplash.com/photo-1516035069371-29a1b244cc32?auto=format&fit=crop&w=1200&q=80',
        publishedAt: new Date().toISOString().split('T')[0],
        readTimeMinutes: Number(artReadTime) || 6,
        readingTimeMinutes: Number(artReadTime) || 6,
        tags: tagsArray.length > 0 ? tagsArray : ['عکاسی', 'آموزش'],
        author: 'سینا ضرغامی',
        isPublished: artIsPublished,
        seoKeywords: keywordsArray,
        featured: artFeatured,
      };
      onUpdateContent({ ...content, articles: [newArticle, ...currentArticles] });
      alert(isFa ? 'مقاله جدید با موفقیت منتشر شد!' : 'Article published.');
    }
    handleCancelEditArticle();
  };

  const handleDeleteArticle = (id: string) => {
    if (confirm(isFa ? 'آیا از حذف این مقاله اطمینان دارید؟' : 'Delete article?')) {
      const currentList = content.articles || [];
      onUpdateContent({
        ...content,
        articles: currentList.filter((a) => a.id !== id),
      });
      if (editingArticleId === id) handleCancelEditArticle();
    }
  };

  const handleMoveArticle = (index: number, direction: 'up' | 'down') => {
    const list = [...(content.articles || [])];
    const target = direction === 'up' ? index - 1 : index + 1;
    if (target < 0 || target >= list.length) return;
    const temp = list[index];
    list[index] = list[target];
    list[target] = temp;
    onUpdateContent({ ...content, articles: list });
  };

  // =========================================================================
  // ۶-د. ذخیره تنظیمات صفحه درباره من، ویترین صفحه اصلی و منوهای داینامیک
  // =========================================================================

  const handleSaveAboutAndLayout = (e: React.FormEvent) => {
    e.preventDefault();
    const eduList = aboutEduFaText.split('\n').map((l) => l.trim()).filter(Boolean);
    const specList = aboutSpecFaText.split(/[,،]/).map((s) => s.trim()).filter(Boolean);

    const updatedAbout: AboutPageContent = {
      ...aboutPageForm,
      educationFa: eduList,
      specialtiesFa: specList,
    };

    onUpdateContent({
      ...content,
      aboutPage: updatedAbout,
      homeShowcaseConfig: homeShowcaseForm,
      navLabels: navLabelsForm,
    });
    alert(isFa ? 'تنظیمات صفحه درباره من، ویترین صفحه اصلی و منوها با موفقیت ذخیره شد!' : 'About & Layout settings saved!');
  };

  // =========================================================================
  // ۷. ذخیره متن‌ها، مشخصات و ۴ آمار کلیدی هیرو
  // =========================================================================

  const handleSaveTextsAndProfile = (e: React.FormEvent) => {
    e.preventDefault();
    onUpdateContent({ ...content, profile: profileForm });
    alert(isFa ? 'متن‌ها، راه‌های ارتباطی و آمارهای کلیدی ذخیره شدند!' : 'Saved successfully!');
  };

  // ویرایش هر یک از شاخص‌های آماری
  const handleUpdateStat = (index: number, field: keyof StatItem, value: string) => {
    const updatedStats = [...profileForm.stats];
    updatedStats[index] = { ...updatedStats[index], [field]: value };
    setProfileForm({ ...profileForm, stats: updatedStats });
  };

  // =========================================================================
  // ۷. انتشار سراسری و پشتیبان‌گیری
  // =========================================================================

  /**
   * انتشار فوری و سراسری تغییرات در تمام دستگاه‌ها (موبایل و لپ‌تاپ)
   */
  const handleInstantUniversalPublish = async () => {
    try {
      setIsPublishing(true);
      setPublishStatus(null);
      saveGitHubToken(githubToken);

      // ۱. ذخیره فوری در کش لوکال استوریج
      saveSiteContent(content);

      // ۲. ذخیره قطعی در سرور اختصاصی جهت همگام‌سازی لحظه‌ای بین لپ‌تاپ و گوشی
      const serverRes = await fetch('/api/site-data', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(content),
      });

      if (!serverRes.ok) {
        throw new Error('سرور در ذخیره‌سازی داده با خطا مواجه شد.');
      }

      // ۳. ارسال اعلان انتشار به تلگرام سینا ضرغامی
      await sendTelegramNotification(
        `🚀 <b>انتشار فوری نسخه جدید وب‌سایت sinazarghami.ir</b>\n` +
        `سینا جان، تمام تغییرات، آثار جدید، پروژه‌ها و متون در سرور ابری ذخیره شدند و اکنون در تمام گوشی‌ها و لپ‌تاپ‌ها به صورت هماهنگ نمایش داده می‌شوند.`
      );

      // ۴. در صورتی که توکن گیت‌هاب وارد شده باشد، همگام‌سازی با مخزن szarghami/sinazarghami.ir انجام می‌شود
      let githubMsg = '';
      if (githubToken && githubToken.trim()) {
        try {
          const syncRes = await fetch('/api/github/sync', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              token: githubToken.trim(),
              repo: 'szarghami/sinazarghami.ir',
              path: 'site-data.json',
              content: content,
            }),
          });
          const syncData = await syncRes.json();
          if (syncRes.ok && syncData.success) {
            githubMsg = isFa
              ? ' همچنین همگام‌سازی با مخزن گیت‌هاب szarghami/sinazarghami.ir با موفقیت انجام شد.'
              : ' and repository szarghami/sinazarghami.ir was successfully synchronized.';
          } else if (syncData.error) {
            githubMsg = isFa
              ? ` (توجه: ذخیره در سرور انجام شد، اما گیت‌هاب: ${syncData.error})`
              : ` (Server updated, GitHub notice: ${syncData.error})`;
          }
        } catch (gitErr) {
          console.warn('GitHub sync optional warning:', gitErr);
        }
      }

      setInstantPublishSuccess(true);
      setPublishStatus({
        success: true,
        msg: isFa
          ? `انتشار فوری با موفقیت انجام شد! تمامی تغییرات در سرور ابری ثبت و بین گوشی و لپ‌تاپ یکپارچه شدند.${githubMsg}`
          : `Universal Publish Succeeded! Live and synchronized across all devices.${githubMsg}`,
      });
      setTimeout(() => setInstantPublishSuccess(false), 8000);
    } catch (err: any) {
      setPublishStatus({
        success: false,
        msg: isFa ? `خطا در انتشار: ${err.message}` : `Error: ${err.message}`,
      });
    } finally {
      setIsPublishing(false);
    }
  };

  /**
   * تست سلامت اتصال ربات تلگرام سینا ضرغامی
   */
  const handleTestTelegram = async () => {
    setTelegramTestStatus(isFa ? 'در حال ارسال پیام تست به تلگرام شما...' : 'Sending test message...');
    const ok = await sendTelegramNotification(
      `🔔 <b>تست موفق اتصال تلگرام sinazarghami.ir</b>\nسینا جان، ربات هوشمند شما به وب‌سایت متصل است و کلیه سفارشات چاپ، درخواست‌های سفر و پیام‌های امنیتی را به این چت ارسال می‌کند.`
    );
    if (ok) {
      setTelegramTestStatus(isFa ? 'پیام تست به تلگرام @sina_zarghami فرستاده شد!' : 'Message sent!');
    } else {
      setTelegramTestStatus(isFa ? 'خطا در ارسال پیام تلگرام. لطفاً اتصال اینترنت را بررسی کنید.' : 'Failed to send.');
    }
    setTimeout(() => setTelegramTestStatus(null), 7000);
  };

  /**
   * بارگذاری فایل پشتیبان JSON
   */
  const handleImportBackup = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (ev) => {
      try {
        const parsed = JSON.parse(ev.target?.result as string);
        if (parsed && parsed.profile && parsed.photos) {
          onUpdateContent(parsed);
          setProfileForm(parsed.profile);
          alert(isFa ? 'فایل پشتیبان با موفقیت بازیابی شد!' : 'Backup restored!');
        } else {
          alert(isFa ? 'ساختار فایل پشتیبان معتبر نیست.' : 'Invalid file.');
        }
      } catch {
        alert(isFa ? 'خطا در خواندن فایل JSON.' : 'Error parsing file.');
      }
    };
    reader.readAsText(file);
  };

  return (
    <div className="fixed inset-0 z-50 bg-stone-950/85 backdrop-blur-md flex items-center justify-center p-2 sm:p-4 md:p-6 overflow-y-auto">
      <div className="relative w-full max-w-5xl bg-white rounded-2xl shadow-2xl border border-stone-200 overflow-hidden my-auto max-h-[96vh] flex flex-col">
        {/* نوار بالایی سربرگ */}
        <div className="px-5 py-3.5 border-b border-stone-200 flex items-center justify-between bg-stone-900 text-white shrink-0">
          <div className="flex items-center gap-2.5">
            <Lock className="w-4 h-4 text-amber-400" />
            <div>
              <h3 className="text-sm sm:text-base font-bold">
                {isFa ? 'استودیو اختصاصی سینا ضرغامی' : 'Sina Zarghami Creator Studio'}
              </h3>
              <p className="text-[11px] text-stone-400">
                {isFa
                  ? 'مدیریت و ویرایش کامل: عکس‌ها، پروژه‌ها، سفرها، کتاب‌ها، ترجمه با Gemini و ذخیره ابری'
                  : 'Full Content Management, AI Translator & Cloud Storage'}
              </p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            {isAuthenticated && (
              <>
                <button
                  type="button"
                  onClick={handleInstantUniversalPublish}
                  disabled={isPublishing}
                  className="px-3 py-1.5 text-xs font-bold bg-emerald-600 hover:bg-emerald-500 text-white rounded-lg flex items-center gap-1.5 cursor-pointer shadow-xs transition-colors"
                  title={isFa ? 'انتشار آنی و ذخیره سراسری در سرور برای گوشی و لپ‌تاپ' : 'Instant Universal Publish'}
                >
                  <CloudUpload className="w-3.5 h-3.5" />
                  <span>
                    {isPublishing
                      ? (isFa ? 'در حال ذخیره...' : 'Syncing...')
                      : instantPublishSuccess
                      ? (isFa ? 'منتشر شد!' : 'Published!')
                      : (isFa ? 'انتشار فوری' : 'Instant Publish')}
                  </span>
                </button>

                <button
                  onClick={handleLogout}
                  className="px-2.5 py-1.5 text-xs text-stone-400 hover:text-white bg-stone-800 rounded-md cursor-pointer transition-colors"
                >
                  {isFa ? 'خروج' : 'Logout'}
                </button>
              </>
            )}
            <button
              onClick={onClose}
              className="p-1.5 text-stone-400 hover:text-white rounded-md cursor-pointer transition-colors"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* ================================================================ */}
        {/* وضعیت قبل از احراز هویت (قفل امنیتی ورود) */}
        {/* ================================================================ */}
        {!isAuthenticated ? (
          <div className="p-8 sm:p-12 text-center space-y-6 max-w-md mx-auto my-auto">
            <div className="w-16 h-16 bg-amber-50 text-amber-800 rounded-2xl flex items-center justify-center mx-auto border border-amber-200 shadow-sm">
              <KeyRound className="w-8 h-8" />
            </div>

            <div className="space-y-2">
              <h4 className="text-xl font-bold text-stone-900">
                {isFa ? 'ورود به پنل استودیو سینا ضرغامی' : 'Studio Access'}
              </h4>
              <p className="text-xs text-stone-500 leading-relaxed">
                {isFa
                  ? 'جهت مدیریت آثار، ترجمه هوشمند، تغییر پست‌ها و تنظیمات، رمز عبور اختصاصی خود را وارد نمایید:'
                  : 'Enter your studio password to unlock:'}
              </p>
            </div>

            <form onSubmit={handleLogin} className="space-y-3">
              <input
                type="password"
                placeholder={isFa ? 'رمز عبور' : 'Password'}
                value={pinInput}
                onChange={(e) => setPinInput(e.target.value)}
                className={`w-full px-4 py-2.5 text-center text-sm font-mono tracking-wider border rounded-lg focus:outline-none focus:ring-2 ${
                  pinError
                    ? 'border-red-500 focus:ring-red-300'
                    : 'border-stone-300 focus:ring-amber-600'
                }`}
              />

              {pinError && (
                <p className="text-xs text-red-600 font-medium">
                  {isFa ? 'رمز عبور واردشده صحیح نیست.' : 'Incorrect password.'}
                </p>
              )}

              <button
                type="submit"
                className="w-full py-2.5 bg-stone-900 hover:bg-stone-800 text-white text-sm font-bold rounded-lg transition-colors cursor-pointer shadow-sm"
              >
                {isFa ? 'ورود به پنل' : 'Unlock Studio'}
              </button>
            </form>

            <div className="pt-2">
              <button
                type="button"
                onClick={handleRequestTelegramRecovery}
                className="text-[11px] text-stone-500 hover:text-amber-800 transition-colors inline-flex items-center gap-1.5 cursor-pointer"
              >
                <Send className="w-3 h-3" />
                <span>{isFa ? 'ارسال محرمانه رمز عبور به تلگرام من (@sina_zarghami)' : 'Send recovery to my Telegram'}</span>
              </button>

              {recoverySent && (
                <p className="text-xs text-emerald-600 mt-2 font-medium">
                  {isFa ? 'رمز عبور با موفقیت به تلگرام شما ارسال شد.' : 'Password sent to Telegram.'}
                </p>
              )}
            </div>
          </div>
        ) : (
          /* ================================================================ */
          /* بعد از احراز هویت: پنل با تب‌های مختلف */
          /* ================================================================ */
          <div className="flex-1 overflow-y-auto flex flex-col">
            {/* نوار ناوبری تب‌ها */}
            <div className="flex items-center gap-1 px-4 sm:px-6 pt-3 border-b border-stone-200 bg-stone-50 text-xs font-medium text-stone-600 overflow-x-auto shrink-0">
              <button
                onClick={() => setActiveTab('upload_studio')}
                className={`pb-3 px-3 border-b-2 transition-colors cursor-pointer whitespace-nowrap flex items-center gap-1.5 ${
                  activeTab === 'upload_studio'
                    ? 'border-amber-700 text-stone-950 font-bold'
                    : 'border-transparent hover:text-stone-950'
                }`}
              >
                <Images className="w-3.5 h-3.5" />
                <span>{isFa ? 'گالری و آثار' : 'Photos & Cloud'}</span>
                <span className="text-[10px] bg-stone-200 text-stone-700 px-1.5 py-0.2 rounded-full font-mono">
                  {content.photos.length}
                </span>
              </button>

              <button
                onClick={() => setActiveTab('categories_techniques')}
                className={`pb-3 px-3 border-b-2 transition-colors cursor-pointer whitespace-nowrap flex items-center gap-1.5 ${
                  activeTab === 'categories_techniques'
                    ? 'border-amber-700 text-stone-950 font-bold'
                    : 'border-transparent hover:text-stone-950'
                }`}
              >
                <Layers className="w-3.5 h-3.5 text-amber-700" />
                <span>{isFa ? 'دسته‌بندی‌ها و تکنیک‌ها' : 'Categories & Techniques'}</span>
                <span className="text-[10px] bg-amber-100 text-amber-800 px-1.5 py-0.2 rounded-full font-mono">
                  {(content.commercialCategories || []).length + (content.definedTechniques || []).length}
                </span>
              </button>

              <button
                onClick={() => setActiveTab('articles')}
                className={`pb-3 px-3 border-b-2 transition-colors cursor-pointer whitespace-nowrap flex items-center gap-1.5 ${
                  activeTab === 'articles'
                    ? 'border-amber-700 text-stone-950 font-bold'
                    : 'border-transparent hover:text-stone-950'
                }`}
              >
                <FileText className="w-3.5 h-3.5 text-blue-700" />
                <span>{isFa ? 'مقالات سئو و وبلاگ' : 'SEO Articles'}</span>
                <span className="text-[10px] bg-blue-100 text-blue-800 px-1.5 py-0.2 rounded-full font-mono">
                  {(content.articles || []).length}
                </span>
              </button>

              <button
                onClick={() => setActiveTab('about_and_home')}
                className={`pb-3 px-3 border-b-2 transition-colors cursor-pointer whitespace-nowrap flex items-center gap-1.5 ${
                  activeTab === 'about_and_home'
                    ? 'border-amber-700 text-stone-950 font-bold'
                    : 'border-transparent hover:text-stone-950'
                }`}
              >
                <SlidersHorizontal className="w-3.5 h-3.5 text-emerald-700" />
                <span>{isFa ? 'درباره من، چیدمان و منو' : 'About & Layout'}</span>
              </button>

              <button
                onClick={() => setActiveTab('software')}
                className={`pb-3 px-3 border-b-2 transition-colors cursor-pointer whitespace-nowrap flex items-center gap-1.5 ${
                  activeTab === 'software'
                    ? 'border-amber-700 text-stone-950 font-bold'
                    : 'border-transparent hover:text-stone-950'
                }`}
              >
                <Code2 className="w-3.5 h-3.5" />
                <span>{isFa ? 'پلتفرم‌ها و ابزارها' : 'Software Projects'}</span>
                <span className="text-[10px] bg-stone-200 text-stone-700 px-1.5 py-0.2 rounded-full font-mono">
                  {content.software.length}
                </span>
              </button>

              <button
                onClick={() => setActiveTab('expeditions')}
                className={`pb-3 px-3 border-b-2 transition-colors cursor-pointer whitespace-nowrap flex items-center gap-1.5 ${
                  activeTab === 'expeditions'
                    ? 'border-amber-700 text-stone-950 font-bold'
                    : 'border-transparent hover:text-stone-950'
                }`}
              >
                <Compass className="w-3.5 h-3.5" />
                <span>{isFa ? 'سفرها و تورها' : 'Expeditions'}</span>
                <span className="text-[10px] bg-stone-200 text-stone-700 px-1.5 py-0.2 rounded-full font-mono">
                  {content.expeditions.length}
                </span>
              </button>

              <button
                onClick={() => setActiveTab('books')}
                className={`pb-3 px-3 border-b-2 transition-colors cursor-pointer whitespace-nowrap flex items-center gap-1.5 ${
                  activeTab === 'books'
                    ? 'border-amber-700 text-stone-950 font-bold'
                    : 'border-transparent hover:text-stone-950'
                }`}
              >
                <BookOpen className="w-3.5 h-3.5" />
                <span>{isFa ? 'کتاب‌ها و مونوگراف‌ها' : 'Books'}</span>
                <span className="text-[10px] bg-stone-200 text-stone-700 px-1.5 py-0.2 rounded-full font-mono">
                  {(content.books || []).length}
                </span>
              </button>

              <button
                onClick={() => setActiveTab('resume')}
                className={`pb-3 px-3 border-b-2 transition-colors cursor-pointer whitespace-nowrap flex items-center gap-1.5 ${
                  activeTab === 'resume'
                    ? 'border-amber-700 text-stone-950 font-bold'
                    : 'border-transparent hover:text-stone-950'
                }`}
              >
                <Briefcase className="w-3.5 h-3.5" />
                <span>{isFa ? 'رزومه و سوابق' : 'Resume'}</span>
              </button>

              <button
                onClick={() => setActiveTab('texts')}
                className={`pb-3 px-3 border-b-2 transition-colors cursor-pointer whitespace-nowrap flex items-center gap-1.5 ${
                  activeTab === 'texts'
                    ? 'border-amber-700 text-stone-950 font-bold'
                    : 'border-transparent hover:text-stone-950'
                }`}
              >
                <Type className="w-3.5 h-3.5" />
                <span>{isFa ? 'متن‌ها، آمارها و تماس' : 'Brand & Texts'}</span>
              </button>

              <button
                onClick={() => setActiveTab('analytics')}
                className={`pb-3 px-3 border-b-2 transition-colors cursor-pointer whitespace-nowrap flex items-center gap-1.5 ${
                  activeTab === 'analytics'
                    ? 'border-blue-600 text-stone-950 font-bold'
                    : 'border-transparent hover:text-stone-950'
                }`}
              >
                <BarChart3 className="w-3.5 h-3.5 text-blue-600" />
                <span>{isFa ? 'آمار بازدید و رفتار خریداران' : 'Visitor Analytics'}</span>
                <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
              </button>

              <button
                onClick={() => setActiveTab('publish')}
                className={`pb-3 px-3 border-b-2 transition-colors cursor-pointer whitespace-nowrap flex items-center gap-1.5 ${
                  activeTab === 'publish'
                    ? 'border-amber-700 text-stone-950 font-bold'
                    : 'border-transparent hover:text-stone-950'
                }`}
              >
                <CloudUpload className="w-3.5 h-3.5 text-emerald-700" />
                <span>{isFa ? 'انتشار و پشتیبان' : 'Publish & Sync'}</span>
              </button>

              <button
                onClick={() => setActiveTab('security')}
                className={`pb-3 px-3 border-b-2 transition-colors cursor-pointer whitespace-nowrap flex items-center gap-1.5 ${
                  activeTab === 'security'
                    ? 'border-amber-700 text-stone-950 font-bold'
                    : 'border-transparent hover:text-stone-950'
                }`}
              >
                <KeyRound className="w-3.5 h-3.5" />
                <span>{isFa ? 'امنیت و تلگرام' : 'Security'}</span>
              </button>
            </div>

            {/* ============================================================== */}
            {/* تب ۱: آپلود، فشرده‌سازی کنار هم، ترجمه با هوش مصنوعی و گالری */}
            {/* ============================================================== */}
            {activeTab === 'upload_studio' && (
              <div className="p-4 sm:p-6 space-y-8">
                {/* بخش دو ستونه: آپلود دسته‌ای در چپ، تنظیمات فشرده‌سازی همزمان در راست */}
                <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
                  {/* ستون اول: بارگذاری فایل‌ها */}
                  <div className="lg:col-span-7 bg-stone-50 p-5 rounded-2xl border border-stone-200 space-y-4">
                    <div className="flex items-center justify-between">
                      <h4 className="text-sm font-bold text-stone-900 flex items-center gap-2">
                        <Images className="w-4 h-4 text-amber-700" />
                        <span>{isFa ? 'انتخاب عکس یا مجموعه عکس (آلبوم چندعکسی)' : 'Upload Photo(s)'}</span>
                      </h4>
                      <label className="flex items-center gap-1.5 text-xs text-stone-700 cursor-pointer">
                        <input
                          type="checkbox"
                          checked={uploadToCloud}
                          onChange={(e) => setUploadToCloud(e.target.checked)}
                          className="rounded text-amber-700 focus:ring-amber-600"
                        />
                        <span>{isFa ? 'آپلود در باکت ابری (sina_site)' : 'Supabase Cloud'}</span>
                      </label>
                    </div>

                    <input
                      ref={fileInputRef}
                      type="file"
                      multiple
                      accept="image/*"
                      onChange={handleFilesChosen}
                      className="hidden"
                    />

                    <div
                      onClick={() => fileInputRef.current?.click()}
                      className="p-6 bg-white rounded-xl border-2 border-dashed border-stone-300 hover:border-amber-700 transition-colors text-center cursor-pointer space-y-2 group"
                    >
                      <Upload className="w-8 h-8 text-stone-400 group-hover:text-amber-700 mx-auto transition-colors" />
                      <div className="text-xs font-bold text-stone-800">
                        {isFa ? 'کلیک کنید یا فایل‌ها را بکشید (تک عکس یا انتخاب همزمان چند عکس)' : 'Click or drop photos here'}
                      </div>
                      <p className="text-[11px] text-stone-400">
                        {isFa ? 'تبدیل خودکار به WebP بسیار سبک با حفظ حداکثر رزولوشن' : 'Auto WebP format & 5MB bucket check'}
                      </p>
                    </div>

                    {/* پیش‌نمایش بندانگشتی عکس‌های انتخاب‌شده */}
                    {compressedResults.length > 0 && (
                      <div className="space-y-2 pt-2">
                        <div className="flex items-center justify-between text-xs font-bold text-stone-700">
                          <span>{isFa ? `پیش‌نمایش خروجی فشرده‌شده (${compressedResults.length} تصویر):` : 'Compressed Previews:'}</span>
                          <button
                            type="button"
                            onClick={() => {
                              setRawFiles([]);
                              setCompressedResults([]);
                              setOverallStats(null);
                            }}
                            className="text-[11px] text-red-600 hover:underline cursor-pointer"
                          >
                            {isFa ? 'پاکسازی' : 'Clear'}
                          </button>
                        </div>
                        <div className="grid grid-cols-4 sm:grid-cols-6 gap-2 max-h-36 overflow-y-auto p-1 bg-white rounded-lg border border-stone-200">
                          {compressedResults.map((item, idx) => (
                            <div key={idx} className="relative aspect-square rounded-md overflow-hidden bg-stone-100 group border border-stone-200">
                              <img src={item.dataUrl} alt="" className="w-full h-full object-cover" />
                              <div className="absolute inset-0 bg-stone-950/60 opacity-0 group-hover:opacity-100 flex items-center justify-center text-[10px] text-white font-mono transition-opacity">
                                -{item.reductionPercent}%
                              </div>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}
                  </div>

                  {/* ستون دوم: تنظیمات زنده فشرده‌سازی در همان لحظه */}
                  <div className="lg:col-span-5 bg-stone-50 p-5 rounded-2xl border border-stone-200 space-y-4">
                    <h4 className="text-sm font-bold text-stone-900 flex items-center gap-2">
                      <Sliders className="w-4 h-4 text-amber-700" />
                      <span>{isFa ? 'تنظیمات حجم و فرمت (WebP)' : 'WebP Compression'}</span>
                    </h4>

                    <div className="space-y-3 text-xs">
                      <div>
                        <div className="flex justify-between font-medium text-stone-700 mb-1">
                          <span>{isFa ? 'کیفیت تصویر خروجی:' : 'Quality:'}</span>
                          <span className="font-mono text-amber-800">{Math.round(compressQuality * 100)}%</span>
                        </div>
                        <input
                          type="range"
                          min="0.30"
                          max="0.95"
                          step="0.05"
                          value={compressQuality}
                          onChange={(e) => setCompressQuality(parseFloat(e.target.value))}
                          className="w-full accent-amber-700"
                        />
                      </div>

                      <div>
                        <div className="flex justify-between font-medium text-stone-700 mb-1">
                          <span>{isFa ? 'حداکثر ابعاد (طول/عرض):' : 'Max Dimension:'}</span>
                          <span className="font-mono text-amber-800">{compressMaxDim}px</span>
                        </div>
                        <input
                          type="range"
                          min="800"
                          max="2800"
                          step="200"
                          value={compressMaxDim}
                          onChange={(e) => setCompressMaxDim(parseInt(e.target.value))}
                          className="w-full accent-amber-700"
                        />
                      </div>

                      {overallStats && (
                        <div className="p-3 bg-white rounded-xl border border-stone-200 space-y-1 text-[11px] text-stone-600">
                          <div className="flex justify-between">
                            <span>{isFa ? 'حجم اولیه کل:' : 'Original Total:'}</span>
                            <span className="font-mono">{overallStats.origKB.toLocaleString()} KB</span>
                          </div>
                          <div className="flex justify-between font-bold text-emerald-700">
                            <span>{isFa ? 'حجم بهینه خروجی:' : 'Compressed Total:'}</span>
                            <span className="font-mono">{overallStats.compKB.toLocaleString()} KB</span>
                          </div>
                          <div className="flex justify-between text-amber-800 font-bold">
                            <span>{isFa ? 'میزان کاهش حجم:' : 'Saved:'}</span>
                            <span>{overallStats.percent}% فشرده‌تر</span>
                          </div>
                        </div>
                      )}
                    </div>
                  </div>
                </div>

                {/* کارت پیشنهاد هوشمند عنوان، موضوع و داستان با جمینای */}
                <div className="p-4 bg-gradient-to-r from-amber-50 via-stone-50 to-indigo-50/60 rounded-2xl border border-amber-200/90 space-y-3">
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                    <div className="flex items-center gap-2.5">
                      <div className="w-9 h-9 rounded-xl bg-amber-600 text-white flex items-center justify-center shrink-0 shadow-xs">
                        <Sparkles className="w-5 h-5" />
                      </div>
                      <div>
                        <h5 className="text-xs font-bold text-stone-900">
                          {isFa ? 'پیشنهاد هوشمند موضوع، عنوان و داستان عکس (Gemini AI Vision)' : 'AI Photo Topic, Title & Story Suggester'}
                        </h5>
                        <p className="text-[11px] text-stone-500">
                          {isFa
                            ? 'جمینای تصویر انتخاب‌شده را تحلیل کرده و عنوان شاعرانه، دسته‌بندی و داستان هنری متناسب پیشنهاد می‌دهد.'
                            : 'AI analyzes the image composition and generates fine-art titles and narrative.'}
                        </p>
                      </div>
                    </div>

                    <button
                      type="button"
                      onClick={handleAiSuggestPhoto}
                      disabled={isAiSuggesting || (compressedResults.length === 0 && !photoImageUrl)}
                      className="px-4 py-2 bg-gradient-to-r from-amber-700 to-amber-600 hover:from-amber-600 hover:to-amber-500 text-white text-xs font-bold rounded-xl transition-all shadow-xs flex items-center justify-center gap-1.5 cursor-pointer disabled:opacity-50 shrink-0"
                    >
                      {isAiSuggesting ? (
                        <>
                          <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                          <span>{isFa ? 'در حال تحلیل بصری عکس...' : 'Analyzing Image...'}</span>
                        </>
                      ) : (
                        <>
                          <Wand2 className="w-3.5 h-3.5" />
                          <span>{isFa ? 'دریافت پیشنهادات هوش مصنوعی' : 'Get AI Suggestions'}</span>
                        </>
                      )}
                    </button>
                  </div>

                  {aiSuggestError && (
                    <div className="p-2.5 bg-red-50 border border-red-200 rounded-lg text-xs text-red-800">
                      {aiSuggestError}
                    </div>
                  )}

                  {aiSuggestion && (
                    <div className="p-4 bg-white rounded-xl border border-amber-300 space-y-3 animate-fade-in shadow-xs text-xs">
                      <div className="flex flex-wrap items-center justify-between gap-2 border-b border-stone-100 pb-2">
                        <div className="flex items-center gap-2">
                          <span className="px-2.5 py-0.5 rounded-full bg-amber-100 text-amber-900 font-bold text-[11px]">
                            {aiSuggestion.categoryFa || aiSuggestion.category}
                          </span>
                          <span className="text-stone-500 font-mono text-[11px]">
                            {aiSuggestion.locationFa} · {aiSuggestion.camera}
                          </span>
                        </div>
                        <button
                          type="button"
                          onClick={handleApplyAiSuggestion}
                          className="px-3 py-1 bg-amber-700 hover:bg-amber-800 text-white font-bold rounded-lg cursor-pointer flex items-center gap-1 shadow-xs"
                        >
                          <Check className="w-3 h-3" />
                          <span>{isFa ? 'اعمال تمام پیشنهادات در فرم' : 'Apply All to Form'}</span>
                        </button>
                      </div>

                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                        <div className="space-y-1">
                          <span className="text-[10px] text-stone-400 font-mono block">عنوان پیشنهادی فارسی:</span>
                          <p className="font-bold text-stone-900 text-sm">«{aiSuggestion.titleFa}»</p>
                        </div>
                        <div className="space-y-1">
                          <span className="text-[10px] text-stone-400 font-mono block">English Title:</span>
                          <p className="font-medium text-stone-800 text-xs italic">{aiSuggestion.titleEn}</p>
                        </div>
                      </div>

                      <div className="space-y-1 pt-1 border-t border-stone-100">
                        <span className="text-[10px] text-stone-400 font-mono block">داستان و روایت پیشنهادی عکس:</span>
                        <p className="text-stone-700 leading-relaxed text-xs">{aiSuggestion.descriptionFa}</p>
                      </div>

                      {aiSuggestion.tags && aiSuggestion.tags.length > 0 && (
                        <div className="flex flex-wrap gap-1.5 pt-1">
                          {aiSuggestion.tags.map((tag, tIdx) => (
                            <span key={tIdx} className="px-2 py-0.5 bg-stone-100 text-stone-600 rounded text-[10px]">
                              #{tag}
                            </span>
                          ))}
                        </div>
                      )}
                    </div>
                  )}
                </div>

                {/* فرم مشخصات اثر / آلبوم (همراه با دکمه‌های ترجمه Gemini AI) */}
                <form onSubmit={handleSavePhoto} className="p-5 bg-white rounded-2xl border border-stone-200 space-y-4 text-xs">
                  <div className="flex items-center justify-between border-b border-stone-200 pb-3">
                    <div className="font-bold text-stone-900 text-sm flex items-center gap-2">
                      <Sparkles className="w-4 h-4 text-amber-700" />
                      <span>{editingPhotoId ? (isFa ? 'ویرایش اثر انتخابی' : 'Edit Photo') : (isFa ? 'مشخصات و ترجمه هنری اثر' : 'Photo Details & AI Translation')}</span>
                    </div>
                    {editingPhotoId && (
                      <button
                        type="button"
                        onClick={handleCancelEditPhoto}
                        className="text-stone-500 hover:text-stone-800 underline text-xs cursor-pointer"
                      >
                        {isFa ? 'انصراف از ویرایش' : 'Cancel Edit'}
                      </button>
                    )}
                  </div>

                  {/* فیلد عنوان فارسی و ترجمه هوشمند انگلیسی */}
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div>
                      <div className="flex items-center justify-between mb-1">
                        <label className="font-bold text-stone-700">{isFa ? 'عنوان اثر به فارسی:' : 'Persian Title:'}</label>
                        <button
                          type="button"
                          onClick={() => handleAiTranslate(photoTitleFa, setPhotoTitleEn, 'photoTitle', 'title', photoCategory)}
                          disabled={translatingField === 'photoTitle' || !photoTitleFa}
                          className="text-[11px] text-amber-800 hover:text-amber-950 font-bold flex items-center gap-1 cursor-pointer disabled:opacity-50"
                        >
                          <Wand2 className="w-3 h-3" />
                          <span>{translatingField === 'photoTitle' ? (isFa ? 'در حال ترجمه...' : 'Translating...') : (isFa ? 'ترجمه هنری با هوش مصنوعی (Gemini)' : 'AI Translate')}</span>
                        </button>
                      </div>
                      <div className="flex items-center gap-2">
                        <input
                          type="text"
                          value={photoTitleFa}
                          onChange={(e) => setPhotoTitleFa(e.target.value)}
                          placeholder="مثال: سکوت افق‌ها در غروب شهداد"
                          className="flex-1 px-3 py-2 border border-stone-300 rounded-lg bg-stone-50 focus:bg-white"
                        />
                        <VoiceDictationButton
                          onTranscript={(t) => setPhotoTitleFa((prev) => (prev ? prev + ' ' + t : t))}
                          title={isFa ? 'دیکته صوتی عنوان' : 'Dictate title'}
                        />
                      </div>
                    </div>

                    <div>
                      <label className="block font-bold text-stone-700 mb-1">{isFa ? 'عنوان انگلیسی گالری (Editorial Title):' : 'English Title:'}</label>
                      <input
                        type="text"
                        value={photoTitleEn}
                        onChange={(e) => setPhotoTitleEn(e.target.value)}
                        placeholder="e.g. Silence of Horizons: Twilight Shadows Across the Shahdad Kaluts"
                        className="w-full px-3 py-2 border border-stone-300 rounded-lg bg-stone-50 focus:bg-white"
                      />
                    </div>
                  </div>

                  {/* موقعیت مکانی و دسته‌بندی */}
                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                    <div>
                      <label className="block font-bold text-stone-700 mb-1">{isFa ? 'دسته‌بندی اثر:' : 'Category:'}</label>
                      <select
                        value={photoCategory}
                        onChange={(e) => setPhotoCategory(e.target.value as any)}
                        className="w-full px-3 py-2 border border-stone-300 rounded-lg bg-white"
                      >
                        <option value="landscape">{isFa ? 'چشم‌انداز و کویر (Landscape)' : 'Landscape'}</option>
                        <option value="aerial">{isFa ? 'هوایی و پهپاد (Aerial & Drone)' : 'Aerial'}</option>
                        <option value="architecture">{isFa ? 'معماری و ساختارها (Architecture)' : 'Architecture'}</option>
                        <option value="documentary">{isFa ? 'مستند و پرتره (Documentary)' : 'Documentary'}</option>
                        <option value="portrait">{isFa ? 'پرتره محیطی (Portrait)' : 'Portrait'}</option>
                      </select>
                    </div>

                    <div>
                      <div className="flex items-center justify-between mb-1">
                        <label className="font-bold text-stone-700">{isFa ? 'موقعیت مکانی (فارسی):' : 'Location (FA):'}</label>
                        <button
                          type="button"
                          onClick={() => handleAiTranslate(photoLocationFa, setPhotoLocationEn, 'photoLoc', 'title', 'location')}
                          disabled={translatingField === 'photoLoc' || !photoLocationFa}
                          className="text-[11px] text-amber-800 font-bold flex items-center gap-1 cursor-pointer disabled:opacity-50"
                        >
                          <Wand2 className="w-3 h-3" />
                          <span>AI</span>
                        </button>
                      </div>
                      <input
                        type="text"
                        value={photoLocationFa}
                        onChange={(e) => setPhotoLocationFa(e.target.value)}
                        placeholder="مثال: کویر لوت، کرمان"
                        className="w-full px-3 py-2 border border-stone-300 rounded-lg bg-stone-50 focus:bg-white"
                      />
                    </div>

                    <div>
                      <label className="block font-bold text-stone-700 mb-1">{isFa ? 'موقعیت مکانی (انگلیسی):' : 'Location (EN):'}</label>
                      <input
                        type="text"
                        value={photoLocationEn}
                        onChange={(e) => setPhotoLocationEn(e.target.value)}
                        placeholder="e.g. Lut Desert, Kerman"
                        className="w-full px-3 py-2 border border-stone-300 rounded-lg bg-stone-50 focus:bg-white"
                      />
                    </div>
                  </div>

                  {/* مشخصات دوربین و لنز */}
                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                    <div>
                      <label className="block font-bold text-stone-700 mb-1">{isFa ? 'مدل دوربین:' : 'Camera:'}</label>
                      <input
                        type="text"
                        value={photoCamera}
                        onChange={(e) => setPhotoCamera(e.target.value)}
                        className="w-full px-3 py-2 border border-stone-300 rounded-lg bg-white"
                      />
                      <div className="flex flex-wrap gap-1 mt-1.5">
                        {['Canon R8', 'Canon 70D', 'GoPro Max 360', 'iPhone 13 Pro Max'].map((cam) => (
                          <button
                            key={cam}
                            type="button"
                            onClick={() => setPhotoCamera(cam)}
                            className="px-2 py-0.5 text-[10px] bg-stone-100 hover:bg-amber-100 text-stone-700 rounded border border-stone-200 cursor-pointer"
                          >
                            {cam}
                          </button>
                        ))}
                      </div>
                    </div>
                    <div>
                      <label className="block font-bold text-stone-700 mb-1">{isFa ? 'لنز استفاده‌شده:' : 'Lens:'}</label>
                      <input
                        type="text"
                        value={photoLens}
                        onChange={(e) => setPhotoLens(e.target.value)}
                        className="w-full px-3 py-2 border border-stone-300 rounded-lg bg-white"
                      />
                      <div className="flex flex-wrap gap-1 mt-1.5">
                        {['Canon EF 50mm f/1.8', 'Canon EF-S 55–250mm', 'رینگ معکوس ماکرو', 'Canon RF 24-50mm'].map((l) => (
                          <button
                            key={l}
                            type="button"
                            onClick={() => setPhotoLens(l)}
                            className="px-2 py-0.5 text-[10px] bg-stone-100 hover:bg-amber-100 text-stone-700 rounded border border-stone-200 cursor-pointer"
                          >
                            {l}
                          </button>
                        ))}
                      </div>
                    </div>
                    <div>
                      <label className="block font-bold text-stone-700 mb-1">{isFa ? 'سال ثبت:' : 'Year:'}</label>
                      <input
                        type="text"
                        value={photoYear}
                        onChange={(e) => setPhotoYear(e.target.value)}
                        className="w-full px-3 py-2 border border-stone-300 rounded-lg bg-white"
                      />
                      <div className="flex flex-wrap gap-1 mt-1.5">
                        {['1403', '1402', '1401', '2024'].map((yr) => (
                          <button
                            key={yr}
                            type="button"
                            onClick={() => setPhotoYear(yr)}
                            className="px-2 py-0.5 text-[10px] bg-stone-100 hover:bg-amber-100 text-stone-700 rounded border border-stone-200 cursor-pointer"
                          >
                            {yr}
                          </button>
                        ))}
                      </div>
                    </div>
                  </div>

                  {/* توضیحات فارسی و انگلیسی با هوش مصنوعی */}
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div>
                      <div className="flex items-center justify-between mb-1">
                        <div className="flex items-center gap-2">
                          <label className="font-bold text-stone-700">{isFa ? 'روایت و توضیح فارسی اثر:' : 'Persian Description:'}</label>
                          <VoiceDictationButton
                            onTranscript={(t) => setPhotoDescFa((prev) => (prev ? prev + ' ' + t : t))}
                            title={isFa ? 'دیکته صوتی توضیحات' : 'Dictate description'}
                          />
                        </div>
                        <button
                          type="button"
                          onClick={() => handleAiTranslate(photoDescFa, setPhotoDescEn, 'photoDesc', 'description', photoCategory)}
                          disabled={translatingField === 'photoDesc' || !photoDescFa}
                          className="text-[11px] text-amber-800 font-bold flex items-center gap-1 cursor-pointer disabled:opacity-50"
                        >
                          <Wand2 className="w-3 h-3" />
                          <span>{translatingField === 'photoDesc' ? (isFa ? 'در حال ترجمه عمیق...' : 'Translating...') : (isFa ? 'ترجمه عمیق با هوش مصنوعی' : 'AI Translate')}</span>
                        </button>
                      </div>
                      <textarea
                        rows={2}
                        value={photoDescFa}
                        onChange={(e) => setPhotoDescFa(e.target.value)}
                        placeholder="داستان، حس‌وحال فضا و تکنیک عکاسی..."
                        className="w-full px-3 py-2 border border-stone-300 rounded-lg bg-stone-50 focus:bg-white resize-none"
                      />
                    </div>

                    <div>
                      <label className="block font-bold text-stone-700 mb-1">{isFa ? 'توضیحات انگلیسی (Editorial Curated):' : 'English Description:'}</label>
                      <textarea
                        rows={2}
                        value={photoDescEn}
                        onChange={(e) => setPhotoDescEn(e.target.value)}
                        placeholder="Evocative editorial narrative in English..."
                        className="w-full px-3 py-2 border border-stone-300 rounded-lg bg-stone-50 focus:bg-white resize-none"
                      />
                    </div>
                  </div>

                  {/* تفکیک داینامیک CMS: محل نمایش، دسته‌بندی تجاری و کارفرما */}
                  <div className="p-4 bg-amber-50/50 rounded-xl border border-amber-200/80 space-y-3.5">
                    <div className="flex items-center justify-between">
                      <span className="font-bold text-stone-900 flex items-center gap-1.5">
                        <Bookmark className="w-3.5 h-3.5 text-amber-700" />
                        <span>{isFa ? 'تنظیمات نوع اثر و محل نمایش (Dynamic CMS)' : 'Portfolio Scope & Showcase'}</span>
                      </span>
                      <span className="text-[11px] text-amber-800">
                        {isFa ? 'تفکیک هوشمند نمونه‌کار تخصصی از عکس‌های سفر' : 'Commercial vs Travel'}
                      </span>
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                      <div>
                        <label className="block font-bold text-stone-700 mb-1.5">{isFa ? 'محل نمایش اثر:' : 'Scope:'}</label>
                        <div className="grid grid-cols-2 gap-2">
                          <button
                            type="button"
                            onClick={() => setPhotoPortfolioScope('commercial')}
                            className={`py-2 px-3 rounded-lg text-xs font-bold border transition-all cursor-pointer flex items-center justify-center gap-1.5 ${
                              photoPortfolioScope === 'commercial'
                                ? 'bg-amber-700 text-white border-amber-700 shadow-xs'
                                : 'bg-white text-stone-700 border-stone-200 hover:bg-stone-50'
                            }`}
                          >
                            <Briefcase className="w-3.5 h-3.5" />
                            <span>{isFa ? 'نمونه‌کار تخصصی' : 'Commercial'}</span>
                          </button>
                          <button
                            type="button"
                            onClick={() => setPhotoPortfolioScope('travel')}
                            className={`py-2 px-3 rounded-lg text-xs font-bold border transition-all cursor-pointer flex items-center justify-center gap-1.5 ${
                              photoPortfolioScope === 'travel'
                                ? 'bg-amber-700 text-white border-amber-700 shadow-xs'
                                : 'bg-white text-stone-700 border-stone-200 hover:bg-stone-50'
                            }`}
                          >
                            <Compass className="w-3.5 h-3.5" />
                            <span>{isFa ? 'گالری و سفر' : 'Travel & Tour'}</span>
                          </button>
                        </div>
                      </div>

                      {/* نمایش در صفحه اصلی */}
                      <div className="p-2.5 bg-white rounded-lg border border-stone-200 space-y-2">
                        <label className="flex items-center gap-2 cursor-pointer font-bold text-stone-900">
                          <input
                            type="checkbox"
                            checked={photoShowOnHome}
                            onChange={(e) => setPhotoShowOnHome(e.target.checked)}
                            className="rounded text-amber-700 w-4 h-4 cursor-pointer"
                          />
                          <span className="flex items-center gap-1">
                            <Star className={`w-3.5 h-3.5 ${photoShowOnHome ? 'text-amber-500 fill-amber-500' : 'text-stone-400'}`} />
                            <span>{isFa ? 'نمایش در پست‌های برگزیده صفحه اصلی' : 'Show on Homepage'}</span>
                          </span>
                        </label>
                        {photoShowOnHome && (
                          <div className="flex items-center gap-2 pt-1 border-t border-stone-100">
                            <label className="text-[11px] text-stone-600 shrink-0">{isFa ? 'ترتیب در صفحه اصلی:' : 'Home Order:'}</label>
                            <input
                              type="number"
                              value={photoHomeOrder}
                              onChange={(e) => setPhotoHomeOrder(parseInt(e.target.value) || 0)}
                              className="w-20 px-2 py-1 text-center border border-stone-300 rounded font-mono text-xs"
                            />
                            <span className="text-[10px] text-stone-400">{isFa ? '(عدد کمتر = نمایش اول)' : '(Lower = first)'}</span>
                          </div>
                        )}
                      </div>
                    </div>

                    {photoPortfolioScope === 'commercial' && (
                      <div className="space-y-3 pt-2 border-t border-amber-200/60 animate-fade-in">
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                          <div>
                            <label className="block font-bold text-stone-700 mb-1">
                              {isFa ? 'دسته‌بندی تخصصی نمونه‌کار:' : 'Commercial Category:'}
                            </label>
                            <select
                              value={photoCommercialCategory}
                              onChange={(e) => setPhotoCommercialCategory(e.target.value)}
                              className="w-full px-3 py-2 border border-stone-300 rounded-lg bg-white"
                            >
                              <option value="">{isFa ? '-- انتخاب دسته‌بندی تخصصی --' : '-- Select Category --'}</option>
                              {(content.commercialCategories || []).map((cat) => (
                                <option key={cat.id} value={cat.id}>
                                  {isFa ? cat.titleFa || cat.nameFa : cat.titleEn || cat.nameEn}
                                </option>
                              ))}
                            </select>
                          </div>

                          <div>
                            <label className="block font-bold text-stone-700 mb-1">
                              {isFa ? 'نام کارفرما یا شرکت سفارش‌دهنده:' : 'Client / Company Name:'}
                            </label>
                            <input
                              type="text"
                              value={photoClientName}
                              onChange={(e) => setPhotoClientName(e.target.value)}
                              placeholder="مثال: مپنا، کاله، شرکت نفت، ایران‌خودرو"
                              className="w-full px-3 py-2 border border-stone-300 rounded-lg bg-white"
                            />
                          </div>
                        </div>

                        <div>
                          <label className="block font-bold text-stone-700 mb-1">
                            {isFa ? 'شرح خلاصه پروژه برای کارفرما:' : 'Client Project Brief:'}
                          </label>
                          <input
                            type="text"
                            value={photoClientInfo}
                            onChange={(e) => setPhotoClientInfo(e.target.value)}
                            placeholder="مثال: عکاسی صنعتی از خط تولید توربین و تهیه کتابچه گزارش سالانه"
                            className="w-full px-3 py-2 border border-stone-300 rounded-lg bg-white"
                          />
                        </div>
                      </div>
                    )}
                  </div>

                  {/* اتصال به تجهیزات و تکنیک‌های عکاسی با تگ‌های چندانتخابی (Chips) */}
                  <div className="p-4 bg-stone-50 rounded-xl border border-stone-200 space-y-3">
                    <div className="font-bold text-stone-900 flex items-center justify-between">
                      <span className="flex items-center gap-1.5">
                        <Tag className="w-3.5 h-3.5 text-amber-700" />
                        <span>{isFa ? 'اتصال به تجهیزات و تکنیک‌های به‌کاررفته:' : 'Gear & Techniques Tagging:'}</span>
                      </span>
                      <span className="text-[11px] text-stone-500 font-normal">
                        {isFa ? 'جهت نمایش خودکار در صفحات فیلتر (/filter)' : 'Used for dynamic filter page'}
                      </span>
                    </div>

                    {/* انتخابگر تجهیزات استفاده‌شده */}
                    <div className="space-y-1.5">
                      <label className="block text-[11px] font-bold text-stone-700">{isFa ? 'تجهیزات به‌کاررفته:' : 'Associated Gear:'}</label>
                      <div className="flex flex-wrap gap-1.5">
                        {(content.equipment || []).map((eq) => {
                          const isSelected = photoGearIds.includes(eq.id) || photoGearIds.includes(eq.name);
                          return (
                            <button
                              key={eq.id}
                              type="button"
                              onClick={() => {
                                if (isSelected) {
                                  setPhotoGearIds(photoGearIds.filter((id) => id !== eq.id && id !== eq.name));
                                } else {
                                  setPhotoGearIds([...photoGearIds, eq.id]);
                                }
                              }}
                              className={`px-2.5 py-1 rounded-lg text-[11px] font-medium border transition-colors cursor-pointer ${
                                isSelected
                                  ? 'bg-stone-900 text-white border-stone-900 shadow-2xs'
                                  : 'bg-white text-stone-700 border-stone-300 hover:bg-stone-100'
                              }`}
                            >
                              {eq.name}
                            </button>
                          );
                        })}
                      </div>
                    </div>

                    {/* انتخابگر تکنیک‌های عکاسی + فیلد افزودن سریع */}
                    <div className="space-y-2 pt-2 border-t border-stone-200/80">
                      <div className="flex items-center justify-between">
                        <label className="block text-[11px] font-bold text-stone-700">{isFa ? 'تکنیک‌های عکاسی و تصویربرداری:' : 'Techniques Used:'}</label>
                        <span className="text-[10px] text-stone-400">{isFa ? 'برای افزودن روی چیپ کلیک کنید' : 'Click chip to toggle'}</span>
                      </div>
                      <div className="flex flex-wrap gap-1.5">
                        {(content.definedTechniques || []).map((tech) => {
                          const isSelected = photoTechniques.includes(tech.nameFa) || photoTechniques.includes(tech.id);
                          return (
                            <button
                              key={tech.id}
                              type="button"
                              onClick={() => {
                                if (isSelected) {
                                  setPhotoTechniques(photoTechniques.filter((t) => t !== tech.nameFa && t !== tech.id));
                                } else {
                                  setPhotoTechniques([...photoTechniques, tech.nameFa]);
                                }
                              }}
                              className={`px-2.5 py-1 rounded-lg text-[11px] font-medium border transition-colors cursor-pointer ${
                                isSelected
                                  ? 'bg-amber-800 text-white border-amber-800 shadow-2xs'
                                  : 'bg-white text-stone-700 border-stone-300 hover:bg-amber-50/60'
                              }`}
                            >
                              {isFa ? tech.nameFa : tech.nameEn}
                            </button>
                          );
                        })}
                      </div>

                      {/* فیلد افزودن سریع تکنیک جدید در همان فرم */}
                      <div className="flex items-center gap-2 pt-1">
                        <input
                          type="text"
                          value={quickNewTechInput}
                          onChange={(e) => setQuickNewTechInput(e.target.value)}
                          onKeyDown={(e) => {
                            if (e.key === 'Enter') {
                              e.preventDefault();
                              handleQuickAddTechnique();
                            }
                          }}
                          placeholder={isFa ? 'افزودن سریع تکنیک جدید (مثلاً: لانگ اکسپوژر در شب)...' : 'Quick add new technique...'}
                          className="flex-1 px-3 py-1.5 border border-stone-300 rounded-lg bg-white text-xs"
                        />
                        <button
                          type="button"
                          onClick={handleQuickAddTechnique}
                          disabled={!quickNewTechInput.trim()}
                          className="px-3 py-1.5 bg-stone-800 hover:bg-stone-900 text-white rounded-lg text-xs font-bold flex items-center gap-1 cursor-pointer disabled:opacity-50"
                        >
                          <Plus className="w-3.5 h-3.5" />
                          <span>{isFa ? 'افزودن تکنیک' : 'Add'}</span>
                        </button>
                      </div>
                    </div>
                  </div>

                  {/* قیمت چاپ و فروش نسخه اصل */}
                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 p-3 bg-stone-50 rounded-xl border border-stone-200 items-center">
                    <label className="flex items-center gap-2 cursor-pointer font-bold text-stone-800">
                      <input
                        type="checkbox"
                        checked={photoPrintAvail}
                        onChange={(e) => setPhotoPrintAvail(e.target.checked)}
                        className="rounded text-amber-700"
                      />
                      <span>{isFa ? 'قابل سفارش برای چاپ نسخه فاین‌آرت' : 'Available for Print Sale'}</span>
                    </label>

                    <div>
                      <label className="block text-[11px] text-stone-600 mb-0.5">{isFa ? 'قیمت چاپ نسخه پایه (تومان):' : 'Price (Toman):'}</label>
                      <input
                        type="number"
                        value={photoPriceToman}
                        onChange={(e) => setPhotoPriceToman(parseInt(e.target.value) || 0)}
                        className="w-full px-3 py-1.5 border border-stone-300 rounded-md bg-white font-mono"
                      />
                    </div>

                    <div>
                      <label className="block text-[11px] text-stone-600 mb-0.5">{isFa ? 'قیمت بین‌المللی (دلار):' : 'Price (USD):'}</label>
                      <input
                        type="number"
                        value={photoPriceUsd}
                        onChange={(e) => setPhotoPriceUsd(parseInt(e.target.value) || 0)}
                        className="w-full px-3 py-1.5 border border-stone-300 rounded-md bg-white font-mono"
                      />
                    </div>
                  </div>

                  {supabaseUploadMsg && (
                    <div className="p-2.5 bg-amber-50 text-amber-900 rounded-lg text-xs font-mono border border-amber-200">
                      {supabaseUploadMsg}
                    </div>
                  )}

                  <div className="flex gap-2 pt-2">
                    <button
                      type="submit"
                      disabled={isProcessing}
                      className="flex-1 py-3 bg-amber-700 hover:bg-amber-800 disabled:bg-stone-400 text-white font-bold rounded-xl transition-colors cursor-pointer flex items-center justify-center gap-2 shadow-sm"
                    >
                      <Check className="w-4 h-4" />
                      <span>
                        {editingPhotoId
                          ? (isFa ? 'ذخیره تغییرات اثر' : 'Update Photo')
                          : (isFa
                              ? compressedResults.length > 1
                                ? `ثبت و انتشار آلبوم گالری (${compressedResults.length} عکس)`
                                : 'ثبت و انتشار اثر در گالری'
                              : 'Publish to Gallery')}
                      </span>
                    </button>
                    {editingPhotoId && (
                      <button
                        type="button"
                        onClick={handleCancelEditPhoto}
                        className="px-4 py-3 bg-stone-200 hover:bg-stone-300 text-stone-800 font-bold rounded-xl cursor-pointer"
                      >
                        {isFa ? 'انصراف' : 'Cancel'}
                      </button>
                    )}
                  </div>
                </form>

                {/* فهرست تمام عکس‌ها و آلبوم‌های موجود با قابلیت ستاره سریع صفحه اصلی، ویرایش، حذف و جابجایی */}
                <div className="space-y-3">
                  <div className="flex items-center justify-between text-xs font-bold text-stone-800">
                    <span>{isFa ? `فهرست آثار و آلبوم‌های گالری (${content.photos.length} اثر فعال):` : 'Active Gallery Items:'}</span>
                    <span className="text-stone-400 font-normal">
                      {isFa ? 'ستاره ⭐ = نمایش برگزیده در صفحه اصلی | فلش‌ها = تغییر اولویت نمایش' : 'Star = Home Showcase | Arrows = Reorder'}
                    </span>
                  </div>

                  <div className="space-y-2 max-h-80 overflow-y-auto pr-1">
                    {content.photos.map((p, idx) => (
                      <div
                        key={p.id}
                        className={`p-3 bg-stone-50 hover:bg-stone-100/80 rounded-xl border transition-colors flex items-center justify-between gap-3 text-xs ${
                          editingPhotoId === p.id ? 'border-amber-600 bg-amber-50/40 ring-1 ring-amber-500' : 'border-stone-200'
                        }`}
                      >
                        <div className="flex items-center gap-3 overflow-hidden">
                          {/* دکمه ستاره سریع برای انتخاب یا حذف از صفحه اصلی با ۱ کلیک */}
                          <button
                            type="button"
                            onClick={() => handleTogglePhotoShowOnHome(p.id)}
                            title={p.showOnHome ? (isFa ? 'حذف از ویترین صفحه اصلی' : 'Remove from Home') : (isFa ? 'افزودن به ویترین صفحه اصلی' : 'Pin to Home')}
                            className={`p-1.5 rounded-lg border transition-all cursor-pointer shrink-0 ${
                              p.showOnHome
                                ? 'bg-amber-100 text-amber-800 border-amber-300 hover:bg-amber-200'
                                : 'bg-white text-stone-300 border-stone-200 hover:text-stone-500 hover:border-stone-300'
                            }`}
                          >
                            <Star className={`w-4 h-4 ${p.showOnHome ? 'fill-amber-500 text-amber-600' : ''}`} />
                          </button>

                          <img
                            src={p.imageUrl}
                            alt=""
                            className="w-14 h-11 object-cover rounded-md bg-stone-200 shrink-0 border border-stone-300"
                            referrerPolicy="no-referrer"
                          />
                          <div className="truncate">
                            <div className="font-bold text-stone-900 flex items-center gap-1.5 truncate">
                              <span className="truncate">{isFa ? p.titleFa : p.titleEn}</span>
                              {p.isAlbum && (
                                <span className="text-[10px] bg-amber-100 text-amber-900 px-1.5 py-0.2 rounded font-mono shrink-0">
                                  آلبوم
                                </span>
                              )}
                              {p.portfolioScope === 'travel' ? (
                                <span className="text-[10px] bg-emerald-100 text-emerald-800 px-1.5 py-0.2 rounded font-bold shrink-0">
                                  سفر
                                </span>
                              ) : (
                                <span className="text-[10px] bg-indigo-100 text-indigo-800 px-1.5 py-0.2 rounded font-bold shrink-0">
                                  تخصصی
                                </span>
                              )}
                              {p.showOnHome && (
                                <span className="text-[10px] bg-amber-100 text-amber-800 px-1.5 py-0.2 rounded font-mono shrink-0">
                                  ⭐ اصلی
                                </span>
                              )}
                            </div>
                            <div className="text-[11px] text-stone-500 font-mono truncate flex items-center gap-2">
                              <span>{p.category} · {p.locationFa} ({p.year})</span>
                              {p.clientName && (
                                <span className="text-amber-800 font-sans font-bold">· کارفرما: {p.clientName}</span>
                              )}
                            </div>
                          </div>
                        </div>

                        <div className="flex items-center gap-1.5 shrink-0">
                          {/* دکمه‌های جابجایی ترتیب */}
                          <button
                            onClick={() => handleMovePhoto(idx, 'up')}
                            disabled={idx === 0}
                            title={isFa ? 'انتقال به بالا' : 'Move Up'}
                            className="p-1.5 text-stone-500 hover:text-stone-900 disabled:opacity-30 cursor-pointer"
                          >
                            <ArrowUp className="w-3.5 h-3.5" />
                          </button>
                          <button
                            onClick={() => handleMovePhoto(idx, 'down')}
                            disabled={idx === content.photos.length - 1}
                            title={isFa ? 'انتقال به پایین' : 'Move Down'}
                            className="p-1.5 text-stone-500 hover:text-stone-900 disabled:opacity-30 cursor-pointer"
                          >
                            <ArrowDown className="w-3.5 h-3.5" />
                          </button>

                          {/* دکمه ویرایش */}
                          <button
                            onClick={() => handleStartEditPhoto(p)}
                            className="px-2.5 py-1 text-xs bg-white hover:bg-stone-200 border border-stone-300 text-stone-800 rounded-md flex items-center gap-1 cursor-pointer font-medium"
                          >
                            <Edit3 className="w-3.5 h-3.5 text-amber-700" />
                            <span>{isFa ? 'ویرایش' : 'Edit'}</span>
                          </button>

                          {/* دکمه حذف */}
                          <button
                            onClick={() => handleDeletePhoto(p.id)}
                            className="p-1.5 text-red-600 hover:bg-red-50 rounded-md cursor-pointer transition-colors"
                            title={isFa ? 'حذف اثر' : 'Delete'}
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            )}

            {/* ============================================================== */}
            {/* تب: مدیریت دسته‌بندی‌های نمونه‌کار و بانک تکنیک‌ها */}
            {/* ============================================================== */}
            {activeTab === 'categories_techniques' && (
              <div className="p-4 sm:p-6 space-y-8">
                {/* بخش اول: دسته‌بندی‌های نمونه‌کار تخصصی (Commercial Categories) */}
                <div className="bg-stone-50 p-5 rounded-2xl border border-stone-200 space-y-4">
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-stone-200 pb-3">
                    <div>
                      <h4 className="text-sm font-bold text-stone-900 flex items-center gap-2">
                        <Layers className="w-4 h-4 text-amber-700" />
                        <span>{isFa ? 'دسته‌بندی‌های نمونه‌کار تخصصی و تجاری' : 'Commercial Categories'}</span>
                        <span className="text-[11px] bg-amber-100 text-amber-800 px-2 py-0.5 rounded-full font-mono">
                          {(content.commercialCategories || []).length}
                        </span>
                      </h4>
                      <p className="text-[11px] text-stone-500 mt-0.5">
                        {isFa
                          ? 'دسته‌بندی‌های فیلتر نمونه‌کارها در صفحه /portfolio بدون نیاز به کدنویسی (صنعتی، همایشی، تیزر، معماری...)'
                          : 'Dynamic portfolio filter categories displayed on /portfolio'}
                      </p>
                    </div>

                    {!editingCatId && (
                      <button
                        type="button"
                        onClick={() => {
                          setEditingCatId('new');
                          setCatId(`comm-${Date.now()}`);
                          setCatTitleFa('');
                          setCatTitleEn('');
                          setCatDescFa('');
                          setCatDescEn('');
                          setCatIcon('Camera');
                        }}
                        className="px-3.5 py-1.5 bg-amber-700 hover:bg-amber-800 text-white rounded-lg text-xs font-bold flex items-center gap-1.5 cursor-pointer shadow-xs shrink-0"
                      >
                        <Plus className="w-3.5 h-3.5" />
                        <span>{isFa ? 'افزودن دسته‌بندی جدید' : 'Add Category'}</span>
                      </button>
                    )}
                  </div>

                  {/* فرم افزودن یا ویرایش دسته‌بندی */}
                  {editingCatId && (
                    <form onSubmit={handleSaveCategory} className="p-4 bg-white rounded-xl border border-amber-300 space-y-3 animate-fade-in text-xs shadow-xs">
                      <div className="flex items-center justify-between border-b border-stone-100 pb-2">
                        <span className="font-bold text-stone-900 flex items-center gap-1.5">
                          <Edit3 className="w-3.5 h-3.5 text-amber-700" />
                          <span>{editingCatId === 'new' ? (isFa ? 'افزودن دسته‌بندی تجاری جدید' : 'New Commercial Category') : (isFa ? 'ویرایش دسته‌بندی' : 'Edit Category')}</span>
                        </span>
                        <button
                          type="button"
                          onClick={handleCancelEditCategory}
                          className="text-stone-400 hover:text-stone-700 text-xs cursor-pointer"
                        >
                          {isFa ? 'انصراف' : 'Cancel'}
                        </button>
                      </div>

                      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                        <div>
                          <label className="block font-bold text-stone-700 mb-1">{isFa ? 'شناسه انگلیسی یکتا (ID/Slug):' : 'Slug / ID:'}</label>
                          <input
                            type="text"
                            required
                            value={catId}
                            onChange={(e) => setCatId(e.target.value)}
                            placeholder="e.g. industrial, conference, aerial"
                            className="w-full px-3 py-1.5 border border-stone-300 rounded-lg bg-stone-50 font-mono text-xs"
                          />
                        </div>

                        <div>
                          <label className="block font-bold text-stone-700 mb-1">{isFa ? 'نام فارسی دسته‌بندی:' : 'Title (FA):'}</label>
                          <input
                            type="text"
                            required
                            value={catTitleFa}
                            onChange={(e) => setCatTitleFa(e.target.value)}
                            placeholder="مثال: عکاسی صنعتی و کارخانجات"
                            className="w-full px-3 py-1.5 border border-stone-300 rounded-lg bg-white text-xs"
                          />
                        </div>

                        <div>
                          <label className="block font-bold text-stone-700 mb-1">{isFa ? 'Title (English):' : 'Title (EN):'}</label>
                          <input
                            type="text"
                            value={catTitleEn}
                            onChange={(e) => setCatTitleEn(e.target.value)}
                            placeholder="e.g. Industrial & Factory"
                            className="w-full px-3 py-1.5 border border-stone-300 rounded-lg bg-white text-xs"
                          />
                        </div>
                      </div>

                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                        <div>
                          <label className="block font-bold text-stone-700 mb-1">{isFa ? 'توضیحات فارسی مختصر:' : 'Description (FA):'}</label>
                          <input
                            type="text"
                            value={catDescFa}
                            onChange={(e) => setCatDescFa(e.target.value)}
                            placeholder="توضیح کوتاه که در بالای صفحه نمونه‌کارها نمایش داده می‌شود"
                            className="w-full px-3 py-1.5 border border-stone-300 rounded-lg bg-white text-xs"
                          />
                        </div>

                        <div>
                          <label className="block font-bold text-stone-700 mb-1">{isFa ? 'نام آیکون نمایشی:' : 'Icon Name:'}</label>
                          <input
                            type="text"
                            value={catIcon}
                            onChange={(e) => setCatIcon(e.target.value)}
                            placeholder="Camera, Factory, Building, Compass, Video"
                            className="w-full px-3 py-1.5 border border-stone-300 rounded-lg bg-white text-xs font-mono"
                          />
                        </div>
                      </div>

                      <div className="flex gap-2 pt-1">
                        <button
                          type="submit"
                          className="flex-1 py-2 bg-amber-700 hover:bg-amber-800 text-white font-bold rounded-lg cursor-pointer transition-colors shadow-2xs"
                        >
                          {editingCatId === 'new' ? (isFa ? 'افزودن دسته‌بندی' : 'Save Category') : (isFa ? 'ذخیره تغییرات' : 'Update Category')}
                        </button>
                        <button
                          type="button"
                          onClick={handleCancelEditCategory}
                          className="px-4 py-2 bg-stone-200 hover:bg-stone-300 text-stone-700 font-bold rounded-lg cursor-pointer"
                        >
                          {isFa ? 'انصراف' : 'Cancel'}
                        </button>
                      </div>
                    </form>
                  )}

                  {/* فهرست دسته‌بندی‌های تجاری همراه با جابجایی ترتیب، ویرایش و حذف */}
                  <div className="space-y-2 max-h-64 overflow-y-auto pr-1">
                    {(content.commercialCategories || []).map((cat, idx) => (
                      <div
                        key={cat.id}
                        className={`p-3 bg-white rounded-xl border transition-colors flex items-center justify-between gap-3 text-xs ${
                          editingCatId === cat.id ? 'border-amber-600 bg-amber-50/40 ring-1 ring-amber-500' : 'border-stone-200 hover:border-stone-300'
                        }`}
                      >
                        <div className="flex items-center gap-2.5 truncate">
                          <span className="w-6 h-6 rounded-md bg-amber-50 text-amber-800 font-mono text-[11px] font-bold flex items-center justify-center shrink-0 border border-amber-200">
                            {idx + 1}
                          </span>
                          <div className="truncate">
                            <div className="font-bold text-stone-900 flex items-center gap-2">
                              <span>{isFa ? cat.titleFa || cat.nameFa : cat.titleEn || cat.nameEn}</span>
                              <span className="text-[10px] text-stone-400 font-mono">({cat.id})</span>
                            </div>
                            {cat.descriptionFa && (
                              <p className="text-[11px] text-stone-500 truncate mt-0.5">{cat.descriptionFa}</p>
                            )}
                          </div>
                        </div>

                        <div className="flex items-center gap-1.5 shrink-0">
                          {/* دکمه‌های جابجایی ترتیب */}
                          <button
                            type="button"
                            onClick={() => handleMoveCategory(idx, 'up')}
                            disabled={idx === 0}
                            title={isFa ? 'انتقال به بالا' : 'Move Up'}
                            className="p-1 text-stone-500 hover:text-stone-900 disabled:opacity-30 cursor-pointer"
                          >
                            <ArrowUp className="w-3.5 h-3.5" />
                          </button>
                          <button
                            type="button"
                            onClick={() => handleMoveCategory(idx, 'down')}
                            disabled={idx === (content.commercialCategories || []).length - 1}
                            title={isFa ? 'انتقال به پایین' : 'Move Down'}
                            className="p-1 text-stone-500 hover:text-stone-900 disabled:opacity-30 cursor-pointer"
                          >
                            <ArrowDown className="w-3.5 h-3.5" />
                          </button>

                          {/* دکمه ویرایش */}
                          <button
                            type="button"
                            onClick={() => handleStartEditCategory(cat)}
                            className="px-2 py-1 text-xs bg-stone-100 hover:bg-stone-200 border border-stone-200 text-stone-800 rounded-md flex items-center gap-1 cursor-pointer font-medium"
                          >
                            <Edit3 className="w-3 h-3 text-amber-700" />
                            <span>{isFa ? 'ویرایش' : 'Edit'}</span>
                          </button>

                          {/* دکمه حذف */}
                          <button
                            type="button"
                            onClick={() => handleDeleteCategory(cat.id)}
                            className="p-1 text-red-600 hover:bg-red-50 rounded-md cursor-pointer transition-colors"
                            title={isFa ? 'حذف دسته‌بندی' : 'Delete'}
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>

                {/* بخش دوم: مدیریت بانک تکنیک‌ها (Defined Techniques) */}
                <div className="bg-stone-50 p-5 rounded-2xl border border-stone-200 space-y-4">
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-stone-200 pb-3">
                    <div>
                      <h4 className="text-sm font-bold text-stone-900 flex items-center gap-2">
                        <Tag className="w-4 h-4 text-amber-700" />
                        <span>{isFa ? 'بانک تکنیک‌های عکاسی و تصویربرداری' : 'Techniques Locker'}</span>
                        <span className="text-[11px] bg-stone-200 text-stone-800 px-2 py-0.5 rounded-full font-mono">
                          {(content.definedTechniques || []).length}
                        </span>
                      </h4>
                      <p className="text-[11px] text-stone-500 mt-0.5">
                        {isFa
                          ? 'تکنیک‌های قابل انتساب به عکس‌ها که کاربران با کلیک روی آن‌ها آثار مرتبط را در /filter می‌بینند.'
                          : 'Techniques associated with photos for dynamic filtering on /filter'}
                      </p>
                    </div>

                    {!editingTechId && (
                      <button
                        type="button"
                        onClick={() => {
                          setEditingTechId('new');
                          setTechId(`tech-${Date.now()}`);
                          setTechNameFa('');
                          setTechNameEn('');
                          setTechDescFa('');
                          setTechDescEn('');
                        }}
                        className="px-3.5 py-1.5 bg-stone-900 hover:bg-stone-800 text-white rounded-lg text-xs font-bold flex items-center gap-1.5 cursor-pointer shadow-xs shrink-0"
                      >
                        <Plus className="w-3.5 h-3.5" />
                        <span>{isFa ? 'افزودن تکنیک جدید' : 'Add Technique'}</span>
                      </button>
                    )}
                  </div>

                  {/* فرم افزودن یا ویرایش تکنیک */}
                  {editingTechId && (
                    <form onSubmit={handleSaveTechnique} className="p-4 bg-white rounded-xl border border-stone-300 space-y-3 animate-fade-in text-xs shadow-xs">
                      <div className="flex items-center justify-between border-b border-stone-100 pb-2">
                        <span className="font-bold text-stone-900 flex items-center gap-1.5">
                          <Edit3 className="w-3.5 h-3.5 text-amber-700" />
                          <span>{editingTechId === 'new' ? (isFa ? 'افزودن تکنیک جدید' : 'New Technique') : (isFa ? 'ویرایش تکنیک' : 'Edit Technique')}</span>
                        </span>
                        <button
                          type="button"
                          onClick={handleCancelEditTechnique}
                          className="text-stone-400 hover:text-stone-700 text-xs cursor-pointer"
                        >
                          {isFa ? 'انصراف' : 'Cancel'}
                        </button>
                      </div>

                      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                        <div>
                          <label className="block font-bold text-stone-700 mb-1">{isFa ? 'شناسه انگلیسی (ID/Slug):' : 'ID / Slug:'}</label>
                          <input
                            type="text"
                            required
                            value={techId}
                            onChange={(e) => setTechId(e.target.value)}
                            placeholder="e.g. long-exposure, timelapes"
                            className="w-full px-3 py-1.5 border border-stone-300 rounded-lg bg-stone-50 font-mono text-xs"
                          />
                        </div>

                        <div>
                          <label className="block font-bold text-stone-700 mb-1">{isFa ? 'نام فارسی تکنیک:' : 'Technique Name (FA):'}</label>
                          <input
                            type="text"
                            required
                            value={techNameFa}
                            onChange={(e) => setTechNameFa(e.target.value)}
                            placeholder="مثال: نوردهی طولانی با فیلتر ND1000"
                            className="w-full px-3 py-1.5 border border-stone-300 rounded-lg bg-white text-xs"
                          />
                        </div>

                        <div>
                          <label className="block font-bold text-stone-700 mb-1">{isFa ? 'نام انگلیسی (EN):' : 'Technique Name (EN):'}</label>
                          <input
                            type="text"
                            value={techNameEn}
                            onChange={(e) => setTechNameEn(e.target.value)}
                            placeholder="e.g. Long Exposure with ND1000"
                            className="w-full px-3 py-1.5 border border-stone-300 rounded-lg bg-white text-xs"
                          />
                        </div>
                      </div>

                      <div>
                        <label className="block font-bold text-stone-700 mb-1">{isFa ? 'توضیحات کاربردی تکنیک:' : 'Description:'}</label>
                        <input
                          type="text"
                          value={techDescFa}
                          onChange={(e) => setTechDescFa(e.target.value)}
                          placeholder="توضیح فنی مختصر درباره نحوه اجرا، تنظیمات دیافراگم یا کاربرد این تکنیک"
                          className="w-full px-3 py-1.5 border border-stone-300 rounded-lg bg-white text-xs"
                        />
                      </div>

                      <div className="flex gap-2 pt-1">
                        <button
                          type="submit"
                          className="flex-1 py-2 bg-stone-900 hover:bg-stone-800 text-white font-bold rounded-lg cursor-pointer transition-colors shadow-2xs"
                        >
                          {editingTechId === 'new' ? (isFa ? 'ثبت در بانک تکنیک‌ها' : 'Save Technique') : (isFa ? 'ذخیره تغییرات' : 'Update Technique')}
                        </button>
                        <button
                          type="button"
                          onClick={handleCancelEditTechnique}
                          className="px-4 py-2 bg-stone-200 hover:bg-stone-300 text-stone-700 font-bold rounded-lg cursor-pointer"
                        >
                          {isFa ? 'انصراف' : 'Cancel'}
                        </button>
                      </div>
                    </form>
                  )}

                  {/* فهرست تکنیک‌ها */}
                  <div className="space-y-2 max-h-64 overflow-y-auto pr-1">
                    {(content.definedTechniques || []).map((t, idx) => (
                      <div
                        key={t.id}
                        className={`p-3 bg-white rounded-xl border transition-colors flex items-center justify-between gap-3 text-xs ${
                          editingTechId === t.id ? 'border-amber-600 bg-amber-50/40 ring-1 ring-amber-500' : 'border-stone-200 hover:border-stone-300'
                        }`}
                      >
                        <div className="flex items-center gap-2.5 truncate">
                          <span className="w-6 h-6 rounded-md bg-stone-100 text-stone-700 font-mono text-[11px] font-bold flex items-center justify-center shrink-0 border border-stone-200">
                            {idx + 1}
                          </span>
                          <div className="truncate">
                            <div className="font-bold text-stone-900 flex items-center gap-2">
                              <span>{isFa ? t.nameFa : t.nameEn}</span>
                              <span className="text-[10px] text-stone-400 font-mono">({t.id})</span>
                            </div>
                            {t.descriptionFa && (
                              <p className="text-[11px] text-stone-500 truncate mt-0.5">{t.descriptionFa}</p>
                            )}
                          </div>
                        </div>

                        <div className="flex items-center gap-1.5 shrink-0">
                          {/* دکمه‌های جابجایی ترتیب */}
                          <button
                            type="button"
                            onClick={() => handleMoveTechnique(idx, 'up')}
                            disabled={idx === 0}
                            title={isFa ? 'انتقال به بالا' : 'Move Up'}
                            className="p-1 text-stone-500 hover:text-stone-900 disabled:opacity-30 cursor-pointer"
                          >
                            <ArrowUp className="w-3.5 h-3.5" />
                          </button>
                          <button
                            type="button"
                            onClick={() => handleMoveTechnique(idx, 'down')}
                            disabled={idx === (content.definedTechniques || []).length - 1}
                            title={isFa ? 'انتقال به پایین' : 'Move Down'}
                            className="p-1 text-stone-500 hover:text-stone-900 disabled:opacity-30 cursor-pointer"
                          >
                            <ArrowDown className="w-3.5 h-3.5" />
                          </button>

                          {/* دکمه ویرایش */}
                          <button
                            type="button"
                            onClick={() => handleStartEditTechnique(t)}
                            className="px-2 py-1 text-xs bg-stone-100 hover:bg-stone-200 border border-stone-200 text-stone-800 rounded-md flex items-center gap-1 cursor-pointer font-medium"
                          >
                            <Edit3 className="w-3 h-3 text-amber-700" />
                            <span>{isFa ? 'ویرایش' : 'Edit'}</span>
                          </button>

                          {/* دکمه حذف */}
                          <button
                            type="button"
                            onClick={() => handleDeleteTechnique(t.id)}
                            className="p-1 text-red-600 hover:bg-red-50 rounded-md cursor-pointer transition-colors"
                            title={isFa ? 'حذف تکنیک' : 'Delete'}
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            )}

            {/* ============================================================== */}
            {/* تب: مدیریت مقالات سئو و وبلاگ آموزشی */}
            {/* ============================================================== */}
            {activeTab === 'articles' && (
              <div className="p-4 sm:p-6 space-y-6">
                <div className="p-5 bg-stone-50 rounded-2xl border border-stone-200 space-y-4">
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-stone-200 pb-3">
                    <div>
                      <h4 className="text-sm font-bold text-stone-900 flex items-center gap-2">
                        <FileText className="w-4 h-4 text-blue-700" />
                        <span>{isFa ? 'مدیریت و انتشار مقالات سئو و وبلاگ' : 'Articles & SEO Editorial CMS'}</span>
                        <span className="text-[11px] bg-blue-100 text-blue-800 px-2 py-0.5 rounded-full font-mono">
                          {(content.articles || []).length}
                        </span>
                      </h4>
                      <p className="text-[11px] text-stone-500 mt-0.5">
                        {isFa
                          ? 'تولید و ویرایش مقالات فنی عکاسی، راهنماهای سفر، مستندسازی و تکنیک‌ها با کلمات کلیدی سئو'
                          : 'Create, edit, and publish rich articles with SEO keywords and tags'}
                      </p>
                    </div>

                    {!editingArticleId && (
                      <button
                        type="button"
                        onClick={() => {
                          setEditingArticleId('new');
                          setArtTitleFa('');
                          setArtTitleEn('');
                          setArtSlug(`article-${Date.now()}`);
                          setArtExcerptFa('');
                          setArtExcerptEn('');
                          setArtContentFa('');
                          setArtContentEn('');
                          setArtCategoryFa('آموزش عکاسی');
                          setArtCategoryEn('Tutorial');
                          setArtCoverUrl('https://images.unsplash.com/photo-1516035069371-29a1b244cc32?auto=format&fit=crop&w=1200&q=80');
                          setArtReadTime(6);
                          setArtTags('عکاسی، آموزش، تکنیک');
                          setArtSeoKeywords('آموزش عکاسی, سینا ضرغامی, تکنیک عکاسی');
                          setArtIsPublished(true);
                          setArtFeatured(false);
                        }}
                        className="px-3.5 py-1.5 bg-blue-700 hover:bg-blue-800 text-white rounded-lg text-xs font-bold flex items-center gap-1.5 cursor-pointer shadow-xs shrink-0"
                      >
                        <Plus className="w-3.5 h-3.5" />
                        <span>{isFa ? 'افزودن مقاله جدید' : 'New Article'}</span>
                      </button>
                    )}
                  </div>

                  {/* فرم افزودن یا ویرایش مقاله */}
                  {editingArticleId && (
                    <form onSubmit={handleSaveArticle} className="p-5 bg-white rounded-xl border border-blue-300 space-y-4 animate-fade-in text-xs shadow-xs">
                      <div className="flex items-center justify-between border-b border-stone-200 pb-2.5">
                        <span className="font-bold text-stone-900 flex items-center gap-1.5">
                          <Edit3 className="w-4 h-4 text-blue-700" />
                          <span>{editingArticleId === 'new' ? (isFa ? 'نوشتن مقاله جدید' : 'Write New Article') : (isFa ? 'ویرایش مقاله' : 'Edit Article')}</span>
                        </span>
                        <button
                          type="button"
                          onClick={handleCancelEditArticle}
                          className="text-stone-500 hover:text-stone-800 text-xs cursor-pointer"
                        >
                          {isFa ? 'انصراف' : 'Cancel'}
                        </button>
                      </div>

                      {/* عنوان فارسی و انگلیسی به همراه دکمه ترجمه Gemini */}
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                        <div>
                          <div className="flex items-center justify-between mb-1">
                            <label className="font-bold text-stone-700">{isFa ? 'عنوان مقاله (فارسی):' : 'Title (FA):'}</label>
                            <button
                              type="button"
                              onClick={() => handleAiTranslate(artTitleFa, setArtTitleEn, 'artTitle', 'title', artCategoryFa)}
                              disabled={translatingField === 'artTitle' || !artTitleFa}
                              className="text-[11px] text-amber-800 font-bold flex items-center gap-1 cursor-pointer disabled:opacity-50"
                            >
                              <Wand2 className="w-3 h-3" />
                              <span>{isFa ? 'ترجمه هوشمند' : 'AI Translate'}</span>
                            </button>
                          </div>
                          <input
                            type="text"
                            required
                            value={artTitleFa}
                            onChange={(e) => setArtTitleFa(e.target.value)}
                            placeholder="مثال: هنر دیدن در کویر: راهنمای عکاسی در تپه‌های شنی لوت"
                            className="w-full px-3 py-2 border border-stone-300 rounded-lg bg-stone-50 focus:bg-white text-xs font-bold"
                          />
                        </div>

                        <div>
                          <label className="block font-bold text-stone-700 mb-1">{isFa ? 'عنوان انگلیسی (EN):' : 'Title (EN):'}</label>
                          <input
                            type="text"
                            value={artTitleEn}
                            onChange={(e) => setArtTitleEn(e.target.value)}
                            placeholder="e.g. The Art of Seeing: Desert Photography Guide in Lut Dunes"
                            className="w-full px-3 py-2 border border-stone-300 rounded-lg bg-stone-50 focus:bg-white text-xs"
                          />
                        </div>
                      </div>

                      {/* نامک اسلاگ، دسته‌بندی و زمان مطالعه */}
                      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                        <div>
                          <label className="block font-bold text-stone-700 mb-1">{isFa ? 'اسلاگ آدرس (Slug / URL):' : 'Slug / URL:'}</label>
                          <input
                            type="text"
                            value={artSlug}
                            onChange={(e) => setArtSlug(e.target.value)}
                            placeholder="desert-photography-guide"
                            className="w-full px-3 py-1.5 border border-stone-300 rounded-lg bg-white text-xs font-mono"
                          />
                        </div>

                        <div>
                          <label className="block font-bold text-stone-700 mb-1">{isFa ? 'دسته‌بندی مقاله:' : 'Category:'}</label>
                          <input
                            type="text"
                            value={artCategoryFa}
                            onChange={(e) => setArtCategoryFa(e.target.value)}
                            placeholder="آموزش عکاسی، راهنمای سفر، تجهیزات"
                            className="w-full px-3 py-1.5 border border-stone-300 rounded-lg bg-white text-xs"
                          />
                        </div>

                        <div>
                          <label className="block font-bold text-stone-700 mb-1">{isFa ? 'زمان تخمینی مطالعه (دقیقه):' : 'Read Time (min):'}</label>
                          <input
                            type="number"
                            value={artReadTime}
                            onChange={(e) => setArtReadTime(parseInt(e.target.value) || 5)}
                            className="w-full px-3 py-1.5 border border-stone-300 rounded-lg bg-white text-xs font-mono"
                          />
                        </div>
                      </div>

                      {/* آدرس عکس کاور */}
                      <div>
                        <label className="block font-bold text-stone-700 mb-1">{isFa ? 'آدرس تصویر کاور (URL):' : 'Cover Image URL:'}</label>
                        <input
                          type="url"
                          value={artCoverUrl}
                          onChange={(e) => setArtCoverUrl(e.target.value)}
                          placeholder="https://images.unsplash.com/..."
                          className="w-full px-3 py-1.5 border border-stone-300 rounded-lg bg-white text-xs font-mono"
                        />
                      </div>

                      {/* خلاصه فارسی و انگلیسی */}
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                        <div>
                          <div className="flex items-center justify-between mb-1">
                            <label className="font-bold text-stone-700">{isFa ? 'خلاصه مقاله (فارسی):' : 'Excerpt / Summary (FA):'}</label>
                            <button
                              type="button"
                              onClick={() => handleAiTranslate(artExcerptFa, setArtExcerptEn, 'artExcerpt', 'description', artCategoryFa)}
                              disabled={translatingField === 'artExcerpt' || !artExcerptFa}
                              className="text-[11px] text-amber-800 font-bold flex items-center gap-1 cursor-pointer disabled:opacity-50"
                            >
                              <Wand2 className="w-3 h-3" />
                              <span>{isFa ? 'ترجمه خلاصه' : 'Translate'}</span>
                            </button>
                          </div>
                          <textarea
                            rows={2}
                            value={artExcerptFa}
                            onChange={(e) => setArtExcerptFa(e.target.value)}
                            placeholder="خلاصه ۲ تا ۳ جمله‌ای مقاله برای پیش‌نمایش در کارت‌ها و نتایج جستجوی گوگل..."
                            className="w-full px-3 py-2 border border-stone-300 rounded-lg bg-white text-xs resize-none"
                          />
                        </div>

                        <div>
                          <label className="block font-bold text-stone-700 mb-1">{isFa ? 'Summary (English):' : 'Summary (EN):'}</label>
                          <textarea
                            rows={2}
                            value={artExcerptEn}
                            onChange={(e) => setArtExcerptEn(e.target.value)}
                            placeholder="Short 2-3 sentence summary in English..."
                            className="w-full px-3 py-2 border border-stone-300 rounded-lg bg-white text-xs resize-none"
                          />
                        </div>
                      </div>

                      {/* متن کامل مقاله */}
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                        <div>
                          <div className="flex items-center justify-between mb-1">
                            <label className="font-bold text-stone-700">{isFa ? 'متن کامل مقاله (فارسی):' : 'Full Content (FA):'}</label>
                            <VoiceDictationButton
                              onTranscript={(t) => setArtContentFa((prev) => (prev ? prev + '\n' + t : t))}
                              title={isFa ? 'دیکته صوتی متن مقاله' : 'Dictate article'}
                            />
                          </div>
                          <textarea
                            rows={6}
                            value={artContentFa}
                            onChange={(e) => setArtContentFa(e.target.value)}
                            placeholder="متن کامل مقاله آموزشی، بخش‌ها، راهکارها و تجربیات..."
                            className="w-full px-3 py-2 border border-stone-300 rounded-lg bg-white text-xs leading-relaxed"
                          />
                        </div>

                        <div>
                          <label className="block font-bold text-stone-700 mb-1">{isFa ? 'Full Content (EN):' : 'Full Content (EN):'}</label>
                          <textarea
                            rows={6}
                            value={artContentEn}
                            onChange={(e) => setArtContentEn(e.target.value)}
                            placeholder="Full English article text..."
                            className="w-full px-3 py-2 border border-stone-300 rounded-lg bg-white text-xs leading-relaxed"
                          />
                        </div>
                      </div>

                      {/* برچسب‌ها و کلمات کلیدی سئو */}
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 p-3 bg-stone-50 rounded-xl border border-stone-200">
                        <div>
                          <label className="block font-bold text-stone-700 mb-1">{isFa ? 'تگ‌ها (با ویرگول جدا کنید):' : 'Tags (comma separated):'}</label>
                          <input
                            type="text"
                            value={artTags}
                            onChange={(e) => setArtTags(e.target.value)}
                            placeholder="عکاسی طبیعت، کویر لوت، نورپردازی"
                            className="w-full px-3 py-1.5 border border-stone-300 rounded-lg bg-white text-xs"
                          />
                        </div>

                        <div>
                          <label className="block font-bold text-stone-700 mb-1">{isFa ? 'کلمات کلیدی سئو (SEO Keywords):' : 'SEO Keywords:'}</label>
                          <input
                            type="text"
                            value={artSeoKeywords}
                            onChange={(e) => setArtSeoKeywords(e.target.value)}
                            placeholder="عکاسی کویر, تنظیم دیافراگم در نور شدید, سینا ضرغامی"
                            className="w-full px-3 py-1.5 border border-stone-300 rounded-lg bg-white text-xs"
                          />
                        </div>
                      </div>

                      {/* وضعیت انتشار */}
                      <div className="flex items-center gap-4 pt-1">
                        <label className="flex items-center gap-2 cursor-pointer font-bold text-stone-800">
                          <input
                            type="checkbox"
                            checked={artIsPublished}
                            onChange={(e) => setArtIsPublished(e.target.checked)}
                            className="rounded text-blue-700 w-4 h-4 cursor-pointer"
                          />
                          <span>{isFa ? 'منتشر شده (نمایش عمومی در سایت)' : 'Published'}</span>
                        </label>

                        <label className="flex items-center gap-2 cursor-pointer font-bold text-stone-800">
                          <input
                            type="checkbox"
                            checked={artFeatured}
                            onChange={(e) => setArtFeatured(e.target.checked)}
                            className="rounded text-amber-700 w-4 h-4 cursor-pointer"
                          />
                          <span>{isFa ? 'مقاله ویژه (Featured Article)' : 'Featured Article'}</span>
                        </label>
                      </div>

                      <div className="flex gap-2 pt-2">
                        <button
                          type="submit"
                          className="flex-1 py-2.5 bg-blue-700 hover:bg-blue-800 text-white font-bold rounded-xl cursor-pointer transition-colors shadow-xs"
                        >
                          {editingArticleId === 'new' ? (isFa ? 'انتشار مقاله' : 'Publish Article') : (isFa ? 'ذخیره تغییرات مقاله' : 'Update Article')}
                        </button>
                        <button
                          type="button"
                          onClick={handleCancelEditArticle}
                          className="px-4 py-2.5 bg-stone-200 hover:bg-stone-300 text-stone-700 font-bold rounded-xl cursor-pointer"
                        >
                          {isFa ? 'انصراف' : 'Cancel'}
                        </button>
                      </div>
                    </form>
                  )}

                  {/* فهرست مقالات ثبت‌شده با امکان ویرایش، حذف و جابجایی */}
                  <div className="space-y-3">
                    <div className="text-xs font-bold text-stone-800 flex justify-between">
                      <span>{isFa ? `فهرست مقالات منتشرشده (${(content.articles || []).length} مقاله):` : 'Articles List:'}</span>
                      <span className="text-stone-400 font-normal">{isFa ? 'جابجایی ترتیب اولویت نمایش با فلش‌ها' : 'Reorder using arrows'}</span>
                    </div>

                    <div className="space-y-2 max-h-80 overflow-y-auto pr-1">
                      {(content.articles || []).map((art, idx) => (
                        <div
                          key={art.id}
                          className={`p-3 bg-white rounded-xl border transition-colors flex items-center justify-between gap-3 text-xs ${
                            editingArticleId === art.id ? 'border-blue-600 bg-blue-50/40 ring-1 ring-blue-500' : 'border-stone-200 hover:border-stone-300'
                          }`}
                        >
                          <div className="flex items-center gap-3 truncate">
                            <img
                              src={art.coverImage || art.coverUrl}
                              alt=""
                              className="w-12 h-10 object-cover rounded-md bg-stone-200 shrink-0 border border-stone-300"
                              referrerPolicy="no-referrer"
                            />
                            <div className="truncate">
                              <div className="font-bold text-stone-900 flex items-center gap-2 truncate">
                                <span className="truncate">{isFa ? art.titleFa : art.titleEn}</span>
                                {art.isPublished === false ? (
                                  <span className="text-[10px] bg-stone-200 text-stone-700 px-1.5 py-0.2 rounded font-mono shrink-0">
                                    پیش‌نویس
                                  </span>
                                ) : (
                                  <span className="text-[10px] bg-emerald-100 text-emerald-800 px-1.5 py-0.2 rounded font-mono shrink-0">
                                    منتشر شده
                                  </span>
                                )}
                                {art.featured && (
                                  <span className="text-[10px] bg-amber-100 text-amber-800 px-1.5 py-0.2 rounded font-mono shrink-0">
                                    ⭐ ویژه
                                  </span>
                                )}
                              </div>
                              <div className="text-[11px] text-stone-500 font-mono truncate mt-0.5">
                                {art.categoryFa || art.category} · {art.readTimeMinutes || 5} {isFa ? 'دقیقه' : 'min'} · slug: /{art.slug}
                              </div>
                            </div>
                          </div>

                          <div className="flex items-center gap-1.5 shrink-0">
                            {/* دکمه‌های جابجایی ترتیب */}
                            <button
                              type="button"
                              onClick={() => handleMoveArticle(idx, 'up')}
                              disabled={idx === 0}
                              title={isFa ? 'انتقال به بالا' : 'Move Up'}
                              className="p-1.5 text-stone-500 hover:text-stone-900 disabled:opacity-30 cursor-pointer"
                            >
                              <ArrowUp className="w-3.5 h-3.5" />
                            </button>
                            <button
                              type="button"
                              onClick={() => handleMoveArticle(idx, 'down')}
                              disabled={idx === (content.articles || []).length - 1}
                              title={isFa ? 'انتقال به پایین' : 'Move Down'}
                              className="p-1.5 text-stone-500 hover:text-stone-900 disabled:opacity-30 cursor-pointer"
                            >
                              <ArrowDown className="w-3.5 h-3.5" />
                            </button>

                            {/* دکمه ویرایش */}
                            <button
                              type="button"
                              onClick={() => handleStartEditArticle(art)}
                              className="px-2.5 py-1 text-xs bg-stone-100 hover:bg-stone-200 border border-stone-200 text-stone-800 rounded-md flex items-center gap-1 cursor-pointer font-medium"
                            >
                              <Edit3 className="w-3.5 h-3.5 text-blue-700" />
                              <span>{isFa ? 'ویرایش' : 'Edit'}</span>
                            </button>

                            {/* دکمه حذف */}
                            <button
                              type="button"
                              onClick={() => handleDeleteArticle(art.id)}
                              className="p-1.5 text-red-600 hover:bg-red-50 rounded-md cursor-pointer transition-colors"
                              title={isFa ? 'حذف مقاله' : 'Delete'}
                            >
                              <Trash2 className="w-3.5 h-3.5" />
                            </button>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* ============================================================== */}
            {/* تب: مدیریت صفحه درباره من، ویترین صفحه اصلی و منوهای ناوبری */}
            {/* ============================================================== */}
            {activeTab === 'about_and_home' && (
              <form onSubmit={handleSaveAboutAndLayout} className="p-4 sm:p-6 space-y-6 text-xs">
                {/* بخش اول: محتوای کامل صفحه درباره من (aboutPage) */}
                <div className="bg-stone-50 p-5 rounded-2xl border border-stone-200 space-y-4">
                  <div className="border-b border-stone-200 pb-2.5">
                    <h4 className="text-sm font-bold text-stone-900 flex items-center gap-2">
                      <UserCheck className="w-4 h-4 text-emerald-700" />
                      <span>{isFa ? 'مدیریت محتوای صفحه درباره من (/about)' : 'About Me Page Content'}</span>
                    </h4>
                    <p className="text-[11px] text-stone-500 mt-0.5">
                      {isFa
                        ? 'بیوگرافی، فلسفه بصری، تحصیلات، افتخارات و راه‌های ارتباطی در صفحه اختصاصی درباره من'
                        : 'Biography, visual philosophy, education, achievements, and social links'}
                    </p>
                  </div>

                  {/* بیوگرافی هیرو فارسی و انگلیسی */}
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    <div>
                      <label className="block font-bold text-stone-700 mb-1">{isFa ? 'بیوگرافی کوتاه هیرو (فارسی):' : 'Hero Bio (FA):'}</label>
                      <textarea
                        rows={3}
                        value={aboutPageForm.heroBioFa}
                        onChange={(e) => setAboutPageForm({ ...aboutPageForm, heroBioFa: e.target.value })}
                        className="w-full px-3 py-2 border border-stone-300 rounded-lg bg-white"
                      />
                    </div>
                    <div>
                      <label className="block font-bold text-stone-700 mb-1">{isFa ? 'Hero Bio (EN):' : 'Hero Bio (EN):'}</label>
                      <textarea
                        rows={3}
                        value={aboutPageForm.heroBioEn}
                        onChange={(e) => setAboutPageForm({ ...aboutPageForm, heroBioEn: e.target.value })}
                        className="w-full px-3 py-2 border border-stone-300 rounded-lg bg-white"
                      />
                    </div>
                  </div>

                  {/* بیوگرافی جامع و تفصیلی */}
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    <div>
                      <label className="block font-bold text-stone-700 mb-1">{isFa ? 'روایت تفصیلی زندگی و مسیر هنری (فارسی):' : 'Detailed Narrative (FA):'}</label>
                      <textarea
                        rows={5}
                        value={aboutPageForm.detailedBioFa}
                        onChange={(e) => setAboutPageForm({ ...aboutPageForm, detailedBioFa: e.target.value })}
                        className="w-full px-3 py-2 border border-stone-300 rounded-lg bg-white leading-relaxed"
                      />
                    </div>
                    <div>
                      <label className="block font-bold text-stone-700 mb-1">{isFa ? 'Detailed Narrative (EN):' : 'Detailed Narrative (EN):'}</label>
                      <textarea
                        rows={5}
                        value={aboutPageForm.detailedBioEn}
                        onChange={(e) => setAboutPageForm({ ...aboutPageForm, detailedBioEn: e.target.value })}
                        className="w-full px-3 py-2 border border-stone-300 rounded-lg bg-white leading-relaxed"
                      />
                    </div>
                  </div>

                  {/* فلسفه بصری */}
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    <div>
                      <label className="block font-bold text-stone-700 mb-1">{isFa ? 'مانیفست و فلسفه بصری (فارسی):' : 'Visual Philosophy (FA):'}</label>
                      <textarea
                        rows={3}
                        value={aboutPageForm.philosophyFa || ''}
                        onChange={(e) => setAboutPageForm({ ...aboutPageForm, philosophyFa: e.target.value })}
                        className="w-full px-3 py-2 border border-stone-300 rounded-lg bg-white"
                      />
                    </div>
                    <div>
                      <label className="block font-bold text-stone-700 mb-1">{isFa ? 'Visual Philosophy (EN):' : 'Visual Philosophy (EN):'}</label>
                      <textarea
                        rows={3}
                        value={aboutPageForm.philosophyEn || ''}
                        onChange={(e) => setAboutPageForm({ ...aboutPageForm, philosophyEn: e.target.value })}
                        className="w-full px-3 py-2 border border-stone-300 rounded-lg bg-white"
                      />
                    </div>
                  </div>

                  {/* تحصیلات و مهارت‌ها */}
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    <div>
                      <label className="block font-bold text-stone-700 mb-1">{isFa ? 'تحصیلات و مدارک (هر خط یک مورد):' : 'Education (one per line):'}</label>
                      <textarea
                        rows={3}
                        value={aboutEduFaText}
                        onChange={(e) => setAboutEduFaText(e.target.value)}
                        placeholder="کارشناسی مهندسی نرم‌افزار&#10;دوره بین‌المللی مستندسازی حیات‌وحش"
                        className="w-full px-3 py-2 border border-stone-300 rounded-lg bg-white"
                      />
                    </div>
                    <div>
                      <label className="block font-bold text-stone-700 mb-1">{isFa ? 'تخصص‌های کلیدی (با ویرگول جدا کنید):' : 'Specialties (comma-separated):'}</label>
                      <textarea
                        rows={3}
                        value={aboutSpecFaText}
                        onChange={(e) => setAboutSpecFaText(e.target.value)}
                        placeholder="عکاسی نجومی, تصویربرداری هوایی با پهپاد, کالر گریدینگ سینمایی"
                        className="w-full px-3 py-2 border border-stone-300 rounded-lg bg-white"
                      />
                    </div>
                  </div>

                  {/* تصاویر آواتار و شبکه‌های اجتماعی اختصاصی */}
                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                    <div>
                      <label className="block font-bold text-stone-700 mb-1">{isFa ? 'عکس پرتره آواتار (URL):' : 'Avatar Photo URL:'}</label>
                      <input
                        type="url"
                        value={aboutPageForm.avatarUrl}
                        onChange={(e) => setAboutPageForm({ ...aboutPageForm, avatarUrl: e.target.value })}
                        className="w-full px-3 py-1.5 border border-stone-300 rounded-lg bg-white font-mono text-xs"
                      />
                    </div>
                    <div>
                      <label className="block font-bold text-stone-700 mb-1">{isFa ? 'کانال آپارات (Aparat URL):' : 'Aparat URL:'}</label>
                      <input
                        type="url"
                        value={aboutPageForm.aparatUrl || ''}
                        onChange={(e) => setAboutPageForm({ ...aboutPageForm, aparatUrl: e.target.value })}
                        placeholder="https://www.aparat.com/sinazarghami"
                        className="w-full px-3 py-1.5 border border-stone-300 rounded-lg bg-white font-mono text-xs"
                      />
                    </div>
                    <div>
                      <label className="block font-bold text-stone-700 mb-1">{isFa ? 'کانال یوتیوب (YouTube URL):' : 'YouTube URL:'}</label>
                      <input
                        type="url"
                        value={aboutPageForm.youtubeUrl || ''}
                        onChange={(e) => setAboutPageForm({ ...aboutPageForm, youtubeUrl: e.target.value })}
                        placeholder="https://www.youtube.com/@sina.zarghami"
                        className="w-full px-3 py-1.5 border border-stone-300 rounded-lg bg-white font-mono text-xs"
                      />
                    </div>
                  </div>
                </div>

                {/* بخش دوم: تنظیمات ویترین صفحه اصلی (homeShowcaseConfig) */}
                <div className="bg-stone-50 p-5 rounded-2xl border border-stone-200 space-y-4">
                  <div className="border-b border-stone-200 pb-2.5">
                    <h4 className="text-sm font-bold text-stone-900 flex items-center gap-2">
                      <Sliders className="w-4 h-4 text-amber-700" />
                      <span>{isFa ? 'تنظیمات ویترین و کارت‌های صفحه اصلی (Home Showcase)' : 'Home Showcase Configuration'}</span>
                    </h4>
                    <p className="text-[11px] text-stone-500 mt-0.5">
                      {isFa ? 'عناوین و سرتیترهای بخش نمونه‌کارها و سفرهای برگزیده در صفحه اصلی' : 'Headlines & display limits on home page'}
                    </p>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    <div>
                      <label className="block font-bold text-stone-700 mb-1">{isFa ? 'تیتر بخش آثار منتخب (فارسی):' : 'Showcase Title (FA):'}</label>
                      <input
                        type="text"
                        value={homeShowcaseForm.titleFa}
                        onChange={(e) => setHomeShowcaseForm({ ...homeShowcaseForm, titleFa: e.target.value })}
                        className="w-full px-3 py-2 border border-stone-300 rounded-lg bg-white"
                      />
                    </div>
                    <div>
                      <label className="block font-bold text-stone-700 mb-1">{isFa ? 'Showcase Title (EN):' : 'Showcase Title (EN):'}</label>
                      <input
                        type="text"
                        value={homeShowcaseForm.titleEn}
                        onChange={(e) => setHomeShowcaseForm({ ...homeShowcaseForm, titleEn: e.target.value })}
                        className="w-full px-3 py-2 border border-stone-300 rounded-lg bg-white"
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    <div>
                      <label className="block font-bold text-stone-700 mb-1">{isFa ? 'زیرعنوان بخش آثار منتخب (فارسی):' : 'Showcase Subtitle (FA):'}</label>
                      <input
                        type="text"
                        value={homeShowcaseForm.subtitleFa}
                        onChange={(e) => setHomeShowcaseForm({ ...homeShowcaseForm, subtitleFa: e.target.value })}
                        className="w-full px-3 py-2 border border-stone-300 rounded-lg bg-white"
                      />
                    </div>
                    <div>
                      <label className="block font-bold text-stone-700 mb-1">{isFa ? 'Showcase Subtitle (EN):' : 'Showcase Subtitle (EN):'}</label>
                      <input
                        type="text"
                        value={homeShowcaseForm.subtitleEn}
                        onChange={(e) => setHomeShowcaseForm({ ...homeShowcaseForm, subtitleEn: e.target.value })}
                        className="w-full px-3 py-2 border border-stone-300 rounded-lg bg-white"
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    <div>
                      <label className="block font-bold text-stone-700 mb-1">{isFa ? 'حداکثر عکس‌های برگزیده در صفحه اصلی:' : 'Max Home Photos:'}</label>
                      <input
                        type="number"
                        value={homeShowcaseForm.maxHomePhotos || 8}
                        onChange={(e) => setHomeShowcaseForm({ ...homeShowcaseForm, maxHomePhotos: parseInt(e.target.value) || 8 })}
                        className="w-full px-3 py-2 border border-stone-300 rounded-lg bg-white font-mono"
                      />
                    </div>
                    <div>
                      <label className="block font-bold text-stone-700 mb-1">{isFa ? 'حداکثر سفرهای برگزیده در صفحه اصلی:' : 'Max Home Trips:'}</label>
                      <input
                        type="number"
                        value={homeShowcaseForm.maxHomeTrips || 4}
                        onChange={(e) => setHomeShowcaseForm({ ...homeShowcaseForm, maxHomeTrips: parseInt(e.target.value) || 4 })}
                        className="w-full px-3 py-2 border border-stone-300 rounded-lg bg-white font-mono"
                      />
                    </div>
                  </div>
                </div>

                {/* بخش سوم: عناوین منوی اصلی وب‌سایت (navLabels) */}
                <div className="bg-stone-50 p-5 rounded-2xl border border-stone-200 space-y-4">
                  <div className="border-b border-stone-200 pb-2.5">
                    <h4 className="text-sm font-bold text-stone-900 flex items-center gap-2">
                      <Type className="w-4 h-4 text-indigo-700" />
                      <span>{isFa ? 'عناوین داینامیک منوی اصلی وب‌سایت (Navigation Labels)' : 'Menu & Navigation Labels'}</span>
                    </h4>
                    <p className="text-[11px] text-stone-500 mt-0.5">
                      {isFa ? 'امکان تغییر کامل نام منوها به فارسی و انگلیسی بدون نیاز به دست زدن به کدها' : 'Customize navbar menu labels in FA and EN'}
                    </p>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
                    {/* Home */}
                    <div className="p-3 bg-white rounded-lg border border-stone-200 space-y-1.5">
                      <span className="font-bold text-stone-800 text-[11px]">۱. صفحه اصلی (/)</span>
                      <input
                        type="text"
                        value={navLabelsForm.homeFa || ''}
                        onChange={(e) => setNavLabelsForm({ ...navLabelsForm, homeFa: e.target.value })}
                        placeholder="فارسی: صفحه اصلی"
                        className="w-full px-2 py-1 border border-stone-300 rounded text-xs"
                      />
                      <input
                        type="text"
                        value={navLabelsForm.homeEn || ''}
                        onChange={(e) => setNavLabelsForm({ ...navLabelsForm, homeEn: e.target.value })}
                        placeholder="English: Home"
                        className="w-full px-2 py-1 border border-stone-300 rounded text-xs font-mono"
                      />
                    </div>

                    {/* Portfolio */}
                    <div className="p-3 bg-white rounded-lg border border-stone-200 space-y-1.5">
                      <span className="font-bold text-stone-800 text-[11px]">۲. نمونه‌کارها (/portfolio)</span>
                      <input
                        type="text"
                        value={navLabelsForm.portfolioFa || ''}
                        onChange={(e) => setNavLabelsForm({ ...navLabelsForm, portfolioFa: e.target.value })}
                        placeholder="فارسی: نمونه‌کارها"
                        className="w-full px-2 py-1 border border-stone-300 rounded text-xs"
                      />
                      <input
                        type="text"
                        value={navLabelsForm.portfolioEn || ''}
                        onChange={(e) => setNavLabelsForm({ ...navLabelsForm, portfolioEn: e.target.value })}
                        placeholder="English: Portfolio"
                        className="w-full px-2 py-1 border border-stone-300 rounded text-xs font-mono"
                      />
                    </div>

                    {/* Trips */}
                    <div className="p-3 bg-white rounded-lg border border-stone-200 space-y-1.5">
                      <span className="font-bold text-stone-800 text-[11px]">۳. سفر و تورها (/trips)</span>
                      <input
                        type="text"
                        value={navLabelsForm.tripsFa || ''}
                        onChange={(e) => setNavLabelsForm({ ...navLabelsForm, tripsFa: e.target.value })}
                        placeholder="فارسی: سفر و تورها"
                        className="w-full px-2 py-1 border border-stone-300 rounded text-xs"
                      />
                      <input
                        type="text"
                        value={navLabelsForm.tripsEn || ''}
                        onChange={(e) => setNavLabelsForm({ ...navLabelsForm, tripsEn: e.target.value })}
                        placeholder="English: Trips & Tours"
                        className="w-full px-2 py-1 border border-stone-300 rounded text-xs font-mono"
                      />
                    </div>

                    {/* Gear */}
                    <div className="p-3 bg-white rounded-lg border border-stone-200 space-y-1.5">
                      <span className="font-bold text-stone-800 text-[11px]">۴. تجهیزات (/gear)</span>
                      <input
                        type="text"
                        value={navLabelsForm.gearFa || ''}
                        onChange={(e) => setNavLabelsForm({ ...navLabelsForm, gearFa: e.target.value })}
                        placeholder="فارسی: تجهیزات"
                        className="w-full px-2 py-1 border border-stone-300 rounded text-xs"
                      />
                      <input
                        type="text"
                        value={navLabelsForm.gearEn || ''}
                        onChange={(e) => setNavLabelsForm({ ...navLabelsForm, gearEn: e.target.value })}
                        placeholder="English: Gear"
                        className="w-full px-2 py-1 border border-stone-300 rounded text-xs font-mono"
                      />
                    </div>

                    {/* Articles */}
                    <div className="p-3 bg-white rounded-lg border border-stone-200 space-y-1.5">
                      <span className="font-bold text-stone-800 text-[11px]">۵. مقالات (/articles)</span>
                      <input
                        type="text"
                        value={navLabelsForm.articlesFa || ''}
                        onChange={(e) => setNavLabelsForm({ ...navLabelsForm, articlesFa: e.target.value })}
                        placeholder="فارسی: مقالات"
                        className="w-full px-2 py-1 border border-stone-300 rounded text-xs"
                      />
                      <input
                        type="text"
                        value={navLabelsForm.articlesEn || ''}
                        onChange={(e) => setNavLabelsForm({ ...navLabelsForm, articlesEn: e.target.value })}
                        placeholder="English: Articles"
                        className="w-full px-2 py-1 border border-stone-300 rounded text-xs font-mono"
                      />
                    </div>

                    {/* Resume */}
                    <div className="p-3 bg-white rounded-lg border border-stone-200 space-y-1.5">
                      <span className="font-bold text-stone-800 text-[11px]">۶. رزومه (/resume)</span>
                      <input
                        type="text"
                        value={navLabelsForm.resumeFa || ''}
                        onChange={(e) => setNavLabelsForm({ ...navLabelsForm, resumeFa: e.target.value })}
                        placeholder="فارسی: رزومه"
                        className="w-full px-2 py-1 border border-stone-300 rounded text-xs"
                      />
                      <input
                        type="text"
                        value={navLabelsForm.resumeEn || ''}
                        onChange={(e) => setNavLabelsForm({ ...navLabelsForm, resumeEn: e.target.value })}
                        placeholder="English: Resume"
                        className="w-full px-2 py-1 border border-stone-300 rounded text-xs font-mono"
                      />
                    </div>

                    {/* About */}
                    <div className="p-3 bg-white rounded-lg border border-stone-200 space-y-1.5">
                      <span className="font-bold text-stone-800 text-[11px]">۷. درباره من (/about)</span>
                      <input
                        type="text"
                        value={navLabelsForm.aboutFa || ''}
                        onChange={(e) => setNavLabelsForm({ ...navLabelsForm, aboutFa: e.target.value })}
                        placeholder="فارسی: درباره من"
                        className="w-full px-2 py-1 border border-stone-300 rounded text-xs"
                      />
                      <input
                        type="text"
                        value={navLabelsForm.aboutEn || ''}
                        onChange={(e) => setNavLabelsForm({ ...navLabelsForm, aboutEn: e.target.value })}
                        placeholder="English: About"
                        className="w-full px-2 py-1 border border-stone-300 rounded text-xs font-mono"
                      />
                    </div>

                    {/* Order CTA */}
                    <div className="p-3 bg-amber-50 rounded-lg border border-amber-300 space-y-1.5">
                      <span className="font-bold text-amber-900 text-[11px]">۸. دکمه سفارش پروژه</span>
                      <input
                        type="text"
                        value={navLabelsForm.orderFa || ''}
                        onChange={(e) => setNavLabelsForm({ ...navLabelsForm, orderFa: e.target.value })}
                        placeholder="فارسی: ثبت سفارش پروژه"
                        className="w-full px-2 py-1 border border-amber-300 rounded text-xs"
                      />
                      <input
                        type="text"
                        value={navLabelsForm.orderEn || ''}
                        onChange={(e) => setNavLabelsForm({ ...navLabelsForm, orderEn: e.target.value })}
                        placeholder="English: Hire Me"
                        className="w-full px-2 py-1 border border-amber-300 rounded text-xs font-mono"
                      />
                    </div>
                  </div>
                </div>

                {/* دکمه ذخیره سراسری تنظیمات درباره من و چیدمان */}
                <div className="pt-2">
                  <button
                    type="submit"
                    className="w-full py-3 bg-emerald-700 hover:bg-emerald-800 text-white font-bold rounded-xl transition-colors cursor-pointer flex items-center justify-center gap-2 shadow-sm text-sm"
                  >
                    <Check className="w-4 h-4" />
                    <span>{isFa ? 'ذخیره تنظیمات صفحه درباره من، ویترین اصلی و عناوین منو' : 'Save About, Showcase & Menu Settings'}</span>
                  </button>
                </div>
              </form>
            )}

            {/* ============================================================== */}
            {/* تب ۲: مدیریت پلتفرم‌ها، ابزارها و وب‌سایت‌های ساخته‌شده */}
            {/* ============================================================== */}
            {activeTab === 'software' && (
              <div className="p-4 sm:p-6 space-y-6">
                <div className="p-5 bg-stone-50 rounded-2xl border border-stone-200 space-y-4">
                  <div className="flex items-center justify-between">
                    <h4 className="text-sm font-bold text-stone-900 flex items-center gap-2">
                      <Code2 className="w-4 h-4 text-amber-700" />
                      <span>{editingSoftId ? (isFa ? 'ویرایش پروژه نرم‌افزاری' : 'Edit Software') : (isFa ? 'افزودن پلتفرم، ابزار یا وب‌سایت جدید' : 'Add New Project')}</span>
                    </h4>
                    {editingSoftId && (
                      <button
                        onClick={handleCancelEditSoftware}
                        className="text-stone-500 hover:text-stone-800 text-xs underline cursor-pointer"
                      >
                        {isFa ? 'انصراف' : 'Cancel'}
                      </button>
                    )}
                  </div>

                  <form onSubmit={handleSaveSoftware} className="space-y-3 text-xs">
                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                      <div>
                        <label className="block font-bold text-stone-700 mb-1">{isFa ? 'نام پلتفرم / ابزار:' : 'Title:'}</label>
                        <input
                          type="text"
                          required
                          value={softTitle}
                          onChange={(e) => setSoftTitle(e.target.value)}
                          placeholder="مثال: FrameFlow Pro"
                          className="w-full px-3 py-2 border border-stone-300 rounded-lg bg-white"
                        />
                      </div>

                      <div>
                        <div className="flex items-center justify-between mb-1">
                          <label className="font-bold text-stone-700">{isFa ? 'شعار کوتاه فارسی:' : 'Tagline (FA):'}</label>
                          <button
                            type="button"
                            onClick={() => handleAiTranslate(softTaglineFa, setSoftTaglineEn, 'softTagline', 'tagline', 'software')}
                            disabled={translatingField === 'softTagline' || !softTaglineFa}
                            className="text-[11px] text-amber-800 font-bold flex items-center gap-1 cursor-pointer disabled:opacity-50"
                          >
                            <Wand2 className="w-3 h-3" />
                            <span>AI</span>
                          </button>
                        </div>
                        <input
                          type="text"
                          value={softTaglineFa}
                          onChange={(e) => setSoftTaglineFa(e.target.value)}
                          placeholder="دستیار هوشمند مدیریت راش‌های سینمایی"
                          className="w-full px-3 py-2 border border-stone-300 rounded-lg bg-white"
                        />
                      </div>

                      <div>
                        <label className="block font-bold text-stone-700 mb-1">{isFa ? 'شعار انگلیسی (Editorial):' : 'Tagline (EN):'}</label>
                        <input
                          type="text"
                          value={softTaglineEn}
                          onChange={(e) => setSoftTaglineEn(e.target.value)}
                          placeholder="Intelligent Cinema Dailies Platform"
                          className="w-full px-3 py-2 border border-stone-300 rounded-lg bg-white"
                        />
                      </div>
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                      <div>
                        <div className="flex items-center justify-between mb-1">
                          <label className="font-bold text-stone-700">{isFa ? 'توضیحات فارسی پروژه:' : 'Description (FA):'}</label>
                          <button
                            type="button"
                            onClick={() => handleAiTranslate(softDescFa, setSoftDescEn, 'softDesc', 'description', 'software')}
                            disabled={translatingField === 'softDesc' || !softDescFa}
                            className="text-[11px] text-amber-800 font-bold flex items-center gap-1 cursor-pointer disabled:opacity-50"
                          >
                            <Wand2 className="w-3 h-3" />
                            <span>{translatingField === 'softDesc' ? (isFa ? 'در حال ترجمه...' : 'Translating...') : (isFa ? 'ترجمه توضیحات با AI' : 'AI Translate')}</span>
                          </button>
                        </div>
                        <textarea
                          rows={2}
                          value={softDescFa}
                          onChange={(e) => setSoftDescFa(e.target.value)}
                          placeholder="کارکرد، اهداف، ارزش افزوده و معماری سیستم..."
                          className="w-full px-3 py-2 border border-stone-300 rounded-lg bg-white resize-none"
                        />
                      </div>

                      <div>
                        <label className="block font-bold text-stone-700 mb-1">{isFa ? 'توضیحات انگلیسی پروژه:' : 'Description (EN):'}</label>
                        <textarea
                          rows={2}
                          value={softDescEn}
                          onChange={(e) => setSoftDescEn(e.target.value)}
                          placeholder="High-end software narrative in English..."
                          className="w-full px-3 py-2 border border-stone-300 rounded-lg bg-white resize-none"
                        />
                      </div>
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-4 gap-3">
                      <div>
                        <label className="block font-bold text-stone-700 mb-1">{isFa ? 'فناوری‌ها (با کاما جدا کنید):' : 'Tech Stack:'}</label>
                        <input
                          type="text"
                          value={softTech}
                          onChange={(e) => setSoftTech(e.target.value)}
                          placeholder="React, TypeScript, Tailwind"
                          className="w-full px-3 py-2 border border-stone-300 rounded-lg bg-white"
                        />
                      </div>

                      <div>
                        <label className="block font-bold text-stone-700 mb-1">{isFa ? 'نوع محصول:' : 'Category:'}</label>
                        <select
                          value={softCategory}
                          onChange={(e) => setSoftCategory(e.target.value as any)}
                          className="w-full px-3 py-2 border border-stone-300 rounded-lg bg-white"
                        >
                          <option value="web-app">{isFa ? 'وب‌اپلیکیشن (Web App)' : 'Web App'}</option>
                          <option value="tool">{isFa ? 'ابزار تخصصی (Tool)' : 'Tool'}</option>
                          <option value="creative-tech">{isFa ? 'فناوری خلاق (Creative Tech)' : 'Creative Tech'}</option>
                        </select>
                      </div>

                      <div>
                        <label className="block font-bold text-stone-700 mb-1">{isFa ? 'آدرس زنده پروژه (URL):' : 'Live URL:'}</label>
                        <input
                          type="url"
                          value={softLiveUrl}
                          onChange={(e) => setSoftLiveUrl(e.target.value)}
                          placeholder="https://..."
                          className="w-full px-3 py-2 border border-stone-300 rounded-lg bg-white"
                        />
                      </div>

                      <div>
                        <label className="block font-bold text-stone-700 mb-1">{isFa ? 'لینک مخزن گیت‌هاب:' : 'GitHub URL:'}</label>
                        <input
                          type="url"
                          value={softGithubUrl}
                          onChange={(e) => setSoftGithubUrl(e.target.value)}
                          placeholder="https://github.com/..."
                          className="w-full px-3 py-2 border border-stone-300 rounded-lg bg-white"
                        />
                      </div>
                    </div>

                    <div className="flex gap-2 pt-1">
                      <button
                        type="submit"
                        className="flex-1 py-2.5 bg-stone-900 hover:bg-stone-800 text-white font-bold rounded-xl cursor-pointer transition-colors"
                      >
                        {editingSoftId ? (isFa ? 'ذخیره تغییرات پروژه' : 'Update Project') : (isFa ? 'ثبت و انتشار پروژه در سایت' : 'Add Project')}
                      </button>
                      {editingSoftId && (
                        <button
                          type="button"
                          onClick={handleCancelEditSoftware}
                          className="px-4 py-2.5 bg-stone-200 hover:bg-stone-300 text-stone-800 font-bold rounded-xl cursor-pointer"
                        >
                          {isFa ? 'انصراف' : 'Cancel'}
                        </button>
                      )}
                    </div>
                  </form>
                </div>

                {/* فهرست پروژه‌ها با امکان ویرایش، حذف و جابجایی */}
                <div className="space-y-3">
                  <div className="text-xs font-bold text-stone-800 flex justify-between">
                    <span>{isFa ? `پروژه‌های نرم‌افزاری فعال (${content.software.length} مورد):` : 'Active Projects:'}</span>
                    <span className="text-stone-400 font-normal">{isFa ? 'امکان حذف کامل، ویرایش یا تغییر اولویت' : 'Full edit/delete control'}</span>
                  </div>

                  <div className="space-y-2 max-h-72 overflow-y-auto">
                    {content.software.map((s, idx) => (
                      <div
                        key={s.id}
                        className={`p-3 bg-stone-50 hover:bg-stone-100/80 rounded-xl border transition-colors flex items-center justify-between text-xs ${
                          editingSoftId === s.id ? 'border-amber-600 bg-amber-50/40 ring-1 ring-amber-500' : 'border-stone-200'
                        }`}
                      >
                        <div className="truncate pr-2">
                          <div className="font-bold text-stone-900 flex items-center gap-2">
                            <span>{s.title}</span>
                            <span className="text-[10px] bg-stone-200 text-stone-700 px-1.5 py-0.5 rounded font-mono">
                              {s.category}
                            </span>
                          </div>
                          <div className="text-[11px] text-stone-500 truncate">{s.taglineFa}</div>
                          <div className="text-[10px] text-stone-400 font-mono mt-0.5">
                            {s.techStack.join(' · ')}
                          </div>
                        </div>

                        <div className="flex items-center gap-1.5 shrink-0">
                          <button
                            onClick={() => handleMoveSoftware(idx, 'up')}
                            disabled={idx === 0}
                            className="p-1.5 text-stone-500 hover:text-stone-900 disabled:opacity-30 cursor-pointer"
                          >
                            <ArrowUp className="w-3.5 h-3.5" />
                          </button>
                          <button
                            onClick={() => handleMoveSoftware(idx, 'down')}
                            disabled={idx === content.software.length - 1}
                            className="p-1.5 text-stone-500 hover:text-stone-900 disabled:opacity-30 cursor-pointer"
                          >
                            <ArrowDown className="w-3.5 h-3.5" />
                          </button>

                          <button
                            onClick={() => handleStartEditSoftware(s)}
                            className="px-2.5 py-1 text-xs bg-white hover:bg-stone-200 border border-stone-300 text-stone-800 rounded-md flex items-center gap-1 cursor-pointer font-medium"
                          >
                            <Edit3 className="w-3.5 h-3.5 text-amber-700" />
                            <span>{isFa ? 'ویرایش' : 'Edit'}</span>
                          </button>

                          <button
                            onClick={() => handleDeleteSoftware(s.id)}
                            className="p-1.5 text-red-600 hover:bg-red-50 rounded-md cursor-pointer transition-colors"
                            title={isFa ? 'حذف این پروژه' : 'Delete'}
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            )}

            {/* ============================================================== */}
            {/* تب ۳: مدیریت سفرها و تورها (Expeditions) */}
            {/* ============================================================== */}
            {activeTab === 'expeditions' && (
              <div className="p-4 sm:p-6 space-y-6">
                <div className="p-5 bg-stone-50 rounded-2xl border border-stone-200 space-y-4">
                  <div className="flex items-center justify-between">
                    <h4 className="text-sm font-bold text-stone-900 flex items-center gap-2">
                      <Compass className="w-4 h-4 text-amber-700" />
                      <span>{editingExpId ? (isFa ? 'ویرایش سفر انتخابی' : 'Edit Expedition') : (isFa ? 'افزودن تور یا سفر اکتشافی جدید' : 'Add New Expedition')}</span>
                    </h4>
                    {editingExpId && (
                      <button
                        onClick={handleCancelEditExpedition}
                        className="text-stone-500 hover:text-stone-800 text-xs underline cursor-pointer"
                      >
                        {isFa ? 'انصراف' : 'Cancel'}
                      </button>
                    )}
                  </div>

                  <form onSubmit={handleSaveExpedition} className="space-y-3 text-xs">
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                      <div>
                        <div className="flex items-center justify-between mb-1">
                          <label className="font-bold text-stone-700">{isFa ? 'عنوان سفر (فارسی):' : 'Title (FA):'}</label>
                          <button
                            type="button"
                            onClick={() => handleAiTranslate(expTitleFa, setExpTitleEn, 'expTitle', 'title', 'expedition')}
                            disabled={translatingField === 'expTitle' || !expTitleFa}
                            className="text-[11px] text-amber-800 font-bold flex items-center gap-1 cursor-pointer disabled:opacity-50"
                          >
                            <Wand2 className="w-3 h-3" />
                            <span>AI</span>
                          </button>
                        </div>
                        <input
                          type="text"
                          required
                          value={expTitleFa}
                          onChange={(e) => setExpTitleFa(e.target.value)}
                          placeholder="مثال: پیمایش عمیق ریگ یلان و کویر لوت"
                          className="w-full px-3 py-2 border border-stone-300 rounded-lg bg-white"
                        />
                      </div>

                      <div>
                        <label className="block font-bold text-stone-700 mb-1">{isFa ? 'عنوان انگلیسی سفر:' : 'Title (EN):'}</label>
                        <input
                          type="text"
                          value={expTitleEn}
                          onChange={(e) => setExpTitleEn(e.target.value)}
                          placeholder="e.g. Rig Yalan Deep Megadune Expedition"
                          className="w-full px-3 py-2 border border-stone-300 rounded-lg bg-white"
                        />
                      </div>
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-4 gap-3">
                      <div>
                        <label className="block font-bold text-stone-700 mb-1">{isFa ? 'مقصد (فارسی):' : 'Location (FA):'}</label>
                        <input
                          type="text"
                          value={expLocationFa}
                          onChange={(e) => setExpLocationFa(e.target.value)}
                          placeholder="مثال: شهداد و ریگ یلان"
                          className="w-full px-3 py-2 border border-stone-300 rounded-lg bg-white"
                        />
                      </div>

                      <div>
                        <label className="block font-bold text-stone-700 mb-1">{isFa ? 'مدت زمان:' : 'Duration:'}</label>
                        <input
                          type="text"
                          value={expDurationFa}
                          onChange={(e) => setExpDurationFa(e.target.value)}
                          placeholder="۴ روز و ۳ شب"
                          className="w-full px-3 py-2 border border-stone-300 rounded-lg bg-white"
                        />
                      </div>

                      <div>
                        <label className="block font-bold text-stone-700 mb-1">{isFa ? 'فصل مناسب:' : 'Season:'}</label>
                        <input
                          type="text"
                          value={expSeasonFa}
                          onChange={(e) => setExpSeasonFa(e.target.value)}
                          placeholder="پاییز و زمستان"
                          className="w-full px-3 py-2 border border-stone-300 rounded-lg bg-white"
                        />
                      </div>

                      <div>
                        <label className="block font-bold text-stone-700 mb-1">{isFa ? 'درجه سختی:' : 'Difficulty:'}</label>
                        <select
                          value={expDifficultyFa}
                          onChange={(e) => setExpDifficultyFa(e.target.value)}
                          className="w-full px-3 py-2 border border-stone-300 rounded-lg bg-white"
                        >
                          <option value="آسان">{isFa ? 'آسان (Easy)' : 'Easy'}</option>
                          <option value="متوسط">{isFa ? 'متوسط (Moderate)' : 'Moderate'}</option>
                          <option value="سخت و اکتشافی">{isFa ? 'سخت و ماجراجویانه (Challenging)' : 'Challenging'}</option>
                        </select>
                      </div>
                    </div>

                    <div>
                      <label className="block font-bold text-stone-700 mb-1">{isFa ? 'آدرس کاور تصویر سفر (URL یا لینک درایو):' : 'Cover Image URL:'}</label>
                      <input
                        type="url"
                        value={expImage}
                        onChange={(e) => setExpImage(e.target.value)}
                        placeholder="https://..."
                        className="w-full px-3 py-2 border border-stone-300 rounded-lg bg-white"
                      />
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                      <div>
                        <div className="flex items-center justify-between mb-1">
                          <label className="font-bold text-stone-700">{isFa ? 'شرح برنامه و مسترکلاس (فارسی):' : 'Description (FA):'}</label>
                          <button
                            type="button"
                            onClick={() => handleAiTranslate(expDescFa, setExpDescEn, 'expDesc', 'description', 'expedition')}
                            disabled={translatingField === 'expDesc' || !expDescFa}
                            className="text-[11px] text-amber-800 font-bold flex items-center gap-1 cursor-pointer disabled:opacity-50"
                          >
                            <Wand2 className="w-3 h-3" />
                            <span>AI Translate</span>
                          </button>
                        </div>
                        <textarea
                          rows={2}
                          value={expDescFa}
                          onChange={(e) => setExpDescFa(e.target.value)}
                          className="w-full px-3 py-2 border border-stone-300 rounded-lg bg-white resize-none"
                        />
                      </div>

                      <div>
                        <label className="block font-bold text-stone-700 mb-1">{isFa ? 'شرح به انگلیسی (Monograph Style):' : 'Description (EN):'}</label>
                        <textarea
                          rows={2}
                          value={expDescEn}
                          onChange={(e) => setExpDescEn(e.target.value)}
                          className="w-full px-3 py-2 border border-stone-300 rounded-lg bg-white resize-none"
                        />
                      </div>
                    </div>

                    <div className="flex items-center justify-between pt-1">
                      <label className="flex items-center gap-2 cursor-pointer font-bold text-stone-800">
                        <input
                          type="checkbox"
                          checked={expBookingOpen}
                          onChange={(e) => setExpBookingOpen(e.target.checked)}
                          className="rounded text-amber-700"
                        />
                        <span>{isFa ? 'ثبت‌نام این سفر باز است' : 'Booking Open'}</span>
                      </label>

                      <div className="flex gap-2">
                        {editingExpId && (
                          <button
                            type="button"
                            onClick={handleCancelEditExpedition}
                            className="px-4 py-2 bg-stone-200 hover:bg-stone-300 text-stone-800 font-bold rounded-lg cursor-pointer"
                          >
                            {isFa ? 'انصراف' : 'Cancel'}
                          </button>
                        )}
                        <button
                          type="submit"
                          className="px-5 py-2 bg-stone-900 hover:bg-stone-800 text-white font-bold rounded-lg cursor-pointer transition-colors"
                        >
                          {editingExpId ? (isFa ? 'ذخیره تغییرات سفر' : 'Update Expedition') : (isFa ? 'ثبت و انتشار سفر' : 'Add Expedition')}
                        </button>
                      </div>
                    </div>
                  </form>
                </div>

                <div className="space-y-3">
                  <div className="text-xs font-bold text-stone-800 flex justify-between">
                    <span>{isFa ? `سفرهای فعال (${content.expeditions.length} تور):` : 'Active Expeditions:'}</span>
                    <span className="text-stone-400 font-normal">{isFa ? 'امکان ویرایش و حذف کامل' : 'Full edit/delete control'}</span>
                  </div>

                  <div className="space-y-2 max-h-72 overflow-y-auto">
                    {content.expeditions.map((ex, idx) => (
                      <div
                        key={ex.id}
                        className={`p-3 bg-stone-50 hover:bg-stone-100/80 rounded-xl border transition-colors flex items-center justify-between text-xs ${
                          editingExpId === ex.id ? 'border-amber-600 bg-amber-50/40 ring-1 ring-amber-500' : 'border-stone-200'
                        }`}
                      >
                        <div className="flex items-center gap-3 truncate">
                          <img
                            src={ex.coverImage}
                            alt=""
                            className="w-12 h-10 object-cover rounded-md bg-stone-200 shrink-0 border border-stone-300"
                            referrerPolicy="no-referrer"
                          />
                          <div className="truncate">
                            <div className="font-bold text-stone-900 flex items-center gap-2">
                              <span>{ex.titleFa}</span>
                              {ex.bookingOpen ? (
                                <span className="text-[10px] bg-emerald-100 text-emerald-800 px-1.5 py-0.2 rounded font-mono">
                                  ثبت‌نام فعال
                                </span>
                              ) : (
                                <span className="text-[10px] bg-stone-200 text-stone-600 px-1.5 py-0.2 rounded font-mono">
                                  تکمیل ظرفیت
                                </span>
                              )}
                            </div>
                            <div className="text-[11px] text-stone-500 truncate">
                              {ex.locationFa} · {ex.durationFa} · {ex.seasonFa}
                            </div>
                          </div>
                        </div>

                        <div className="flex items-center gap-1.5 shrink-0">
                          <button
                            onClick={() => handleMoveExpedition(idx, 'up')}
                            disabled={idx === 0}
                            className="p-1.5 text-stone-500 hover:text-stone-900 disabled:opacity-30 cursor-pointer"
                          >
                            <ArrowUp className="w-3.5 h-3.5" />
                          </button>
                          <button
                            onClick={() => handleMoveExpedition(idx, 'down')}
                            disabled={idx === content.expeditions.length - 1}
                            className="p-1.5 text-stone-500 hover:text-stone-900 disabled:opacity-30 cursor-pointer"
                          >
                            <ArrowDown className="w-3.5 h-3.5" />
                          </button>

                          <button
                            onClick={() => handleStartEditExpedition(ex)}
                            className="px-2.5 py-1 text-xs bg-white hover:bg-stone-200 border border-stone-300 text-stone-800 rounded-md flex items-center gap-1 cursor-pointer font-medium"
                          >
                            <Edit3 className="w-3.5 h-3.5 text-amber-700" />
                            <span>{isFa ? 'ویرایش' : 'Edit'}</span>
                          </button>

                          <button
                            onClick={() => handleDeleteExpedition(ex.id)}
                            className="p-1.5 text-red-600 hover:bg-red-50 rounded-md cursor-pointer transition-colors"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            )}

            {/* ============================================================== */}
            {/* تب ۴: مدیریت کتاب‌ها و مونوگراف‌ها (Books & Monographs) */}
            {/* ============================================================== */}
            {activeTab === 'books' && (
              <div className="p-4 sm:p-6 space-y-6">
                <div className="p-5 bg-stone-50 rounded-2xl border border-stone-200 space-y-4">
                  <div className="flex items-center justify-between">
                    <h4 className="text-sm font-bold text-stone-900 flex items-center gap-2">
                      <BookOpen className="w-4 h-4 text-amber-700" />
                      <span>{editingBookId ? (isFa ? 'ویرایش مشخصات کتاب' : 'Edit Book') : (isFa ? 'افزودن کتاب یا مونوگراف جدید' : 'Add New Book')}</span>
                    </h4>
                    {editingBookId && (
                      <button
                        onClick={handleCancelEditBook}
                        className="text-stone-500 hover:text-stone-800 text-xs underline cursor-pointer"
                      >
                        {isFa ? 'انصراف' : 'Cancel'}
                      </button>
                    )}
                  </div>

                  <form onSubmit={handleSaveBook} className="space-y-3 text-xs">
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                      <div>
                        <div className="flex items-center justify-between mb-1">
                          <label className="font-bold text-stone-700">{isFa ? 'نام کتاب (فارسی):' : 'Book Title (FA):'}</label>
                          <button
                            type="button"
                            onClick={() => handleAiTranslate(bookTitleFa, setBookTitleEn, 'bookTitle', 'title', 'book')}
                            disabled={translatingField === 'bookTitle' || !bookTitleFa}
                            className="text-[11px] text-amber-800 font-bold flex items-center gap-1 cursor-pointer disabled:opacity-50"
                          >
                            <Wand2 className="w-3 h-3" />
                            <span>AI</span>
                          </button>
                        </div>
                        <input
                          type="text"
                          required
                          value={bookTitleFa}
                          onChange={(e) => setBookTitleFa(e.target.value)}
                          placeholder="مثال: سکوت افق‌ها"
                          className="w-full px-3 py-2 border border-stone-300 rounded-lg bg-white"
                        />
                      </div>

                      <div>
                        <label className="block font-bold text-stone-700 mb-1">{isFa ? 'نام انگلیسی کتاب:' : 'Book Title (EN):'}</label>
                        <input
                          type="text"
                          value={bookTitleEn}
                          onChange={(e) => setBookTitleEn(e.target.value)}
                          placeholder="e.g. Silence of Horizons"
                          className="w-full px-3 py-2 border border-stone-300 rounded-lg bg-white"
                        />
                      </div>
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                      <div>
                        <label className="block font-bold text-stone-700 mb-1">{isFa ? 'زیرعنوان:' : 'Subtitle:'}</label>
                        <input
                          type="text"
                          value={bookSubtitleFa}
                          onChange={(e) => setBookSubtitleFa(e.target.value)}
                          placeholder="مونوگراف عکاسی چشم‌اندازهای بکر ایران"
                          className="w-full px-3 py-2 border border-stone-300 rounded-lg bg-white"
                        />
                      </div>

                      <div>
                        <label className="block font-bold text-stone-700 mb-1">{isFa ? 'وضعیت نشر:' : 'Status:'}</label>
                        <input
                          type="text"
                          value={bookStatusFa}
                          onChange={(e) => setBookStatusFa(e.target.value)}
                          placeholder="در دست نگارش / چاپ اول پاییز ۱۴۰۴"
                          className="w-full px-3 py-2 border border-stone-300 rounded-lg bg-white"
                        />
                      </div>

                      <div>
                        <label className="block font-bold text-stone-700 mb-1">{isFa ? 'تعداد صفحات و قطع:' : 'Pages & Format:'}</label>
                        <input
                          type="text"
                          value={bookPages}
                          onChange={(e) => setBookPages(e.target.value)}
                          placeholder="۲۲۰ صفحه گلاسه با جلد پارچه‌ای"
                          className="w-full px-3 py-2 border border-stone-300 rounded-lg bg-white"
                        />
                      </div>
                    </div>

                    <div>
                      <label className="block font-bold text-stone-700 mb-1">{isFa ? 'تصویر جلد کتاب (URL):' : 'Cover Image URL:'}</label>
                      <input
                        type="url"
                        value={bookCoverImage}
                        onChange={(e) => setBookCoverImage(e.target.value)}
                        placeholder="https://..."
                        className="w-full px-3 py-2 border border-stone-300 rounded-lg bg-white"
                      />
                    </div>

                    <div>
                      <div className="flex items-center justify-between mb-1">
                        <label className="font-bold text-stone-700">{isFa ? 'توضیحات و یادداشت مؤلف:' : 'Author Note:'}</label>
                        <button
                          type="button"
                          onClick={() => handleAiTranslate(bookDescFa, setBookDescEn, 'bookDesc', 'description', 'book')}
                          disabled={translatingField === 'bookDesc' || !bookDescFa}
                          className="text-[11px] text-amber-800 font-bold flex items-center gap-1 cursor-pointer disabled:opacity-50"
                        >
                          <Wand2 className="w-3 h-3" />
                          <span>AI Translate</span>
                        </button>
                      </div>
                      <textarea
                        rows={2}
                        value={bookDescFa}
                        onChange={(e) => setBookDescFa(e.target.value)}
                        className="w-full px-3 py-2 border border-stone-300 rounded-lg bg-white resize-none"
                      />
                    </div>

                    <div className="flex gap-2 pt-1">
                      <button
                        type="submit"
                        className="flex-1 py-2.5 bg-stone-900 hover:bg-stone-800 text-white font-bold rounded-xl cursor-pointer transition-colors"
                      >
                        {editingBookId ? (isFa ? 'ذخیره تغییرات کتاب' : 'Update Book') : (isFa ? 'ثبت کتاب جدید' : 'Add Book')}
                      </button>
                      {editingBookId && (
                        <button
                          type="button"
                          onClick={handleCancelEditBook}
                          className="px-4 py-2.5 bg-stone-200 hover:bg-stone-300 text-stone-800 font-bold rounded-xl cursor-pointer"
                        >
                          {isFa ? 'انصراف' : 'Cancel'}
                        </button>
                      )}
                    </div>
                  </form>
                </div>

                <div className="space-y-3">
                  <div className="text-xs font-bold text-stone-800 flex justify-between">
                    <span>{isFa ? `کتاب‌ها و مونوگراف‌های ثبت‌شده (${(content.books || []).length} عنوان):` : 'Books List:'}</span>
                  </div>

                  <div className="space-y-2 max-h-72 overflow-y-auto">
                    {(content.books || []).map((b) => (
                      <div
                        key={b.id}
                        className={`p-3 bg-stone-50 hover:bg-stone-100/80 rounded-xl border transition-colors flex items-center justify-between text-xs ${
                          editingBookId === b.id ? 'border-amber-600 bg-amber-50/40 ring-1 ring-amber-500' : 'border-stone-200'
                        }`}
                      >
                        <div className="flex items-center gap-3 truncate">
                          <img
                            src={b.coverImage}
                            alt=""
                            className="w-10 h-12 object-cover rounded bg-stone-200 shrink-0 border border-stone-300"
                            referrerPolicy="no-referrer"
                          />
                          <div className="truncate">
                            <div className="font-bold text-stone-900">{b.titleFa}</div>
                            <div className="text-[11px] text-stone-500 truncate">{b.subtitleFa} · {b.statusFa}</div>
                          </div>
                        </div>

                        <div className="flex items-center gap-2 shrink-0">
                          <button
                            onClick={() => handleStartEditBook(b)}
                            className="px-2.5 py-1 text-xs bg-white hover:bg-stone-200 border border-stone-300 text-stone-800 rounded-md flex items-center gap-1 cursor-pointer font-medium"
                          >
                            <Edit3 className="w-3.5 h-3.5 text-amber-700" />
                            <span>{isFa ? 'ویرایش' : 'Edit'}</span>
                          </button>

                          <button
                            onClick={() => handleDeleteBook(b.id)}
                            className="p-1.5 text-red-600 hover:bg-red-50 rounded-md cursor-pointer transition-colors"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            )}

            {/* ============================================================== */}
            {/* تب ۵: مدیریت رزومه و سوابق (Resume & Timeline) */}
            {/* ============================================================== */}
            {activeTab === 'resume' && (
              <div className="p-4 sm:p-6 space-y-6">
                <div className="p-5 bg-stone-50 rounded-2xl border border-stone-200 space-y-4">
                  <div className="flex items-center justify-between">
                    <h4 className="text-sm font-bold text-stone-900 flex items-center gap-2">
                      <Briefcase className="w-4 h-4 text-amber-700" />
                      <span>{editingResId ? (isFa ? 'ویرایش ردیف رزومه' : 'Edit Resume Item') : (isFa ? 'افزودن سابقه کاری، نمایشگاه یا مدرک' : 'Add Resume Item')}</span>
                    </h4>
                    {editingResId && (
                      <button
                        onClick={handleCancelEditResume}
                        className="text-stone-500 hover:text-stone-800 text-xs underline cursor-pointer"
                      >
                        {isFa ? 'انصراف' : 'Cancel'}
                      </button>
                    )}
                  </div>

                  <form onSubmit={handleSaveResume} className="space-y-3 text-xs">
                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                      <div>
                        <label className="block font-bold text-stone-700 mb-1">{isFa ? 'بازه زمانی (مثلاً: ۱۴۰۰ - اکنون):' : 'Period:'}</label>
                        <input
                          type="text"
                          value={resPeriod}
                          onChange={(e) => setResPeriod(e.target.value)}
                          className="w-full px-3 py-2 border border-stone-300 rounded-lg bg-white"
                        />
                      </div>

                      <div>
                        <div className="flex items-center justify-between mb-1">
                          <label className="font-bold text-stone-700">{isFa ? 'عنوان سمت / دستاورد:' : 'Title:'}</label>
                          <button
                            type="button"
                            onClick={() => handleAiTranslate(resTitleFa, setResTitleEn, 'resTitle', 'title', 'resume')}
                            disabled={translatingField === 'resTitle' || !resTitleFa}
                            className="text-[11px] text-amber-800 font-bold flex items-center gap-1 cursor-pointer disabled:opacity-50"
                          >
                            <Wand2 className="w-3 h-3" />
                            <span>AI</span>
                          </button>
                        </div>
                        <input
                          type="text"
                          required
                          value={resTitleFa}
                          onChange={(e) => setResTitleFa(e.target.value)}
                          placeholder="مثال: لیدر ارشد و مستندساز میدانی"
                          className="w-full px-3 py-2 border border-stone-300 rounded-lg bg-white"
                        />
                      </div>

                      <div>
                        <label className="block font-bold text-stone-700 mb-1">{isFa ? 'سازمان / گالری:' : 'Organization:'}</label>
                        <input
                          type="text"
                          value={resOrgFa}
                          onChange={(e) => setResOrgFa(e.target.value)}
                          placeholder="استودیو سینا ضرغامی"
                          className="w-full px-3 py-2 border border-stone-300 rounded-lg bg-white"
                        />
                      </div>
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                      <div>
                        <label className="block font-bold text-stone-700 mb-1">{isFa ? 'دسته سابقه:' : 'Type:'}</label>
                        <select
                          value={resType}
                          onChange={(e) => setResType(e.target.value as any)}
                          className="w-full px-3 py-2 border border-stone-300 rounded-lg bg-white"
                        >
                          <option value="experience">{isFa ? 'سوابق کاری (Experience)' : 'Experience'}</option>
                          <option value="exhibition">{isFa ? 'نمایشگاه و فستیوال (Exhibition)' : 'Exhibition'}</option>
                          <option value="education">{isFa ? 'آموزش و تدریس (Education)' : 'Education'}</option>
                          <option value="award">{isFa ? 'جوایز و افتخارات (Award)' : 'Award'}</option>
                        </select>
                      </div>

                      <div>
                        <label className="block font-bold text-stone-700 mb-1">{isFa ? 'عنوان انگلیسی سمت:' : 'English Title:'}</label>
                        <input
                          type="text"
                          value={resTitleEn}
                          onChange={(e) => setResTitleEn(e.target.value)}
                          placeholder="e.g. Senior Field Expedition Leader"
                          className="w-full px-3 py-2 border border-stone-300 rounded-lg bg-white"
                        />
                      </div>
                    </div>

                    <div>
                      <label className="block font-bold text-stone-700 mb-1">{isFa ? 'توضیحات سابقه:' : 'Description:'}</label>
                      <textarea
                        rows={2}
                        value={resDescFa}
                        onChange={(e) => setResDescFa(e.target.value)}
                        className="w-full px-3 py-2 border border-stone-300 rounded-lg bg-white resize-none"
                      />
                    </div>

                    <div className="flex gap-2 pt-1">
                      <button
                        type="submit"
                        className="flex-1 py-2.5 bg-stone-900 hover:bg-stone-800 text-white font-bold rounded-xl cursor-pointer transition-colors"
                      >
                        {editingResId ? (isFa ? 'ذخیره تغییرات رزومه' : 'Update Resume') : (isFa ? 'افزودن به رزومه' : 'Add to Resume')}
                      </button>
                      {editingResId && (
                        <button
                          type="button"
                          onClick={handleCancelEditResume}
                          className="px-4 py-2.5 bg-stone-200 hover:bg-stone-300 text-stone-800 font-bold rounded-xl cursor-pointer"
                        >
                          {isFa ? 'انصراف' : 'Cancel'}
                        </button>
                      )}
                    </div>
                  </form>
                </div>

                <div className="space-y-3">
                  <div className="text-xs font-bold text-stone-800 flex justify-between">
                    <span>{isFa ? `موارد ثبت‌شده رزومه (${content.resume.length}):` : 'Resume Entries:'}</span>
                  </div>

                  <div className="space-y-2 max-h-72 overflow-y-auto">
                    {content.resume.map((r) => (
                      <div
                        key={r.id}
                        className={`p-3 bg-stone-50 hover:bg-stone-100/80 rounded-xl border transition-colors flex items-center justify-between text-xs ${
                          editingResId === r.id ? 'border-amber-600 bg-amber-50/40 ring-1 ring-amber-500' : 'border-stone-200'
                        }`}
                      >
                        <div className="truncate pr-2">
                          <div className="font-bold text-stone-900">{r.titleFa}</div>
                          <div className="text-[11px] text-stone-500 truncate">{r.organizationFa} · {r.period} ({r.type})</div>
                        </div>

                        <div className="flex items-center gap-2 shrink-0">
                          <button
                            onClick={() => handleStartEditResume(r)}
                            className="px-2.5 py-1 text-xs bg-white hover:bg-stone-200 border border-stone-300 text-stone-800 rounded-md flex items-center gap-1 cursor-pointer font-medium"
                          >
                            <Edit3 className="w-3.5 h-3.5 text-amber-700" />
                            <span>{isFa ? 'ویرایش' : 'Edit'}</span>
                          </button>

                          <button
                            onClick={() => handleDeleteResume(r.id)}
                            className="p-1.5 text-red-600 hover:bg-red-50 rounded-md cursor-pointer transition-colors"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            )}

            {/* ============================================================== */}
            {/* تب ۶: ویرایش متن‌ها، تیترهای هیرو، آمارها و راه‌های ارتباطی */}
            {/* ============================================================== */}
            {activeTab === 'texts' && (
              <form onSubmit={handleSaveTextsAndProfile} className="p-4 sm:p-6 space-y-6">
                <div className="space-y-5 text-xs">
                  {/* تیتر کوچک بالای صفحه (Kicker) */}
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    <div>
                      <div className="flex items-center justify-between mb-1">
                        <label className="font-bold text-stone-800">{isFa ? 'نشانگر بالای تیتر (فارسی):' : 'Hero Kicker (FA):'}</label>
                        <button
                          type="button"
                          onClick={() => handleAiTranslate(profileForm.heroKickerFa, (val) => setProfileForm({ ...profileForm, heroKickerEn: val }), 'kicker', 'tagline')}
                          className="text-[11px] text-amber-800 font-bold flex items-center gap-1 cursor-pointer"
                        >
                          <Wand2 className="w-3 h-3" />
                          <span>AI</span>
                        </button>
                      </div>
                      <input
                        type="text"
                        value={profileForm.heroKickerFa}
                        onChange={(e) => setProfileForm({ ...profileForm, heroKickerFa: e.target.value })}
                        className="w-full px-3 py-2 border border-stone-300 rounded-lg bg-white"
                      />
                    </div>
                    <div>
                      <label className="block font-bold text-stone-800 mb-1">{isFa ? 'نشانگر بالای تیتر (انگلیسی):' : 'Hero Kicker (EN):'}</label>
                      <input
                        type="text"
                        value={profileForm.heroKickerEn}
                        onChange={(e) => setProfileForm({ ...profileForm, heroKickerEn: e.target.value })}
                        className="w-full px-3 py-2 border border-stone-300 rounded-lg bg-white"
                      />
                    </div>
                  </div>

                  {/* ۳ بخش تیتر بزرگ اصلی */}
                  <div className="p-4 bg-stone-50 rounded-xl border border-stone-200 space-y-3">
                    <div className="font-bold text-stone-900 text-xs">{isFa ? 'تیتر اصلی و بزرگ هیرو (در ۳ بخش ترکیبی):' : 'Hero Big Headline:'}</div>

                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                      <div>
                        <label className="block font-bold text-stone-700 mb-1">{isFa ? 'شروع تیتر (مثال: روایت اصیل چشم‌اندازهای ایران،)' : 'Part 1:'}</label>
                        <input
                          type="text"
                          value={profileForm.heroHeadlineMainFa}
                          onChange={(e) => setProfileForm({ ...profileForm, heroHeadlineMainFa: e.target.value })}
                          className="w-full px-3 py-2 border border-stone-300 rounded-lg bg-white"
                        />
                      </div>
                      <div>
                        <label className="block font-bold text-amber-800 mb-1">{isFa ? 'بخش رنگی تیتر (مثال: هنر دیدن، کاوش در طبیعت)' : 'Highlight:'}</label>
                        <input
                          type="text"
                          value={profileForm.heroHeadlineHighlightFa}
                          onChange={(e) => setProfileForm({ ...profileForm, heroHeadlineHighlightFa: e.target.value })}
                          className="w-full px-3 py-2 border border-amber-300 bg-amber-50/60 rounded-lg font-bold"
                        />
                      </div>
                      <div>
                        <label className="block font-bold text-stone-700 mb-1">{isFa ? 'پایان تیتر (مثال: و خلق فناوری.)' : 'Part 3:'}</label>
                        <input
                          type="text"
                          value={profileForm.heroHeadlineEndFa}
                          onChange={(e) => setProfileForm({ ...profileForm, heroHeadlineEndFa: e.target.value })}
                          className="w-full px-3 py-2 border border-stone-300 rounded-lg bg-white"
                        />
                      </div>
                    </div>
                  </div>

                  {/* درباره من (بیوگرافی) */}
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    <div>
                      <div className="flex items-center justify-between mb-1">
                        <div className="flex items-center gap-2">
                          <label className="font-bold text-stone-800">{isFa ? 'متن معرفی درباره من (فارسی):' : 'About Bio (FA):'}</label>
                          <VoiceDictationButton
                            onTranscript={(t) => setProfileForm((prev) => ({ ...prev, aboutFa: (prev.aboutFa ? prev.aboutFa + ' ' + t : t) }))}
                            title={isFa ? 'دیکته صوتی بیوگرافی' : 'Dictate bio'}
                          />
                        </div>
                        <button
                          type="button"
                          onClick={() => handleAiTranslate(profileForm.aboutFa, (val) => setProfileForm({ ...profileForm, aboutEn: val }), 'bio', 'description')}
                          className="text-[11px] text-amber-800 font-bold flex items-center gap-1 cursor-pointer"
                        >
                          <Wand2 className="w-3 h-3" />
                          <span>AI Translate</span>
                        </button>
                      </div>
                      <textarea
                        rows={3}
                        value={profileForm.aboutFa}
                        onChange={(e) => setProfileForm({ ...profileForm, aboutFa: e.target.value })}
                        className="w-full px-3 py-2 border border-stone-300 rounded-lg bg-white resize-none"
                      />
                    </div>
                    <div>
                      <label className="block font-bold text-stone-800 mb-1">{isFa ? 'متن معرفی درباره من (انگلیسی):' : 'About Bio (EN):'}</label>
                      <textarea
                        rows={3}
                        value={profileForm.aboutEn}
                        onChange={(e) => setProfileForm({ ...profileForm, aboutEn: e.target.value })}
                        className="w-full px-3 py-2 border border-stone-300 rounded-lg bg-white resize-none"
                      />
                    </div>
                  </div>

                  {/* اطلاعات تماس و شبکه‌های اجتماعی */}
                  <div className="p-4 bg-stone-50 rounded-xl border border-stone-200 space-y-3">
                    <div className="font-bold text-stone-900 text-xs">{isFa ? 'اطلاعات تماس و لینک‌های اجتماعی سینا ضرغامی:' : 'Contact & Social Links:'}</div>

                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                      <div>
                        <label className="block font-medium text-stone-700 mb-1">{isFa ? 'ایمیل:' : 'Email:'}</label>
                        <input
                          type="email"
                          value={profileForm.email}
                          onChange={(e) => setProfileForm({ ...profileForm, email: e.target.value })}
                          className="w-full px-3 py-2 border border-stone-300 rounded-lg bg-white font-mono"
                        />
                      </div>
                      <div>
                        <label className="block font-medium text-stone-700 mb-1">{isFa ? 'تلگرام (لینک یا آیدی):' : 'Telegram:'}</label>
                        <input
                          type="text"
                          value={profileForm.telegram}
                          onChange={(e) => setProfileForm({ ...profileForm, telegram: e.target.value })}
                          className="w-full px-3 py-2 border border-stone-300 rounded-lg bg-white font-mono"
                        />
                      </div>
                      <div>
                        <label className="block font-medium text-stone-700 mb-1">{isFa ? 'اینستاگرام:' : 'Instagram:'}</label>
                        <input
                          type="text"
                          value={profileForm.instagram}
                          onChange={(e) => setProfileForm({ ...profileForm, instagram: e.target.value })}
                          className="w-full px-3 py-2 border border-stone-300 rounded-lg bg-white font-mono"
                        />
                      </div>
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                      <div>
                        <label className="block font-medium text-stone-700 mb-1">{isFa ? 'گیت‌هاب:' : 'GitHub:'}</label>
                        <input
                          type="text"
                          value={profileForm.github}
                          onChange={(e) => setProfileForm({ ...profileForm, github: e.target.value })}
                          className="w-full px-3 py-2 border border-stone-300 rounded-lg bg-white font-mono"
                        />
                      </div>
                      <div>
                        <label className="block font-medium text-stone-700 mb-1">{isFa ? 'لینکدین:' : 'LinkedIn:'}</label>
                        <input
                          type="text"
                          value={profileForm.linkedin}
                          onChange={(e) => setProfileForm({ ...profileForm, linkedin: e.target.value })}
                          className="w-full px-3 py-2 border border-stone-300 rounded-lg bg-white font-mono"
                        />
                      </div>
                      <div>
                        <label className="block font-medium text-stone-700 mb-1">{isFa ? 'یوتیوب:' : 'YouTube:'}</label>
                        <input
                          type="text"
                          value={profileForm.youtube || ''}
                          onChange={(e) => setProfileForm({ ...profileForm, youtube: e.target.value })}
                          className="w-full px-3 py-2 border border-stone-300 rounded-lg bg-white font-mono"
                        />
                      </div>
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-1">
                      <div>
                        <label className="block font-medium text-amber-900 font-bold mb-1">{isFa ? 'شماره تماس مستقیم و واتساپ:' : 'Direct Phone & WhatsApp:'}</label>
                        <input
                          type="text"
                          value={profileForm.phone || '09127193767'}
                          onChange={(e) => setProfileForm({ ...profileForm, phone: e.target.value })}
                          placeholder="09127193767"
                          className="w-full px-3 py-2 border border-amber-300 bg-amber-50/40 rounded-lg font-mono font-bold text-stone-900"
                        />
                      </div>
                      <div>
                        <label className="block font-medium text-stone-700 mb-1">{isFa ? 'موقعیت مکانی پیش‌فرض:' : 'Location:'}</label>
                        <input
                          type="text"
                          value={profileForm.locationFa || 'تهران و سراسر ایران'}
                          onChange={(e) => setProfileForm({ ...profileForm, locationFa: e.target.value })}
                          className="w-full px-3 py-2 border border-stone-300 rounded-lg bg-white"
                        />
                      </div>
                    </div>
                  </div>

                  {/* ۴ شاخص آماری کلیدی هیرو (KPI Cards) */}
                  <div className="p-4 bg-stone-50 rounded-xl border border-stone-200 space-y-3">
                    <div className="font-bold text-stone-900 text-xs">{isFa ? '۴ شاخص آماری کلیدی پایین بخش هیرو:' : '4 KPI Strip Numbers & Labels:'}</div>

                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
                      {profileForm.stats.map((stat, sIdx) => (
                        <div key={sIdx} className="p-3 bg-white rounded-lg border border-stone-200 space-y-2">
                          <span className="text-[10px] font-bold text-amber-800">شاخص {sIdx + 1}</span>
                          <input
                            type="text"
                            value={stat.numberFa}
                            onChange={(e) => handleUpdateStat(sIdx, 'numberFa', e.target.value)}
                            placeholder="مثال: ۱۲+ سال"
                            className="w-full px-2.5 py-1.5 border border-stone-300 rounded text-xs font-bold text-stone-900"
                          />
                          <input
                            type="text"
                            value={stat.labelFa}
                            onChange={(e) => handleUpdateStat(sIdx, 'labelFa', e.target.value)}
                            placeholder="عنوان شاخص"
                            className="w-full px-2.5 py-1.5 border border-stone-300 rounded text-[11px] text-stone-600"
                          />
                        </div>
                      ))}
                    </div>
                  </div>
                </div>

                <button
                  type="submit"
                  className="w-full py-3 bg-stone-900 hover:bg-stone-800 text-white font-bold rounded-xl cursor-pointer transition-colors shadow-sm"
                >
                  {isFa ? 'ذخیره تمام متن‌ها، آمارها و اطلاعات تماس' : 'Save Texts & Profile'}
                </button>
              </form>
            )}

            {/* ============================================================== */}
            {/* تب ۶: آمار، رفتار کاربران، دستگاه‌ها و خریدهای رها شده */}
            {/* ============================================================== */}
            {activeTab === 'analytics' && <AdminAnalyticsTab isFa={isFa} />}

            {/* ============================================================== */}
            {/* تب ۷: انتشار سراسری، همگام‌سازی ابری و فایل پشتیبان */}
            {/* ============================================================== */}
            {activeTab === 'publish' && (
              <div className="p-4 sm:p-6 space-y-6 max-w-xl mx-auto">
                <div className="space-y-2">
                  <h4 className="text-base font-bold text-stone-900">
                    {isFa ? 'انتشار سراسری روی sinazarghami.ir' : 'Publish to Live Site'}
                  </h4>
                  <p className="text-xs text-stone-600 leading-relaxed">
                    {isFa
                      ? 'با فشردن دکمه زیر، تمام عکس‌ها، گالری‌ها، پروژه‌ها و متون ویرایش‌شده در سرور ابری ذخیره شده و در تمام مرورگرها (Edge، کروم)، گوشی و لپ‌تاپ یکپارچه و به تلگرام گزارش می‌شود.'
                      : 'Deploy updates globally.'}
                  </p>
                </div>

                <div className="space-y-3">
                  <button
                    onClick={handleInstantUniversalPublish}
                    disabled={isPublishing}
                    className="w-full py-3.5 px-4 bg-emerald-700 hover:bg-emerald-800 disabled:bg-stone-400 text-white text-xs sm:text-sm font-bold rounded-xl transition-colors flex items-center justify-center gap-2 cursor-pointer shadow-md"
                  >
                    <CloudUpload className="w-5 h-5" />
                    <span>
                      {isPublishing
                        ? (isFa ? 'در حال ثبت در سرور ابری...' : 'Deploying...')
                        : (isFa ? '🚀 انتشار فوری روی سرور و همگام‌سازی گوشی و لپ‌تاپ' : 'Publish Globally')}
                    </span>
                  </button>

                  {publishStatus && (
                    <div
                      className={`p-4 rounded-xl text-xs font-medium border ${
                        publishStatus.success
                          ? 'bg-emerald-50 text-emerald-900 border-emerald-300'
                          : 'bg-red-50 text-red-900 border-red-300'
                      }`}
                    >
                      {publishStatus.msg}
                    </div>
                  )}
                </div>

                {/* بخش دانلود و بازیابی فایل پشتیبان (Backup / Restore) */}
                <div className="p-4 bg-stone-50 rounded-xl border border-stone-200 space-y-3 text-xs">
                  <div className="font-bold text-stone-900 flex items-center gap-1.5">
                    <Download className="w-4 h-4 text-amber-700" />
                    <span>{isFa ? 'فایل پشتیبان کامل سایت (Backup):' : 'Backup & Restore:'}</span>
                  </div>
                  <p className="text-[11px] text-stone-500 leading-relaxed">
                    {isFa
                      ? 'می‌توانید در هر زمان یک نسخه پشتیبان آفلاین از تمام متون، لینک‌ها و آثار دانلود کنید یا در صورت نیاز فایل پشتیبان قبلی را بازیابی نمایید.'
                      : 'Download or restore complete JSON backup.'}
                  </p>

                  <div className="flex gap-2">
                    <button
                      type="button"
                      onClick={() => exportSiteContentToJson(content)}
                      className="flex-1 py-2 bg-white hover:bg-stone-100 border border-stone-300 text-stone-800 font-bold rounded-lg cursor-pointer flex items-center justify-center gap-1.5"
                    >
                      <Download className="w-3.5 h-3.5" />
                      <span>{isFa ? 'دانلود نسخه پشتیبان (JSON)' : 'Download Backup'}</span>
                    </button>

                    <input
                      ref={backupInputRef}
                      type="file"
                      accept=".json"
                      onChange={handleImportBackup}
                      className="hidden"
                    />

                    <button
                      type="button"
                      onClick={() => backupInputRef.current?.click()}
                      className="flex-1 py-2 bg-white hover:bg-stone-100 border border-stone-300 text-stone-800 font-bold rounded-lg cursor-pointer flex items-center justify-center gap-1.5"
                    >
                      <Upload className="w-3.5 h-3.5" />
                      <span>{isFa ? 'بازیابی از فایل (Restore)' : 'Restore Backup'}</span>
                    </button>
                  </div>
                </div>

                {/* اتصال و همگام‌سازی مستقیم با گیت‌هاب */}
                <div className="p-4 bg-stone-50 rounded-xl border border-stone-200 text-xs space-y-3.5 text-stone-700">
                  <div className="flex items-center justify-between">
                    <div className="font-bold flex items-center gap-2 text-stone-900">
                      <Github className="w-4 h-4 text-stone-900" />
                      <span>{isFa ? 'همگام‌سازی با مخزن گیت‌هاب (szarghami/sinazarghami.ir)' : 'GitHub Repository Sync'}</span>
                    </div>
                    <a
                      href="https://github.com/szarghami/sinazarghami.ir"
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-[11px] text-amber-800 hover:underline flex items-center gap-1"
                    >
                      <span>{isFa ? 'مشاهده در گیت‌هاب' : 'View on GitHub'}</span>
                      <ExternalLink className="w-3 h-3" />
                    </a>
                  </div>

                  <p className="text-[11px] text-stone-600 leading-relaxed">
                    {isFa
                      ? 'برای همگام‌سازی خودکار و کامیت داده‌های سایت در مخزن گیت‌هاب، توکن شخصی گیت‌هاب (Personal Access Token با دسترسی repo) را در کادر زیر وارد کنید:'
                      : 'Enter your GitHub Personal Access Token with repo scope for automated commits:'}
                  </p>

                  <div className="space-y-2">
                    <div className="flex items-center gap-2">
                      <div className="relative flex-1">
                        <input
                          type={showGithubToken ? 'text' : 'password'}
                          value={githubToken}
                          onChange={(e) => {
                            setGithubToken(e.target.value);
                            saveGitHubToken(e.target.value);
                          }}
                          placeholder="ghp_xxxxxxxxxxxxxxxxxxxx"
                          className="w-full px-3 py-2 pr-9 border border-stone-300 rounded-lg bg-white font-mono text-xs focus:outline-none focus:ring-1 focus:ring-amber-600"
                        />
                        <button
                          type="button"
                          onClick={() => setShowGithubToken(!showGithubToken)}
                          className="absolute right-2.5 top-2.5 text-stone-400 hover:text-stone-700 cursor-pointer"
                          title={showGithubToken ? 'پنهان‌سازی' : 'نمایش'}
                        >
                          <Eye className="w-3.5 h-3.5" />
                        </button>
                      </div>

                      <button
                        type="button"
                        onClick={handleManualGithubSync}
                        disabled={isSyncingGithub || !githubToken.trim()}
                        className="px-4 py-2 bg-stone-900 hover:bg-stone-800 disabled:bg-stone-400 text-white font-bold rounded-lg cursor-pointer flex items-center gap-1.5 transition-colors whitespace-nowrap"
                      >
                        {isSyncingGithub ? (
                          <>
                            <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                            <span>{isFa ? 'در حال کامیت...' : 'Syncing...'}</span>
                          </>
                        ) : (
                          <>
                            <CloudUpload className="w-3.5 h-3.5 text-emerald-400" />
                            <span>{isFa ? 'کامیت به گیت‌هاب' : 'Sync to GitHub'}</span>
                          </>
                        )}
                      </button>
                    </div>

                    {githubSyncStatus && (
                      <div
                        className={`p-2.5 rounded-lg text-xs font-medium border ${
                          githubSyncStatus.success
                            ? 'bg-emerald-50 text-emerald-900 border-emerald-300'
                            : 'bg-red-50 text-red-900 border-red-300'
                        }`}
                      >
                        {githubSyncStatus.msg}
                      </div>
                    )}
                  </div>
                </div>
              </div>
            )}

            {/* ============================================================== */}
            {/* تب ۸: امنیت، رمز ورود و اتصال تلگرام */}
            {/* ============================================================== */}
            {activeTab === 'security' && (
              <div className="p-4 sm:p-8 space-y-6 max-w-md mx-auto">
                <div className="space-y-2">
                  <h4 className="text-base font-bold text-stone-900">
                    {isFa ? 'تغییر رمز عبور استودیو' : 'Change Password'}
                  </h4>
                  <p className="text-xs text-stone-600 leading-relaxed">
                    {isFa
                      ? 'رمز جدید را وارد کنید. پس از ثبت، رمز جدید فوراً در سرور ذخیره شده، در گوشی و لپ‌تاپ همگام گردیده و به اکانت تلگرام شخصی شما نیز فرستاده می‌شود.'
                      : 'Set new pin code.'}
                  </p>
                </div>

                <div className="space-y-3">
                  <input
                    type="password"
                    placeholder={isFa ? 'رمز عبور جدید (حداقل ۴ کاراکتر)' : 'New password'}
                    value={newPin}
                    onChange={(e) => setNewPin(e.target.value)}
                    className="w-full px-4 py-2.5 text-sm border border-stone-300 rounded-lg focus:outline-none focus:ring-1 focus:ring-amber-600 font-mono"
                  />
                  <button
                    onClick={async () => {
                      if (newPin.trim().length >= 4) {
                        await updateAdminPasscode(newPin.trim());
                        alert(
                          isFa
                            ? 'رمز عبور جدید با موفقیت ذخیره شد و به تلگرام شما ارسال گردید.'
                            : 'Password updated & sent to Telegram.'
                        );
                        setNewPin('');
                      } else {
                        alert(isFa ? 'رمز باید حداقل ۴ کاراکتر باشد.' : 'Min 4 characters.');
                      }
                    }}
                    className="w-full py-2.5 bg-stone-900 hover:bg-stone-800 text-white text-xs font-semibold rounded-lg cursor-pointer transition-colors"
                  >
                    {isFa ? 'ذخیره رمز جدید و ارسال به تلگرام' : 'Update & Send to Telegram'}
                  </button>
                </div>

                {/* تست اتصال ربات تلگرام */}
                <div className="pt-4 border-t border-stone-200 space-y-3">
                  <div className="text-xs font-bold text-stone-900 flex items-center gap-1.5">
                    <Send className="w-3.5 h-3.5 text-sky-600" />
                    <span>{isFa ? 'وضعیت ربات تلگرام شخصی سینا ضرغامی:' : 'Telegram Bot Integration:'}</span>
                  </div>
                  <div className="text-[11px] text-stone-500 space-y-1">
                    <div>ربات: <code className="bg-stone-100 px-1 py-0.5 rounded font-mono">@ai_Agent_for_sina_bot</code></div>
                    <div>چت آیدی: <code className="bg-stone-100 px-1 py-0.5 rounded font-mono">86050350 (@sina_zarghami)</code></div>
                  </div>

                  <button
                    type="button"
                    onClick={handleTestTelegram}
                    className="w-full py-2 bg-sky-50 hover:bg-sky-100 text-sky-900 border border-sky-200 text-xs font-medium rounded-lg cursor-pointer transition-colors flex items-center justify-center gap-1.5"
                  >
                    <Send className="w-3 h-3 text-sky-600" />
                    <span>{isFa ? 'ارسال پیام تست به تلگرام من' : 'Send Test Notification'}</span>
                  </button>

                  {telegramTestStatus && (
                    <div className="p-2.5 bg-sky-50 text-sky-900 rounded-lg text-xs font-medium border border-sky-200">
                      {telegramTestStatus}
                    </div>
                  )}
                </div>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
};
