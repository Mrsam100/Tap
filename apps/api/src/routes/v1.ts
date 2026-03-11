import { Hono } from 'hono';
import { z } from 'zod';
import { db, profiles, links, contacts, pageViews, linkClicks } from '@tap/db';
import { eq, and, count, desc, sql } from 'drizzle-orm';
import { createMiddleware } from 'hono/factory';
import type { AppEnv } from '../types';
import { requireApiAuth } from '../middleware/api-auth';
import { requireFeature } from '../middleware/plan-gate';
import { createLinkSchema, updateLinkSchema } from '../lib/validation-schemas';

export const v1Routes = new Hono<AppEnv>();

// All v1 routes require API key or session auth + apiAccess feature
v1Routes.use('*', requireApiAuth);
v1Routes.use('*', requireFeature('apiAccess'));

// UUID format regex for param validation
const UUID_RE = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

// Middleware: resolve user's primary profile and attach to context
declare module 'hono' {
  interface ContextVariableMap {
    profile: typeof profiles.$inferSelect;
  }
}

const resolveProfile = createMiddleware<AppEnv>(async (c, next) => {
  const user = c.get('user');
  const [profile] = await db
    .select()
    .from(profiles)
    .where(eq(profiles.userId, user.id))
    .limit(1);

  if (!profile) {
    return c.json({ error: 'No profile found' }, 404);
  }

  c.set('profile', profile);
  await next();
});

v1Routes.use('*', resolveProfile);

// Validation schema for PATCH /profile
const updateProfileV1Schema = z.object({
  displayName: z.string().min(1).max(100).trim().optional(),
  bio: z.string().max(500).trim().optional(),
  seoTitle: z.string().max(200).trim().optional().nullable(),
  seoDescription: z.string().max(500).trim().optional().nullable(),
}).strict();

// Valid analytics periods
const VALID_PERIODS = new Set(['7d', '30d', '90d']);

// ── Profile ───────────────────────────────────────────────────────

// GET /api/v1/profile — get user's primary profile
v1Routes.get('/profile', async (c) => {
  return c.json({ profile: c.get('profile') });
});

// PATCH /api/v1/profile — update profile
v1Routes.patch('/profile', async (c) => {
  const profile = c.get('profile');
  const body = await c.req.json();
  const parsed = updateProfileV1Schema.safeParse(body);

  if (!parsed.success) {
    return c.json({ error: 'Invalid input', details: parsed.error.flatten() }, 400);
  }

  if (Object.keys(parsed.data).length === 0) {
    return c.json({ profile });
  }

  const [updated] = await db
    .update(profiles)
    .set({ ...parsed.data, updatedAt: new Date() })
    .where(eq(profiles.id, profile.id))
    .returning();

  return c.json({ profile: updated });
});

// ── Links ─────────────────────────────────────────────────────────

// GET /api/v1/links — list links (paginated)
v1Routes.get('/links', async (c) => {
  const profile = c.get('profile');

  const page = Math.max(1, parseInt(c.req.query('page') || '1'));
  const limit = Math.min(100, Math.max(1, parseInt(c.req.query('limit') || '50')));
  const offset = (page - 1) * limit;

  const [total] = await db
    .select({ count: count() })
    .from(links)
    .where(eq(links.profileId, profile.id));

  const allLinks = await db
    .select()
    .from(links)
    .where(eq(links.profileId, profile.id))
    .orderBy(links.position)
    .limit(limit)
    .offset(offset);

  return c.json({
    links: allLinks,
    total: total?.count ?? 0,
    page,
    totalPages: Math.ceil((total?.count ?? 0) / limit),
  });
});

// POST /api/v1/links — create a link
v1Routes.post('/links', async (c) => {
  const profile = c.get('profile');

  const body = await c.req.json();
  const parsed = createLinkSchema.safeParse(body);
  if (!parsed.success) {
    return c.json({ error: 'Invalid input', details: parsed.error.flatten() }, 400);
  }

  // Get max position
  const [maxPos] = await db
    .select({ maxPosition: sql<number>`COALESCE(MAX(${links.position}), -1)` })
    .from(links)
    .where(eq(links.profileId, profile.id));

  const [link] = await db
    .insert(links)
    .values({
      profileId: profile.id,
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

  return c.json({ link }, 201);
});

// PATCH /api/v1/links/:id — update a link
v1Routes.patch('/links/:id', async (c) => {
  const linkId = c.req.param('id');
  if (!UUID_RE.test(linkId)) {
    return c.json({ error: 'Invalid link ID format' }, 400);
  }

  const profile = c.get('profile');

  const body = await c.req.json();
  const parsed = updateLinkSchema.safeParse(body);
  if (!parsed.success) {
    return c.json({ error: 'Invalid input', details: parsed.error.flatten() }, 400);
  }

  // Build update data — convert date strings to Date objects properly
  const { scheduledStart, scheduledEnd, ...rest } = parsed.data;
  const updateData: Record<string, unknown> = { ...rest, updatedAt: new Date() };

  if (scheduledStart !== undefined) {
    updateData.scheduledStart = scheduledStart ? new Date(scheduledStart) : null;
  }
  if (scheduledEnd !== undefined) {
    updateData.scheduledEnd = scheduledEnd ? new Date(scheduledEnd) : null;
  }

  const [updated] = await db
    .update(links)
    .set(updateData)
    .where(and(eq(links.id, linkId), eq(links.profileId, profile.id)))
    .returning();

  if (!updated) {
    return c.json({ error: 'Link not found' }, 404);
  }

  return c.json({ link: updated });
});

// DELETE /api/v1/links/:id — delete a link
v1Routes.delete('/links/:id', async (c) => {
  const linkId = c.req.param('id');
  if (!UUID_RE.test(linkId)) {
    return c.json({ error: 'Invalid link ID format' }, 400);
  }

  const profile = c.get('profile');

  const result = await db
    .delete(links)
    .where(and(eq(links.id, linkId), eq(links.profileId, profile.id)))
    .returning({ id: links.id });

  if (result.length === 0) {
    return c.json({ error: 'Link not found' }, 404);
  }

  return c.json({ success: true });
});

// ── Analytics ─────────────────────────────────────────────────────

// GET /api/v1/analytics/overview — basic analytics summary
v1Routes.get('/analytics/overview', async (c) => {
  const profile = c.get('profile');

  const period = c.req.query('period') || '30d';
  if (!VALID_PERIODS.has(period)) {
    return c.json({ error: 'Invalid period. Use 7d, 30d, or 90d' }, 400);
  }

  const days = period === '7d' ? 7 : period === '90d' ? 90 : 30;
  const since = new Date(Date.now() - days * 86_400_000);

  const [viewCount] = await db
    .select({ count: count() })
    .from(pageViews)
    .where(and(
      eq(pageViews.profileId, profile.id),
      sql`${pageViews.createdAt} >= ${since}`,
    ));

  const [clickCount] = await db
    .select({ count: count() })
    .from(linkClicks)
    .where(and(
      eq(linkClicks.profileId, profile.id),
      sql`${linkClicks.createdAt} >= ${since}`,
    ));

  return c.json({
    overview: {
      views: viewCount?.count ?? 0,
      clicks: clickCount?.count ?? 0,
      period,
    },
  });
});

// ── Contacts ──────────────────────────────────────────────────────

// GET /api/v1/contacts — list contacts (paginated, explicit fields)
v1Routes.get('/contacts', async (c) => {
  const profile = c.get('profile');

  const page = Math.max(1, parseInt(c.req.query('page') || '1'));
  const limit = Math.min(100, Math.max(1, parseInt(c.req.query('limit') || '50')));
  const offset = (page - 1) * limit;

  const [total] = await db
    .select({ count: count() })
    .from(contacts)
    .where(eq(contacts.profileId, profile.id));

  const rows = await db
    .select({
      id: contacts.id,
      email: contacts.email,
      name: contacts.name,
      source: contacts.source,
      subscribed: contacts.subscribed,
      createdAt: contacts.createdAt,
    })
    .from(contacts)
    .where(eq(contacts.profileId, profile.id))
    .orderBy(desc(contacts.createdAt))
    .limit(limit)
    .offset(offset);

  return c.json({
    contacts: rows,
    total: total?.count ?? 0,
    page,
    totalPages: Math.ceil((total?.count ?? 0) / limit),
  });
});
