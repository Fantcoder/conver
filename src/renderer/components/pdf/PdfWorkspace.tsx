import React, { useState } from 'react';
import {
  FileText,
  Combine,
  Scissors,
  RotateCw,
  Stamp,
  Plus,
  Trash2,
  ArrowUp,
  ArrowDown,
  CheckCircle2,
  FolderOpen,
} from 'lucide-react';
import { useUiStore } from '../../stores/ui-store';

type PdfToolType = 'merge' | 'split' | 'rotate' | 'watermark' | 'compress';

function getPathMeta(filePath: string) {
  if (!filePath) return { dir: '.', name: '', baseName: '' };
  const norm = filePath.replace(/\\/g, '/');
  const lastSlash = norm.lastIndexOf('/');
  const dir = lastSlash !== -1 ? filePath.substring(0, lastSlash) : '.';
  const name = lastSlash !== -1 ? filePath.substring(lastSlash + 1) : filePath;
  const lastDot = name.lastIndexOf('.');
  const baseName = lastDot > 0 ? name.substring(0, lastDot) : name;
  return { dir, name, baseName };
}

export const PdfWorkspace: React.FC = () => {
  const { showToast } = useUiStore();
  const [activeTool, setActiveTool] = useState<PdfToolType>('merge');

  // Merge state
  const [mergeFiles, setMergeFiles] = useState<string[]>([]);

  // Single PDF Tool state
  const [selectedFile, setSelectedFile] = useState<string>('');
  const [splitMode, setSplitMode] = useState<'all' | 'ranges'>('all');
  const [splitRange, setSplitRange] = useState('1');
  const [rotateDeg, setRotateDeg] = useState<90 | 180 | 270>(90);
  const [watermarkText, setWatermarkText] = useState('CONFIDENTIAL');
  const [watermarkOpacity, setWatermarkOpacity] = useState(30);

  // Status & output
  const [isProcessing, setIsProcessing] = useState(false);
  const [lastOutput, setLastOutput] = useState<string | null>(null);

  // Pick multiple files for merge
  const handlePickMergeFiles = async () => {
    if (!window.convertFlow) return;
    const paths = await window.convertFlow.selectFiles({
      multiple: true,
      filters: [{ name: 'PDF Documents', extensions: ['pdf'] }],
    });
    if (paths && paths.length > 0) {
      setMergeFiles((prev) => [...prev, ...paths]);
      setLastOutput(null);
    }
  };

  // Pick single file for split/rotate/watermark/compress
  const handlePickSingleFile = async () => {
    if (!window.convertFlow) return;
    const paths = await window.convertFlow.selectFiles({
      multiple: false,
      filters: [{ name: 'PDF Documents', extensions: ['pdf'] }],
    });
    if (paths && paths.length > 0) {
      setSelectedFile(paths[0]);
      setLastOutput(null);
    }
  };

  const handleMerge = async () => {
    if (mergeFiles.length < 2) {
      showToast('Please add at least 2 PDF files to merge', 'error');
      return;
    }
    setIsProcessing(true);
    setLastOutput(null);
    try {
      const { dir } = getPathMeta(mergeFiles[0]);
      const outputPath = `${dir}\\merged-document-${Date.now()}.pdf`;
      const result = await window.convertFlow.mergePdfs({
        files: mergeFiles,
        outputPath,
      });
      setLastOutput(result);
      showToast('PDFs successfully merged!', 'success');
    } catch (err: any) {
      showToast(err?.message || 'Failed to merge PDFs', 'error');
    } finally {
      setIsProcessing(false);
    }
  };

  const handleSplit = async () => {
    if (!selectedFile) {
      showToast('Please select a PDF file first', 'error');
      return;
    }
    setIsProcessing(true);
    setLastOutput(null);
    try {
      const { dir } = getPathMeta(selectedFile);
      const results = await window.convertFlow.splitPdf({
        filePath: selectedFile,
        outputDir: dir,
        mode: splitMode,
        ranges: splitRange,
      });
      if (results.length > 0) {
        setLastOutput(results[0]);
        showToast(
          `Split into ${results.length} files successfully!`,
          'success',
        );
      }
    } catch (err: any) {
      showToast(err?.message || 'Failed to split PDF', 'error');
    } finally {
      setIsProcessing(false);
    }
  };

  const handleRotate = async () => {
    if (!selectedFile) {
      showToast('Please select a PDF file first', 'error');
      return;
    }
    setIsProcessing(true);
    setLastOutput(null);
    try {
      const { dir, baseName } = getPathMeta(selectedFile);
      const outputPath = `${dir}\\${baseName}-rotated-${rotateDeg}.pdf`;

      const result = await window.convertFlow.rotatePdf({
        filePath: selectedFile,
        outputPath,
        degrees: rotateDeg,
      });
      setLastOutput(result);
      showToast(`Rotated by ${rotateDeg}° successfully!`, 'success');
    } catch (err: any) {
      showToast(err?.message || 'Failed to rotate PDF', 'error');
    } finally {
      setIsProcessing(false);
    }
  };

  const handleWatermark = async () => {
    if (!selectedFile) {
      showToast('Please select a PDF file first', 'error');
      return;
    }
    setIsProcessing(true);
    setLastOutput(null);
    try {
      const { dir, baseName } = getPathMeta(selectedFile);
      const outputPath = `${dir}\\${baseName}-watermarked.pdf`;

      const result = await window.convertFlow.watermarkPdf({
        filePath: selectedFile,
        outputPath,
        text: watermarkText,
        opacity: watermarkOpacity,
      });
      setLastOutput(result);
      showToast('Watermark added successfully!', 'success');
    } catch (err: any) {
      showToast(err?.message || 'Failed to watermark PDF', 'error');
    } finally {
      setIsProcessing(false);
    }
  };

  const moveMergeFile = (index: number, direction: 'up' | 'down') => {
    const targetIdx = direction === 'up' ? index - 1 : index + 1;
    if (targetIdx < 0 || targetIdx >= mergeFiles.length) return;
    const copy = [...mergeFiles];
    const temp = copy[index];
    copy[index] = copy[targetIdx];
    copy[targetIdx] = temp;
    setMergeFiles(copy);
  };

  const removeMergeFile = (index: number) => {
    setMergeFiles(mergeFiles.filter((_, i) => i !== index));
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
      <div style={{ marginBottom: '24px' }}>
        <h1 style={{ fontSize: '26px', fontWeight: 700, marginBottom: '6px' }}>
          PDF Studio Toolkit
        </h1>
        <p style={{ fontSize: '13px', color: 'var(--text-secondary)' }}>
          Powerful desktop PDF manipulation tools. Merge, split, rotate,
          watermark, and protect documents locally.
        </p>
      </div>

      {/* Sub-tools bar */}
      <div
        style={{
          display: 'flex',
          gap: '8px',
          background: 'var(--bg-card)',
          padding: '6px',
          borderRadius: 'var(--radius-lg)',
          border: '1px solid var(--border-subtle)',
          marginBottom: '28px',
          width: 'fit-content',
        }}
      >
        {[
          { id: 'merge', label: 'Merge PDFs', icon: <Combine size={16} /> },
          { id: 'split', label: 'Split Pages', icon: <Scissors size={16} /> },
          { id: 'rotate', label: 'Rotate Pages', icon: <RotateCw size={16} /> },
          {
            id: 'watermark',
            label: 'Watermark Stamp',
            icon: <Stamp size={16} />,
          },
        ].map((tool) => (
          <button
            key={tool.id}
            onClick={() => {
              setActiveTool(tool.id as PdfToolType);
              setLastOutput(null);
            }}
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '8px',
              padding: '8px 16px',
              borderRadius: 'var(--radius-md)',
              border: 'none',
              background:
                activeTool === tool.id
                  ? 'var(--accent-gradient)'
                  : 'transparent',
              color:
                activeTool === tool.id ? '#ffffff' : 'var(--text-secondary)',
              fontWeight: activeTool === tool.id ? 600 : 500,
              fontSize: '13px',
              cursor: 'pointer',
              transition: 'all 0.15s ease',
            }}
          >
            {tool.icon}
            <span>{tool.label}</span>
          </button>
        ))}
      </div>

      {/* TOOL 1: MERGE */}
      {activeTool === 'merge' && (
        <div style={{ maxWidth: '720px' }}>
          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              marginBottom: '16px',
            }}
          >
            <div>
              <h3 style={{ fontSize: '16px', fontWeight: 600 }}>
                Documents to Merge
              </h3>
              <p style={{ fontSize: '12px', color: 'var(--text-muted)' }}>
                Drag order using arrow buttons. Files are combined from top to
                bottom.
              </p>
            </div>
            <button
              className="btn btn-secondary"
              onClick={handlePickMergeFiles}
            >
              <Plus size={15} /> Add PDF Files
            </button>
          </div>

          {mergeFiles.length === 0 ? (
            <div
              onClick={handlePickMergeFiles}
              style={{
                padding: '40px',
                border: '2px dashed var(--border-medium)',
                borderRadius: 'var(--radius-lg)',
                textAlign: 'center',
                cursor: 'pointer',
                background: 'rgba(255, 255, 255, 0.02)',
              }}
            >
              <FileText
                size={36}
                color="var(--accent-primary)"
                style={{ marginBottom: '12px' }}
              />
              <div
                style={{
                  fontWeight: 600,
                  fontSize: '14px',
                  marginBottom: '4px',
                }}
              >
                No PDF files selected yet
              </div>
              <div style={{ fontSize: '12px', color: 'var(--text-muted)' }}>
                Click here to choose multiple PDF documents to merge into one
              </div>
            </div>
          ) : (
            <div
              style={{
                display: 'flex',
                flexDirection: 'column',
                gap: '8px',
                marginBottom: '24px',
              }}
            >
              {mergeFiles.map((fp, idx) => {
                const name = getPathMeta(fp).name;
                return (
                  <div
                    key={fp + idx}
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'space-between',
                      padding: '12px 16px',
                      background: 'var(--bg-card)',
                      borderRadius: 'var(--radius-md)',
                      border: '1px solid var(--border-subtle)',
                    }}
                  >
                    <div
                      style={{
                        display: 'flex',
                        alignItems: 'center',
                        gap: '12px',
                      }}
                    >
                      <span className="badge badge-primary">{idx + 1}</span>
                      <FileText size={18} color="var(--accent-primary)" />
                      <span style={{ fontSize: '13px', fontWeight: 500 }}>
                        {name}
                      </span>
                    </div>

                    <div
                      style={{
                        display: 'flex',
                        alignItems: 'center',
                        gap: '4px',
                      }}
                    >
                      <button
                        className="btn btn-ghost"
                        style={{ padding: '6px' }}
                        disabled={idx === 0}
                        onClick={() => moveMergeFile(idx, 'up')}
                      >
                        <ArrowUp size={14} />
                      </button>
                      <button
                        className="btn btn-ghost"
                        style={{ padding: '6px' }}
                        disabled={idx === mergeFiles.length - 1}
                        onClick={() => moveMergeFile(idx, 'down')}
                      >
                        <ArrowDown size={14} />
                      </button>
                      <button
                        className="btn btn-ghost"
                        style={{ padding: '6px', color: 'var(--color-error)' }}
                        onClick={() => removeMergeFile(idx)}
                      >
                        <Trash2 size={14} />
                      </button>
                    </div>
                  </div>
                );
              })}

              <button
                className="btn btn-primary"
                style={{
                  padding: '12px 24px',
                  fontSize: '14px',
                  alignSelf: 'flex-start',
                  marginTop: '12px',
                }}
                disabled={isProcessing}
                onClick={handleMerge}
              >
                <Combine size={16} />
                {isProcessing ? 'Merging Documents...' : 'Merge All PDFs Now'}
              </button>
            </div>
          )}
        </div>
      )}

      {/* TOOL 2: SPLIT */}
      {activeTool === 'split' && (
        <div style={{ maxWidth: '640px' }}>
          <div style={{ marginBottom: '20px' }}>
            <h3
              style={{ fontSize: '16px', fontWeight: 600, marginBottom: '6px' }}
            >
              Select Target PDF
            </h3>
            <div style={{ display: 'flex', gap: '12px', alignItems: 'center' }}>
              <button
                className="btn btn-secondary"
                onClick={handlePickSingleFile}
              >
                Choose PDF File
              </button>
              {selectedFile && (
                <span
                  style={{ fontSize: '13px', color: 'var(--text-secondary)' }}
                >
                  {getPathMeta(selectedFile).name}
                </span>
              )}
            </div>
          </div>

          {selectedFile && (
            <div
              style={{
                display: 'flex',
                flexDirection: 'column',
                gap: '16px',
                padding: '20px',
                background: 'var(--bg-card)',
                borderRadius: 'var(--radius-lg)',
                border: '1px solid var(--border-subtle)',
              }}
            >
              <div>
                <label
                  style={{
                    fontSize: '12px',
                    color: 'var(--text-muted)',
                    display: 'block',
                    marginBottom: '8px',
                  }}
                >
                  Split Mode
                </label>
                <div style={{ display: 'flex', gap: '12px' }}>
                  <label
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      gap: '8px',
                      fontSize: '13px',
                      cursor: 'pointer',
                    }}
                  >
                    <input
                      type="radio"
                      name="splitMode"
                      checked={splitMode === 'all'}
                      onChange={() => setSplitMode('all')}
                    />
                    Extract Every Page as a Separate PDF
                  </label>
                  <label
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      gap: '8px',
                      fontSize: '13px',
                      cursor: 'pointer',
                    }}
                  >
                    <input
                      type="radio"
                      name="splitMode"
                      checked={splitMode === 'ranges'}
                      onChange={() => setSplitMode('ranges')}
                    />
                    Extract Specific Page Range
                  </label>
                </div>
              </div>

              {splitMode === 'ranges' && (
                <div>
                  <label
                    style={{
                      fontSize: '12px',
                      color: 'var(--text-muted)',
                      display: 'block',
                      marginBottom: '6px',
                    }}
                  >
                    Page Ranges (e.g. 1-3, 5, 8-10)
                  </label>
                  <input
                    type="text"
                    className="input-field"
                    value={splitRange}
                    onChange={(e) => setSplitRange(e.target.value)}
                    placeholder="1-3, 5"
                  />
                </div>
              )}

              <button
                className="btn btn-primary"
                style={{ padding: '10px 24px', alignSelf: 'flex-start' }}
                disabled={isProcessing}
                onClick={handleSplit}
              >
                <Scissors size={15} />
                {isProcessing ? 'Splitting...' : 'Split PDF Document'}
              </button>
            </div>
          )}
        </div>
      )}

      {/* TOOL 3: ROTATE */}
      {activeTool === 'rotate' && (
        <div style={{ maxWidth: '640px' }}>
          <div style={{ marginBottom: '20px' }}>
            <h3
              style={{ fontSize: '16px', fontWeight: 600, marginBottom: '6px' }}
            >
              Select Target PDF
            </h3>
            <div style={{ display: 'flex', gap: '12px', alignItems: 'center' }}>
              <button
                className="btn btn-secondary"
                onClick={handlePickSingleFile}
              >
                Choose PDF File
              </button>
              {selectedFile && (
                <span
                  style={{ fontSize: '13px', color: 'var(--text-secondary)' }}
                >
                  {getPathMeta(selectedFile).name}
                </span>
              )}
            </div>
          </div>

          {selectedFile && (
            <div
              style={{
                display: 'flex',
                flexDirection: 'column',
                gap: '16px',
                padding: '20px',
                background: 'var(--bg-card)',
                borderRadius: 'var(--radius-lg)',
                border: '1px solid var(--border-subtle)',
              }}
            >
              <div>
                <label
                  style={{
                    fontSize: '12px',
                    color: 'var(--text-muted)',
                    display: 'block',
                    marginBottom: '8px',
                  }}
                >
                  Rotation Angle
                </label>
                <div style={{ display: 'flex', gap: '10px' }}>
                  {[
                    { deg: 90, label: '90° Clockwise' },
                    { deg: 180, label: '180° Upside Down' },
                    { deg: 270, label: '270° Counter-Clockwise' },
                  ].map((item) => (
                    <button
                      key={item.deg}
                      type="button"
                      className={`btn ${rotateDeg === item.deg ? 'btn-primary' : 'btn-secondary'}`}
                      style={{ fontSize: '12px' }}
                      onClick={() => setRotateDeg(item.deg as any)}
                    >
                      <RotateCw size={14} />
                      {item.label}
                    </button>
                  ))}
                </div>
              </div>

              <button
                className="btn btn-primary"
                style={{ padding: '10px 24px', alignSelf: 'flex-start' }}
                disabled={isProcessing}
                onClick={handleRotate}
              >
                <RotateCw size={15} />
                {isProcessing ? 'Rotating...' : 'Rotate & Save PDF'}
              </button>
            </div>
          )}
        </div>
      )}

      {/* TOOL 4: WATERMARK */}
      {activeTool === 'watermark' && (
        <div style={{ maxWidth: '640px' }}>
          <div style={{ marginBottom: '20px' }}>
            <h3
              style={{ fontSize: '16px', fontWeight: 600, marginBottom: '6px' }}
            >
              Select Target PDF
            </h3>
            <div style={{ display: 'flex', gap: '12px', alignItems: 'center' }}>
              <button
                className="btn btn-secondary"
                onClick={handlePickSingleFile}
              >
                Choose PDF File
              </button>
              {selectedFile && (
                <span
                  style={{ fontSize: '13px', color: 'var(--text-secondary)' }}
                >
                  {getPathMeta(selectedFile).name}
                </span>
              )}
            </div>
          </div>

          {selectedFile && (
            <div
              style={{
                display: 'flex',
                flexDirection: 'column',
                gap: '16px',
                padding: '20px',
                background: 'var(--bg-card)',
                borderRadius: 'var(--radius-lg)',
                border: '1px solid var(--border-subtle)',
              }}
            >
              <div>
                <label
                  style={{
                    fontSize: '12px',
                    color: 'var(--text-muted)',
                    display: 'block',
                    marginBottom: '6px',
                  }}
                >
                  Watermark Stamp Text
                </label>
                <input
                  type="text"
                  className="input-field"
                  value={watermarkText}
                  onChange={(e) => setWatermarkText(e.target.value)}
                  placeholder="e.g. CONFIDENTIAL, DRAFT, DO NOT COPY"
                />
              </div>

              <div>
                <div
                  style={{
                    display: 'flex',
                    justifyContent: 'space-between',
                    fontSize: '12px',
                    color: 'var(--text-muted)',
                    marginBottom: '6px',
                  }}
                >
                  <span>Opacity</span>
                  <span>{watermarkOpacity}%</span>
                </div>
                <input
                  type="range"
                  min={10}
                  max={90}
                  step={5}
                  value={watermarkOpacity}
                  onChange={(e) => setWatermarkOpacity(Number(e.target.value))}
                />
              </div>

              <button
                className="btn btn-primary"
                style={{ padding: '10px 24px', alignSelf: 'flex-start' }}
                disabled={isProcessing}
                onClick={handleWatermark}
              >
                <Stamp size={15} />
                {isProcessing
                  ? 'Stamping Watermark...'
                  : 'Apply Watermark to All Pages'}
              </button>
            </div>
          )}
        </div>
      )}

      {/* Success Notification Bar with Quick Open */}
      {lastOutput && (
        <div
          className="animate-fade-in"
          style={{
            marginTop: '28px',
            maxWidth: '720px',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            padding: '14px 20px',
            background: 'var(--color-success-bg)',
            border: '1px solid rgba(16, 185, 129, 0.3)',
            borderRadius: 'var(--radius-md)',
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
            <CheckCircle2 size={20} color="var(--color-success)" />
            <span style={{ fontSize: '13px', fontWeight: 600 }}>
              Operation finished successfully!
            </span>
          </div>

          <div style={{ display: 'flex', gap: '8px' }}>
            <button
              className="btn btn-secondary"
              style={{ fontSize: '12px', padding: '6px 14px' }}
              onClick={async () => {
                if (!lastOutput || !window.convertFlow) return;
                showToast('Revealing file location...', 'info');
                await window.convertFlow.showItemInFolder(lastOutput);
                showToast('File revealed / saved to Downloads', 'success');
              }}
            >
              <FolderOpen size={14} /> Show in Folder
            </button>
            <button
              className="btn btn-primary"
              style={{ fontSize: '12px', padding: '6px 14px' }}
              onClick={async () => {
                if (!lastOutput || !window.convertFlow) return;
                showToast('Opening PDF document...', 'info');
                const err = await window.convertFlow.openPath(lastOutput);
                if (err) {
                  showToast(err, 'error');
                } else {
                  showToast('PDF opened successfully!', 'success');
                }
              }}
            >
              Open PDF
            </button>
          </div>
        </div>
      )}
    </div>
  );
};
