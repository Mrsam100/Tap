import { pgTable, uuid, varchar, text, boolean, timestamp, uniqueIndex, index, jsonb, integer, serial, date, bigserial, check } from 'drizzle-orm/pg-core';
import { sql } from 'drizzle-orm';

// ============================================================
// PHASE 1: Core tables (users, sessions, oauth)
// ============================================================

export const users = pgTable('users', {
  id: uuid('id').primaryKey().defaultRandom(),
  email: varchar('email', { length: 255 }).unique().notNull(),
  username: varchar('username', { length: 30 }).unique().notNull(),
  displayName: varchar('display_name', { length: 100 }),
  bio: text('bio'),
  avatarUrl: text('avatar_url'),
  passwordHash: text('password_hash'),
  emailVerified: boolean('email_verified').default(false),
  mfaEnabled: boolean('mfa_enabled').default(false),
  mfaSecret: text('mfa_secret'),
  mfaBackupCodes: text('mfa_backup_codes'), // JSON array of hashed backup codes
  plan: varchar('plan', { length: 20 }).default('free'),
  stripeCustomerId: varchar('stripe_customer_id', { length: 255 }),
  stripeConnectAccountId: varchar('stripe_connect_account_id', { length: 255 }),
  createdAt: timestamp('created_at', { withTimezone: true }).defaultNow(),
  updatedAt: timestamp('updated_at', { withTimezone: true }).defaultNow(),
}, (table) => [
  index('users_stripe_customer_id_idx').on(table.stripeCustomerId),
  index('users_stripe_connect_account_id_idx').on(table.stripeConnectAccountId),
]);

export const sessions = pgTable('sessions', {
  id: varchar('id', { length: 255 }).primaryKey(),
  userId: uuid('user_id').notNull().references(() => users.id, { onDelete: 'cascade' }),
  ipAddress: varchar('ip_address', { length: 45 }), // IPv4 or IPv6
  userAgent: text('user_agent'),
  expiresAt: timestamp('expires_at', { withTimezone: true }).notNull(),
  createdAt: timestamp('created_at', { withTimezone: true }).defaultNow(),
});

export const oauthAccounts = pgTable('oauth_accounts', {
  id: uuid('id').primaryKey().defaultRandom(),
  userId: uuid('user_id').notNull().references(() => users.id, { onDelete: 'cascade' }),
  provider: varchar('provider', { length: 50 }).notNull(),
  providerUserId: varchar('provider_user_id', { length: 255 }).notNull(),
}, (table) => [
  uniqueIndex('oauth_provider_user_idx').on(table.provider, table.providerUserId),
  index('oauth_accounts_user_id_idx').on(table.userId),
]);

// ============================================================
// PHASE 2: Auth tokens
// ============================================================

export const emailVerificationTokens = pgTable('email_verification_tokens', {
  id: uuid('id').primaryKey().defaultRandom(),
  userId: uuid('user_id').notNull().references(() => users.id, { onDelete: 'cascade' }),
  tokenHash: varchar('token_hash', { length: 255 }).notNull(),
  expiresAt: timestamp('expires_at', { withTimezone: true }).notNull(),
  createdAt: timestamp('created_at', { withTimezone: true }).defaultNow(),
}, (table) => [
  index('email_verification_tokens_token_hash_idx').on(table.tokenHash),
]);

export const passwordResetTokens = pgTable('password_reset_tokens', {
  id: uuid('id').primaryKey().defaultRandom(),
  userId: uuid('user_id').notNull().references(() => users.id, { onDelete: 'cascade' }),
  tokenHash: varchar('token_hash', { length: 255 }).notNull(),
  expiresAt: timestamp('expires_at', { withTimezone: true }).notNull(),
  used: boolean('used').default(false),
  createdAt: timestamp('created_at', { withTimezone: true }).defaultNow(),
}, (table) => [
  index('password_reset_tokens_token_hash_idx').on(table.tokenHash),
]);

// ============================================================
// PHASE 3: Profiles, links, collections, socials
// ============================================================

export const profiles = pgTable('profiles', {
  id: uuid('id').primaryKey().defaultRandom(),
  userId: uuid('user_id').notNull().references(() => users.id, { onDelete: 'cascade' }),
  username: varchar('username', { length: 30 }).unique().notNull(),
  displayName: varchar('display_name', { length: 100 }),
  bio: text('bio'),
  avatarUrl: text('avatar_url'),
  faviconUrl: text('favicon_url'),
  themeId: varchar('theme_id', { length: 50 }).default('cream'),
  fontId: varchar('font_id', { length: 50 }).default('serif'),
  showFluidBg: boolean('show_fluid_bg').default(false),
  customBgUrl: text('custom_bg_url'),
  customBgType: varchar('custom_bg_type', { length: 20 }),
  customBgColor: varchar('custom_bg_color', { length: 7 }),
  buttonStyle: jsonb('button_style'),
  layout: varchar('layout', { length: 20 }).default('stack'),
  seoTitle: varchar('seo_title', { length: 200 }),
  seoDescription: text('seo_description'),
  ogImageUrl: text('og_image_url'),
  customDomain: varchar('custom_domain', { length: 255 }),
  removeBranding: boolean('remove_branding').default(false),
  isPublished: boolean('is_published').default(false),
  createdAt: timestamp('created_at', { withTimezone: true }).defaultNow(),
  updatedAt: timestamp('updated_at', { withTimezone: true }).defaultNow(),
});

export const collections = pgTable('collections', {
  id: uuid('id').primaryKey().defaultRandom(),
  profileId: uuid('profile_id').notNull().references(() => profiles.id, { onDelete: 'cascade' }),
  title: varchar('title', { length: 200 }).notNull(),
  position: integer('position').notNull().default(0),
  isCollapsedDefault: boolean('is_collapsed_default').default(false),
  createdAt: timestamp('created_at', { withTimezone: true }).defaultNow(),
});

export const links = pgTable('links', {
  id: uuid('id').primaryKey().defaultRandom(),
  profileId: uuid('profile_id').notNull().references(() => profiles.id, { onDelete: 'cascade' }),
  type: varchar('type', { length: 20 }).notNull(),
  label: varchar('label', { length: 200 }).notNull(),
  url: text('url').notNull(),
  thumbnailUrl: text('thumbnail_url'),
  position: integer('position').notNull().default(0),
  isActive: boolean('is_active').default(true),
  isArchived: boolean('is_archived').default(false),
  style: jsonb('style'),
  metadata: jsonb('metadata'),
  scheduledStart: timestamp('scheduled_start', { withTimezone: true }),
  scheduledEnd: timestamp('scheduled_end', { withTimezone: true }),
  ageGate: boolean('age_gate').default(false),
  minAge: integer('min_age'),
  passwordHash: text('password_hash'),
  sensitive: boolean('sensitive').default(false),
  emailGate: boolean('email_gate').default(false),
  collectionId: uuid('collection_id').references(() => collections.id, { onDelete: 'cascade' }),
  createdAt: timestamp('created_at', { withTimezone: true }).defaultNow(),
  updatedAt: timestamp('updated_at', { withTimezone: true }).defaultNow(),
}, (table) => [
  check('links_position_check', sql`${table.position} >= 0`),
]);

export const socialLinks = pgTable('social_links', {
  id: uuid('id').primaryKey().defaultRandom(),
  profileId: uuid('profile_id').notNull().references(() => profiles.id, { onDelete: 'cascade' }),
  platform: varchar('platform', { length: 30 }).notNull(),
  url: text('url').notNull(),
  position: integer('position').notNull().default(0),
  createdAt: timestamp('created_at', { withTimezone: true }).defaultNow(),
});

// ============================================================
// PHASE 4: Analytics
// ============================================================

export const pageViews = pgTable('page_views', {
  id: bigserial('id', { mode: 'number' }).primaryKey(),
  profileId: uuid('profile_id').notNull().references(() => profiles.id, { onDelete: 'cascade' }),
  visitorId: varchar('visitor_id', { length: 64 }),
  ipHash: varchar('ip_hash', { length: 64 }),
  country: varchar('country', { length: 2 }),
  city: varchar('city', { length: 100 }),
  referrer: text('referrer'),
  userAgent: text('user_agent'),
  deviceType: varchar('device_type', { length: 20 }),
  browser: varchar('browser', { length: 50 }),
  os: varchar('os', { length: 50 }),
  utmSource: varchar('utm_source', { length: 255 }),
  utmMedium: varchar('utm_medium', { length: 255 }),
  utmCampaign: varchar('utm_campaign', { length: 255 }),
  scrollDepth: integer('scroll_depth'),
  timeOnPage: integer('time_on_page'),
  createdAt: timestamp('created_at', { withTimezone: true }).defaultNow(),
}, (table) => [
  index('page_views_profile_created_idx').on(table.profileId, table.createdAt),
  index('page_views_profile_visitor_idx').on(table.profileId, table.visitorId, table.createdAt),
  index('page_views_profile_iphash_idx').on(table.profileId, table.ipHash),
]);

export const linkClicks = pgTable('link_clicks', {
  id: bigserial('id', { mode: 'number' }).primaryKey(),
  linkId: uuid('link_id').notNull().references(() => links.id, { onDelete: 'cascade' }),
  profileId: uuid('profile_id').notNull().references(() => profiles.id, { onDelete: 'cascade' }),
  visitorId: varchar('visitor_id', { length: 64 }),
  country: varchar('country', { length: 2 }),
  referrer: text('referrer'),
  deviceType: varchar('device_type', { length: 20 }),
  createdAt: timestamp('created_at', { withTimezone: true }).defaultNow(),
}, (table) => [
  index('link_clicks_link_created_idx').on(table.linkId, table.createdAt),
  index('link_clicks_profile_created_idx').on(table.profileId, table.createdAt),
]);

export const dailyStats = pgTable('daily_stats', {
  id: bigserial('id', { mode: 'number' }).primaryKey(),
  profileId: uuid('profile_id').notNull().references(() => profiles.id, { onDelete: 'cascade' }),
  date: date('date').notNull(),
  views: integer('views').default(0),
  uniqueVisitors: integer('unique_visitors').default(0),
  totalClicks: integer('total_clicks').default(0),
}, (table) => [
  uniqueIndex('daily_stats_profile_date_idx').on(table.profileId, table.date),
]);

// ============================================================
// PHASE 5: Monetization
// ============================================================

export const products = pgTable('products', {
  id: uuid('id').primaryKey().defaultRandom(),
  profileId: uuid('profile_id').notNull().references(() => profiles.id, { onDelete: 'cascade' }),
  name: varchar('name', { length: 200 }).notNull(),
  description: text('description'),
  priceCents: integer('price_cents').notNull(),
  currency: varchar('currency', { length: 3 }).default('USD'),
  type: varchar('type', { length: 20 }).notNull(),
  fileUrl: text('file_url'),
  imageUrl: text('image_url'),
  isActive: boolean('is_active').default(true),
  stripePriceId: varchar('stripe_price_id', { length: 255 }),
  createdAt: timestamp('created_at', { withTimezone: true }).defaultNow(),
  updatedAt: timestamp('updated_at', { withTimezone: true }).defaultNow(),
}, (table) => [
  index('products_profile_idx').on(table.profileId),
  check('products_price_check', sql`${table.priceCents} >= 0`),
]);

export const orders = pgTable('orders', {
  id: uuid('id').primaryKey().defaultRandom(),
  productId: uuid('product_id').notNull().references(() => products.id, { onDelete: 'cascade' }),
  profileId: uuid('profile_id').notNull().references(() => profiles.id, { onDelete: 'cascade' }),
  buyerEmail: varchar('buyer_email', { length: 255 }).notNull(),
  amountCents: integer('amount_cents').notNull(),
  stripePaymentIntent: varchar('stripe_payment_intent', { length: 255 }),
  stripeSessionId: varchar('stripe_session_id', { length: 255 }),
  status: varchar('status', { length: 20 }).default('pending'),
  fulfilled: boolean('fulfilled').default(false),
  createdAt: timestamp('created_at', { withTimezone: true }).defaultNow(),
}, (table) => [
  index('orders_profile_created_idx').on(table.profileId, table.createdAt),
  index('orders_stripe_session_idx').on(table.stripeSessionId),
  check('orders_amount_check', sql`${table.amountCents} > 0`),
]);

export const tips = pgTable('tips', {
  id: uuid('id').primaryKey().defaultRandom(),
  profileId: uuid('profile_id').notNull().references(() => profiles.id, { onDelete: 'cascade' }),
  amountCents: integer('amount_cents').notNull(),
  tipperName: varchar('tipper_name', { length: 200 }),
  tipperMessage: text('tipper_message'),
  stripePaymentIntent: varchar('stripe_payment_intent', { length: 255 }),
  stripeSessionId: varchar('stripe_session_id', { length: 255 }),
  status: varchar('status', { length: 20 }).default('pending'),
  createdAt: timestamp('created_at', { withTimezone: true }).defaultNow(),
  updatedAt: timestamp('updated_at', { withTimezone: true }).defaultNow(),
}, (table) => [
  index('tips_profile_created_idx').on(table.profileId, table.createdAt),
  check('tips_amount_check', sql`${table.amountCents} > 0`),
]);

export const subscriptions = pgTable('subscriptions', {
  id: uuid('id').primaryKey().defaultRandom(),
  userId: uuid('user_id').notNull().references(() => users.id, { onDelete: 'cascade' }),
  stripeSubscriptionId: varchar('stripe_subscription_id', { length: 255 }).notNull(),
  plan: varchar('plan', { length: 20 }).notNull(),
  status: varchar('status', { length: 20 }).default('active'),
  currentPeriodEnd: timestamp('current_period_end', { withTimezone: true }),
  cancelAtPeriodEnd: boolean('cancel_at_period_end').default(false),
  createdAt: timestamp('created_at', { withTimezone: true }).defaultNow(),
}, (table) => [
  index('subscriptions_user_idx').on(table.userId),
  index('subscriptions_stripe_idx').on(table.stripeSubscriptionId),
]);

// ============================================================
// PHASE 6: Customization (custom themes, pixels, custom domains)
// ============================================================

export const customThemes = pgTable('custom_themes', {
  id: uuid('id').primaryKey().defaultRandom(),
  userId: uuid('user_id').notNull().references(() => users.id, { onDelete: 'cascade' }),
  name: varchar('name', { length: 100 }).notNull(),
  colors: jsonb('colors').notNull(),
  isPublic: boolean('is_public').default(false),
  createdAt: timestamp('created_at', { withTimezone: true }).defaultNow(),
  updatedAt: timestamp('updated_at', { withTimezone: true }).defaultNow(),
}, (table) => [
  index('custom_themes_user_idx').on(table.userId),
]);

export const pixels = pgTable('pixels', {
  id: uuid('id').primaryKey().defaultRandom(),
  profileId: uuid('profile_id').notNull().references(() => profiles.id, { onDelete: 'cascade' }),
  type: varchar('type', { length: 20 }).notNull(),
  pixelId: varchar('pixel_id', { length: 255 }).notNull(),
  isActive: boolean('is_active').default(true),
  createdAt: timestamp('created_at', { withTimezone: true }).defaultNow(),
}, (table) => [
  index('pixels_profile_idx').on(table.profileId),
]);

export const customDomains = pgTable('custom_domains', {
  id: uuid('id').primaryKey().defaultRandom(),
  profileId: uuid('profile_id').notNull().references(() => profiles.id, { onDelete: 'cascade' }),
  domain: varchar('domain', { length: 255 }).unique().notNull(),
  status: varchar('status', { length: 20 }).default('pending'),
  sslStatus: varchar('ssl_status', { length: 20 }),
  dnsRecords: jsonb('dns_records'),
  verifiedAt: timestamp('verified_at', { withTimezone: true }),
  createdAt: timestamp('created_at', { withTimezone: true }).defaultNow(),
}, (table) => [
  index('custom_domains_domain_idx').on(table.domain),
]);

// ============================================================
// PHASE 7: Audience & contacts
// ============================================================

export const contacts = pgTable('contacts', {
  id: uuid('id').primaryKey().defaultRandom(),
  profileId: uuid('profile_id').notNull().references(() => profiles.id, { onDelete: 'cascade' }),
  email: varchar('email', { length: 255 }).notNull(),
  name: varchar('name', { length: 200 }),
  source: varchar('source', { length: 50 }),
  subscribed: boolean('subscribed').default(true),
  createdAt: timestamp('created_at', { withTimezone: true }).defaultNow(),
}, (table) => [
  uniqueIndex('contacts_profile_email_idx').on(table.profileId, table.email),
]);

// ============================================================
// PHASE 8: API keys
// ============================================================

export const apiKeys = pgTable('api_keys', {
  id: uuid('id').primaryKey().defaultRandom(),
  userId: uuid('user_id').notNull().references(() => users.id, { onDelete: 'cascade' }),
  name: varchar('name', { length: 100 }).notNull(),
  keyHash: varchar('key_hash', { length: 255 }).notNull(),
  prefix: varchar('prefix', { length: 8 }).notNull(),
  scopes: text('scopes').array(),
  lastUsed: timestamp('last_used', { withTimezone: true }),
  expiresAt: timestamp('expires_at', { withTimezone: true }),
  createdAt: timestamp('created_at', { withTimezone: true }).defaultNow(),
});

// ============================================================
// PHASE 9: Audit logging
// ============================================================

export const auditLogs = pgTable('audit_logs', {
  id: bigserial('id', { mode: 'number' }).primaryKey(),
  userId: uuid('user_id').references(() => users.id, { onDelete: 'set null' }),
  action: varchar('action', { length: 50 }).notNull(), // login, login_failed, logout, password_change, mfa_enable, mfa_disable, account_delete, etc.
  ipAddress: varchar('ip_address', { length: 45 }),
  userAgent: text('user_agent'),
  metadata: jsonb('metadata'), // extra context (e.g. email attempted, provider)
  createdAt: timestamp('created_at', { withTimezone: true }).defaultNow(),
}, (table) => [
  index('audit_logs_user_id_idx').on(table.userId),
  index('audit_logs_action_idx').on(table.action, table.createdAt),
]);
