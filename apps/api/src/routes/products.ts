import { Hono } from 'hono';
import { eq, and, desc, sql } from 'drizzle-orm';
import { db, products, orders, profiles } from '@tap/db';
import { requireAuth } from '../middleware/auth';
import { profileOwnership, productOwnership } from '../middleware/ownership';
import { createProductSchema, updateProductSchema, parseBody } from '../lib/validation-schemas';
import { getPlan } from '../lib/stripe';
import type { AppEnv } from '../types';

export const productRoutes = new Hono<AppEnv>();

productRoutes.use('*', requireAuth);

// ── GET /api/profiles/:profileId/products ─────────────────────────

productRoutes.get(
  '/profiles/:profileId/products',
  profileOwnership,
  async (c) => {
    const profileId = c.req.param('profileId');
    const includeInactive = c.req.query('includeInactive') === 'true';

    // I12: Exclude soft-deleted (inactive) products by default
    const conditions = includeInactive
      ? eq(products.profileId, profileId)
      : and(eq(products.profileId, profileId), eq(products.isActive, true));

    const rows = await db
      .select()
      .from(products)
      .where(conditions)
      .orderBy(desc(products.createdAt));

    return c.json({ products: rows });
  }
);

// ── POST /api/profiles/:profileId/products ────────────────────────

productRoutes.post(
  '/profiles/:profileId/products',
  profileOwnership,
  async (c) => {
    const profileId = c.req.param('profileId');
    const user = c.get('user');
    const plan = getPlan(user.plan || 'free');

    // B2 fix: Only count active products toward the limit
    if (plan.features.maxProducts !== -1) {
      const [countResult] = await db
        .select({ count: sql<number>`COUNT(*)::int` })
        .from(products)
        .where(and(eq(products.profileId, profileId), eq(products.isActive, true)));

      if (countResult.count >= plan.features.maxProducts) {
        return c.json({
          error: `Your ${plan.name} plan allows up to ${plan.features.maxProducts} products. Upgrade to add more.`,
        }, 403);
      }
    }

    // B3 fix: wrap json parsing in try-catch
    let body: unknown;
    try {
      body = await c.req.json();
    } catch {
      return c.json({ error: 'Invalid JSON body' }, 400);
    }

    const parsed = parseBody(createProductSchema, body);
    if ('error' in parsed) return c.json({ error: parsed.error }, 400);

    const [product] = await db
      .insert(products)
      .values({
        profileId,
        name: parsed.data.name,
        description: parsed.data.description || null,
        priceCents: parsed.data.priceCents,
        currency: parsed.data.currency,
        type: parsed.data.type,
        fileUrl: parsed.data.fileUrl || null,
        imageUrl: parsed.data.imageUrl || null,
      })
      .returning();

    return c.json({ product }, 201);
  }
);

// ── GET /api/products/:productId ──────────────────────────────────

productRoutes.get(
  '/products/:productId',
  productOwnership,
  async (c) => {
    const productId = c.req.param('productId');

    const [product] = await db
      .select()
      .from(products)
      .where(eq(products.id, productId));

    if (!product) return c.json({ error: 'Product not found' }, 404);

    // Get sales stats
    const [stats] = await db
      .select({
        totalSales: sql<number>`COUNT(*)::int`,
        totalRevenue: sql<number>`COALESCE(SUM(amount_cents), 0)::int`,
      })
      .from(orders)
      .where(and(eq(orders.productId, productId), eq(orders.status, 'completed')));

    return c.json({
      product,
      stats: {
        totalSales: stats.totalSales,
        totalRevenue: stats.totalRevenue,
      },
    });
  }
);

// ── PATCH /api/products/:productId ────────────────────────────────

productRoutes.patch(
  '/products/:productId',
  productOwnership,
  async (c) => {
    const productId = c.req.param('productId');

    // B3 fix: wrap json parsing in try-catch
    let body: unknown;
    try {
      body = await c.req.json();
    } catch {
      return c.json({ error: 'Invalid JSON body' }, 400);
    }

    const parsed = parseBody(updateProductSchema, body);
    if ('error' in parsed) return c.json({ error: parsed.error }, 400);

    const updates: Record<string, unknown> = { ...parsed.data, updatedAt: new Date() };

    const [updated] = await db
      .update(products)
      .set(updates)
      .where(eq(products.id, productId))
      .returning();

    return c.json({ product: updated });
  }
);

// ── DELETE /api/products/:productId ───────────────────────────────

productRoutes.delete(
  '/products/:productId',
  productOwnership,
  async (c) => {
    const productId = c.req.param('productId');

    // Soft delete: mark inactive instead of hard delete (preserves order history)
    await db
      .update(products)
      .set({ isActive: false, updatedAt: new Date() })
      .where(eq(products.id, productId));

    return c.json({ ok: true });
  }
);
