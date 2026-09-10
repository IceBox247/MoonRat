import { prisma } from './db';

async function main() {
  console.log('🌱 Seeding Moonrat...');

  // ---- Mining config (placeholder economy — tune in admin) ----
  await prisma.miningConfig.upsert({
    where: { id: 'singleton' },
    update: {},
    create: {
      id: 'singleton',
      strategy: 'sqrt',
      baseHashRate: 10,
      holdingsFactor: 1.0,
      balanceUnit: 1000,
      globalRatePerSec: 0.00027, // ~1 MOONRAT/hr per ~1000 hashrate — placeholder
      maxHashRate: 100000,
      claimCooldownSec: 0,
      sessionMaxHours: 8,
      tiersJson: JSON.stringify([
        { minBalance: 0, hashRate: 0 },
        { minBalance: 10000, hashRate: 50 },
        { minBalance: 100000, hashRate: 250 },
        { minBalance: 1000000, hashRate: 1000 },
      ]),
    },
  });

  // ---- Miner levels (placeholder thresholds by hashRate) ----
  const levels = [
    { key: 'rookie', name: 'Rookie Miner', order: 1, minHashRate: 0, icon: '⛏️' },
    { key: 'scout', name: 'Tunnel Scout', order: 2, minHashRate: 40, icon: '🔦' },
    { key: 'explorer', name: 'Vault Explorer', order: 3, minHashRate: 120, icon: '🧭' },
    { key: 'power', name: 'Power Miner', order: 4, minHashRate: 300, icon: '⚡' },
    { key: 'boss', name: 'Mine Boss', order: 5, minHashRate: 700, icon: '👑' },
    { key: 'commander', name: 'Moon Commander', order: 6, minHashRate: 1500, icon: '🚀' },
    { key: 'legend', name: 'Moon Legend', order: 7, minHashRate: 4000, icon: '🌙' },
  ];
  for (const l of levels) {
    await prisma.minerLevel.upsert({ where: { key: l.key }, update: l, create: l });
  }

  // ---- Milestones ----
  const milestones = [
    {
      key: 'miners_50k',
      order: 1,
      title: '50,000 Miners',
      description: 'Something is waiting at 50,000.',
      current: 37492,
      target: 50000,
      unit: 'Miners',
    },
    {
      key: 'crystals_1m',
      order: 2,
      title: '1,000,000 Crystals Mined',
      description: 'The mine glows brighter with every crystal.',
      current: 412300,
      target: 1000000,
      unit: 'Crystals',
    },
  ];
  for (const m of milestones) {
    await prisma.milestone.upsert({ where: { key: m.key }, update: m, create: m });
  }

  // ---- Chapters ----
  const chapters = [
    {
      key: 'ch1',
      order: 1,
      title: 'Chapter 1 — The Signal',
      subtitle: 'A strange signal pulses beneath the TON network.',
      body: 'Moonrat picks up a signal echoing from deep below the chain. It hums with an energy no rat has ever felt. The expedition begins.',
      status: 'active',
      unlockType: 'none',
      imageKey: 'signal',
    },
    {
      key: 'ch2',
      order: 2,
      title: 'Chapter 2 — The Mine',
      subtitle: 'Descend into the glowing tunnels.',
      body: 'The signal leads to an ancient mine full of glowing crystals. Every miner who joins makes the dig go deeper.',
      status: 'active',
      unlockType: 'none',
      imageKey: 'mine',
    },
    {
      key: 'ch3',
      order: 3,
      title: 'Chapter 3 — The Vault',
      subtitle: 'Locked until 50,000 miners join.',
      body: 'Rumors speak of a sealed vault at the mine’s heart. It will only open when the crew is strong enough.',
      status: 'locked',
      unlockType: 'milestone',
      milestoneKey: 'miners_50k',
      imageKey: 'vault',
    },
    {
      key: 'ch4',
      order: 4,
      title: 'Chapter 4 — The Coordinates',
      subtitle: 'The final path to the Moon.',
      body: 'Hidden in the vault are coordinates. Where do they lead? Only the strongest expedition will find out.',
      status: 'locked',
      unlockType: 'milestone',
      milestoneKey: 'crystals_1m',
      imageKey: 'coordinates',
    },
  ];
  for (const c of chapters) {
    await prisma.chapter.upsert({ where: { key: c.key }, update: c, create: c });
  }

  // ---- Missions ----
  const missions = [
    { key: 'connect_wallet', order: 1, chapterKey: 'ch1', title: 'Connect your TON wallet', description: 'Link a wallet to reveal your Mining Power.', type: 'action', target: 1, reward: 250 },
    { key: 'start_mining', order: 2, chapterKey: 'ch2', title: 'Start your first mining run', description: 'Fire up the drill and mine $MOONRAT.', type: 'action', target: 1, reward: 250 },
    { key: 'invite_3', order: 3, chapterKey: 'ch2', title: 'Recruit 3 crew members', description: 'Bring 3 friends into the expedition.', type: 'referral', target: 3, reward: 1000 },
    { key: 'hold_10k', order: 4, chapterKey: 'ch3', title: 'Hold 10,000 $MOONRAT', description: 'Boost your Hash Rate by holding more.', type: 'hold', target: 10000, reward: 1500 },
  ];
  for (const m of missions) {
    await prisma.mission.upsert({ where: { key: m.key }, update: m, create: m });
  }

  // ---- Announcements ----
  await prisma.announcement.deleteMany({});
  await prisma.announcement.create({
    data: {
      title: 'The expedition has begun ⛏️',
      body: 'Welcome, miner. Connect your wallet, hold $MOONRAT, and dig toward the vault. Small rat. Big dreams.',
      pinned: true,
    },
  });

  // ---- App settings ----
  const settings: Record<string, string> = {
    token_symbol: 'MOONRAT',
    token_name: 'Moonrat',
    referral_reward: '500',
    bot_username: 'MoonratBot',
  };
  for (const [key, value] of Object.entries(settings)) {
    await prisma.appSetting.upsert({ where: { key }, update: { value }, create: { key, value } });
  }

  console.log('✅ Seed complete.');
}

main()
  .then(() => prisma.$disconnect())
  .catch(async (e) => {
    console.error(e);
    await prisma.$disconnect();
    process.exit(1);
  });
