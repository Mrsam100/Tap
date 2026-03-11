import { createMiddleware } from 'hono/factory';
import { db, apiKeys, users } from '@tap/db';
import { eq } from 'drizzle-orm';
import { hashApiKey } from '../lib/api-keys';
import type { AppEnv } from '../types';
import { getSessionCookie, validateSession, sanitizeUser } from '../lib/auth';

/**
 * Middleware that accepts either:
 * 1. API key via `Authorization: Bearer tap_live_xxx` header
 * 2. Session cookie (fallback to existing session-based auth)
 *
 * On success, sets `c.set('user', ...)` for downstream handlers.
 */
export const requireApiAuth = createMiddleware<AppEnv>(async (c, next) => {
  const authHeader = c.req.header('authorization');

  // 1. Try API key auth
  if (authHeader?.startsWith('Bearer tap_live_')) {
    const key = authHeader.slice(7); // remove "Bearer "
    const keyHash = hashApiKey(key);

    const [row] = await db
      .select({
        keyId: apiKeys.id,
        userId: apiKeys.userId,
        expiresAt: apiKeys.expiresAt,
      })
      .from(apiKeys)
      .where(eq(apiKeys.keyHash, keyHash))
      .limit(1);

    if (!row) {
      return c.json({ error: 'Invalid API key' }, 401);
    }

    // Check expiry
    if (row.expiresAt && new Date(row.expiresAt) < new Date()) {
      return c.json({ error: 'API key expired' }, 401);
    }

    // Load user
    const [user] = await db
      .select()
      .from(users)
      .where(eq(users.id, row.userId))
      .limit(1);

    if (!user) {
      return c.json({ error: 'User not found' }, 401);
    }

    c.set('user', sanitizeUser(user));

    // Update lastUsed (non-blocking)
    db.update(apiKeys)
      .set({ lastUsed: new Date() })
      .where(eq(apiKeys.id, row.keyId))
      .catch(() => {});

    await next();
    return;
  }

  // 2. Fall back to session cookie auth
  const sessionId = getSessionCookie(c);
  if (!sessionId) {
    return c.json({ error: 'Unauthorized — provide API key or session' }, 401);
  }

  const result = await validateSession(sessionId);
  if (!result) {
    return c.json({ error: 'Unauthorized' }, 401);
  }

  c.set('user', sanitizeUser(result.user));
  c.set('session', result.session);
  await next();
});
