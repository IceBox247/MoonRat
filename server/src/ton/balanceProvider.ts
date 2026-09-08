import { config } from '../config.js';

/**
 * Reads a wallet's $MOONRAT jetton balance in human units.
 * We only ever read PUBLIC on-chain data from an address. No keys, ever.
 *
 * INVARIANT: a FAILED read returns `null` (unknown) — NEVER 0. Callers must keep the
 * last known balance on null. A genuine "no jetton wallet" is a real 0 and returns 0.
 */
export interface BalanceProvider {
  getMoonratBalance(walletAddress: string): Promise<number | null>;
}

/**
 * Deterministic fake balances for local dev until the real jetton master address exists.
 * Same address always yields the same "balance" so the UI feels stable.
 */
export class MockBalanceProvider implements BalanceProvider {
  async getMoonratBalance(walletAddress: string): Promise<number> {
    let hash = 0;
    for (let i = 0; i < walletAddress.length; i++) {
      hash = (hash * 31 + walletAddress.charCodeAt(i)) >>> 0;
    }
    // Spread across a plausible range: 0 – ~2,000,000 MOONRAT
    const balance = (hash % 2_000_000) + (hash % 997);
    return Math.round(balance);
  }
}

/**
 * Real reader via TonAPI (https://tonapi.io). Resolves the user's jetton wallet for the
 * $MOONRAT master and returns its balance scaled by decimals.
 */
export class TonApiBalanceProvider implements BalanceProvider {
  async getMoonratBalance(walletAddress: string): Promise<number | null> {
    if (!config.ton.jettonMaster) {
      // Misconfiguration is "unknown", not zero — never wipe holdings.
      console.error('[ton] MOONRAT_JETTON_MASTER not configured; returning null');
      return null;
    }
    const url = `${config.ton.tonapiBase}/v2/accounts/${encodeURIComponent(
      walletAddress
    )}/jettons/${encodeURIComponent(config.ton.jettonMaster)}`;
    const headers: Record<string, string> = { Accept: 'application/json' };
    if (config.ton.tonapiKey) headers.Authorization = `Bearer ${config.ton.tonapiKey}`;

    try {
      const res = await fetch(url, { headers });
      // 404 = the address genuinely has no $MOONRAT jetton wallet => real zero.
      if (res.status === 404) return 0;
      // Throttling / server / auth errors are UNKNOWN, not zero. Keep last value.
      if (!res.ok) {
        console.error(`[ton] tonapi read failed (${res.status}); returning null`);
        return null;
      }
      const data: any = await res.json();
      const raw = BigInt(data?.balance ?? '0');
      const decimals = Number(data?.jetton?.decimals ?? config.ton.jettonDecimals);
      return Number(raw) / 10 ** decimals;
    } catch (e) {
      // Network error / timeout — unknown, not zero.
      console.error('[ton] tonapi read threw; returning null', (e as Error)?.message);
      return null;
    }
  }
}

// TODO(production): add a toncenter fallback here — tonapi throttles cloud IPs.
// Try tonapi, and on null fall back to toncenter before finally returning null.

let cached: BalanceProvider | null = null;
export function getBalanceProvider(): BalanceProvider {
  if (cached) return cached;
  cached = config.ton.provider === 'tonapi' ? new TonApiBalanceProvider() : new MockBalanceProvider();
  return cached;
}
