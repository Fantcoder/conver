import React from 'react';
import { XCircle } from 'lucide-react';
import { useConversionStore } from '../../stores/conversion-store';

export const ConversionProgress: React.FC = () => {
  const { activeJob, cancelConversion } = useConversionStore();
  if (!activeJob) return null;

  const pct = Math.max(5, Math.min(100, activeJob.progress || 0));

  return (
    <div
      className="animate-fade-in"
      style={{
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        width: '100%',
        maxWidth: '520px',
        margin: '0 auto',
        padding: '50px 30px',
        background: 'var(--bg-card)',
        borderRadius: 'var(--radius-xl)',
        border: '1px solid var(--border-medium)',
        boxShadow: 'var(--shadow-lg)',
        textAlign: 'center',
      }}
    >
      {/* Circular Progress Ring */}
      <div
        style={{
          position: 'relative',
          width: '120px',
          height: '120px',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          marginBottom: '24px',
        }}
      >
        <svg
          style={{ width: '100%', height: '100%', transform: 'rotate(-90deg)' }}
        >
          <circle
            cx="60"
            cy="60"
            r="50"
            stroke="rgba(255, 255, 255, 0.08)"
            strokeWidth="8"
            fill="transparent"
          />
          <circle
            cx="60"
            cy="60"
            r="50"
            stroke="url(#accentGrad)"
            strokeWidth="8"
            strokeDasharray={2 * Math.PI * 50}
            strokeDashoffset={2 * Math.PI * 50 * (1 - pct / 100)}
            strokeLinecap="round"
            fill="transparent"
            style={{ transition: 'stroke-dashoffset 0.3s ease' }}
          />
          <defs>
            <linearGradient id="accentGrad" x1="0%" y1="0%" x2="100%" y2="100%">
              <stop offset="0%" stopColor="#6366f1" />
              <stop offset="50%" stopColor="#a855f7" />
              <stop offset="100%" stopColor="#ec4899" />
            </linearGradient>
          </defs>
        </svg>

        <div
          style={{ position: 'absolute', fontSize: '20px', fontWeight: 700 }}
        >
          {pct}%
        </div>
      </div>

      <h3 style={{ fontSize: '18px', fontWeight: 600, marginBottom: '6px' }}>
        Converting to {activeJob.targetFormat}
      </h3>
      <p
        style={{
          fontSize: '13px',
          color: 'var(--text-secondary)',
          marginBottom: '24px',
        }}
      >
        {activeJob.stage || 'Processing conversion operations...'}
      </p>

      <button
        type="button"
        className="btn btn-secondary"
        style={{ fontSize: '13px', gap: '6px' }}
        onClick={cancelConversion}
      >
        <XCircle size={15} />
        Cancel Conversion
      </button>
    </div>
  );
};
