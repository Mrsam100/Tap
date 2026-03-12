import fs from 'node:fs/promises';
import path from 'node:path';
import crypto from 'node:crypto';

const UPLOAD_DIR = path.resolve(process.cwd(), 'uploads');
const MAX_FILE_SIZE = 5 * 1024 * 1024; // 5MB
const ALLOWED_TYPES = new Set([
  'image/jpeg', 'image/png', 'image/gif', 'image/webp', 'image/svg+xml',
]);

export interface UploadResult {
  url: string;
  filename: string;
}

// ── S3/R2 lazy client ────────────────────────────────────────────────

let _s3: unknown = null;

function getS3(): { send: Function } {
  if (_s3) return _s3 as { send: Function };
  // eslint-disable-next-line @typescript-eslint/no-require-imports
  const { S3Client } = require('@aws-sdk/client-s3');
  const config: Record<string, unknown> = {
    region: process.env.S3_REGION || 'auto',
    credentials: {
      accessKeyId: process.env.S3_ACCESS_KEY_ID,
      secretAccessKey: process.env.S3_SECRET_ACCESS_KEY,
    },
  };
  if (process.env.S3_ENDPOINT) config.endpoint = process.env.S3_ENDPOINT;
  _s3 = new S3Client(config);
  return _s3 as { send: Function };
}

function isS3Configured(): boolean {
  return !!(process.env.S3_BUCKET_NAME && process.env.S3_ACCESS_KEY_ID && process.env.S3_SECRET_ACCESS_KEY);
}

// ── Public API ───────────────────────────────────────────────────────

/**
 * Upload a file to S3/R2 (when env vars set) or local filesystem (dev).
 */
export async function uploadFile(
  buffer: Buffer | ArrayBuffer,
  originalName: string,
  contentType: string,
): Promise<UploadResult> {
  if (!ALLOWED_TYPES.has(contentType)) {
    throw new UploadError('Unsupported file type. Allowed: JPEG, PNG, GIF, WebP, SVG');
  }

  const buf = buffer instanceof ArrayBuffer ? Buffer.from(buffer) : buffer;

  if (buf.length > MAX_FILE_SIZE) throw new UploadError('File too large. Maximum size is 5MB');
  if (buf.length === 0) throw new UploadError('File is empty');

  const ext = getExtension(contentType);
  const filename = `${crypto.randomBytes(16).toString('hex')}${ext}`;

  return isS3Configured()
    ? uploadToS3(buf, filename, contentType)
    : uploadToLocal(buf, filename);
}

async function uploadToS3(buf: Buffer, filename: string, contentType: string): Promise<UploadResult> {
  // eslint-disable-next-line @typescript-eslint/no-require-imports
  const { PutObjectCommand } = require('@aws-sdk/client-s3');
  const bucket = process.env.S3_BUCKET_NAME!;
  const key = `uploads/${filename}`;

  await getS3().send(new PutObjectCommand({
    Bucket: bucket,
    Key: key,
    Body: buf,
    ContentType: contentType,
    CacheControl: 'public, max-age=31536000, immutable',
  }));

  const baseUrl = process.env.UPLOAD_BASE_URL;
  if (!baseUrl) throw new UploadError('UPLOAD_BASE_URL must be set when using S3/R2 storage');
  return { url: `${baseUrl.replace(/\/$/, '')}/${key}`, filename };
}

async function uploadToLocal(buf: Buffer, filename: string): Promise<UploadResult> {
  await fs.mkdir(UPLOAD_DIR, { recursive: true });
  await fs.writeFile(path.join(UPLOAD_DIR, filename), buf);
  const baseUrl = process.env.UPLOAD_BASE_URL || '/api/uploads/files';
  return { url: `${baseUrl}/${filename}`, filename };
}

/**
 * Delete a file from S3/R2 or local storage.
 */
export async function deleteFile(filename: string): Promise<void> {
  const sanitized = path.basename(filename);
  if (isS3Configured()) {
    // eslint-disable-next-line @typescript-eslint/no-require-imports
    const { DeleteObjectCommand } = require('@aws-sdk/client-s3');
    try {
      await getS3().send(new DeleteObjectCommand({ Bucket: process.env.S3_BUCKET_NAME!, Key: `uploads/${sanitized}` }));
    } catch (err: unknown) {
      if ((err as { name?: string }).name !== 'NoSuchKey') throw err;
    }
  } else {
    try {
      await fs.unlink(path.join(UPLOAD_DIR, sanitized));
    } catch (err: unknown) {
      if ((err as NodeJS.ErrnoException).code !== 'ENOENT') throw err;
    }
  }
}

/** Returns upload directory path — used for local static file serving in dev */
export function getUploadDir(): string {
  return UPLOAD_DIR;
}

function getExtension(contentType: string): string {
  const map: Record<string, string> = {
    'image/jpeg': '.jpg', 'image/png': '.png', 'image/gif': '.gif',
    'image/webp': '.webp', 'image/svg+xml': '.svg',
  };
  return map[contentType] || '.bin';
}

export class UploadError extends Error {
  constructor(message: string) {
    super(message);
    this.name = 'UploadError';
  }
}
