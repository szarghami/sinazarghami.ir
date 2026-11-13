import rawContent from '../../public/site-data.json';
import { SiteContent } from '../types';

/**
 * داده‌ی اولیه‌ی رابط کاربری از همان فایل عمومی site-data.json خوانده می‌شود.
 * این فقط fallback است؛ منبع حقیقت همان فایل و نسخه‌ی خوانده‌شده از سرور است.
 * با این کار هیچ محتوای قدیمی یا تصویر استوک در باندل جا نمی‌ماند.
 */
export const initialSiteContent = rawContent as unknown as SiteContent;
