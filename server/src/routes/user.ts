import { Router } from 'express';
import { z } from 'zod';
import { prisma } from '../db.js';
import { requireUser, type AuthedRequest } from '../auth/jwt.js';
import { refreshUserHashRate, getLevels, levelForHashRate } from '../mining/service.js';

export const userRouter = Router();

userRouter.get('/me', requireUser, async (req: AuthedRequest, res) => {
  const user = await prisma.user.findUnique({ where: { id: req.user!.uid } });
  if (!user) return res.status(404).json({ error: 'not_found' });
  const levels = await getLevels();
  const level = levelForHashRate(user.hashRate, levels);
  const referralCount = await prisma.user.count({ where: { referredByCode: user.referralCode } });

  res.json({
    id: user.id,
    telegramId: user.telegramId,
    username: user.username,
    firstName: user.firstName,
    photoUrl: user.photoUrl,
    walletAddress: user.walletAddress,
    moonratBalance: user.moonratBalance,
    hashRate: user.hashRate,
    minedTotal: user.minedTotal,
    claimedTotal: user.claimedTotal,
    vaultBalance: user.vaultBalance,
    referralCode: user.referralCode,
    referralCount,
    level: level ? { key: level.key, name: level.name, icon: level.icon, order: level.order } : null,
    createdAt: user.createdAt,
  });
});

const connectSchema = z.object({ walletAddress: z.string().min(10).max(120) });

userRouter.post('/wallet/connect', requireUser, async (req: AuthedRequest, res) => {
  const parsed = connectSchema.safeParse(req.body);
  if (!parsed.success) return res.status(400).json({ error: 'bad_request' });
  await prisma.user.update({
    where: { id: req.user!.uid },
    data: { walletAddress: parsed.data.walletAddress },
  });
  const user = await refreshUserHashRate(req.user!.uid);
  res.json({
    walletAddress: user.walletAddress,
    moonratBalance: user.moonratBalance,
    hashRate: user.hashRate,
    minerLevelKey: user.minerLevelKey,
  });
});

userRouter.post('/wallet/disconnect', requireUser, async (req: AuthedRequest, res) => {
  await prisma.user.update({
    where: { id: req.user!.uid },
    data: { walletAddress: null },
  });
  const user = await refreshUserHashRate(req.user!.uid);
  res.json({ walletAddress: null, moonratBalance: user.moonratBalance, hashRate: user.hashRate });
});

userRouter.post('/wallet/refresh', requireUser, async (req: AuthedRequest, res) => {
  const user = await refreshUserHashRate(req.user!.uid);
  res.json({
    walletAddress: user.walletAddress,
    moonratBalance: user.moonratBalance,
    hashRate: user.hashRate,
    minerLevelKey: user.minerLevelKey,
    balanceUpdatedAt: user.balanceUpdatedAt,
  });
});
