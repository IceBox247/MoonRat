import 'dotenv/config';

function bool(v: string | undefined, def = false): boolean {
  if (v === undefined) return def;
  return ['1', 'true', 'yes', 'on'].includes(v.toLowerCase());
}

export const config = {
  port: Number(process.env.PORT ?? 4000),
  nodeEnv: process.env.NODE_ENV ?? 'development',
  isProd: process.env.NODE_ENV === 'production',
  corsOrigins: (process.env.CORS_ORIGINS ?? 'http://localhost:5173,http://localhost:5174')
    .split(',')
    .map((s) => s.trim())
    .filter(Boolean),

  jwtSecret: process.env.JWT_SECRET ?? 'dev-secret',
  telegramBotToken: process.env.TELEGRAM_BOT_TOKEN ?? '',
  allowDevAuth: bool(process.env.ALLOW_DEV_AUTH, true),

  admin: {
    username: process.env.ADMIN_USERNAME ?? 'admin',
    password: process.env.ADMIN_PASSWORD ?? 'moonrat-admin',
    jwtSecret: process.env.ADMIN_JWT_SECRET ?? 'dev-admin-secret',
  },

  ton: {
    provider: (process.env.TON_BALANCE_PROVIDER ?? 'mock') as 'mock' | 'tonapi',
    jettonMaster: process.env.MOONRAT_JETTON_MASTER ?? '',
    jettonDecimals: Number(process.env.MOONRAT_JETTON_DECIMALS ?? 9),
    tonapiBase: process.env.TONAPI_BASE ?? 'https://tonapi.io',
    tonapiKey: process.env.TONAPI_KEY ?? '',
  },

  buyUrl: process.env.MOONRAT_BUY_URL ?? 'https://app.ston.fi/swap',
};
