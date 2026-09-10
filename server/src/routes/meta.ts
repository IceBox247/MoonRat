import { Router } from 'express';
import { prisma } from '../db';
import { config } from '../config';

export const metaRouter = Router();

// Public-ish metadata used across the app (levels ladder, buy link, token settings).
metaRouter.get('/config', async (_req, res) => {
  const [levels, settings] = await Promise.all([
    prisma.minerLevel.findMany({ orderBy: { order: 'asc' } }),
    prisma.appSetting.findMany(),
  ]);
  const settingsMap: Record<string, string> = {};
  for (const s of settings) settingsMap[s.key] = s.value;

  res.json({
    buyUrl: config.buyUrl,
    tonConnectManifestHint: '/tonconnect-manifest.json',
    levels: levels.map((l) => ({
      key: l.key,
      name: l.name,
      order: l.order,
      minHashRate: l.minHashRate,
      icon: l.icon,
      perks: safeJson(l.perksJson),
    })),
    token: {
      symbol: settingsMap.token_symbol ?? 'MOONRAT',
      name: settingsMap.token_name ?? 'Moonrat',
      jettonMaster: config.ton.jettonMaster || null,
      provider: config.ton.provider,
    },
  });
});

function safeJson(s: string): unknown {
  try {
    return JSON.parse(s);
  } catch {
    return [];
  }
}
