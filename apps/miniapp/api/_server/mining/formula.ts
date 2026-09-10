/**
 * Pluggable mining-power (hashrate) formula engine.
 *
 * Mining Power is derived ENTIRELY from the amount of $MOONRAT a user holds on-chain.
 * The active strategy + parameters come from the `MiningConfig` DB row, so the whole
 * curve can be retuned from the admin dashboard with no code changes / redeploy.
 *
 * hashRate = clamp(strategy(balance, cfg), 0, maxHashRate)
 */

export interface MiningConfigLike {
  strategy: string; // linear | sqrt | log | tiered
  baseHashRate: number;
  holdingsFactor: number;
  balanceUnit: number;
  maxHashRate: number;
  tiersJson: string; // JSON: [{ minBalance: number, hashRate: number }]
}

interface Tier {
  minBalance: number;
  hashRate: number;
}

function safeTiers(json: string): Tier[] {
  try {
    const parsed = JSON.parse(json);
    if (!Array.isArray(parsed)) return [];
    return parsed
      .filter((t) => typeof t?.minBalance === 'number' && typeof t?.hashRate === 'number')
      .sort((a, b) => a.minBalance - b.minBalance);
  } catch {
    return [];
  }
}

/**
 * Compute hashrate for a given on-chain balance (in human token units).
 */
export function computeHashRate(balance: number, cfg: MiningConfigLike): number {
  const b = Math.max(0, balance || 0);
  const unit = cfg.balanceUnit > 0 ? cfg.balanceUnit : 1;
  const normalized = b / unit;
  let raw: number;

  switch (cfg.strategy) {
    case 'linear':
      raw = cfg.baseHashRate + cfg.holdingsFactor * normalized;
      break;
    case 'log':
      raw = cfg.baseHashRate + cfg.holdingsFactor * Math.log10(1 + normalized);
      break;
    case 'tiered': {
      const tiers = safeTiers(cfg.tiersJson);
      let tierRate = 0;
      for (const t of tiers) {
        if (b >= t.minBalance) tierRate = t.hashRate;
      }
      raw = cfg.baseHashRate + tierRate;
      break;
    }
    case 'sqrt':
    default:
      // Diminishing returns — whales don't scale linearly.
      raw = cfg.baseHashRate + cfg.holdingsFactor * Math.sqrt(normalized);
      break;
  }

  if (!Number.isFinite(raw) || raw < 0) raw = 0;
  return Math.min(raw, cfg.maxHashRate);
}

/**
 * Rewards accrued over a window.
 * amount = hashRate * seconds * globalRatePerSec
 */
export function computeAccrual(hashRate: number, seconds: number, globalRatePerSec: number): number {
  if (seconds <= 0 || hashRate <= 0) return 0;
  const amount = hashRate * seconds * globalRatePerSec;
  return Number.isFinite(amount) && amount > 0 ? amount : 0;
}
