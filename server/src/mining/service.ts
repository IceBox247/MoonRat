import { prisma } from '../db.js';
import { config } from '../config.js';
import { computeHashRate, computeAccrual, type MiningConfigLike } from './formula.js';
import { getBalanceProvider } from '../ton/balanceProvider.js';

const DEFAULT_CONFIG_ID = 'singleton';

export async function getMiningConfig() {
  let cfg = await prisma.miningConfig.findUnique({ where: { id: DEFAULT_CONFIG_ID } });
  if (!cfg) {
    cfg = await prisma.miningConfig.create({ data: { id: DEFAULT_CONFIG_ID } });
  }
  return cfg;
}

export async function getLevels() {
  return prisma.minerLevel.findMany({ orderBy: { order: 'asc' } });
}

export function levelForHashRate(
  hashRate: number,
  levels: { key: string; name: string; order: number; minHashRate: number; icon: string }[]
) {
  let current = levels[0];
  for (const lvl of levels) {
    if (hashRate >= lvl.minHashRate) current = lvl;
  }
  return current;
}

/**
 * Read on-chain balance, recompute hashrate + level, persist to the user.
 * Called on wallet connect, on refresh, and lazily during mining reads.
 */
export async function refreshUserHashRate(userId: string) {
  const user = await prisma.user.findUnique({ where: { id: userId } });
  if (!user) throw new Error('user_not_found');

  let balance = user.moonratBalance;
  let readOk = true;
  if (user.walletAddress) {
    const provider = getBalanceProvider();
    const read = await provider.getMoonratBalance(user.walletAddress);
    // INVARIANT: a failed read is `null` (unknown) — KEEP the last known balance.
    // Never write 0 on a throttle/error; that would wipe real holdings + mining power.
    if (read === null) {
      readOk = false;
    } else {
      balance = read;
    }
  }

  // If the read failed, don't recompute or overwrite anything — keep last known state.
  if (!readOk) return user;

  const cfg = await getMiningConfig();
  const hashRate = computeHashRate(balance, cfg as unknown as MiningConfigLike);
  const levels = await getLevels();
  const level = levelForHashRate(hashRate, levels);

  const updated = await prisma.user.update({
    where: { id: userId },
    data: {
      moonratBalance: balance,
      balanceUpdatedAt: new Date(),
      hashRate,
      minerLevelKey: level?.key ?? 'rookie',
    },
  });
  return updated;
}

async function getOrCreateSession(userId: string) {
  const existing = await prisma.miningSession.findUnique({ where: { userId } });
  if (existing) return existing;
  return prisma.miningSession.create({ data: { userId } });
}

/**
 * Lazily accrue rewards for an active session based on elapsed time since lastAccruedAt,
 * capped by sessionMaxHours (offline-earning limit). No cron needed.
 */
export async function accrueSession(userId: string) {
  const cfg = await getMiningConfig();
  const session = await getOrCreateSession(userId);
  if (!session.active || !session.lastAccruedAt) return session;

  const now = Date.now();
  const last = session.lastAccruedAt.getTime();
  const maxWindowMs = cfg.sessionMaxHours * 3600 * 1000;
  const elapsedMs = Math.min(now - last, maxWindowMs);
  const elapsedSec = Math.max(0, elapsedMs / 1000);

  const gained = computeAccrual(session.hashRateSnapshot, elapsedSec, cfg.globalRatePerSec);
  if (gained <= 0) {
    return prisma.miningSession.update({
      where: { userId },
      data: { lastAccruedAt: new Date() },
    });
  }

  const [updatedSession] = await prisma.$transaction([
    prisma.miningSession.update({
      where: { userId },
      data: { accruedUnclaimed: session.accruedUnclaimed + gained, lastAccruedAt: new Date() },
    }),
    prisma.user.update({
      where: { id: userId },
      data: { minedTotal: { increment: gained } },
    }),
  ]);
  return updatedSession;
}

export async function startMining(userId: string) {
  const user = await refreshUserHashRate(userId);
  await accrueSession(userId); // settle any prior window first
  const session = await prisma.miningSession.update({
    where: { userId },
    data: {
      active: true,
      startedAt: new Date(),
      lastAccruedAt: new Date(),
      endedAt: null,
      hashRateSnapshot: user.hashRate,
    },
  });
  return session;
}

export async function stopMining(userId: string) {
  await accrueSession(userId);
  return prisma.miningSession.update({
    where: { userId },
    data: { active: false, endedAt: new Date() },
  });
}

export async function claimRewards(userId: string) {
  const cfg = await getMiningConfig();
  await accrueSession(userId);
  const session = await prisma.miningSession.findUnique({ where: { userId } });
  if (!session || session.accruedUnclaimed <= 0) {
    return { claimed: 0, session };
  }

  // Claim cooldown check
  if (cfg.claimCooldownSec > 0) {
    const last = await prisma.claim.findFirst({
      where: { userId },
      orderBy: { createdAt: 'desc' },
    });
    if (last) {
      const sinceSec = (Date.now() - last.createdAt.getTime()) / 1000;
      if (sinceSec < cfg.claimCooldownSec) {
        const wait = Math.ceil(cfg.claimCooldownSec - sinceSec);
        const err = new Error('claim_cooldown');
        (err as any).retryAfter = wait;
        throw err;
      }
    }
  }

  const amount = session.accruedUnclaimed;

  // Exactly-once credit. The guard below is the ONLY thing that moves money — do not
  // "simplify" it into an unconditional update. Two concurrent claims both read `amount`;
  // the conditional decrement can succeed for only ONE of them (the row no longer has
  // `>= amount` pending after the first wins), so we never double-credit.
  const claimed = await prisma.$transaction(async (tx) => {
    const guard = await tx.miningSession.updateMany({
      where: { userId, accruedUnclaimed: { gte: amount } },
      data: { accruedUnclaimed: { decrement: amount }, lastAccruedAt: new Date() },
    });
    if (guard.count !== 1) return 0; // lost the race — another claim already took it
    await tx.claim.create({ data: { userId, amount, status: 'credited' } });
    await tx.vaultTransaction.create({
      data: { userId, type: 'mining_claim', amount, note: 'Mining rewards claimed' },
    });
    await tx.user.update({
      where: { id: userId },
      data: { claimedTotal: { increment: amount }, vaultBalance: { increment: amount } },
    });
    return amount;
  });

  const updatedSession = await prisma.miningSession.findUnique({ where: { userId } });
  return { claimed, session: updatedSession };
}

/**
 * Full mining snapshot for the Mine screen.
 */
export async function getMiningState(userId: string) {
  await accrueSession(userId);
  const [user, session, cfg, levels] = await Promise.all([
    prisma.user.findUnique({ where: { id: userId } }),
    prisma.miningSession.findUnique({ where: { userId } }),
    getMiningConfig(),
    getLevels(),
  ]);
  if (!user) throw new Error('user_not_found');

  const level = levelForHashRate(user.hashRate, levels);
  const levelIndex = levels.findIndex((l) => l.key === level?.key);
  const nextLevel = levels[levelIndex + 1] ?? null;

  // Progress toward next level by hashRate
  let levelProgress = 1;
  if (nextLevel) {
    const span = nextLevel.minHashRate - (level?.minHashRate ?? 0);
    levelProgress = span > 0 ? Math.min(1, (user.hashRate - (level?.minHashRate ?? 0)) / span) : 0;
  }

  // Current mining rate in tokens/hour for display
  const ratePerHour = session?.active
    ? (session.hashRateSnapshot || user.hashRate) * cfg.globalRatePerSec * 3600
    : user.hashRate * cfg.globalRatePerSec * 3600;

  return {
    balance: user.moonratBalance,
    balanceUpdatedAt: user.balanceUpdatedAt,
    hashRate: user.hashRate,
    ratePerHour,
    ratePerSec: (session?.active ? session.hashRateSnapshot : user.hashRate) * cfg.globalRatePerSec,
    mining: session?.active ?? false,
    startedAt: session?.startedAt ?? null,
    pending: session?.accruedUnclaimed ?? 0,
    minedTotal: user.minedTotal,
    claimedTotal: user.claimedTotal,
    vaultBalance: user.vaultBalance,
    walletConnected: !!user.walletAddress,
    walletAddress: user.walletAddress,
    level: level
      ? { key: level.key, name: level.name, icon: level.icon, order: level.order }
      : null,
    nextLevel: nextLevel
      ? { key: nextLevel.key, name: nextLevel.name, icon: nextLevel.icon, minHashRate: nextLevel.minHashRate }
      : null,
    levelProgress,
    sessionMaxHours: cfg.sessionMaxHours,
    buyUrl: config.buyUrl,
  };
}
