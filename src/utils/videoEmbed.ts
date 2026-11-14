// =====================================================================
// تشخیص نوع لینک ویدیو و ساخت آدرس نمایش آن
// ویدیوها آپلود نمی‌شوند (نه در گیت‌هاب و نه در R2)؛ فقط لینکشان در پست
// ذخیره می‌شود و همان‌جا پخش می‌شود.
// =====================================================================

export type VideoProvider = 'youtube' | 'aparat' | 'file' | 'link';

export interface ParsedVideo {
  provider: VideoProvider;
  embedUrl: string;
  thumbnailUrl?: string;
}

const YOUTUBE_PATTERN =
  /(?:youtube\.com\/(?:watch\?(?:[^#]*&)?v=|shorts\/|embed\/|live\/)|youtu\.be\/)([A-Za-z0-9_-]{6,20})/i;
const APARAT_PATTERN = /aparat\.com\/(?:v|video\/video\/embed\/videohash)\/([A-Za-z0-9]+)/i;
const DIRECT_FILE_PATTERN = /\.(mp4|webm|ogv|m3u8)(?:[?#]|$)/i;

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

  if (DIRECT_FILE_PATTERN.test(url)) {
    return { provider: 'file', embedUrl: url };
  }

  return { provider: 'link', embedUrl: url };
}

export function isPlayableVideo(raw: string): boolean {
  return parseVideoUrl(raw).provider !== 'link';
}

export function videoThumbnail(raw: string): string | undefined {
  return parseVideoUrl(raw).thumbnailUrl;
}
