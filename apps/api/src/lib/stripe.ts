import Stripe from 'stripe';

// Lazy-initialized Stripe client — only created when first accessed
// This prevents crashes at startup when STRIPE_SECRET_KEY is not set

let _stripe: Stripe | null = null;

export function getStripe(): Stripe {
  if (!_stripe) {
    const key = process.env.STRIPE_SECRET_KEY;
    if (!key) {
      throw new Error('STRIPE_SECRET_KEY is not set. Payment features require a valid Stripe key.');
    }
    _stripe = new Stripe(key);
  }
  return _stripe;
}

/** Convenience alias — throws if STRIPE_SECRET_KEY not set */
export const stripe = new Proxy({} as Stripe, {
  get(_target, prop) {
    return (getStripe() as unknown as Record<string | symbol, unknown>)[prop];
  },
});

// ── Plan configuration ──────────────────────────────────────────

export type PlanId = 'free' | 'starter' | 'pro' | 'premium';

export interface PlanConfig {
  id: PlanId;
  name: string;
  priceCents: number; // monthly
  stripePriceId: string | null; // set via env
  commerceFeePercent: number;
  features: {
    maxProducts: number;
    customDomain: boolean;
    removeBranding: boolean;
    csvExport: boolean;
    apiAccess: boolean;
    tipsEnabled: boolean;
    connectPayouts: boolean;
  };
}

export const PLANS: Record<PlanId, PlanConfig> = {
  free: {
    id: 'free',
    name: 'Free',
    priceCents: 0,
    stripePriceId: null,
    commerceFeePercent: 6,
    features: {
      maxProducts: 3,
      customDomain: false,
      removeBranding: false,
      csvExport: false,
      apiAccess: false,
      tipsEnabled: true,
      connectPayouts: false,
    },
  },
  starter: {
    id: 'starter',
    name: 'Starter',
    priceCents: 500,
    stripePriceId: process.env.STRIPE_PRICE_STARTER || null,
    commerceFeePercent: 4,
    features: {
      maxProducts: 10,
      customDomain: false,
      removeBranding: false,
      csvExport: true,
      apiAccess: false,
      tipsEnabled: true,
      connectPayouts: true,
    },
  },
  pro: {
    id: 'pro',
    name: 'Pro',
    priceCents: 1200,
    stripePriceId: process.env.STRIPE_PRICE_PRO || null,
    commerceFeePercent: 2,
    features: {
      maxProducts: 50,
      customDomain: true,
      removeBranding: true,
      csvExport: true,
      apiAccess: true,
      tipsEnabled: true,
      connectPayouts: true,
    },
  },
  premium: {
    id: 'premium',
    name: 'Premium',
    priceCents: 2500,
    stripePriceId: process.env.STRIPE_PRICE_PREMIUM || null,
    commerceFeePercent: 0.5,
    features: {
      maxProducts: -1, // unlimited
      customDomain: true,
      removeBranding: true,
      csvExport: true,
      apiAccess: true,
      tipsEnabled: true,
      connectPayouts: true,
    },
  },
};

export function getPlan(planId: string): PlanConfig {
  return PLANS[planId as PlanId] || PLANS.free;
}

/** Calculate platform fee in cents for a given transaction amount.
 *  Enforces a minimum fee of 1 cent to avoid $0 fees on tiny amounts. */
export function calculatePlatformFee(amountCents: number, planId: string): number {
  const plan = getPlan(planId);
  if (plan.commerceFeePercent === 0) return 0;
  const fee = Math.round(amountCents * (plan.commerceFeePercent / 100));
  return Math.max(fee, 1);
}
