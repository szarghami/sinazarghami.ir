import type { Env } from './runtime';

export const ARVAN_PART_SIZE = 8 * 1024 * 1024;
export const ARVAN_MAX_PARTS = 10_000;
export const ARVAN_PRESIGN_TTL_SECONDS = 3_600;
export const ARVAN_SINGLE_PUT_TTL_SECONDS = 900;

export interface ArvanConfig {
  endpoint: string;
  region: string;
  bucket: string;
  accessKey: string;
  secretKey: string;
  publicBase: string;
  prefix: string;
}

export function getArvanConfig(env: Env): ArvanConfig | null {
  const endpoint = (env.ARVAN_S3_ENDPOINT || '').trim().replace(/\/+$/, '');
  const region = (env.ARVAN_S3_REGION || '').trim();
  const bucket = (env.ARVAN_S3_BUCKET || '').trim();
  const accessKey = (env.ARVAN_S3_ACCESS_KEY || '').trim();
  const secretKey = (env.ARVAN_S3_SECRET_KEY || '').trim();
  if (!endpoint || !region || !bucket || !accessKey || !secretKey) return null;

  const publicBase = (env.ARVAN_PUBLIC_BASE || `${endpoint}/${bucket}`)
    .trim()
    .replace(/\/+$/, '');
  const prefix = (env.ARVAN_MEDIA_PREFIX || 'media').trim().replace(/^\/+|\/+$/g, '');

  return { endpoint, region, bucket, accessKey, secretKey, publicBase, prefix };
}

const encoder = new TextEncoder();

function encodeRfc3986(value: string): string {
  return encodeURIComponent(value).replace(
    /[!'()*]/g,
    (char) => `%${char.charCodeAt(0).toString(16).toUpperCase()}`,
  );
}

function toHex(buffer: ArrayBuffer): string {
  return Array.from(new Uint8Array(buffer), (byte) => byte.toString(16).padStart(2, '0')).join('');
}

async function sha256Hex(value: string): Promise<string> {
  return toHex(await crypto.subtle.digest('SHA-256', encoder.encode(value)));
}

async function hmac(key: ArrayBuffer | Uint8Array, value: string): Promise<ArrayBuffer> {
  const rawKey = key instanceof Uint8Array ? new Uint8Array(key) : new Uint8Array(key);
  const cryptoKey = await crypto.subtle.importKey(
    'raw',
    rawKey,
    { name: 'HMAC', hash: 'SHA-256' },
    false,
    ['sign'],
  );
  return crypto.subtle.sign('HMAC', cryptoKey, encoder.encode(value));
}

async function deriveSigningKey(
  secretKey: string,
  dateStamp: string,
  region: string,
  service: string,
): Promise<ArrayBuffer> {
  const dateKey = await hmac(encoder.encode(`AWS4${secretKey}`), dateStamp);
  const regionKey = await hmac(dateKey, region);
  const serviceKey = await hmac(regionKey, service);
  return hmac(serviceKey, 'aws4_request');
}

function amzDate(date: Date): { full: string; stamp: string } {
  const full = date.toISOString().replace(/[:-]|\.\d{3}/g, '');
  return { full, stamp: full.slice(0, 8) };
}

function canonicalQueryString(params: Record<string, string>): string {
  return Object.keys(params)
    .sort()
    .map((key) => `${encodeRfc3986(key)}=${encodeRfc3986(params[key])}`)
    .join('&');
}

export function arvanObjectPath(bucket: string, key: string): string {
  const segments = key.split('/').filter(Boolean).map(encodeRfc3986);
  return `/${encodeRfc3986(bucket)}/${segments.join('/')}`;
}

export interface PresignOptions {
  method: 'GET' | 'PUT' | 'POST' | 'DELETE' | 'HEAD';
  endpoint: string;
  path: string;
  query?: Record<string, string>;
  accessKey: string;
  secretKey: string;
  region: string;
  service?: string;
  expires?: number;
  date?: Date;
}

/**
 * Presigned URL با SigV4 و UNSIGNED-PAYLOAD. فقط هدر host امضا می‌شود تا
 * مرورگر بتواند بدون دانستن کلید، یک PUT مستقیم به آروان بفرستد.
 */
export async function presignUrl(options: PresignOptions): Promise<string> {
  const service = options.service || 's3';
  const date = options.date || new Date();
  const { full, stamp } = amzDate(date);
  const scope = `${stamp}/${options.region}/${service}/aws4_request`;
  const host = new URL(options.endpoint).host;

  const params: Record<string, string> = {
    'X-Amz-Algorithm': 'AWS4-HMAC-SHA256',
    'X-Amz-Credential': `${options.accessKey}/${scope}`,
    'X-Amz-Date': full,
    'X-Amz-Expires': String(options.expires ?? ARVAN_PRESIGN_TTL_SECONDS),
    'X-Amz-SignedHeaders': 'host',
    ...(options.query || {}),
  };

  const canonicalQuery = canonicalQueryString(params);
  const canonicalRequest = [
    options.method,
    options.path,
    canonicalQuery,
    `host:${host}\n`,
    'host',
    'UNSIGNED-PAYLOAD',
  ].join('\n');
  const stringToSign = [
    'AWS4-HMAC-SHA256',
    full,
    scope,
    await sha256Hex(canonicalRequest),
  ].join('\n');
  const signingKey = await deriveSigningKey(options.secretKey, stamp, options.region, service);
  const signature = toHex(await hmac(signingKey, stringToSign));

  return `${options.endpoint.replace(/\/+$/, '')}${options.path}?${canonicalQuery}&X-Amz-Signature=${signature}`;
}

export interface SignedRequestOptions {
  method: 'GET' | 'POST' | 'PUT' | 'DELETE' | 'HEAD';
  endpoint: string;
  path: string;
  query?: Record<string, string>;
  body?: string;
  contentType?: string;
  headers?: Record<string, string>;
  accessKey: string;
  secretKey: string;
  region: string;
  service?: string;
  date?: Date;
}

/**
 * درخواست امضاشده‌ی سرور به سرور. برای create/complete/abort/list چندتکه‌ای
 * استفاده می‌شود که بدنه‌شان کوچک است و از Cloudflare عبور می‌کند.
 */
export async function signedS3Request(options: SignedRequestOptions): Promise<Response> {
  const service = options.service || 's3';
  const date = options.date || new Date();
  const { full, stamp } = amzDate(date);
  const scope = `${stamp}/${options.region}/${service}/aws4_request`;
  const host = new URL(options.endpoint).host;
  const body = options.body ?? '';
  const payloadHash = await sha256Hex(body);
  const canonicalQuery = canonicalQueryString(options.query || {});

  const headers: Record<string, string> = {
    host,
    'x-amz-content-sha256': payloadHash,
    'x-amz-date': full,
  };
  if (options.contentType) headers['content-type'] = options.contentType;
  for (const [name, value] of Object.entries(options.headers || {})) {
    headers[name.toLowerCase()] = value.trim();
  }

  const sortedNames = Object.keys(headers).sort();
  const canonicalHeaders = sortedNames
    .map((name) => `${name}:${headers[name].trim()}\n`)
    .join('');
  const signedHeaders = sortedNames.join(';');
  const canonicalRequest = [
    options.method,
    options.path,
    canonicalQuery,
    canonicalHeaders,
    signedHeaders,
    payloadHash,
  ].join('\n');
  const stringToSign = [
    'AWS4-HMAC-SHA256',
    full,
    scope,
    await sha256Hex(canonicalRequest),
  ].join('\n');
  const signingKey = await deriveSigningKey(options.secretKey, stamp, options.region, service);
  const signature = toHex(await hmac(signingKey, stringToSign));
  const authorization =
    `AWS4-HMAC-SHA256 Credential=${options.accessKey}/${scope}, ` +
    `SignedHeaders=${signedHeaders}, Signature=${signature}`;

  const url = `${options.endpoint.replace(/\/+$/, '')}${options.path}` +
    (canonicalQuery ? `?${canonicalQuery}` : '');
  const requestHeaders: Record<string, string> = {
    'x-amz-content-sha256': payloadHash,
    'x-amz-date': full,
    Authorization: authorization,
  };
  if (options.contentType) requestHeaders['Content-Type'] = options.contentType;
  for (const [name, value] of Object.entries(options.headers || {})) {
    requestHeaders[name] = value;
  }

  return fetch(url, {
    method: options.method,
    headers: requestHeaders,
    body: body || undefined,
  });
}

export async function presignObject(
  config: ArvanConfig,
  method: 'GET' | 'PUT' | 'POST' | 'DELETE' | 'HEAD',
  key: string,
  query: Record<string, string> = {},
  expires?: number,
): Promise<string> {
  return presignUrl({
    method,
    endpoint: config.endpoint,
    path: arvanObjectPath(config.bucket, key),
    query,
    accessKey: config.accessKey,
    secretKey: config.secretKey,
    region: config.region,
    expires,
  });
}

export async function arvanRequest(
  config: ArvanConfig,
  method: 'GET' | 'POST' | 'PUT' | 'DELETE' | 'HEAD',
  key: string,
  options: {
    query?: Record<string, string>;
    body?: string;
    contentType?: string;
    headers?: Record<string, string>;
  } = {},
): Promise<Response> {
  return signedS3Request({
    method,
    endpoint: config.endpoint,
    path: arvanObjectPath(config.bucket, key),
    accessKey: config.accessKey,
    secretKey: config.secretKey,
    region: config.region,
    ...options,
  });
}

/**
 * آبجکت را برای خواندن عمومی باز می‌کند.
 *
 * صندوقچه‌ی آروان به‌صورت پیش‌فرض فقط لیست‌کردن را عمومی می‌کند و خود فایل‌ها
 * خصوصی می‌مانند، پس مرورگر با ۴۰۳ روبه‌رو می‌شود. با ست‌کردن ACL هر آبجکت،
 * فایل مستقیم از آروان (سرور ایرانی) و بدون عبور از Cloudflare سرو می‌شود.
 */
export async function setObjectAcl(config: ArvanConfig, key: string): Promise<void> {
  const response = await arvanRequest(config, 'PUT', key, {
    query: { acl: '' },
    headers: { 'x-amz-acl': 'public-read' },
  });
  if (response.ok) return;
  const text = await response.text().catch(() => '');
  throw new Error(s3Error(text) || `ØªÙ†Ø¸ÛŒÙ… Ø¯Ø³ØªØ±Ø³ÛŒ Ø¹Ù…ÙˆÙ…ÛŒ Ù†Ø§Ù…ÙˆÙÙ‚ Ø¨ÙˆØ¯ (${response.status}).`);
}

/** کلید همه‌ی آبجکت‌های زیر یک پیشوند (حداکثر `limit` مورد). */
export async function listObjectKeys(
  config: ArvanConfig,
  prefix: string,
  limit = 500,
): Promise<string[]> {
  const keys: string[] = [];
  let token: string | null = null;

  while (keys.length < limit) {
    const query: Record<string, string> = {
      'list-type': '2',
      prefix,
      'max-keys': String(Math.min(1000, limit - keys.length)),
    };
    if (token) query['continuation-token'] = token;

    const response = await arvanRequest(config, 'GET', '', { query });
    if (!response.ok) {
      const text = await response.text().catch(() => '');
      throw new Error(s3Error(text) || `Ø®ÙˆØ§Ù†Ø¯Ù† ÙÙ‡Ø±Ø³Øª Ø§Ø¨Ø± Ù†Ø§Ù…ÙˆÙÙ‚ Ø¨ÙˆØ¯ (${response.status}).`);
    }

    const xml = await response.text();
    const regex = /<Contents>([\s\S]*?)<\/Contents>/g;
    let match: RegExpExecArray | null;
    while ((match = regex.exec(xml))) {
      const key = xmlValue(match[1], 'Key');
      if (key) keys.push(key);
    }

    const truncated = xmlValue(xml, 'IsTruncated') === 'true';
    token = truncated ? xmlValue(xml, 'NextContinuationToken') : null;
    if (!token) break;
  }

  return keys;
}

export function xmlValue(xml: string, tag: string): string | null {
  const match = xml.match(new RegExp(`<${tag}>([\\s\\S]*?)</${tag}>`));
  return match ? match[1] : null;
}

export function s3Error(xml: string): string | null {
  if (!xml.includes('<Error>')) return null;
  const code = xmlValue(xml, 'Code') || 'Error';
  const message = xmlValue(xml, 'Message') || '';
  return message ? `${code}: ${message}` : code;
}

export interface ArvanPart {
  partNumber: number;
  etag: string;
  size: number;
}

export function parseListParts(xml: string): ArvanPart[] {
  const parts: ArvanPart[] = [];
  const regex = /<Part>([\s\S]*?)<\/Part>/g;
  let match: RegExpExecArray | null;
  while ((match = regex.exec(xml))) {
    const block = match[1];
    const partNumber = Number(xmlValue(block, 'PartNumber'));
    const etag = xmlValue(block, 'ETag');
    const size = Number(xmlValue(block, 'Size') || 0);
    if (Number.isInteger(partNumber) && partNumber > 0 && etag) {
      parts.push({ partNumber, etag, size });
    }
  }
  return parts.sort((left, right) => left.partNumber - right.partNumber);
}

export function escapeXml(value: string): string {
  return value
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&apos;');
}

export function buildCompleteXml(parts: { partNumber: number; etag: string }[]): string {
  const body = parts
    .map(
      (part) =>
        `<Part><PartNumber>${part.partNumber}</PartNumber>` +
        `<ETag>${escapeXml(part.etag)}</ETag></Part>`,
    )
    .join('');
  return `<CompleteMultipartUpload>${body}</CompleteMultipartUpload>`;
}

export function isSafeArvanKey(config: ArvanConfig, key: string): boolean {
  if (!key.startsWith(`${config.prefix}/`)) return false;
  if (key.length > 512 || key.includes('..')) return false;
  return /^[A-Za-z0-9/._-]+$/.test(key);
}

const MIME_EXTENSIONS: Record<string, string> = {
  'image/jpeg': 'jpg',
  'image/jpg': 'jpg',
  'image/png': 'png',
  'image/webp': 'webp',
  'video/mp4': 'mp4',
  'video/webm': 'webm',
  'video/quicktime': 'mov',
  'video/x-m4v': 'm4v',
};

export function extensionFor(mimeType: string, filename: string): string | null {
  const fromMime = MIME_EXTENSIONS[(mimeType || '').toLowerCase()];
  if (fromMime) return fromMime;
  const fromName = (filename || '').toLowerCase().match(/\.([a-z0-9]{2,5})$/);
  if (!fromName) return null;
  return ['jpg', 'jpeg', 'png', 'webp', 'mp4', 'webm', 'mov', 'm4v'].includes(fromName[1])
    ? fromName[1].replace('jpeg', 'jpg')
    : null;
}

export function buildObjectKey(
  config: ArvanConfig,
  filename: string,
  mimeType: string,
): string | null {
  const extension = extensionFor(mimeType, filename);
  if (!extension) return null;
  const now = new Date();
  const folder = `${now.getUTCFullYear()}/${String(now.getUTCMonth() + 1).padStart(2, '0')}`;
  const safeName =
    (filename || 'file')
      .toLowerCase()
      .replace(/\.[a-z0-9]{2,5}$/, '')
      .replace(/[^a-z0-9-]+/g, '-')
      .replace(/^-+|-+$/g, '')
      .slice(0, 48) || 'file';
  return `${config.prefix}/${folder}/${safeName}-${crypto.randomUUID()}.${extension}`;
}

/**
 * اگر آدرس داده‌شده به همین صندوقچه اشاره کند، کلید آبجکت را برمی‌گرداند.
 * برای خواندن امضاشده‌ی فایلی که هنوز عمومی نشده استفاده می‌شود.
 */
export function keyFromPublicUrl(config: ArvanConfig, url: string): string | null {
  const base = `${config.publicBase}/`;
  if (!url.startsWith(base)) return null;
  const key = url.slice(base.length).split(/[?#]/)[0];
  return key && isSafeArvanKey(config, key) ? key : null;
}

export function publicUrlFor(config: ArvanConfig, key: string): string {
  return `${config.publicBase}/${key}`;
}
