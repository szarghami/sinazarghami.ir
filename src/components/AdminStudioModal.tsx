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
  SpecificPhotoCategory,
  PhotoCategory,
  SyncedComment,
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
  getSavedWatermarkImage,
  saveWatermarkImage,
  getSavedWatermarkOpacity,
  saveWatermarkOpacity,
  getSavedWatermarkPosition,
  saveWatermarkPosition,
  DEFAULT_WATERMARK_SVG,
  drawWatermarkOnCanvas,
  WatermarkConfig,
  compressImageToWebP,
} from '../utils/storage';
import {
  getMainRepo,
  saveMainRepo,
  getVideoRepo,
  saveVideoRepo,
  getVideoBaseUrl,
  saveVideoBaseUrl,
  getVideoThresholdMB,
  saveVideoThresholdMB,
  getForceAllVideosToVideoRepo,
  saveForceAllVideosToVideoRepo,
  uploadMediaToGitHub,
  discoverGitHubMedia,
  inferTitlesFromFilename,
  DEFAULT_MAIN_REPO,
  DEFAULT_VIDEO_REPO,
  DEFAULT_VIDEO_BASE_URL,
  uploadLargeVideoChunked,
  deployVideoProcessorWorkflowToGitHub,
  getVideoProcessorWorkflowYaml,
  parseAparatUrl,
  parseYoutubeUrl,
  fetchAparatComments,
  fetchYouTubeComments,
} from '../utils/githubMediaService';
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
  Video,
  Film,
  AlertCircle,
  EyeOff,
  FolderGit2,
  Server,
  Layers,
  SlidersHorizontal,
  Image as ImageIcon,
  MessageSquare,
  Copy,
  FileText,
  Radio,
  Play,
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
    'upload_studio' | 'software' | 'expeditions' | 'books' | 'resume' | 'texts' | 'analytics' | 'publish' | 'security'
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
  const [photoCategory, setPhotoCategory] = useState<SpecificPhotoCategory>('landscape');
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

  // پلیر چندسروره برای نمونه‌کارهای ویدیویی
  const [photoGithubVideoUrl, setPhotoGithubVideoUrl] = useState('');
  const [photoAparatUrl, setPhotoAparatUrl] = useState('');
  const [photoYoutubeUrl, setPhotoYoutubeUrl] = useState('');
  const [photoDefaultServer, setPhotoDefaultServer] = useState<'github' | 'aparat' | 'youtube'>('github');

  // استیت‌های سیستم امضای کاری و واترمارک زنده با Canvas
  const [watermarkImg, setWatermarkImg] = useState<string>(() => getSavedWatermarkImage());
  const [watermarkOpacity, setWatermarkOpacity] = useState<number>(() => getSavedWatermarkOpacity());
  const [watermarkPosition, setWatermarkPosition] = useState<'bottom-right' | 'bottom-left' | 'top-right' | 'top-left' | 'center'>(() => getSavedWatermarkPosition());
  const previewCanvasRef = useRef<HTMLCanvasElement | null>(null);
  const watermarkInputRef = useRef<HTMLInputElement | null>(null);

  // استیت‌های آپلود تکه‌تکه ویدیو و استقرار خودکار ورک‌فلو گیت‌هاب
  const [chunkedUploadProgress, setChunkedUploadProgress] = useState<{ status: string; percent: number } | null>(null);
  const [isDeployingWorkflow, setIsDeployingWorkflow] = useState<boolean>(false);
  const [showWorkflowCodeModal, setShowWorkflowCodeModal] = useState<boolean>(false);
  const [workflowDeployMsg, setWorkflowDeployMsg] = useState<string | null>(null);

  // استیت‌های آپلود دسته‌جمعی (Bulk Upload) بدون مصرف توکن هوش مصنوعی
  const [isBulkMode, setIsBulkMode] = useState<boolean>(false);
  const [bulkTitlePrefix, setBulkTitlePrefix] = useState<string>('');
  const [bulkLocationFa, setBulkLocationFa] = useState<string>('تهران، استودیو صنعتی');
  const [bulkLocationEn, setBulkLocationEn] = useState<string>('Tehran Industrial Studio');
  const [bulkCategory, setBulkCategory] = useState<SpecificPhotoCategory>('commercial-shoes');
  const [isBulkProcessing, setIsBulkProcessing] = useState<boolean>(false);
  const [bulkUploadStatus, setBulkUploadStatus] = useState<string | null>(null);

  // استیت‌های همگام‌سازی کامنت‌های یوتیوب و آپارات
  const [isSyncingComments, setIsSyncingComments] = useState<boolean>(false);
  const [youtubeApiKey, setYoutubeApiKey] = useState<string>(() => (typeof window !== 'undefined' ? localStorage.getItem('sina_youtube_api_key') || '' : ''));
  const [aparatApiKey, setAparatApiKey] = useState<string>(() => (typeof window !== 'undefined' ? localStorage.getItem('sina_aparat_api_key') || '' : ''));

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
  const [mainRepo, setMainRepoState] = useState(getMainRepo());
  const [videoRepo, setVideoRepoState] = useState(getVideoRepo());
  const [videoBaseUrl, setVideoBaseUrlState] = useState(getVideoBaseUrl());
  const [forceAllVideos, setForceAllVideos] = useState(getForceAllVideosToVideoRepo());
  const [uploadToGitHubOption, setUploadToGitHubOption] = useState(true);
  const [isPublishing, setIsPublishing] = useState(false);
  const [isSyncingGithub, setIsSyncingGithub] = useState(false);
  const [githubSyncStatus, setGithubSyncStatus] = useState<{ success: boolean; msg: string } | null>(null);
  const [showGithubToken, setShowGithubToken] = useState(false);
  const [publishStatus, setPublishStatus] = useState<{ success: boolean; msg: string } | null>(null);
  const [telegramTestStatus, setTelegramTestStatus] = useState<string | null>(null);

  // استیت‌های اختصاصی Auto-Discovery و آپلود گیت‌هاب
  const [isDiscoveringGithub, setIsDiscoveringGithub] = useState(false);
  const [discoveryLog, setDiscoveryLog] = useState<string | null>(null);
  const [githubUploadProgress, setGithubUploadProgress] = useState<string | null>(null);
  const [selectedVideoFile, setSelectedVideoFile] = useState<File | null>(null);
  const [showRepoSettings, setShowRepoSettings] = useState(false);

  const fileInputRef = useRef<HTMLInputElement>(null);
  const backupInputRef = useRef<HTMLInputElement>(null);

  /**
   * همگام‌سازی دستی و مستقیم فایل داده‌های سایت با مخزن اصلی گیت‌هاب
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
      saveMainRepo(mainRepo.trim());

      const res = await fetch('/api/github/sync', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          token: githubToken.trim(),
          repo: mainRepo.trim(),
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
          ? `فایل داده‌های وب‌سایت با موفقیت در مخزن ${mainRepo} کامیت و همگام‌سازی شد!`
          : `Successfully committed to ${mainRepo}!`,
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

  /**
   * شناسایی و همگام‌سازی خودکار فایل‌های آپلودشده در گیت‌هاب (Auto-Discovery بدون کپی لینک)
   */
  const handleAutoDiscoverFromGitHub = async () => {
    try {
      setIsDiscoveringGithub(true);
      setDiscoveryLog(isFa ? 'در حال برقراری ارتباط با GitHub API و اسکن ریپازیتوری‌ها...' : 'Connecting to GitHub API...');

      const res = await discoverGitHubMedia({
        existingPhotos: content.photos,
        token: githubToken.trim() || undefined,
        mainRepo: mainRepo.trim(),
        videoRepo: videoRepo.trim(),
        videoBaseUrl: videoBaseUrl.trim(),
        onLog: (msg) => setDiscoveryLog(msg),
      });

      if (res.totalDiscovered > 0) {
        const updatedPhotos = [...res.newPhotos, ...content.photos];
        const updatedContent = { ...content, photos: updatedPhotos };
        onUpdateContent(updatedContent);
        saveSiteContent(updatedContent);

        const successMsg = isFa
          ? `🎉 تعداد ${res.totalDiscovered} مدیا تازه (${res.scannedMainCount} فایل در مخزن اصلی، ${res.scannedVideoCount} ویدیو در مخزن ویدیو) شناسایی و با موفقیت به گالری سایت افزوده شدند!`
          : `Discovered and added ${res.totalDiscovered} new items to gallery!`;
        setDiscoveryLog(successMsg);
        alert(successMsg);
      } else {
        const msg = isFa
          ? `تمامی فایل‌های موجود در مخازن گیت‌هاب (${res.scannedMainCount} فایل اصلی و ${res.scannedVideoCount} ویدیو) قبلاً در گالری ثبت شده‌اند و فایل تازه‌ای یافت نشد.`
          : 'All GitHub files are already present in your gallery.';
        setDiscoveryLog(msg);
        alert(msg);
      }
    } catch (err: any) {
      const errMsg = isFa ? `خطا در شناسایی خودکار از گیت‌هاب: ${err.message}` : `Auto-discovery error: ${err.message}`;
      setDiscoveryLog(errMsg);
      alert(errMsg);
    } finally {
      setIsDiscoveringGithub(false);
    }
  };

  // بازفشرده‌سازی در صورت تغییر اسلایدرهای کیفیت، حداکثر اندازه یا تنظیمات واترمارک
  useEffect(() => {
    if (rawFiles.length > 0) {
      processSelectedFiles(rawFiles);
    }
  }, [compressQuality, compressMaxDim, watermarkImg, watermarkOpacity, watermarkPosition]);

  /**
   * رندر زنده امضای کاری روی Canvas برای مشاهده آنی تغییرات شفافیت
   */
  useEffect(() => {
    const canvas = previewCanvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const sampleSrc = compressedResults[0]?.dataUrl || photoImageUrl || 'https://images.unsplash.com/photo-1549298916-b41d501d3772?auto=format&fit=crop&w=800&q=80';
    const baseImg = new window.Image();
    baseImg.crossOrigin = 'anonymous';
    baseImg.onload = () => {
      canvas.width = 480;
      canvas.height = Math.round((baseImg.height / baseImg.width) * 480) || 300;
      ctx.drawImage(baseImg, 0, 0, canvas.width, canvas.height);

      if (watermarkOpacity > 0 && watermarkImg) {
        const wm = new window.Image();
        wm.crossOrigin = 'anonymous';
        wm.onload = () => {
          drawWatermarkOnCanvas(ctx, canvas.width, canvas.height, wm, watermarkOpacity, watermarkPosition);
        };
        wm.src = watermarkImg;
      }
    };
    baseImg.src = sampleSrc;
  }, [watermarkImg, watermarkOpacity, watermarkPosition, compressedResults, photoImageUrl]);

  /**
   * تابع فشرده‌سازی خودکار و سریع عکس‌ها به فرمت مدرن WebP با Canvas و اعمال واترمارک
   */
  const processSelectedFiles = async (files: File[]) => {
    try {
      setIsProcessing(true);
      const res = await compressMultipleImagesToWebP(files, compressMaxDim, compressQuality, {
        imageDataUrl: watermarkImg,
        opacity: watermarkOpacity,
        position: watermarkPosition,
      });
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
   * مدیریت آپلود لوگوی امضای کاری (watermark.png)
   */
  const handleWatermarkUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = () => {
      const dataUrl = reader.result as string;
      setWatermarkImg(dataUrl);
      saveWatermarkImage(dataUrl);
      alert(isFa ? 'فایل امضای کاری (Watermark PNG) با موفقیت ذخیره شد!' : 'Watermark PNG saved!');
    };
    reader.readAsDataURL(file);
  };

  /**
   * بازنشانی امضا به حالت پیش‌فرض
   */
  const handleResetWatermark = () => {
    setWatermarkImg(DEFAULT_WATERMARK_SVG);
    saveWatermarkImage(DEFAULT_WATERMARK_SVG);
    setWatermarkOpacity(0.15);
    saveWatermarkOpacity(0.15);
    setWatermarkPosition('bottom-right');
    saveWatermarkPosition('bottom-right');
  };

  /**
   * ارسال خودکار فایل ورک‌فلو به ریپازیتوری szarghami/video-portfolio
   */
  const handleDeployWorkflow = async () => {
    if (!githubToken.trim()) {
      alert(isFa ? 'لطفاً ابتدا توکن دسترسی شخصی گیت‌هاب را وارد کنید.' : 'Please enter GitHub token.');
      return;
    }
    try {
      setIsDeployingWorkflow(true);
      const res = await deployVideoProcessorWorkflowToGitHub(githubToken.trim(), videoRepo.trim());
      setWorkflowDeployMsg(res.msg);
      alert(res.msg);
    } catch (err: any) {
      const msg = (isFa ? 'خطا در استقرار ورک‌فلو در گیت‌هاب: ' : 'Error: ') + err.message;
      setWorkflowDeployMsg(msg);
      alert(msg);
    } finally {
      setIsDeployingWorkflow(false);
    }
  };

  /**
   * همگام‌سازی و دریافت خودکار کامنت‌های آپارات (بدون نیاز به API Key از طریق پروکسی CORS)
   * و ترکیب آن با کامنت‌های یوتیوب و ذخیره مستقیم در آرایه syncedComments دیتای سایت
   */
  const handleSyncSocialComments = async () => {
    setIsSyncingComments(true);
    try {
      let totalAparatSynced = 0;
      let totalYtSynced = 0;
      let totalVideosScanned = 0;

      const updatedPhotos = await Promise.all(
        content.photos.map(async (p) => {
          const hasAparat = Boolean(p.aparatUrl);
          const hasYoutube = Boolean(p.youtubeUrl);
          if (!hasAparat && !hasYoutube) return p;

          totalVideosScanned++;
          const existing = p.syncedComments || [];
          let fetchedAparatComments: SyncedComment[] = [];
          let fetchedYoutubeComments: SyncedComment[] = [];

          // ۱. دریافت خودکار کامنت‌های آپارات با فراخوانی آدرس عمومی https://www.aparat.com/api/fa/v1/video/comment/list/videohash/[uid]
          if (hasAparat) {
            const aparatInfo = parseAparatUrl(p.aparatUrl || '');
            const uid = aparatInfo.hash || p.aparatUrl?.trim();
            if (uid) {
              const resComments = await fetchAparatComments(uid);
              if (resComments.length > 0) {
                fetchedAparatComments = resComments;
                totalAparatSynced += resComments.length;
              }
            }
          }

          // ۲. دریافت کامنت‌های یوتیوب (در صورت ثبت YouTube API Key)
          if (hasYoutube && youtubeApiKey.trim()) {
            const ytInfo = parseYoutubeUrl(p.youtubeUrl || '');
            const ytId = ytInfo.videoId;
            if (ytId) {
              const resYt = await fetchYouTubeComments(ytId, youtubeApiKey.trim());
              if (resYt.length > 0) {
                fetchedYoutubeComments = resYt;
                totalYtSynced += resYt.length;
              }
            }
          }

          // ۳. ترکیب هوشمند با کامنت‌های موجود و جلوگیری از تکرار
          const existingAparat = existing.filter((c) => c.platform === 'aparat');
          const existingYoutube = existing.filter((c) => c.platform === 'youtube');

          // اگر کامنت‌های زنده‌ای از آپارات دریافت شد، جایگزین یا اضافه می‌کنیم؛ در غیر این صورت کامنت‌های ثبت‌شده قبلی را حفظ می‌کنیم
          const finalAparat = fetchedAparatComments.length > 0 ? fetchedAparatComments : existingAparat;
          const finalYoutube = fetchedYoutubeComments.length > 0 ? fetchedYoutubeComments : existingYoutube;

          // ادغام و یکتاسازی بر اساس متن یا شناسه
          const mergedMap = new Map<string, SyncedComment>();
          [...finalYoutube, ...finalAparat].forEach((cmt) => {
            const key = `${cmt.platform}_${cmt.text.trim().toLowerCase()}`;
            if (!mergedMap.has(key)) {
              mergedMap.set(key, cmt);
            }
          });

          return {
            ...p,
            syncedComments: Array.from(mergedMap.values()),
          };
        })
      );

      const newContent = { ...content, photos: updatedPhotos };
      onUpdateContent(newContent);
      saveSiteContent(newContent);

      const successMsg = isFa
        ? `🎉 همگام‌سازی با موفقیت انجام شد!\n` +
          `• تعداد ویدیوهای بررسی‌شده: ${totalVideosScanned}\n` +
          `• نظرات دریافتی از آپارات (بدون API Key): ${totalAparatSynced} نظر\n` +
          (totalYtSynced > 0 ? `• نظرات دریافتی از یوتیوب: ${totalYtSynced} نظر\n` : '') +
          `تمامی نظرات در دیتای سایت ذخیره شدند و اکنون زیر ویدیوها در گالری قابل مشاهده هستند.`
        : `Comments synced successfully!\nScanned ${totalVideosScanned} videos.\nAparat: ${totalAparatSynced} comments.\nYouTube: ${totalYtSynced} comments.`;

      alert(successMsg);
    } catch (err: any) {
      alert((isFa ? 'خطا در همگام‌سازی کامنت‌ها: ' : 'Error: ') + err.message);
    } finally {
      setIsSyncingComments(false);
    }
  };

  /**
   * آپلود و انتشار دسته‌جمعی (Bulk Upload) بدون فراخوانی خودکار Gemini Vision
   */
  const handleBulkUploadSubmit = async () => {
    if (rawFiles.length === 0) {
      alert(isFa ? 'لطفاً ابتدا چند تصویر برای آپلود دسته‌جمعی انتخاب کنید.' : 'Please select files first.');
      return;
    }

    try {
      setIsBulkProcessing(true);
      setBulkUploadStatus(isFa ? `در حال پردازش و اعمال واترمارک برای ${rawFiles.length} اثر...` : `Processing ${rawFiles.length} items...`);
      const newItems: PhotoItem[] = [];

      for (let i = 0; i < rawFiles.length; i++) {
        const file = rawFiles[i];
        setBulkUploadStatus(isFa ? `در حال آپلود اثر ${i + 1} از ${rawFiles.length} (${file.name})...` : `Uploading ${i + 1}/${rawFiles.length}...`);

        let finalUrl = '';
        if (uploadToGitHubOption && githubToken.trim()) {
          const up = await uploadMediaToGitHub({
            file,
            token: githubToken.trim(),
            mainRepo: mainRepo.trim(),
            videoRepo: videoRepo.trim(),
            maxDimension: compressMaxDim,
            quality: compressQuality,
            watermark: { imageDataUrl: watermarkImg, opacity: watermarkOpacity, position: watermarkPosition },
          });
          finalUrl = up.url;
        } else {
          const comp = await compressImageToWebP(file, compressMaxDim, compressQuality, {
            imageDataUrl: watermarkImg,
            opacity: watermarkOpacity,
            position: watermarkPosition,
          });
          finalUrl = comp.dataUrl;
        }

        const inferred = inferTitlesFromFilename(file.name);
        const titleFa = bulkTitlePrefix ? `${bulkTitlePrefix} - ${inferred.titleFa}` : inferred.titleFa;
        const titleEn = bulkTitlePrefix ? `${bulkTitlePrefix} ${inferred.titleEn}` : inferred.titleEn;

        const isVid = file.type.startsWith('video/') || /\.(mp4|webm|mov)$/i.test(file.name);

        const item: PhotoItem = {
          id: `bulk-${Date.now()}-${i}`,
          titleFa,
          titleEn,
          category: bulkCategory,
          locationFa: bulkLocationFa || 'تهران',
          locationEn: bulkLocationEn || 'Tehran',
          year: photoYear || '1403',
          camera: photoCamera || (isVid ? 'Canon R8 & Gimbal' : 'Canon R8'),
          lens: photoLens || 'Canon EF 50mm f/1.8',
          imageUrl: finalUrl,
          videoUrl: isVid ? finalUrl : undefined,
          isVideo: isVid,
          videoQuality: isVid ? '4K Cinema 60fps' : undefined,
          exif: {
            focalLength: '50mm',
            aperture: 'f/4.0',
            shutter: '1/200s',
            iso: '100',
          },
          descriptionFa: photoDescFa || `ثبت صنعتی و تجاری اختصاصی توسط استودیو سینا ضرغامی`,
          descriptionEn: photoDescEn || 'Commercial capture by Sina Zarghami Studio',
          printAvailable: !isVid && photoPrintAvail,
          printPriceToman: photoPriceToman,
          printPriceUsd: photoPriceUsd,
          digitalAvailable: true,
          digitalPriceToman: 1200000,
          digitalPriceUsd: 25,
        };
        newItems.push(item);
      }

      const updatedContent = {
        ...content,
        photos: [...newItems, ...content.photos],
      };
      onUpdateContent(updatedContent);
      saveSiteContent(updatedContent);
      setRawFiles([]);
      setCompressedResults([]);
      alert(isFa ? `🎉 تعداد ${newItems.length} اثر با موفقیت و بدون مصرف توکن هوش مصنوعی منتشر شدند!` : `Published ${newItems.length} items without AI tokens!`);
    } catch (err: any) {
      alert((isFa ? 'خطا در آپلود دسته‌جمعی: ' : 'Error: ') + err.message);
    } finally {
      setIsBulkProcessing(false);
      setBulkUploadStatus(null);
    }
  };

  /**
   * دریافت فایل‌ها از دیالوگ یا درگ‌اند‌دراپ (عکس یا ویدیو)
   */
  const handleFilesChosen = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files || []);
    if (files.length === 0) return;

    // تشخیص ویدیو
    const video = files.find((f) => f.type.startsWith('video/') || /\.(mp4|webm|mov|mkv)$/i.test(f.name));
    if (video) {
      setSelectedVideoFile(video);
      const { titleFa, titleEn, category } = inferTitlesFromFilename(video.name);
      setPhotoCategory(category === 'landscape' ? 'video' : category);
      if (!photoTitleFa) setPhotoTitleFa(titleFa);
      if (!photoTitleEn) setPhotoTitleEn(titleEn);
    } else {
      setSelectedVideoFile(null);
    }

    // تشخیص تصاویر
    const imageFiles = files.filter(f => f.type.startsWith('image/') || /\.(webp|jpg|jpeg|png)$/i.test(f.name));
    if (imageFiles.length > 0) {
      setRawFiles(imageFiles);
      processSelectedFiles(imageFiles);
      if (!photoTitleFa && !video) {
        const { titleFa, titleEn, category } = inferTitlesFromFilename(imageFiles[0].name);
        setPhotoTitleFa(titleFa);
        setPhotoTitleEn(titleEn);
        setPhotoCategory(category);
      }
    }
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
    setPhotoGithubVideoUrl(photo.githubVideoUrl || photo.videoUrl || '');
    setPhotoAparatUrl(photo.aparatUrl || '');
    setPhotoYoutubeUrl(photo.youtubeUrl || '');
    setPhotoDefaultServer(photo.defaultServer || 'github');
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
    setPhotoGithubVideoUrl('');
    setPhotoAparatUrl('');
    setPhotoYoutubeUrl('');
    setPhotoDefaultServer('github');
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
      setGithubUploadProgress(null);
      setChunkedUploadProgress(null);
      let mainImageUrl = photoImageUrl;
      let mainVideoUrl = '';
      let isVideoMedia = photoCategory === 'video' || photoCategory === 'commercial-video' || Boolean(selectedVideoFile) || Boolean(photoGithubVideoUrl || photoAparatUrl || photoYoutubeUrl);
      let additionalImages: string[] = [];

      // ۱. اگر فایل ویدیویی توسط کاربر انتخاب شده باشد
      if (selectedVideoFile) {
        isVideoMedia = true;
        const sizeMB = selectedVideoFile.size / (1024 * 1024);

        if (uploadToGitHubOption && githubToken.trim()) {
          // اگر ویدیو سنگین‌تر از ۲۵ مگابایت باشد، آپلود تکه‌تکه (Chunked) انجام می‌شود
          if (sizeMB > 25) {
            setGithubUploadProgress(isFa ? `در حال آپلود تکه‌تکه ویدیو (${sizeMB.toFixed(1)} MB) به پوشه temp_raw ریپازیتوری ویدیو...` : 'Uploading chunked video to temp_raw...');
            const chunkRes = await uploadLargeVideoChunked({
              file: selectedVideoFile,
              token: githubToken.trim(),
              videoRepo: videoRepo.trim(),
              videoBaseUrl: videoBaseUrl.trim(),
              chunkSizeMB: 15,
              onProgress: (status, percent) => {
                setGithubUploadProgress(`${status} (${percent}%)`);
                setChunkedUploadProgress({ status, percent });
              },
            });
            mainImageUrl = chunkRes.mp4DirectUrl;
            mainVideoUrl = chunkRes.mp4DirectUrl;
          } else {
            setGithubUploadProgress(isFa ? 'در حال ارسال ویدیو به ریپازیتوری گیت‌هاب...' : 'Uploading video to GitHub...');
            const uploadRes = await uploadMediaToGitHub({
              file: selectedVideoFile,
              token: githubToken.trim(),
              mainRepo: mainRepo.trim(),
              videoRepo: videoRepo.trim(),
              videoBaseUrl: videoBaseUrl.trim(),
              forceVideoRepo: forceAllVideos,
              onProgress: (status) => setGithubUploadProgress(status),
            });
            mainImageUrl = uploadRes.url;
            mainVideoUrl = uploadRes.url;
          }
        } else {
          // در صورتی که توکن نبود، آدرس گیت‌هاب پیجز پیش‌فرض ساخته می‌شود
          const cleanName = selectedVideoFile.name.toLowerCase().replace(/\s+/g, '-');
          mainImageUrl = `${videoBaseUrl}${cleanName}`;
          mainVideoUrl = `${videoBaseUrl}${cleanName}`;
        }
      }
      // ۲. اگر کاربر فایل عکس انتخاب کرده باشد
      else if (compressedResults.length > 0) {
        if (uploadToGitHubOption && githubToken.trim()) {
          setGithubUploadProgress(isFa ? 'در حال بهینه‌سازی WebP همراه با حک امضای کاری و آپلود در مخزن اصلی...' : 'Uploading WebP with watermark to GitHub...');
          const uploadRes = await uploadMediaToGitHub({
            file: rawFiles[0],
            token: githubToken.trim(),
            mainRepo: mainRepo.trim(),
            videoRepo: videoRepo.trim(),
            maxDimension: compressMaxDim,
            quality: compressQuality,
            watermark: { imageDataUrl: watermarkImg, opacity: watermarkOpacity, position: watermarkPosition },
            onProgress: (status) => setGithubUploadProgress(status),
          });
          mainImageUrl = uploadRes.url;

          if (rawFiles.length > 1) {
            for (let i = 1; i < rawFiles.length; i++) {
              setGithubUploadProgress(`در حال بارگذاری تصویر ${i + 1} از ${rawFiles.length} در گیت‌هاب...`);
              const subUpload = await uploadMediaToGitHub({
                file: rawFiles[i],
                token: githubToken.trim(),
                mainRepo: mainRepo.trim(),
                videoRepo: videoRepo.trim(),
                maxDimension: compressMaxDim,
                quality: compressQuality,
                watermark: { imageDataUrl: watermarkImg, opacity: watermarkOpacity, position: watermarkPosition },
              });
              additionalImages.push(subUpload.url);
            }
          }
        } else if (uploadToCloud) {
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

      if (!mainImageUrl && !photoGithubVideoUrl && !photoAparatUrl && !photoYoutubeUrl) {
        alert(isFa ? 'لطفاً یک تصویر یا ویدیو بارگذاری کنید یا آدرس آن را وارد نمایید.' : 'Please provide an image or video.');
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
              category: photoCategory, // حفظ دقیق دسته‌بندی انتخابی کاربر اعم از صنعتی
              locationFa: photoLocationFa || p.locationFa,
              locationEn: photoLocationEn || p.locationEn,
              year: photoYear,
              camera: photoCamera,
              lens: photoLens,
              imageUrl: mainImageUrl || p.imageUrl,
              videoUrl: mainVideoUrl || photoGithubVideoUrl || p.videoUrl,
              githubVideoUrl: photoGithubVideoUrl || mainVideoUrl || p.githubVideoUrl,
              aparatUrl: photoAparatUrl || p.aparatUrl,
              youtubeUrl: photoYoutubeUrl || p.youtubeUrl,
              defaultServer: photoDefaultServer || p.defaultServer,
              isVideo: isVideoMedia || p.isVideo,
              galleryImages: additionalImages.length > 0 ? additionalImages : p.galleryImages,
              isAlbum: additionalImages.length > 0 ? true : p.isAlbum,
              descriptionFa: photoDescFa,
              descriptionEn: photoDescEn,
              printAvailable: isVideoMedia ? false : photoPrintAvail,
              printPriceToman: photoPriceToman,
              printPriceUsd: photoPriceUsd,
            };
          }
          return p;
        });

        const newContent = { ...content, photos: updatedPhotos };
        onUpdateContent(newContent);
        saveSiteContent(newContent);
        alert(isFa ? 'اثر با موفقیت ویرایش شد!' : 'Photo updated.');
      } else {
        // ایجاد اثر یا آلبوم جدید
        const newPhoto: PhotoItem = {
          id: `photo-${Date.now()}`,
          titleFa: photoTitleFa || (isVideoMedia ? 'پروژه ویدیویی و تیزر سینمایی' : isAlbum ? 'آلبوم عکس‌های تازه' : 'اثر عکاسی برگزیده'),
          titleEn: photoTitleEn || (isVideoMedia ? 'Cinematic Video Project' : isAlbum ? 'New Photo Monograph' : 'Selected Fine Art Photograph'),
          category: photoCategory, // بدون اورراید ناخواسته به video
          locationFa: photoLocationFa || 'ایران',
          locationEn: photoLocationEn || 'Iran',
          year: photoYear || '1403',
          imageUrl: mainImageUrl || (isVideoMedia ? 'https://images.unsplash.com/photo-1581091226825-a6a2a5aee158?auto=format&fit=crop&w=1600&q=80' : ''),
          videoUrl: mainVideoUrl || photoGithubVideoUrl || (isVideoMedia ? mainImageUrl : undefined),
          githubVideoUrl: photoGithubVideoUrl || mainVideoUrl || undefined,
          aparatUrl: photoAparatUrl || undefined,
          youtubeUrl: photoYoutubeUrl || undefined,
          defaultServer: photoDefaultServer,
          isVideo: isVideoMedia,
          videoQuality: isVideoMedia ? '4K Cinema 60fps' : undefined,
          videoDuration: isVideoMedia ? '01:30' : undefined,
          galleryImages: additionalImages,
          isAlbum: isAlbum,
          camera: photoCamera || (isVideoMedia ? 'GoPro Max 360 / Canon R8' : 'Canon R8'),
          lens: photoLens || (isVideoMedia ? 'Wide Cine Optics' : 'Canon EF 50mm f/1.8'),
          exif: {
            focalLength: '35mm',
            aperture: 'f/4.0',
            shutter: '1/250s',
            iso: '100',
          },
          descriptionFa: photoDescFa || (isVideoMedia ? 'پروژه تیزر و فیلمبرداری سینمایی اختصاصی سینا ضرغامی' : isAlbum ? `مجموعه شامل ${compressedResults.length} تصویر اختصاصی` : 'ثبت‌شده توسط سینا ضرغامی'),
          descriptionEn: photoDescEn || 'Captured by Sina Zarghami',
          printAvailable: isVideoMedia ? false : photoPrintAvail,
          printPriceToman: photoPriceToman,
          printPriceUsd: photoPriceUsd,
        };

        const newContent = { ...content, photos: [newPhoto, ...content.photos] };
        onUpdateContent(newContent);
        saveSiteContent(newContent);
        alert(isFa ? (isVideoMedia ? 'ویدیو سینمایی با موفقیت در گالری ثبت شد!' : isAlbum ? `آلبوم با ${1 + additionalImages.length} عکس منتشر شد!` : 'اثر در گالری ثبت گردید!') : 'Published!');
      }

      handleCancelEditPhoto();
      setSelectedVideoFile(null);
    } catch (err: any) {
      alert((isFa ? 'خطا در ثبت اثر: ' : 'Error: ') + err.message);
    } finally {
      setIsProcessing(false);
      setGithubUploadProgress(null);
    }
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
  // ۶. ذخیره متن‌ها، مشخصات و ۴ آمار کلیدی هیرو
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
                <span>{isFa ? 'گالری و آپلود ابری' : 'Photos & Cloud'}</span>
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
              <div className="p-4 sm:p-6 space-y-6">
                {/* ============================================================== */}
                {/* پنل معماری ذخیره‌سازی دو ریپازیتوری گیت‌هاب و همگام‌سازی خودکار */}
                {/* ============================================================== */}
                <div className="p-5 bg-gradient-to-br from-stone-900 via-stone-900 to-stone-950 text-white rounded-2xl border border-stone-800 shadow-md space-y-4">
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-stone-800/80 pb-3">
                    <div className="flex items-center gap-2.5">
                      <div className="w-9 h-9 rounded-xl bg-amber-500/20 text-amber-400 border border-amber-500/30 flex items-center justify-center shrink-0">
                        <Github className="w-5 h-5" />
                      </div>
                      <div>
                        <h4 className="text-sm font-bold text-stone-100 flex items-center gap-2">
                          <span>{isFa ? 'معماری دو ریپازیتوری گیت‌هاب (ذخیره‌سازی هوشمند و Auto-Discovery)' : 'Dual GitHub Repositories Architecture'}</span>
                          <span className="text-[10px] bg-emerald-500/20 text-emerald-400 border border-emerald-500/30 px-2 py-0.5 rounded-full font-mono">
                            Live Sync
                          </span>
                        </h4>
                        <p className="text-[11px] text-stone-400 mt-0.5">
                          {isFa
                            ? 'مسیردهی هوشمند بر اساس نوع و حجم فایل + شناسایی اتوماتیک فایل‌های آپلودشده بدون کپی لینک'
                            : 'Smart routing by media type & file size + zero-friction Auto-Discovery'}
                        </p>
                      </div>
                    </div>

                    <div className="flex items-center gap-2">
                      <button
                        type="button"
                        onClick={handleAutoDiscoverFromGitHub}
                        disabled={isDiscoveringGithub}
                        className="px-4 py-2 bg-gradient-to-r from-amber-600 to-amber-700 hover:from-amber-500 hover:to-amber-600 disabled:opacity-50 text-white text-xs font-bold rounded-xl transition-all shadow-md flex items-center gap-2 cursor-pointer shrink-0"
                      >
                        <RefreshCw className={`w-3.5 h-3.5 ${isDiscoveringGithub ? 'animate-spin' : ''}`} />
                        <span>{isDiscoveringGithub ? (isFa ? 'در حال اسکن گیت‌هاب...' : 'Discovering...') : (isFa ? 'همگام‌سازی خودکار با گیت‌هاب (Auto-Discovery)' : 'Auto-Discover from GitHub')}</span>
                      </button>

                      <button
                        type="button"
                        onClick={() => setShowRepoSettings(!showRepoSettings)}
                        className="p-2 text-stone-400 hover:text-white bg-stone-800 hover:bg-stone-700 rounded-xl transition-colors cursor-pointer text-xs"
                        title={isFa ? 'تنظیمات مخازن' : 'Settings'}
                      >
                        <Sliders className="w-4 h-4" />
                      </button>
                    </div>
                  </div>

                  {/* کارت وضعیت دو ریپازیتوری متصل */}
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-3 text-xs">
                    {/* ریپازیتوری اصلی عکس‌ها */}
                    <div className="p-3 bg-stone-850/80 rounded-xl border border-stone-800/80 space-y-1.5">
                      <div className="flex items-center justify-between">
                        <span className="font-bold text-stone-200 flex items-center gap-1.5">
                          <Images className="w-3.5 h-3.5 text-amber-400" />
                          <span>{isFa ? 'ریپازیتوری اصلی سایت (عکس‌ها):' : 'Main Repo (Photos):'}</span>
                        </span>
                        <a
                          href={`https://github.com/${mainRepo}`}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="text-[10px] text-amber-400 hover:underline flex items-center gap-0.5"
                        >
                          <span className="font-mono">{mainRepo}</span>
                          <ExternalLink className="w-2.5 h-2.5" />
                        </a>
                      </div>
                      <div className="text-[11px] text-stone-400 font-mono flex items-center justify-between">
                        <span>مسیر مقصد: <code className="text-stone-300">public/portfolio/</code></span>
                        <span className="text-emerald-400">فرمت WebP</span>
                      </div>
                    </div>

                    {/* ریپازیتوری ویدیوها */}
                    <div className="p-3 bg-stone-850/80 rounded-xl border border-stone-800/80 space-y-1.5">
                      <div className="flex items-center justify-between">
                        <span className="font-bold text-stone-200 flex items-center gap-1.5">
                          <Film className="w-3.5 h-3.5 text-red-400" />
                          <span>{isFa ? 'ریپازیتوری ویدیوها (GitHub Pages):' : 'Video Repo (GitHub Pages):'}</span>
                        </span>
                        <a
                          href={`https://github.com/${videoRepo}`}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="text-[10px] text-red-400 hover:underline flex items-center gap-0.5"
                        >
                          <span className="font-mono">{videoRepo}</span>
                          <ExternalLink className="w-2.5 h-2.5" />
                        </a>
                      </div>
                      <div className="text-[11px] text-stone-400 font-mono flex items-center justify-between">
                        <span>لینک پایه: <code className="text-stone-300">{videoBaseUrl}</code></span>
                        <span className="text-red-400">استریم 4K مستقیم</span>
                      </div>
                    </div>
                  </div>

                  {/* تنظیمات پیشرفته در صورت کلیک کاربر */}
                  {showRepoSettings && (
                    <div className="p-4 bg-stone-950/70 rounded-xl border border-stone-800 space-y-3 text-xs animate-in fade-in">
                      <div className="font-bold text-amber-400 mb-1">
                        {isFa ? 'تنظیمات نام مخازن و لینک پایه ویدیوها:' : 'Configure Repositories & Base URL:'}
                      </div>
                      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                        <div>
                          <label className="block text-[11px] text-stone-400 mb-1">{isFa ? 'مخزن اصلی سایت:' : 'Main Repo:'}</label>
                          <input
                            type="text"
                            value={mainRepo}
                            onChange={(e) => {
                              setMainRepoState(e.target.value);
                              saveMainRepo(e.target.value);
                            }}
                            className="w-full px-2.5 py-1.5 bg-stone-900 border border-stone-700 rounded-lg text-white font-mono text-xs"
                          />
                        </div>
                        <div>
                          <label className="block text-[11px] text-stone-400 mb-1">{isFa ? 'مخزن ویدیوها:' : 'Video Repo:'}</label>
                          <input
                            type="text"
                            value={videoRepo}
                            onChange={(e) => {
                              setVideoRepoState(e.target.value);
                              saveVideoRepo(e.target.value);
                            }}
                            className="w-full px-2.5 py-1.5 bg-stone-900 border border-stone-700 rounded-lg text-white font-mono text-xs"
                          />
                        </div>
                        <div>
                          <label className="block text-[11px] text-stone-400 mb-1">{isFa ? 'آدرس پایه GitHub Pages ویدیوها:' : 'Video Base URL:'}</label>
                          <input
                            type="text"
                            value={videoBaseUrl}
                            onChange={(e) => {
                              setVideoBaseUrlState(e.target.value);
                              saveVideoBaseUrl(e.target.value);
                            }}
                            className="w-full px-2.5 py-1.5 bg-stone-900 border border-stone-700 rounded-lg text-white font-mono text-xs"
                          />
                        </div>
                      </div>

                      <div className="flex flex-wrap items-center gap-4 pt-1 text-[11px] text-stone-300">
                        <label className="flex items-center gap-1.5 cursor-pointer">
                          <input
                            type="checkbox"
                            checked={forceAllVideos}
                            onChange={(e) => {
                              setForceAllVideos(e.target.checked);
                              saveForceAllVideosToVideoRepo(e.target.checked);
                            }}
                            className="rounded text-amber-500"
                          />
                          <span>{isFa ? 'انتقال تمام ویدیوها به ریپازیتوری دوم (szarghami/video-portfolio) جهت دور زدن محدودیت کلودفلر' : 'Route all videos to video repo'}</span>
                        </label>
                      </div>
                    </div>
                  )}

                  {/* فیلد توکن گیت‌هاب (Personal Access Token) */}
                  <div className="pt-2 border-t border-stone-800/80">
                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 text-xs">
                      <div className="flex items-center gap-2">
                        <KeyRound className="w-4 h-4 text-amber-400 shrink-0" />
                        <span className="font-bold text-stone-200">
                          {isFa ? 'توکن دسترسی شخصی گیت‌هاب (GitHub Personal Access Token):' : 'GitHub Token:'}
                        </span>
                        {githubToken.trim() && (
                          <span className="text-[10px] bg-emerald-950 text-emerald-400 border border-emerald-800 px-2 py-0.5 rounded-full font-mono">
                            ذخیره‌شده در مرورگر ✓
                          </span>
                        )}
                      </div>

                      <div className="relative flex-1 sm:max-w-md flex items-center gap-2">
                        <div className="relative flex-1">
                          <input
                            type={showGithubToken ? 'text' : 'password'}
                            value={githubToken}
                            onChange={(e) => {
                              setGithubToken(e.target.value);
                              saveGitHubToken(e.target.value);
                            }}
                            placeholder="ghp_xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx"
                            className="w-full px-3 py-1.5 pr-8 bg-stone-950 border border-stone-700 rounded-lg text-white font-mono text-xs focus:border-amber-500 focus:outline-none"
                          />
                          <button
                            type="button"
                            onClick={() => setShowGithubToken(!showGithubToken)}
                            className="absolute right-2 top-1.5 text-stone-400 hover:text-white"
                          >
                            {showGithubToken ? <EyeOff className="w-3.5 h-3.5" /> : <Eye className="w-3.5 h-3.5" />}
                          </button>
                        </div>
                        <button
                          type="button"
                          onClick={() => {
                            saveGitHubToken(githubToken);
                            alert(isFa ? 'توکن گیت‌هاب با موفقیت در مرورگر شما ذخیره شد!' : 'Token saved!');
                          }}
                          className="px-3 py-1.5 bg-stone-800 hover:bg-stone-700 text-stone-200 text-xs font-bold rounded-lg cursor-pointer whitespace-nowrap"
                        >
                          {isFa ? 'ذخیره' : 'Save'}
                        </button>
                      </div>
                    </div>
                  </div>

                  {/* نوار وضعیت یا لاگ زنده شناسایی */}
                  {discoveryLog && (
                    <div className="p-3 bg-stone-950/80 rounded-xl border border-amber-500/40 text-xs text-amber-200 font-mono animate-in fade-in flex items-center justify-between gap-2">
                      <div className="flex items-center gap-2">
                        <Sparkles className="w-4 h-4 text-amber-400 shrink-0" />
                        <span>{discoveryLog}</span>
                      </div>
                      <button
                        type="button"
                        onClick={() => setDiscoveryLog(null)}
                        className="text-stone-400 hover:text-white text-[11px]"
                      >
                        ✕
                      </button>
                    </div>
                  )}

                  {githubUploadProgress && (
                    <div className="p-3 bg-amber-950/60 border border-amber-600/50 rounded-xl text-xs text-amber-200 font-mono flex items-center gap-2 animate-pulse">
                      <RefreshCw className="w-4 h-4 animate-spin text-amber-400" />
                      <span>{githubUploadProgress}</span>
                    </div>
                  )}
                </div>

                {/* بخش دو ستونه: آپلود دسته‌ای در چپ، تنظیمات فشرده‌سازی همزمان در راست */}
                <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
                  {/* ستون اول: بارگذاری فایل‌ها */}
                  <div className="lg:col-span-7 bg-stone-50 p-5 rounded-2xl border border-stone-200 space-y-4">
                    <div className="flex items-center justify-between">
                      <h4 className="text-sm font-bold text-stone-900 flex items-center gap-2">
                        <Images className="w-4 h-4 text-amber-700" />
                        <span>{isFa ? 'انتخاب عکس، ویدیو یا آلبوم' : 'Upload Media (Photo/Video)'}</span>
                      </h4>
                      <div className="flex items-center gap-3">
                        <label className="flex items-center gap-1.5 text-xs text-stone-700 cursor-pointer">
                          <input
                            type="checkbox"
                            checked={uploadToGitHubOption}
                            onChange={(e) => setUploadToGitHubOption(e.target.checked)}
                            className="rounded text-amber-700 focus:ring-amber-600"
                          />
                          <span className="font-bold text-amber-900">{isFa ? 'آپلود مستقیم در گیت‌هاب' : 'GitHub Routing'}</span>
                        </label>
                        <label className="flex items-center gap-1.5 text-xs text-stone-500 cursor-pointer">
                          <input
                            type="checkbox"
                            checked={uploadToCloud}
                            onChange={(e) => setUploadToCloud(e.target.checked)}
                            className="rounded text-amber-700 focus:ring-amber-600"
                          />
                          <span>{isFa ? 'باکت پشتیبان' : 'Backup Bucket'}</span>
                        </label>
                      </div>
                    </div>

                    <input
                      ref={fileInputRef}
                      type="file"
                      multiple
                      accept="image/*,video/*"
                      onChange={handleFilesChosen}
                      className="hidden"
                    />

                    <div
                      onClick={() => fileInputRef.current?.click()}
                      className="p-6 bg-white rounded-xl border-2 border-dashed border-stone-300 hover:border-amber-700 transition-colors text-center cursor-pointer space-y-2 group"
                    >
                      <Upload className="w-8 h-8 text-stone-400 group-hover:text-amber-700 mx-auto transition-colors" />
                      <div className="text-xs font-bold text-stone-800">
                        {isFa ? 'کلیک کنید یا فایل‌ها را بکشید (عکس، تیزر ویدیویی، آلبوم)' : 'Click or drop photos or videos here'}
                      </div>
                      <p className="text-[11px] text-stone-400">
                        {isFa ? 'تبدیل خودکار عکس به WebP و هدایت خودکار ویدیو به مخزن video-portfolio' : 'Auto WebP for photos & video routing'}
                      </p>
                    </div>

                    {/* پیش‌نمایش فایل ویدیویی انتخاب‌شده */}
                    {selectedVideoFile && (
                      <div className="p-3.5 bg-red-50/80 rounded-xl border border-red-200 text-xs flex items-center justify-between gap-3">
                        <div className="flex items-center gap-3 overflow-hidden">
                          <div className="w-10 h-10 rounded-lg bg-red-600 text-white flex items-center justify-center shrink-0">
                            <Video className="w-5 h-5" />
                          </div>
                          <div className="truncate">
                            <div className="font-bold text-red-950 truncate">{selectedVideoFile.name}</div>
                            <div className="text-[11px] text-red-700 font-mono">
                              حجم: {(selectedVideoFile.size / (1024 * 1024)).toFixed(1)} MB · مقصد: {forceAllVideos || (selectedVideoFile.size / (1024 * 1024) > 25) ? 'ریپازیتوری اختصاصی ویدیو (szarghami/video-portfolio)' : 'ریپازیتوری اصلی'}
                            </div>
                          </div>
                        </div>
                        <button
                          type="button"
                          onClick={() => setSelectedVideoFile(null)}
                          className="text-[11px] text-red-600 hover:underline cursor-pointer shrink-0"
                        >
                          {isFa ? 'حذف ویدیو' : 'Clear'}
                        </button>
                      </div>
                    )}

                    {/* پیش‌نمایش بندانگشتی عکس‌های انتخاب‌شده */}
                    {compressedResults.length > 0 && (
                      <div className="space-y-2 pt-2">
                        <div className="flex items-center justify-between text-xs font-bold text-stone-700">
                          <span>{isFa ? `پیش‌نمایش خروجی فشرده‌شده (${compressedResults.length} تصویر WebP):` : 'Compressed Previews:'}</span>
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

                  {/* ستون دوم: تنظیمات زنده فشرده‌سازی در همان لحظه همراه با سیستم امضای کاری و پیش‌نمایش Canvas */}
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

                      {/* ============================================================== */}
                      {/* سیستم امضای کاری (Watermark PNG) با پیش‌نمایش زنده Canvas */}
                      {/* ============================================================== */}
                      <div className="pt-3 border-t border-stone-200/90 space-y-3">
                        <div className="flex items-center justify-between">
                          <span className="font-bold text-stone-800 flex items-center gap-1.5 text-xs">
                            <ImageIcon className="w-3.5 h-3.5 text-amber-700" />
                            <span>{isFa ? 'سیستم امضای کاری (Watermark PNG):' : 'Work Signature (Watermark):'}</span>
                          </span>
                          <div className="flex items-center gap-1.5">
                            <button
                              type="button"
                              onClick={() => watermarkInputRef.current?.click()}
                              className="px-2 py-1 bg-amber-100 hover:bg-amber-200 text-amber-900 rounded-md text-[10px] font-bold cursor-pointer transition-colors"
                            >
                              {isFa ? 'آپلود watermark.png' : 'Upload PNG'}
                            </button>
                            <button
                              type="button"
                              onClick={handleResetWatermark}
                              className="px-2 py-1 bg-stone-200 hover:bg-stone-300 text-stone-700 rounded-md text-[10px] cursor-pointer transition-colors"
                            >
                              {isFa ? 'پیش‌فرض' : 'Reset'}
                            </button>
                          </div>
                        </div>

                        <input
                          ref={watermarkInputRef}
                          type="file"
                          accept="image/png,image/webp,image/svg+xml"
                          onChange={handleWatermarkUpload}
                          className="hidden"
                        />

                        {/* اسلایدر درصد شفافیت امضا 0% تا 100% (پیش‌فرض 15%) */}
                        <div>
                          <div className="flex justify-between font-medium text-stone-700 mb-1 text-[11px]">
                            <span>{isFa ? 'درصد شفافیت امضا (Opacity):' : 'Watermark Opacity:'}</span>
                            <span className="font-mono text-amber-800 font-bold">{Math.round(watermarkOpacity * 100)}%</span>
                          </div>
                          <input
                            type="range"
                            min="0"
                            max="1"
                            step="0.05"
                            value={watermarkOpacity}
                            onChange={(e) => {
                              const val = parseFloat(e.target.value);
                              setWatermarkOpacity(val);
                              saveWatermarkOpacity(val);
                            }}
                            className="w-full accent-amber-700 cursor-pointer"
                          />
                        </div>

                        {/* موقعیت امضا در کادر */}
                        <div>
                          <span className="block text-[11px] text-stone-600 mb-1">{isFa ? 'موقعیت امضا روی تصویر:' : 'Position:'}</span>
                          <div className="grid grid-cols-3 gap-1 text-[10px]">
                            {[
                              { id: 'bottom-right', label: isFa ? 'پایین راست' : 'Bottom Right' },
                              { id: 'bottom-left', label: isFa ? 'پایین چپ' : 'Bottom Left' },
                              { id: 'center', label: isFa ? 'مرکز کادر' : 'Center' },
                              { id: 'top-right', label: isFa ? 'بالا راست' : 'Top Right' },
                              { id: 'top-left', label: isFa ? 'بالا چپ' : 'Top Left' },
                            ].map((pos) => (
                              <button
                                key={pos.id}
                                type="button"
                                onClick={() => {
                                  setWatermarkPosition(pos.id as any);
                                  saveWatermarkPosition(pos.id as any);
                                }}
                                className={`px-2 py-1 rounded text-center cursor-pointer transition-colors ${
                                  watermarkPosition === pos.id
                                    ? 'bg-amber-700 text-white font-bold'
                                    : 'bg-white border border-stone-200 text-stone-600 hover:bg-stone-100'
                                }`}
                              >
                                {pos.label}
                              </button>
                            ))}
                          </div>
                        </div>

                        {/* پیش‌نمایش زنده Canvas */}
                        <div className="space-y-1">
                          <div className="flex items-center justify-between text-[10px] text-stone-500">
                            <span>{isFa ? 'پیش‌نمایش زنده Canvas (اعمال لحظه‌ای):' : 'Live Canvas Preview:'}</span>
                            <span className="text-emerald-700 font-mono font-bold">حک خودکار روی WebP ✓</span>
                          </div>
                          <div className="rounded-xl overflow-hidden border border-stone-300 bg-stone-900 shadow-inner flex items-center justify-center p-1">
                            <canvas
                              ref={previewCanvasRef}
                              className="w-full h-auto max-h-44 object-contain rounded-lg"
                            />
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>

                {/* ============================================================== */}
                {/* سوئیچ حالت کاری استودیو: آپلود تکی با پیشنهاد هوش مصنوعی یا آپلود دسته‌جمعی بدون مصرف توکن */}
                {/* ============================================================== */}
                <div className="flex flex-col sm:flex-row sm:items-center justify-between p-3.5 bg-stone-100 rounded-xl border border-stone-200 gap-3">
                  <div className="flex items-center gap-2">
                    <Layers className="w-4 h-4 text-amber-700" />
                    <div>
                      <span className="text-xs font-bold text-stone-800 block">
                        {isFa ? 'حالت کاری انتشار آثار استودیو:' : 'Publishing Mode:'}
                      </span>
                      <span className="text-[10px] text-stone-500">
                        {isFa ? 'امکان آپلود سریع دسته‌ای بدون مصرف توکن یا بررسی تکی با هوش مصنوعی' : 'Switch between single curation or bulk token-free uploads'}
                      </span>
                    </div>
                  </div>
                  <div className="flex items-center gap-1 bg-white p-1 rounded-lg border border-stone-200 text-xs">
                    <button
                      type="button"
                      onClick={() => setIsBulkMode(false)}
                      className={`px-3 py-1.5 rounded-md font-bold transition-all cursor-pointer ${
                        !isBulkMode ? 'bg-amber-700 text-white shadow-xs' : 'text-stone-600 hover:text-stone-900'
                      }`}
                    >
                      {isFa ? 'آپلود تک‌اثر (همراه با پیشنهاد هوش مصنوعی)' : 'Single Photo + AI'}
                    </button>
                    <button
                      type="button"
                      onClick={() => setIsBulkMode(true)}
                      className={`px-3 py-1.5 rounded-md font-bold transition-all cursor-pointer flex items-center gap-1 ${
                        isBulkMode ? 'bg-amber-700 text-white shadow-xs' : 'text-stone-600 hover:text-stone-900'
                      }`}
                    >
                      <span>⚡</span>
                      <span>{isFa ? 'آپلود دسته‌جمعی (Bulk - بدون توکن هوش مصنوعی)' : 'Bulk Upload (Zero AI)'}</span>
                    </button>
                  </div>
                </div>

                {/* پنل آپلود دسته‌جمعی بدون مصرف توکن هوش مصنوعی */}
                {isBulkMode && (
                  <div className="p-5 bg-gradient-to-r from-amber-50/70 via-stone-50 to-orange-50/60 rounded-2xl border border-amber-300 shadow-xs space-y-4 text-xs animate-in fade-in">
                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-amber-200/80 pb-3">
                      <div>
                        <h4 className="font-bold text-stone-900 text-sm flex items-center gap-2">
                          <Layers className="w-4 h-4 text-amber-700" />
                          <span>{isFa ? 'انتشار دسته‌جمعی و سریع آثار بدون فراخوانی Gemini Vision' : 'Zero-Token Bulk Upload Studio'}</span>
                        </h4>
                        <p className="text-[11px] text-stone-600 mt-0.5">
                          {isFa
                            ? 'برای حفظ توکن‌های رایگان هوش مصنوعی و انتشار همزمان ده‌ها تصویر، دسته‌بندی و پیشوند عنوان را مشخص کرده و با یک کلیک منتشر نمایید.'
                            : 'Upload multiple assets at once with no AI API consumption.'}
                        </p>
                      </div>
                      <div className="text-left font-mono text-amber-800 font-bold bg-white px-3 py-1.5 rounded-lg border border-amber-200">
                        {rawFiles.length} {isFa ? 'فایل انتخاب‌شده' : 'files selected'}
                      </div>
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                      <div>
                        <label className="block font-bold text-stone-700 mb-1">{isFa ? 'پیشوند عنوان آثار (اختیاری):' : 'Title Prefix:'}</label>
                        <input
                          type="text"
                          value={bulkTitlePrefix}
                          onChange={(e) => setBulkTitlePrefix(e.target.value)}
                          placeholder="مثال: کالکشن چرم و کفش دست‌دوز"
                          className="w-full px-3 py-2 border border-stone-300 rounded-lg bg-white"
                        />
                      </div>
                      <div>
                        <label className="block font-bold text-stone-700 mb-1">{isFa ? 'دسته‌بندی صنعتی برای همه آثار:' : 'Bulk Category:'}</label>
                        <select
                          value={bulkCategory}
                          onChange={(e) => setBulkCategory(e.target.value as any)}
                          className="w-full px-3 py-2 border border-stone-300 rounded-lg bg-white font-medium"
                        >
                          <option value="commercial-shoes">{isFa ? 'عکاسی صنعتی کفش (Footwear & Shoes)' : 'Commercial Shoes'}</option>
                          <option value="commercial-jewelry">{isFa ? 'عکاسی صنعتی جواهرات (Jewelry & Gems)' : 'Commercial Jewelry'}</option>
                          <option value="commercial-video">{isFa ? 'تیزر و ویدیوی صنعتی (Industrial Video)' : 'Commercial Video'}</option>
                          <option value="video">{isFa ? 'ویدیو و تیزر سینمایی (Cinematography)' : 'Video'}</option>
                          <option value="landscape">{isFa ? 'چشم‌انداز و کویر (Landscape)' : 'Landscape'}</option>
                          <option value="aerial">{isFa ? 'دید ۳۶۰ و هوایی (Aerial)' : 'Aerial'}</option>
                          <option value="portrait">{isFa ? 'هایپرمکرو و چهره (Macro & Portrait)' : 'Macro & Portrait'}</option>
                          <option value="architecture">{isFa ? 'صنعتی و معماری (Architecture)' : 'Architecture'}</option>
                          <option value="documentary">{isFa ? 'مستند سفر (Documentary)' : 'Documentary'}</option>
                        </select>
                      </div>
                      <div>
                        <label className="block font-bold text-stone-700 mb-1">{isFa ? 'موقعیت مکانی ثبت:' : 'Location:'}</label>
                        <input
                          type="text"
                          value={bulkLocationFa}
                          onChange={(e) => setBulkLocationFa(e.target.value)}
                          placeholder="تهران، استودیو صنعتی"
                          className="w-full px-3 py-2 border border-stone-300 rounded-lg bg-white"
                        />
                      </div>
                    </div>

                    {bulkUploadStatus && (
                      <div className="p-3 bg-amber-100 text-amber-900 border border-amber-300 rounded-xl text-xs font-mono flex items-center gap-2">
                        <RefreshCw className="w-4 h-4 animate-spin text-amber-700" />
                        <span>{bulkUploadStatus}</span>
                      </div>
                    )}

                    <div className="pt-2 flex items-center justify-end">
                      <button
                        type="button"
                        onClick={handleBulkUploadSubmit}
                        disabled={isBulkProcessing || rawFiles.length === 0}
                        className="w-full sm:w-auto px-6 py-3 bg-gradient-to-r from-amber-700 to-amber-600 hover:from-amber-600 hover:to-amber-500 disabled:opacity-50 text-white font-bold rounded-xl transition-all shadow-md flex items-center justify-center gap-2 cursor-pointer"
                      >
                        <Layers className="w-4 h-4" />
                        <span>
                          {isBulkProcessing
                            ? (isFa ? 'در حال انتشار دسته‌جمعی...' : 'Processing Bulk Upload...')
                            : (isFa ? `انتشار دسته‌جمعی ${rawFiles.length} اثر بدون مصرف هوش مصنوعی` : `Publish ${rawFiles.length} Items (Zero AI)`)}
                        </span>
                      </button>
                    </div>
                  </div>
                )}

                {/* کارت پیشنهاد هوشمند عنوان، موضوع و داستان با جمینای (فقط در حالت تکی) */}
                {!isBulkMode && (
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
                )}

                {/* ============================================================== */}
                {/* پنل آپلود تکه‌تکه (Chunked Upload) و ورک‌فلو پردازش ابری FFmpeg HLS */}
                {/* ============================================================== */}
                <div className="p-5 bg-gradient-to-br from-stone-900 to-stone-950 text-white rounded-2xl border border-stone-800 shadow-md space-y-4 text-xs">
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-stone-800 pb-3">
                    <div className="flex items-center gap-2.5">
                      <div className="w-9 h-9 rounded-xl bg-red-600/20 text-red-400 border border-red-500/30 flex items-center justify-center shrink-0">
                        <Video className="w-5 h-5" />
                      </div>
                      <div>
                        <h4 className="text-sm font-bold text-stone-100 flex items-center gap-2">
                          <span>{isFa ? 'سیستم آپلود تکه‌تکه (Chunked) و تبدیل خودکار ویدیوهای سنگین (۲۰۰ تا ۵۰۰ مگابایت)' : 'Chunked Video & Automated FFmpeg Pipeline'}</span>
                          <span className="text-[10px] bg-red-500/20 text-red-400 border border-red-500/30 px-2 py-0.5 rounded-full font-mono">
                            HLS Stream
                          </span>
                        </h4>
                        <p className="text-[11px] text-stone-400 mt-0.5">
                          {isFa
                            ? 'تقسیم خودکار به قطعات ۱۵ مگابایتی (File.slice) جهت عبور از سقف ۱۰۰ مگابایت گیت‌هاب + اکشن پس‌زمینه با FFmpeg'
                            : 'Bypass GitHub 100MB limit with 15MB chunks + auto background processing'}
                        </p>
                      </div>
                    </div>

                    <div className="flex items-center gap-2">
                      <button
                        type="button"
                        onClick={handleDeployWorkflow}
                        disabled={isDeployingWorkflow}
                        className="px-3.5 py-2 bg-gradient-to-r from-red-700 to-red-600 hover:from-red-600 hover:to-red-500 text-white text-xs font-bold rounded-xl transition-all shadow-sm flex items-center gap-1.5 cursor-pointer disabled:opacity-50 shrink-0"
                      >
                        <RefreshCw className={`w-3.5 h-3.5 ${isDeployingWorkflow ? 'animate-spin' : ''}`} />
                        <span>{isDeployingWorkflow ? (isFa ? 'در حال ارسال...' : 'Deploying...') : (isFa ? 'ارسال خودکار فایل ورک‌فلو به ریپازیتوری' : 'Deploy Workflow to GitHub')}</span>
                      </button>

                      <button
                        type="button"
                        onClick={() => setShowWorkflowCodeModal(true)}
                        className="px-3 py-2 bg-stone-800 hover:bg-stone-700 text-stone-300 text-xs font-bold rounded-xl transition-colors cursor-pointer flex items-center gap-1.5"
                      >
                        <Code2 className="w-3.5 h-3.5 text-amber-400" />
                        <span>{isFa ? 'مشاهده کد YAML' : 'View YAML'}</span>
                      </button>
                    </div>
                  </div>

                  {workflowDeployMsg && (
                    <div className="p-3 bg-stone-850 border border-amber-500/40 rounded-xl text-amber-200 text-xs font-mono">
                      {workflowDeployMsg}
                    </div>
                  )}

                  {chunkedUploadProgress && (
                    <div className="p-3.5 bg-stone-950 rounded-xl border border-red-500/50 space-y-2">
                      <div className="flex justify-between items-center text-[11px]">
                        <span className="text-red-300 font-bold">{chunkedUploadProgress.status}</span>
                        <span className="font-mono text-white font-bold">{chunkedUploadProgress.percent}%</span>
                      </div>
                      <div className="w-full bg-stone-800 h-2.5 rounded-full overflow-hidden">
                        <div
                          className="bg-gradient-to-r from-red-600 to-amber-500 h-full transition-all duration-300"
                          style={{ width: `${chunkedUploadProgress.percent}%` }}
                        />
                      </div>
                    </div>
                  )}

                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5 text-[11px] text-stone-300">
                    <div className="p-2.5 bg-stone-850/60 rounded-lg border border-stone-800">
                      <span className="font-bold text-amber-400 block mb-0.5">۱. تقسیم به قطعات ۱۵MB:</span>
                      <span>ویدیو بدون هنگ مرورگر به فایل‌های موقت در <code className="text-stone-300">temp_raw/</code> ارسال می‌شود.</span>
                    </div>
                    <div className="p-2.5 bg-stone-850/60 rounded-lg border border-stone-800">
                      <span className="font-bold text-amber-400 block mb-0.5">۲. سیگنال READY_TO_PROCESS:</span>
                      <span>ایجاد خودکار فایل جهت فعال‌سازی گیت‌هاب اکشن در پس‌زمینه.</span>
                    </div>
                    <div className="p-2.5 bg-stone-850/60 rounded-lg border border-stone-800">
                      <span className="font-bold text-amber-400 block mb-0.5">۳. تبدیل به HLS و استریم:</span>
                      <span>تبدیل به m3u8 و ts زیر ۱۰ مگابایت و پاکسازی تاریخچه با Orphan Commit.</span>
                    </div>
                  </div>
                </div>

                {/* ============================================================== */}
                {/* پنل زیرساخت نظرات یوتیوب و آپارات */}
                {/* ============================================================== */}
                <div className="p-5 bg-gradient-to-br from-stone-900 to-stone-950 text-white rounded-2xl border border-stone-800 shadow-md space-y-4 text-xs">
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-stone-800 pb-3">
                    <div className="flex items-center gap-2.5">
                      <div className="w-9 h-9 rounded-xl bg-pink-600/20 text-pink-400 border border-pink-500/30 flex items-center justify-center shrink-0">
                        <MessageSquare className="w-5 h-5" />
                      </div>
                      <div>
                        <h4 className="text-sm font-bold text-stone-100 flex items-center gap-2">
                          <span>{isFa ? 'زیرساخت نظرات همگام‌سازی‌شده یوتیوب و آپارات' : 'YouTube & Aparat Synced Comments'}</span>
                          <span className="text-[10px] bg-amber-500/20 text-amber-400 border border-amber-500/30 px-2 py-0.5 rounded-full font-mono">
                            بدون فیلترشکن
                          </span>
                        </h4>
                        <p className="text-[11px] text-stone-400 mt-0.5">
                          {isFa
                            ? 'نظرات دریافتی در یوتیوب و آپارات به صورت مستقیم در دیتای سایت ذخیره شده و برای کاربران ایرانی بدون نیاز به فیلترشکن به نمایش درمی‌آیند.'
                            : 'Sync comments to site storage for seamless viewing inside Iran.'}
                        </p>
                      </div>
                    </div>

                    <button
                      type="button"
                      onClick={handleSyncSocialComments}
                      disabled={isSyncingComments}
                      className="px-4 py-2 bg-gradient-to-r from-pink-700 via-red-600 to-amber-600 hover:opacity-90 disabled:opacity-50 text-white text-xs font-bold rounded-xl transition-all shadow-md flex items-center gap-2 cursor-pointer shrink-0"
                    >
                      <RefreshCw className={`w-3.5 h-3.5 ${isSyncingComments ? 'animate-spin' : ''}`} />
                      <span>{isSyncingComments ? (isFa ? 'در حال دریافت نظرات...' : 'Syncing...') : (isFa ? 'همگام‌سازی کامنت‌های یوتیوب و آپارات' : 'Sync Comments Now')}</span>
                    </button>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
                    <div className="p-3 bg-stone-950/70 rounded-xl border border-stone-800 space-y-1.5">
                      <div className="flex items-center justify-between">
                        <span className="font-bold text-pink-400 flex items-center gap-1.5">
                          <span>🇮🇷</span>
                          <span>{isFa ? 'وب‌سرویس عمومی آپارات (بدون نیاز به API Key):' : 'Aparat Public API (No Key Needed):'}</span>
                        </span>
                        <span className="text-[10px] bg-emerald-950 text-emerald-400 border border-emerald-800 px-2 py-0.5 rounded-full font-mono">
                          خودکار با CORS Proxy ✓
                        </span>
                      </div>
                      <p className="text-[11px] text-stone-300 leading-relaxed">
                        {isFa
                          ? 'کامنت‌ها به صورت خودکار با شناسه ویدیو (uid) از آدرس عمومی aparat.com/api/fa/v1/video/comment/list/videohash/[uid] فراخوانی و ذخیره می‌شوند.'
                          : 'Auto-fetched via CORS proxy using videohash [uid] with zero credentials.'}
                      </p>
                    </div>

                    <div className="p-3 bg-stone-950/70 rounded-xl border border-stone-800 space-y-1.5">
                      <label className="block text-[11px] font-bold text-red-400 mb-1 flex items-center gap-1.5">
                        <Play className="w-3 h-3 text-red-500 fill-red-500" />
                        <span>{isFa ? 'کلید API یوتیوب (اختیاری برای نظرات یوتیوب):' : 'YouTube Data API v3 Key (Optional):'}</span>
                      </label>
                      <input
                        type="password"
                        value={youtubeApiKey}
                        onChange={(e) => {
                          setYoutubeApiKey(e.target.value);
                          if (typeof window !== 'undefined') localStorage.setItem('sina_youtube_api_key', e.target.value);
                        }}
                        placeholder="AIzaSy... (اختیاری)"
                        className="w-full px-3 py-1.5 bg-stone-900 border border-stone-700 rounded-lg text-white font-mono text-xs focus:border-amber-500 focus:outline-none"
                      />
                      <span className="text-[10px] text-stone-500 block">
                        {isFa ? 'در صورت خالی بودن، نظرات قبلی یوتیوب حفظ می‌شوند.' : 'Existing YouTube comments are preserved if empty.'}
                      </span>
                    </div>
                  </div>
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
                        className="w-full px-3 py-2 border border-stone-300 rounded-lg bg-white font-medium"
                      >
                        <option value="commercial-shoes">{isFa ? 'عکاسی صنعتی کفش (Footwear & Shoes)' : 'Commercial Shoes'}</option>
                        <option value="commercial-jewelry">{isFa ? 'عکاسی صنعتی جواهرات (Jewelry & Gems)' : 'Commercial Jewelry'}</option>
                        <option value="commercial-video">{isFa ? 'تیزر و ویدیوی صنعتی (Industrial Video)' : 'Commercial Video'}</option>
                        <option value="video">{isFa ? 'ویدیو و تیزر سینمایی (Cinematography & Video)' : 'Video & Cinematography'}</option>
                        <option value="landscape">{isFa ? 'چشم‌انداز و کویر (Landscape)' : 'Landscape'}</option>
                        <option value="aerial">{isFa ? 'دید ۳۶۰ و هوایی (Aerial & Drone)' : 'Aerial'}</option>
                        <option value="architecture">{isFa ? 'معماری و ساختارها (Architecture)' : 'Architecture'}</option>
                        <option value="documentary">{isFa ? 'مستند و پرتره (Documentary)' : 'Documentary'}</option>
                        <option value="portrait">{isFa ? 'پرتره و هایپرمکرو (Portrait & Macro)' : 'Portrait & Macro'}</option>
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

                  {/* تنظیمات پلیر چندسروره برای نمونه‌کار (گیت‌هاب + آپارات + یوتیوب) */}
                  <div className="p-4 bg-stone-50 rounded-xl border border-stone-200 space-y-3">
                    <div className="flex items-center justify-between border-b border-stone-200 pb-2">
                      <div className="font-bold text-stone-800 text-xs flex items-center gap-1.5">
                        <Server className="w-3.5 h-3.5 text-amber-700" />
                        <span>{isFa ? 'تنظیمات پلیر چندسروره هوشمند (گیت‌هاب + آپارات + یوتیوب):' : 'Smart Multi-Server Video Player:'}</span>
                      </div>
                      <span className="text-[10px] text-stone-500 font-mono">سوییچ خودکار ۴ ثانیه‌ای در سایت</span>
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                      <div>
                        <label className="block text-[11px] font-bold text-stone-700 mb-1 flex items-center gap-1">
                          <Radio className="w-3 h-3 text-amber-600" />
                          <span>{isFa ? 'سرور اصلی گیت‌هاب (Direct MP4 / HLS):' : 'GitHub Primary:'}</span>
                        </label>
                        <input
                          type="text"
                          value={photoGithubVideoUrl}
                          onChange={(e) => setPhotoGithubVideoUrl(e.target.value)}
                          placeholder="https://szarghami.github.io/video-portfolio/video.mp4"
                          className="w-full px-2.5 py-1.5 border border-stone-300 rounded-lg bg-white font-mono text-xs"
                        />
                      </div>

                      <div>
                        <label className="block text-[11px] font-bold text-stone-700 mb-1 flex items-center gap-1">
                          <span>🇮🇷</span>
                          <span>{isFa ? 'سرور ایران - آپارات (Aparat URL / Code):' : 'Iran Server (Aparat):'}</span>
                        </label>
                        <input
                          type="text"
                          value={photoAparatUrl}
                          onChange={(e) => setPhotoAparatUrl(e.target.value)}
                          placeholder="https://www.aparat.com/v/XXXXX"
                          className="w-full px-2.5 py-1.5 border border-stone-300 rounded-lg bg-white font-mono text-xs"
                        />
                      </div>

                      <div>
                        <label className="block text-[11px] font-bold text-stone-700 mb-1 flex items-center gap-1">
                          <Play className="w-3 h-3 text-red-600 fill-red-600" />
                          <span>{isFa ? 'سرور بین‌الملل - یوتیوب (YouTube 4K):' : 'YouTube (4K):'}</span>
                        </label>
                        <input
                          type="text"
                          value={photoYoutubeUrl}
                          onChange={(e) => setPhotoYoutubeUrl(e.target.value)}
                          placeholder="https://youtu.be/XXXXX"
                          className="w-full px-2.5 py-1.5 border border-stone-300 rounded-lg bg-white font-mono text-xs"
                        />
                      </div>
                    </div>

                    <div className="flex flex-wrap items-center gap-4 pt-1 text-xs">
                      <span className="text-[11px] font-bold text-stone-700">{isFa ? 'سرور پیش‌فرض برای پخش:' : 'Default Server:'}</span>
                      <div className="flex items-center gap-3">
                        <label className="flex items-center gap-1 cursor-pointer">
                          <input
                            type="radio"
                            name="defaultServer"
                            value="github"
                            checked={photoDefaultServer === 'github'}
                            onChange={() => setPhotoDefaultServer('github')}
                            className="text-amber-700"
                          />
                          <span>{isFa ? 'گیت‌هاب (CDN اصلی)' : 'GitHub CDN'}</span>
                        </label>
                        <label className="flex items-center gap-1 cursor-pointer">
                          <input
                            type="radio"
                            name="defaultServer"
                            value="aparat"
                            checked={photoDefaultServer === 'aparat'}
                            onChange={() => setPhotoDefaultServer('aparat')}
                            className="text-amber-700"
                          />
                          <span>{isFa ? 'آپارات (سرور سریع ایران)' : 'Aparat (Iran)'}</span>
                        </label>
                        <label className="flex items-center gap-1 cursor-pointer">
                          <input
                            type="radio"
                            name="defaultServer"
                            value="youtube"
                            checked={photoDefaultServer === 'youtube'}
                            onChange={() => setPhotoDefaultServer('youtube')}
                            className="text-amber-700"
                          />
                          <span>{isFa ? 'یوتیوب (4K)' : 'YouTube'}</span>
                        </label>
                      </div>
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

                {/* فهرست تمام عکس‌ها و آلبوم‌های موجود با قابلیت ویرایش، حذف و جابجایی */}
                <div className="space-y-3">
                  <div className="flex items-center justify-between text-xs font-bold text-stone-800">
                    <span>{isFa ? `فهرست آثار و آلبوم‌های گالری (${content.photos.length} اثر فعال):` : 'Active Gallery Items:'}</span>
                    <span className="text-stone-400 font-normal">{isFa ? 'امکان ویرایش محتوا، حذف یا جابجایی ترتیب نمایش' : 'Edit, delete or reorder'}</span>
                  </div>

                  <div className="space-y-2 max-h-72 overflow-y-auto pr-1">
                    {content.photos.map((p, idx) => (
                      <div
                        key={p.id}
                        className={`p-3 bg-stone-50 hover:bg-stone-100/80 rounded-xl border transition-colors flex items-center justify-between gap-3 text-xs ${
                          editingPhotoId === p.id ? 'border-amber-600 bg-amber-50/40 ring-1 ring-amber-500' : 'border-stone-200'
                        }`}
                      >
                        <div className="flex items-center gap-3 overflow-hidden">
                          <img
                            src={p.imageUrl}
                            alt=""
                            className="w-14 h-11 object-cover rounded-md bg-stone-200 shrink-0 border border-stone-300"
                            referrerPolicy="no-referrer"
                          />
                          <div className="truncate">
                            <div className="font-bold text-stone-900 flex items-center gap-2 truncate">
                              <span className="truncate">{isFa ? p.titleFa : p.titleEn}</span>
                              {p.isAlbum && (
                                <span className="text-[10px] bg-amber-100 text-amber-900 px-1.5 py-0.5 rounded font-mono shrink-0">
                                  آلبوم
                                </span>
                              )}
                            </div>
                            <div className="text-[11px] text-stone-500 font-mono truncate">
                              {p.category} · {p.locationFa} ({p.year})
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
                      <span>{isFa ? `همگام‌سازی با مخزن اصلی (${mainRepo})` : `Sync to ${mainRepo}`}</span>
                    </div>
                    <a
                      href={`https://github.com/${mainRepo}`}
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
                      ? `برای همگام‌سازی خودکار و کامیت داده‌های سایت در مخزن ${mainRepo}، توکن شخصی گیت‌هاب (Personal Access Token با دسترسی repo) را در کادر زیر وارد کنید:`
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

        {/* ============================================================== */}
        {/* دیالوگ نمایش و کپی کد ورک‌فلو گیت‌هاب اکشن (.github/workflows/video-processor.yml) */}
        {/* ============================================================== */}
        {showWorkflowCodeModal && (
          <div className="fixed inset-0 z-60 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4 animate-in fade-in">
            <div className="bg-stone-900 border border-stone-800 rounded-2xl max-w-3xl w-full max-h-[85vh] flex flex-col overflow-hidden shadow-2xl text-white">
              <div className="p-4 border-b border-stone-800 flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Code2 className="w-5 h-5 text-amber-500" />
                  <span className="font-bold text-sm">
                    {isFa ? 'کد ورک‌فلو پردازش و استریم ویدیو (.github/workflows/video-processor.yml)' : 'GitHub Actions Workflow YAML'}
                  </span>
                </div>
                <button
                  type="button"
                  onClick={() => setShowWorkflowCodeModal(false)}
                  className="p-1.5 rounded-lg text-stone-400 hover:text-white hover:bg-stone-800 cursor-pointer"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              <div className="p-4 flex-1 overflow-y-auto font-mono text-xs bg-stone-950 text-stone-200 space-y-2 select-all">
                <pre className="whitespace-pre-wrap">{getVideoProcessorWorkflowYaml()}</pre>
              </div>

              <div className="p-4 border-t border-stone-800 flex items-center justify-between gap-3 bg-stone-900">
                <span className="text-[11px] text-stone-400">
                  {isFa ? 'این فایل به محض ارسال قطعات و دیدن READY_TO_PROCESS فعال می‌شود.' : 'Triggers on READY_TO_PROCESS.json'}
                </span>
                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={() => {
                      navigator.clipboard.writeText(getVideoProcessorWorkflowYaml());
                      alert(isFa ? 'کد ورک‌فلو با موفقیت در کلیپ‌بورد کپی شد!' : 'Workflow code copied!');
                    }}
                    className="px-4 py-2 bg-amber-600 hover:bg-amber-500 text-white font-bold text-xs rounded-xl flex items-center gap-1.5 cursor-pointer shadow-sm"
                  >
                    <Copy className="w-3.5 h-3.5" />
                    <span>{isFa ? 'کپی تمام کد' : 'Copy All'}</span>
                  </button>
                  <button
                    type="button"
                    onClick={() => setShowWorkflowCodeModal(false)}
                    className="px-4 py-2 bg-stone-800 hover:bg-stone-700 text-stone-300 font-bold text-xs rounded-xl cursor-pointer"
                  >
                    {isFa ? 'بستن' : 'Close'}
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
