import { Hono } from 'hono';
import { eq, and, desc, sql } from 'drizzle-orm';
import { db, subscriptions, users, orders, tips, products, profiles } from '@tap/db';
import { requireAuth } from '../middleware/auth';
import { profileOwnership } from '../middleware/ownership';
import { stripe, PLANS, getPlan, type PlanId } from '../lib/stripe';
import { subscribeSchema, parseBody } from '../lib/validation-schemas';
import type { AppEnv } from '../types';

export const billingRoutes = new Hono<AppEnv>();

billingRoutes.use('*', requireAuth);

// ── GET /api/billing/plans ────────────────────────────────────────

billingRoutes.get('/billing/plans', async (c) => {
  const planList = Object.values(PLANS).map(({ id, name, priceCents, commerceFeePercent, features }) => ({
    id, name, priceCents, commerceFeePercent, features,
  }));
  return c.json({ plans: planList });
});

// ── GET /api/billing/subscription ─────────────────────────────────

billingRoutes.get('/billing/subscription', async (c) => {
  const user = c.get('user');

  const [sub] = await db
    .select()
    .from(subscriptions)
    .where(and(
      eq(subscriptions.userId, user.id),
      eq(subscriptions.status, 'active'),
    ))
    .orderBy(desc(subscriptions.createdAt))
    .limit(1);

  const plan = getPlan(user.plan || 'free');

  return c.json({
    subscription: sub ? {
      id: sub.id,
      plan: sub.plan,
      status: sub.status,
      currentPeriodEnd: sub.currentPeriodEnd?.toISOString() || null,
      cancelAtPeriodEnd: sub.cancelAtPeriodEnd,
    } : null,
    currentPlan: {
      id: plan.id,
      name: plan.name,
      priceCents: plan.priceCents,
      commerceFeePercent: plan.commerceFeePercent,
      features: plan.features,
    },
  });
});

// ── POST /api/billing/subscribe ───────────────────────────────────

billingRoutes.post('/billing/subscribe', async (c) => {
  const user = c.get('user');

  // B3 fix: wrap json parsing in try-catch
  let body: unknown;
  try {
    body = await c.req.json();
  } catch {
    return c.json({ error: 'Invalid JSON body' }, 400);
  }

  // V3 fix: validate with Zod instead of raw cast
  const parsed = parseBody(subscribeSchema, body);
  if ('error' in parsed) return c.json({ error: parsed.error }, 400);

  const planId = parsed.data.planId as PlanId;

  if (!PLANS[planId]) {
    return c.json({ error: 'Invalid plan' }, 400);
  }

  const plan = PLANS[planId];
  if (!plan.stripePriceId) {
    return c.json({ error: 'This plan is not available for purchase' }, 400);
  }

  // B5 fix: Check if user already has an active subscription
  const [existingSub] = await db
    .select({ id: subscriptions.id, plan: subscriptions.plan })
    .from(subscriptions)
    .where(and(
      eq(subscriptions.userId, user.id),
      eq(subscriptions.status, 'active'),
    ))
    .limit(1);

  if (existingSub) {
    return c.json({
      error: `You already have an active ${existingSub.plan} subscription. Use the billing portal to change plans.`,
    }, 409);
  }

  // Get or create Stripe customer
  let stripeCustomerId: string;

  const [dbUser] = await db
    .select({ stripeCustomerId: users.stripeCustomerId, email: users.email })
    .from(users)
    .where(eq(users.id, user.id));

  if (dbUser.stripeCustomerId) {
    stripeCustomerId = dbUser.stripeCustomerId;
  } else {
    const customer = await stripe.customers.create({
      email: dbUser.email,
      metadata: { userId: user.id },
    });
    stripeCustomerId = customer.id;
    await db
      .update(users)
      .set({ stripeCustomerId: customer.id, updatedAt: new Date() })
      .where(eq(users.id, user.id));
  }

  const successUrl = process.env.APP_URL
    ? `${process.env.APP_URL}/dashboard/settings/billing?success=true`
    : 'http://localhost:3000/dashboard/settings/billing?success=true';
  const cancelUrl = process.env.APP_URL
    ? `${process.env.APP_URL}/dashboard/settings/billing`
    : 'http://localhost:3000/dashboard/settings/billing';

  const session = await stripe.checkout.sessions.create({
    mode: 'subscription',
    customer: stripeCustomerId,
    line_items: [{
      price: plan.stripePriceId,
      quantity: 1,
    }],
    subscription_data: {
      metadata: {
        userId: user.id,
        plan: planId,
      },
    },
    metadata: {
      type: 'subscription',
      userId: user.id,
      plan: planId,
    },
    success_url: successUrl,
    cancel_url: cancelUrl,
  });

  return c.json({ url: session.url });
});

// ── POST /api/billing/portal ──────────────────────────────────────
// Opens the Stripe customer portal for managing subscriptions

billingRoutes.post('/billing/portal', async (c) => {
  const user = c.get('user');

  const [dbUser] = await db
    .select({ stripeCustomerId: users.stripeCustomerId })
    .from(users)
    .where(eq(users.id, user.id));

  if (!dbUser.stripeCustomerId) {
    return c.json({ error: 'No billing account found' }, 400);
  }

  const returnUrl = process.env.APP_URL
    ? `${process.env.APP_URL}/dashboard/settings/billing`
    : 'http://localhost:3000/dashboard/settings/billing';

  const session = await stripe.billingPortal.sessions.create({
    customer: dbUser.stripeCustomerId,
    return_url: returnUrl,
  });

  return c.json({ url: session.url });
});

// ── GET /api/profiles/:profileId/revenue/overview ─────────────────

billingRoutes.get(
  '/profiles/:profileId/revenue/overview',
  profileOwnership,
  async (c) => {
    const profileId = c.req.param('profileId');
    const period = c.req.query('period') || '30d';

    // I5 fix: validate period value
    const daysMap: Record<string, number> = {
      '7d': 7, '30d': 30, '90d': 90, '12m': 365, 'all': 3650,
    };
    const days = daysMap[period];
    if (days === undefined) {
      return c.json({ error: 'Invalid period. Use: 7d, 30d, 90d, 12m, or all' }, 400);
    }

    const startDate = new Date(Date.now() - days * 86400_000).toISOString().slice(0, 10);
    const prevStartDate = new Date(Date.now() - days * 2 * 86400_000).toISOString().slice(0, 10);

    // Current period
    const [[orderStats], [tipStats]] = await Promise.all([
      db.select({
        count: sql<number>`COUNT(*)::int`,
        revenue: sql<number>`COALESCE(SUM(amount_cents), 0)::int`,
      }).from(orders).where(and(
        eq(orders.profileId, profileId),
        eq(orders.status, 'completed'),
        sql`created_at >= ${startDate}::date`,
      )),
      db.select({
        count: sql<number>`COUNT(*)::int`,
        revenue: sql<number>`COALESCE(SUM(amount_cents), 0)::int`,
      }).from(tips).where(and(
        eq(tips.profileId, profileId),
        eq(tips.status, 'completed'),
        sql`created_at >= ${startDate}::date`,
      )),
    ]);

    // Previous period for comparison
    const [[prevOrderStats], [prevTipStats]] = await Promise.all([
      db.select({
        revenue: sql<number>`COALESCE(SUM(amount_cents), 0)::int`,
      }).from(orders).where(and(
        eq(orders.profileId, profileId),
        eq(orders.status, 'completed'),
        sql`created_at >= ${prevStartDate}::date`,
        sql`created_at < ${startDate}::date`,
      )),
      db.select({
        revenue: sql<number>`COALESCE(SUM(amount_cents), 0)::int`,
      }).from(tips).where(and(
        eq(tips.profileId, profileId),
        eq(tips.status, 'completed'),
        sql`created_at >= ${prevStartDate}::date`,
        sql`created_at < ${startDate}::date`,
      )),
    ]);

    const totalRevenue = orderStats.revenue + tipStats.revenue;
    const prevTotalRevenue = prevOrderStats.revenue + prevTipStats.revenue;
    const revenueChange = prevTotalRevenue === 0
      ? (totalRevenue > 0 ? 100 : 0)
      : Math.round(((totalRevenue - prevTotalRevenue) / prevTotalRevenue) * 1000) / 10;

    return c.json({
      overview: {
        totalRevenue,
        productRevenue: orderStats.revenue,
        tipRevenue: tipStats.revenue,
        orderCount: orderStats.count,
        tipCount: tipStats.count,
        revenueChange,
      },
    });
  }
);

// ── GET /api/profiles/:profileId/orders ───────────────────────────

billingRoutes.get(
  '/profiles/:profileId/orders',
  profileOwnership,
  async (c) => {
    const profileId = c.req.param('profileId');

    // B4 fix: validate parseInt results and ensure non-negative offset
    const rawLimit = parseInt(c.req.query('limit') || '50');
    const rawOffset = parseInt(c.req.query('offset') || '0');
    const limit = Math.min(Number.isNaN(rawLimit) ? 50 : Math.max(1, rawLimit), 100);
    const offset = Number.isNaN(rawOffset) ? 0 : Math.max(0, rawOffset);

    const rows = await db
      .select({
        id: orders.id,
        productId: orders.productId,
        profileId: orders.profileId,
        buyerEmail: orders.buyerEmail,
        amountCents: orders.amountCents,
        status: orders.status,
        fulfilled: orders.fulfilled,
        createdAt: orders.createdAt,
        productName: products.name,
      })
      .from(orders)
      .leftJoin(products, eq(orders.productId, products.id))
      .where(eq(orders.profileId, profileId))
      .orderBy(desc(orders.createdAt))
      .limit(limit)
      .offset(offset);

    // I7: include total count for pagination
    const [{ total }] = await db
      .select({ total: sql<number>`COUNT(*)::int` })
      .from(orders)
      .where(eq(orders.profileId, profileId));

    return c.json({ orders: rows, total });
  }
);

// ── PATCH /api/orders/:orderId/fulfill ────────────────────────────

billingRoutes.patch('/orders/:orderId/fulfill', async (c) => {
  const orderId = c.req.param('orderId');
  const user = c.get('user');

  // Verify ownership
  const [order] = await db
    .select({
      id: orders.id,
      profileId: orders.profileId,
      status: orders.status,
      fulfilled: orders.fulfilled,
    })
    .from(orders)
    .innerJoin(profiles, eq(orders.profileId, profiles.id))
    .where(and(eq(orders.id, orderId), eq(profiles.userId, user.id)));

  if (!order) return c.json({ error: 'Order not found' }, 404);

  // B9 fix: check order state before fulfilling
  if (order.status !== 'completed') {
    return c.json({ error: 'Only completed orders can be fulfilled' }, 400);
  }
  if (order.fulfilled) {
    return c.json({ error: 'Order is already fulfilled' }, 400);
  }

  await db
    .update(orders)
    .set({ fulfilled: true })
    .where(eq(orders.id, orderId));

  return c.json({ ok: true });
});

// ── GET /api/profiles/:profileId/tips ─────────────────────────────

billingRoutes.get(
  '/profiles/:profileId/tips',
  profileOwnership,
  async (c) => {
    const profileId = c.req.param('profileId');

    // B4 fix: validate parseInt
    const rawLimit = parseInt(c.req.query('limit') || '50');
    const limit = Math.min(Number.isNaN(rawLimit) ? 50 : Math.max(1, rawLimit), 100);

    const rows = await db
      .select()
      .from(tips)
      .where(and(eq(tips.profileId, profileId), eq(tips.status, 'completed')))
      .orderBy(desc(tips.createdAt))
      .limit(limit);

    return c.json({
      tips: rows.map(t => ({
        id: t.id,
        profileId: t.profileId,
        amountCents: t.amountCents,
        tipperName: t.tipperName,
        tipperMessage: t.tipperMessage,
        status: t.status,
        createdAt: t.createdAt?.toISOString() || null,
      })),
    });
  }
);
