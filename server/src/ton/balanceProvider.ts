import { config } from '../config.js';

/**
 * Reads a wallet's $MOONRAT jetton balance in human units.
 * We only ever read PUBLIC on-chain data from an address. No keys, ever.
 */
export interface BalanceProvider {
  getMoonratBalance(walletAddress: string): Promise<number>;
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
  async getMoonratBalance(walletAddress: string): Promise<number> {
    if (!config.ton.jettonMaster) {
      throw new Error('MOONRAT_JETTON_MASTER not configured');
    }
    const url = `${config.ton.tonapiBase}/v2/accounts/${encodeURIComponent(
      walletAddress
    )}/jettons/${encodeURIComponent(config.ton.jettonMaster)}`;
    const headers: Record<string, string> = { Accept: 'application/json' };
    if (config.ton.tonapiKey) headers.Authorization = `Bearer ${config.ton.tonapiKey}`;

    const res = await fetch(url, { headers });
    if (res.status === 404) return 0; // no jetton wallet => 0 balance
    if (!res.ok) throw new Error(`tonapi_error_${res.status}`);
    const data: any = await res.json();
    const raw = BigInt(data?.balance ?? '0');
    const decimals = Number(data?.jetton?.decimals ?? config.ton.jettonDecimals);
    return Number(raw) / 10 ** decimals;
  }
}

let cached: BalanceProvider | null = null;
export function getBalanceProvider(): BalanceProvider {
  if (cached) return cached;
  cached = config.ton.provider === 'tonapi' ? new TonApiBalanceProvider() : new MockBalanceProvider();
  return cached;
}
