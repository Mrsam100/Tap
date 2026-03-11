import type { MiddlewareHandler } from 'hono';

interface RateLimitOptions {
  windowMs: number;
  max: number;
  /** Optional key prefix to scope this limiter. Defaults to the request path. */
  keyPrefix?: string;
}

const hits = new Map<string, { count: number; resetAt: number }>();

// Clean up expired entries every 5 minutes
setInterval(() => {
  const now = Date.now();
  for (const [key, val] of hits) {
    if (now > val.resetAt) hits.delete(key);
  }
}, 300_000);

// In production behind a trusted reverse proxy, X-Forwarded-For is reliable.
// When accessed directly (no proxy), fall back to the socket address.
const TRUST_PROXY = process.env.TRUST_PROXY === 'true';

export function rateLimiter({ windowMs, max, keyPrefix }: RateLimitOptions): MiddlewareHandler {
  return async (c, next) => {
    let ip = 'unknown';
    if (TRUST_PROXY) {
      // Only trust proxy headers when explicitly configured
      ip = c.req.header('x-forwarded-for')?.split(',')[0]?.trim()
        || c.req.header('x-real-ip')
        || 'unknown';
    }
    // Always prefer the real socket address when available
    if (ip === 'unknown') {
      // Hono exposes the remote address via env on Node adapter
      const env = (c as any).env;
      ip = env?.incoming?.socket?.remoteAddress
        || c.req.header('x-real-ip')
        || 'unknown';
    }

    // B4 fix: scope rate limit key by route prefix so different endpoints
    // don't share counters
    const prefix = keyPrefix || c.req.path;
    const key = `${prefix}:${ip}`;
    const now = Date.now();
    const entry = hits.get(key);

    if (!entry || now > entry.resetAt) {
      hits.set(key, { count: 1, resetAt: now + windowMs });
      await next();
      return;
    }

    entry.count++;

    if (entry.count > max) {
      c.header('Retry-After', String(Math.ceil((entry.resetAt - now) / 1000)));
      return c.json({ error: 'Too many requests' }, 429);
    }

    await next();
  };
}
