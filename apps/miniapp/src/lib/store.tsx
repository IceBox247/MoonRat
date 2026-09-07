import { createContext, useContext, useEffect, useState, type ReactNode, useCallback } from 'react';
import { api, setToken, getToken } from './api';
import { initTelegram, getInitData, getDevAuth, getStartParam } from './telegram';

interface Meta {
  buyUrl: string;
  levels: any[];
  token: { symbol: string; name: string; jettonMaster: string | null; provider: string };
}

interface StoreValue {
  ready: boolean;
  error: string | null;
  user: any | null;
  meta: Meta | null;
  reloadUser: () => Promise<void>;
  setUser: (u: any) => void;
}

const StoreCtx = createContext<StoreValue | null>(null);

export function StoreProvider({ children }: { children: ReactNode }) {
  const [ready, setReady] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [user, setUser] = useState<any | null>(null);
  const [meta, setMeta] = useState<Meta | null>(null);

  const reloadUser = useCallback(async () => {
    const u = await api.me();
    setUser(u);
  }, []);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        initTelegram();
        const initData = getInitData();
        const startParam = getStartParam();

        // Authenticate (reuse token if present, else exchange initData/devAuth)
        if (!getToken()) {
          const payload = initData
            ? { initData, startParam }
            : { devAuth: getDevAuth(), startParam };
          const res = await api.authTelegram(payload);
          setToken(res.token);
        }

        const [u, m] = await Promise.all([api.me(), api.meta()]);
        if (cancelled) return;
        setUser(u);
        setMeta(m);
        setReady(true);
      } catch (e: any) {
        // Token might be stale — clear and retry once with fresh auth.
        if (e?.status === 401) {
          setToken(null);
          try {
            const initData = getInitData();
            const payload = initData
              ? { initData, startParam: getStartParam() }
              : { devAuth: getDevAuth(), startParam: getStartParam() };
            const res = await api.authTelegram(payload);
            setToken(res.token);
            const [u, m] = await Promise.all([api.me(), api.meta()]);
            if (cancelled) return;
            setUser(u);
            setMeta(m);
            setReady(true);
            return;
          } catch (e2: any) {
            if (!cancelled) setError(e2?.message ?? 'auth_failed');
            return;
          }
        }
        if (!cancelled) setError(e?.message ?? 'load_failed');
      }
    })();
    return () => {
      cancelled = true;
    };
  }, []);

  return (
    <StoreCtx.Provider value={{ ready, error, user, meta, reloadUser, setUser }}>
      {children}
    </StoreCtx.Provider>
  );
}

export function useStore() {
  const v = useContext(StoreCtx);
  if (!v) throw new Error('useStore must be used within StoreProvider');
  return v;
}
