import crypto from 'node:crypto';
import { config } from '../config.js';

export interface TelegramUser {
  id: number;
  first_name?: string;
  last_name?: string;
  username?: string;
  language_code?: string;
  photo_url?: string;
}

export interface VerifiedInitData {
  user: TelegramUser;
  startParam?: string;
}

/**
 * Validate Telegram Mini App initData per the official algorithm:
 * secret = HMAC_SHA256("WebAppData", bot_token)
 * check  = HMAC_SHA256(data_check_string, secret) === hash
 */
export function verifyTelegramInitData(initData: string): VerifiedInitData | null {
  const params = new URLSearchParams(initData);
  const hash = params.get('hash');
  if (!hash) return null;

  const authDate = Number(params.get('auth_date') ?? 0);
  // Reject very old payloads (24h) to limit replay.
  if (authDate && Date.now() / 1000 - authDate > 86400) return null;

  const pairs: string[] = [];
  params.forEach((value, key) => {
    if (key === 'hash') return;
    pairs.push(`${key}=${value}`);
  });
  pairs.sort();
  const dataCheckString = pairs.join('\n');

  const secretKey = crypto.createHmac('sha256', 'WebAppData').update(config.telegramBotToken).digest();
  const computed = crypto.createHmac('sha256', secretKey).update(dataCheckString).digest('hex');

  if (computed !== hash) return null;

  const userRaw = params.get('user');
  if (!userRaw) return null;
  let user: TelegramUser;
  try {
    user = JSON.parse(userRaw);
  } catch {
    return null;
  }
  return { user, startParam: params.get('start_param') ?? undefined };
}

/**
 * Dev fallback: accept an unsigned payload when no bot token is set and ALLOW_DEV_AUTH=true.
 * Payload: JSON string with { id, first_name, username, start_param? }.
 */
export function parseDevAuth(devPayload: string): VerifiedInitData | null {
  if (!config.allowDevAuth || config.telegramBotToken) return null;
  try {
    const obj = JSON.parse(devPayload);
    if (!obj?.id) return null;
    return {
      user: {
        id: Number(obj.id),
        first_name: obj.first_name ?? 'Miner',
        username: obj.username,
        photo_url: obj.photo_url,
        language_code: obj.language_code,
      },
      startParam: obj.start_param,
    };
  } catch {
    return null;
  }
}
