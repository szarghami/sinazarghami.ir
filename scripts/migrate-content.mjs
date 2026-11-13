// One-off content migration: local media, no external stock, gear tags, route fixes.
import { mkdir, readFile, writeFile } from 'node:fs/promises';
import { dirname, join } from 'node:path';

const ROOT = process.cwd();
const CONTENT_FILE = join(ROOT, 'public', 'site-data.json');
const MEDIA_DIR = join(ROOT, 'public', 'media', 'legacy');

const EQUIPMENT_MATCHERS = [
  [/canon\s*r8/i, 'gear-cam-1'],
  [/canon\s*70d/i, 'gear-cam-2'],
  [/gopro\s*max/i, 'gear-cam-3'],
  [/iphone/i, 'gear-cam-4'],
  [/mavic|dji\s*mini/i, 'gear-cam-5'],
  [/ef\s*50mm|50mm\s*f\/1\.8/i, 'gear-lens-1'],
  [/55\s*[–-]\s*250/i, 'gear-lens-2'],
  [/reverse\s*macro|inverted|رینگ\s*معکوس/i, 'gear-lens-3'],
  [/24\s*[–-]\s*50/i, 'gear-lens-4'],
  [/18\s*[–-]\s*55/i, 'gear-lens-5'],
  [/rs\s*4/i, 'gear-motion-1'],
  [/osmo\s*mobile/i, 'gear-motion-2'],
];

function gearIdsFor(photo) {
  const haystack = `${photo.camera || ''} ${photo.lens || ''}`;
  const ids = new Set(photo.gearIds || []);
  for (const [pattern, id] of EQUIPMENT_MATCHERS) {
    if (pattern.test(haystack)) ids.add(id);
  }
  return [...ids];
}

function isLocalMedia(value) {
  return typeof value === 'string' && (value.startsWith('data:') || value.startsWith('/media/'));
}

let mediaCounter = 0;

async function persistDataUrl(dataUrl, slug) {
  const match = dataUrl.match(/^data:(image\/([a-z0-9.+-]+));base64,(.+)$/i);
  if (!match) return null;
  const extension = match[2] === 'jpeg' ? 'jpg' : match[2];
  const fileName = `${slug}-${String(++mediaCounter).padStart(2, '0')}.${extension}`;
  const target = join(MEDIA_DIR, fileName);
  await mkdir(dirname(target), { recursive: true });
  await writeFile(target, Buffer.from(match[3], 'base64'));
  return `/media/legacy/${fileName}`;
}

function slugify(value) {
  return (
    String(value || 'image')
      .toLowerCase()
      .replace(/[^a-z0-9-]+/g, '-')
      .replace(/^-+|-+$/g, '')
      .slice(0, 40) || 'image'
  );
}

const content = JSON.parse(await readFile(CONTENT_FILE, 'utf8'));

// 1. Keep only photos backed by local media; drop external stock placeholders.
const keptPhotos = [];
for (const photo of content.photos || []) {
  if (!isLocalMedia(photo.imageUrl)) continue;
  const imageUrl = photo.imageUrl.startsWith('data:')
    ? await persistDataUrl(photo.imageUrl, slugify(photo.id))
    : photo.imageUrl;
  if (!imageUrl) continue;

  const galleryImages = [];
  for (const [index, src] of (photo.galleryImages || []).entries()) {
    if (!isLocalMedia(src)) continue;
    const saved = src.startsWith('data:')
      ? await persistDataUrl(src, `${slugify(photo.id)}-g${index + 1}`)
      : src;
    if (saved) galleryImages.push(saved);
  }

  keptPhotos.push({
    ...photo,
    imageUrl,
    galleryImages: galleryImages.length ? galleryImages : undefined,
    gearIds: gearIdsFor(photo),
    camera: photo.camera || '',
    lens: photo.lens || '',
  });
}
content.photos = keptPhotos;

// 2. Clear external stock covers everywhere else.
for (const expedition of content.expeditions || []) {
  if (!isLocalMedia(expedition.coverImage)) expedition.coverImage = '';
  expedition.tripType = expedition.tripType || 'tour';
  expedition.tourStatus = expedition.tourStatus || (expedition.bookingOpen ? 'open' : 'completed');
}
for (const book of content.books || []) {
  if (!isLocalMedia(book.coverImage)) book.coverImage = '';
}
for (const article of content.articles || []) {
  if (!isLocalMedia(article.coverUrl || article.coverImage)) {
    article.coverUrl = '';
    article.coverImage = '';
  }
}
for (const card of content.homeCategoryCards || []) {
  if (!isLocalMedia(card.coverUrl)) card.coverUrl = '';
  if (card.targetPath === '/expeditions') card.targetPath = '/trips';
  if (card.targetPath === '/commercial') card.targetPath = '/portfolio';
  if (card.targetPath === '/prints') card.targetPath = '/portfolio';
}

// 3. Make sure the drone used in the aerial photos exists in the gear locker.
content.equipment = content.equipment || [];
if (!content.equipment.some((item) => item.id === 'gear-cam-5')) {
  content.equipment.push({
    id: 'gear-cam-5',
    name: 'DJI Mavic Mini 3 Pro',
    category: 'cameras',
    categoryLabelFa: 'دوربین هوایی و پهپاد',
    categoryLabelEn: 'Aerial Drone Camera',
    specs: 'سنسور ۱/۱.۳ اینچ | ویدیو ۴K HDR | پرواز تا ۳۴ دقیقه',
    purposeFa:
      'برای زوایای هوایی، ثبت مقیاس منظره و روایت مسیر از بالا. سبک و جمع‌وجور، مناسب سفرهای چندروزه و مسیرهای پیاده‌روی طولانی.',
    purposeEn:
      'Aerial perspectives, landscape scale, and route storytelling from above. Light enough for multi-day treks and long hikes.',
    recommendedForFa: ['نمای هوایی منظره', 'مستند مسیر و سفر', 'معرفی موقعیت پروژه'],
    recommendedForEn: ['Aerial landscape views', 'Route and travel documentaries', 'Location scouting'],
  });
}

await writeFile(CONTENT_FILE, `${JSON.stringify(content, null, 2)}\n`, 'utf8');

console.log(
  `photos: ${content.photos.length} | media files: ${mediaCounter} | expeditions: ${content.expeditions.length}`,
);
