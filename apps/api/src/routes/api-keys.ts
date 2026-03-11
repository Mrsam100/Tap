import { Hono } from 'hono';
import { z } from 'zod';
import { db, apiKeys } from '@tap/db';
import { eq, and } from 'drizzle-orm';
import type { AppEnv } from '../types';
import { requireAuth } from '../middleware/auth';
import { generateApiKey } from '../lib/api-keys';

export const apiKeyRoutes = new Hono<AppEnv>();

// All routes require session auth (not API key auth — you can't create keys with keys)
apiKeyRoutes.use('*', requireAuth);

const createKeySchema = z.object({
  name: z.string().min(1).max(100).trim(),
  expiresAt: z.string().datetime().optional().nullable(),
}).strict();

// GET /api/api-keys — list user's API keys (never returns full key)
apiKeyRoutes.get('/', async (c) => {
  const user = c.get('user');

  const keys = await db
    .select({
      id: apiKeys.id,
      name: apiKeys.name,
      prefix: apiKeys.prefix,
      lastUsed: apiKeys.lastUsed,
      expiresAt: apiKeys.expiresAt,
      createdAt: apiKeys.createdAt,
    })
    .from(apiKeys)
    .where(eq(apiKeys.userId, user.id))
    .orderBy(apiKeys.createdAt);

  return c.json({ keys });
});

// POST /api/api-keys — create a new API key (returns full key ONCE)
apiKeyRoutes.post('/', async (c) => {
  const user = c.get('user');
  const body = await c.req.json();
  const parsed = createKeySchema.safeParse(body);

  if (!parsed.success) {
    return c.json({ error: 'Invalid input', details: parsed.error.flatten() }, 400);
  }

  // Limit: max 5 keys per user
  const existing = await db
    .select({ id: apiKeys.id })
    .from(apiKeys)
    .where(eq(apiKeys.userId, user.id));

  if (existing.length >= 5) {
    return c.json({ error: 'Maximum of 5 API keys per account' }, 400);
  }

  const { key, prefix, hash } = generateApiKey();

  const [created] = await db
    .insert(apiKeys)
    .values({
      userId: user.id,
      name: parsed.data.name,
      keyHash: hash,
      prefix,
      expiresAt: parsed.data.expiresAt ? new Date(parsed.data.expiresAt) : undefined,
    })
    .returning();

  return c.json({
    key, // full key — shown ONCE
    apiKey: {
      id: created.id,
      name: created.name,
      prefix: created.prefix,
      createdAt: created.createdAt,
    },
  }, 201);
});

const UUID_RE = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

// DELETE /api/api-keys/:keyId — revoke an API key
apiKeyRoutes.delete('/:keyId', async (c) => {
  const user = c.get('user');
  const keyId = c.req.param('keyId');

  if (!UUID_RE.test(keyId)) {
    return c.json({ error: 'Invalid key ID format' }, 400);
  }

  const result = await db
    .delete(apiKeys)
    .where(and(eq(apiKeys.id, keyId), eq(apiKeys.userId, user.id)))
    .returning({ id: apiKeys.id });

  if (result.length === 0) {
    return c.json({ error: 'API key not found' }, 404);
  }

  return c.json({ success: true });
});
