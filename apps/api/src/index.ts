import { serve } from '@hono/node-server';
import { Hono } from 'hono';
import { cors } from 'hono/cors';
import { logger } from 'hono/logger';
import { secureHeaders } from 'hono/secure-headers';
import 'dotenv/config';

import { healthRoutes } from './routes/health';
import { aiRoutes } from './routes/ai';
import { authRoutes } from './routes/auth';
import { profileRoutes } from './routes/profiles';
import { linkRoutes } from './routes/links';
import { socialRoutes } from './routes/socials';
import { collectionRoutes } from './routes/collections';
import { uploadRoutes } from './routes/uploads';
import { publicRoutes } from './routes/public';
import { analyticsTrackRoutes } from './routes/analytics-track';
import { analyticsRoutes } from './routes/analytics';
import { productRoutes } from './routes/products';
import { checkoutRoutes } from './routes/checkout';
import { billingRoutes } from './routes/billing';
import { connectRoutes } from './routes/connect';
import { webhookRoutes } from './routes/webhooks';
import { pixelRoutes } from './routes/pixels';
import { domainRoutes } from './routes/domains';
import { contactRoutes } from './routes/contacts';
import { gateRoutes } from './routes/gates';
import { apiKeyRoutes } from './routes/api-keys';
import { v1Routes } from './routes/v1';
import { rateLimiter } from './middleware/rate-limit';
import { requestId } from './middleware/request-id';
import { csrfProtection } from './middleware/csrf';
import { cleanupExpiredData } from './lib/auth';

// ── Startup env validation ─────────────────────────────────────────
const REQUIRED_ENV = ['DATABASE_URL'] as const;
const missing = REQUIRED_ENV.filter(k => !process.env[k]);
if (missing.length > 0) {
  console.error(`[FATAL] Missing required environment variables: ${missing.join(', ')}`);
  console.error('[FATAL] Server cannot start without these. Check your .env file.');
  process.exit(1);
}

// Warn about optional-but-important vars
const OPTIONAL_ENV: Record<string, string> = {
  RESEND_API_KEY: 'email sending (verification, password reset)',
  STRIPE_SECRET_KEY: 'billing and payments',
  GOOGLE_CLIENT_ID: 'Google OAuth login',
  GITHUB_CLIENT_ID: 'GitHub OAuth login',
};
for (const [key, purpose] of Object.entries(OPTIONAL_ENV)) {
  if (!process.env[key]) {
    console.warn(`[WARN] ${key} not set — ${purpose} will be unavailable`);
  }
}

const IS_PROD = process.env.NODE_ENV === 'production';
const app = new Hono();

// ── Global Middleware ─────────────────────────────────────────────

// Request ID — unique per request for tracing / debugging
app.use('*', requestId);

// Security headers (CSP, X-Content-Type-Options, X-Frame-Options, etc.)
app.use('*', secureHeaders({
  referrerPolicy: 'strict-origin-when-cross-origin',
  xContentTypeOptions: 'nosniff',
  xFrameOptions: 'DENY',
  strictTransportSecurity: 'max-age=31536000; includeSubDomains',
}));

// CORS - configurable via env
const allowedOrigins = (process.env.CORS_ORIGINS || 'http://localhost:3000')
  .split(',')
  .map(o => o.trim());

app.use('*', cors({
  origin: allowedOrigins,
  credentials: true,
}));

app.use('*', logger());

// CSRF protection — validates Origin/Referer on mutating requests
app.use('*', csrfProtection);

// Body size guard — reject payloads > 10MB for uploads, 1MB for others
// Checks Content-Length header AND enforces actual body size for chunked transfers
app.use('*', async (c, next) => {
  const contentLength = c.req.header('content-length');
  const isUpload = c.req.path.startsWith('/api/uploads');
  const maxSize = isUpload ? 10_485_760 : 1_048_576;

  // Fast path: reject obviously oversized requests via Content-Length
  if (contentLength && parseInt(contentLength) > maxSize) {
    return c.json({ error: 'Request body too large' }, 413);
  }

  // For requests without Content-Length (chunked), enforce limit on actual body
  const method = c.req.method;
  if ((method === 'POST' || method === 'PUT' || method === 'PATCH') && !contentLength) {
    try {
      const body = await c.req.arrayBuffer();
      if (body.byteLength > maxSize) {
        return c.json({ error: 'Request body too large' }, 413);
      }
    } catch {
      // No body or read error — let downstream handle
    }
  }

  await next();
});

// ── Rate Limits ───────────────────────────────────────────────────

// Rate limit AI endpoints (20 requests per minute per IP)
app.use('/api/ai/*', rateLimiter({ windowMs: 60_000, max: 20 }));

// Rate limit auth endpoints
app.use('/api/auth/login', rateLimiter({ windowMs: 15 * 60_000, max: 5 }));
app.use('/api/auth/register', rateLimiter({ windowMs: 15 * 60_000, max: 5 }));
app.use('/api/auth/check-username', rateLimiter({ windowMs: 60_000, max: 20, keyPrefix: 'check-username' }));
app.use('/api/auth/forgot-password', rateLimiter({ windowMs: 15 * 60_000, max: 3 }));
// V3: rate limit token-based endpoints to prevent brute-force
app.use('/api/auth/verify-email', rateLimiter({ windowMs: 15 * 60_000, max: 3 }));
app.use('/api/auth/reset-password', rateLimiter({ windowMs: 15 * 60_000, max: 5 }));
app.use('/api/auth/resend-verification', rateLimiter({ windowMs: 15 * 60_000, max: 3 }));
// V8: rate limit MFA and sensitive account endpoints
app.use('/api/auth/mfa/*', rateLimiter({ windowMs: 15 * 60_000, max: 5, keyPrefix: 'mfa' }));
app.use('/api/auth/change-password', rateLimiter({ windowMs: 15 * 60_000, max: 5, keyPrefix: 'change-pw' }));
app.use('/api/auth/delete-account', rateLimiter({ windowMs: 60 * 60_000, max: 3, keyPrefix: 'delete-acct' }));

// Rate limit CRUD endpoints (60 requests per minute per IP)
app.use('/api/profiles/*', rateLimiter({ windowMs: 60_000, max: 60 }));
app.use('/api/links/*', rateLimiter({ windowMs: 60_000, max: 60 }));
app.use('/api/socials/*', rateLimiter({ windowMs: 60_000, max: 60 }));
app.use('/api/collections/*', rateLimiter({ windowMs: 60_000, max: 60 }));
app.use('/api/products/*', rateLimiter({ windowMs: 60_000, max: 60 }));
app.use('/api/pixels/*', rateLimiter({ windowMs: 60_000, max: 30 }));
app.use('/api/contacts/*', rateLimiter({ windowMs: 60_000, max: 30 }));
// Rate limit domain verification (triggers DNS lookups — 5 per minute)
app.use('/api/profiles/*/domain/verify', rateLimiter({ windowMs: 60_000, max: 5, keyPrefix: 'domain-verify' }));
app.use('/api/billing/*', rateLimiter({ windowMs: 60_000, max: 30 }));
app.use('/api/connect/*', rateLimiter({ windowMs: 60_000, max: 10 }));
// Rate limit uploads (20 per minute)
app.use('/api/uploads/*', rateLimiter({ windowMs: 60_000, max: 20 }));
// Rate limit API keys management (10 per minute)
app.use('/api/api-keys/*', rateLimiter({ windowMs: 60_000, max: 10, keyPrefix: 'api-keys' }));
// Rate limit public API v1 (60 per minute per IP)
app.use('/api/v1/*', rateLimiter({ windowMs: 60_000, max: 60, keyPrefix: 'v1' }));
// Rate limit analytics tracking (60 per minute per IP — prevent spam)
// Must be registered BEFORE the broader /api/public/* to take priority
app.use('/api/public/track/*', rateLimiter({ windowMs: 60_000, max: 60, keyPrefix: 'track' }));
// Rate limit public gate endpoints (10 per minute per IP — prevent spam submissions)
app.use('/api/public/gate/*', rateLimiter({ windowMs: 60_000, max: 10, keyPrefix: 'gate' }));
// Rate limit public checkout (10 per minute per IP — prevent abuse)
app.use('/api/public/checkout/*', rateLimiter({ windowMs: 60_000, max: 10, keyPrefix: 'checkout' }));
// V1: Rate limit webhooks (30 per minute — Stripe sends bursts but not >30/min normally)
app.use('/api/webhooks/*', rateLimiter({ windowMs: 60_000, max: 30, keyPrefix: 'webhook' }));
// Rate limit public profile reads (120 per minute per IP — higher for visitors)
app.use('/api/public/*', rateLimiter({ windowMs: 60_000, max: 120 }));

// ── Routes ────────────────────────────────────────────────────────

app.route('/health', healthRoutes);
app.route('/api/ai', aiRoutes);
app.route('/api/auth', authRoutes);
app.route('/api/profiles', profileRoutes);
// Link routes handle both /api/profiles/:id/links and /api/links/:id
app.route('/api', linkRoutes);
// Social routes handle both /api/profiles/:id/socials and /api/socials/:id
app.route('/api', socialRoutes);
// Collection routes handle both /api/profiles/:id/collections and /api/collections/:id
app.route('/api', collectionRoutes);
app.route('/api/uploads', uploadRoutes);
// Track routes must be registered BEFORE public routes so /track isn't caught by /:username
app.route('/api/public/track', analyticsTrackRoutes);
app.route('/api/public', publicRoutes);
// Analytics query routes (authenticated)
app.route('/api', analyticsRoutes);
// Product routes (authenticated)
app.route('/api', productRoutes);
// Billing routes (authenticated)
app.route('/api', billingRoutes);
// Connect routes (authenticated)
app.route('/api/connect', connectRoutes);
// Pixel routes (authenticated)
app.route('/api', pixelRoutes);
// Domain routes (authenticated)
app.route('/api', domainRoutes);
// Contact routes (authenticated)
app.route('/api', contactRoutes);
// Public gate routes (no auth — visitor-facing)
app.route('/api/public/gate', gateRoutes);
// Public checkout routes (no auth)
app.route('/api/public/checkout', checkoutRoutes);
// Stripe webhooks (no auth, signature-verified)
app.route('/api/webhooks', webhookRoutes);
// API key management (session-auth only)
app.route('/api/api-keys', apiKeyRoutes);
// Public API v1 (API key or session auth)
app.route('/api/v1', v1Routes);

// ── Error Handling ────────────────────────────────────────────────

// 404 fallback
app.notFound((c) => {
  return c.json({
    error: 'Not found',
    requestId: c.get('requestId'),
  }, 404);
});

// Global error handler — structured, safe for production
app.onError((err, c) => {
  const rid = c.get('requestId');

  // Structured log for observability
  console.error(JSON.stringify({
    level: 'error',
    requestId: rid,
    method: c.req.method,
    path: c.req.path,
    message: err.message,
    ...(IS_PROD ? {} : { stack: err.stack }),
    timestamp: new Date().toISOString(),
  }));

  return c.json({
    error: IS_PROD ? 'Internal server error' : err.message,
    requestId: rid,
  }, 500);
});

// ── Server ────────────────────────────────────────────────────────

const port = parseInt(process.env.PORT || '3001');

console.log(`Tap API running on http://localhost:${port}`);

serve({
  fetch: app.fetch,
  port,
});

// Run cleanup once at startup, then every hour
cleanupExpiredData().catch(err => console.error('Cleanup error (startup):', err));
setInterval(() => {
  cleanupExpiredData().catch(err => console.error('Cleanup error:', err));
}, 60 * 60 * 1000);

// ── Graceful shutdown ─────────────────────────────────────────────
function shutdown(signal: string) {
  console.log(`[${signal}] Shutting down gracefully...`);
  process.exit(0);
}
process.on('SIGTERM', () => shutdown('SIGTERM'));
process.on('SIGINT', () => shutdown('SIGINT'));
