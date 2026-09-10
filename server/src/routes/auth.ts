import { Router } from 'express';
import { z } from 'zod';
import { prisma } from '../db';
import { config } from '../config';
import { verifyTelegramInitData, parseDevAuth } from '../auth/telegram';
import { signUserToken } from '../auth/jwt';
import { uniqueReferralCode } from '../lib/referral';

export const authRouter = Router();

const bodySchema = z.object({
  initData: z.string().optional(),
  devAuth: z.string().optional(),
  startParam: z.string().optional(),
});

authRouter.post('/telegram', async (req, res) => {
  const parsed = bodySchema.safeParse(req.body);
  if (!parsed.success) return res.status(400).json({ error: 'bad_request' });

  const { initData, devAuth, startParam } = parsed.data;
  let verified = null;
  if (initData) verified = verifyTelegramInitData(initData);
  if (!verified && devAuth) verified = parseDevAuth(devAuth);

  if (!verified) {
    return res.status(401).json({
      error: 'auth_failed',
      hint: config.telegramBotToken
        ? 'Invalid initData signature.'
        : 'No bot token set; send devAuth JSON to use dev auth.',
    });
  }

  const tgId = String(verified.user.id);
  const refFromStart = startParam ?? verified.startParam;

  let user = await prisma.user.findUnique({ where: { telegramId: tgId } });
  if (!user) {
    const referralCode = await uniqueReferralCode();
    // Referral attribution (only on first join, can't self-refer)
    let referredByCode: string | undefined;
    if (refFromStart) {
      const inviter = await prisma.user.findUnique({ where: { referralCode: refFromStart } });
      if (inviter && inviter.telegramId !== tgId) referredByCode = refFromStart;
    }
    try {
      user = await prisma.user.create({
        data: {
          telegramId: tgId,
          username: verified.user.username,
          firstName: verified.user.first_name,
          lastName: verified.user.last_name,
          photoUrl: verified.user.photo_url,
          languageCode: verified.user.language_code,
          referralCode,
          referredByCode,
        },
      });
    } catch (e: any) {
      // Concurrent first-login (e.g. double-fired request) can race on telegramId.
      if (e?.code === 'P2002') {
        user = await prisma.user.findUnique({ where: { telegramId: tgId } });
      } else {
        throw e;
      }
    }
    if (user) {
      // Idempotent session creation (safe under the same race).
      await prisma.miningSession.upsert({
        where: { userId: user.id },
        update: {},
        create: { userId: user.id },
      });
    }
  } else {
    user = await prisma.user.update({
      where: { id: user.id },
      data: {
        username: verified.user.username ?? user.username,
        firstName: verified.user.first_name ?? user.firstName,
        photoUrl: verified.user.photo_url ?? user.photoUrl,
        lastSeenAt: new Date(),
      },
    });
  }

  if (!user) return res.status(500).json({ error: 'user_create_failed' });
  if (user.isBanned) return res.status(403).json({ error: 'banned' });

  const token = signUserToken({ uid: user.id, tg: user.telegramId });
  res.json({
    token,
    user: {
      id: user.id,
      telegramId: user.telegramId,
      username: user.username,
      firstName: user.firstName,
      photoUrl: user.photoUrl,
      referralCode: user.referralCode,
      walletAddress: user.walletAddress,
    },
  });
});
