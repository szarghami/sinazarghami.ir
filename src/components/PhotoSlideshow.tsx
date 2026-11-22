import React, { useEffect, useState } from 'react';
import type { PhotoItem } from '../types';
import { getPostCoverUrl, getReliableImageUrl } from '../utils/media';

export function PhotoSlideshow({ photo, alt, className = '' }: { photo: PhotoItem; alt: string; className?: string }) {
  const images = [getPostCoverUrl(photo), ...(photo.galleryImages || [])].filter(Boolean);
  const [index, setIndex] = useState(0);
  useEffect(() => { setIndex(0); }, [photo.id]);
  useEffect(() => {
    if (images.length < 2 || window.matchMedia('(prefers-reduced-motion: reduce)').matches) return;
    const timer = window.setInterval(() => setIndex((current) => (current + 1) % images.length), 3000);
    return () => window.clearInterval(timer);
  }, [photo.id, images.length]);
  return <img src={getReliableImageUrl(images[index % images.length] || '')} alt={alt} className={className} loading="lazy" referrerPolicy="no-referrer" />;
}
