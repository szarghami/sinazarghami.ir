export interface PagesContext<E> {
  request: Request;
  env: E;
  next(request?: Request): Promise<Response>;
}

export interface Env {
  ADMIN_EMAIL?: string;
  DB: D1Database;
  MEDIA: R2Bucket;
  GEMINI_API_KEY?: string;
  ADMIN_INITIAL_PASSCODE?: string;
  ADMIN_SESSION_SECRET?: string;
  MEDIA_PUBLIC_URL?: string;
}

export interface D1Database {
  prepare(query: string): D1PreparedStatement;
  batch<T = unknown>(statements: D1PreparedStatement[]): Promise<T[]>;
}

export interface D1PreparedStatement {
  bind(...values: unknown[]): D1PreparedStatement;
  first<T = Record<string, unknown>>(): Promise<T | null>;
  all<T = Record<string, unknown>>(): Promise<{ results: T[] }>;
  run<T = unknown>(): Promise<T>;
}

export interface R2Bucket {
  put(key: string, value: ArrayBuffer | ArrayBufferView | ReadableStream, options?: { httpMetadata?: { contentType?: string } }): Promise<unknown>;
}

export function json(data: unknown, status = 200, headers: HeadersInit = {}): Response {
  return new Response(JSON.stringify(data), {
    status,
    headers: { 'Content-Type': 'application/json; charset=utf-8', 'Cache-Control': 'no-store', ...Object.fromEntries(new Headers(headers)) },
  });
}

export async function bodyJson<T>(request: Request): Promise<T | null> {
  try {
    return await request.json() as T;
  } catch {
    return null;
  }
}

const encoder = new TextEncoder();
const SESSION_COOKIE = 'sina_admin_session';
const SESSION_TTL_SECONDS = 60 * 60 * 12;

function bytesToBase64Url(bytes: Uint8Array): string {
  let binary = '';
  for (const byte of bytes) binary += String.fromCharCode(byte);
  return btoa(binary).replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/g, '');
}

function base64UrlToBytes(value: string): Uint8Array {
  const base64 = value.replace(/-/g, '+').replace(/_/g, '/');
  const binary = atob(base64 + '='.repeat((4 - base64.length % 4) % 4));
  return Uint8Array.from(binary, (char) => char.charCodeAt(0));
}

async function sessionKey(secret: string): Promise<CryptoKey> {
  return crypto.subtle.importKey('raw', encoder.encode(secret), { name: 'HMAC', hash: 'SHA-256' }, false, ['sign', 'verify']);
}

export async function issueAdminSession(secret: string): Promise<string> {
  const payload = bytesToBase64Url(encoder.encode(JSON.stringify({ exp: Math.floor(Date.now() / 1000) + SESSION_TTL_SECONDS })));
  const signature = new Uint8Array(await crypto.subtle.sign('HMAC', await sessionKey(secret), encoder.encode(payload)));
  return `${payload}.${bytesToBase64Url(signature)}`;
}

export async function isAdminRequest(request: Request, env: Env): Promise<boolean> {
  if (!env.ADMIN_EMAIL) return false;
  const cookie = request.headers.get('Cookie')?.split(';').map((part) => part.trim()).find((part) => part.startsWith(`${SESSION_COOKIE}=`)) || '';
  if (!cookie) return false;
  const token = cookie.slice(SESSION_COOKIE.length + 1) || '';
  const [payload, signature] = token.split('.') || ['', ''];
  if (!payload || !signature) return false;
  try {
    const signatureBytes = Uint8Array.from(base64UrlToBytes(signature));
    const valid = await crypto.subtle.verify('HMAC', await sessionKey(secret), signatureBytes.buffer as ArrayBuffer, encoder.encode(payload));
    if (!valid) return false;
    const decoded = JSON.parse(new TextDecoder().decode(base64UrlToBytes(payload))) as { exp?: number };
    return typeof decoded.exp === 'number' && decoded.exp > Math.floor(Date.now() / 1000);
  } catch {
    return false;
  }
}

export function sessionCookie(token: string, maxAge = SESSION_TTL_SECONDS): string {
  return `${SESSION_COOKIE}=${encodeURIComponent(token)}; Path=/; HttpOnly; Secure; SameSite=Strict; Max-Age=${maxAge}`;
}

export async function hashPasscode(pin: string, salt: string): Promise<string> {
  const key = await crypto.subtle.importKey('raw', encoder.encode(pin), 'PBKDF2', false, ['deriveBits']);
  const bits = await crypto.subtle.deriveBits({ name: 'PBKDF2', salt: encoder.encode(salt), iterations: 150000, hash: 'SHA-256' }, key, 256);
  return bytesToBase64Url(new Uint8Array(bits));
}

export function validPasscode(pin: unknown): pin is string {
  return typeof pin === 'string' && pin.trim().length >= 8 && pin.trim().length <= 128;
}

export async function migrateEmbeddedImages(value: unknown, env: Env): Promise<unknown> {
  if (typeof value === 'string') {
    const match = value.match(/^data:(image\/(?:jpeg|png|webp));base64,([A-Za-z0-9+/=]+)$/);
    if (!match) return value;
    if (!env.MEDIA_PUBLIC_URL) throw new Error('MEDIA_PUBLIC_URL is not configured');
    const [, type, encoded] = match;
    let binary: string;
    try { binary = atob(encoded); } catch { throw new Error('Invalid embedded image encoding'); }
    if (!binary.length || binary.length > 10 * 1024 * 1024) throw new Error('Embedded image exceeds the 10 MB limit');
    const signatures: Record<string, number[]> = {
      'image/jpeg': [0xff, 0xd8, 0xff],
      'image/png': [0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a],
      'image/webp': [0x52, 0x49, 0x46, 0x46],
    };
    const bytes = Uint8Array.from(binary, (char) => char.charCodeAt(0));
    if (!signatures[type].every((byte, index) => bytes[index] === byte) || (type === 'image/webp' && binary.slice(8, 12) !== 'WEBP')) {
      throw new Error('Embedded image content does not match its media type');
    }
    const ext = type === 'image/jpeg' ? 'jpg' : type === 'image/png' ? 'png' : 'webp';
    const key = `images/migrated/${crypto.randomUUID()}.${ext}`;
    await env.MEDIA.put(key, bytes, { httpMetadata: { contentType: type } });
    return `${env.MEDIA_PUBLIC_URL.replace(/\/$/, '')}/${key}`;
  }
  if (Array.isArray(value)) return Promise.all(value.map((item) => migrateEmbeddedImages(item, env)));
  if (value && typeof value === 'object') {
    const entries = await Promise.all(Object.entries(value).map(async ([key, child]) => [key, await migrateEmbeddedImages(child, env)] as const));
    return Object.fromEntries(entries);
  }
  return value;
}

export async function requireAdmin(request: Request, env: Env): Promise<Response | null> {
  if (await isAdminRequest(request, env.ADMIN_SESSION_SECRET)) return null;
  return json({ error: 'احراز هویت مدیر لازم است.' }, 401);
}
