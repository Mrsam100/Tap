const ERROR_MAP: Record<string, string> = {
  'Email already registered': 'This email is already in use. Try signing in instead.',
  'Username already taken': 'This username is taken. Try a different one.',
  'Invalid credentials': 'Incorrect email or password. Please try again.',
  'Invalid email or password': 'Incorrect email or password. Please try again.',
  'Login failed': 'Incorrect email or password. Please try again.',
  'Too many requests': 'Too many attempts. Please wait a few minutes and try again.',
  'Session expired': 'Your session has expired. Please sign in again.',
  'Email not verified': 'Please verify your email before signing in. Check your inbox.',
  'Invalid token': 'This link has expired or is invalid. Please request a new one.',
  'Password too weak': 'Password must be at least 8 characters with a mix of letters and numbers.',
  'Network Error': 'Unable to connect. Check your internet connection and try again.',
  'Failed to fetch': 'Unable to connect. Check your internet connection and try again.',
  'Request failed (502)': 'Our servers are temporarily unavailable. Please try again in a moment.',
  'Request failed (503)': 'Our servers are temporarily unavailable. Please try again in a moment.',
  'Request failed (500)': 'Something went wrong on our end. Please try again.',
};

export function friendlyError(raw: string): string {
  if (ERROR_MAP[raw]) return ERROR_MAP[raw];

  // Partial match fallback
  const lower = raw.toLowerCase();
  if (lower.includes('network') || lower.includes('fetch')) {
    return 'Unable to connect. Check your internet connection and try again.';
  }
  if (lower.includes('timeout')) {
    return 'The request timed out. Please try again.';
  }
  if (lower.includes('already exists') || lower.includes('duplicate')) {
    return 'This already exists. Please use a different value.';
  }

  return raw;
}
