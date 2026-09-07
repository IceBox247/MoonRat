import { Router } from 'express';
import { prisma } from '../db.js';
import { requireUser, type AuthedRequest } from '../auth/jwt.js';

export const vaultRouter = Router();
vaultRouter.use(requireUser);

vaultRouter.get('/', async (req: AuthedRequest, res) => {
  const user = await prisma.user.findUnique({ where: { id: req.user!.uid } });
  if (!user) return res.status(404).json({ error: 'not_found' });

  const [transactions, claims] = await Promise.all([
    prisma.vaultTransaction.findMany({
      where: { userId: user.id },
      orderBy: { createdAt: 'desc' },
      take: 50,
    }),
    prisma.claim.findMany({ where: { userId: user.id }, orderBy: { createdAt: 'desc' }, take: 50 }),
  ]);

  res.json({
    vaultBalance: user.vaultBalance,
    claimedTotal: user.claimedTotal,
    minedTotal: user.minedTotal,
    transactions: transactions.map((t) => ({
      id: t.id,
      type: t.type,
      amount: t.amount,
      note: t.note,
      createdAt: t.createdAt,
    })),
    claims: claims.map((c) => ({
      id: c.id,
      amount: c.amount,
      status: c.status,
      txHash: c.txHash,
      createdAt: c.createdAt,
    })),
  });
});
