import React, { useEffect, useMemo, useRef, useState } from 'react';
import { ExternalLink, Film } from 'lucide-react';
import {
  parseVideoUrl,
  VIDEO_PROVIDER_LABELS,
  type VideoProvider,
} from '../utils/videoEmbed';
import type { VideoSource } from '../types';

interface VideoPlayerProps {
  url: string;
  sources?: VideoSource[];
  title?: string;
  poster?: string;
  className?: string;
  language?: 'fa' | 'en';
}

interface HlsInstance {
  destroy: () => void;
}

const HlsVideo: React.FC<{ src: string; poster?: string; className?: string }> = ({
  src,
  poster,
  className = '',
}) => {
  const videoRef = useRef<HTMLVideoElement>(null);

  useEffect(() => {
    const video = videoRef.current;
    if (!video) return undefined;

    let instance: HlsInstance | null = null;
    let cancelled = false;

    if (video.canPlayType('application/vnd.apple.mpegurl')) {
      video.src = src;
      return () => {
        video.removeAttribute('src');
        video.load();
      };
    }

    void import('hls.js')
      .then(({ default: Hls }) => {
        if (cancelled) return;
        if (!Hls.isSupported()) {
          video.src = src;
          return;
        }
        const hls = new Hls({ enableWorker: true });
        hls.loadSource(src);
        hls.attachMedia(video);
        instance = hls;
      })
      .catch(() => {
        video.src = src;
      });

    return () => {
      cancelled = true;
      instance?.destroy();
    };
  }, [src]);

  return (
    <video
      ref={videoRef}
      poster={poster}
      controls
      playsInline
      preload="metadata"
      className={`w-full h-full max-h-[70vh] bg-black object-contain ${className}`}
    >
      مرورگر شما از پخش این ویدیو پشتیبانی نمی‌کند.
    </video>
  );
};

/**
 * پخش ویدیو از یک یا چند منبع. اگر ویدیو چند منبع داشته باشد (یوتیوب،
 * آپارات، آروان، HLS) بالای پلیر دکمه‌ی تعویض منبع نمایش داده می‌شود.
 */
export const VideoPlayer: React.FC<VideoPlayerProps> = ({
  url,
  sources,
  title,
  poster,
  className = '',
  language = 'fa',
}) => {
  const isFa = language === 'fa';

  const list = useMemo<VideoSource[]>(() => {
    if (sources && sources.length > 0) return sources;
    const parsed = parseVideoUrl(url);
    return [{ id: 'default', provider: parsed.provider, url }];
  }, [sources, url]);

  const [activeId, setActiveId] = useState<string>(() => list[0]?.id || 'default');

  useEffect(() => {
    if (!list.some((source) => source.id === activeId)) {
      setActiveId(list[0]?.id || 'default');
    }
  }, [list, activeId]);

  const active = list.find((source) => source.id === activeId) || list[0];
  const parsed = parseVideoUrl(active?.url || '');

  const tabs =
    list.length > 1 ? (
      <div className="flex flex-wrap items-center gap-1.5 px-2 py-2 bg-stone-900/90 border-b border-stone-800">
        <span className="text-[10px] text-stone-400 px-1">{isFa ? 'منبع:' : 'Source:'}</span>
        {list.map((source) => {
          const label =
            VIDEO_PROVIDER_LABELS[source.provider]?.[isFa ? 'fa' : 'en'] || source.provider;
          const isActive = source.id === active?.id;
          return (
            <button
              key={source.id}
              type="button"
              onClick={() => setActiveId(source.id)}
              className={`px-2.5 py-1 rounded-md text-[11px] font-bold transition-colors cursor-pointer ${
                isActive
                  ? 'bg-amber-500 text-stone-950'
                  : 'bg-stone-800 text-stone-300 hover:bg-stone-700'
              }`}
            >
              {source.label || label}
            </button>
          );
        })}
      </div>
    ) : null;

  const media = (() => {
    if (!active || !active.url) {
      return (
        <div
          className={`flex flex-col items-center justify-center gap-2 p-10 text-stone-400 ${className}`}
        >
          <Film className="w-8 h-8" />
          <span className="text-xs">{isFa ? 'ویدیویی ثبت نشده است.' : 'No video.'}</span>
        </div>
      );
    }

    if (parsed.provider === 'hls') {
      return <HlsVideo src={parsed.embedUrl} poster={poster} className={className} />;
    }

    if (parsed.provider === 'file' || parsed.provider === 'arvan') {
      return (
        <video
          key={parsed.embedUrl}
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
          key={parsed.embedUrl}
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
        href={parsed.embedUrl || active.url}
        target="_blank"
        rel="noreferrer"
        className={`flex flex-col items-center justify-center gap-3 p-10 text-stone-300 hover:text-white ${className}`}
      >
        <Film className="w-10 h-10 text-amber-500" />
        <span className="text-sm font-bold">{title || (isFa ? 'مشاهده ویدیو' : 'Watch video')}</span>
        <span className="text-xs flex items-center gap-1.5 text-amber-400">
          <ExternalLink className="w-3.5 h-3.5" />
          {isFa ? 'باز کردن لینک' : 'Open link'}
        </span>
      </a>
    );
  })();

  return (
    <div className={`w-full flex flex-col bg-black ${className}`}>
      {tabs}
      <div className="w-full flex items-center justify-center">{media}</div>
    </div>
  );
};

export type { VideoProvider };
