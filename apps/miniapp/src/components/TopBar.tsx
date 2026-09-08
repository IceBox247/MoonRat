import { useNavigate } from 'react-router-dom';
import { useStore } from '../lib/store';
import { formatNumber } from '../lib/format';
import { haptic } from '../lib/telegram';

export default function TopBar() {
  const { user, meta } = useStore();
  const navigate = useNavigate();
  const symbol = meta?.token.symbol ?? 'MOONRAT';

  return (
    <div className="topbar">
      <div className="topbar-brand" onClick={() => { haptic(); navigate('/'); }}>
        <img src="/assets/moonrat-badge.png" alt="Moonrat" className="topbar-logo" />
        <span className="topbar-wordmark gold-text">MOONRAT</span>
      </div>

      <div className="topbar-right">
        <div className="balance-chip" onClick={() => { haptic(); navigate('/vault'); }}>
          <img src="/assets/moonrat-coin.png" alt="" width={20} height={20} />
          <span className="mono">{formatNumber(user?.moonratBalance ?? 0)}</span>
          <span className="sym">{symbol}</span>
        </div>
        <div className="avatar" onClick={() => { haptic(); navigate('/profile'); }}>
          {user?.photoUrl ? (
            <img src={user.photoUrl} alt="" />
          ) : (
            <span>{(user?.firstName ?? 'M')[0]}</span>
          )}
        </div>
      </div>
    </div>
  );
}
