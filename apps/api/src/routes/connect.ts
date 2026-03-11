import { Hono } from 'hono';
import { eq } from 'drizzle-orm';
import { db, users } from '@tap/db';
import { requireAuth } from '../middleware/auth';
import { requireFeature } from '../middleware/plan-gate';
import { stripe } from '../lib/stripe';
import type { AppEnv } from '../types';

export const connectRoutes = new Hono<AppEnv>();

connectRoutes.use('*', requireAuth);

// ── POST /api/connect/onboard ─────────────────────────────────────
// Start Stripe Connect onboarding for creator payouts

connectRoutes.post(
  '/onboard',
  requireFeature('connectPayouts'),
  async (c) => {
    const user = c.get('user');

    const [dbUser] = await db
      .select({
        stripeConnectAccountId: users.stripeConnectAccountId,
        email: users.email,
      })
      .from(users)
      .where(eq(users.id, user.id));

    let connectAccountId = dbUser.stripeConnectAccountId;

    // B6 fix: Reuse existing Connect account instead of creating duplicates
    if (!connectAccountId) {
      const account = await stripe.accounts.create({
        type: 'standard',
        email: dbUser.email,
        metadata: { userId: user.id },
      });
      connectAccountId = account.id;

      // I1: Persist the Connect account ID on the user record
      await db
        .update(users)
        .set({ stripeConnectAccountId: account.id, updatedAt: new Date() })
        .where(eq(users.id, user.id));
    }

    const returnUrl = process.env.APP_URL
      ? `${process.env.APP_URL}/dashboard/monetization?connect=success`
      : 'http://localhost:3000/dashboard/monetization?connect=success';
    const refreshUrl = process.env.APP_URL
      ? `${process.env.APP_URL}/dashboard/monetization?connect=refresh`
      : 'http://localhost:3000/dashboard/monetization?connect=refresh';

    const accountLink = await stripe.accountLinks.create({
      account: connectAccountId,
      refresh_url: refreshUrl,
      return_url: returnUrl,
      type: 'account_onboarding',
    });

    return c.json({ url: accountLink.url });
  }
);

// ── GET /api/connect/status ───────────────────────────────────────
// B7 fix: Actually check Connect account status from Stripe

connectRoutes.get('/status', async (c) => {
  const user = c.get('user');

  const [dbUser] = await db
    .select({ stripeConnectAccountId: users.stripeConnectAccountId })
    .from(users)
    .where(eq(users.id, user.id));

  if (!dbUser.stripeConnectAccountId) {
    return c.json({
      connected: false,
      chargesEnabled: false,
      payoutsEnabled: false,
    });
  }

  try {
    const account = await stripe.accounts.retrieve(dbUser.stripeConnectAccountId);
    return c.json({
      connected: true,
      chargesEnabled: account.charges_enabled ?? false,
      payoutsEnabled: account.payouts_enabled ?? false,
    });
  } catch {
    return c.json({
      connected: false,
      chargesEnabled: false,
      payoutsEnabled: false,
    });
  }
});
