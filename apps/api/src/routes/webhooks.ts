import { Hono } from 'hono';
import { eq } from 'drizzle-orm';
import { db, orders, tips, subscriptions, users } from '@tap/db';
import { stripe } from '../lib/stripe';
import type Stripe from 'stripe';

export const webhookRoutes = new Hono();

// ── POST /api/webhooks/stripe ─────────────────────────────────────
// Raw body required for signature verification.
// B8 fix: use arrayBuffer() to get raw body before any middleware can consume it.

webhookRoutes.post('/stripe', async (c) => {
  const sig = c.req.header('stripe-signature');
  const webhookSecret = process.env.STRIPE_WEBHOOK_SECRET;

  if (!sig || !webhookSecret) {
    console.error('Webhook: missing signature or secret');
    return c.json({ error: 'Webhook configuration error' }, 400);
  }

  let event: Stripe.Event;

  try {
    // Use arrayBuffer → Buffer to ensure we get the raw, unconsumed body
    const rawBuffer = await c.req.arrayBuffer();
    const rawBody = Buffer.from(rawBuffer).toString('utf-8');
    event = stripe.webhooks.constructEvent(rawBody, sig, webhookSecret);
  } catch (err) {
    console.error('Webhook signature verification failed:', (err as Error).message);
    return c.json({ error: 'Invalid signature' }, 400);
  }

  // V7: Log event for debugging and detect duplicate deliveries
  console.log(`Stripe webhook: ${event.type} (${event.id})`);

  try {
    switch (event.type) {
      case 'checkout.session.completed': {
        const session = event.data.object as Stripe.Checkout.Session;
        await handleCheckoutCompleted(session);
        break;
      }
      case 'checkout.session.expired': {
        const session = event.data.object as Stripe.Checkout.Session;
        await handleCheckoutExpired(session);
        break;
      }
      case 'customer.subscription.created':
      case 'customer.subscription.updated': {
        const sub = event.data.object as Stripe.Subscription;
        await handleSubscriptionUpdate(sub);
        break;
      }
      case 'customer.subscription.deleted': {
        const sub = event.data.object as Stripe.Subscription;
        await handleSubscriptionDeleted(sub);
        break;
      }
      case 'invoice.payment_failed': {
        const invoice = event.data.object as Stripe.Invoice;
        console.warn(`Payment failed for invoice ${invoice.id}, customer ${invoice.customer}`);
        break;
      }
      default:
        // Unhandled event type — that's fine, just acknowledge
        break;
    }
  } catch (err) {
    // Log handler errors but still return 200 to prevent Stripe retries on app bugs
    console.error(`Webhook handler error for ${event.type}:`, (err as Error).message);
  }

  return c.json({ received: true });
});

// ── Handlers ──────────────────────────────────────────────────────

async function handleCheckoutCompleted(session: Stripe.Checkout.Session) {
  const type = session.metadata?.type;
  const customerEmail = session.customer_details?.email || '';

  if (type === 'product') {
    const result = await db
      .update(orders)
      .set({
        status: 'completed',
        buyerEmail: customerEmail,
        stripePaymentIntent: typeof session.payment_intent === 'string'
          ? session.payment_intent
          : session.payment_intent?.id || null,
      })
      .where(eq(orders.stripeSessionId, session.id));

    // V7: Log if no matching order found (possible duplicate or stale event)
    if (!result.rowCount || result.rowCount === 0) {
      console.warn(`Webhook: no pending order found for session ${session.id}`);
    }
  } else if (type === 'tip') {
    const result = await db
      .update(tips)
      .set({
        status: 'completed',
        stripePaymentIntent: typeof session.payment_intent === 'string'
          ? session.payment_intent
          : session.payment_intent?.id || null,
      })
      .where(eq(tips.stripeSessionId, session.id));

    if (!result.rowCount || result.rowCount === 0) {
      console.warn(`Webhook: no pending tip found for session ${session.id}`);
    }
  } else if (type === 'subscription') {
    // Subscription handling is done via customer.subscription.created/updated events
    console.log(`Subscription checkout completed: ${session.id}`);
  }
}

async function handleCheckoutExpired(session: Stripe.Checkout.Session) {
  const type = session.metadata?.type;

  if (type === 'product') {
    await db
      .update(orders)
      .set({ status: 'expired' })
      .where(eq(orders.stripeSessionId, session.id));
  } else if (type === 'tip') {
    await db
      .update(tips)
      .set({ status: 'expired' })
      .where(eq(tips.stripeSessionId, session.id));
  }
}

async function handleSubscriptionUpdate(sub: Stripe.Subscription) {
  const planMetadata = sub.metadata?.plan;
  if (!planMetadata) return;

  const userId = sub.metadata?.userId;
  if (!userId) return;

  // Upsert subscription record
  const existing = await db
    .select()
    .from(subscriptions)
    .where(eq(subscriptions.stripeSubscriptionId, sub.id))
    .limit(1);

  const periodEnd = (sub as unknown as { current_period_end?: number }).current_period_end
    ? new Date((sub as unknown as { current_period_end: number }).current_period_end * 1000)
    : null;

  // Use transaction to keep subscription record and user plan in sync
  await db.transaction(async (tx) => {
    if (existing.length > 0) {
      await tx
        .update(subscriptions)
        .set({
          plan: planMetadata,
          status: sub.status,
          currentPeriodEnd: periodEnd,
          cancelAtPeriodEnd: sub.cancel_at_period_end,
        })
        .where(eq(subscriptions.stripeSubscriptionId, sub.id));
    } else {
      await tx.insert(subscriptions).values({
        userId,
        stripeSubscriptionId: sub.id,
        plan: planMetadata,
        status: sub.status,
        currentPeriodEnd: periodEnd,
        cancelAtPeriodEnd: sub.cancel_at_period_end,
      });
    }

    // Update user's plan
    if (sub.status === 'active' || sub.status === 'trialing') {
      await tx
        .update(users)
        .set({ plan: planMetadata, updatedAt: new Date() })
        .where(eq(users.id, userId));
    }
  });
}

async function handleSubscriptionDeleted(sub: Stripe.Subscription) {
  const userId = sub.metadata?.userId;

  // Use transaction to keep subscription status and user plan in sync
  await db.transaction(async (tx) => {
    await tx
      .update(subscriptions)
      .set({ status: 'canceled' })
      .where(eq(subscriptions.stripeSubscriptionId, sub.id));

    if (userId) {
      await tx
        .update(users)
        .set({ plan: 'free', updatedAt: new Date() })
        .where(eq(users.id, userId));
    }
  });
}
