import { Hono } from 'hono';
import { eq, and } from 'drizzle-orm';
import dns from 'node:dns/promises';
import { db, customDomains, profiles } from '@tap/db';
import { requireAuth } from '../middleware/auth';
import { profileOwnership } from '../middleware/ownership';
import { requireFeature } from '../middleware/plan-gate';
import { createDomainSchema, parseBody } from '../lib/validation-schemas';
import type { AppEnv } from '../types';

export const domainRoutes = new Hono<AppEnv>();

domainRoutes.use('*', requireAuth);

// ── GET /api/profiles/:profileId/domain ───────────────────────────

domainRoutes.get(
  '/profiles/:profileId/domain',
  profileOwnership,
  async (c) => {
    const profileId = c.req.param('profileId');
    const [domain] = await db
      .select()
      .from(customDomains)
      .where(eq(customDomains.profileId, profileId))
      .limit(1);

    return c.json({ domain: domain || null });
  }
);

// ── POST /api/profiles/:profileId/domain ──────────────────────────

domainRoutes.post(
  '/profiles/:profileId/domain',
  profileOwnership,
  requireFeature('customDomain'),
  async (c) => {
    const profileId = c.req.param('profileId');

    let body: unknown;
    try { body = await c.req.json(); } catch { return c.json({ error: 'Invalid JSON body' }, 400); }

    const parsed = parseBody(createDomainSchema, body);
    if ('error' in parsed) return c.json({ error: parsed.error }, 400);

    const domainName = parsed.data.domain.toLowerCase();

    // Check if domain is already taken
    const [existing] = await db
      .select({ id: customDomains.id })
      .from(customDomains)
      .where(eq(customDomains.domain, domainName))
      .limit(1);

    if (existing) {
      return c.json({ error: 'This domain is already in use' }, 409);
    }

    // Remove any existing domain for this profile
    await db.delete(customDomains).where(eq(customDomains.profileId, profileId));

    // Generate DNS records the user should configure
    const dnsRecords = [
      { type: 'CNAME', name: domainName, value: 'cname.tap.bio', ttl: 3600 },
    ];

    const [domain] = await db
      .insert(customDomains)
      .values({
        profileId,
        domain: domainName,
        status: 'pending',
        dnsRecords,
      })
      .returning();

    return c.json({ domain }, 201);
  }
);

// ── POST /api/profiles/:profileId/domain/verify ───────────────────

domainRoutes.post(
  '/profiles/:profileId/domain/verify',
  profileOwnership,
  async (c) => {
    const profileId = c.req.param('profileId');

    const [domain] = await db
      .select()
      .from(customDomains)
      .where(eq(customDomains.profileId, profileId))
      .limit(1);

    if (!domain) return c.json({ error: 'No domain configured' }, 404);

    // Perform actual DNS CNAME lookup to verify the domain points to cname.tap.bio
    let verified = false;
    try {
      const records = await dns.resolveCname(domain.domain);
      verified = records.some(r => r.toLowerCase() === 'cname.tap.bio');
    } catch {
      // DNS lookup failed — domain not configured yet
    }

    if (!verified) {
      return c.json({
        error: 'DNS verification failed. Ensure the CNAME record points to cname.tap.bio and try again.',
        domain,
      }, 422);
    }

    const [updated] = await db
      .update(customDomains)
      .set({
        status: 'verified',
        verifiedAt: new Date(),
      })
      .where(eq(customDomains.id, domain.id))
      .returning();

    // Also update the profile's customDomain field
    await db
      .update(profiles)
      .set({ customDomain: domain.domain })
      .where(eq(profiles.id, profileId));

    return c.json({ domain: updated });
  }
);

// ── DELETE /api/profiles/:profileId/domain ────────────────────────

domainRoutes.delete(
  '/profiles/:profileId/domain',
  profileOwnership,
  async (c) => {
    const profileId = c.req.param('profileId');

    await db.delete(customDomains).where(eq(customDomains.profileId, profileId));

    // Clear profile's customDomain field
    await db
      .update(profiles)
      .set({ customDomain: null })
      .where(eq(profiles.id, profileId));

    return c.json({ ok: true });
  }
);
