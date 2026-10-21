/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect } from 'react';
import { Language, PhotoItem, SiteContent } from './types';
import {
  loadSiteContent,
  saveSiteContent,
  fetchRemoteSiteData,
  syncPasscodeFromServer,
} from './utils/storage';
import { trackEvent } from './utils/analytics';
import { Navbar } from './components/Navbar';
import { Hero } from './components/Hero';
import { HomeCategoryCards } from './components/HomeCategoryCards';
import { HomeFeaturedWorks } from './components/HomeFeaturedWorks';
import { PhotographyGallery } from './components/PhotographyGallery';
import { GearLockerSection } from './components/GearLockerSection';
import { ExpeditionsSection } from './components/ExpeditionsSection';
import { SoftwareShowcase } from './components/SoftwareShowcase';
import { ProductionServices } from './components/ProductionServices';
import { ResumeBooksSection } from './components/ResumeBooksSection';
import { ArticlesSection } from './components/ArticlesSection';
import { AboutPage } from './components/AboutPage';
import { DynamicFilterArchive } from './components/DynamicFilterArchive';
import { PrintShopModal } from './components/PrintShopModal';
import { AdminStudioModal } from './components/AdminStudioModal';
import { SeoDocumentationModal } from './components/SeoDocumentationModal';
import { Footer } from './components/Footer';

export default function App() {
  const [language, setLanguage] = useState<Language>('fa');
  const [content, setContent] = useState<SiteContent>(loadSiteContent);

  // سیستم مسیریابی چندصفحه‌ای واقعی مبتنی بر History API
  const [currentPath, setCurrentPath] = useState<string>(() => {
    return window.location.pathname + window.location.search || '/';
  });

  // Modal states
  const [selectedPrintPhoto, setSelectedPrintPhoto] = useState<PhotoItem | null>(null);
  const [isAdminOpen, setIsAdminOpen] = useState(false);
  const [isSeoOpen, setIsSeoOpen] = useState(false);

  // مدیریت رویداد popstate مرورگر جهت ناوبری Back و Forward
  useEffect(() => {
    const handlePopState = () => {
      setCurrentPath(window.location.pathname + window.location.search || '/');
    };
    window.addEventListener('popstate', handlePopState);
    return () => window.removeEventListener('popstate', handlePopState);
  }, []);

  // تابع انتقال به صفحه جدید با اسکرول به بالا
  const navigateTo = (path: string) => {
    window.history.pushState({}, '', path);
    setCurrentPath(path);
    window.scrollTo({ top: 0, behavior: 'smooth' });
    trackEvent('page_view', { path });
  };

  // دریافت اطلاعات هماهنگ‌شده و رمز عبور از سرور جهت یکی بودن نسخه موبایل و لپ‌تاپ
  useEffect(() => {
    fetchRemoteSiteData().then((remoteData) => {
      if (remoteData) {
        setContent(remoteData);
      }
    });
    syncPasscodeFromServer();
    trackEvent('page_view', { path: currentPath });
  }, []);

  // بروزرسانی تایتل تب مرورگر و صفات lang / dir
  useEffect(() => {
    const isFa = language === 'fa';
    document.documentElement.lang = isFa ? 'fa' : 'en';
    document.documentElement.dir = isFa ? 'rtl' : 'ltr';

    const pathOnly = currentPath.split('?')[0];

    const pageTitlesFa: Record<string, string> = {
      '/': 'سینا ضرغامی | عکاس، فیلمبردار و توسعه‌دهنده',
      '/portfolio': 'نمونه‌کارهای تخصصی | سینا ضرغامی',
      '/trips': 'سفرنامه‌ها و تورها | سینا ضرغامی',
      '/gear': 'تجهیزات و ابزارهای استودیو | سینا ضرغامی',
      '/articles': 'مقالات و آموزش‌های تخصصی | سینا ضرغامی',
      '/resume': 'رزومه، افتخارات و کتاب‌ها | سینا ضرغامی',
      '/about': 'درباره من | سینا ضرغامی',
      '/order': 'ثبت سفارش و استعلام پروژه | سینا ضرغامی',
      '/filter': 'آرشیو تکنیک‌ها و تجهیزات | سینا ضرغامی',
    };

    const pageTitlesEn: Record<string, string> = {
      '/': 'Sina Zarghami | Photographer, Filmmaker & Software Creator',
      '/portfolio': 'Commercial Portfolio | Sina Zarghami',
      '/trips': 'Expeditions & Tours | Sina Zarghami',
      '/gear': 'Gear Locker & Production Arsenal | Sina Zarghami',
      '/articles': 'Articles & Masterclasses | Sina Zarghami',
      '/resume': 'Resume & Books | Sina Zarghami',
      '/about': 'About Me | Sina Zarghami',
      '/order': 'Inquire & Order Project | Sina Zarghami',
      '/filter': 'Technique & Gear Archive | Sina Zarghami',
    };

    document.title = (isFa ? pageTitlesFa[pathOnly] : pageTitlesEn[pathOnly]) || (isFa ? 'سینا ضرغامی' : 'Sina Zarghami');
  }, [language, currentPath]);

  const handleToggleLanguage = () => {
    setLanguage((prev) => (prev === 'fa' ? 'en' : 'fa'));
  };

  const handleUpdateContent = (newContent: SiteContent) => {
    setContent(newContent);
    saveSiteContent(newContent);
  };

  const openFirstPrintPhoto = () => {
    if (content.photos.length > 0) {
      setSelectedPrintPhoto(content.photos[0]);
    }
  };

  // پارس کردن مسیر فعلی و کوئری‌ها
  const pathOnly = currentPath.split('?')[0];
  const searchParams = new URLSearchParams(currentPath.includes('?') ? currentPath.split('?')[1] : '');

  // استخراج پارامترهای صفحه فیلتر (/filter?type=gear&val=...)
  const filterType = (searchParams.get('type') as 'gear' | 'technique') || 'gear';
  const filterVal = searchParams.get('val') || '';

  // استخراج اسلاگ مقالات (/articles?slug=...)
  const articleSlug = searchParams.get('slug') || undefined;

  return (
    <div className="min-h-screen flex flex-col bg-[#FCFCFD] text-[#121316]">
      {/* 3-Zone Clean Header با منوی داینامیک */}
      <Navbar
        currentPath={currentPath}
        onNavigate={navigateTo}
        navLabels={content.navLabels}
        language={language}
        onToggleLanguage={handleToggleLanguage}
        onOpenAdmin={() => setIsAdminOpen(true)}
        onOpenContact={() => navigateTo('/order')}
      />

      {/* Main Experience Router */}
      <main className="flex-1">
        {/* ۱. صفحه اصلی (Home Page: /) */}
        {pathOnly === '/' && (
          <>
            <Hero
              content={content}
              language={language}
              onOpenPrints={openFirstPrintPhoto}
              onOpenExpeditions={() => navigateTo('/trips')}
            />

            {/* کارت‌های ناوبری دسته‌بندی‌های اصلی */}
            <HomeCategoryCards
              cards={content.homeCategoryCards}
              language={language}
              onNavigate={navigateTo}
            />

            {/* شاهکارهای برگزیده صفحه اصلی */}
            <HomeFeaturedWorks
              photos={content.photos}
              language={language}
              onSelectPrint={(photo) => setSelectedPrintPhoto(photo)}
              onNavigate={navigateTo}
            />

            {/* پروژه‌های نرم‌افزاری برگزیده */}
            <SoftwareShowcase
              software={content.software}
              language={language}
            />
          </>
        )}

        {/* ۲. صفحه نمونه‌کارهای تخصصی و تجاری (/portfolio) */}
        {pathOnly === '/portfolio' && (
          <PhotographyGallery
            photos={content.photos}
            language={language}
            onSelectPrint={(photo) => setSelectedPrintPhoto(photo)}
            onNavigate={navigateTo}
            commercialCategories={content.commercialCategories}
            definedTechniques={content.definedTechniques}
            equipment={content.equipment}
            isPortfolioPage={true}
          />
        )}

        {/* ۳. صفحه سفر، سفرنامه‌ها و تورها (/trips) */}
        {pathOnly === '/trips' && (
          <ExpeditionsSection
            expeditions={content.expeditions}
            photos={content.photos}
            language={language}
            onNavigate={navigateTo}
            onSelectPrint={(photo) => setSelectedPrintPhoto(photo)}
          />
        )}

        {/* ۴. صفحه تجهیزات و جعبه‌ابزار تولید (/gear) */}
        {pathOnly === '/gear' && (
          <GearLockerSection
            equipment={content.equipment || []}
            language={language}
            onNavigate={navigateTo}
          />
        )}

        {/* ۵. صفحه مقالات و آموزش‌های تخصصی سئومحور (/articles) */}
        {pathOnly === '/articles' && (
          <ArticlesSection
            articles={content.articles || []}
            language={language}
            onNavigate={navigateTo}
            slug={articleSlug}
            equipment={content.equipment}
            techniques={content.definedTechniques}
          />
        )}

        {/* ۶. صفحه رزومه، افتخارات و کتاب‌ها (/resume) */}
        {pathOnly === '/resume' && (
          <ResumeBooksSection
            resume={content.resume}
            books={content.books}
            language={language}
          />
        )}

        {/* ۷. صفحه جامع درباره من (/about) */}
        {pathOnly === '/about' && (
          <AboutPage
            aboutBio={content.aboutBio}
            profile={content.profile}
            language={language}
            onNavigate={navigateTo}
          />
        )}

        {/* ۸. صفحه ثبت سفارش و استعلام پروژه‌ها (/order) */}
        {pathOnly === '/order' && (
          <ProductionServices
            language={language}
          />
        )}

        {/* ۹. صفحه داینامیک آرشیو تکنیک و تجهیزات (/filter) */}
        {pathOnly === '/filter' && (
          <DynamicFilterArchive
            type={filterType}
            val={filterVal}
            photos={content.photos}
            articles={content.articles || []}
            equipment={content.equipment || []}
            techniques={content.definedTechniques || []}
            language={language}
            onNavigate={navigateTo}
            onSelectPrint={(photo) => setSelectedPrintPhoto(photo)}
          />
        )}
      </main>

      {/* Minimal Dynamic Footer */}
      <Footer
        language={language}
        onOpenAdmin={() => setIsAdminOpen(true)}
        onOpenSeo={() => setIsSeoOpen(true)}
        onNavigate={navigateTo}
        aboutBio={content.aboutBio}
        navLabels={content.navLabels}
      />

      {/* Modals */}
      <PrintShopModal
        photo={selectedPrintPhoto}
        language={language}
        onClose={() => setSelectedPrintPhoto(null)}
      />

      {isAdminOpen && (
        <AdminStudioModal
          content={content}
          onUpdateContent={handleUpdateContent}
          language={language}
          onClose={() => setIsAdminOpen(false)}
        />
      )}

      {isSeoOpen && (
        <SeoDocumentationModal
          language={language}
          onClose={() => setIsSeoOpen(false)}
        />
      )}
    </div>
  );
}
