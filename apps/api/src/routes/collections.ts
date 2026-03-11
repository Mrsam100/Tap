import { Hono } from 'hono';
import { eq, asc, sql } from 'drizzle-orm';
import { db, profiles, links, collections } from '@tap/db';
import type { AppEnv } from '../types';
import { requireAuth } from '../middleware/auth';
import { profileOwnership, collectionOwnership } from '../middleware/ownership';
import { createCollectionSchema, updateCollectionSchema, reorderSchema, parseBody } from '../lib/validation-schemas';

export const collectionRoutes = new Hono<AppEnv>();

collectionRoutes.use('*', requireAuth);

// ── GET /api/profiles/:profileId/collections ───────────────────────

collectionRoutes.get('/profiles/:profileId/collections', profileOwnership, async (c) => {
  const profileId = c.req.param('profileId');

  const result = await db
    .select()
    .from(collections)
    .where(eq(collections.profileId, profileId))
    .orderBy(asc(collections.position));

  return c.json({ collections: result });
});

// ── POST /api/profiles/:profileId/collections — Create ─────────────

collectionRoutes.post('/profiles/:profileId/collections', profileOwnership, async (c) => {
  const profileId = c.req.param('profileId');

  // Max 20 collections
  const [{ count }] = await db
    .select({ count: sql<number>`count(*)::int` })
    .from(collections)
    .where(eq(collections.profileId, profileId));

  if (count >= 20) {
    return c.json({ error: 'Maximum 20 collections per profile' }, 403);
  }

  let body: unknown;
  try { body = await c.req.json(); } catch { return c.json({ error: 'Invalid JSON' }, 400); }

  const parsed = parseBody(createCollectionSchema, body);
  if ('error' in parsed) return c.json({ error: parsed.error }, 400);

  const [maxPos] = await db
    .select({ maxPosition: sql<number>`coalesce(max(${collections.position}), -1)` })
    .from(collections)
    .where(eq(collections.profileId, profileId));

  const [collection] = await db
    .insert(collections)
    .values({
      profileId,
      title: parsed.data.title,
      isCollapsedDefault: parsed.data.isCollapsedDefault,
      position: (maxPos?.maxPosition ?? -1) + 1,
    })
    .returning();

  return c.json({ collection }, 201);
});

// ── PATCH /api/collections/:collectionId — Update ──────────────────

collectionRoutes.patch('/collections/:collectionId', collectionOwnership, async (c) => {
  const collectionId = c.req.param('collectionId');

  let body: unknown;
  try { body = await c.req.json(); } catch { return c.json({ error: 'Invalid JSON' }, 400); }

  const parsed = parseBody(updateCollectionSchema, body);
  if ('error' in parsed) return c.json({ error: parsed.error }, 400);

  if (Object.keys(parsed.data).length === 0) {
    return c.json({ error: 'No fields to update' }, 400);
  }

  const [updated] = await db
    .update(collections)
    .set(parsed.data)
    .where(eq(collections.id, collectionId))
    .returning();

  return c.json({ collection: updated });
});

// ── DELETE /api/collections/:collectionId — Delete ─────────────────

collectionRoutes.delete('/collections/:collectionId', collectionOwnership, async (c) => {
  const collectionId = c.req.param('collectionId');

  // Unlink all links from this collection (don't delete them)
  await db
    .update(links)
    .set({ collectionId: null })
    .where(eq(links.collectionId, collectionId));

  await db.delete(collections).where(eq(collections.id, collectionId));

  return c.json({ success: true });
});

// ── PATCH /api/profiles/:profileId/collections/reorder ─────────────

collectionRoutes.patch('/profiles/:profileId/collections/reorder', profileOwnership, async (c) => {
  const profileId = c.req.param('profileId');

  let body: unknown;
  try { body = await c.req.json(); } catch { return c.json({ error: 'Invalid JSON' }, 400); }

  const parsed = parseBody(reorderSchema, body);
  if ('error' in parsed) return c.json({ error: parsed.error }, 400);

  const { ids } = parsed.data;

  const existing = await db
    .select({ id: collections.id })
    .from(collections)
    .where(eq(collections.profileId, profileId));

  const existingIds = new Set(existing.map(c => c.id));
  if (ids.some(id => !existingIds.has(id))) {
    return c.json({ error: 'Some collection IDs do not belong to this profile' }, 400);
  }

  if (ids.length > 0) {
    const cases = ids.map((id, i) => sql`WHEN ${collections.id} = ${id} THEN ${i}`);
    await db
      .update(collections)
      .set({
        position: sql`CASE ${sql.join(cases, sql` `)} ELSE ${collections.position} END`,
      })
      .where(eq(collections.profileId, profileId));
  }

  return c.json({ success: true });
});
