import { prisma } from '../db.js';

const ALPHABET = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';

export function makeReferralCode(len = 7): string {
  let s = '';
  for (let i = 0; i < len; i++) s += ALPHABET[Math.floor(Math.random() * ALPHABET.length)];
  return s;
}

export async function uniqueReferralCode(): Promise<string> {
  for (let i = 0; i < 10; i++) {
    const code = makeReferralCode();
    const exists = await prisma.user.findUnique({ where: { referralCode: code } });
    if (!exists) return code;
  }
  return makeReferralCode(9);
}
