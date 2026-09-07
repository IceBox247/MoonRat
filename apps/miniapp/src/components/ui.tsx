import type { ReactNode } from 'react';
import './ui.css';

export function SectionHeader({ eyebrow, title, right }: { eyebrow?: string; title: string; right?: ReactNode }) {
  return (
    <div className="section-header">
      <div>
        {eyebrow && <div className="eyebrow">{eyebrow}</div>}
        <h2 className="section-title">{title}</h2>
      </div>
      {right}
    </div>
  );
}

export function Panel({ children, className = '', glow = false, style }: { children: ReactNode; className?: string; glow?: boolean; style?: React.CSSProperties }) {
  return (
    <div className={`panel ${glow ? 'panel-glow' : ''} ${className}`} style={style}>
      {children}
    </div>
  );
}

export function ProgressBar({ value, tone = 'cyan', height = 10 }: { value: number; tone?: 'cyan' | 'gold' | 'green'; height?: number }) {
  const pct = Math.max(0, Math.min(1, value)) * 100;
  return (
    <div className="progress-track" style={{ height }}>
      <div className={`progress-fill tone-${tone}`} style={{ width: `${pct}%` }} />
    </div>
  );
}

export function StatTile({ label, value, sub, icon, tone = 'default' }: { label: string; value: ReactNode; sub?: string; icon?: ReactNode; tone?: 'default' | 'gold' | 'cyan' }) {
  return (
    <div className={`stat-tile tone-${tone}`}>
      {icon && <div className="stat-icon">{icon}</div>}
      <div className="stat-body">
        <div className="stat-label">{label}</div>
        <div className="stat-value mono">{value}</div>
        {sub && <div className="stat-sub">{sub}</div>}
      </div>
    </div>
  );
}

export function Pill({ children, tone = 'cyan' }: { children: ReactNode; tone?: 'cyan' | 'gold' | 'green' | 'muted' }) {
  return <span className={`pill pill-${tone}`}>{children}</span>;
}

export function GlowButton({
  children,
  onClick,
  variant = 'primary',
  disabled = false,
  full = false,
}: {
  children: ReactNode;
  onClick?: () => void;
  variant?: 'primary' | 'gold' | 'ghost';
  disabled?: boolean;
  full?: boolean;
}) {
  return (
    <button
      className={`glow-btn glow-${variant}${full ? ' full' : ''}`}
      onClick={onClick}
      disabled={disabled}
    >
      {children}
    </button>
  );
}

export function EmptyState({ icon = '⛏️', title, sub }: { icon?: string; title: string; sub?: string }) {
  return (
    <div className="empty-state">
      <div className="empty-icon">{icon}</div>
      <div className="empty-title">{title}</div>
      {sub && <div className="empty-sub">{sub}</div>}
    </div>
  );
}
