import React, { useState } from 'react';
import {
  Layers,
  Plus,
  Play,
  Trash2,
  CheckCircle2,
  AlertCircle,
  FileText,
  Image as ImageIcon,
} from 'lucide-react';
import { useConversionStore } from '../../stores/conversion-store';
import { useUiStore } from '../../stores/ui-store';

export const BatchPanel: React.FC = () => {
  const { files, loadFilesFromPaths, removeFile, clearFiles } = useConversionStore();
  const { showToast } = useUiStore();

  const [universalTarget, setUniversalTarget] = useState<string>('WEBP');
  const [isConvertingBatch, setIsConvertingBatch] = useState(false);
  const [completedMap, setCompletedMap] = useState<Record<string, { status: string; path?: string }>>({});

  const handleAddFiles = async () => {
    if (window.convertFlow) {
      const selected = await window.convertFlow.selectFiles({ multiple: true });
      if (selected && selected.length > 0) {
        await loadFilesFromPaths(selected);
      }
    }
  };

  const handleRunBatch = async () => {
    if (!files.length || !window.convertFlow) {
      showToast('Please add files to batch convert', 'error');
      return;
    }

    setIsConvertingBatch(true);
    const newCompletedMap = { ...completedMap };

    for (let i = 0; i < files.length; i++) {
      const f = files[i];
      try {
        const caps = await window.convertFlow.getCapabilities(f);
        const match = caps.find(
          (c) => c.targetFormat.toUpperCase() === universalTarget.toUpperCase()
        ) || caps[0];

        if (match) {
          await window.convertFlow.startJob({
            file: f,
            capability: match,
            options: { quality: 85 },
          });
          newCompletedMap[f.id] = { status: 'completed' };
        } else {
          newCompletedMap[f.id] = { status: 'skipped' };
        }
      } catch {
        newCompletedMap[f.id] = { status: 'failed' };
      }
      setCompletedMap({ ...newCompletedMap });
    }

    setIsConvertingBatch(false);
    showToast('Batch conversion finished!', 'success');
  };

  const formatSize = (bytes: number) => {
    if (bytes < 1024) return `${bytes} B`;
    if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
    return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
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
      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          marginBottom: '24px',
        }}
      >
        <div>
          <h1 style={{ fontSize: '26px', fontWeight: 700, marginBottom: '6px' }}>
            Batch Conversion Queue
          </h1>
          <p style={{ fontSize: '13px', color: 'var(--text-secondary)' }}>
            Convert multiple files simultaneously with batch optimization presets.
          </p>
        </div>

        <div style={{ display: 'flex', gap: '8px' }}>
          <button className="btn btn-secondary" onClick={handleAddFiles}>
            <Plus size={15} /> Add Files
          </button>
          {files.length > 0 && (
            <button className="btn btn-ghost" onClick={clearFiles}>
              <Trash2 size={15} /> Clear Queue
            </button>
          )}
        </div>
      </div>

      {files.length === 0 ? (
        <div
          onClick={handleAddFiles}
          style={{
            padding: '50px',
            border: '2px dashed var(--border-medium)',
            borderRadius: 'var(--radius-xl)',
            textAlign: 'center',
            cursor: 'pointer',
            background: 'var(--bg-glass)',
            maxWidth: '640px',
            margin: '40px auto',
          }}
        >
          <Layers size={44} color="var(--accent-primary)" style={{ marginBottom: '16px' }} />
          <h3 style={{ fontSize: '18px', fontWeight: 600, marginBottom: '6px' }}>
            No files in batch queue
          </h3>
          <p style={{ fontSize: '13px', color: 'var(--text-muted)' }}>
            Click here to select multiple files for batch processing
          </p>
        </div>
      ) : (
        <div style={{ maxWidth: '840px' }}>
          {/* Universal Target Selector & Run Bar */}
          <div
            className="glass-panel"
            style={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              padding: '16px 20px',
              marginBottom: '20px',
            }}
          >
            <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
              <span style={{ fontSize: '13px', fontWeight: 500 }}>
                Convert all files to:
              </span>
              <select
                className="input-field"
                style={{ width: '130px', fontWeight: 600 }}
                value={universalTarget}
                onChange={(e) => setUniversalTarget(e.target.value)}
              >
                <option value="WEBP">WebP</option>
                <option value="PNG">PNG</option>
                <option value="JPG">JPG</option>
                <option value="AVIF">AVIF</option>
                <option value="PDF">PDF</option>
                <option value="ZIP">ZIP</option>
              </select>
            </div>

            <button
              className="btn btn-primary"
              style={{ padding: '10px 24px', fontSize: '13px' }}
              disabled={isConvertingBatch}
              onClick={handleRunBatch}
            >
              <Play size={15} fill="currentColor" />
              {isConvertingBatch
                ? 'Processing Batch...'
                : `Convert All (${files.length} Files)`}
            </button>
          </div>

          {/* List of files in batch */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
            {files.map((file, idx) => {
              const status = completedMap[file.id]?.status;
              return (
                <div
                  key={file.id + idx}
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    padding: '12px 18px',
                    background: 'var(--bg-card)',
                    borderRadius: 'var(--radius-md)',
                    border: '1px solid var(--border-subtle)',
                  }}
                >
                  <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                    <div
                      style={{
                        width: '36px',
                        height: '36px',
                        borderRadius: '8px',
                        background: 'var(--accent-gradient-subtle)',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        color: 'var(--accent-primary)',
                      }}
                    >
                      {file.category === 'image' ? (
                        <ImageIcon size={18} />
                      ) : (
                        <FileText size={18} />
                      )}
                    </div>

                    <div>
                      <div style={{ fontSize: '13px', fontWeight: 600 }}>{file.name}</div>
                      <div style={{ fontSize: '11px', color: 'var(--text-muted)' }}>
                        {file.extension.toUpperCase()} • {formatSize(file.size)}
                      </div>
                    </div>
                  </div>

                  <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
                    {status === 'completed' && (
                      <span className="badge badge-success">
                        <CheckCircle2 size={12} /> Ready
                      </span>
                    )}
                    {status === 'failed' && (
                      <span className="badge" style={{ background: 'var(--color-error-bg)', color: 'var(--color-error)' }}>
                        <AlertCircle size={12} /> Failed
                      </span>
                    )}

                    <button
                      className="btn btn-ghost"
                      style={{ padding: '6px', color: 'var(--text-muted)' }}
                      onClick={() => removeFile(idx)}
                    >
                      <Trash2 size={14} />
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
};
