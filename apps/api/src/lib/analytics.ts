import crypto from 'node:crypto';

// ── IP hashing (privacy-preserving, daily-rotating salt) ──────────

const DAILY_SALT_CACHE: { date: string; salt: string } = { date: '', salt: '' };

function getDailySalt(): string {
  const today = new Date().toISOString().slice(0, 10);
  if (DAILY_SALT_CACHE.date !== today) {
    DAILY_SALT_CACHE.date = today;
    DAILY_SALT_CACHE.salt = crypto.randomBytes(16).toString('hex');
  }
  return DAILY_SALT_CACHE.salt;
}

export function hashIp(ip: string): string {
  return crypto
    .createHmac('sha256', getDailySalt())
    .update(ip)
    .digest('hex')
    .slice(0, 16);
}

export function extractIp(req: { header: (name: string) => string | undefined }): string {
  return (
    req.header('x-forwarded-for')?.split(',')[0]?.trim() ||
    req.header('x-real-ip') ||
    'unknown'
  );
}

// ── User-Agent parsing (lightweight, no deps) ─────────────────────

export interface UAInfo {
  deviceType: 'desktop' | 'mobile' | 'tablet' | 'bot' | 'unknown';
  browser: string;
  os: string;
}

export function parseUserAgent(ua: string | undefined): UAInfo {
  if (!ua) return { deviceType: 'unknown', browser: 'Unknown', os: 'Unknown' };

  const lower = ua.toLowerCase();

  // Bot detection
  if (/bot|crawl|spider|slurp|facebookexternal|whatsapp|telegram|preview/i.test(ua)) {
    return { deviceType: 'bot', browser: 'Bot', os: 'Bot' };
  }

  // Device type
  let deviceType: UAInfo['deviceType'] = 'desktop';
  if (/ipad|tablet|playbook|silk/i.test(ua)) {
    deviceType = 'tablet';
  } else if (/mobile|iphone|ipod|android.*mobile|windows phone|blackberry/i.test(ua)) {
    deviceType = 'mobile';
  }

  // Browser
  let browser = 'Other';
  if (lower.includes('edg/') || lower.includes('edge/')) browser = 'Edge';
  else if (lower.includes('opr/') || lower.includes('opera')) browser = 'Opera';
  else if (lower.includes('chrome') && !lower.includes('edg')) browser = 'Chrome';
  else if (lower.includes('safari') && !lower.includes('chrome')) browser = 'Safari';
  else if (lower.includes('firefox')) browser = 'Firefox';
  else if (lower.includes('msie') || lower.includes('trident')) browser = 'IE';

  // OS
  let os = 'Other';
  if (/windows/i.test(ua)) os = 'Windows';
  else if (/macintosh|mac os/i.test(ua)) os = 'macOS';
  else if (/iphone|ipad|ipod/i.test(ua)) os = 'iOS';
  else if (/android/i.test(ua)) os = 'Android';
  else if (/linux/i.test(ua)) os = 'Linux';
  else if (/cros/i.test(ua)) os = 'ChromeOS';

  return { deviceType, browser, os };
}

// ── Referrer cleaning ─────────────────────────────────────────────

export function cleanReferrer(referrer: string | undefined): string | null {
  if (!referrer) return null;
  try {
    const url = new URL(referrer);
    // Hostname only — strip paths, query params, and fragments for privacy
    return `${url.protocol}//${url.hostname}`;
  } catch {
    return null;
  }
}
