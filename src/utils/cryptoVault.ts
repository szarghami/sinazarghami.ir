// =====================================================================
// گاوصندوق رمزنگاری‌شده اختصاصی سینا ضرغامی (Web Crypto AES-256-GCM Vault)
// ذخیره امن کلیدهای حساس (GitHub Token, Repo, Gemini API Key)
// با رمز عبور ثابت ادمین بدون نیاز به وارد کردن مجدد در دستگاه‌های جدید
// بدون وابستگی به کتابخانه‌های خارجی و با استاندارد native مرورگر
// =====================================================================

export interface AdminSecrets {
  githubToken: string;
  githubRepo: string;
  geminiApiKey: string;
}

const SESSION_VAULT_KEY = 'sina_unlocked_session_vault';

const encoder = new TextEncoder();
const decoder = new TextDecoder();

/**
 * ساخت کلید اولیه از رمز عبور متنی
 */
async function getPasswordKey(password: string): Promise<CryptoKey> {
  const cryptoObj = typeof window !== 'undefined' ? window.crypto : (globalThis as any).crypto;
  return cryptoObj.subtle.importKey(
    'raw',
    encoder.encode(password),
    'PBKDF2',
    false,
    ['deriveKey']
  );
}

/**
 * مشتق‌سازی کلید AES-GCM ۲۵۶ بیتی با ۱۰۰,۰۰۰ دور تکرار PBKDF2 و SHA-256
 */
async function deriveKey(passwordKey: CryptoKey, salt: Uint8Array): Promise<CryptoKey> {
  const cryptoObj = typeof window !== 'undefined' ? window.crypto : (globalThis as any).crypto;
  return cryptoObj.subtle.deriveKey(
    {
      name: 'PBKDF2',
      salt,
      iterations: 100000,
      hash: 'SHA-256',
    },
    passwordKey,
    { name: 'AES-GCM', length: 256 },
    false,
    ['encrypt', 'decrypt']
  );
}

/**
 * تبدیل باینری به Base64 بدون وابستگی به توابع خارجی
 */
function bufferToBase64(buffer: ArrayBuffer | Uint8Array): string {
  const bytes = buffer instanceof Uint8Array ? buffer : new Uint8Array(buffer);
  let binary = '';
  for (let i = 0; i < bytes.byteLength; i++) {
    binary += String.fromCharCode(bytes[i]);
  }
  return btoa(binary);
}

/**
 * تبدیل Base64 به Uint8Array
 */
function base64ToUint8Array(base64: string): Uint8Array {
  const binary = atob(base64);
  const bytes = new Uint8Array(binary.length);
  for (let i = 0; i < binary.length; i++) {
    bytes[i] = binary.charCodeAt(i);
  }
  return bytes;
}

/**
 * رمزنگاری اطلاعات حساس با رمز عبور ثابت ادمین (AES-256-GCM)
 * خروجی شامل salt (16B) + iv (12B) + ciphertext در قالب یک رشته Base64 است.
 */
export async function encryptAdminSecrets(
  secretsObj: AdminSecrets,
  adminPasscode: string
): Promise<string> {
  if (!adminPasscode || !adminPasscode.trim()) {
    throw new Error('رمز عبور ادمین برای قفل‌گذاری گاوصندوق الزامی است.');
  }

  const cryptoObj = typeof window !== 'undefined' ? window.crypto : (globalThis as any).crypto;
  const salt = cryptoObj.getRandomValues(new Uint8Array(16));
  const iv = cryptoObj.getRandomValues(new Uint8Array(12));

  const passwordKey = await getPasswordKey(adminPasscode.trim());
  const aesKey = await deriveKey(passwordKey, salt);

  const plaintext = encoder.encode(JSON.stringify(secretsObj));
  const ciphertextBuffer = await cryptoObj.subtle.encrypt(
    { name: 'AES-GCM', iv },
    aesKey,
    plaintext
  );
  const ciphertext = new Uint8Array(ciphertextBuffer);

  // بسته‌بندی یکپارچه: [salt: 16B][iv: 12B][ciphertext: nB]
  const combined = new Uint8Array(16 + 12 + ciphertext.length);
  combined.set(salt, 0);
  combined.set(iv, 16);
  combined.set(ciphertext, 28);

  return bufferToBase64(combined);
}

/**
 * رمزگشایی گاوصندوق با رمز عبور ادمین
 * در صورت اشتباه بودن رمز یا خراب بودن داده، مقدار null برمی‌گرداند.
 */
export async function decryptAdminSecrets(
  encryptedVaultBase64: string,
  adminPasscode: string
): Promise<AdminSecrets | null> {
  if (!encryptedVaultBase64 || !adminPasscode || !adminPasscode.trim()) {
    return null;
  }

  try {
    const combined = base64ToUint8Array(encryptedVaultBase64.trim());
    if (combined.length < 28 + 16) {
      return null;
    }

    const salt = combined.slice(0, 16);
    const iv = combined.slice(16, 28);
    const ciphertext = combined.slice(28);

    const passwordKey = await getPasswordKey(adminPasscode.trim());
    const aesKey = await deriveKey(passwordKey, salt);

    const cryptoObj = typeof window !== 'undefined' ? window.crypto : (globalThis as any).crypto;
    const decryptedBuffer = await cryptoObj.subtle.decrypt(
      { name: 'AES-GCM', iv },
      aesKey,
      ciphertext
    );

    const decryptedStr = decoder.decode(decryptedBuffer);
    const parsed = JSON.parse(decryptedStr);

    return {
      githubToken: parsed.githubToken || '',
      githubRepo: parsed.githubRepo || '',
      geminiApiKey: parsed.geminiApiKey || '',
    };
  } catch (err) {
    // خطای اعتبارسنجی رمز یا تگ احراز اصالت AES-GCM
    return null;
  }
}

/**
 * ذخیره موقت کلیدهای بازگشایی‌شده در sessionStorage
 * (تنها در طول باز بودن تب فعلی زنده می‌ماند و با بستن تب، خودکار پاک می‌شود)
 */
export function saveSessionVault(secrets: AdminSecrets): void {
  if (typeof window === 'undefined') return;
  try {
    sessionStorage.setItem(SESSION_VAULT_KEY, JSON.stringify(secrets));
  } catch (_) {}
}

/**
 * دریافت کلیدهای بازگشایی‌شده از sessionStorage
 */
export function getSessionVault(): AdminSecrets | null {
  if (typeof window === 'undefined') return null;
  try {
    const raw = sessionStorage.getItem(SESSION_VAULT_KEY);
    if (!raw) return null;
    return JSON.parse(raw);
  } catch (_) {
    return null;
  }
}

/**
 * پاکسازی گاوصندوق سشن هنگام خروج
 */
export function clearSessionVault(): void {
  if (typeof window === 'undefined') return;
  try {
    sessionStorage.removeItem(SESSION_VAULT_KEY);
  } catch (_) {}
}
