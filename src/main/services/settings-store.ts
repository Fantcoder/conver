import { app } from 'electron';
import fs from 'node:fs';
import path from 'node:path';
import { AppSettings } from '../../shared/types';

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

let cachedSettings: AppSettings | null = null;

function getSettingsPath(): string {
  const userData = app.getPath('userData');
  return path.join(userData, 'convertflow-settings.json');
}

export async function loadSettings(): Promise<AppSettings> {
  if (cachedSettings) return cachedSettings;

  const filePath = getSettingsPath();
  try {
    if (fs.existsSync(filePath)) {
      const data = await fs.promises.readFile(filePath, 'utf-8');
      cachedSettings = { ...DEFAULT_SETTINGS, ...JSON.parse(data) };
      return cachedSettings!;
    }
  } catch (err) {
    console.error('Failed to load settings:', err);
  }

  cachedSettings = { ...DEFAULT_SETTINGS };
  return cachedSettings;
}

export async function saveSettings(
  partial: Partial<AppSettings>,
): Promise<AppSettings> {
  const current = await loadSettings();
  cachedSettings = { ...current, ...partial };

  const filePath = getSettingsPath();
  try {
    await fs.promises.mkdir(path.dirname(filePath), { recursive: true });
    await fs.promises.writeFile(
      filePath,
      JSON.stringify(cachedSettings, null, 2),
      'utf-8',
    );
  } catch (err) {
    console.error('Failed to save settings:', err);
  }

  return cachedSettings;
}
