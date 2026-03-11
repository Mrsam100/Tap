import { create } from 'zustand';
import type { AuthUser } from '@tap/shared';
import { setSessionExpiredHandler } from '../lib/api';

interface AuthState {
  user: AuthUser | null;
  isLoading: boolean;
  isAuthenticated: boolean;

  setUser: (user: AuthUser | null) => void;
  fetchUser: () => Promise<void>;
  login: (email: string, password: string, mfaCode?: string) => Promise<{ mfaRequired?: boolean }>;
  register: (email: string, username: string, password: string) => Promise<void>;
  logout: () => Promise<void>;
}

export const useAuthStore = create<AuthState>((set) => ({
  user: null,
  isLoading: true,
  isAuthenticated: false,

  setUser: (user) => set({ user, isAuthenticated: !!user }),

  fetchUser: async () => {
    try {
      const res = await fetch('/api/auth/me', { credentials: 'include' });
      if (res.ok) {
        const text = await res.text();
        if (!text) {
          set({ user: null, isAuthenticated: false, isLoading: false });
          return;
        }
        const data = JSON.parse(text);
        set({ user: data.user, isAuthenticated: true, isLoading: false });
      } else {
        set({ user: null, isAuthenticated: false, isLoading: false });
      }
    } catch {
      set({ user: null, isAuthenticated: false, isLoading: false });
    }
  },

  login: async (email, password, mfaCode) => {
    const res = await fetch('/api/auth/login', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      credentials: 'include',
      body: JSON.stringify({ email, password, mfaCode }),
    });
    const text = await res.text();
    if (!text) throw new Error('No response from server — is the API running?');
    const data = JSON.parse(text);
    if (!res.ok) throw new Error(data.error || 'Login failed');
    if (data.mfaRequired) return { mfaRequired: true };
    set({ user: data.user, isAuthenticated: true });
    return {};
  },

  register: async (email, username, password) => {
    const res = await fetch('/api/auth/register', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      credentials: 'include',
      body: JSON.stringify({ email, username, password }),
    });
    const text = await res.text();
    if (!text) throw new Error('No response from server — is the API running?');
    const data = JSON.parse(text);
    if (!res.ok) throw new Error(data.error || 'Registration failed');
    set({ user: data.user, isAuthenticated: true });
  },

  logout: async () => {
    try {
      await fetch('/api/auth/logout', { method: 'POST', credentials: 'include' });
    } catch (err) {
      console.error('Logout API call failed:', err);
    } finally {
      set({ user: null, isAuthenticated: false });
    }
  },
}));

// Register 401 handler: on session expiry, clear auth state and redirect to login
setSessionExpiredHandler(() => {
  const { isAuthenticated } = useAuthStore.getState();
  if (isAuthenticated) {
    useAuthStore.setState({ user: null, isAuthenticated: false });
    // Preserve current path so login can redirect back
    const returnUrl = window.location.pathname + window.location.search;
    if (returnUrl !== '/login') {
      window.location.href = `/login?returnUrl=${encodeURIComponent(returnUrl)}`;
    }
  }
});
