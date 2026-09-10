import { Router } from 'express';
import { z } from 'zod';
import { prisma } from '../db';
import { config } from '../config';
import { requireAdmin, signAdminToken, type AuthedRequest } from '../auth/jwt';

export const adminRouter = Router();

// ---- Login (bootstrap credentials from env for the foundation) ----
adminRouter.post('/login', async (req, res) => {
  const schema = z.object({ username: z.string(), password: z.string() });
  const parsed = schema.safeParse(req.body);
  if (!parsed.success) return res.status(400).json({ error: 'bad_request' });
  const { username, password } = parsed.data;
  if (username !== config.admin.username || password !== config.admin.password) {
    return res.status(401).json({ error: 'invalid_credentials' });
  }
  const token = signAdminToken({ aid: 'root', username, role: 'superadmin' });
  res.json({ token, admin: { username, role: 'superadmin' } });
});

// Everything below requires an admin token.
adminRouter.use(requireAdmin);

adminRouter.get('/overview', async (_req: AuthedRequest, res) => {
  const [users, activeMiners, totalMined, totalClaimed, chapters, missions] = await Promise.all([
    prisma.user.count(),
    prisma.miningSession.count({ where: { active: true } }),
    prisma.user.aggregate({ _sum: { minedTotal: true } }),
    prisma.user.aggregate({ _sum: { claimedTotal: true } }),
    prisma.chapter.count(),
    prisma.mission.count(),
  ]);
  res.json({
    users,
    activeMiners,
    totalMined: totalMined._sum.minedTotal ?? 0,
    totalClaimed: totalClaimed._sum.claimedTotal ?? 0,
    chapters,
    missions,
  });
});

// ---- Mining config (the economy knobs) ----
adminRouter.get('/mining-config', async (_req, res) => {
  const cfg = await prisma.miningConfig.upsert({
    where: { id: 'singleton' },
    update: {},
    create: { id: 'singleton' },
  });
  res.json(cfg);
});

adminRouter.put('/mining-config', async (req, res) => {
  const schema = z.object({
    strategy: z.enum(['linear', 'sqrt', 'log', 'tiered']).optional(),
    baseHashRate: z.number().optional(),
    holdingsFactor: z.number().optional(),
    balanceUnit: z.number().positive().optional(),
    globalRatePerSec: z.number().optional(),
    maxHashRate: z.number().optional(),
    claimCooldownSec: z.number().int().optional(),
    sessionMaxHours: z.number().optional(),
    tiersJson: z.string().optional(),
  });
  const parsed = schema.safeParse(req.body);
  if (!parsed.success) return res.status(400).json({ error: 'bad_request', issues: parsed.error.issues });
  const cfg = await prisma.miningConfig.update({ where: { id: 'singleton' }, data: parsed.data });
  res.json(cfg);
});

// ---- Generic CRUD helpers for simple config entities ----
function crud(model: any, idField = 'id') {
  const r = Router();
  r.get('/', async (_req, res) => res.json(await model.findMany({ orderBy: { order: 'asc' } }).catch(() => model.findMany())));
  r.post('/', async (req, res) => res.json(await model.create({ data: req.body })));
  r.put('/:id', async (req, res) =>
    res.json(await model.update({ where: { [idField]: req.params.id }, data: req.body }))
  );
  r.delete('/:id', async (req, res) => {
    await model.delete({ where: { [idField]: req.params.id } });
    res.json({ ok: true });
  });
  return r;
}

adminRouter.use('/levels', crud(prisma.minerLevel));
adminRouter.use('/chapters', crud(prisma.chapter));
adminRouter.use('/milestones', crud(prisma.milestone));
adminRouter.use('/missions', crud(prisma.mission));
adminRouter.use('/announcements', crud(prisma.announcement));

// ---- App settings (KV) ----
adminRouter.get('/settings', async (_req, res) => {
  res.json(await prisma.appSetting.findMany());
});
adminRouter.put('/settings/:key', async (req, res) => {
  const value = String(req.body?.value ?? '');
  const s = await prisma.appSetting.upsert({
    where: { key: req.params.key },
    update: { value },
    create: { key: req.params.key, value },
  });
  res.json(s);
});

// ---- Users ----
adminRouter.get('/users', async (req, res) => {
  const take = Math.min(Number(req.query.take ?? 50), 200);
  const users = await prisma.user.findMany({ orderBy: { createdAt: 'desc' }, take });
  res.json(users);
});
adminRouter.patch('/users/:id', async (req, res) => {
  const schema = z.object({ isBanned: z.boolean().optional(), vaultBalance: z.number().optional() });
  const parsed = schema.safeParse(req.body);
  if (!parsed.success) return res.status(400).json({ error: 'bad_request' });
  const user = await prisma.user.update({ where: { id: req.params.id }, data: parsed.data });
  res.json(user);
});
