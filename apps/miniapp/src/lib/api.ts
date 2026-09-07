const API_BASE = import.meta.env.VITE_API_BASE || '';

let token: string | null = localStorage.getItem('moonrat_token');

export function setToken(t: string | null) {
  token = t;
  if (t) localStorage.setItem('moonrat_token', t);
  else localStorage.removeItem('moonrat_token');
}

export function getToken() {
  return token;
}

async function request<T>(path: string, opts: RequestInit = {}): Promise<T> {
  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
    ...(opts.headers as Record<string, string>),
  };
  if (token) headers.Authorization = `Bearer ${token}`;

  const res = await fetch(`${API_BASE}${path}`, { ...opts, headers });
  if (!res.ok) {
    let body: any = null;
    try {
      body = await res.json();
    } catch {
      /* ignore */
    }
    const err = new Error(body?.error || `http_${res.status}`);
    (err as any).status = res.status;
    (err as any).body = body;
    throw err;
  }
  if (res.status === 204) return undefined as T;
  return res.json();
}

export const api = {
  authTelegram: (payload: { initData?: string; devAuth?: string; startParam?: string }) =>
    request<{ token: string; user: any }>('/api/auth/telegram', {
      method: 'POST',
      body: JSON.stringify(payload),
    }),

  me: () => request<any>('/api/me'),
  meta: () => request<any>('/api/meta/config'),

  walletConnect: (walletAddress: string) =>
    request<any>('/api/wallet/connect', { method: 'POST', body: JSON.stringify({ walletAddress }) }),
  walletDisconnect: () => request<any>('/api/wallet/disconnect', { method: 'POST' }),
  walletRefresh: () => request<any>('/api/wallet/refresh', { method: 'POST' }),

  mining: () => request<any>('/api/mining'),
  miningStart: () => request<any>('/api/mining/start', { method: 'POST' }),
  miningStop: () => request<any>('/api/mining/stop', { method: 'POST' }),
  miningClaim: () => request<{ claimed: number; state: any }>('/api/mining/claim', { method: 'POST' }),

  expedition: () => request<any>('/api/expedition'),
  crew: () => request<any>('/api/crew'),
  vault: () => request<any>('/api/vault'),
};
