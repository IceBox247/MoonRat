import { useTonConnectUI, useTonWallet } from '@tonconnect/ui-react';
import TopBar from '../components/TopBar';
import '../components/TopBar.css';
import { Panel, SectionHeader, GlowButton, StatTile, Pill } from '../components/ui';
import { useStore } from '../lib/store';
import { formatNumber, shortAddress } from '../lib/format';
import { haptic } from '../lib/telegram';
import './ProfileScreen.css';

export default function ProfileScreen() {
  const { user, meta } = useStore();
  const [tonConnectUI] = useTonConnectUI();
  const wallet = useTonWallet();

  const currentOrder = user?.level?.order ?? 1;

  const onWallet = async () => {
    haptic();
    if (wallet) await tonConnectUI.disconnect();
    else await tonConnectUI.openModal();
  };

  return (
    <div className="fade-enter">
      <TopBar />

      {/* Identity card */}
      <Panel glow className="profile-card">
        <div className="profile-head">
          <div className="profile-avatar">
            {user?.photoUrl ? <img src={user.photoUrl} alt="" /> : <span>{(user?.firstName ?? 'M')[0]}</span>}
          </div>
          <div>
            <div className="profile-name">{user?.firstName ?? 'Miner'}</div>
            <div className="profile-username">@{user?.username ?? 'moonrat'}</div>
            <div style={{ marginTop: 6 }}>
              <Pill tone="gold">
                {user?.level?.icon} {user?.level?.name ?? 'Rookie Miner'}
              </Pill>
            </div>
          </div>
        </div>
      </Panel>

      {/* Wallet */}
      <Panel className="wallet-card" style={{ marginTop: 12 }}>
        <div className="row" style={{ justifyContent: 'space-between' }}>
          <div className="eyebrow">TON Wallet</div>
          {wallet ? <Pill tone="green">Connected</Pill> : <Pill tone="muted">Not connected</Pill>}
        </div>
        {wallet ? (
          <div className="wallet-addr mono">{shortAddress(wallet.account.address)}</div>
        ) : (
          <p className="wallet-hint">Connect to sync your on-chain $MOONRAT and Mining Power.</p>
        )}
        <GlowButton variant={wallet ? 'ghost' : 'primary'} full onClick={onWallet}>
          {wallet ? 'Disconnect' : 'Connect Wallet'}
        </GlowButton>
      </Panel>

      {/* Stats */}
      <SectionHeader eyebrow="Stats" title="Your Numbers" />
      <div className="grid-2">
        <StatTile tone="cyan" icon={<span>⚡</span>} label="Hash Rate" value={formatNumber(user?.hashRate ?? 0)} />
        <StatTile tone="gold" icon={<span>💰</span>} label="Balance" value={formatNumber(user?.moonratBalance ?? 0)} />
        <StatTile icon={<span>💎</span>} label="Mined" value={formatNumber(user?.minedTotal ?? 0)} />
        <StatTile icon={<span>🤝</span>} label="Crew" value={formatNumber(user?.referralCount ?? 0)} />
      </div>

      {/* Level ladder */}
      <SectionHeader eyebrow="Progression" title="Miner Levels" />
      <div className="stack">
        {meta?.levels?.map((l: any) => {
          const reached = l.order <= currentOrder;
          const current = l.order === currentOrder;
          return (
            <div key={l.key} className={`ladder-row ${reached ? 'reached' : ''} ${current ? 'current' : ''}`}>
              <div className="ladder-icon">{l.icon}</div>
              <div className="ladder-info">
                <div className="ladder-name">{l.name}</div>
                <div className="ladder-req">{formatNumber(l.minHashRate)} hash rate</div>
              </div>
              {current ? (
                <Pill tone="cyan">You</Pill>
              ) : reached ? (
                <span className="ladder-check">✓</span>
              ) : (
                <span className="ladder-lock">🔒</span>
              )}
            </div>
          );
        })}
      </div>

      <div className="profile-foot">
        <div>Token: {meta?.token.name} (${meta?.token.symbol})</div>
        <div>Balance source: {meta?.token.provider === 'mock' ? 'demo (mock)' : 'on-chain'}</div>
      </div>
    </div>
  );
}
