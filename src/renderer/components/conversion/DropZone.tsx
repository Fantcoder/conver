import React, { useState } from 'react';
import { UploadCloud, FilePlus } from 'lucide-react';
import { useConversionStore } from '../../stores/conversion-store';
import { sounds } from '../../utils/audio';

export const DropZone: React.FC = () => {
  const { loadFilesFromPaths, setIsDragging } = useConversionStore();
  const [isOver, setIsOver] = useState(false);

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsOver(true);
    setIsDragging(true);
  };

  const handleDragLeave = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsOver(false);
    setIsDragging(false);
  };

  const handleDrop = async (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsOver(false);
    setIsDragging(false);

    const files = Array.from(e.dataTransfer.files);
    if (files.length > 0) {
      const paths = files
        .map((f: File) => {
          if (window.convertFlow?.getPathForFile) {
            try {
              const p = window.convertFlow.getPathForFile(f);
              if (p) return p;
            } catch {}
          }
          return (f as any).path || f.name;
        })
        .filter(Boolean);
      if (paths.length > 0) {
        sounds.playImport();
        await loadFilesFromPaths(paths);
      }
    }
  };

  const handleBrowse = async () => {
    if (window.convertFlow) {
      const selected = await window.convertFlow.selectFiles({ multiple: true });
      if (selected && selected.length > 0) {
        sounds.playImport();
        await loadFilesFromPaths(selected);
      }
    }
  };

  return (
    <div
      onDragOver={handleDragOver}
      onDragLeave={handleDragLeave}
      onDrop={handleDrop}
      style={{
        width: '100%',
        maxWidth: '720px',
        margin: '0 auto',
        padding: '50px 30px',
        border: `2px dashed ${isOver ? 'var(--accent-primary)' : 'var(--border-medium)'}`,
        borderRadius: 'var(--radius-xl)',
        background: isOver ? 'rgba(99, 102, 241, 0.08)' : 'var(--bg-glass)',
        backdropFilter: 'blur(16px)',
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        textAlign: 'center',
        cursor: 'pointer',
        transition: 'all 0.25s cubic-bezier(0.16, 1, 0.3, 1)',
        boxShadow: isOver ? '0 0 35px var(--accent-glow)' : 'var(--shadow-md)',
      }}
      onClick={handleBrowse}
    >
      <div
        style={{
          width: '72px',
          height: '72px',
          borderRadius: '50%',
          background: 'var(--accent-gradient-subtle)',
          border: '1px solid rgba(99, 102, 241, 0.3)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          color: 'var(--accent-primary)',
          marginBottom: '20px',
          transform: isOver ? 'scale(1.1)' : 'scale(1)',
          transition: 'transform 0.2s ease',
        }}
      >
        <UploadCloud size={36} />
      </div>

      <h2 style={{ fontSize: '22px', fontWeight: 600, marginBottom: '8px' }}>
        Drop any file here to convert
      </h2>
      <p
        style={{
          fontSize: '14px',
          color: 'var(--text-secondary)',
          maxWidth: '420px',
          marginBottom: '24px',
        }}
      >
        Drop photos, PDFs, documents, data spreadsheets, or archives. The
        interactive conversion wheel will appear automatically.
      </p>

      <button
        type="button"
        className="btn btn-primary"
        style={{
          padding: '10px 24px',
          fontSize: '14px',
          borderRadius: 'var(--radius-full)',
        }}
        onClick={(e) => {
          e.stopPropagation();
          handleBrowse();
        }}
      >
        <FilePlus size={16} />
        Browse Files on Computer
      </button>

      {/* Format pills */}
      <div
        style={{
          display: 'flex',
          flexWrap: 'wrap',
          gap: '8px',
          justifyContent: 'center',
          marginTop: '36px',
          maxWidth: '560px',
        }}
      >
        {[
          'PNG',
          'JPG',
          'WEBP',
          'AVIF',
          'PDF',
          'CSV',
          'JSON',
          'YAML',
          'XML',
          'ZIP',
          'MARKDOWN',
        ].map((fmt) => (
          <span
            key={fmt}
            style={{
              fontSize: '11px',
              fontWeight: 500,
              padding: '4px 10px',
              borderRadius: 'var(--radius-sm)',
              background: 'rgba(255, 255, 255, 0.05)',
              color: 'var(--text-muted)',
              border: '1px solid var(--border-subtle)',
            }}
          >
            {fmt}
          </span>
        ))}
      </div>
    </div>
  );
};
