import { createMiddleware } from 'hono/factory';
import type { AppEnv } from '../types';
import { getPlan, type PlanId } from '../lib/stripe';

/**
 * Middleware factory: require user's plan to be at or above the given minimum.
 * Must be used AFTER requireAuth.
 */
const PLAN_RANK: Record<PlanId, number> = {
  free: 0,
  starter: 1,
  pro: 2,
  premium: 3,
};

export function requirePlan(minPlan: PlanId) {
  return createMiddleware<AppEnv>(async (c, next) => {
    const user = c.get('user');
    const userPlanId = (user.plan || 'free') as PlanId;
    const minRank = PLAN_RANK[minPlan] ?? 0;
    const userRank = PLAN_RANK[userPlanId] ?? 0;

    if (userRank < minRank) {
      return c.json({
        error: `This feature requires the ${getPlan(minPlan).name} plan or higher`,
        requiredPlan: minPlan,
      }, 403);
    }

    await next();
  });
}

/**
 * Check if user's plan has a specific feature enabled.
 */
export function requireFeature(feature: keyof ReturnType<typeof getPlan>['features']) {
  return createMiddleware<AppEnv>(async (c, next) => {
    const user = c.get('user');
    const plan = getPlan(user.plan || 'free');

    if (!plan.features[feature]) {
      return c.json({
        error: `This feature requires a plan upgrade`,
        requiredFeature: feature,
      }, 403);
    }

    await next();
  });
}
