const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const USERNAME_REGEX = /^[a-zA-Z0-9_]+$/;

const BLOCKED_USERNAMES = new Set([
  'admin', 'administrator', 'root', 'api', 'auth', 'login', 'register', 'logout',
  'settings', 'dashboard', 'help', 'support', 'tap', 'www', 'mail',
  'blog', 'pricing', 'features', 'analytics', 'monetization', 'build',
  'privacy', 'terms', 'about', 'contact', 'careers', 'press',
  'legal', 'status', 'docs', 'developer', 'dev', 'staging', 'test',
  'app', 'static', 'assets', 'public', 'cdn', 'media', 'uploads',
  'profile', 'profiles', 'user', 'users', 'account', 'billing',
  'subscribe', 'unsubscribe', 'verify', 'confirm', 'reset', 'forgot',
  'oauth', 'callback', 'webhook', 'webhooks', 'health', 'healthz',
  'ns1', 'ns2', 'mx', 'smtp', 'ftp', 'ssh', 'pop', 'imap',
  'postmaster', 'webmaster', 'hostmaster', 'abuse',
]);

export function validateEmail(email: string): string | null {
  if (!email || typeof email !== 'string') return 'Email is required';
  const trimmed = email.trim().toLowerCase();
  if (trimmed.length > 255) return 'Email is too long';
  if (!EMAIL_REGEX.test(trimmed)) return 'Invalid email format';
  return null;
}

export function validatePassword(password: string): string | null {
  if (!password || typeof password !== 'string') return 'Password is required';
  if (password.length < 8) return 'Password must be at least 8 characters';
  if (password.length > 128) return 'Password is too long';
  if (!/[A-Z]/.test(password)) return 'Password must contain at least one uppercase letter';
  if (!/[a-z]/.test(password)) return 'Password must contain at least one lowercase letter';
  if (!/[0-9]/.test(password)) return 'Password must contain at least one number';
  return null;
}

export function validateUsername(username: string): string | null {
  if (!username || typeof username !== 'string') return 'Username is required';
  const trimmed = username.trim().toLowerCase();
  if (trimmed.length < 3) return 'Username must be at least 3 characters';
  if (trimmed.length > 30) return 'Username must be at most 30 characters';
  if (!USERNAME_REGEX.test(trimmed)) return 'Username can only contain letters, numbers, and underscores';
  if (isBlockedUsername(trimmed)) return 'This username is not available';
  return null;
}

export function isBlockedUsername(username: string): boolean {
  return BLOCKED_USERNAMES.has(username.toLowerCase());
}
