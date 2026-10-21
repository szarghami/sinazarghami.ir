/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect, lazy, Suspense } from 'react';
import { Language, PhotoItem, SiteContent } from './types';
import { loadSiteContent, saveSiteContent, fetchRemoteSiteData, syncPasscodeFromServer, syncStudioSettingsFromServer } from './utils/storage';
import { trackEvent } from './utils/analytics';
import { Navbar } from './components/Navbar';
import { Hero } from './components/Hero';
import { PhotographyGallery } from './components/PhotographyGallery';
import { GearLockerSection } from './components/GearLockerSection';
import { ExpeditionsSection } from './components/ExpeditionsSection';
import { SoftwareShowcase } from './components/SoftwareShowcase';
import { ProductionServices } from './components/ProductionServices';
import { ResumeBooksSection } from './components/ResumeBooksSection';
import { Footer } from './components/Footer';

// بارگذاری تنبل (Lazy Loading) مودال‌های سنگین جهت کاهش بیش از ۳۰۰ کیلوبایت از باندل اولیه
const PrintShopModal = lazy(() =>
  import('./components/PrintShopModal').then((m) => ({ default: m.PrintShopModal }))
);
const AdminStudioModal = lazy(() =>
  import('./components/AdminStudioModal').then((m) => ({ default: m.AdminStudioModal }))
);
const SeoDocumentationModal = lazy(() =>
  import('./components/SeoDocumentationModal').then((m) => ({ default: m.SeoDocumentationModal }))
);

export default function App() {
  const [language, setLanguage] = useState<Language>('fa');
  const [content, setContent] = useState<SiteContent>(loadSiteContent);

  // Modal states
  const [selectedPrintPhoto, setSelectedPrintPhoto] = useState<PhotoItem | null>(null);
  const [isAdminOpen, setIsAdminOpen] = useState(false);
  const [isSeoOpen, setIsSeoOpen] = useState(false);

  // دریافت اطلاعات هماهنگ‌شده و رمز عبور از سرور جهت یکی بودن نسخه موبایل و لپ‌تاپ
  useEffect(() => {
    fetchRemoteSiteData().then((remoteData) => {
      if (remoteData) {
        setContent(remoteData);
      }
    });
    syncPasscodeFromServer();
    syncStudioSettingsFromServer();
    trackEvent('page_view');
  }, []);

  // Sync HTML lang and dir attributes dynamically
  useEffect(() => {
    const isFa = language === 'fa';
    document.documentElement.lang = isFa ? 'fa' : 'en';
    document.documentElement.dir = isFa ? 'rtl' : 'ltr';
    document.title = isFa
      ? 'سینا ضرغامی | عکاس، فیلمبردار و توسعه‌دهنده'
      : 'Sina Zarghami | Photographer, Filmmaker & Software Creator';
  }, [language]);

  const handleToggleLanguage = () => {
    setLanguage((prev) => (prev === 'fa' ? 'en' : 'fa'));
  };

  const handleUpdateContent = (newContent: SiteContent) => {
    setContent(newContent);
    saveSiteContent(newContent);
  };

  const scrollToServices = () => {
    const el = document.getElementById('services');
    if (el) {
      el.scrollIntoView({ behavior: 'smooth' });
    }
  };

  const scrollToExpeditions = () => {
    const el = document.getElementById('expeditions');
    if (el) {
      el.scrollIntoView({ behavior: 'smooth' });
    }
  };

  const openFirstPrintPhoto = () => {
    if (content.photos.length > 0) {
      const printable = content.photos.find(
        (p) => !p.isVideo && p.category !== 'video' && p.category !== 'commercial-video' && p.printAvailable
      ) || content.photos.find((p) => !p.isVideo && p.category !== 'video') || content.photos[0];
      setSelectedPrintPhoto(printable);
    }
  };

  return (
    <div className="min-h-screen flex flex-col bg-[#FCFCFD] text-[#121316]">
      {/* 3-Zone Clean Header */}
      <Navbar
        language={language}
        onToggleLanguage={handleToggleLanguage}
        onOpenAdmin={() => setIsAdminOpen(true)}
        onOpenContact={scrollToServices}
      />

      {/* Main Experience */}
      <main className="flex-1">
        {/* Split Screen Hero with 4-Column KPI Strip */}
        <Hero
          content={content}
          language={language}
          onOpenPrints={openFirstPrintPhoto}
          onOpenExpeditions={scrollToExpeditions}
        />

        {/* 01. Curated Photography, Lightbox & Art Sales */}
        <PhotographyGallery
          photos={content.photos}
          language={language}
          onSelectPrint={(photo) => setSelectedPrintPhoto(photo)}
        />

        {/* 02. Specialized Production Arsenal & Gear Locker */}
        <GearLockerSection
          equipment={content.equipment || []}
          language={language}
        />

        {/* 03. Guided Expeditions & Field Navigation */}
        <ExpeditionsSection
          expeditions={content.expeditions}
          language={language}
        />

        {/* 03. Software Engineering & Digital Tools */}
        <SoftwareShowcase
          software={content.software}
          language={language}
        />

        {/* 04. Career Timeline, Mentorship & Books */}
        <ResumeBooksSection
          resume={content.resume}
          books={content.books}
          language={language}
        />

        {/* 05. Production Services & Commission Inquiries */}
        <ProductionServices
          language={language}
        />
      </main>

      {/* Minimal Footer */}
      <Footer
        language={language}
        onOpenAdmin={() => setIsAdminOpen(true)}
        onOpenSeo={() => setIsSeoOpen(true)}
      />

      {/* Modals with Lazy Loading & Code Splitting */}
      {selectedPrintPhoto && (
        <Suspense fallback={null}>
          <PrintShopModal
            photo={selectedPrintPhoto}
            language={language}
            onClose={() => setSelectedPrintPhoto(null)}
          />
        </Suspense>
      )}

      {isAdminOpen && (
        <Suspense
          fallback={
            <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-xs p-4 animate-fade-in">
              <div className="bg-stone-900 border border-stone-800 rounded-2xl p-6 shadow-2xl flex flex-col items-center gap-3 text-center max-w-xs">
                <div className="w-8 h-8 border-2 border-amber-500 border-t-transparent rounded-full animate-spin" />
                <p className="text-xs font-mono text-stone-300">
                  {language === 'fa' ? 'در حال بارگذاری استودیو مدیریت...' : 'Loading Studio Admin Panel...'}
                </p>
              </div>
            </div>
          }
        >
          <AdminStudioModal
            content={content}
            onUpdateContent={handleUpdateContent}
            language={language}
            onClose={() => setIsAdminOpen(false)}
          />
        </Suspense>
      )}

      {isSeoOpen && (
        <Suspense fallback={null}>
          <SeoDocumentationModal
            language={language}
            onClose={() => setIsSeoOpen(false)}
          />
        </Suspense>
      )}
    </div>
  );
}
