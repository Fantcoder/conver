import React, { useEffect } from 'react';
import {
  Folder,
  Moon,
  Sun,
  Sliders,
  Info,
} from 'lucide-react';
import { useSettingsStore } from '../../stores/settings-store';
import { useUiStore } from '../../stores/ui-store';

export const SettingsPage: React.FC = () => {
  const { settings, loadSettings, updateSettings, chooseOutputDir } = useSettingsStore();
  const { showToast } = useUiStore();

  useEffect(() => {
    loadSettings();
  }, [loadSettings]);

  const handleToggleTheme = (theme: 'dark' | 'light') => {
    updateSettings({ theme });
    showToast(`Switched to ${theme} theme`, 'info');
  };

  return (
    <div
      className="animate-fade-in"
      style={{
        display: 'flex',
        flexDirection: 'column',
        height: '100%',
        padding: '30px',
        overflowY: 'auto',
      }}
    >
      <div style={{ marginBottom: '28px' }}>
        <h1 style={{ fontSize: '26px', fontWeight: 700, marginBottom: '6px' }}>
          Preferences & Settings
        </h1>
        <p style={{ fontSize: '13px', color: 'var(--text-secondary)' }}>
          Configure output folder destinations, conversion quality presets, and application appearance.
        </p>
      </div>

      <div style={{ display: 'flex', flexDirection: 'column', gap: '24px', maxWidth: '680px' }}>
        {/* Output Directory Section */}
        <div
          className="glass-panel"
          style={{ padding: '22px', display: 'flex', flexDirection: 'column', gap: '14px' }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
            <Folder size={20} color="var(--accent-primary)" />
            <h3 style={{ fontSize: '16px', fontWeight: 600 }}>Output Destination</h3>
          </div>

          <p style={{ fontSize: '12px', color: 'var(--text-secondary)' }}>
            Choose where converted documents and media should be saved on your system.
          </p>

          <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
            <label style={{ display: 'flex', alignItems: 'center', gap: '10px', fontSize: '13px', cursor: 'pointer' }}>
              <input
                type="radio"
                name="outputDirMode"
                checked={!settings.outputDirectory}
                onChange={() => updateSettings({ outputDirectory: '' })}
              />
              <span>Save converted files in the same folder as the original file</span>
            </label>

            <label style={{ display: 'flex', alignItems: 'center', gap: '10px', fontSize: '13px', cursor: 'pointer' }}>
              <input
                type="radio"
                name="outputDirMode"
                checked={Boolean(settings.outputDirectory)}
                onChange={() => {
                  if (!settings.outputDirectory) chooseOutputDir();
                }}
              />
              <span>Save all converted files to a designated folder</span>
            </label>

            {settings.outputDirectory && (
              <div style={{ display: 'flex', gap: '10px', alignItems: 'center', marginTop: '6px' }}>
                <input
                  type="text"
                  className="input-field"
                  readOnly
                  value={settings.outputDirectory}
                  style={{ fontSize: '12px' }}
                />
                <button className="btn btn-secondary" style={{ whiteSpace: 'nowrap' }} onClick={chooseOutputDir}>
                  Change Folder
                </button>
              </div>
            )}
          </div>
        </div>

        {/* Appearance Section */}
        <div
          className="glass-panel"
          style={{ padding: '22px', display: 'flex', flexDirection: 'column', gap: '14px' }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
            <Moon size={20} color="var(--accent-primary)" />
            <h3 style={{ fontSize: '16px', fontWeight: 600 }}>Theme Appearance</h3>
          </div>

          <div style={{ display: 'flex', gap: '12px' }}>
            <button
              className={`btn ${settings.theme === 'dark' ? 'btn-primary' : 'btn-secondary'}`}
              style={{ padding: '10px 20px' }}
              onClick={() => handleToggleTheme('dark')}
            >
              <Moon size={16} /> Dark Studio Mode
            </button>
            <button
              className={`btn ${settings.theme === 'light' ? 'btn-primary' : 'btn-secondary'}`}
              style={{ padding: '10px 20px' }}
              onClick={() => handleToggleTheme('light')}
            >
              <Sun size={16} /> Light Mode
            </button>
          </div>
        </div>

        {/* Quality Presets */}
        <div
          className="glass-panel"
          style={{ padding: '22px', display: 'flex', flexDirection: 'column', gap: '16px' }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
            <Sliders size={20} color="var(--accent-primary)" />
            <h3 style={{ fontSize: '16px', fontWeight: 600 }}>Default Quality Presets</h3>
          </div>

          <div>
            <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '13px', marginBottom: '8px' }}>
              <span>Default Image Quality (WebP / JPG / AVIF)</span>
              <strong style={{ color: 'var(--accent-primary)' }}>{settings.defaultImageQuality}%</strong>
            </div>
            <input
              type="range"
              min={20}
              max={100}
              step={5}
              value={settings.defaultImageQuality}
              onChange={(e) => updateSettings({ defaultImageQuality: Number(e.target.value) })}
            />
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', gap: '12px', marginTop: '8px' }}>
            <label style={{ display: 'flex', alignItems: 'center', gap: '10px', fontSize: '13px', cursor: 'pointer' }}>
              <input
                type="checkbox"
                checked={settings.soundEnabled}
                onChange={(e) => updateSettings({ soundEnabled: e.target.checked })}
              />
              <span>Play completion sound effect upon successful conversion</span>
            </label>

            <label style={{ display: 'flex', alignItems: 'center', gap: '10px', fontSize: '13px', cursor: 'pointer' }}>
              <input
                type="checkbox"
                checked={settings.overwriteExisting}
                onChange={(e) => updateSettings({ overwriteExisting: e.target.checked })}
              />
              <span>Overwrite existing files automatically without prompting</span>
            </label>
          </div>
        </div>

        {/* About App */}
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            padding: '16px 20px',
            background: 'rgba(255, 255, 255, 0.02)',
            borderRadius: 'var(--radius-md)',
            border: '1px solid var(--border-subtle)',
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
            <Info size={18} color="var(--text-muted)" />
            <div style={{ fontSize: '12px', color: 'var(--text-muted)' }}>
              ConvertFlow Desktop v1.0.0 Pro • 100% Native Offline Engine
            </div>
          </div>
          <span className="badge badge-success" style={{ fontSize: '10px' }}>
            Production Ready
          </span>
        </div>
      </div>
    </div>
  );
};
