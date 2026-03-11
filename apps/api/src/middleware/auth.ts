import { createMiddleware } from 'hono/factory';
import type { AppEnv } from '../types';
import { getSessionCookie, validateSession, sanitizeUser } from '../lib/auth';

export const requireAuth = createMiddleware<AppEnv>(async (c, next) => {
  const sessionId = getSessionCookie(c);
  if (!sessionId) {
    return c.json({ error: 'Unauthorized' }, 401);
  }

  const result = await validateSession(sessionId);
  if (!result) {
    return c.json({ error: 'Unauthorized' }, 401);
  }

  c.set('user', sanitizeUser(result.user));
  c.set('session', result.session);
  await next();
});

export const optionalAuth = createMiddleware<AppEnv>(async (c, next) => {
  const sessionId = getSessionCookie(c);
  if (sessionId) {
    const result = await validateSession(sessionId);
    if (result) {
      c.set('user', sanitizeUser(result.user));
      c.set('session', result.session);
    }
  }
  await next();
});
