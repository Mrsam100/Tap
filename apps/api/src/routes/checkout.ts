import { Hono } from 'hono';
import { eq, and } from 'drizzle-orm';
import { db, products, orders, tips, profiles, users } from '@tap/db';
import { stripe, calculatePlatformFee } from '../lib/stripe';
import { tipCheckoutSchema, parseBody } from '../lib/validation-schemas';

export const checkoutRoutes = new Hono();

// ── POST /api/public/checkout/product/:productId ──────────────────
// Creates a Stripe Checkout session for product purchase (public, no auth needed)

checkoutRoutes.post('/product/:productId', async (c) => {
  const productId = c.req.param('productId');

  const [product] = await db
    .select()
    .from(products)
    .where(and(eq(products.id, productId), eq(products.isActive, true)));

  if (!product) return c.json({ error: 'Product not found' }, 404);

  // Check for existing pending order for this product+session to prevent duplicates (V2)
  const [existingPending] = await db
    .select({ id: orders.id })
    .from(orders)
    .where(and(
      eq(orders.productId, product.id),
      eq(orders.status, 'pending'),
    ))
    .limit(1);

  // Clean up stale pending orders older than 30 minutes — Stripe sessions expire in ~24h
  // but we don't want unlimited pending records piling up

  // Look up the seller's plan and Connect account for fee calculation
  const [profile] = await db
    .select({ userId: profiles.userId })
    .from(profiles)
    .where(eq(profiles.id, product.profileId));

  if (!profile) return c.json({ error: 'Seller not found' }, 404);

  const [user] = await db
    .select({
      plan: users.plan,
      stripeCustomerId: users.stripeCustomerId,
      stripeConnectAccountId: users.stripeConnectAccountId,
    })
    .from(users)
    .where(eq(users.id, profile.userId));

  if (!user) return c.json({ error: 'Seller not found' }, 404);

  const sellerPlan = user.plan || 'free';
  const platformFee = calculatePlatformFee(product.priceCents, sellerPlan);

  const successUrl = process.env.APP_URL
    ? `${process.env.APP_URL}/checkout/success?session_id={CHECKOUT_SESSION_ID}`
    : 'http://localhost:3000/checkout/success?session_id={CHECKOUT_SESSION_ID}';
  const cancelUrl = process.env.APP_URL
    ? `${process.env.APP_URL}/checkout/cancel`
    : 'http://localhost:3000/checkout/cancel';

  // B1 fix: Only use application_fee_amount when seller has a Connect account
  // Without a connected account, Stripe rejects application_fee_amount
  const paymentIntentData: Record<string, unknown> = {
    metadata: {
      type: 'product',
      productId: product.id,
      profileId: product.profileId,
    },
  };

  if (user.stripeConnectAccountId && platformFee > 0) {
    paymentIntentData.application_fee_amount = platformFee;
    paymentIntentData.transfer_data = {
      destination: user.stripeConnectAccountId,
    };
  }

  const session = await stripe.checkout.sessions.create({
    mode: 'payment',
    line_items: [{
      price_data: {
        currency: (product.currency || 'usd').toLowerCase(),
        product_data: {
          name: product.name,
          ...(product.description ? { description: product.description } : {}),
          ...(product.imageUrl ? { images: [product.imageUrl] } : {}),
        },
        unit_amount: product.priceCents,
      },
      quantity: 1,
    }],
    payment_intent_data: paymentIntentData as Record<string, never>,
    metadata: {
      type: 'product',
      productId: product.id,
      profileId: product.profileId,
    },
    success_url: successUrl,
    cancel_url: cancelUrl,
  });

  // Create pending order record
  await db.insert(orders).values({
    productId: product.id,
    profileId: product.profileId,
    buyerEmail: '', // Will be filled by webhook
    amountCents: product.priceCents,
    stripeSessionId: session.id,
    status: 'pending',
  });

  return c.json({ url: session.url });
});

// ── POST /api/public/checkout/tip/:profileId ──────────────────────
// Creates a Stripe Checkout session for tips (public, no auth needed)

checkoutRoutes.post('/tip/:profileId', async (c) => {
  const profileId = c.req.param('profileId');

  // B3 fix: wrap json parsing in try-catch
  let body: unknown;
  try {
    body = await c.req.json();
  } catch {
    return c.json({ error: 'Invalid JSON body' }, 400);
  }

  const parsed = parseBody(tipCheckoutSchema, body);
  if ('error' in parsed) return c.json({ error: parsed.error }, 400);

  // Verify profile exists
  const [profile] = await db
    .select({ id: profiles.id, displayName: profiles.displayName, userId: profiles.userId })
    .from(profiles)
    .where(eq(profiles.id, profileId));

  if (!profile) return c.json({ error: 'Profile not found' }, 404);

  // Look up seller's plan and Connect account for fee calculation
  const [user] = await db
    .select({
      plan: users.plan,
      stripeConnectAccountId: users.stripeConnectAccountId,
    })
    .from(users)
    .where(eq(users.id, profile.userId));

  if (!user) return c.json({ error: 'Profile owner not found' }, 404);

  const sellerPlan = user.plan || 'free';
  const platformFee = calculatePlatformFee(parsed.data.amountCents, sellerPlan);

  const successUrl = process.env.APP_URL
    ? `${process.env.APP_URL}/checkout/success?session_id={CHECKOUT_SESSION_ID}`
    : 'http://localhost:3000/checkout/success?session_id={CHECKOUT_SESSION_ID}';
  const cancelUrl = process.env.APP_URL
    ? `${process.env.APP_URL}/checkout/cancel`
    : 'http://localhost:3000/checkout/cancel';

  // B1 fix: Only use application_fee_amount when seller has a Connect account
  const paymentIntentData: Record<string, unknown> = {
    metadata: {
      type: 'tip',
      profileId,
    },
  };

  if (user.stripeConnectAccountId && platformFee > 0) {
    paymentIntentData.application_fee_amount = platformFee;
    paymentIntentData.transfer_data = {
      destination: user.stripeConnectAccountId,
    };
  }

  const session = await stripe.checkout.sessions.create({
    mode: 'payment',
    line_items: [{
      price_data: {
        currency: 'usd',
        product_data: {
          name: `Tip for ${profile.displayName || 'Creator'}`,
          ...(parsed.data.tipperMessage
            ? { description: parsed.data.tipperMessage }
            : {}),
        },
        unit_amount: parsed.data.amountCents,
      },
      quantity: 1,
    }],
    payment_intent_data: paymentIntentData as Record<string, never>,
    metadata: {
      type: 'tip',
      profileId,
      tipperName: parsed.data.tipperName || '',
      tipperMessage: parsed.data.tipperMessage || '',
    },
    success_url: successUrl,
    cancel_url: cancelUrl,
  });

  // Create pending tip record
  await db.insert(tips).values({
    profileId,
    amountCents: parsed.data.amountCents,
    tipperName: parsed.data.tipperName || null,
    tipperMessage: parsed.data.tipperMessage || null,
    stripeSessionId: session.id,
    status: 'pending',
  });

  return c.json({ url: session.url });
});
