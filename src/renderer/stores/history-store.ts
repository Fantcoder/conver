import { create } from 'zustand';
import { HistoryItem } from '../../shared/types';

interface HistoryStore {
  history: HistoryItem[];
  isLoading: boolean;
  loadHistory: () => Promise<void>;
  clearHistory: () => Promise<void>;
  removeHistoryItem: (id: string) => Promise<void>;
}

export const useHistoryStore = create<HistoryStore>((set) => ({
  history: [],
  isLoading: true,

  loadHistory: async () => {
    try {
      if (window.convertFlow) {
        const history = await window.convertFlow.getHistory();
        set({ history, isLoading: false });
      }
    } catch (err) {
      console.error('Failed to load history:', err);
      set({ isLoading: false });
    }
  },

  clearHistory: async () => {
    try {
      if (window.convertFlow) {
        await window.convertFlow.clearHistory();
        set({ history: [] });
      }
    } catch (err) {
      console.error('Failed to clear history:', err);
    }
  },

  removeHistoryItem: async (id) => {
    try {
      if (window.convertFlow) {
        await window.convertFlow.removeHistoryItem(id);
        set((state) => ({ history: state.history.filter((h) => h.id !== id) }));
      }
    } catch (err) {
      console.error('Failed to remove history item:', err);
    }
  },
}));
