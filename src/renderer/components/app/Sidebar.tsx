import React from 'react';
import {
  Sparkles,
  FileText,
  Layers,
  History,
  Settings,
  ShieldCheck,
} from 'lucide-react';
import { NavigationTab, useUiStore } from '../../stores/ui-store';
import { useConversionStore } from '../../stores/conversion-store';

export const Sidebar: React.FC = () => {
  const { activeTab, setActiveTab } = useUiStore();
  const { files } = useConversionStore();

  const navItems: {
    id: NavigationTab;
    label: string;
    icon: React.ReactNode;
    badge?: string;
  }[] = [
    {
      id: 'convert',
      label: 'Convert Studio',
      icon: <Sparkles size={18} />,
      badge: files.length > 0 ? `${files.length}` : undefined,
    },
    {
      id: 'pdf',
      label: 'PDF Toolkit',
      icon: <FileText size={18} />,
    },
    {
      id: 'batch',
      label: 'Batch Queue',
      icon: <Layers size={18} />,
      badge: files.length > 1 ? `${files.length}` : undefined,
    },
    {
      id: 'history',
      label: 'History',
      icon: <History size={18} />,
    },
    {
      id: 'settings',
      label: 'Settings',
      icon: <Settings size={18} />,
    },
  ];

  return (
    <aside
      style={{
        width: 'var(--sidebar-width)',
        height: '100%',
        background: 'var(--bg-sidebar)',
        borderRight: '1px solid var(--border-subtle)',
        display: 'flex',
        flexDirection: 'column',
        justifyContent: 'space-between',
        padding: '16px 12px',
        backdropFilter: 'blur(20px)',
        zIndex: 10,
      }}
    >
      <div>
        {/* Nav Header */}
        <div
          style={{
            padding: '4px 12px 16px',
            fontSize: '11px',
            fontWeight: 600,
            color: 'var(--text-muted)',
            textTransform: 'uppercase',
            letterSpacing: '0.06em',
          }}
        >
          Workspaces
        </div>

        {/* Nav Buttons */}
        <nav style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
          {navItems.map((item) => {
            const isActive = activeTab === item.id;
            return (
              <button
                key={item.id}
                onClick={() => setActiveTab(item.id)}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                  width: '100%',
                  padding: '10px 12px',
                  borderRadius: 'var(--radius-sm)',
                  border: 'none',
                  background: isActive
                    ? 'var(--accent-gradient-subtle)'
                    : 'transparent',
                  color: isActive
                    ? 'var(--text-primary)'
                    : 'var(--text-secondary)',
                  fontWeight: isActive ? 600 : 500,
                  fontSize: '13px',
                  cursor: 'pointer',
                  transition: 'all 0.15s ease',
                  textAlign: 'left',
                  borderLeft: isActive
                    ? '3px solid var(--accent-primary)'
                    : '3px solid transparent',
                }}
                onMouseEnter={(e) => {
                  if (!isActive) {
                    e.currentTarget.style.background =
                      'rgba(255, 255, 255, 0.05)';
                    e.currentTarget.style.color = 'var(--text-primary)';
                  }
                }}
                onMouseLeave={(e) => {
                  if (!isActive) {
                    e.currentTarget.style.background = 'transparent';
                    e.currentTarget.style.color = 'var(--text-secondary)';
                  }
                }}
              >
                <div
                  style={{ display: 'flex', alignItems: 'center', gap: '10px' }}
                >
                  <span
                    style={{
                      color: isActive ? 'var(--accent-primary)' : 'inherit',
                    }}
                  >
                    {item.icon}
                  </span>
                  <span>{item.label}</span>
                </div>

                {item.badge && (
                  <span
                    className="badge badge-primary"
                    style={{
                      fontSize: '10px',
                      padding: '1px 6px',
                      borderRadius: '10px',
                    }}
                  >
                    {item.badge}
                  </span>
                )}
              </button>
            );
          })}
        </nav>
      </div>

      {/* Sidebar Footer Info */}
      <div
        style={{
          display: 'flex',
          flexDirection: 'column',
          gap: '10px',
          padding: '12px',
          background: 'rgba(255, 255, 255, 0.03)',
          borderRadius: 'var(--radius-md)',
          border: '1px solid var(--border-subtle)',
        }}
      >
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: '8px',
            fontSize: '12px',
            color: 'var(--text-secondary)',
          }}
        >
          <ShieldCheck size={16} color="var(--color-success)" />
          <span style={{ fontWeight: 500 }}>100% Offline Processing</span>
        </div>
        <div
          style={{
            fontSize: '11px',
            color: 'var(--text-muted)',
            lineHeight: '1.4',
          }}
        >
          All files are processed locally on your PC. No clouds, no telemetry,
          total privacy.
        </div>
      </div>
    </aside>
  );
};
