import { useEffect, useState } from 'react';
import { adminApi, setAdminToken, hasToken } from './api';
import { MiningConfigView } from './views/MiningConfig';
import { EntityView } from './views/EntityView';
import { UsersView } from './views/UsersView';
import { SettingsView } from './views/SettingsView';

type Tab =
  | 'overview'
  | 'mining'
  | 'levels'
  | 'chapters'
  | 'milestones'
  | 'missions'
  | 'announcements'
  | 'settings'
  | 'users';

const NAV: { key: Tab; label: string }[] = [
  { key: 'overview', label: '📊 Overview' },
  { key: 'mining', label: '⛏️ Mining Config' },
  { key: 'levels', label: '🏅 Miner Levels' },
  { key: 'chapters', label: '📖 Chapters' },
  { key: 'milestones', label: '🎯 Milestones' },
  { key: 'missions', label: '✅ Missions' },
  { key: 'announcements', label: '📣 Announcements' },
  { key: 'settings', label: '⚙️ Settings' },
  { key: 'users', label: '👤 Users' },
];

export default function App() {
  const [authed, setAuthed] = useState(hasToken());
  const [tab, setTab] = useState<Tab>('overview');

  if (!authed) return <Login onDone={() => setAuthed(true)} />;

  return (
    <div className="admin-shell">
      <aside className="sidebar">
        <h1>
          <span>🐀</span> Moonrat
        </h1>
        {NAV.map((n) => (
          <button
            key={n.key}
            className={`nav-btn ${tab === n.key ? 'active' : ''}`}
            onClick={() => setTab(n.key)}
          >
            {n.label}
          </button>
        ))}
        <button
          className="nav-btn"
          style={{ marginTop: 20, color: 'var(--danger)' }}
          onClick={() => {
            setAdminToken(null);
            setAuthed(false);
          }}
        >
          ↩ Logout
        </button>
      </aside>
      <main className="content">
        {tab === 'overview' && <Overview />}
        {tab === 'mining' && <MiningConfigView />}
        {tab === 'levels' && (
          <EntityView
            title="Miner Levels"
            sub="Progression thresholds by hash rate. Editable without redeploy."
            endpoint="/levels"
            fields={['key', 'name', 'order', 'minHashRate', 'icon']}
          />
        )}
        {tab === 'chapters' && (
          <EntityView
            title="Story Chapters"
            sub="The expedition storyline. Set unlockType=milestone + milestoneKey to gate a chapter."
            endpoint="/chapters"
            fields={['key', 'order', 'title', 'subtitle', 'body', 'status', 'unlockType', 'milestoneKey', 'imageKey']}
          />
        )}
        {tab === 'milestones' && (
          <EntityView
            title="Community Milestones"
            sub="e.g. 37,492 / 50,000 Miners. Set reachedAt to unlock gated chapters."
            endpoint="/milestones"
            fields={['key', 'order', 'title', 'description', 'current', 'target', 'unit']}
          />
        )}
        {tab === 'missions' && (
          <EntityView
            title="Missions"
            sub="Tasks players complete for rewards."
            endpoint="/missions"
            fields={['key', 'order', 'chapterKey', 'title', 'description', 'type', 'target', 'reward', 'active']}
          />
        )}
        {tab === 'announcements' && (
          <EntityView
            title="Announcements"
            sub="Broadcast news to the expedition."
            endpoint="/announcements"
            fields={['title', 'body', 'pinned', 'active']}
          />
        )}
        {tab === 'settings' && <SettingsView />}
        {tab === 'users' && <UsersView />}
      </main>
    </div>
  );
}

function Login({ onDone }: { onDone: () => void }) {
  const [username, setUsername] = useState('admin');
  const [password, setPassword] = useState('');
  const [err, setErr] = useState('');

  const submit = async () => {
    setErr('');
    try {
      const res = await adminApi<{ token: string }>('/login', {
        method: 'POST',
        body: JSON.stringify({ username, password }),
      });
      setAdminToken(res.token);
      onDone();
    } catch (e: any) {
      setErr(e?.message === 'invalid_credentials' ? 'Invalid username or password.' : 'Login failed.');
    }
  };

  return (
    <div className="login-wrap">
      <div className="panel login-box">
        <h2 style={{ marginTop: 0 }}>🐀 Moonrat Admin</h2>
        <p className="sub">Sign in to manage the mine.</p>
        <label>Username</label>
        <input value={username} onChange={(e) => setUsername(e.target.value)} />
        <label>Password</label>
        <input type="password" value={password} onChange={(e) => setPassword(e.target.value)} onKeyDown={(e) => e.key === 'Enter' && submit()} />
        <button style={{ marginTop: 16, width: '100%' }} onClick={submit}>
          Sign In
        </button>
        {err && <div className="err">{err}</div>}
      </div>
    </div>
  );
}

function Overview() {
  const [data, setData] = useState<any>(null);
  useEffect(() => {
    adminApi('/overview').then(setData).catch(() => {});
  }, []);
  const cards = [
    { k: 'Total Miners', v: data?.users ?? '—' },
    { k: 'Active Now', v: data?.activeMiners ?? '—' },
    { k: 'Total Mined', v: Math.round(data?.totalMined ?? 0).toLocaleString() },
    { k: 'Total Claimed', v: Math.round(data?.totalClaimed ?? 0).toLocaleString() },
    { k: 'Chapters', v: data?.chapters ?? '—' },
    { k: 'Missions', v: data?.missions ?? '—' },
  ];
  return (
    <div>
      <h2>Overview</h2>
      <p className="sub">Live snapshot of the Moonrat expedition.</p>
      <div className="cards">
        {cards.map((c) => (
          <div className="card" key={c.k}>
            <div className="k">{c.k}</div>
            <div className="v">{c.v}</div>
          </div>
        ))}
      </div>
    </div>
  );
}
