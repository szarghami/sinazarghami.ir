import { smartUploadImage } from './supabase';
import { Env } from '../../functions/api/_shared/runtime';

export const DEFAULT_MAIN_REPO = 'szarghami/sinazarghami-aistudio-site';
export const DEFAULT_VIDEO_REPO = 'szarghami/video-portfolio';
export const DEFAULT_VIDEO_BASE_URL = 'https://szarghami.github.io/video-portfolio/';
export const DEFAULT_VIDEO_THRESHOLD_MB = 25;

/** Media writes now use R2 and never commit image binaries to the application repository. */
export async function uploadImageToGitHub(dataUrl: string, env: Env, customName?: string): Promise<string> {
  const result = await smartUploadImage(dataUrl, env, customName);
  if (!result.success || !result.publicUrl) throw new Error(result.error || 'تصویر در فضای ابری ذخیره نشد.');
  return result.publicUrl;
}
