// =====================================================================
// تشخیص نوع لینک ویدیو و ساخت آدرس نمایش آن
// ویدیو می‌تواند یوتیوب، آپارات، فایل روی فضای ابری آروان، MP4 مستقیم یا
// پلی‌لیست HLS باشد. هر ویدیو می‌تواند چند منبع داشته باشد.
// =====================================================================

export type VideoProvider = 'youtube' | 'aparat' | 'arvan' | 'file' | 'hls' | 'link';

export interface ParsedVideo {
  provider: VideoProvider;
  embedUrl: string;
  thumbnailUrl?: string;
}

const YOUTUBE_PATTERN =
  /(?:youtube\.com\/(?:watch\?(?:[^#]*&)?v=|shorts\/|embed\/|live\/)|youtu\.be\/)([A-Za-z0-9_-]{6,20})/i;
const APARAT_PATTERN = /aparat\.com\/(?:v|video\/video\/embed\/videohash)\/([A-Za-z0-9]+)/i;
const HLS_PATTERN = /\.m3u8(?:[?#]|$)/i;
const DIRECT_FILE_PATTERN = /\.(mp4|webm|ogv|mov|m4v)(?:[?#]|$)/i;
const ARVAN_PATTERN = /(?:arvanstorage\.ir|arvancloud\.ir\/.*media|media\.sinazarghami\.ir)/i;

export function parseVideoUrl(raw: string): ParsedVideo {
  const url = (raw || '').trim();
  if (!url) return { provider: 'link', embedUrl: '' };

  const youtube = url.match(YOUTUBE_PATTERN);
  if (youtube) {
    const id = youtube[1];
    return {
      provider: 'youtube',
      embedUrl: `https://www.youtube-nocookie.com/embed/${id}?rel=0`,
      thumbnailUrl: `https://i.ytimg.com/vi/${id}/hqdefault.jpg`,
    };
  }

  const aparat = url.match(APARAT_PATTERN);
  if (aparat) {
    return {
      provider: 'aparat',
      embedUrl: `https://www.aparat.com/video/video/embed/videohash/${aparat[1]}/vt/frame`,
    };
  }

  if (HLS_PATTERN.test(url)) {
    return { provider: 'hls', embedUrl: url };
  }

  if (DIRECT_FILE_PATTERN.test(url)) {
    return { provider: ARVAN_PATTERN.test(url) ? 'arvan' : 'file', embedUrl: url };
  }

  if (ARVAN_PATTERN.test(url)) {
    return { provider: 'arvan', embedUrl: url };
  }

  return { provider: 'link', embedUrl: url };
}

export function isPlayableVideo(raw: string): boolean {
  return parseVideoUrl(raw).provider !== 'link';
}

export function videoThumbnail(raw: string): string | undefined {
  return parseVideoUrl(raw).thumbnailUrl;
}

export function detectVideoProvider(raw: string): VideoProvider {
  return parseVideoUrl(raw).provider;
}

export const VIDEO_PROVIDER_LABELS: Record<VideoProvider, { fa: string; en: string }> = {
  youtube: { fa: 'یوتیوب', en: 'YouTube' },
  aparat: { fa: 'آپارات', en: 'Aparat' },
  arvan: { fa: 'آروان', en: 'Arvan' },
  file: { fa: 'فایل مستقیم', en: 'Direct file' },
  hls: { fa: 'استریم HLS', en: 'HLS stream' },
  link: { fa: 'لینک', en: 'Link' },
};
