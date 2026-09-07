import { Router } from 'express';
import { requireUser, type AuthedRequest } from '../auth/jwt.js';
import { getMiningState, startMining, stopMining, claimRewards } from '../mining/service.js';

export const miningRouter = Router();
miningRouter.use(requireUser);

miningRouter.get('/', async (req: AuthedRequest, res) => {
  const state = await getMiningState(req.user!.uid);
  res.json(state);
});

miningRouter.post('/start', async (req: AuthedRequest, res) => {
  await startMining(req.user!.uid);
  const state = await getMiningState(req.user!.uid);
  res.json(state);
});

miningRouter.post('/stop', async (req: AuthedRequest, res) => {
  await stopMining(req.user!.uid);
  const state = await getMiningState(req.user!.uid);
  res.json(state);
});

miningRouter.post('/claim', async (req: AuthedRequest, res) => {
  try {
    const result = await claimRewards(req.user!.uid);
    const state = await getMiningState(req.user!.uid);
    res.json({ claimed: result.claimed, state });
  } catch (e: any) {
    if (e?.message === 'claim_cooldown') {
      return res.status(429).json({ error: 'claim_cooldown', retryAfter: e.retryAfter });
    }
    throw e;
  }
});
