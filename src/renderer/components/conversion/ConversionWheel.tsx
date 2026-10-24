import React, { useState, useEffect, useRef } from 'react';
import {
  FileText,
  Image as ImageIcon,
  Minimize2,
  Maximize2,
  Lock,
  Scissors,
  RotateCw,
  Archive,
  Table,
  Code,
  Zap,
  ArrowRight,
  X,
  ChevronLeft,
  ChevronRight,
  Move,
} from 'lucide-react';
import confetti from 'canvas-confetti';
import { useConversionStore } from '../../stores/conversion-store';
import { useSettingsStore } from '../../stores/settings-store';
import { sounds } from '../../utils/audio';

export const ConversionWheel: React.FC = () => {
  const {
    files,
    activeFileIndex,
    selectFileIndex,
    capabilities,
    selectedCapability,
    selectCapability,
    options,
    setOption,
    startConversion,
    clearFiles,
  } = useConversionStore();

  const { settings } = useSettingsStore();

  // Drag-to-convert state
  const [dragOffset, setDragOffset] = useState<{ x: number; y: number } | null>(null);
  const [isPointerDragging, setIsPointerDragging] = useState(false);
  const [magnetTargetId, setMagnetTargetId] = useState<string | null>(null);
  const [isAbsorbing, setIsAbsorbing] = useState(false);
  const [hasPlayedImportSound, setHasPlayedImportSound] = useState(false);

  const dragStartRef = useRef<{ x: number; y: number } | null>(null);
  const stageRef = useRef<HTMLDivElement | null>(null);
  const prevMagnetRef = useRef<string | null>(null);

  const rafRef = useRef<number | null>(null);

  const wheelRadius = 230; // Radius in pixels
  const totalSegments = capabilities.length;

  if (!files.length) return null;
  const currentFile = files[activeFileIndex];

  // Play import sound on initial entrance
  useEffect(() => {
    if (!hasPlayedImportSound && settings.soundEnabled) {
      sounds.playImport();
      setHasPlayedImportSound(true);
    }
  }, [hasPlayedImportSound, settings.soundEnabled]);

  useEffect(() => {
    return () => {
      if (rafRef.current) cancelAnimationFrame(rafRef.current);
    };
  }, []);

  // Memoize coordinates for each segment
  const segmentCoordsList = React.useMemo(() => {
    return capabilities.map((_, i) => {
      const angle = (i / totalSegments) * 2 * Math.PI - Math.PI / 2;
      const x = Math.round(Math.cos(angle) * wheelRadius);
      const y = Math.round(Math.sin(angle) * wheelRadius);
      return { x, y, angle };
    });
  }, [capabilities, totalSegments, wheelRadius]);

  const getSegmentCoords = (index: number) => {
    return segmentCoordsList[index] || { x: 0, y: 0, angle: 0 };
  };

  // Map icon strings to Lucide components
  const getIcon = (iconName: string) => {
    switch (iconName) {
      case 'image':
        return <ImageIcon size={20} />;
      case 'file-text':
        return <FileText size={20} />;
      case 'minimize-2':
        return <Minimize2 size={20} />;
      case 'maximize-2':
        return <Maximize2 size={20} />;
      case 'scissors':
        return <Scissors size={20} />;
      case 'rotate-cw':
        return <RotateCw size={20} />;
      case 'lock':
        return <Lock size={20} />;
      case 'archive':
        return <Archive size={20} />;
      case 'table':
        return <Table size={20} />;
      case 'code':
      case 'braces':
        return <Code size={20} />;
      default:
        return <Zap size={20} />;
    }
  };

  const formatSize = (bytes: number) => {
    if (bytes < 1024) return `${bytes} B`;
    if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
    return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
  };

  // Dragging the center card handlers with requestAnimationFrame
  const handlePointerDown = (e: React.PointerEvent) => {
    e.preventDefault();
    (e.target as HTMLElement).setPointerCapture?.(e.pointerId);
    dragStartRef.current = { x: e.clientX, y: e.clientY };
    setIsPointerDragging(true);
    setDragOffset({ x: 0, y: 0 });
  };

  const handlePointerMove = (e: React.PointerEvent) => {
    if (!isPointerDragging || !dragStartRef.current) return;

    const startX = dragStartRef.current.x;
    const startY = dragStartRef.current.y;
    const currentX = e.clientX;
    const currentY = e.clientY;

    if (rafRef.current) cancelAnimationFrame(rafRef.current);
    rafRef.current = requestAnimationFrame(() => {
      const dx = currentX - startX;
      const dy = currentY - startY;
      setDragOffset({ x: dx, y: dy });

      // Check distance to all segments to find nearest attraction
      let closestId: string | null = null;
      let minDistance = 85; // Attraction threshold in pixels

      for (let i = 0; i < capabilities.length; i++) {
        const coords = segmentCoordsList[i];
        if (coords) {
          const dist = Math.hypot(dx - coords.x, dy - coords.y);
          if (dist < minDistance) {
            minDistance = dist;
            closestId = capabilities[i].id;
          }
        }
      }

      if (closestId !== prevMagnetRef.current) {
        if (closestId && settings.soundEnabled) {
          sounds.playMagnetHover();
        }
        prevMagnetRef.current = closestId;
        setMagnetTargetId(closestId);
      }
    });
  };

  const handlePointerUp = (e: React.PointerEvent) => {
    if (!isPointerDragging) return;
    (e.target as HTMLElement).releasePointerCapture?.(e.pointerId);
    setIsPointerDragging(false);
    dragStartRef.current = null;

    if (magnetTargetId) {
      const targetCap = capabilities.find((c) => c.id === magnetTargetId);
      if (targetCap) {
        // Trigger absorption and auto-conversion!
        setIsAbsorbing(true);
        selectCapability(targetCap);

        if (settings.soundEnabled) {
          sounds.playLaunch();
        }

        try {
          confetti({
            particleCount: 40,
            spread: 55,
            origin: {
              x: e.clientX / window.innerWidth,
              y: e.clientY / window.innerHeight,
            },
            colors: ['#6366f1', '#a855f7', '#ec4899', '#38bdf8'],
          });
        } catch {}

        setTimeout(() => {
          setIsAbsorbing(false);
          setDragOffset(null);
          setMagnetTargetId(null);
          startConversion();
        }, 380);
        return;
      }
    }

    // Spring back to center
    setDragOffset(null);
    setMagnetTargetId(null);
  };

  // Keyboard navigation
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'ArrowRight' || e.key === 'ArrowDown') {
        const idx = capabilities.findIndex((c) => c.id === selectedCapability?.id);
        const nextIdx = (idx + 1) % capabilities.length;
        selectCapability(capabilities[nextIdx]);
      } else if (e.key === 'ArrowLeft' || e.key === 'ArrowUp') {
        const idx = capabilities.findIndex((c) => c.id === selectedCapability?.id);
        const prevIdx = (idx - 1 + capabilities.length) % capabilities.length;
        selectCapability(capabilities[prevIdx]);
      } else if (e.key === 'Enter') {
        startConversion();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [capabilities, selectedCapability, selectCapability, startConversion]);

  return (
    <div
      className="animate-fade-in"
      style={{
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        width: '100%',
        height: '100%',
        position: 'relative',
        padding: '20px',
        userSelect: 'none',
      }}
    >
      {/* Top File Switcher & Clear */}
      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          width: '100%',
          maxWidth: '850px',
          marginBottom: '10px',
          zIndex: 20,
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          {files.length > 1 && (
            <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
              <button
                className="btn btn-ghost"
                style={{ padding: '6px' }}
                disabled={activeFileIndex === 0}
                onClick={() => selectFileIndex(activeFileIndex - 1)}
              >
                <ChevronLeft size={16} />
              </button>
              <span style={{ fontSize: '13px', color: 'var(--text-secondary)' }}>
                File {activeFileIndex + 1} of {files.length}
              </span>
              <button
                className="btn btn-ghost"
                style={{ padding: '6px' }}
                disabled={activeFileIndex === files.length - 1}
                onClick={() => selectFileIndex(activeFileIndex + 1)}
              >
                <ChevronRight size={16} />
              </button>
            </div>
          )}
        </div>

        <button
          className="btn btn-ghost"
          style={{ fontSize: '12px', gap: '4px' }}
          onClick={clearFiles}
        >
          <X size={14} /> Clear / Drop Another
        </button>
      </div>

      {/* Radial Wheel Stage */}
      <div
        ref={stageRef}
        style={{
          position: 'relative',
          width: `${wheelRadius * 2 + 180}px`,
          height: `${wheelRadius * 2 + 180}px`,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
        }}
      >
        {/* Shockwave energy ripple on entrance */}
        <div
          className="animate-shockwave"
          style={{
            position: 'absolute',
            width: '120px',
            height: '120px',
            borderRadius: '50%',
            borderColor: 'rgba(99, 102, 241, 0.7)',
            borderStyle: 'solid',
            pointerEvents: 'none',
          }}
        />

        {/* Counter-rotating Ambient Orbital Rings */}
        <div
          className="animate-spin-slow"
          style={{
            position: 'absolute',
            width: `${wheelRadius * 2}px`,
            height: `${wheelRadius * 2}px`,
            borderRadius: '50%',
            border: '1.5px dashed rgba(99, 102, 241, 0.25)',
            pointerEvents: 'none',
          }}
        />
        <div
          className="animate-spin-reverse"
          style={{
            position: 'absolute',
            width: `${wheelRadius * 2 + 60}px`,
            height: `${wheelRadius * 2 + 60}px`,
            borderRadius: '50%',
            border: '1px solid rgba(168, 85, 247, 0.15)',
            pointerEvents: 'none',
          }}
        />

        {/* SVG Laser / Energy Tether while dragging */}
        {isPointerDragging && dragOffset && (
          <svg
            style={{
              position: 'absolute',
              inset: 0,
              width: '100%',
              height: '100%',
              pointerEvents: 'none',
              zIndex: 35,
              overflow: 'visible',
            }}
          >
            <defs>
              <linearGradient id="laserGrad" x1="0%" y1="0%" x2="100%" y2="100%">
                <stop offset="0%" stopColor="#6366f1" />
                <stop offset="50%" stopColor="#a855f7" />
                <stop offset="100%" stopColor="#ec4899" />
              </linearGradient>
            </defs>

            {/* Glowing outer beam */}
            <line
              x1={(wheelRadius * 2 + 180) / 2}
              y1={(wheelRadius * 2 + 180) / 2}
              x2={(wheelRadius * 2 + 180) / 2 + dragOffset.x}
              y2={(wheelRadius * 2 + 180) / 2 + dragOffset.y}
              stroke="rgba(168, 85, 247, 0.4)"
              strokeWidth="8"
              strokeLinecap="round"
              filter="blur(4px)"
            />

            {/* Core dashed laser beam */}
            <line
              className="animate-laser-dash"
              x1={(wheelRadius * 2 + 180) / 2}
              y1={(wheelRadius * 2 + 180) / 2}
              x2={(wheelRadius * 2 + 180) / 2 + dragOffset.x}
              y2={(wheelRadius * 2 + 180) / 2 + dragOffset.y}
              stroke="url(#laserGrad)"
              strokeWidth="3.5"
              strokeDasharray="8 8"
              strokeLinecap="round"
            />

            {/* Center anchor ring */}
            <circle
              cx={(wheelRadius * 2 + 180) / 2}
              cy={(wheelRadius * 2 + 180) / 2}
              r="8"
              fill="#6366f1"
              stroke="white"
              strokeWidth="2"
            />
          </svg>
        )}

        {/* Radial Format Segments */}
        {capabilities.map((cap, i) => {
          const isSelected = selectedCapability?.id === cap.id;
          const isAttracted = magnetTargetId === cap.id;
          const coords = getSegmentCoords(i);

          return (
            <div
              key={cap.id}
              onClick={() => selectCapability(cap)}
              style={{
                position: 'absolute',
                transform: `translate(${coords.x}px, ${coords.y}px) scale(${
                  isAttracted ? 1.28 : isSelected ? 1.12 : 1
                })`,
                transition: isPointerDragging
                  ? 'transform 0.15s cubic-bezier(0.16, 1, 0.3, 1), box-shadow 0.15s ease'
                  : 'all 0.3s cubic-bezier(0.34, 1.56, 0.64, 1)',
                zIndex: isAttracted ? 50 : isSelected ? 30 : 10,
                cursor: 'pointer',
              }}
            >
              <div
                className={isAttracted ? 'animate-segment-magnet' : ''}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '8px',
                  padding: '10px 16px',
                  borderRadius: 'var(--radius-full)',
                  background: isAttracted
                    ? 'linear-gradient(135deg, #ec4899 0%, #8b5cf6 100%)'
                    : isSelected
                    ? 'var(--accent-gradient)'
                    : 'var(--bg-card)',
                  color: isAttracted || isSelected ? '#ffffff' : 'var(--text-primary)',
                  boxShadow: isAttracted
                    ? '0 0 35px #a855f7, 0 0 70px rgba(168, 85, 247, 0.6)'
                    : isSelected
                    ? '0 6px 24px var(--accent-glow)'
                    : 'var(--shadow-sm)',
                  border: isAttracted
                    ? '2px solid #ffffff'
                    : isSelected
                    ? '1px solid rgba(255, 255, 255, 0.5)'
                    : '1px solid var(--border-subtle)',
                  whiteSpace: 'nowrap',
                  backdropFilter: 'blur(12px)',
                }}
              >
                <span
                  style={{
                    color: isAttracted || isSelected ? '#ffffff' : 'var(--accent-primary)',
                    transform: isAttracted ? 'scale(1.2)' : 'none',
                    transition: 'transform 0.15s ease',
                  }}
                >
                  {getIcon(cap.icon)}
                </span>
                <span style={{ fontSize: '13px', fontWeight: 700 }}>
                  {cap.targetFormat}
                </span>

                {isAttracted ? (
                  <span
                    style={{
                      fontSize: '9px',
                      padding: '2px 8px',
                      borderRadius: '8px',
                      background: '#ffffff',
                      color: '#6b21a8',
                      fontWeight: 800,
                      letterSpacing: '0.04em',
                    }}
                  >
                    ⚡ RELEASE TO CONVERT
                  </span>
                ) : cap.badge ? (
                  <span
                    style={{
                      fontSize: '9px',
                      padding: '2px 6px',
                      borderRadius: '8px',
                      background: isSelected
                        ? 'rgba(255, 255, 255, 0.25)'
                        : 'rgba(99, 102, 241, 0.2)',
                      color: isSelected ? '#ffffff' : '#a5b4fc',
                      fontWeight: 700,
                      textTransform: 'uppercase',
                    }}
                  >
                    {cap.badge}
                  </span>
                ) : null}
              </div>
            </div>
          );
        })}

        {/* Center Ghost Origin Marker while dragging */}
        {isPointerDragging && (
          <div
            style={{
              position: 'absolute',
              width: '210px',
              height: '160px',
              borderRadius: 'var(--radius-lg)',
              border: '2px dashed rgba(99, 102, 241, 0.4)',
              background: 'rgba(99, 102, 241, 0.05)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              pointerEvents: 'none',
              zIndex: 20,
            }}
          >
            <div style={{ fontSize: '11px', color: 'var(--text-muted)', fontWeight: 600 }}>
              Drop onto any format node
            </div>
          </div>
        )}

        {/* Center File Hub Card (Interactive Drag Anchor) */}
        <div
          onPointerDown={handlePointerDown}
          onPointerMove={handlePointerMove}
          onPointerUp={handlePointerUp}
          className={`glass-panel ${!isPointerDragging ? 'animate-float-gentle' : ''} ${
            isAbsorbing ? 'animate-absorb-warp' : ''
          }`}
          style={{
            position: 'relative',
            width: '216px',
            padding: '20px 16px',
            textAlign: 'center',
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            gap: '8px',
            zIndex: 40,
            cursor: isPointerDragging ? 'grabbing' : 'grab',
            touchAction: 'none',
            boxShadow: isPointerDragging
              ? '0 16px 40px rgba(99, 102, 241, 0.5), 0 0 25px rgba(168, 85, 247, 0.5)'
              : 'var(--shadow-lg)',
            border: isPointerDragging
              ? '2px solid rgba(168, 85, 247, 0.9)'
              : '1px solid rgba(255, 255, 255, 0.22)',
            background: isPointerDragging
              ? 'rgba(30, 36, 52, 0.95)'
              : 'rgba(20, 24, 34, 0.88)',
            transform: dragOffset
              ? `translate(${dragOffset.x}px, ${dragOffset.y}px) rotate(${
                  dragOffset.x * 0.05
                }deg) scale(1.08)`
              : 'translate(0px, 0px)',
            transition: isPointerDragging
              ? 'transform 0.04s linear, box-shadow 0.15s ease'
              : 'transform 0.3s cubic-bezier(0.34, 1.56, 0.64, 1)',
          }}
        >
          {/* File Format Icon */}
          <div
            style={{
              width: '48px',
              height: '48px',
              borderRadius: '12px',
              background: 'var(--accent-gradient-subtle)',
              border: '1px solid rgba(99, 102, 241, 0.3)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              color: 'var(--accent-primary)',
            }}
          >
            {currentFile.category === 'image' ? (
              <ImageIcon size={24} />
            ) : currentFile.category === 'pdf' ? (
              <FileText size={24} />
            ) : (
              <Zap size={24} />
            )}
          </div>

          {/* File Name */}
          <div
            style={{
              fontSize: '13px',
              fontWeight: 600,
              maxWidth: '180px',
              overflow: 'hidden',
              textOverflow: 'ellipsis',
              whiteSpace: 'nowrap',
            }}
            title={currentFile.name}
          >
            {currentFile.name}
          </div>

          {/* Badges */}
          <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
            <span className="badge badge-primary">{currentFile.extension.toUpperCase()}</span>
            <span style={{ fontSize: '11px', color: 'var(--text-muted)' }}>
              {formatSize(currentFile.size)}
            </span>
          </div>

          {currentFile.dimensions && (
            <div style={{ fontSize: '11px', color: 'var(--text-secondary)' }}>
              {currentFile.dimensions.width} × {currentFile.dimensions.height} px
            </div>
          )}

          {currentFile.pageCount && (
            <div style={{ fontSize: '11px', color: 'var(--text-secondary)' }}>
              {currentFile.pageCount} {currentFile.pageCount === 1 ? 'Page' : 'Pages'}
            </div>
          )}

          {/* Interactive Drag Hint Pill */}
          <div
            className="animate-bounce-hint"
            style={{
              marginTop: '4px',
              padding: '4px 10px',
              borderRadius: 'var(--radius-full)',
              background: isPointerDragging
                ? 'var(--accent-gradient)'
                : 'rgba(99, 102, 241, 0.16)',
              border: '1px solid rgba(99, 102, 241, 0.35)',
              color: isPointerDragging ? '#ffffff' : '#a5b4fc',
              fontSize: '10px',
              fontWeight: 700,
              display: 'flex',
              alignItems: 'center',
              gap: '4px',
              letterSpacing: '0.02em',
            }}
          >
            <Move size={11} />
            <span>{isPointerDragging ? 'Drop on any format node' : 'Drag to format to convert'}</span>
          </div>
        </div>
      </div>

      {/* Selected Action Details & Conversion Controls */}
      {selectedCapability && (
        <div
          className="glass-panel animate-scale-in"
          style={{
            width: '100%',
            maxWidth: '680px',
            marginTop: '16px',
            padding: '16px 24px',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            gap: '24px',
            zIndex: 35,
          }}
        >
          <div style={{ flex: 1 }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '4px' }}>
              <span style={{ fontWeight: 600, fontSize: '15px' }}>
                {selectedCapability.label}
              </span>
              <span className="badge badge-primary">{selectedCapability.targetFormat}</span>
            </div>
            <p style={{ fontSize: '12px', color: 'var(--text-secondary)', margin: 0 }}>
              {selectedCapability.description}
            </p>

            {/* In-line option inputs if any */}
            {selectedCapability.options && selectedCapability.options.length > 0 && (
              <div style={{ marginTop: '12px', display: 'flex', gap: '16px', flexWrap: 'wrap' }}>
                {selectedCapability.options.map((opt) => (
                  <div key={opt.id} style={{ display: 'flex', flexDirection: 'column', gap: '4px', minWidth: '140px' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '11px', color: 'var(--text-muted)' }}>
                      <span>{opt.label}</span>
                      {opt.type === 'slider' && (
                        <span>{options[opt.id] ?? opt.defaultValue}{opt.unit}</span>
                      )}
                    </div>
                    {opt.type === 'slider' && (
                      <input
                        type="range"
                        min={opt.min ?? 10}
                        max={opt.max ?? 100}
                        step={opt.step ?? 5}
                        value={options[opt.id] ?? opt.defaultValue}
                        onChange={(e) => setOption(opt.id, Number(e.target.value))}
                      />
                    )}
                    {opt.type === 'toggle' && (
                      <label style={{ display: 'flex', alignItems: 'center', gap: '8px', fontSize: '12px', cursor: 'pointer' }}>
                        <input
                          type="checkbox"
                          checked={Boolean(options[opt.id] ?? opt.defaultValue)}
                          onChange={(e) => setOption(opt.id, e.target.checked)}
                        />
                        <span>Enable {opt.label}</span>
                      </label>
                    )}
                    {opt.type === 'select' && (
                      <select
                        className="input-field"
                        style={{ padding: '4px 8px', fontSize: '12px' }}
                        value={options[opt.id] ?? opt.defaultValue}
                        onChange={(e) => setOption(opt.id, e.target.value)}
                      >
                        {opt.options?.map((o) => (
                          <option key={o.value} value={o.value}>
                            {o.label}
                          </option>
                        ))}
                      </select>
                    )}
                    {opt.type === 'text' && (
                      <input
                        type="text"
                        className="input-field"
                        style={{ padding: '4px 8px', fontSize: '12px' }}
                        value={options[opt.id] ?? opt.defaultValue}
                        onChange={(e) => setOption(opt.id, e.target.value)}
                        placeholder={opt.description || opt.label}
                      />
                    )}
                  </div>
                ))}
              </div>
            )}
          </div>

          <button
            type="button"
            className="btn btn-primary"
            style={{
              padding: '12px 28px',
              fontSize: '14px',
              fontWeight: 600,
              borderRadius: 'var(--radius-full)',
              flexShrink: 0,
            }}
            onClick={startConversion}
          >
            <span>Convert Now</span>
            <ArrowRight size={16} />
          </button>
        </div>
      )}
    </div>
  );
};
