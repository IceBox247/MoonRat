/**
 * Demo / offline mode.
 *
 * Lets the mini app run WITHOUT a backend so the UI can be reviewed on any static
 * host (Vercel/Netlify) or previewed locally. Activated when:
 *   - VITE_DEMO=1 is set at build time, OR
 *   - a real API call fails (network unreachable) — auto-fallback.
 *
 * The same build talks to a real API when one is reachable; demo only kicks in as
 * a fallback, so this is not a separate throwaway build.
 */

export const DEMO_FORCED = import.meta.env.VITE_DEMO === '1';
let demoActive = DEMO_FORCED;
export function isDemo() {
  return demoActive;
}
export function enableDemo() {
  demoActive = true;
}

const RATE_PER_SEC = 0.12; // pleasant visible tick for the demo

const state = {
  startedAt: 0 as number, // 0 = idle
  pendingBase: 0,
  lastResolved: 0,
  minedTotal: 128_540,
  claimedTotal: 96_000,
  vaultBalance: 32_540,
  balance: 184_920,
  hashRate: 138,
  walletConnected: true,
};

function pending(): number {
  if (!state.startedAt) return state.pendingBase;
  const elapsed = (Date.now() - state.startedAt) / 1000;
  return state.pendingBase + RATE_PER_SEC * elapsed;
}

const LEVELS = [
  { key: 'rookie', name: 'Rookie Miner', order: 1, minHashRate: 0, icon: '⛏️', perks: [] },
  { key: 'scout', name: 'Tunnel Scout', order: 2, minHashRate: 40, icon: '🔦', perks: [] },
  { key: 'explorer', name: 'Vault Explorer', order: 3, minHashRate: 120, icon: '🧭', perks: [] },
  { key: 'power', name: 'Power Miner', order: 4, minHashRate: 300, icon: '⚡', perks: [] },
  { key: 'boss', name: 'Mine Boss', order: 5, minHashRate: 700, icon: '👑', perks: [] },
  { key: 'commander', name: 'Moon Commander', order: 6, minHashRate: 1500, icon: '🚀', perks: [] },
  { key: 'legend', name: 'Moon Legend', order: 7, minHashRate: 4000, icon: '🌙', perks: [] },
];

function level() {
  let cur = LEVELS[0];
  for (const l of LEVELS) if (state.hashRate >= l.minHashRate) cur = l;
  return cur;
}

function miningState() {
  const lv = level();
  const idx = LEVELS.findIndex((l) => l.key === lv.key);
  const next = LEVELS[idx + 1] ?? null;
  let levelProgress = 1;
  if (next) {
    const span = next.minHashRate - lv.minHashRate;
    levelProgress = span > 0 ? Math.min(1, (state.hashRate - lv.minHashRate) / span) : 0;
  }
  return {
    balance: state.balance,
    hashRate: state.hashRate,
    ratePerHour: RATE_PER_SEC * 3600,
    ratePerSec: RATE_PER_SEC,
    mining: !!state.startedAt,
    pending: pending(),
    minedTotal: state.minedTotal,
    claimedTotal: state.claimedTotal,
    vaultBalance: state.vaultBalance,
    walletConnected: state.walletConnected,
    walletAddress: state.walletConnected ? 'EQDemoWa11etMoonratExplorer000000000000000' : null,
    level: { key: lv.key, name: lv.name, icon: lv.icon, order: lv.order },
    nextLevel: next ? { key: next.key, name: next.name, icon: next.icon, minHashRate: next.minHashRate } : null,
    levelProgress,
    sessionMaxHours: 8,
    buyUrl: 'https://app.ston.fi/swap',
  };
}

export function demoResponse(path: string, method: string): any {
  const p = path.replace(/^\/api/, '');

  if (p === '/auth/telegram') {
    return { token: 'demo-token', user: { id: 'demo', firstName: 'Explorer', username: 'moonminer', referralCode: 'MOONDEMO' } };
  }
  if (p === '/me') {
    const lv = level();
    return {
      id: 'demo', telegramId: '000', username: 'moonminer', firstName: 'Explorer', photoUrl: null,
      walletAddress: state.walletConnected ? 'EQDemoWa11etMoonratExplorer000000000000000' : null,
      moonratBalance: state.balance, hashRate: state.hashRate, minedTotal: state.minedTotal,
      claimedTotal: state.claimedTotal, vaultBalance: state.vaultBalance, referralCode: 'MOONDEMO',
      referralCount: 12, level: { key: lv.key, name: lv.name, icon: lv.icon, order: lv.order },
      createdAt: new Date().toISOString(),
    };
  }
  if (p === '/meta/config') {
    return {
      buyUrl: 'https://app.ston.fi/swap',
      levels: LEVELS,
      token: { symbol: 'MOONRAT', name: 'Moonrat', jettonMaster: null, provider: 'mock' },
    };
  }
  if (p === '/mining' && method === 'GET') return miningState();
  if (p === '/mining/start') {
    state.pendingBase = pending();
    state.startedAt = Date.now();
    return miningState();
  }
  if (p === '/mining/stop') {
    state.pendingBase = pending();
    state.startedAt = 0;
    return miningState();
  }
  if (p === '/mining/claim') {
    const amt = pending();
    state.pendingBase = 0;
    if (state.startedAt) state.startedAt = Date.now();
    state.claimedTotal += amt;
    state.vaultBalance += amt;
    return { claimed: amt, state: miningState() };
  }
  if (p === '/wallet/connect') {
    state.walletConnected = true;
    return { walletAddress: 'EQDemoWa11etMoonratExplorer000000000000000', moonratBalance: state.balance, hashRate: state.hashRate, minerLevelKey: level().key };
  }
  if (p === '/wallet/disconnect') {
    state.walletConnected = false;
    return { walletAddress: null, moonratBalance: state.balance, hashRate: state.hashRate };
  }
  if (p === '/wallet/refresh') {
    return { walletAddress: 'EQDemoWa11etMoonratExplorer000000000000000', moonratBalance: state.balance, hashRate: state.hashRate, minerLevelKey: level().key, balanceUpdatedAt: new Date().toISOString() };
  }
  if (p === '/expedition') {
    return {
      chapters: [
        { key: 'ch1', order: 1, title: 'Chapter 1 — The Signal', subtitle: 'A strange signal pulses beneath the TON network.', body: 'Moonrat picks up a signal echoing from deep below the chain. The expedition begins.', imageKey: 'signal', status: 'active' },
        { key: 'ch2', order: 2, title: 'Chapter 2 — The Mine', subtitle: 'Descend into the glowing tunnels.', body: 'The signal leads to an ancient mine full of glowing crystals.', imageKey: 'mine', status: 'active' },
        { key: 'ch3', order: 3, title: 'Chapter 3 — The Vault', subtitle: 'Locked until 50,000 miners join.', body: 'A sealed vault waits at the mine’s heart.', imageKey: 'vault', status: 'locked' },
        { key: 'ch4', order: 4, title: 'Chapter 4 — The Coordinates', subtitle: 'The final path to the Moon.', body: 'Hidden coordinates. Where do they lead?', imageKey: 'coordinates', status: 'locked' },
      ],
      milestones: [
        { key: 'miners_50k', title: '50,000 Miners', description: 'Something is waiting at 50,000.', current: 37492, target: 50000, unit: 'Miners', reached: false, progress: 37492 / 50000 },
        { key: 'crystals_1m', title: '1,000,000 Crystals Mined', description: 'The mine glows brighter with every crystal.', current: 412300, target: 1000000, unit: 'Crystals', reached: false, progress: 0.4123 },
      ],
      missions: [
        { key: 'connect_wallet', title: 'Connect your TON wallet', description: 'Link a wallet to reveal your Mining Power.', type: 'action', target: 1, reward: 250, progress: 1, completed: true, claimed: false },
        { key: 'start_mining', title: 'Start your first mining run', description: 'Fire up the drill and mine $MOONRAT.', type: 'action', target: 1, reward: 250, progress: 1, completed: true, claimed: false },
        { key: 'invite_3', title: 'Recruit 3 crew members', description: 'Bring 3 friends into the expedition.', type: 'referral', target: 3, reward: 1000, progress: 2, completed: false, claimed: false },
        { key: 'hold_10k', title: 'Hold 10,000 $MOONRAT', description: 'Boost your Hash Rate by holding more.', type: 'hold', target: 10000, reward: 1500, progress: 1, completed: true, claimed: false },
      ],
      announcements: [
        { id: 'a1', title: 'The expedition has begun ⛏️', body: 'Welcome, miner. Connect your wallet, hold $MOONRAT, and dig toward the vault. Small rat. Big dreams.', pinned: true, createdAt: new Date().toISOString() },
      ],
    };
  }
  if (p === '/crew') {
    return {
      referralCode: 'MOONDEMO', inviteLink: 'https://t.me/MoonratBot?start=MOONDEMO',
      totalReferrals: 12, activeMiners: 7, referralRewards: 6000, referralRewardPerMiner: 500,
      crew: Array.from({ length: 6 }).map((_, i) => ({
        id: 'c' + i, name: ['Nova', 'Pixel', 'Yuki', 'Bolt', 'Ash', 'Rex'][i], photoUrl: null,
        hashRate: [220, 90, 310, 45, 160, 70][i], minerLevelKey: 'scout',
        joinedAt: new Date(Date.now() - i * 86400000).toISOString(),
      })),
      buyUrl: 'https://app.ston.fi/swap',
    };
  }
  if (p === '/vault') {
    return {
      vaultBalance: state.vaultBalance, claimedTotal: state.claimedTotal, minedTotal: state.minedTotal,
      transactions: [
        { id: 't1', type: 'mining_claim', amount: 1240.5, note: 'Mining rewards claimed', createdAt: new Date(Date.now() - 3600000).toISOString() },
        { id: 't2', type: 'referral_reward', amount: 500, note: 'Crew reward', createdAt: new Date(Date.now() - 7200000).toISOString() },
        { id: 't3', type: 'mission_reward', amount: 250, note: 'Mission reward', createdAt: new Date(Date.now() - 90000000).toISOString() },
      ],
      claims: [
        { id: 'cl1', amount: 1240.5, status: 'credited', txHash: null, createdAt: new Date(Date.now() - 3600000).toISOString() },
      ],
    };
  }
  // default
  return {};
}
