import { Hono } from 'hono';
import { eq, and } from 'drizzle-orm';
import { db, profiles, links, contacts } from '@tap/db';
import { emailGateSchema, ageGateSchema, parseBody } from '../lib/validation-schemas';

export const gateRoutes = new Hono();

// ── POST /api/public/gate/email/:linkId — Email gate submission ──
// Captures the visitor's email as a contact and unlocks the link.
// Does NOT return the link URL — frontend already has it from the profile data.

gateRoutes.post('/email/:linkId', async (c) => {
  const linkId = c.req.param('linkId');

  let body: unknown;
  try { body = await c.req.json(); } catch { return c.json({ error: 'Invalid JSON' }, 400); }

  const parsed = parseBody(emailGateSchema, body);
  if ('error' in parsed) return c.json({ error: parsed.error }, 400);

  // Honeypot — bots fill hidden fields; real users leave them empty
  if (parsed.data.website) {
    return c.json({ unlocked: true });
  }

  // Look up the link and its profile
  const [link] = await db
    .select({
      id: links.id,
      profileId: links.profileId,
      emailGate: links.emailGate,
      isActive: links.isActive,
    })
    .from(links)
    .where(eq(links.id, linkId))
    .limit(1);

  if (!link || !link.isActive) {
    return c.json({ error: 'Link not found' }, 404);
  }

  if (!link.emailGate) {
    return c.json({ error: 'This link does not require email verification' }, 400);
  }

  // Upsert contact — insert if new, ignore if already exists (race-safe)
  try {
    await db.insert(contacts).values({
      profileId: link.profileId,
      email: parsed.data.email,
      name: parsed.data.name || null,
      source: 'email_gate',
    }).onConflictDoNothing();
  } catch {
    // Unique constraint violation — contact already exists, safe to ignore
  }

  return c.json({ unlocked: true });
});

// ── POST /api/public/gate/age/:linkId — Age gate verification ────
// Checks if the visitor meets the minimum age requirement.

gateRoutes.post('/age/:linkId', async (c) => {
  const linkId = c.req.param('linkId');

  let body: unknown;
  try { body = await c.req.json(); } catch { return c.json({ error: 'Invalid JSON' }, 400); }

  const parsed = parseBody(ageGateSchema, body);
  if ('error' in parsed) return c.json({ error: parsed.error }, 400);

  // Look up the link
  const [link] = await db
    .select({
      id: links.id,
      ageGate: links.ageGate,
      minAge: links.minAge,
      isActive: links.isActive,
    })
    .from(links)
    .where(eq(links.id, linkId))
    .limit(1);

  if (!link || !link.isActive) {
    return c.json({ error: 'Link not found' }, 404);
  }

  if (!link.ageGate) {
    return c.json({ error: 'This link does not require age verification' }, 400);
  }

  const currentYear = new Date().getFullYear();
  const age = currentYear - parsed.data.birthYear;
  const minAge = link.minAge || 18;

  if (age < minAge) {
    return c.json({ unlocked: false, error: `You must be at least ${minAge} years old` }, 400);
  }

  return c.json({ unlocked: true });
});
