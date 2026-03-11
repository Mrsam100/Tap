// --- Auth Types ---

export interface AuthUser {
  id: string;
  email: string;
  username: string;
  displayName: string | null;
  avatarUrl: string | null;
  emailVerified: boolean;
  mfaEnabled: boolean;
  plan: string;
  createdAt: string;
}

export interface ApiError {
  error: string;
  field?: string;
}

// --- Core Types ---

export interface LinkStyle {
  fontSize: 'sm' | 'md' | 'lg';
  customColor: string;
  outline: boolean;
}

export type BlockType = 'button' | 'video' | 'music' | 'product' | 'newsletter' | 'event' | 'timer' | 'section' | 'whatsapp';

export interface ContentBlock {
  id: string;
  type: BlockType;
  label: string;
  url: string;
  style: LinkStyle;
  active: boolean;
  price?: string;
  image?: string;
  embedUrl?: string;
  countdownDate?: string;
  geoRouting?: { country: string; url: string }[];
  timeRouting?: { start: string; end: string; url: string }[];
  // Access control (Phase 7)
  scheduledStart?: string | null;
  scheduledEnd?: string | null;
  ageGate?: boolean;
  minAge?: number | null;
  sensitive?: boolean;
  emailGate?: boolean;
}

export type SocialPlatform = 'twitter' | 'instagram' | 'tiktok' | 'snapchat' | 'facebook' | 'linkedin' | 'github' | 'youtube' | 'email';

export interface SocialLink {
  id: string;
  platform: SocialPlatform;
  url: string;
}

export interface ButtonStyleConfig {
  shape: 'rounded' | 'pill' | 'square' | 'soft';
  fill: 'solid' | 'outline' | 'glass' | 'shadow';
  shadow: string;
  color: string;
}

export interface SiteData {
  name: string;
  bio: string;
  avatarImage: string | null;
  favicon: string | null;
  links: ContentBlock[];
  socials: SocialLink[];
  themeId: string;
  fontId: string;
  showFluidBackground: boolean;
  avatarInitials: string;
  seo: {
    title: string;
    description: string;
  };
  // Phase 6 fields
  buttonStyle: ButtonStyleConfig;
  layout: string;
  customBgType: string | null;
  customBgColor: string;
  customBgUrl: string | null;
  ogImageUrl: string | null;
  removeBranding: boolean;
}

export interface ThemeConfig {
  id: string;
  name: string;
  colors: {
    bg: string;
    text: string;
    cardBg: string;
    cardBorder: string;
    cardText: string;
    accent: string;
    avatarBg: string;
    avatarText: string;
  };
}

export interface GeneratedPage {
  name: string;
  bio: string;
  links: Array<{
    label: string;
    url: string;
    type: string;
  }>;
  themeId: string;
}

// --- Profile API Types (Phase 3) ---

/** A profile as returned by the API */
export interface ApiProfile {
  id: string;
  userId: string;
  username: string;
  displayName: string | null;
  bio: string | null;
  avatarUrl: string | null;
  faviconUrl: string | null;
  themeId: string | null;
  fontId: string | null;
  showFluidBg: boolean | null;
  customBgUrl: string | null;
  customBgType: string | null;
  customBgColor: string | null;
  buttonStyle: Record<string, unknown> | null;
  layout: string | null;
  seoTitle: string | null;
  seoDescription: string | null;
  ogImageUrl: string | null;
  customDomain: string | null;
  removeBranding: boolean | null;
  isPublished: boolean | null;
  createdAt: string | null;
  updatedAt: string | null;
}

/** A profile with its nested links, socials, and collections */
export interface ApiProfileFull extends ApiProfile {
  links: ApiLink[];
  socials: ApiSocial[];
  collections: ApiCollection[];
}

/** A link as returned by the API */
export interface ApiLink {
  id: string;
  profileId: string;
  type: string;
  label: string | null;
  url: string | null;
  thumbnailUrl: string | null;
  position: number;
  isActive: boolean | null;
  isArchived: boolean | null;
  style: Record<string, unknown> | null;
  metadata: Record<string, unknown> | null;
  scheduledStart: string | null;
  scheduledEnd: string | null;
  ageGate: boolean | null;
  minAge: number | null;
  sensitive: boolean | null;
  emailGate: boolean | null;
  collectionId: string | null;
  createdAt: string | null;
  updatedAt: string | null;
}

/** A social link as returned by the API */
export interface ApiSocial {
  id: string;
  profileId: string;
  platform: string;
  url: string;
  position: number;
  createdAt: string | null;
}

/** A collection as returned by the API */
export interface ApiCollection {
  id: string;
  profileId: string;
  title: string;
  position: number;
  isCollapsedDefault: boolean | null;
  createdAt: string | null;
}

/** Public profile data (subset, no sensitive fields) */
export interface PublicProfile {
  id: string;
  username: string;
  displayName: string | null;
  bio: string | null;
  avatarUrl: string | null;
  faviconUrl: string | null;
  themeId: string | null;
  fontId: string | null;
  showFluidBg: boolean | null;
  customBgUrl: string | null;
  customBgType: string | null;
  customBgColor: string | null;
  buttonStyle: Record<string, unknown> | null;
  layout: string | null;
  seoTitle: string | null;
  seoDescription: string | null;
  ogImageUrl: string | null;
  removeBranding: boolean | null;
  links: ApiLink[];
  socials: ApiSocial[];
  pixels?: Array<{ type: string; pixelId: string }>;
}

// --- Analytics Types (Phase 4) ---

export interface AnalyticsOverview {
  views: number;
  viewsChange: number;
  uniqueVisitors: number;
  visitorsChange: number;
  clicks: number;
  clicksChange: number;
  ctr: number;
  avgTimeOnPage: number;
  avgScrollDepth: number;
}

export interface TimeseriesPoint {
  date: string;
  views: number;
  visitors: number;
  clicks: number;
}

export interface ReferrerStat {
  source: string;
  count: number;
}

export interface DeviceStat {
  type: string;
  count: number;
}

export interface BrowserStat {
  name: string;
  count: number;
}

export interface OsStat {
  name: string;
  count: number;
}

export interface CountryStat {
  country: string;
  count: number;
}

export interface CityStat {
  country: string;
  city: string;
  count: number;
}

export interface LinkStat {
  linkId: string;
  label: string;
  url: string;
  type: string;
  clicks: number;
}

export type AnalyticsPeriod = '7d' | '30d' | '90d' | '12m' | 'all';

// --- Monetization Types (Phase 5) ---

export type ProductType = 'digital' | 'service' | 'tip';

export interface ApiProduct {
  id: string;
  profileId: string;
  name: string;
  description: string | null;
  priceCents: number;
  currency: string;
  type: string;
  fileUrl: string | null;
  imageUrl: string | null;
  isActive: boolean;
  stripePriceId: string | null;
  createdAt: string | null;
  updatedAt: string | null;
}

export interface ApiOrder {
  id: string;
  productId: string;
  profileId: string;
  buyerEmail: string;
  amountCents: number;
  status: string;
  fulfilled: boolean;
  createdAt: string | null;
  productName?: string;
}

export interface ApiTip {
  id: string;
  profileId: string;
  amountCents: number;
  tipperName: string | null;
  tipperMessage: string | null;
  status: string;
  createdAt: string | null;
}

export interface RevenueOverview {
  totalRevenue: number;
  productRevenue: number;
  tipRevenue: number;
  orderCount: number;
  tipCount: number;
  revenueChange: number;
}

export interface ApiSubscription {
  id: string;
  plan: string;
  status: string;
  currentPeriodEnd: string | null;
  cancelAtPeriodEnd: boolean;
}

export interface PlanInfo {
  id: string;
  name: string;
  priceCents: number;
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

// --- Audience Types (Phase 7) ---

export interface ApiContact {
  id: string;
  profileId: string;
  email: string;
  name: string | null;
  source: string | null;
  subscribed: boolean;
  createdAt: string | null;
}

export interface AudienceOverview {
  totalContacts: number;
  subscribedContacts: number;
  contactsChange: number;
}

// --- API Key Types (Phase 8) ---

export interface ApiKey {
  id: string;
  name: string;
  prefix: string;
  lastUsed: string | null;
  expiresAt: string | null;
  createdAt: string | null;
}
