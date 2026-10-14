/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect } from 'react';
import { Language, PhotoItem, SiteContent } from './types';
import { loadSiteContent, saveSiteContent, fetchRemoteSiteData, syncPasscodeFromServer } from './utils/storage';
import { trackEvent } from './utils/analytics';
import { Navbar } from './components/Navbar';
import { Hero } from './components/Hero';
import { PhotographyGallery } from './components/PhotographyGallery';
import { GearLockerSection } from './components/GearLockerSection';
import { ExpeditionsSection } from './components/ExpeditionsSection';
import { SoftwareShowcase } from './components/SoftwareShowcase';
import { ProductionServices } from './components/ProductionServices';
import { ResumeBooksSection } from './components/ResumeBooksSection';
import { PrintShopModal } from './components/PrintShopModal';
import { AdminStudioModal } from './components/AdminStudioModal';
import { SeoDocumentationModal } from './components/SeoDocumentationModal';
import { Footer } from './components/Footer';

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
      setSelectedPrintPhoto(content.photos[0]);
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
