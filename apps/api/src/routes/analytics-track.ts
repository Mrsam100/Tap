import { Hono } from 'hono';
import { z } from 'zod';
import { eq, and, sql } from 'drizzle-orm';
import { db, profiles, links, pageViews, linkClicks } from '@tap/db';
import { parseBody } from '../lib/validation-schemas';
import { hashIp, extractIp, parseUserAgent, cleanReferrer } from '../lib/analytics';

export const analyticsTrackRoutes = new Hono();

// ── Schemas ───────────────────────────────────────────────────────

const trackPageViewSchema = z.object({
  profileId: z.string().uuid(),
  visitorId: z.string().max(64).optional(),
  referrer: z.string().max(2048).optional(),
  utmSource: z.string().max(255).optional(),
  utmMedium: z.string().max(255).optional(),
  utmCampaign: z.string().max(255).optional(),
}).strict();

const trackClickSchema = z.object({
  linkId: z.string().uuid(),
  profileId: z.string().uuid(),
  visitorId: z.string().max(64).optional(),
  referrer: z.string().max(2048).optional(),
}).strict();

const trackEngagementSchema = z.object({
  profileId: z.string().uuid(),
  visitorId: z.string().max(64).optional(),
  scrollDepth: z.number().int().min(0).max(100).optional(),
  timeOnPage: z.number().int().min(0).max(86400).optional(),
}).strict();

// Helper: safely parse JSON body, return null on malformed input
async function safeJsonParse(c: { req: { json: () => Promise<unknown> } }): Promise<unknown | null> {
  try {
    return await c.req.json();
  } catch {
    return null;
  }
}

// ── POST /api/public/track/pageview ───────────────────────────────

analyticsTrackRoutes.post('/pageview', async (c) => {
  const body = await safeJsonParse(c);
  if (body === null) return c.json({ ok: true }, 200); // Silently accept bad payloads

  const parsed = parseBody(trackPageViewSchema, body);
  if ('error' in parsed) return c.json({ ok: true }, 200); // Don't leak validation errors to bots

  const { data } = parsed;
  const ua = parseUserAgent(c.req.header('user-agent'));

  // Skip bots early
  if (ua.deviceType === 'bot') {
    return c.json({ ok: true });
  }

  const ip = extractIp(c.req);
  const ipHashed = hashIp(ip);
  const referrer = cleanReferrer(data.referrer);
  const today = new Date().toISOString().slice(0, 10);

  // Respond immediately — fire-and-forget the DB writes
  const writePromise = Promise.all([
    db.insert(pageViews).values({
      profileId: data.profileId,
      visitorId: data.visitorId || null,
      ipHash: ipHashed,
      referrer,
      userAgent: c.req.header('user-agent')?.slice(0, 500) || null,
      deviceType: ua.deviceType,
      browser: ua.browser,
      os: ua.os,
      utmSource: data.utmSource || null,
      utmMedium: data.utmMedium || null,
      utmCampaign: data.utmCampaign || null,
    }),
    db.execute(sql`
      INSERT INTO daily_stats (profile_id, date, views, unique_visitors, total_clicks)
      VALUES (${data.profileId}, ${today}, 1, 0, 0)
      ON CONFLICT (profile_id, date)
      DO UPDATE SET views = daily_stats.views + 1
    `),
  ]).catch((err) => {
    // Log but don't crash — profileId may not exist (enumeration-safe)
    console.error('Track pageview write error:', err.message);
  });

  // Don't await — respond immediately for lowest latency
  c.executionCtx?.waitUntil?.(writePromise);
  if (!c.executionCtx?.waitUntil) {
    // Node.js: just let the promise run in background
    writePromise.catch(() => {});
  }

  return c.json({ ok: true });
});

// ── POST /api/public/track/click ──────────────────────────────────

analyticsTrackRoutes.post('/click', async (c) => {
  const body = await safeJsonParse(c);
  if (body === null) return c.json({ ok: true }, 200);

  const parsed = parseBody(trackClickSchema, body);
  if ('error' in parsed) return c.json({ ok: true }, 200);

  const { data } = parsed;
  const ua = parseUserAgent(c.req.header('user-agent'));

  if (ua.deviceType === 'bot') {
    return c.json({ ok: true });
  }

  const referrer = cleanReferrer(data.referrer);
  const today = new Date().toISOString().slice(0, 10);

  // Fire-and-forget — don't await DB writes
  const writePromise = Promise.all([
    db.insert(linkClicks).values({
      linkId: data.linkId,
      profileId: data.profileId,
      visitorId: data.visitorId || null,
      country: null,
      referrer,
      deviceType: ua.deviceType,
    }),
    db.execute(sql`
      INSERT INTO daily_stats (profile_id, date, views, unique_visitors, total_clicks)
      VALUES (${data.profileId}, ${today}, 0, 0, 1)
      ON CONFLICT (profile_id, date)
      DO UPDATE SET total_clicks = daily_stats.total_clicks + 1
    `),
  ]).catch((err) => {
    // FK violation if linkId/profileId doesn't exist — that's fine, just log
    console.error('Track click write error:', err.message);
  });

  c.executionCtx?.waitUntil?.(writePromise);
  if (!c.executionCtx?.waitUntil) {
    writePromise.catch(() => {});
  }

  return c.json({ ok: true });
});

// ── POST /api/public/track/engagement ─────────────────────────────

analyticsTrackRoutes.post('/engagement', async (c) => {
  const body = await safeJsonParse(c);
  if (body === null) return c.json({ ok: true }, 200);

  const parsed = parseBody(trackEngagementSchema, body);
  if ('error' in parsed) return c.json({ ok: true }, 200);

  const { data } = parsed;

  if ((!data.scrollDepth && !data.timeOnPage) || !data.visitorId) {
    return c.json({ ok: true });
  }

  // Fire-and-forget
  const writePromise = db.execute(sql`
    UPDATE page_views
    SET scroll_depth = COALESCE(${data.scrollDepth ?? null}, scroll_depth),
        time_on_page = COALESCE(${data.timeOnPage ?? null}, time_on_page)
    WHERE id = (
      SELECT id FROM page_views
      WHERE profile_id = ${data.profileId}
        AND visitor_id = ${data.visitorId}
      ORDER BY created_at DESC
      LIMIT 1
    )
  `).catch((err) => {
    console.error('Track engagement write error:', err.message);
  });

  c.executionCtx?.waitUntil?.(writePromise);
  if (!c.executionCtx?.waitUntil) {
    writePromise.catch(() => {});
  }

  return c.json({ ok: true });
});
