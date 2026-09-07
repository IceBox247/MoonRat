import { useEffect, useState } from 'react';
import { adminApi } from '../api';

export function UsersView() {
  const [users, setUsers] = useState<any[]>([]);

  const load = () => adminApi('/users').then(setUsers).catch(() => {});
  useEffect(() => {
    load();
  }, []);

  const toggleBan = async (u: any) => {
    await adminApi(`/users/${u.id}`, { method: 'PATCH', body: JSON.stringify({ isBanned: !u.isBanned }) });
    load();
  };

  return (
    <div>
      <h2>Users</h2>
      <p className="sub">Most recent {users.length} miners.</p>
      <div className="panel" style={{ overflowX: 'auto' }}>
        <table>
          <thead>
            <tr>
              <th>Miner</th>
              <th>Balance</th>
              <th>Hash Rate</th>
              <th>Level</th>
              <th>Vault</th>
              <th>Status</th>
              <th></th>
            </tr>
          </thead>
          <tbody>
            {users.map((u) => (
              <tr key={u.id}>
                <td>{u.firstName ?? u.username ?? u.telegramId}</td>
                <td>{Math.round(u.moonratBalance).toLocaleString()}</td>
                <td>{Math.round(u.hashRate).toLocaleString()}</td>
                <td>{u.minerLevelKey}</td>
                <td>{Math.round(u.vaultBalance).toLocaleString()}</td>
                <td>{u.isBanned ? <span style={{ color: 'var(--danger)' }}>Banned</span> : <span className="pill">Active</span>}</td>
                <td>
                  <button className={u.isBanned ? 'ghost' : 'danger'} onClick={() => toggleBan(u)}>
                    {u.isBanned ? 'Unban' : 'Ban'}
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
