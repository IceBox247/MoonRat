# Moonrat — Architecture

```
MoonRat/
├── server/                  # Node + Express + Prisma API (source of truth)
│   ├── prisma/schema.prisma # DB schema (SQLite dev / Postgres prod)
│   └── src/
│       ├── index.ts         # app bootstrap
│       ├── config.ts        # env config
│       ├── db.ts            # Prisma client
│       ├── auth/            # Telegram initData validation + JWT
│       ├── mining/          # mining engine + pluggable formula
│       ├── ton/             # balance providers (mock + TonAPI)
│       ├── routes/          # /api/* endpoints (miniapp) + /api/admin/*
│       └── seed.ts          # seed config, levels, chapters, milestones
├── apps/
│   ├── miniapp/             # Player-facing Telegram Mini App (React + Vite + TS)
│   │   ├── public/assets/   # Moonrat brand art
│   │   └── src/
│   │       ├── screens/     # Mine, Expedition, Crew, Vault, Profile
│   │       ├── components/  # shared UI (nav, cards, character, etc.)
│   │       ├── lib/         # api client, telegram, tonconnect, format
│   │       └── styles/      # theme tokens + global css
│   └── admin/               # Admin dashboard (React + Vite + TS) — foundation
└── docs/                    # ARCHITECTURE.md, DECISIONS.md
```

## Data flow (mining)

1. Telegram opens the Mini App → SDK exposes signed `initData`.
2. Frontend `POST /api/auth/telegram` with `initData` → server validates HMAC → issues JWT.
3. User connects TON wallet via TON Connect → frontend `POST /api/wallet/connect` with address.
4. Server reads on-chain $MOONRAT balance (mock/TonAPI) → computes `hashRate` via the
   configurable formula → stores a `MiningSession` snapshot.
5. While mining is active, rewards accrue = `hashRate × elapsed × globalRate`. This is
   computed lazily on read (no cron needed) from `session.startedAt` + `lastAccruedAt`.
6. `POST /api/mining/claim` moves accrued → user Vault ledger + records a `Claim`.
7. Balance is refreshed on demand (`POST /api/wallet/refresh`) or on an interval; a change
   recomputes hashRate for future accrual.

## Configurability

All economic knobs live in DB tables (`MiningConfig`, `MinerLevel`, `Chapter`,
`Milestone`, `Mission`, `Announcement`, `AppSetting`) editable via `/api/admin/*`.
No redeploy needed to tune the economy.

## Tech

- **Server:** Express, Prisma, zod, jsonwebtoken, @ton/ton + tonapi for reads.
- **Frontend:** React 18, Vite, TypeScript, @tonconnect/ui-react, Telegram WebApp SDK,
  framer-motion for animations, react-router.
- **Auth:** Telegram initData HMAC (players), JWT (session), separate admin JWT+role.
