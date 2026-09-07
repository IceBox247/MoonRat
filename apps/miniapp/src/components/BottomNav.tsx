import { NavLink } from 'react-router-dom';
import { haptic } from '../lib/telegram';
import './BottomNav.css';

const items = [
  { to: '/', label: 'Mine', icon: PickIcon },
  { to: '/expedition', label: 'Expedition', icon: MapIcon },
  { to: '/crew', label: 'Crew', icon: CrewIcon },
  { to: '/vault', label: 'Vault', icon: VaultIcon },
  { to: '/profile', label: 'Profile', icon: RatIcon },
];

export default function BottomNav() {
  return (
    <nav className="bottom-nav">
      <div className="bottom-nav-inner">
        {items.map(({ to, label, icon: Icon }) => (
          <NavLink
            key={to}
            to={to}
            end={to === '/'}
            onClick={() => haptic('light')}
            className={({ isActive }) => `nav-item${isActive ? ' active' : ''}`}
          >
            <span className="nav-icon">
              <Icon />
            </span>
            <span className="nav-label">{label}</span>
          </NavLink>
        ))}
      </div>
    </nav>
  );
}

function PickIcon() {
  return (
    <svg viewBox="0 0 24 24" width="22" height="22" fill="none" stroke="currentColor" strokeWidth="2">
      <path d="M3 21l7-7" strokeLinecap="round" />
      <path d="M4 8c4-4 12-4 16 0" strokeLinecap="round" />
      <path d="M12 12l-2-2" strokeLinecap="round" />
    </svg>
  );
}
function MapIcon() {
  return (
    <svg viewBox="0 0 24 24" width="22" height="22" fill="none" stroke="currentColor" strokeWidth="2">
      <path d="M9 4L3 6v14l6-2 6 2 6-2V4l-6 2-6-2z" strokeLinejoin="round" />
      <path d="M9 4v14M15 6v14" />
    </svg>
  );
}
function CrewIcon() {
  return (
    <svg viewBox="0 0 24 24" width="22" height="22" fill="none" stroke="currentColor" strokeWidth="2">
      <circle cx="9" cy="8" r="3" />
      <path d="M3 20c0-3.3 2.7-6 6-6s6 2.7 6 6" strokeLinecap="round" />
      <path d="M16 11a3 3 0 100-6M21 20c0-2.5-1.5-4.6-3.6-5.5" strokeLinecap="round" />
    </svg>
  );
}
function VaultIcon() {
  return (
    <svg viewBox="0 0 24 24" width="22" height="22" fill="none" stroke="currentColor" strokeWidth="2">
      <rect x="3" y="5" width="18" height="14" rx="2" />
      <circle cx="12" cy="12" r="3" />
      <path d="M12 9v-1M12 16v-1M15 12h1M8 12h1" strokeLinecap="round" />
    </svg>
  );
}
function RatIcon() {
  return (
    <svg viewBox="0 0 24 24" width="22" height="22" fill="none" stroke="currentColor" strokeWidth="2">
      <circle cx="12" cy="13" r="6" />
      <circle cx="7" cy="6" r="2.2" />
      <circle cx="17" cy="6" r="2.2" />
      <path d="M12 13v2M10.5 12h.01M13.5 12h.01" strokeLinecap="round" />
    </svg>
  );
}
