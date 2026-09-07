const BASE = import.meta.env.VITE_API_BASE || '';
let token: string | null = localStorage.getItem('moonrat_admin_token');

export function setAdminToken(t: string | null) {
  token = t;
  if (t) localStorage.setItem('moonrat_admin_token', t);
  else localStorage.removeItem('moonrat_admin_token');
}
export function hasToken() {
  return !!token;
}

export async function adminApi<T = any>(path: string, opts: RequestInit = {}): Promise<T> {
  const headers: Record<string, string> = { 'Content-Type': 'application/json', ...(opts.headers as any) };
  if (token) headers.Authorization = `Bearer ${token}`;
  const res = await fetch(`${BASE}/api/admin${path}`, { ...opts, headers });
  if (!res.ok) {
    const body = await res.json().catch(() => ({}));
    const err = new Error((body as any)?.error || `http_${res.status}`);
    (err as any).status = res.status;
    throw err;
  }
  if (res.status === 204) return undefined as T;
  return res.json();
}
