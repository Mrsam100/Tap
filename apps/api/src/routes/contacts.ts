import { Hono } from 'hono';
import { eq, and, desc, sql, like } from 'drizzle-orm';
import { db, profiles, contacts } from '@tap/db';
import type { AppEnv } from '../types';
import { requireAuth } from '../middleware/auth';
import { profileOwnership } from '../middleware/ownership';
import { createContactSchema, updateContactSchema, parseBody } from '../lib/validation-schemas';

export const contactRoutes = new Hono<AppEnv>();

contactRoutes.use('*', requireAuth);

/** Escape SQL LIKE wildcard characters so user input is treated literally */
function escapeLike(input: string): string {
  return input.replace(/[%_\\]/g, '\\$&');
}

// ── GET /api/profiles/:profileId/contacts — List contacts ────────

contactRoutes.get('/profiles/:profileId/contacts', profileOwnership, async (c) => {
  const profileId = c.req.param('profileId');
  const search = c.req.query('search')?.trim();
  const page = Math.max(1, parseInt(c.req.query('page') || '1'));
  const limit = Math.min(100, Math.max(1, parseInt(c.req.query('limit') || '50')));
  const offset = (page - 1) * limit;

  const conditions = [eq(contacts.profileId, profileId)];
  if (search) {
    conditions.push(like(contacts.email, `%${escapeLike(search)}%`));
  }

  const [result, [{ total }]] = await Promise.all([
    db
      .select()
      .from(contacts)
      .where(and(...conditions))
      .orderBy(desc(contacts.createdAt))
      .limit(limit)
      .offset(offset),
    db
      .select({ total: sql<number>`count(*)::int` })
      .from(contacts)
      .where(and(...conditions)),
  ]);

  return c.json({
    contacts: result,
    total,
    page,
    totalPages: Math.ceil(total / limit),
  });
});

// ── GET /api/profiles/:profileId/contacts/overview — Stats ───────

contactRoutes.get('/profiles/:profileId/contacts/overview', profileOwnership, async (c) => {
  const profileId = c.req.param('profileId');

  const thirtyDaysAgo = new Date();
  thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

  const [totals, recentCount] = await Promise.all([
    db
      .select({
        total: sql<number>`count(*)::int`,
        subscribed: sql<number>`count(*) filter (where ${contacts.subscribed} = true)::int`,
      })
      .from(contacts)
      .where(eq(contacts.profileId, profileId)),
    db
      .select({ count: sql<number>`count(*)::int` })
      .from(contacts)
      .where(and(
        eq(contacts.profileId, profileId),
        sql`${contacts.createdAt} >= ${thirtyDaysAgo}`,
      )),
  ]);

  return c.json({
    totalContacts: totals[0].total,
    subscribedContacts: totals[0].subscribed,
    contactsChange: recentCount[0].count,
  });
});

// ── POST /api/profiles/:profileId/contacts — Add contact ─────────

contactRoutes.post('/profiles/:profileId/contacts', profileOwnership, async (c) => {
  const profileId = c.req.param('profileId');

  let body: unknown;
  try { body = await c.req.json(); } catch { return c.json({ error: 'Invalid JSON' }, 400); }

  const parsed = parseBody(createContactSchema, body);
  if ('error' in parsed) return c.json({ error: parsed.error }, 400);

  // Insert with conflict handling for race safety
  try {
    const [contact] = await db
      .insert(contacts)
      .values({
        profileId,
        email: parsed.data.email,
        name: parsed.data.name || null,
        source: parsed.data.source,
      })
      .returning();

    return c.json({ contact }, 201);
  } catch (err: any) {
    // Unique constraint violation (duplicate email for this profile)
    if (err.code === '23505') {
      return c.json({ error: 'Contact with this email already exists' }, 409);
    }
    throw err;
  }
});

// ── PATCH /api/contacts/:contactId — Update contact ──────────────

contactRoutes.patch('/contacts/:contactId', async (c) => {
  const contactId = c.req.param('contactId');
  const userId = c.get('user').id;

  // Verify ownership
  const result = await db
    .select({ contactId: contacts.id, profileId: contacts.profileId })
    .from(contacts)
    .innerJoin(profiles, eq(contacts.profileId, profiles.id))
    .where(and(eq(contacts.id, contactId), eq(profiles.userId, userId)))
    .limit(1);

  if (result.length === 0) return c.json({ error: 'Contact not found' }, 404);

  let body: unknown;
  try { body = await c.req.json(); } catch { return c.json({ error: 'Invalid JSON' }, 400); }

  const parsed = parseBody(updateContactSchema, body);
  if ('error' in parsed) return c.json({ error: parsed.error }, 400);

  if (Object.keys(parsed.data).length === 0) {
    return c.json({ error: 'No fields to update' }, 400);
  }

  const [updated] = await db
    .update(contacts)
    .set(parsed.data)
    .where(and(eq(contacts.id, contactId), eq(contacts.profileId, result[0].profileId)))
    .returning();

  return c.json({ contact: updated });
});

// ── DELETE /api/contacts/:contactId — Delete contact ─────────────

contactRoutes.delete('/contacts/:contactId', async (c) => {
  const contactId = c.req.param('contactId');
  const userId = c.get('user').id;

  // Verify ownership
  const result = await db
    .select({ contactId: contacts.id, profileId: contacts.profileId })
    .from(contacts)
    .innerJoin(profiles, eq(contacts.profileId, profiles.id))
    .where(and(eq(contacts.id, contactId), eq(profiles.userId, userId)))
    .limit(1);

  if (result.length === 0) return c.json({ error: 'Contact not found' }, 404);

  await db.delete(contacts).where(and(eq(contacts.id, contactId), eq(contacts.profileId, result[0].profileId)));

  return c.json({ success: true });
});

// ── GET /api/profiles/:profileId/contacts/export — CSV export ────

const MAX_EXPORT_ROWS = 50_000;

contactRoutes.get('/profiles/:profileId/contacts/export', profileOwnership, async (c) => {
  const profileId = c.req.param('profileId');

  const result = await db
    .select({
      email: contacts.email,
      name: contacts.name,
      source: contacts.source,
      subscribed: contacts.subscribed,
      createdAt: contacts.createdAt,
    })
    .from(contacts)
    .where(eq(contacts.profileId, profileId))
    .orderBy(desc(contacts.createdAt))
    .limit(MAX_EXPORT_ROWS);

  // Build CSV with UTF-8 BOM for Excel compatibility
  const BOM = '\uFEFF';
  const header = 'email,name,source,subscribed,created_at';
  const rows = result.map(r => {
    const name = (r.name || '').replace(/"/g, '""');
    const source = (r.source || '').replace(/"/g, '""');
    const email = r.email.replace(/"/g, '""');
    return `"${email}","${name}","${source}",${r.subscribed},${r.createdAt || ''}`;
  });

  const csv = BOM + [header, ...rows].join('\n');

  c.header('Content-Type', 'text/csv; charset=utf-8');
  c.header('Content-Disposition', `attachment; filename="contacts-${profileId}.csv"`);
  return c.body(csv);
});
