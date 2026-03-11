import { createMiddleware } from 'hono/factory';

/**
 * CSRF protection for cookie-authenticated mutating requests.
 *
 * Checks the Origin (or Referer) header against the allowed origins.
 * Requests using API key auth (Bearer token) bypass this check since
 * they are not vulnerable to CSRF (the token is not auto-sent by browsers).
 *
 * Only applies to state-changing methods (POST, PUT, PATCH, DELETE).
 */

const allowedOrigins = (process.env.CORS_ORIGINS || 'http://localhost:3000')
  .split(',')
  .map(o => o.trim().replace(/\/$/, '')); // strip trailing slash

const SAFE_METHODS = new Set(['GET', 'HEAD', 'OPTIONS']);

export const csrfProtection = createMiddleware(async (c, next) => {
  // Safe methods are not vulnerable to CSRF
  if (SAFE_METHODS.has(c.req.method)) {
    await next();
    return;
  }

  // API key auth is not vulnerable to CSRF (bearer tokens aren't auto-sent)
  const authHeader = c.req.header('authorization');
  if (authHeader?.startsWith('Bearer ')) {
    await next();
    return;
  }

  // Check Origin header (preferred) or Referer as fallback
  const origin = c.req.header('origin');
  const referer = c.req.header('referer');

  if (origin) {
    const clean = origin.replace(/\/$/, '');
    if (!allowedOrigins.includes(clean)) {
      return c.json({ error: 'CSRF check failed: invalid origin' }, 403);
    }
  } else if (referer) {
    try {
      const refOrigin = new URL(referer).origin.replace(/\/$/, '');
      if (!allowedOrigins.includes(refOrigin)) {
        return c.json({ error: 'CSRF check failed: invalid referer' }, 403);
      }
    } catch {
      return c.json({ error: 'CSRF check failed: invalid referer' }, 403);
    }
  }
  // If neither Origin nor Referer is present, reject the request.
  // Legitimate browsers always send at least one of these on mutating requests.
  // Non-browser clients (curl, API scripts) should use Bearer token auth instead.
  if (!origin && !referer) {
    return c.json({ error: 'CSRF check failed: missing origin' }, 403);
  }

  await next();
});
