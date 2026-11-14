import type { Env } from './runtime';

export const UPLOAD_PREFIX = 'upload:';
export const UPLOAD_TTL_SECONDS = 3600;
export const MAX_CHUNKS = 400;
export const MAX_CHUNK_CHARS = 40_000;
export const MAX_UPLOAD_BYTES = 8 * 1024 * 1024;

export function uploadKey(uploadId: string, index: number): string {
  return `${UPLOAD_PREFIX}${uploadId}:${index}`;
}

export function isUploadId(value: unknown): value is string {
  return typeof value === 'string' && /^[A-Za-z0-9-]{8,64}$/.test(value);
}

export function decodeBase64(value: string): Uint8Array {
  const binary = atob(value);
  const bytes = new Uint8Array(binary.length);
  for (let index = 0; index < binary.length; index += 1) {
    bytes[index] = binary.charCodeAt(index);
  }
  return bytes;
}

export function sleep(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

export async function readChunks(
  env: Env,
  uploadId: string,
  total: number,
): Promise<string[] | null> {
  if (!env.ADMIN_KV) throw new Error('ADMIN_KV is not configured.');
  for (let attempt = 0; attempt < 8; attempt += 1) {
    const values = await Promise.all(
      Array.from({ length: total }, (_, index) => env.ADMIN_KV!.get(uploadKey(uploadId, index))),
    );
    if (values.every((value) => typeof value === 'string')) {
      return values as string[];
    }
    await sleep(250);
  }
  return null;
}

export async function deleteChunks(env: Env, uploadId: string, total: number): Promise<void> {
  if (!env.ADMIN_KV) return;
  await Promise.all(
    Array.from({ length: total }, (_, index) =>
      env.ADMIN_KV!.delete(uploadKey(uploadId, index)).catch(() => undefined),
    ),
  );
}
