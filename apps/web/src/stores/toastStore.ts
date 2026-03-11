import { create } from 'zustand';

export type ToastType = 'success' | 'error' | 'info' | 'warning';

export interface Toast {
  id: string;
  type: ToastType;
  message: string;
  duration?: number;
}

interface ToastState {
  toasts: Toast[];
  addToast: (type: ToastType, message: string, duration?: number) => void;
  removeToast: (id: string) => void;
}

let nextId = 0;

export const useToastStore = create<ToastState>((set) => ({
  toasts: [],

  addToast: (type, message, duration = 4000) => {
    const id = String(++nextId);
    set((s) => ({ toasts: [...s.toasts, { id, type, message, duration }] }));
    if (duration > 0) {
      setTimeout(() => {
        set((s) => ({ toasts: s.toasts.filter((t) => t.id !== id) }));
      }, duration);
    }
  },

  removeToast: (id) => {
    set((s) => ({ toasts: s.toasts.filter((t) => t.id !== id) }));
  },
}));

// Convenience helpers — import these anywhere
export const toast = {
  success: (msg: string, duration?: number) => useToastStore.getState().addToast('success', msg, duration ?? 3000),
  error: (msg: string, duration?: number) => useToastStore.getState().addToast('error', msg, duration ?? 6000),
  info: (msg: string, duration?: number) => useToastStore.getState().addToast('info', msg, duration ?? 4000),
  warning: (msg: string, duration?: number) => useToastStore.getState().addToast('warning', msg, duration ?? 5000),
};
