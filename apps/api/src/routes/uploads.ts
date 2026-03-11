import { Hono } from 'hono';
import fs from 'node:fs/promises';
import path from 'node:path';
import type { AppEnv } from '../types';
import { requireAuth } from '../middleware/auth';
import { uploadFile, deleteFile, getUploadDir, UploadError } from '../lib/storage';

export const uploadRoutes = new Hono<AppEnv>();

// ── GET /api/uploads/files/:filename — Serve uploaded files ────────
// Dev only — production uses CDN/S3 direct URLs

uploadRoutes.get('/files/:filename', async (c) => {
  const filename = c.req.param('filename');
  if (!filename || filename.includes('..') || filename.includes('/') || filename.includes('\\')) {
    return c.json({ error: 'Invalid filename' }, 400);
  }

  const filePath = path.join(getUploadDir(), filename);
  try {
    const buffer = await fs.readFile(filePath);
    const ext = path.extname(filename).toLowerCase();
    const mimeTypes: Record<string, string> = {
      '.jpg': 'image/jpeg', '.jpeg': 'image/jpeg',
      '.png': 'image/png', '.gif': 'image/gif',
      '.webp': 'image/webp', '.svg': 'image/svg+xml',
    };
    const contentType = mimeTypes[ext] || 'application/octet-stream';

    c.header('Content-Type', contentType);
    c.header('Cache-Control', 'public, max-age=31536000, immutable');
    return c.body(buffer);
  } catch {
    return c.json({ error: 'File not found' }, 404);
  }
});

// ── POST /api/uploads/avatar — Upload avatar image ─────────────────

uploadRoutes.post('/avatar', requireAuth, async (c) => {
  return handleUpload(c);
});

// ── POST /api/uploads/media — Upload general media ─────────────────

uploadRoutes.post('/media', requireAuth, async (c) => {
  return handleUpload(c);
});

// ── DELETE /api/uploads/:filename — Delete uploaded file ───────────

uploadRoutes.delete('/:filename', requireAuth, async (c) => {
  const filename = c.req.param('filename');

  if (!filename || filename.includes('..') || filename.includes('/') || filename.includes('\\')) {
    return c.json({ error: 'Invalid filename' }, 400);
  }

  try {
    await deleteFile(filename);
    return c.json({ success: true });
  } catch {
    return c.json({ error: 'Failed to delete file' }, 500);
  }
});

// ── Helper ─────────────────────────────────────────────────────────

async function handleUpload(c: any) {
  try {
    const body = await c.req.parseBody();
    const file = body['file'];

    if (!file || !(file instanceof File)) {
      return c.json({ error: 'No file provided. Send as multipart/form-data with field name "file"' }, 400);
    }

    const buffer = await file.arrayBuffer();
    const result = await uploadFile(buffer, file.name, file.type);

    return c.json({ url: result.url, filename: result.filename }, 201);
  } catch (err) {
    if (err instanceof UploadError) {
      return c.json({ error: err.message }, 400);
    }
    console.error('Upload error:', err);
    return c.json({ error: 'Upload failed' }, 500);
  }
}
