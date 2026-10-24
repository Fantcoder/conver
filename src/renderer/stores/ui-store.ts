import { create } from 'zustand';

export type NavigationTab = 'convert' | 'pdf' | 'batch' | 'history' | 'settings';

export interface ToastMessage {
  id: string;
  message: string;
  type: 'success' | 'error' | 'info';
}

interface UiStore {
  activeTab: NavigationTab;
  setActiveTab: (tab: NavigationTab) => void;
  toasts: ToastMessage[];
  showToast: (message: string, type?: 'success' | 'error' | 'info') => void;
  removeToast: (id: string) => void;
}

export const useUiStore = create<UiStore>((set) => ({
  activeTab: 'convert',
  setActiveTab: (tab) => set({ activeTab: tab }),
  toasts: [],
  showToast: (message, type = 'info') => {
    const id = Math.random().toString(36).substring(2, 9);
    set((state) => ({
      toasts: [...state.toasts, { id, message, type }],
    }));
    setTimeout(() => {
      set((state) => ({
        toasts: state.toasts.filter((t) => t.id !== id),
      }));
    }, 4000);
  },
  removeToast: (id) =>
    set((state) => ({
      toasts: state.toasts.filter((t) => t.id !== id),
    })),
}));
