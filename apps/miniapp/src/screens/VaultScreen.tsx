import TopBar from '../components/TopBar';
import '../components/TopBar.css';
import { Panel, SectionHeader, StatTile, EmptyState } from '../components/ui';
import { useFetch } from '../hooks/useFetch';
import { api } from '../lib/api';
import { formatNumber, formatFull, timeAgo } from '../lib/format';
import './VaultScreen.css';

const TXN_META: Record<string, { icon: string; label: string }> = {
  mining_claim: { icon: '⛏️', label: 'Mining claim' },
  referral_reward: { icon: '🤝', label: 'Crew reward' },
  mission_reward: { icon: '🎯', label: 'Mission reward' },
  withdrawal: { icon: '↗️', label: 'Withdrawal' },
  adjustment: { icon: '⚙️', label: 'Adjustment' },
};

export default function VaultScreen() {
  const { data } = useFetch(() => api.vault(), []);

  return (
    <div className="fade-enter">
      <TopBar />

      <div className="vault-hero panel">
        <img src="/assets/moonrat-coin.png" alt="" className="vault-coin" />
        <div className="eyebrow">Vault Balance</div>
        <div className="vault-balance gold-text mono">{formatNumber(data?.vaultBalance ?? 0)}</div>
        <div className="vault-sym">$MOONRAT</div>
      </div>

      <div className="grid-2" style={{ marginTop: 12 }}>
        <StatTile tone="cyan" icon={<span>💎</span>} label="Mined total" value={formatNumber(data?.minedTotal ?? 0)} />
        <StatTile tone="gold" icon={<span>✅</span>} label="Claimed total" value={formatNumber(data?.claimedTotal ?? 0)} />
      </div>

      <div className="vault-note">
        Claimed rewards are credited to your in-app Vault. On-chain withdrawal opens once the
        $MOONRAT reward reserve goes live.
      </div>

      <SectionHeader eyebrow="Ledger" title="History" />
      {data?.transactions?.length ? (
        <div className="stack">
          {data.transactions.map((t: any) => {
            const meta = TXN_META[t.type] ?? { icon: '•', label: t.type };
            const positive = t.amount >= 0;
            return (
              <div key={t.id} className="txn-row panel">
                <div className="txn-icon">{meta.icon}</div>
                <div className="txn-info">
                  <div className="txn-label">{meta.label}</div>
                  <div className="txn-time">{timeAgo(t.createdAt)}</div>
                </div>
                <div className={`txn-amount mono ${positive ? 'pos' : 'neg'}`}>
                  {positive ? '+' : ''}
                  {formatFull(t.amount, 2)}
                </div>
              </div>
            );
          })}
        </div>
      ) : (
        <Panel>
          <EmptyState icon="🗄️" title="Vault is empty" sub="Start mining and claim rewards to fill your vault." />
        </Panel>
      )}
    </div>
  );
}
