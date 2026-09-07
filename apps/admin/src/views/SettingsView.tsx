import { useEffect, useState } from 'react';
import { adminApi } from '../api';

export function SettingsView() {
  const [items, setItems] = useState<any[]>([]);
  const [drafts, setDrafts] = useState<Record<string, string>>({});
  const [newKey, setNewKey] = useState('');
  const [saved, setSaved] = useState('');

  const load = () =>
    adminApi('/settings').then((rows: any[]) => {
      setItems(rows);
      const d: Record<string, string> = {};
      rows.forEach((r) => (d[r.key] = r.value));
      setDrafts(d);
    });
  useEffect(() => {
    load();
  }, []);

  const save = async (key: string) => {
    await adminApi(`/settings/${key}`, { method: 'PUT', body: JSON.stringify({ value: drafts[key] ?? '' }) });
    setSaved(key);
    setTimeout(() => setSaved(''), 1500);
    load();
  };

  const add = async () => {
    if (!newKey.trim()) return;
    await adminApi(`/settings/${newKey.trim()}`, { method: 'PUT', body: JSON.stringify({ value: '' }) });
    setNewKey('');
    load();
  };

  return (
    <div>
      <h2>App Settings</h2>
      <p className="sub">Key/value settings: token symbol, referral reward, bot username, and more.</p>
      <div className="panel">
        {items.map((s) => (
          <div className="row" key={s.key} style={{ marginBottom: 12 }}>
            <div style={{ width: 200, color: 'var(--dim)', fontSize: 13 }}>{s.key}</div>
            <input value={drafts[s.key] ?? ''} onChange={(e) => setDrafts({ ...drafts, [s.key]: e.target.value })} />
            <button onClick={() => save(s.key)}>Save</button>
            {saved === s.key && <span className="ok">✓</span>}
          </div>
        ))}
        <div className="row" style={{ marginTop: 16, borderTop: '1px solid var(--line)', paddingTop: 16 }}>
          <input placeholder="new_setting_key" value={newKey} onChange={(e) => setNewKey(e.target.value)} />
          <button onClick={add}>+ Add</button>
        </div>
      </div>
    </div>
  );
}
