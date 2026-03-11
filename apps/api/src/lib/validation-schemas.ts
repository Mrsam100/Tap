import { z } from 'zod';

// ── Shared primitives ──────────────────────────────────────────────

const ALLOWED_BLOCK_TYPES = [
  'button', 'video', 'music', 'product', 'newsletter',
  'event', 'timer', 'section', 'whatsapp',
] as const;

const ALLOWED_SOCIAL_PLATFORMS = [
  'twitter', 'instagram', 'tiktok', 'snapchat', 'facebook',
  'linkedin', 'github', 'youtube', 'email',
] as const;

/**
 * Validates that a URL string uses a safe protocol (http, https, mailto, tel).
 * Rejects javascript:, data:, and other potentially dangerous protocols.
 * Allows '#' as a placeholder and relative paths.
 */
function safeUrl(val: string): boolean {
  if (!val || val === '#') return true;
  if (val.startsWith('/')) return true;
  // Block dangerous protocols before URL parsing (whitespace-stripped, case-insensitive)
  const lower = val.toLowerCase().replace(/\s/g, '');
  if (lower.startsWith('javascript:') || lower.startsWith('data:') || lower.startsWith('vbscript:')) {
    return false;
  }
  try {
    const url = new URL(val);
    return ['http:', 'https:', 'mailto:', 'tel:'].includes(url.protocol);
  } catch {
    // Not a valid absolute URL — only allow if no protocol-like colon present
    return !val.includes(':');
  }
}

const linkStyleSchema = z.object({
  fontSize: z.enum(['sm', 'md', 'lg']).optional(),
  customColor: z.string().max(20).optional(),
  outline: z.boolean().optional(),
}).optional();

// ── Profile schemas ────────────────────────────────────────────────

export const createProfileSchema = z.object({
  displayName: z.string().min(1).max(100).trim(),
  bio: z.string().max(500).trim().optional().default(''),
  themeId: z.string().max(50).optional().default('cream'),
  fontId: z.string().max(50).optional().default('serif'),
}).strict();

export const updateProfileSchema = z.object({
  displayName: z.string().min(1).max(100).trim().optional(),
  bio: z.string().max(500).trim().optional(),
  avatarUrl: z.string().url().max(2048).optional().nullable(),
  faviconUrl: z.string().url().max(2048).optional().nullable(),
  themeId: z.string().max(50).optional(),
  fontId: z.string().max(50).optional(),
  showFluidBg: z.boolean().optional(),
  customBgUrl: z.string().max(2048).refine(
    (val) => /^(https?:\/\/|data:image\/|linear-gradient\(|radial-gradient\()/.test(val),
    { message: 'Must be a URL or CSS gradient' }
  ).optional().nullable(),
  customBgType: z.enum(['color', 'image', 'video', 'gradient']).optional().nullable(),
  customBgColor: z.string().max(7).regex(/^#[0-9a-fA-F]{3,6}$/, 'Must be a valid hex color').optional().nullable(),
  buttonStyle: z.object({
    shape: z.string().max(20).optional(),
    fill: z.string().max(20).optional(),
    shadow: z.string().max(20).optional(),
    color: z.string().max(20).optional(),
  }).optional().nullable(),
  layout: z.enum(['stack', 'grid', 'carousel', 'showcase', 'featured']).optional(),
  seoTitle: z.string().max(200).trim().optional().nullable(),
  seoDescription: z.string().max(500).trim().optional().nullable(),
  ogImageUrl: z.string().url().max(2048).optional().nullable(),
  removeBranding: z.boolean().optional(),
}).strict();

// ── Link schemas ───────────────────────────────────────────────────

export const createLinkSchema = z.object({
  type: z.enum(ALLOWED_BLOCK_TYPES),
  label: z.string().max(200).trim().optional().default('New Block'),
  url: z.string().max(2048).trim().refine(safeUrl, { message: 'URL uses an unsafe protocol' }).optional().default('#'),
  thumbnailUrl: z.string().url().max(2048).optional().nullable(),
  isActive: z.boolean().optional().default(true),
  style: linkStyleSchema,
  metadata: z.record(z.string(), z.unknown()).optional().nullable(),
  scheduledStart: z.string().datetime().optional().nullable(),
  scheduledEnd: z.string().datetime().optional().nullable(),
  ageGate: z.boolean().optional(),
  minAge: z.number().int().min(1).max(99).optional().nullable(),
  sensitive: z.boolean().optional(),
  emailGate: z.boolean().optional(),
  collectionId: z.string().uuid().optional().nullable(),
}).strict();

export const updateLinkSchema = z.object({
  type: z.enum(ALLOWED_BLOCK_TYPES).optional(),
  label: z.string().max(200).trim().optional(),
  url: z.string().max(2048).trim().refine(safeUrl, { message: 'URL uses an unsafe protocol' }).optional(),
  thumbnailUrl: z.string().url().max(2048).optional().nullable(),
  isActive: z.boolean().optional(),
  isArchived: z.boolean().optional(),
  style: linkStyleSchema,
  metadata: z.record(z.string(), z.unknown()).optional().nullable(),
  scheduledStart: z.string().datetime().optional().nullable(),
  scheduledEnd: z.string().datetime().optional().nullable(),
  ageGate: z.boolean().optional(),
  minAge: z.number().int().min(1).max(99).optional().nullable(),
  sensitive: z.boolean().optional(),
  emailGate: z.boolean().optional(),
  collectionId: z.string().uuid().optional().nullable(),
}).strict();

export const reorderSchema = z.object({
  ids: z.array(z.string().uuid()).min(1).max(500),
}).strict();

// ── Social link schemas ────────────────────────────────────────────

export const createSocialSchema = z.object({
  platform: z.enum(ALLOWED_SOCIAL_PLATFORMS),
  url: z.string().min(1).max(2048).trim().refine(safeUrl, { message: 'URL uses an unsafe protocol' }),
}).strict();

export const updateSocialSchema = z.object({
  platform: z.enum(ALLOWED_SOCIAL_PLATFORMS).optional(),
  url: z.string().min(1).max(2048).trim().refine(safeUrl, { message: 'URL uses an unsafe protocol' }).optional(),
}).strict();

// ── Collection schemas ─────────────────────────────────────────────

export const createCollectionSchema = z.object({
  title: z.string().min(1).max(200).trim(),
  isCollapsedDefault: z.boolean().optional().default(false),
}).strict();

export const updateCollectionSchema = z.object({
  title: z.string().min(1).max(200).trim().optional(),
  isCollapsedDefault: z.boolean().optional(),
}).strict();

// ── Product schemas ───────────────────────────────────────────────

const ALLOWED_PRODUCT_TYPES = ['digital', 'service'] as const;
const ALLOWED_CURRENCIES = ['USD', 'EUR', 'GBP', 'CAD', 'AUD'] as const;

export const createProductSchema = z.object({
  name: z.string().min(1).max(200).trim(),
  description: z.string().max(2000).trim().optional().nullable(),
  priceCents: z.number().int().min(50).max(99999999), // min $0.50, max $999,999.99
  currency: z.enum(ALLOWED_CURRENCIES).optional().default('USD'),
  type: z.enum(ALLOWED_PRODUCT_TYPES),
  fileUrl: z.string().max(2048).optional().nullable(),
  imageUrl: z.string().max(2048).optional().nullable(),
}).strict();

export const updateProductSchema = z.object({
  name: z.string().min(1).max(200).trim().optional(),
  description: z.string().max(2000).trim().optional().nullable(),
  priceCents: z.number().int().min(50).max(99999999).optional(),
  currency: z.enum(ALLOWED_CURRENCIES).optional(),
  type: z.enum(ALLOWED_PRODUCT_TYPES).optional(),
  fileUrl: z.string().max(2048).optional().nullable(),
  imageUrl: z.string().max(2048).optional().nullable(),
  isActive: z.boolean().optional(),
}).strict();

// ── Tip checkout schema ──────────────────────────────────────────

export const tipCheckoutSchema = z.object({
  amountCents: z.number().int().min(100).max(50000), // $1 - $500
  tipperName: z.string().max(200).trim().optional(),
  tipperMessage: z.string().max(500).trim().optional(),
}).strict();

// ── Pixel schemas ───────────────────────────────────────────────

const ALLOWED_PIXEL_TYPES = ['ga4', 'meta', 'tiktok', 'snapchat'] as const;

export const createPixelSchema = z.object({
  type: z.enum(ALLOWED_PIXEL_TYPES),
  pixelId: z.string().min(1).max(255).trim().regex(/^[a-zA-Z0-9_\-]+$/, 'Pixel ID must be alphanumeric'),
}).strict();

export const updatePixelSchema = z.object({
  pixelId: z.string().min(1).max(255).trim().regex(/^[a-zA-Z0-9_\-]+$/, 'Pixel ID must be alphanumeric').optional(),
  isActive: z.boolean().optional(),
}).strict();

// ── Custom domain schemas ───────────────────────────────────────

export const createDomainSchema = z.object({
  domain: z.string().min(3).max(255).trim()
    .regex(/^[a-zA-Z0-9]([a-zA-Z0-9-]*[a-zA-Z0-9])?(\.[a-zA-Z0-9]([a-zA-Z0-9-]*[a-zA-Z0-9])?)*\.[a-zA-Z]{2,}$/, 'Invalid domain format'),
}).strict();

// ── Subscribe schema ────────────────────────────────────────────

export const subscribeSchema = z.object({
  planId: z.enum(['starter', 'pro', 'premium']),
}).strict();

// ── Contact schemas ─────────────────────────────────────────────

const ALLOWED_CONTACT_SOURCES = ['manual', 'email_gate', 'import', 'api'] as const;

export const createContactSchema = z.object({
  email: z.string().email().max(255).trim(),
  name: z.string().max(200).trim().optional().nullable(),
  source: z.enum(ALLOWED_CONTACT_SOURCES).optional().default('manual'),
}).strict();

export const updateContactSchema = z.object({
  name: z.string().max(200).trim().optional().nullable(),
  subscribed: z.boolean().optional(),
}).strict();

// ── Gate verification schemas ────────────────────────────────────

export const emailGateSchema = z.object({
  email: z.string().email().max(255).trim(),
  name: z.string().max(200).trim().optional(),
  website: z.string().max(255).optional(), // honeypot — bots fill this, real users don't
}).strict();

export const ageGateSchema = z.object({
  birthYear: z.number().int().min(1900).refine(
    (year) => year <= new Date().getFullYear(),
    { message: 'Birth year cannot be in the future' }
  ),
}).strict();

// ── Helper ─────────────────────────────────────────────────────────

/** Safely parse body and return validated data or Zod error */
export function parseBody<T>(schema: z.ZodSchema<T>, body: unknown): { data: T } | { error: string } {
  const result = schema.safeParse(body);
  if (!result.success) {
    const issues = result.error.issues;
    if (issues && issues.length > 0) {
      const first = issues[0];
      const path = first.path?.join('.') || '';
      return { error: path ? `${path}: ${first.message}` : first.message };
    }
    return { error: 'Invalid input' };
  }
  return { data: result.data };
}
