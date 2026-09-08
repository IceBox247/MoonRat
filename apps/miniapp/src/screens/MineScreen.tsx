import { useTonConnectUI } from '@tonconnect/ui-react';
import { useNavigate } from 'react-router-dom';
import TopBar from '../components/TopBar';
import '../components/TopBar.css';
import MoonratStage from '../components/MoonratStage';
import { Panel, ProgressBar, GlowButton, StatTile } from '../components/ui';
import { useMining } from '../hooks/useMining';
import { useStore } from '../lib/store';
import { formatNumber } from '../lib/format';
import { haptic, haptifySuccess, openExternal } from '../lib/telegram';
import './MineScreen.css';

export default function MineScreen() {
  const { state, displayPending, busy, start, stop, claim } = useMining();
  const { reloadUser } = useStore();
  const [tonConnectUI] = useTonConnectUI();
  const navigate = useNavigate();

  const onClaim = async () => {
    if (!state || state.pending <= 0) return;
    haptic('medium');
    const amount = await claim();
    if (amount > 0) haptifySuccess();
    await reloadUser();
  };

  const onToggleMining = async () => {
    if (!state) return;
    haptic('medium');
    if (state.mining) await stop();
    else await start();
  };

  const onIncreasePower = async () => {
    haptic('medium');
    if (!state?.walletConnected) {
      await tonConnectUI.openModal();
      return;
    }
    openExternal(state.buyUrl);
  };

  const onConnect = async () => {
    haptic();
    await tonConnectUI.openModal();
  };

  // Tapping the coin: start mining when idle, claim when active with pending.
  const onCoinTap = () => {
    if (!state || busy) return;
    if (state.mining) {
      if (state.pending > 0) onClaim();
    } else {
      onToggleMining();
    }
  };

  if (!state) {
    return (
      <>
        <TopBar />
        <div className="skeleton-stage" />
      </>
    );
  }

  return (
    <div className="fade-enter">
      <TopBar />

      {/* Level + expedition strip */}
      <div className="mine-topstrip">
        <div className="level-badge" onClick={() => navigate('/profile')}>
          <span className="lvl-icon">{state.level?.icon ?? '⛏️'}</span>
          <div>
            <div className="lvl-name">{state.level?.name ?? 'Rookie Miner'}</div>
            <div className="lvl-sub">Miner Level {state.level?.order ?? 1}</div>
          </div>
        </div>
        <div className="expo-mini" onClick={() => navigate('/expedition')}>
          <span className="eyebrow">Expedition</span>
          <span className="expo-mini-val cyan-text">Chapter 2 ▸</span>
        </div>
      </div>

      <MoonratStage mining={state.mining} onTap={onCoinTap} />

      {/* Live earnings display */}
      <Panel glow className="earn-panel">
        <div className="earn-label eyebrow">Unclaimed $MOONRAT</div>
        <div className="earn-value mono gold-text">{displayPending.toFixed(4)}</div>
        <div className="earn-rate">
          {state.mining ? (
            <span className="cyan-text">+{formatNumber(state.ratePerHour)} / hr</span>
          ) : (
            <span className="muted">Mining paused — tap Start to dig</span>
          )}
        </div>
        <div className="earn-actions">
          <GlowButton variant={state.mining ? 'ghost' : 'primary'} onClick={onToggleMining} disabled={busy}>
            {state.mining ? '⏸ Pause' : '⛏ Start Mining'}
          </GlowButton>
          <GlowButton variant="gold" onClick={onClaim} disabled={busy || state.pending <= 0}>
            Claim
          </GlowButton>
        </div>
      </Panel>

      {/* Hashrate / power */}
      <div className="grid-2" style={{ marginTop: 12 }}>
        <StatTile
          tone="cyan"
          icon={<span>⚡</span>}
          label="Hash Rate"
          value={formatNumber(state.hashRate)}
          sub="Mining Power"
        />
        <StatTile
          tone="gold"
          icon={<span>💎</span>}
          label="Mined (total)"
          value={formatNumber(state.minedTotal)}
          sub="lifetime"
        />
      </div>

      {/* Wallet / hold-more mechanic */}
      {!state.walletConnected ? (
        <Panel className="hold-panel" style={{ marginTop: 12 }}>
          <div className="hold-title">Connect a TON wallet</div>
          <p className="hold-desc">
            Your Mining Power is set by how much <b>$MOONRAT</b> you hold on-chain. Connect to
            reveal your Hash Rate.
          </p>
          <GlowButton variant="primary" full onClick={onConnect}>
            Connect Wallet
          </GlowButton>
        </Panel>
      ) : (
        <Panel className="hold-panel" style={{ marginTop: 12 }}>
          <div className="hold-row">
            <div>
              <div className="hold-title">Increase Mining Power</div>
              <p className="hold-desc">
                Hold more <b>$MOONRAT</b> → higher Hash Rate. It updates automatically after you buy.
              </p>
            </div>
          </div>
          <GlowButton variant="gold" full onClick={onIncreasePower}>
            ↑ Increase Mining Power
          </GlowButton>
        </Panel>
      )}

      {/* Level progress */}
      <Panel style={{ marginTop: 12, padding: 16 }}>
        <div className="row" style={{ justifyContent: 'space-between', marginBottom: 8 }}>
          <span className="eyebrow">Next Level</span>
          <span className="cyan-text" style={{ fontWeight: 700, fontSize: 13 }}>
            {state.nextLevel ? `${state.nextLevel.icon} ${state.nextLevel.name}` : 'Max level 🌙'}
          </span>
        </div>
        <ProgressBar value={state.nextLevel ? state.levelProgress : 1} tone="cyan" />
        <div className="hold-desc" style={{ marginTop: 8 }}>
          {state.nextLevel
            ? `Reach ${formatNumber(state.nextLevel.minHashRate)} hash rate to rank up.`
            : 'You have reached the top of the mine.'}
        </div>
      </Panel>

      <div className="mine-footnote">Offline earnings cap: {state.sessionMaxHours}h · MINE • HOLD • EXPLORE</div>
    </div>
  );
}
