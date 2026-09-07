import TopBar from '../components/TopBar';
import '../components/TopBar.css';
import { Panel, ProgressBar, SectionHeader, Pill } from '../components/ui';
import { useFetch } from '../hooks/useFetch';
import { api } from '../lib/api';
import { formatFull } from '../lib/format';
import './ExpeditionScreen.css';

const CHAPTER_GRADIENTS: Record<string, string> = {
  signal: 'linear-gradient(135deg, #0a2a4d, #071426)',
  mine: 'linear-gradient(135deg, #0b3b52, #061826)',
  vault: 'linear-gradient(135deg, #2a1f4d, #0a0a1e)',
  coordinates: 'linear-gradient(135deg, #1a3a5c, #0a1226)',
};

export default function ExpeditionScreen() {
  const { data } = useFetch(() => api.expedition(), []);

  return (
    <div className="fade-enter">
      <TopBar />

      {/* Hero */}
      <div className="expo-hero">
        <img src="/assets/moonrat-brand.png" alt="" className="expo-hero-img" />
        <div className="expo-hero-overlay">
          <div className="eyebrow">The Expedition</div>
          <h1 className="expo-hero-title">The adventure is<br />just beginning…</h1>
        </div>
      </div>

      {/* Milestones */}
      <SectionHeader eyebrow="Community" title="Milestones" />
      <div className="stack">
        {data?.milestones?.map((m: any) => (
          <Panel key={m.key} className="milestone-card" glow>
            <div className="row" style={{ justifyContent: 'space-between' }}>
              <div className="milestone-title">{m.title}</div>
              {m.reached ? <Pill tone="green">Reached</Pill> : <Pill tone="cyan">Live</Pill>}
            </div>
            <div className="milestone-count mono">
              {formatFull(m.current)} <span className="muted">/ {formatFull(m.target)} {m.unit}</span>
            </div>
            <ProgressBar value={m.progress} tone="cyan" height={12} />
            <div className="milestone-desc">{m.description}</div>
          </Panel>
        ))}
      </div>

      {/* Chapters */}
      <SectionHeader eyebrow="Story" title="Chapters" />
      <div className="stack">
        {data?.chapters?.map((c: any) => {
          const locked = c.status === 'locked';
          return (
            <div
              key={c.key}
              className={`chapter-card ${locked ? 'locked' : ''}`}
              style={{ background: CHAPTER_GRADIENTS[c.imageKey] ?? CHAPTER_GRADIENTS.mine }}
            >
              <div className="chapter-body">
                <div className="row" style={{ justifyContent: 'space-between' }}>
                  <span className="eyebrow">{c.title.split('—')[0]?.trim()}</span>
                  {c.status === 'completed' ? (
                    <Pill tone="green">✓ Done</Pill>
                  ) : locked ? (
                    <Pill tone="muted">🔒 Locked</Pill>
                  ) : (
                    <Pill tone="cyan">Active</Pill>
                  )}
                </div>
                <h3 className="chapter-title">{c.title.split('—')[1]?.trim() ?? c.title}</h3>
                <p className="chapter-sub">{locked ? c.subtitle : c.body}</p>
              </div>
              {locked && <div className="chapter-lock">🔒</div>}
            </div>
          );
        })}
      </div>

      {/* Missions */}
      <SectionHeader eyebrow="Do this" title="Missions" />
      <div className="stack">
        {data?.missions?.map((m: any) => (
          <Panel key={m.key} className="mission-card">
            <div className="mission-left">
              <div className={`mission-check ${m.completed ? 'done' : ''}`}>{m.completed ? '✓' : ''}</div>
              <div>
                <div className="mission-title">{m.title}</div>
                <div className="mission-desc">{m.description}</div>
              </div>
            </div>
            <div className="mission-reward gold-text mono">+{formatFull(m.reward)}</div>
          </Panel>
        ))}
      </div>

      {/* Announcements */}
      {data?.announcements?.length > 0 && (
        <>
          <SectionHeader eyebrow="News" title="Announcements" />
          <div className="stack">
            {data.announcements.map((a: any) => (
              <Panel key={a.id} className="announce-card">
                {a.pinned && <span className="pin">📌</span>}
                <div className="announce-title">{a.title}</div>
                <div className="announce-body">{a.body}</div>
              </Panel>
            ))}
          </div>
        </>
      )}
    </div>
  );
}
