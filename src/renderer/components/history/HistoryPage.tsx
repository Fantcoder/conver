import React, { useEffect, useState } from 'react';
import {
  History,
  Trash2,
  Search,
  AlertCircle,
  FileCheck,
  Download,
  Share2,
} from 'lucide-react';
import { useHistoryStore } from '../../stores/history-store';
import { useUiStore } from '../../stores/ui-store';

export const HistoryPage: React.FC = () => {
  const { history, loadHistory, clearHistory, removeHistoryItem } = useHistoryStore();
  const { showToast } = useUiStore();
  const [searchQuery, setSearchQuery] = useState('');

  useEffect(() => {
    loadHistory();
  }, [loadHistory]);

  const filtered = history.filter(
    (item) =>
      item.sourceName.toLowerCase().includes(searchQuery.toLowerCase()) ||
      item.targetFormat.toLowerCase().includes(searchQuery.toLowerCase()) ||
      item.operationLabel.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const formatSize = (bytes: number) => {
    if (!bytes) return '0 B';
    if (bytes < 1024) return `${bytes} B`;
    if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
    return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
  };

  const formatDate = (timestamp: number) => {
    const d = new Date(timestamp);
    return d.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' }) +
      ' • ' +
      d.toLocaleDateString();
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
            Conversion History
          </h1>
          <p style={{ fontSize: '13px', color: 'var(--text-secondary)' }}>
            Record of recent conversions processed locally on your machine.
          </p>
        </div>

        {history.length > 0 && (
          <button className="btn btn-ghost" style={{ color: 'var(--color-error)' }} onClick={clearHistory}>
            <Trash2 size={15} /> Clear All History
          </button>
        )}
      </div>

      {history.length > 0 && (
        <div style={{ position: 'relative', maxWidth: '420px', marginBottom: '20px' }}>
          <Search
            size={16}
            color="var(--text-muted)"
            style={{ position: 'absolute', left: '12px', top: '10px' }}
          />
          <input
            type="text"
            className="input-field"
            style={{ paddingLeft: '36px' }}
            placeholder="Search by file name or format..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
          />
        </div>
      )}

      {filtered.length === 0 ? (
        <div
          style={{
            padding: '50px',
            border: '1px solid var(--border-subtle)',
            borderRadius: 'var(--radius-xl)',
            textAlign: 'center',
            background: 'var(--bg-card)',
            maxWidth: '560px',
            margin: '40px auto',
          }}
        >
          <History size={40} color="var(--text-muted)" style={{ marginBottom: '14px' }} />
          <h3 style={{ fontSize: '16px', fontWeight: 600, marginBottom: '6px' }}>
            {history.length === 0 ? 'No conversion history yet' : 'No matching records found'}
          </h3>
          <p style={{ fontSize: '12px', color: 'var(--text-muted)' }}>
            {history.length === 0
              ? 'Converted files will appear here with quick open actions.'
              : 'Try searching with a different keyword.'}
          </p>
        </div>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', maxWidth: '840px' }}>
          {filtered.map((item) => (
            <div
              key={item.id}
              style={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                padding: '14px 18px',
                background: 'var(--bg-card)',
                borderRadius: 'var(--radius-md)',
                border: '1px solid var(--border-subtle)',
              }}
            >
              <div style={{ display: 'flex', alignItems: 'center', gap: '14px' }}>
                <div
                  style={{
                    width: '38px',
                    height: '38px',
                    borderRadius: '8px',
                    background:
                      item.status === 'completed'
                        ? 'var(--color-success-bg)'
                        : 'var(--color-error-bg)',
                    color:
                      item.status === 'completed'
                        ? 'var(--color-success)'
                        : 'var(--color-error)',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                  }}
                >
                  {item.status === 'completed' ? (
                    <FileCheck size={20} />
                  ) : (
                    <AlertCircle size={20} />
                  )}
                </div>

                <div>
                  <div style={{ fontSize: '14px', fontWeight: 600 }}>
                    {item.sourceName}
                  </div>
                  <div
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      gap: '8px',
                      fontSize: '11px',
                      color: 'var(--text-muted)',
                      marginTop: '3px',
                    }}
                  >
                    <span className="badge badge-primary">{item.sourceFormat}</span>
                    <span>→</span>
                    <span className="badge badge-success">{item.targetFormat}</span>
                    <span>•</span>
                    <span>{formatSize(item.outputSize || item.sourceSize)}</span>
                    <span>•</span>
                    <span>{formatDate(item.completedAt)}</span>
                  </div>
                </div>
              </div>

              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                {item.status === 'completed' && item.outputPath && (
                  <>
                    <button
                      className="btn btn-ghost"
                      style={{ padding: '6px 10px', fontSize: '12px', display: 'flex', alignItems: 'center', gap: '4px' }}
                      title="Share Link"
                      onClick={async () => {
                        const shareUrl = `${window.location.origin}/share?id=${item.id}&file=${encodeURIComponent(item.sourceName)}`;
                        try {
                          await navigator.clipboard.writeText(shareUrl);
                          showToast('Share link copied to clipboard!', 'success');
                        } catch {
                          showToast('Share URL: ' + shareUrl, 'info');
                        }
                      }}
                    >
                      <Share2 size={13} /> Share
                    </button>
                    <button
                      className="btn btn-secondary"
                      style={{ padding: '6px 12px', fontSize: '12px', display: 'flex', alignItems: 'center', gap: '4px' }}
                      title="Download Converted File"
                      onClick={async () => {
                        if (window.convertFlow) {
                          await window.convertFlow.showItemInFolder(item.outputPath);
                        }
                        showToast(`Downloaded ${item.sourceName}`, 'success');
                      }}
                    >
                      <Download size={13} /> Download
                    </button>
                  </>
                )}
                <button
                  className="btn btn-ghost"
                  style={{ padding: '6px', color: 'var(--text-muted)' }}
                  onClick={() => removeHistoryItem(item.id)}
                  title="Remove from history"
                >
                  <Trash2 size={14} />
                </button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};
