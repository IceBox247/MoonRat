import { useCallback, useEffect, useRef, useState } from 'react';
import { api } from '../lib/api';

export interface MiningState {
  balance: number;
  hashRate: number;
  ratePerHour: number;
  ratePerSec: number;
  mining: boolean;
  pending: number;
  minedTotal: number;
  claimedTotal: number;
  vaultBalance: number;
  walletConnected: boolean;
  walletAddress: string | null;
  level: { key: string; name: string; icon: string; order: number } | null;
  nextLevel: { key: string; name: string; icon: string; minHashRate: number } | null;
  levelProgress: number;
  sessionMaxHours: number;
  buyUrl: string;
}

export function useMining() {
  const [state, setState] = useState<MiningState | null>(null);
  const [displayPending, setDisplayPending] = useState(0);
  const [busy, setBusy] = useState(false);
  const fetchedAt = useRef<number>(0);
  const baseline = useRef<number>(0);

  const apply = useCallback((s: MiningState) => {
    setState(s);
    baseline.current = s.pending;
    fetchedAt.current = Date.now();
    setDisplayPending(s.pending);
  }, []);

  const refresh = useCallback(async () => {
    const s = await api.mining();
    apply(s);
  }, [apply]);

  useEffect(() => {
    refresh().catch(() => {});
    const poll = setInterval(() => refresh().catch(() => {}), 25000);
    return () => clearInterval(poll);
  }, [refresh]);

  // Local ticking of pending rewards while mining
  useEffect(() => {
    if (!state?.mining) return;
    const id = setInterval(() => {
      const elapsed = (Date.now() - fetchedAt.current) / 1000;
      setDisplayPending(baseline.current + state.ratePerSec * elapsed);
    }, 100);
    return () => clearInterval(id);
  }, [state?.mining, state?.ratePerSec]);

  const start = useCallback(async () => {
    setBusy(true);
    try {
      const s = await api.miningStart();
      apply(s);
    } finally {
      setBusy(false);
    }
  }, [apply]);

  const stop = useCallback(async () => {
    setBusy(true);
    try {
      const s = await api.miningStop();
      apply(s);
    } finally {
      setBusy(false);
    }
  }, [apply]);

  const claim = useCallback(async () => {
    setBusy(true);
    try {
      const res = await api.miningClaim();
      apply(res.state);
      return res.claimed;
    } finally {
      setBusy(false);
    }
  }, [apply]);

  return { state, displayPending, busy, refresh, start, stop, claim };
}
