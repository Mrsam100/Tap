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

/**
 * Ensure the upload directory exists.
 */
async function ensureUploadDir(): Promise<void> {
  await fs.mkdir(UPLOAD_DIR, { recursive: true });
}

/**
 * Upload a file to local storage (dev) or S3-compatible storage (prod).
 * Returns the public URL for the file.
 */
export async function uploadFile(
  buffer: Buffer | ArrayBuffer,
  originalName: string,
  contentType: string,
): Promise<UploadResult> {
  // Validate content type
  if (!ALLOWED_TYPES.has(contentType)) {
    throw new UploadError('Unsupported file type. Allowed: JPEG, PNG, GIF, WebP, SVG');
  }

  // Validate file size
  const size = buffer instanceof ArrayBuffer ? buffer.byteLength : buffer.length;
  if (size > MAX_FILE_SIZE) {
    throw new UploadError('File too large. Maximum size is 5MB');
  }

  if (size === 0) {
    throw new UploadError('File is empty');
  }

  // Generate unique filename
  const ext = getExtension(contentType);
  const hash = crypto.randomBytes(16).toString('hex');
  const filename = `${hash}${ext}`;

  // TODO: In production, upload to S3/R2 instead
  // For now, use local filesystem
  await ensureUploadDir();
  const filePath = path.join(UPLOAD_DIR, filename);
  const buf = buffer instanceof ArrayBuffer ? Buffer.from(buffer) : buffer;
  await fs.writeFile(filePath, buf);

  // In dev, serve via the API server at /uploads/filename
  const baseUrl = process.env.UPLOAD_BASE_URL || '/api/uploads/files';
  const url = `${baseUrl}/${filename}`;

  return { url, filename };
}

/**
 * Delete a file from storage.
 */
export async function deleteFile(filename: string): Promise<void> {
  // Sanitize: prevent path traversal
  const sanitized = path.basename(filename);
  const filePath = path.join(UPLOAD_DIR, sanitized);

  try {
    await fs.unlink(filePath);
  } catch (err: any) {
    if (err.code !== 'ENOENT') throw err;
    // File already gone — idempotent delete
  }
}

/**
 * Get the upload directory path (for serving static files).
 */
export function getUploadDir(): string {
  return UPLOAD_DIR;
}

function getExtension(contentType: string): string {
  const map: Record<string, string> = {
    'image/jpeg': '.jpg',
    'image/png': '.png',
    'image/gif': '.gif',
    'image/webp': '.webp',
    'image/svg+xml': '.svg',
  };
  return map[contentType] || '.bin';
}

export class UploadError extends Error {
  constructor(message: string) {
    super(message);
    this.name = 'UploadError';
  }
}
