import { create } from 'zustand';
import { AppSettings } from '../../shared/types';

interface SettingsStore {
  settings: AppSettings;
  isLoading: boolean;
  loadSettings: () => Promise<void>;
  updateSettings: (partial: Partial<AppSettings>) => Promise<void>;
  chooseOutputDir: () => Promise<void>;
}

const DEFAULT_SETTINGS: AppSettings = {
  theme: 'dark',
  outputDirectory: '',
  overwriteExisting: false,
  openFolderOnFinish: false,
  soundEnabled: true,
  hapticEnabled: true,
  defaultImageQuality: 85,
  defaultAudioBitrate: '192k',
  defaultVideoQuality: '1080p',
  autoClearCompleted: false,
  keepOriginalDate: true,
};

export const useSettingsStore = create<SettingsStore>((set, get) => ({
  settings: DEFAULT_SETTINGS,
  isLoading: true,

  loadSettings: async () => {
    try {
      if (window.convertFlow) {
        const settings = await window.convertFlow.getSettings();
        set({ settings, isLoading: false });
        document.documentElement.setAttribute('data-theme', settings.theme);
      }
    } catch (err) {
      console.error('Failed to load settings in store:', err);
      set({ isLoading: false });
    }
  },

  updateSettings: async (partial) => {
    try {
      const current = get().settings;
      const updated = { ...current, ...partial };
      set({ settings: updated });
      if (partial.theme) {
        document.documentElement.setAttribute('data-theme', partial.theme);
      }
      if (window.convertFlow) {
        await window.convertFlow.updateSettings(partial);
      }
    } catch (err) {
      console.error('Failed to update settings in store:', err);
    }
  },

  chooseOutputDir: async () => {
    try {
      if (window.convertFlow) {
        const dir = await window.convertFlow.chooseOutputDir();
        if (dir) {
          await get().updateSettings({ outputDirectory: dir });
        }
      }
    } catch (err) {
      console.error('Failed to pick directory:', err);
    }
  },
}));
