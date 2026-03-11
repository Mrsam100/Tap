import { Hono } from 'hono';
import { eq, and, asc, sql } from 'drizzle-orm';
import { db, profiles, links } from '@tap/db';
import type { AppEnv } from '../types';
import { requireAuth } from '../middleware/auth';
import { profileOwnership, linkOwnership } from '../middleware/ownership';
import { createLinkSchema, updateLinkSchema, reorderSchema, parseBody } from '../lib/validation-schemas';

export const linkRoutes = new Hono<AppEnv>();

linkRoutes.use('*', requireAuth);

// ── GET /api/profiles/:profileId/links — List links ────────────────

linkRoutes.get('/profiles/:profileId/links', profileOwnership, async (c) => {
  const profileId = c.req.param('profileId');
  const includeArchived = c.req.query('archived') === 'true';

  const conditions = [eq(links.profileId, profileId)];
  if (!includeArchived) {
    conditions.push(eq(links.isArchived, false));
  }

  const result = await db
    .select()
    .from(links)
    .where(and(...conditions))
    .orderBy(asc(links.position));

  return c.json({ links: result });
});

// ── POST /api/profiles/:profileId/links — Create link ──────────────

linkRoutes.post('/profiles/:profileId/links', profileOwnership, async (c) => {
  const profileId = c.req.param('profileId');

  // Enforce max 100 links per profile
  const [{ count }] = await db
    .select({ count: sql<number>`count(*)::int` })
    .from(links)
    .where(and(eq(links.profileId, profileId), eq(links.isArchived, false)));

  if (count >= 100) {
    return c.json({ error: 'Maximum 100 active links per profile' }, 403);
  }

  let body: unknown;
  try { body = await c.req.json(); } catch { return c.json({ error: 'Invalid JSON' }, 400); }

  const parsed = parseBody(createLinkSchema, body);
  if ('error' in parsed) return c.json({ error: parsed.error }, 400);

  // Auto-assign position at the end
  const [maxPos] = await db
    .select({ maxPosition: sql<number>`coalesce(max(${links.position}), -1)` })
    .from(links)
    .where(eq(links.profileId, profileId));

  const [link] = await db
    .insert(links)
    .values({
      profileId,
      type: parsed.data.type,
      label: parsed.data.label,
      url: parsed.data.url,
      thumbnailUrl: parsed.data.thumbnailUrl,
      isActive: parsed.data.isActive,
      style: parsed.data.style,
      metadata: parsed.data.metadata,
      scheduledStart: parsed.data.scheduledStart ? new Date(parsed.data.scheduledStart) : undefined,
      scheduledEnd: parsed.data.scheduledEnd ? new Date(parsed.data.scheduledEnd) : undefined,
      ageGate: parsed.data.ageGate,
      minAge: parsed.data.minAge,
      sensitive: parsed.data.sensitive,
      emailGate: parsed.data.emailGate,
      collectionId: parsed.data.collectionId,
      position: (maxPos?.maxPosition ?? -1) + 1,
    })
    .returning();

  // Update profile updatedAt
  await db.update(profiles).set({ updatedAt: new Date() }).where(eq(profiles.id, profileId));

  return c.json({ link }, 201);
});

// ── PATCH /api/links/:linkId — Update link ─────────────────────────

linkRoutes.patch('/links/:linkId', linkOwnership, async (c) => {
  const linkId = c.req.param('linkId');

  let body: unknown;
  try { body = await c.req.json(); } catch { return c.json({ error: 'Invalid JSON' }, 400); }

  const parsed = parseBody(updateLinkSchema, body);
  if ('error' in parsed) return c.json({ error: parsed.error }, 400);

  if (Object.keys(parsed.data).length === 0) {
    return c.json({ error: 'No fields to update' }, 400);
  }

  // Convert datetime strings to Date objects for timestamp fields (handle null to clear)
  const updateData: Record<string, unknown> = { ...parsed.data, updatedAt: new Date() };
  if (parsed.data.scheduledStart !== undefined) {
    updateData.scheduledStart = parsed.data.scheduledStart ? new Date(parsed.data.scheduledStart) : null;
  }
  if (parsed.data.scheduledEnd !== undefined) {
    updateData.scheduledEnd = parsed.data.scheduledEnd ? new Date(parsed.data.scheduledEnd) : null;
  }

  const [updated] = await db
    .update(links)
    .set(updateData)
    .where(eq(links.id, linkId))
    .returning();

  // Update profile updatedAt
  await db.update(profiles).set({ updatedAt: new Date() }).where(eq(profiles.id, updated.profileId));

  return c.json({ link: updated });
});

// ── DELETE /api/links/:linkId — Delete link ────────────────────────

linkRoutes.delete('/links/:linkId', linkOwnership, async (c) => {
  const linkId = c.req.param('linkId');

  const [deleted] = await db
    .delete(links)
    .where(eq(links.id, linkId))
    .returning({ profileId: links.profileId });

  if (deleted) {
    await db.update(profiles).set({ updatedAt: new Date() }).where(eq(profiles.id, deleted.profileId));
  }

  return c.json({ success: true });
});

// ── POST /api/links/:linkId/duplicate — Duplicate link ─────────────

linkRoutes.post('/links/:linkId/duplicate', linkOwnership, async (c) => {
  const linkId = c.req.param('linkId');

  const [source] = await db.select().from(links).where(eq(links.id, linkId)).limit(1);
  if (!source) return c.json({ error: 'Link not found' }, 404);

  // Get max position
  const [maxPos] = await db
    .select({ maxPosition: sql<number>`coalesce(max(${links.position}), -1)` })
    .from(links)
    .where(eq(links.profileId, source.profileId));

  const [cloned] = await db
    .insert(links)
    .values({
      profileId: source.profileId,
      type: source.type,
      label: source.label ? `${source.label} (Copy)` : 'Copy',
      url: source.url,
      thumbnailUrl: source.thumbnailUrl,
      position: (maxPos?.maxPosition ?? -1) + 1,
      isActive: source.isActive,
      style: source.style,
      metadata: source.metadata,
      collectionId: source.collectionId,
    })
    .returning();

  return c.json({ link: cloned }, 201);
});

// ── PATCH /api/profiles/:profileId/links/reorder — Reorder links ───

linkRoutes.patch('/profiles/:profileId/links/reorder', profileOwnership, async (c) => {
  const profileId = c.req.param('profileId');

  let body: unknown;
  try { body = await c.req.json(); } catch { return c.json({ error: 'Invalid JSON' }, 400); }

  const parsed = parseBody(reorderSchema, body);
  if ('error' in parsed) return c.json({ error: parsed.error }, 400);

  const { ids } = parsed.data;

  // Verify all IDs belong to this profile
  const existingLinks = await db
    .select({ id: links.id })
    .from(links)
    .where(eq(links.profileId, profileId));

  const existingIds = new Set(existingLinks.map(l => l.id));
  const invalidIds = ids.filter(id => !existingIds.has(id));
  if (invalidIds.length > 0) {
    return c.json({ error: 'Some link IDs do not belong to this profile' }, 400);
  }

  // Batch update positions using a CASE statement for efficiency
  if (ids.length > 0) {
    const cases = ids.map((id, i) => sql`WHEN ${links.id} = ${id} THEN ${i}`);
    await db
      .update(links)
      .set({
        position: sql`CASE ${sql.join(cases, sql` `)} ELSE ${links.position} END`,
        updatedAt: new Date(),
      })
      .where(eq(links.profileId, profileId));
  }

  await db.update(profiles).set({ updatedAt: new Date() }).where(eq(profiles.id, profileId));

  return c.json({ success: true });
});
