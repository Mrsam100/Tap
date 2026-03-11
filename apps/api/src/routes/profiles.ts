import { Hono } from 'hono';
import { eq, and, asc } from 'drizzle-orm';
import { db, profiles, links, socialLinks, collections, users } from '@tap/db';
import type { AppEnv } from '../types';
import { requireAuth } from '../middleware/auth';
import { profileOwnership } from '../middleware/ownership';
import { createProfileSchema, updateProfileSchema, parseBody } from '../lib/validation-schemas';
import { getPlan } from '../lib/stripe';

export const profileRoutes = new Hono<AppEnv>();

// All routes require authentication
profileRoutes.use('*', requireAuth);

// ── GET /api/profiles — List user's profiles ──────────────────────

profileRoutes.get('/', async (c) => {
  const userId = c.get('user').id;

  const result = await db
    .select({
      id: profiles.id,
      username: profiles.username,
      displayName: profiles.displayName,
      bio: profiles.bio,
      avatarUrl: profiles.avatarUrl,
      themeId: profiles.themeId,
      isPublished: profiles.isPublished,
      createdAt: profiles.createdAt,
      updatedAt: profiles.updatedAt,
    })
    .from(profiles)
    .where(eq(profiles.userId, userId))
    .orderBy(asc(profiles.createdAt));

  return c.json({ profiles: result });
});

// ── POST /api/profiles — Create a new profile ─────────────────────

profileRoutes.post('/', async (c) => {
  const userId = c.get('user').id;
  const user = c.get('user');

  // Free plan: max 1 profile
  const existing = await db
    .select({ id: profiles.id })
    .from(profiles)
    .where(eq(profiles.userId, userId));

  if (user.plan === 'free' && existing.length >= 1) {
    return c.json({ error: 'Free plan is limited to 1 profile. Upgrade to create more.' }, 403);
  }
  if (existing.length >= 10) {
    return c.json({ error: 'Maximum 10 profiles reached' }, 403);
  }

  let body: unknown;
  try { body = await c.req.json(); } catch { return c.json({ error: 'Invalid JSON' }, 400); }

  const parsed = parseBody(createProfileSchema, body);
  if ('error' in parsed) return c.json({ error: parsed.error }, 400);

  // Use the user's username as the profile username
  const username = user.username;

  // Check if username is already taken by another profile
  const [existingProfile] = await db
    .select({ id: profiles.id })
    .from(profiles)
    .where(eq(profiles.username, username))
    .limit(1);

  // If the username is taken (by another user's profile), append a suffix
  let profileUsername = username;
  if (existingProfile) {
    profileUsername = `${username}${Date.now().toString(36).slice(-4)}`;
  }

  const [profile] = await db
    .insert(profiles)
    .values({
      userId,
      username: profileUsername,
      displayName: parsed.data.displayName,
      bio: parsed.data.bio,
      themeId: parsed.data.themeId,
      fontId: parsed.data.fontId,
    })
    .returning();

  return c.json({ profile }, 201);
});

// ── GET /api/profiles/:profileId — Get full profile with links ────

profileRoutes.get('/:profileId', profileOwnership, async (c) => {
  const profileId = c.req.param('profileId');

  const [[profile], profileLinks, profileSocials, profileCollections] = await Promise.all([
    db.select().from(profiles).where(eq(profiles.id, profileId)).limit(1),
    db.select().from(links)
      .where(and(eq(links.profileId, profileId), eq(links.isArchived, false)))
      .orderBy(asc(links.position)),
    db.select().from(socialLinks)
      .where(eq(socialLinks.profileId, profileId))
      .orderBy(asc(socialLinks.position)),
    db.select().from(collections)
      .where(eq(collections.profileId, profileId))
      .orderBy(asc(collections.position)),
  ]);

  if (!profile) return c.json({ error: 'Profile not found' }, 404);

  return c.json({
    profile: {
      ...profile,
      links: profileLinks,
      socials: profileSocials,
      collections: profileCollections,
    },
  });
});

// ── PATCH /api/profiles/:profileId — Update profile ────────────────

profileRoutes.patch('/:profileId', profileOwnership, async (c) => {
  const profileId = c.req.param('profileId');

  let body: unknown;
  try { body = await c.req.json(); } catch { return c.json({ error: 'Invalid JSON' }, 400); }

  const parsed = parseBody(updateProfileSchema, body);
  if ('error' in parsed) return c.json({ error: parsed.error }, 400);

  // Nothing to update
  if (Object.keys(parsed.data).length === 0) {
    return c.json({ error: 'No fields to update' }, 400);
  }

  // V1+V2: Enforce plan gates on premium fields server-side
  const user = c.get('user');
  const plan = getPlan(user.plan || 'free');

  if (parsed.data.removeBranding && !plan.features.removeBranding) {
    return c.json({ error: 'Removing branding requires Pro plan or higher', requiredFeature: 'removeBranding' }, 403);
  }
  if (parsed.data.customBgUrl && !plan.features.customDomain) {
    // Background media gated to Pro+ (reuse customDomain as proxy for "pro features")
    return c.json({ error: 'Custom backgrounds require Pro plan or higher' }, 403);
  }

  const [updated] = await db
    .update(profiles)
    .set({ ...parsed.data, updatedAt: new Date() })
    .where(eq(profiles.id, profileId))
    .returning();

  return c.json({ profile: updated });
});

// ── DELETE /api/profiles/:profileId — Delete profile ───────────────

profileRoutes.delete('/:profileId', profileOwnership, async (c) => {
  const profileId = c.req.param('profileId');

  // CASCADE will delete links, socials, collections
  await db.delete(profiles).where(eq(profiles.id, profileId));

  return c.json({ success: true });
});

// ── POST /api/profiles/:profileId/publish — Toggle publish ─────────

profileRoutes.post('/:profileId/publish', profileOwnership, async (c) => {
  const profileId = c.req.param('profileId');

  // Get current profile
  const [profile] = await db
    .select()
    .from(profiles)
    .where(eq(profiles.id, profileId))
    .limit(1);

  if (!profile) return c.json({ error: 'Profile not found' }, 404);

  // If publishing, validate minimum requirements
  if (!profile.isPublished) {
    if (!profile.displayName?.trim()) {
      return c.json({ error: 'A display name is required to publish' }, 400);
    }

    const activeLinks = await db
      .select({ id: links.id })
      .from(links)
      .where(and(eq(links.profileId, profileId), eq(links.isActive, true)))
      .limit(1);

    if (activeLinks.length === 0) {
      return c.json({ error: 'At least one active link is required to publish' }, 400);
    }
  }

  const [updated] = await db
    .update(profiles)
    .set({ isPublished: !profile.isPublished, updatedAt: new Date() })
    .where(eq(profiles.id, profileId))
    .returning();

  return c.json({ profile: updated });
});

// ── POST /api/profiles/:profileId/duplicate — Clone profile ────────

profileRoutes.post('/:profileId/duplicate', profileOwnership, async (c) => {
  const userId = c.get('user').id;
  const user = c.get('user');
  const profileId = c.req.param('profileId');

  // Check plan limits
  const existing = await db
    .select({ id: profiles.id })
    .from(profiles)
    .where(eq(profiles.userId, userId));

  if (user.plan === 'free' && existing.length >= 1) {
    return c.json({ error: 'Free plan is limited to 1 profile. Upgrade to duplicate.' }, 403);
  }

  // Fetch source profile + all related data
  const [[source], sourceLinks, sourceSocials] = await Promise.all([
    db.select().from(profiles).where(eq(profiles.id, profileId)).limit(1),
    db.select().from(links).where(eq(links.profileId, profileId)).orderBy(asc(links.position)),
    db.select().from(socialLinks).where(eq(socialLinks.profileId, profileId)).orderBy(asc(socialLinks.position)),
  ]);

  if (!source) return c.json({ error: 'Profile not found' }, 404);

  const newUsername = `${source.username}_copy_${Date.now().toString(36).slice(-4)}`;

  // Use transaction to ensure profile + links + socials are cloned atomically
  const cloned = await db.transaction(async (tx) => {
    const [newProfile] = await tx
      .insert(profiles)
      .values({
        userId,
        username: newUsername,
        displayName: source.displayName ? `${source.displayName} (Copy)` : 'Copy',
        bio: source.bio,
        avatarUrl: source.avatarUrl,
        faviconUrl: source.faviconUrl,
        themeId: source.themeId,
        fontId: source.fontId,
        showFluidBg: source.showFluidBg,
        customBgUrl: source.customBgUrl,
        customBgType: source.customBgType,
        customBgColor: source.customBgColor,
        buttonStyle: source.buttonStyle,
        layout: source.layout,
        seoTitle: source.seoTitle,
        seoDescription: source.seoDescription,
        ogImageUrl: source.ogImageUrl,
        removeBranding: false,
        isPublished: false,
      })
      .returning();

    // Clone links and socials in parallel within the transaction
    await Promise.all([
      sourceLinks.length > 0
        ? tx.insert(links).values(
            sourceLinks.map((l, i) => ({
              profileId: newProfile.id,
              type: l.type,
              label: l.label,
              url: l.url,
              thumbnailUrl: l.thumbnailUrl,
              position: i,
              isActive: l.isActive,
              style: l.style,
              metadata: l.metadata,
            }))
          )
        : Promise.resolve(),
      sourceSocials.length > 0
        ? tx.insert(socialLinks).values(
            sourceSocials.map((s, i) => ({
              profileId: newProfile.id,
              platform: s.platform,
              url: s.url,
              position: i,
            }))
          )
        : Promise.resolve(),
    ]);

    return newProfile;
  });

  return c.json({ profile: cloned }, 201);
});
