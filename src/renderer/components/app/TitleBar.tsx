import React, { useEffect, useState } from 'react';
import { Minus, Square, X, Sparkles, Layers } from 'lucide-react';

export const TitleBar: React.FC = () => {
  const [isMax, setIsMax] = useState(false);

  useEffect(() => {
    const checkMax = async () => {
      if (window.convertFlow) {
        const max = await window.convertFlow.isMaximized();
        setIsMax(max);
      }
    };
    checkMax();
  }, []);

  const handleMinimize = () => window.convertFlow?.minimizeWindow();
  const handleMaximize = async () => {
    if (window.convertFlow) {
      await window.convertFlow.maximizeWindow();
      const max = await window.convertFlow.isMaximized();
      setIsMax(max);
    }
  };
  const handleClose = () => window.convertFlow?.closeWindow();

  return (
    <header className="app-titlebar">
      <div
        className="flex items-center gap-2 no-drag"
        style={{ display: 'flex', alignItems: 'center', gap: '8px' }}
      >
        <div
          style={{
            width: '24px',
            height: '24px',
            borderRadius: '6px',
            background: 'var(--accent-gradient)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            color: 'white',
            boxShadow: '0 2px 6px var(--accent-glow)',
          }}
        >
          <Sparkles size={14} />
        </div>
        <span
          style={{
            fontWeight: 600,
            fontSize: '13px',
            letterSpacing: '-0.01em',
          }}
        >
          ConvertFlow
        </span>
        <span
          className="badge badge-primary"
          style={{ fontSize: '10px', padding: '1px 6px', opacity: 0.85 }}
        >
          Studio Pro
        </span>
      </div>

      <div style={{ fontSize: '12px', color: 'var(--text-muted)' }}>
        Universal File & PDF Engine
      </div>

      {/* Window Controls */}
      <div
        className="no-drag"
        style={{ display: 'flex', alignItems: 'center', gap: '4px' }}
      >
        <button
          onClick={handleMinimize}
          className="btn-ghost"
          style={{
            width: '30px',
            height: '26px',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            borderRadius: '4px',
            border: 'none',
            cursor: 'pointer',
          }}
          title="Minimize"
        >
          <Minus size={13} />
        </button>
        <button
          onClick={handleMaximize}
          className="btn-ghost"
          style={{
            width: '30px',
            height: '26px',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            borderRadius: '4px',
            border: 'none',
            cursor: 'pointer',
          }}
          title={isMax ? 'Restore' : 'Maximize'}
        >
          {isMax ? <Layers size={13} /> : <Square size={12} />}
        </button>
        <button
          onClick={handleClose}
          className="btn-ghost"
          style={{
            width: '30px',
            height: '26px',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            borderRadius: '4px',
            border: 'none',
            cursor: 'pointer',
            transition: 'background 0.15s ease, color 0.15s ease',
          }}
          onMouseEnter={(e) => {
            e.currentTarget.style.background = '#ef4444';
            e.currentTarget.style.color = '#ffffff';
          }}
          onMouseLeave={(e) => {
            e.currentTarget.style.background = 'transparent';
            e.currentTarget.style.color = 'var(--text-secondary)';
          }}
          title="Close"
        >
          <X size={14} />
        </button>
      </div>
    </header>
  );
};
