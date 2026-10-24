import React, { useEffect, Suspense, lazy } from 'react';
import { TitleBar } from './TitleBar';
import { Sidebar } from './Sidebar';
import { ConvertPage } from '../conversion/ConvertPage';

const PdfWorkspace = lazy(() =>
  import('../pdf/PdfWorkspace').then((m) => ({ default: m.PdfWorkspace }))
);
const BatchPanel = lazy(() =>
  import('../batch/BatchPanel').then((m) => ({ default: m.BatchPanel }))
);
const HistoryPage = lazy(() =>
  import('../history/HistoryPage').then((m) => ({ default: m.HistoryPage }))
);
const SettingsPage = lazy(() =>
  import('../settings/SettingsPage').then((m) => ({ default: m.SettingsPage }))
);

import { useUiStore } from '../../stores/ui-store';
import { useConversionStore } from '../../stores/conversion-store';
import { useSettingsStore } from '../../stores/settings-store';
import { useHistoryStore } from '../../stores/history-store';

const LoadingFallback: React.FC = () => (
  <div
    style={{
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      height: '100%',
      color: 'var(--text-muted)',
      fontSize: '13px',
      gap: '8px',
    }}
  >
    <div
      style={{
        width: '16px',
        height: '16px',
        borderRadius: '50%',
        border: '2px solid rgba(99, 102, 241, 0.3)',
        borderTopColor: 'var(--accent-primary)',
        animation: 'spinSlow 1s linear infinite',
      }}
    />
    <span>Loading workspace...</span>
  </div>
);

export const AppShell: React.FC = () => {
  const { activeTab, setActiveTab, toasts, removeToast, showToast } = useUiStore();
  const {
    loadFilesFromPaths,
    updateJobProgress,
    updateJobStatus,
    setIsDragging,
    isDragging,
  } = useConversionStore();
  const { loadSettings } = useSettingsStore();
  const { loadHistory } = useHistoryStore();

  useEffect(() => {
    // Initial data hydration
    loadSettings();
    loadHistory();

    // Listen to conversion IPC events from main process
    if (window.convertFlow) {
      const unsubProgress = window.convertFlow.onJobProgress((payload) => {
        updateJobProgress(payload.jobId, payload.progress, payload.stage);
      });

      const unsubStatus = window.convertFlow.onJobStatus((payload) => {
        updateJobStatus(payload);
        if (payload.status === 'completed') {
          showToast('Conversion completed successfully!', 'success');
        } else if (payload.status === 'failed') {
          showToast(payload.error || 'Conversion failed', 'error');
        }
      });

      return () => {
        unsubProgress();
        unsubStatus();
      };
    }
  }, [loadSettings, loadHistory, updateJobProgress, updateJobStatus, showToast]);

  // Global window drop listener: dropping anywhere switches to convert tab & loads file!
  useEffect(() => {
    const handleWindowDragOver = (e: DragEvent) => {
      e.preventDefault();
      e.stopPropagation();
      setIsDragging(true);
    };

    const handleWindowDragLeave = (e: DragEvent) => {
      e.preventDefault();
      e.stopPropagation();
      setIsDragging(false);
    };

    const handleWindowDrop = async (e: DragEvent) => {
      e.preventDefault();
      e.stopPropagation();
      setIsDragging(false);

      if (e.dataTransfer && e.dataTransfer.files.length > 0) {
        const paths = Array.from(e.dataTransfer.files)
          .map((f: any) => f.path || f.name)
          .filter(Boolean);
        if (paths.length > 0) {
          setActiveTab('convert');
          await loadFilesFromPaths(paths);
        }
      }
    };

    window.addEventListener('dragover', handleWindowDragOver);
    window.addEventListener('dragleave', handleWindowDragLeave);
    window.addEventListener('drop', handleWindowDrop);

    return () => {
      window.removeEventListener('dragover', handleWindowDragOver);
      window.removeEventListener('dragleave', handleWindowDragLeave);
      window.removeEventListener('drop', handleWindowDrop);
    };
  }, [loadFilesFromPaths, setActiveTab, setIsDragging]);

  return (
    <div
      style={{
        display: 'flex',
        flexDirection: 'column',
        width: '100vw',
        height: '100vh',
        overflow: 'hidden',
        background: 'var(--bg-app)',
      }}
    >
      <TitleBar />

      <div className="app-container">
        <Sidebar />

        <main className="main-content">
          <Suspense fallback={<LoadingFallback />}>
            {activeTab === 'convert' && <ConvertPage />}
            {activeTab === 'pdf' && <PdfWorkspace />}
            {activeTab === 'batch' && <BatchPanel />}
            {activeTab === 'history' && <HistoryPage />}
            {activeTab === 'settings' && <SettingsPage />}
          </Suspense>

          {/* Full-screen Drag Overlay indicator if dragging */}
          {isDragging && (
            <div
              style={{
                position: 'absolute',
                inset: 0,
                background: 'rgba(99, 102, 241, 0.25)',
                backdropFilter: 'blur(8px)',
                border: '3px dashed var(--accent-primary)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                zIndex: 999,
                pointerEvents: 'none',
              }}
            >
              <div
                style={{
                  padding: '24px 40px',
                  borderRadius: 'var(--radius-xl)',
                  background: 'var(--bg-card)',
                  boxShadow: 'var(--shadow-glow)',
                  fontSize: '20px',
                  fontWeight: 700,
                  color: 'white',
                }}
              >
                Drop files anywhere to convert ✨
              </div>
            </div>
          )}
        </main>
      </div>

      {/* Floating Toast notifications */}
      <div
        style={{
          position: 'fixed',
          bottom: '24px',
          right: '24px',
          display: 'flex',
          flexDirection: 'column',
          gap: '8px',
          zIndex: 10000,
          pointerEvents: 'none',
        }}
      >
        {toasts.map((t) => (
          <div
            key={t.id}
            className="animate-fade-in"
            style={{
              padding: '12px 18px',
              borderRadius: 'var(--radius-md)',
              background:
                t.type === 'success'
                  ? 'var(--color-success-bg)'
                  : t.type === 'error'
                  ? 'var(--color-error-bg)'
                  : 'var(--bg-card)',
              color:
                t.type === 'success'
                  ? 'var(--color-success)'
                  : t.type === 'error'
                  ? 'var(--color-error)'
                  : 'var(--text-primary)',
              border: `1px solid ${
                t.type === 'success'
                  ? 'rgba(16, 185, 129, 0.3)'
                  : t.type === 'error'
                  ? 'rgba(239, 68, 68, 0.3)'
                  : 'var(--border-medium)'
              }`,
              boxShadow: 'var(--shadow-md)',
              backdropFilter: 'blur(12px)',
              fontSize: '13px',
              fontWeight: 500,
              pointerEvents: 'auto',
              cursor: 'pointer',
            }}
            onClick={() => removeToast(t.id)}
          >
            {t.message}
          </div>
        ))}
      </div>
    </div>
  );
};
