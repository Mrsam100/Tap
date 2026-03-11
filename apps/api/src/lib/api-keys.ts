import { randomBytes, createHmac } from 'crypto';

const KEY_PREFIX = 'tap_live_';
// HMAC secret: prevents offline brute-force if DB is leaked
const HMAC_SECRET = process.env.API_KEY_HMAC_SECRET || 'tap-api-key-hmac-secret-change-in-production';

/**
 * Generate a new API key.
 * Format: tap_live_ + 32 random hex bytes (64 chars total)
 * Returns: { key, prefix, hash }
 * - key: the full key shown to the user once
 * - prefix: first 8 chars of the random part (for display)
 * - hash: HMAC-SHA256 hex hash of the full key (stored in DB)
 */
export function generateApiKey() {
  const randomPart = randomBytes(32).toString('hex');
  const key = KEY_PREFIX + randomPart;
  const prefix = KEY_PREFIX + randomPart.slice(0, 8);
  const hash = hashApiKey(key);
  return { key, prefix, hash };
}

/**
 * Hash an API key using HMAC-SHA256 for secure storage.
 * HMAC with a server secret prevents offline brute-force attacks
 * if the database is compromised.
 */
export function hashApiKey(key: string): string {
  return createHmac('sha256', HMAC_SECRET).update(key).digest('hex');
}
