import { Hono } from 'hono';
import { eq, and } from 'drizzle-orm';
import { db, pixels, profiles } from '@tap/db';
import { requireAuth } from '../middleware/auth';
import { profileOwnership } from '../middleware/ownership';
import { requireFeature } from '../middleware/plan-gate';
import { createPixelSchema, updatePixelSchema, parseBody } from '../lib/validation-schemas';
import type { AppEnv } from '../types';

export const pixelRoutes = new Hono<AppEnv>();

pixelRoutes.use('*', requireAuth);

// ── GET /api/profiles/:profileId/pixels ───────────────────────────

pixelRoutes.get(
  '/profiles/:profileId/pixels',
  profileOwnership,
  async (c) => {
    const profileId = c.req.param('profileId');
    const rows = await db
      .select()
      .from(pixels)
      .where(eq(pixels.profileId, profileId));
    return c.json({ pixels: rows });
  }
);

// ── POST /api/profiles/:profileId/pixels ──────────────────────────

pixelRoutes.post(
  '/profiles/:profileId/pixels',
  profileOwnership,
  requireFeature('apiAccess'), // pixels gated to Pro+
  async (c) => {
    const profileId = c.req.param('profileId');

    let body: unknown;
    try { body = await c.req.json(); } catch { return c.json({ error: 'Invalid JSON body' }, 400); }

    const parsed = parseBody(createPixelSchema, body);
    if ('error' in parsed) return c.json({ error: parsed.error }, 400);

    // Check for duplicate pixel type on this profile
    const [existing] = await db
      .select({ id: pixels.id })
      .from(pixels)
      .where(and(eq(pixels.profileId, profileId), eq(pixels.type, parsed.data.type)))
      .limit(1);

    if (existing) {
      return c.json({ error: `A ${parsed.data.type} pixel already exists for this profile` }, 409);
    }

    const [pixel] = await db
      .insert(pixels)
      .values({
        profileId,
        type: parsed.data.type,
        pixelId: parsed.data.pixelId,
      })
      .returning();

    return c.json({ pixel }, 201);
  }
);

// ── PATCH /api/pixels/:pixelId ────────────────────────────────────

pixelRoutes.patch('/pixels/:pixelId', async (c) => {
  const pixelId = c.req.param('pixelId');
  const user = c.get('user');

  // Verify ownership via profile join
  const [pixel] = await db
    .select({ id: pixels.id, profileId: pixels.profileId })
    .from(pixels)
    .innerJoin(profiles, eq(pixels.profileId, profiles.id))
    .where(and(eq(pixels.id, pixelId), eq(profiles.userId, user.id)));

  if (!pixel) return c.json({ error: 'Pixel not found' }, 404);

  let body: unknown;
  try { body = await c.req.json(); } catch { return c.json({ error: 'Invalid JSON body' }, 400); }

  const parsed = parseBody(updatePixelSchema, body);
  if ('error' in parsed) return c.json({ error: parsed.error }, 400);

  const [updated] = await db
    .update(pixels)
    .set(parsed.data)
    .where(eq(pixels.id, pixelId))
    .returning();

  return c.json({ pixel: updated });
});

// ── DELETE /api/pixels/:pixelId ───────────────────────────────────

pixelRoutes.delete('/pixels/:pixelId', async (c) => {
  const pixelId = c.req.param('pixelId');
  const user = c.get('user');

  const [pixel] = await db
    .select({ id: pixels.id })
    .from(pixels)
    .innerJoin(profiles, eq(pixels.profileId, profiles.id))
    .where(and(eq(pixels.id, pixelId), eq(profiles.userId, user.id)));

  if (!pixel) return c.json({ error: 'Pixel not found' }, 404);

  await db.delete(pixels).where(eq(pixels.id, pixelId));
  return c.json({ ok: true });
});
