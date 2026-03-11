import { createMiddleware } from 'hono/factory';
import { eq, and } from 'drizzle-orm';
import { db, profiles, links, socialLinks, collections, products } from '@tap/db';
import type { AppEnv } from '../types';

/**
 * Middleware: verify the :profileId param belongs to the authenticated user.
 * Sets c.var.profileId for downstream use.
 */
export const profileOwnership = createMiddleware<
  AppEnv & { Variables: { profileId: string } }
>(async (c, next) => {
  const profileId = c.req.param('profileId');
  if (!profileId) return c.json({ error: 'Profile ID required' }, 400);

  const userId = c.get('user').id;

  const [profile] = await db
    .select({ id: profiles.id })
    .from(profiles)
    .where(and(eq(profiles.id, profileId), eq(profiles.userId, userId)))
    .limit(1);

  if (!profile) return c.json({ error: 'Profile not found' }, 404);

  c.set('profileId', profileId);
  await next();
});

/**
 * Middleware: verify the :linkId param belongs to a profile owned by the authenticated user.
 * Sets c.var.linkId and c.var.profileId.
 */
export const linkOwnership = createMiddleware<
  AppEnv & { Variables: { linkId: string; profileId: string } }
>(async (c, next) => {
  const linkId = c.req.param('linkId');
  if (!linkId) return c.json({ error: 'Link ID required' }, 400);

  const userId = c.get('user').id;

  const result = await db
    .select({ linkId: links.id, profileId: links.profileId })
    .from(links)
    .innerJoin(profiles, eq(links.profileId, profiles.id))
    .where(and(eq(links.id, linkId), eq(profiles.userId, userId)))
    .limit(1);

  if (result.length === 0) return c.json({ error: 'Link not found' }, 404);

  c.set('linkId', linkId);
  c.set('profileId', result[0].profileId);
  await next();
});

/**
 * Middleware: verify the :socialId param belongs to a profile owned by the authenticated user.
 */
export const socialOwnership = createMiddleware<
  AppEnv & { Variables: { socialId: string; profileId: string } }
>(async (c, next) => {
  const socialId = c.req.param('socialId');
  if (!socialId) return c.json({ error: 'Social link ID required' }, 400);

  const userId = c.get('user').id;

  const result = await db
    .select({ socialId: socialLinks.id, profileId: socialLinks.profileId })
    .from(socialLinks)
    .innerJoin(profiles, eq(socialLinks.profileId, profiles.id))
    .where(and(eq(socialLinks.id, socialId), eq(profiles.userId, userId)))
    .limit(1);

  if (result.length === 0) return c.json({ error: 'Social link not found' }, 404);

  c.set('socialId', socialId);
  c.set('profileId', result[0].profileId);
  await next();
});

/**
 * Middleware: verify the :collectionId param belongs to a profile owned by the authenticated user.
 */
export const collectionOwnership = createMiddleware<
  AppEnv & { Variables: { collectionId: string; profileId: string } }
>(async (c, next) => {
  const collectionId = c.req.param('collectionId');
  if (!collectionId) return c.json({ error: 'Collection ID required' }, 400);

  const userId = c.get('user').id;

  const result = await db
    .select({ collectionId: collections.id, profileId: collections.profileId })
    .from(collections)
    .innerJoin(profiles, eq(collections.profileId, profiles.id))
    .where(and(eq(collections.id, collectionId), eq(profiles.userId, userId)))
    .limit(1);

  if (result.length === 0) return c.json({ error: 'Collection not found' }, 404);

  c.set('collectionId', collectionId);
  c.set('profileId', result[0].profileId);
  await next();
});

/**
 * Middleware: verify the :productId param belongs to a profile owned by the authenticated user.
 */
export const productOwnership = createMiddleware<
  AppEnv & { Variables: { productId: string; profileId: string } }
>(async (c, next) => {
  const productId = c.req.param('productId');
  if (!productId) return c.json({ error: 'Product ID required' }, 400);

  const userId = c.get('user').id;

  const result = await db
    .select({ productId: products.id, profileId: products.profileId })
    .from(products)
    .innerJoin(profiles, eq(products.profileId, profiles.id))
    .where(and(eq(products.id, productId), eq(profiles.userId, userId)))
    .limit(1);

  if (result.length === 0) return c.json({ error: 'Product not found' }, 404);

  c.set('productId', productId);
  c.set('profileId', result[0].profileId);
  await next();
});
