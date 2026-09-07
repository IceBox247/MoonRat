import { useState } from 'react';
import TopBar from '../components/TopBar';
import '../components/TopBar.css';
import { Panel, SectionHeader, GlowButton, StatTile, EmptyState } from '../components/ui';
import { useFetch } from '../hooks/useFetch';
import { api } from '../lib/api';
import { formatNumber, timeAgo } from '../lib/format';
import { haptic, tg } from '../lib/telegram';
import './CrewScreen.css';

export default function CrewScreen() {
  const { data } = useFetch(() => api.crew(), []);
  const [copied, setCopied] = useState(false);

  const invite = data?.inviteLink ?? '';

  const copy = async () => {
    haptic();
    try {
      await navigator.clipboard.writeText(invite);
      setCopied(true);
      setTimeout(() => setCopied(false), 1600);
    } catch {
      /* ignore */
    }
  };

  const share = () => {
    haptic('medium');
    const text = encodeURIComponent(
      'Join my Moonrat mining crew! Hold $MOONRAT, boost your hash rate, and dig toward the vault. ⛏️🌙'
    );
    const url = `https://t.me/share/url?url=${encodeURIComponent(invite)}&text=${text}`;
    const w = tg();
    if (w) w.openTelegramLink(url);
    else window.open(url, '_blank');
  };

  return (
    <div className="fade-enter">
      <TopBar />

      <div className="crew-hero panel">
        <div className="eyebrow">Your Mining Crew</div>
        <div className="crew-count gold-text mono">{data?.totalReferrals ?? 0}</div>
        <div className="crew-count-label">crew members recruited</div>

        <div className="grid-2" style={{ marginTop: 14 }}>
          <StatTile tone="cyan" icon={<span>🟢</span>} label="Active miners" value={formatNumber(data?.activeMiners ?? 0)} />
          <StatTile tone="gold" icon={<span>🎁</span>} label="Crew rewards" value={formatNumber(data?.referralRewards ?? 0)} />
        </div>
      </div>

      <Panel className="invite-panel" glow>
        <div className="eyebrow">Your invite code</div>
        <div className="invite-code mono">{data?.referralCode ?? '—'}</div>
        <p className="invite-desc">
          Earn <b>+{formatNumber(data?.referralRewardPerMiner ?? 0)} $MOONRAT</b> for every miner who
          joins your crew and starts mining.
        </p>
        <div className="grid-2">
          <GlowButton variant="ghost" onClick={copy}>
            {copied ? '✓ Copied' : 'Copy link'}
          </GlowButton>
          <GlowButton variant="primary" onClick={share}>
            Invite Crew
          </GlowButton>
        </div>
      </Panel>

      <SectionHeader eyebrow="Roster" title="Your Crew" />
      {data?.crew?.length ? (
        <div className="stack">
          {data.crew.map((c: any) => (
            <div key={c.id} className="crew-row panel">
              <div className="crew-avatar">
                {c.photoUrl ? <img src={c.photoUrl} alt="" /> : <span>{c.name[0]}</span>}
              </div>
              <div className="crew-info">
                <div className="crew-name">{c.name}</div>
                <div className="crew-meta">Joined {timeAgo(c.joinedAt)}</div>
              </div>
              <div className="crew-hr mono cyan-text">{formatNumber(c.hashRate)} <span>H/s</span></div>
            </div>
          ))}
        </div>
      ) : (
        <Panel>
          <EmptyState icon="🤝" title="No crew yet" sub="Share your invite link to start building your mining crew." />
        </Panel>
      )}
    </div>
  );
}
