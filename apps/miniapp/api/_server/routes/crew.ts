import { Router } from 'express';
import { prisma } from '../db';
import { config } from '../config';
import { requireUser, type AuthedRequest } from '../auth/jwt';

export const crewRouter = Router();
crewRouter.use(requireUser);

crewRouter.get('/', async (req: AuthedRequest, res) => {
  const user = await prisma.user.findUnique({ where: { id: req.user!.uid } });
  if (!user) return res.status(404).json({ error: 'not_found' });

  const referrals = await prisma.user.findMany({
    where: { referredByCode: user.referralCode },
    orderBy: { createdAt: 'desc' },
    take: 100,
  });

  const activeMiners = await prisma.miningSession.count({
    where: { active: true, user: { referredByCode: user.referralCode } },
  });

  const referralRewards = await prisma.vaultTransaction.aggregate({
    where: { userId: user.id, type: 'referral_reward' },
    _sum: { amount: true },
  });

  const botUsername = (await prisma.appSetting.findUnique({ where: { key: 'bot_username' } }))?.value ?? 'MoonratBot';

  res.json({
    referralCode: user.referralCode,
    inviteLink: `https://t.me/${botUsername}?start=${user.referralCode}`,
    totalReferrals: referrals.length,
    activeMiners,
    referralRewards: referralRewards._sum.amount ?? 0,
    referralRewardPerMiner: Number(
      (await prisma.appSetting.findUnique({ where: { key: 'referral_reward' } }))?.value ?? 500
    ),
    crew: referrals.map((r) => ({
      id: r.id,
      name: r.firstName ?? r.username ?? 'Miner',
      photoUrl: r.photoUrl,
      hashRate: r.hashRate,
      minerLevelKey: r.minerLevelKey,
      joinedAt: r.createdAt,
    })),
    buyUrl: config.buyUrl,
  });
});
