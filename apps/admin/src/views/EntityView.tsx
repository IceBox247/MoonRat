import { useEffect, useState } from 'react';
import { adminApi } from '../api';

// Generic list + create/edit/delete for simple config entities.
export function EntityView({
  title,
  sub,
  endpoint,
  fields,
}: {
  title: string;
  sub: string;
  endpoint: string;
  fields: string[];
}) {
  const [items, setItems] = useState<any[]>([]);
  const [editing, setEditing] = useState<any | null>(null);
  const [err, setErr] = useState('');

  const load = () => adminApi(endpoint).then(setItems).catch((e) => setErr(e.message));
  useEffect(() => {
    load();
  }, [endpoint]);

  const blank = () => {
    const o: any = {};
    for (const f of fields) o[f] = '';
    setEditing(o);
  };

  const save = async () => {
    setErr('');
    try {
      const payload = coerce(editing, fields);
      if (editing.id) {
        await adminApi(`${endpoint}/${editing.id}`, { method: 'PUT', body: JSON.stringify(payload) });
      } else {
        await adminApi(endpoint, { method: 'POST', body: JSON.stringify(payload) });
      }
      setEditing(null);
      load();
    } catch (e: any) {
      setErr(e.message);
    }
  };

  const del = async (id: string) => {
    if (!confirm('Delete this item?')) return;
    await adminApi(`${endpoint}/${id}`, { method: 'DELETE' });
    load();
  };

  return (
    <div>
      <div className="row">
        <div>
          <h2>{title}</h2>
          <p className="sub">{sub}</p>
        </div>
        <div className="spacer" />
        <button onClick={blank}>+ New</button>
      </div>

      {err && <div className="err">{err}</div>}

      {editing && (
        <div className="panel">
          <h3 style={{ marginTop: 0 }}>{editing.id ? 'Edit' : 'Create'}</h3>
          <div className="grid2">
            {fields.map((f) => (
              <div key={f}>
                <label>{f}</label>
                {isLong(f) ? (
                  <textarea rows={3} value={editing[f] ?? ''} onChange={(e) => setEditing({ ...editing, [f]: e.target.value })} />
                ) : (
                  <input value={editing[f] ?? ''} onChange={(e) => setEditing({ ...editing, [f]: e.target.value })} />
                )}
              </div>
            ))}
          </div>
          <div className="row" style={{ marginTop: 14 }}>
            <button onClick={save}>Save</button>
            <button className="ghost" onClick={() => setEditing(null)}>
              Cancel
            </button>
          </div>
        </div>
      )}

      <div className="panel">
        {items.length === 0 ? (
          <div className="sub">No items yet.</div>
        ) : (
          items.map((it) => (
            <div className="item-row" key={it.id}>
              <div style={{ flex: 1 }}>
                <strong>{it.title ?? it.name ?? it.key}</strong>
                <div style={{ fontSize: 12, color: 'var(--dim)' }}>
                  {fields
                    .filter((f) => !['title', 'name', 'body', 'description'].includes(f))
                    .map((f) => `${f}: ${fmt(it[f])}`)
                    .join('  ·  ')}
                </div>
              </div>
              <button className="ghost" onClick={() => setEditing(it)}>
                Edit
              </button>
              <button className="danger" onClick={() => del(it.id)}>
                Del
              </button>
            </div>
          ))
        )}
      </div>
    </div>
  );
}

function isLong(f: string) {
  return ['body', 'description', 'subtitle'].includes(f);
}
function fmt(v: any) {
  if (v === null || v === undefined || v === '') return '—';
  if (typeof v === 'boolean') return v ? 'yes' : 'no';
  return String(v);
}
const NUM_FIELDS = new Set(['order', 'minHashRate', 'current', 'target', 'reward', 'progress']);
const BOOL_FIELDS = new Set(['active', 'pinned']);
function coerce(obj: any, fields: string[]) {
  const out: any = {};
  for (const f of fields) {
    let v = obj[f];
    if (v === '' || v === undefined) {
      if (NUM_FIELDS.has(f)) v = 0;
      else if (BOOL_FIELDS.has(f)) v = false;
      else continue;
    } else if (NUM_FIELDS.has(f)) v = Number(v);
    else if (BOOL_FIELDS.has(f)) v = v === true || v === 'true' || v === 'yes' || v === '1';
    out[f] = v;
  }
  return out;
}
