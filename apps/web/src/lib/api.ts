import { toast } from '../stores/toastStore';

const API_BASE = '/api';

// Listener for 401 session expiry — registered by auth store on init
type SessionExpiredHandler = () => void;
let onSessionExpired: SessionExpiredHandler | null = null;

export function setSessionExpiredHandler(handler: SessionExpiredHandler) {
  onSessionExpired = handler;
}

export async function apiFetch<T = unknown>(path: string, options?: RequestInit): Promise<T> {
  const headers: Record<string, string> = {};

  // B6 fix: only set Content-Type for non-FormData bodies
  // FormData needs the browser to set its own Content-Type with boundary
  if (!(options?.body instanceof FormData)) {
    headers['Content-Type'] = 'application/json';
  }

  const res = await fetch(`${API_BASE}${path}`, {
    ...options,
    credentials: 'include',
    headers: {
      ...headers,
      ...options?.headers,
    },
  });

  // Handle session expiry — redirect to login
  if (res.status === 401) {
    // Don't trigger on auth endpoints (login/register/me) to avoid loops
    if (!path.startsWith('/auth/')) {
      toast.warning('Your session has expired. Please sign in again.');
      onSessionExpired?.();
    }
    throw new Error('Session expired');
  }

  // B5 fix: handle non-JSON responses gracefully (e.g., 502 from proxy)
  let data: unknown;
  try {
    data = await res.json();
  } catch {
    if (!res.ok) throw new Error(`Request failed (${res.status})`);
    throw new Error('Invalid response format');
  }

  if (!res.ok) throw new Error((data as { error?: string }).error || 'Request failed');
  return data as T;
}
