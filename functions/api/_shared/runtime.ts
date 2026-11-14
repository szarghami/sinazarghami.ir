export interface KVNamespaceLike {
  get(key: string): Promise<string | null>;
  put(key: string, value: string, options?: { expirationTtl?: number }): Promise<void>;
  delete(key: string): Promise<void>;
  list(options?: { prefix?: string }): Promise<{ keys: { name: string }[] }>;
}

export interface Env {
  ADMIN_INITIAL_PASSCODE?: string;
  ADMIN_PASSCODE?: string;
  ADMIN_SESSION_SECRET?: string;
  SESSION_SECRET?: string;
  ADMIN_KV?: KVNamespaceLike;
  GITHUB_TOKEN?: string;
  GITHUB_REPO?: string;
  GITHUB_BRANCH?: string;
  GEMINI_API_KEY?: string;
  GEMINI_MODEL?: string;
  TELEGRAM_BOT_TOKEN?: string;
  TELEGRAM_CHAT_ID?: string;
  ARTICLE_CRON_SECRET?: string;
  SITE_URL?: string;
}

export interface SessionPayload {
  v: 1;
  deviceId: string;
  iat: number;
  exp: number;
}

export interface DeviceRecord {
  id: string;
  label: string;
  createdAt: string;
  lastSeenAt: string;
}

const COOKIE_NAME = 'sina_admin_session';
const SESSION_TTL_SECONDS = 60 * 60 * 24 * 365;
const CREDENTIALS_KEY = 'admin:credentials';
const DEVICE_PREFIX = 'device:';

const encoder = new TextEncoder();
const decoder = new TextDecoder();

export function json(data: unknown, status = 200, headers: Record<string, string> = {}): Response {
  return new Response(JSON.stringify(data), {
    status,
    headers: {
      'Content-Type': 'application/json; charset=utf-8',
      'Cache-Control': 'no-store',
      ...headers,
    },
  });
}

export function getCookie(request: Request, name: string): string | null {
  const cookie = request.headers.get('Cookie') || '';
  for (const part of cookie.split(';')) {
    const [key, ...value] = part.trim().split('=');
    if (key === name) return value.join('=');
  }
  return null;
}

export function getSessionSecret(env: Env): string {
  return env.ADMIN_SESSION_SECRET || env.SESSION_SECRET || '';
}

export function getInitialPasscode(env: Env): string {
  return (env.ADMIN_INITIAL_PASSCODE || env.ADMIN_PASSCODE || '').trim();
}

export function getRepo(env: Env): { repo: string; branch: string } {
  return {
    repo: env.GITHUB_REPO || 'szarghami/sinazarghami.ir',
    branch: env.GITHUB_BRANCH || 'main',
  };
}

function bytesToBase64(bytes: Uint8Array): string {
  let binary = '';
  const chunk = 0x8000;
  for (let index = 0; index < bytes.length; index += chunk) {
    binary += String.fromCharCode(...bytes.subarray(index, index + chunk));
  }
  return btoa(binary);
}

function base64ToBytes(value: string): Uint8Array {
  const binary = atob(value);
  return Uint8Array.from(binary, (char) => char.charCodeAt(0));
}

function toBase64Url(bytes: Uint8Array): string {
  return bytesToBase64(bytes).replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/g, '');
}

function fromBase64Url(value: string): Uint8Array {
  const padded = value.replace(/-/g, '+').replace(/_/g, '/');
  return base64ToBytes(padded + '='.repeat((4 - (padded.length % 4)) % 4));
}

async function hmacKey(secret: string): Promise<CryptoKey> {
  return crypto.subtle.importKey(
    'raw',
    encoder.encode(secret),
    { name: 'HMAC', hash: 'SHA-256' },
    false,
    ['sign', 'verify'],
  );
}

export async function createSessionToken(deviceId: string, secret: string): Promise<string> {
  const now = Math.floor(Date.now() / 1000);
  const payload: SessionPayload = {
    v: 1,
    deviceId,
    iat: now,
    exp: now + SESSION_TTL_SECONDS,
  };
  const payloadPart = toBase64Url(encoder.encode(JSON.stringify(payload)));
  const signature = await crypto.subtle.sign('HMAC', await hmacKey(secret), encoder.encode(payloadPart));
  return `${payloadPart}.${toBase64Url(new Uint8Array(signature))}`;
}

export async function readSessionToken(token: string, secret: string): Promise<SessionPayload | null> {
  try {
    const [payloadPart, signaturePart] = token.split('.');
    if (!payloadPart || !signaturePart || !secret) return null;
    const valid = await crypto.subtle.verify(
      'HMAC',
      await hmacKey(secret),
      fromBase64Url(signaturePart).buffer as ArrayBuffer,
      encoder.encode(payloadPart),
    );
    if (!valid) return null;
    const payload = JSON.parse(decoder.decode(fromBase64Url(payloadPart))) as SessionPayload;
    if (payload.v !== 1 || !payload.deviceId || payload.exp <= Math.floor(Date.now() / 1000)) return null;
    return payload;
  } catch {
    return null;
  }
}

function sessionCookie(request: Request, token: string): string {
  const secure = new URL(request.url).protocol === 'https:' ? '; Secure' : '';
  return `${COOKIE_NAME}=${token}; Path=/; HttpOnly; SameSite=Strict; Max-Age=${SESSION_TTL_SECONDS}${secure}`;
}

export function clearSessionCookie(request: Request): string {
  const secure = new URL(request.url).protocol === 'https:' ? '; Secure' : '';
  return `${COOKIE_NAME}=; Path=/; HttpOnly; SameSite=Strict; Max-Age=0${secure}`;
}

export async function getSession(request: Request, env: Env): Promise<SessionPayload | null> {
  const secret = getSessionSecret(env);
  if (!secret) return null;
  const token = getCookie(request, COOKIE_NAME);
  if (!token) return null;
  const session = await readSessionToken(token, secret);
  if (!session) return null;
  if (env.ADMIN_KV && !(await isDeviceAllowed(env, session.deviceId))) return null;
  return session;
}

export async function requireAdmin(request: Request, env: Env): Promise<SessionPayload | null> {
  return getSession(request, env);
}

export async function makeSessionCookie(request: Request, env: Env, deviceId: string): Promise<string> {
  const secret = getSessionSecret(env);
  if (!secret) throw new Error('ADMIN_SESSION_SECRET is not configured.');
  return sessionCookie(request, await createSessionToken(deviceId, secret));
}

function constantTimeEqual(left: string, right: string): boolean {
  const max = Math.max(left.length, right.length);
  let diff = left.length ^ right.length;
  for (let index = 0; index < max; index += 1) {
    diff |= (left.charCodeAt(index) || 0) ^ (right.charCodeAt(index) || 0);
  }
  return diff === 0;
}

interface StoredCredentials {
  salt: string;
  hash: string;
  iterations: number;
}

async function derivePasscode(passcode: string, salt: Uint8Array, iterations: number): Promise<Uint8Array> {
  const material = await crypto.subtle.importKey(
    'raw',
    encoder.encode(passcode),
    'PBKDF2',
    false,
    ['deriveBits'],
  );
  const bits = await crypto.subtle.deriveBits(
    { name: 'PBKDF2', salt: salt.buffer as ArrayBuffer, iterations, hash: 'SHA-256' },
    material,
    256,
  );
  return new Uint8Array(bits);
}

export async function verifyPasscode(env: Env, passcode: string): Promise<boolean> {
  const clean = passcode.trim();
  if (!clean) return false;
  if (env.ADMIN_KV) {
    const stored = await env.ADMIN_KV.get(CREDENTIALS_KEY);
    if (stored) {
      try {
        const credentials = JSON.parse(stored) as StoredCredentials;
        const candidate = await derivePasscode(clean, base64ToBytes(credentials.salt), credentials.iterations);
        return constantTimeEqual(bytesToBase64(candidate), credentials.hash);
      } catch {
        return false;
      }
    }
  }
  const initial = getInitialPasscode(env);
  return Boolean(initial) && constantTimeEqual(clean, initial);
}

export async function savePasscode(env: Env, passcode: string): Promise<void> {
  if (!env.ADMIN_KV) throw new Error('ADMIN_KV is not configured.');
  const salt = crypto.getRandomValues(new Uint8Array(16));
  const iterations = 100_000;
  const hash = await derivePasscode(passcode, salt, iterations);
  await env.ADMIN_KV.put(
    CREDENTIALS_KEY,
    JSON.stringify({ salt: bytesToBase64(salt), hash: bytesToBase64(hash), iterations }),
  );
}

export function createDeviceId(): string {
  return crypto.randomUUID();
}

export async function registerDevice(env: Env, deviceId: string, label: string): Promise<void> {
  if (!env.ADMIN_KV) return;
  const now = new Date().toISOString();
  const existing = await env.ADMIN_KV.get(`${DEVICE_PREFIX}${deviceId}`);
  const record: DeviceRecord = existing
    ? { ...(JSON.parse(existing) as DeviceRecord), lastSeenAt: now }
    : { id: deviceId, label: label.slice(0, 120), createdAt: now, lastSeenAt: now };
  await env.ADMIN_KV.put(`${DEVICE_PREFIX}${deviceId}`, JSON.stringify(record));
}

export async function isDeviceAllowed(env: Env, deviceId: string): Promise<boolean> {
  if (!env.ADMIN_KV) return true;
  return Boolean(await env.ADMIN_KV.get(`${DEVICE_PREFIX}${deviceId}`));
}

export async function listDevices(env: Env): Promise<DeviceRecord[]> {
  if (!env.ADMIN_KV) return [];
  const result = await env.ADMIN_KV.list({ prefix: DEVICE_PREFIX });
  const records = await Promise.all(
    result.keys.map(async (key) => {
      const value = await env.ADMIN_KV!.get(key.name);
      return value ? (JSON.parse(value) as DeviceRecord) : null;
    }),
  );
  return records.filter((record): record is DeviceRecord => Boolean(record));
}

export async function revokeDevice(env: Env, deviceId: string): Promise<void> {
  if (!env.ADMIN_KV) throw new Error('ADMIN_KV is not configured.');
  await env.ADMIN_KV.delete(`${DEVICE_PREFIX}${deviceId}`);
}

export async function getGitHubFile(
  env: Env,
  path: string,
): Promise<{ content: string; sha: string } | null> {
  if (!env.GITHUB_TOKEN) throw new Error('GITHUB_TOKEN is not configured.');
  const { repo, branch } = getRepo(env);
  const response = await fetch(
    `https://api.github.com/repos/${repo}/contents/${path}?ref=${encodeURIComponent(branch)}`,
    {
      headers: {
        Authorization: `Bearer ${env.GITHUB_TOKEN}`,
        Accept: 'application/vnd.github+json',
        'User-Agent': 'sinazarghami-site',
      },
    },
  );
  if (response.status === 404) return null;
  if (!response.ok) throw new Error(`GitHub read failed (${response.status}).`);
  const data = (await response.json()) as { content: string; sha: string };
  return {
    content: decoder.decode(base64ToBytes(data.content.replace(/\n/g, ''))),
    sha: data.sha,
  };
}

export async function putGitHubFile(
  env: Env,
  path: string,
  content: string,
  message: string,
  sha?: string,
): Promise<string> {
  if (!env.GITHUB_TOKEN) throw new Error('GITHUB_TOKEN is not configured.');
  const { repo, branch } = getRepo(env);
  const response = await fetch(`https://api.github.com/repos/${repo}/contents/${path}`, {
    method: 'PUT',
    headers: {
      Authorization: `Bearer ${env.GITHUB_TOKEN}`,
      Accept: 'application/vnd.github+json',
      'Content-Type': 'application/json',
      'User-Agent': 'sinazarghami-site',
    },
    body: JSON.stringify({
      message,
      content: bytesToBase64(encoder.encode(content)),
      branch,
      ...(sha ? { sha } : {}),
    }),
  });
  if (!response.ok) {
    const body = await response.text();
    throw new Error(`GitHub write failed (${response.status}): ${body.slice(0, 300)}`);
  }
  const data = (await response.json()) as { commit?: { sha?: string } };
  return data.commit?.sha || '';
}

export async function putGitHubBinary(
  env: Env,
  path: string,
  bytes: Uint8Array,
  message: string,
): Promise<string> {
  if (!env.GITHUB_TOKEN) throw new Error('GITHUB_TOKEN is not configured.');
  const { repo, branch } = getRepo(env);
  const response = await fetch(`https://api.github.com/repos/${repo}/contents/${path}`, {
    method: 'PUT',
    headers: {
      Authorization: `Bearer ${env.GITHUB_TOKEN}`,
      Accept: 'application/vnd.github+json',
      'Content-Type': 'application/json',
      'User-Agent': 'sinazarghami-site',
    },
    body: JSON.stringify({
      message,
      content: bytesToBase64(bytes),
      branch,
    }),
  });
  if (!response.ok) {
    const body = await response.text();
    throw new Error(`GitHub media write failed (${response.status}): ${body.slice(0, 300)}`);
  }
  const data = (await response.json()) as { commit?: { sha?: string } };
  return data.commit?.sha || '';
}

export function isValidContent(value: unknown): value is Record<string, unknown> {
  if (!value || typeof value !== 'object') return false;
  const candidate = value as Record<string, unknown>;
  return Boolean(candidate.profile) && Array.isArray(candidate.photos);
}

/**
 * خواندن فایل خام (تصویر) از مخزن گیت‌هاب.
 * برای تحلیل تصویر در هوش مصنوعی استفاده می‌شود تا درخواست به دامنه‌ی خود سایت
 * ارسال نشود و محدودیت subrequest همان zone مشکل ایجاد نکند.
 */
export async function getGitHubRaw(
  env: Env,
  path: string,
): Promise<{ bytes: Uint8Array; mimeType: string } | null> {
  if (!env.GITHUB_TOKEN) throw new Error('GITHUB_TOKEN is not configured.');
  const { repo, branch } = getRepo(env);
  const response = await fetch(
    `https://api.github.com/repos/${repo}/contents/${path}?ref=${encodeURIComponent(branch)}`,
    {
      headers: {
        Authorization: `Bearer ${env.GITHUB_TOKEN}`,
        Accept: 'application/vnd.github.raw',
        'User-Agent': 'sinazarghami-site',
      },
    },
  );
  if (response.status === 404) return null;
  if (!response.ok) throw new Error(`GitHub raw read failed (${response.status}).`);
  const mimeType = (response.headers.get('content-type') || '')
    .split(';')[0]
    .trim()
    .replace('application/octet-stream', '');
  return { bytes: new Uint8Array(await response.arrayBuffer()), mimeType };
}
