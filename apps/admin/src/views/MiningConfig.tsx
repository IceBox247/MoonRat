import { useEffect, useState } from 'react';
import { adminApi } from '../api';

const FIELDS: { key: string; label: string; type: 'number' | 'text' | 'select'; opts?: string[]; hint?: string }[] = [
  { key: 'strategy', label: 'Formula strategy', type: 'select', opts: ['sqrt', 'linear', 'log', 'tiered'], hint: 'How hashrate scales with $MOONRAT held' },
  { key: 'baseHashRate', label: 'Base hash rate', type: 'number', hint: 'Floor for any connected miner' },
  { key: 'holdingsFactor', label: 'Holdings factor', type: 'number', hint: 'Multiplier on the balance term' },
  { key: 'balanceUnit', label: 'Balance unit', type: 'number', hint: 'Balance is divided by this before the formula' },
  { key: 'globalRatePerSec', label: 'Global rate / sec', type: 'number', hint: '$MOONRAT minted per hashrate-unit per second' },
  { key: 'maxHashRate', label: 'Max hash rate (cap)', type: 'number' },
  { key: 'claimCooldownSec', label: 'Claim cooldown (sec)', type: 'number' },
  { key: 'sessionMaxHours', label: 'Offline earning cap (hrs)', type: 'number' },
];

export function MiningConfigView() {
  const [cfg, setCfg] = useState<any>(null);
  const [saved, setSaved] = useState(false);
  const [err, setErr] = useState('');

  useEffect(() => {
    adminApi('/mining-config').then(setCfg).catch((e) => setErr(e.message));
  }, []);

  const save = async () => {
    setErr('');
    setSaved(false);
    try {
      const payload: any = {};
      for (const f of FIELDS) {
        payload[f.key] = f.type === 'number' ? Number(cfg[f.key]) : cfg[f.key];
      }
      payload.tiersJson = cfg.tiersJson;
      const updated = await adminApi('/mining-config', { method: 'PUT', body: JSON.stringify(payload) });
      setCfg(updated);
      setSaved(true);
      setTimeout(() => setSaved(false), 2000);
    } catch (e: any) {
      setErr(e.message);
    }
  };

  if (!cfg) return <div>Loading…</div>;

  return (
    <div>
      <h2>Mining Config</h2>
      <p className="sub">
        The economy knobs. Mining Power = f(on-chain $MOONRAT balance). Changes apply instantly — no
        redeploy.
      </p>
      <div className="panel">
        <div className="grid2">
          {FIELDS.map((f) => (
            <div key={f.key}>
              <label>{f.label}</label>
              {f.type === 'select' ? (
                <select value={cfg[f.key]} onChange={(e) => setCfg({ ...cfg, [f.key]: e.target.value })}>
                  {f.opts!.map((o) => (
                    <option key={o} value={o}>
                      {o}
                    </option>
                  ))}
                </select>
              ) : (
                <input
                  type="number"
                  step="any"
                  value={cfg[f.key]}
                  onChange={(e) => setCfg({ ...cfg, [f.key]: e.target.value })}
                />
              )}
              {f.hint && <div style={{ fontSize: 11, color: 'var(--dim)', marginTop: 4 }}>{f.hint}</div>}
            </div>
          ))}
        </div>

        <label style={{ marginTop: 16 }}>Tiers JSON (used when strategy = tiered)</label>
        <textarea
          rows={5}
          value={cfg.tiersJson}
          onChange={(e) => setCfg({ ...cfg, tiersJson: e.target.value })}
          style={{ fontFamily: 'monospace', fontSize: 12 }}
        />

        <div className="row" style={{ marginTop: 16 }}>
          <button onClick={save}>Save Config</button>
          {saved && <span className="ok">✓ Saved</span>}
          {err && <span className="err">{err}</span>}
        </div>
      </div>
    </div>
  );
}
