import { Hono } from 'hono';
import { eq, and, asc, sql } from 'drizzle-orm';
import { db, profiles, socialLinks } from '@tap/db';
import type { AppEnv } from '../types';
import { requireAuth } from '../middleware/auth';
import { profileOwnership, socialOwnership } from '../middleware/ownership';
import { createSocialSchema, updateSocialSchema, reorderSchema, parseBody } from '../lib/validation-schemas';

export const socialRoutes = new Hono<AppEnv>();

socialRoutes.use('*', requireAuth);

// ── GET /api/profiles/:profileId/socials — List socials ────────────

socialRoutes.get('/profiles/:profileId/socials', profileOwnership, async (c) => {
  const profileId = c.req.param('profileId');

  const result = await db
    .select()
    .from(socialLinks)
    .where(eq(socialLinks.profileId, profileId))
    .orderBy(asc(socialLinks.position));

  return c.json({ socials: result });
});

// ── POST /api/profiles/:profileId/socials — Add social ─────────────

socialRoutes.post('/profiles/:profileId/socials', profileOwnership, async (c) => {
  const profileId = c.req.param('profileId');

  // Max 20 social links
  const [{ count }] = await db
    .select({ count: sql<number>`count(*)::int` })
    .from(socialLinks)
    .where(eq(socialLinks.profileId, profileId));

  if (count >= 20) {
    return c.json({ error: 'Maximum 20 social links per profile' }, 403);
  }

  let body: unknown;
  try { body = await c.req.json(); } catch { return c.json({ error: 'Invalid JSON' }, 400); }

  const parsed = parseBody(createSocialSchema, body);
  if ('error' in parsed) return c.json({ error: parsed.error }, 400);

  // Check for duplicate platform
  const [existing] = await db
    .select({ id: socialLinks.id })
    .from(socialLinks)
    .where(and(eq(socialLinks.profileId, profileId), eq(socialLinks.platform, parsed.data.platform)))
    .limit(1);

  if (existing) {
    return c.json({ error: `${parsed.data.platform} link already exists` }, 409);
  }

  // Auto-assign position
  const [maxPos] = await db
    .select({ maxPosition: sql<number>`coalesce(max(${socialLinks.position}), -1)` })
    .from(socialLinks)
    .where(eq(socialLinks.profileId, profileId));

  const [social] = await db
    .insert(socialLinks)
    .values({
      profileId,
      platform: parsed.data.platform,
      url: parsed.data.url,
      position: (maxPos?.maxPosition ?? -1) + 1,
    })
    .returning();

  await db.update(profiles).set({ updatedAt: new Date() }).where(eq(profiles.id, profileId));

  return c.json({ social }, 201);
});

// ── PATCH /api/socials/:socialId — Update social ───────────────────

socialRoutes.patch('/socials/:socialId', socialOwnership, async (c) => {
  const socialId = c.req.param('socialId');

  let body: unknown;
  try { body = await c.req.json(); } catch { return c.json({ error: 'Invalid JSON' }, 400); }

  const parsed = parseBody(updateSocialSchema, body);
  if ('error' in parsed) return c.json({ error: parsed.error }, 400);

  if (Object.keys(parsed.data).length === 0) {
    return c.json({ error: 'No fields to update' }, 400);
  }

  const [updated] = await db
    .update(socialLinks)
    .set(parsed.data)
    .where(eq(socialLinks.id, socialId))
    .returning();

  return c.json({ social: updated });
});

// ── DELETE /api/socials/:socialId — Delete social ──────────────────

socialRoutes.delete('/socials/:socialId', socialOwnership, async (c) => {
  const socialId = c.req.param('socialId');

  await db.delete(socialLinks).where(eq(socialLinks.id, socialId));

  return c.json({ success: true });
});

// ── PATCH /api/profiles/:profileId/socials/reorder ─────────────────

socialRoutes.patch('/profiles/:profileId/socials/reorder', profileOwnership, async (c) => {
  const profileId = c.req.param('profileId');

  let body: unknown;
  try { body = await c.req.json(); } catch { return c.json({ error: 'Invalid JSON' }, 400); }

  const parsed = parseBody(reorderSchema, body);
  if ('error' in parsed) return c.json({ error: parsed.error }, 400);

  const { ids } = parsed.data;

  // Verify ownership
  const existing = await db
    .select({ id: socialLinks.id })
    .from(socialLinks)
    .where(eq(socialLinks.profileId, profileId));

  const existingIds = new Set(existing.map(s => s.id));
  if (ids.some(id => !existingIds.has(id))) {
    return c.json({ error: 'Some social link IDs do not belong to this profile' }, 400);
  }

  if (ids.length > 0) {
    const cases = ids.map((id, i) => sql`WHEN ${socialLinks.id} = ${id} THEN ${i}`);
    await db
      .update(socialLinks)
      .set({
        position: sql`CASE ${sql.join(cases, sql` `)} ELSE ${socialLinks.position} END`,
      })
      .where(eq(socialLinks.profileId, profileId));
  }

  return c.json({ success: true });
});
