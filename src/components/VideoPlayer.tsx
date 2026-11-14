import React from 'react';
import { ExternalLink, Film } from 'lucide-react';
import { parseVideoUrl } from '../utils/videoEmbed';

interface VideoPlayerProps {
  url: string;
  title?: string;
  poster?: string;
  className?: string;
}

/**
 * پخش ویدیو از لینک: یوتیوب و آپارات در iframe، فایل مستقیم در تگ video.
 * هیچ فایلی روی سرور ذخیره نمی‌شود.
 */
export const VideoPlayer: React.FC<VideoPlayerProps> = ({ url, title, poster, className = '' }) => {
  const parsed = parseVideoUrl(url);

  if (parsed.provider === 'file') {
    return (
      <video
        src={parsed.embedUrl}
        poster={poster}
        controls
        playsInline
        preload="metadata"
        className={`w-full h-full max-h-[70vh] bg-black object-contain ${className}`}
      >
        مرورگر شما از پخش این ویدیو پشتیبانی نمی‌کند.
      </video>
    );
  }

  if (parsed.provider === 'youtube' || parsed.provider === 'aparat') {
    return (
      <iframe
        src={parsed.embedUrl}
        title={title || 'video'}
        allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; fullscreen"
        allowFullScreen
        referrerPolicy="strict-origin-when-cross-origin"
        className={`w-full aspect-video max-h-[70vh] bg-black border-0 ${className}`}
      />
    );
  }

  return (
    <a
      href={parsed.embedUrl || url}
      target="_blank"
      rel="noreferrer"
      className={`flex flex-col items-center justify-center gap-3 p-10 text-stone-300 hover:text-white ${className}`}
    >
      <Film className="w-10 h-10 text-amber-500" />
      <span className="text-sm font-bold">{title || 'مشاهده ویدیو'}</span>
      <span className="text-xs flex items-center gap-1.5 text-amber-400">
        <ExternalLink className="w-3.5 h-3.5" />
        باز کردن لینک
      </span>
    </a>
  );
};
