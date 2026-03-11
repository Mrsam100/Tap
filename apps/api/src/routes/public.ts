import { Hono } from 'hono';
import { eq, and, asc } from 'drizzle-orm';
import { db, profiles, links, socialLinks, pixels } from '@tap/db';
import { createHash } from 'crypto';

export const publicRoutes = new Hono();

// ── GET /api/public/:username — Public profile data ────────────────

publicRoutes.get('/:username', async (c) => {
  const username = c.req.param('username')?.toLowerCase().trim();
  if (!username) return c.json({ error: 'Username required' }, 400);

  // Fetch published profile
  const [profile] = await db
    .select({
      id: profiles.id,
      username: profiles.username,
      displayName: profiles.displayName,
      bio: profiles.bio,
      avatarUrl: profiles.avatarUrl,
      faviconUrl: profiles.faviconUrl,
      themeId: profiles.themeId,
      fontId: profiles.fontId,
      showFluidBg: profiles.showFluidBg,
      customBgUrl: profiles.customBgUrl,
      customBgType: profiles.customBgType,
      customBgColor: profiles.customBgColor,
      buttonStyle: profiles.buttonStyle,
      layout: profiles.layout,
      seoTitle: profiles.seoTitle,
      seoDescription: profiles.seoDescription,
      ogImageUrl: profiles.ogImageUrl,
      removeBranding: profiles.removeBranding,
    })
    .from(profiles)
    .where(and(
      eq(profiles.username, username),
      eq(profiles.isPublished, true),
    ))
    .limit(1);

  if (!profile) {
    return c.json({ error: 'Profile not found' }, 404);
  }

  // Fetch active links, socials, and pixels in parallel
  const [activeLinks, socials, activePixels] = await Promise.all([
    db
      .select({
        id: links.id,
        type: links.type,
        label: links.label,
        url: links.url,
        thumbnailUrl: links.thumbnailUrl,
        position: links.position,
        style: links.style,
        metadata: links.metadata,
        collectionId: links.collectionId,
        // Include scheduling for time-aware rendering
        scheduledStart: links.scheduledStart,
        scheduledEnd: links.scheduledEnd,
        ageGate: links.ageGate,
        minAge: links.minAge,
        sensitive: links.sensitive,
        emailGate: links.emailGate,
      })
      .from(links)
      .where(and(
        eq(links.profileId, profile.id),
        eq(links.isActive, true),
        eq(links.isArchived, false),
      ))
      .orderBy(asc(links.position)),
    db
      .select({
        id: socialLinks.id,
        platform: socialLinks.platform,
        url: socialLinks.url,
        position: socialLinks.position,
      })
      .from(socialLinks)
      .where(eq(socialLinks.profileId, profile.id))
      .orderBy(asc(socialLinks.position)),
    db
      .select({
        type: pixels.type,
        pixelId: pixels.pixelId,
      })
      .from(pixels)
      .where(and(eq(pixels.profileId, profile.id), eq(pixels.isActive, true))),
  ]);

  // Filter out scheduled links that aren't in their active window
  const now = new Date();
  const visibleLinks = activeLinks.filter(link => {
    if (link.scheduledStart && new Date(link.scheduledStart) > now) return false;
    if (link.scheduledEnd && new Date(link.scheduledEnd) < now) return false;
    return true;
  });

  const responseBody = {
    profile: {
      ...profile,
      links: visibleLinks,
      socials,
      pixels: activePixels,
    },
  };

  // ETag based on response content hash — enables 304 Not Modified
  const etag = `"${createHash('sha256').update(JSON.stringify(responseBody)).digest('hex').slice(0, 32)}"`;
  const ifNoneMatch = c.req.header('if-none-match');
  if (ifNoneMatch === etag) {
    return c.body(null, 304);
  }

  // Cache-Control: CDN caches for 60s, stale-while-revalidate for 5 min
  c.header('Cache-Control', 'public, s-maxage=60, stale-while-revalidate=300');
  c.header('ETag', etag);

  return c.json(responseBody);
});
