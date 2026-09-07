# 🐀 Moonrat — Telegram Mini App

> **MINE • HOLD • EXPLORE** — a story-driven meme-token mining game on TON.

Moonrat is a small adventurous rat who found a mysterious mine beneath the TON network.
Players join the expedition as **Miners** and mine **$MOONRAT** for free inside Telegram.

**The core mechanic:** the amount of $MOONRAT you hold in your connected TON wallet
determines your **Mining Power / Hash Rate**. Hold more → mine faster. You never pay us to
increase your rate — it's read from your on-chain balance.

---

## Monorepo layout

| Path            | What it is                                                    |
| --------------- | ------------------------------------------------------------ |
| `server/`       | Node + Express + Prisma API. Source of truth for the economy.|
| `apps/miniapp/` | The player-facing Telegram Mini App (React + Vite).          |
| `apps/admin/`   | Admin dashboard (React + Vite).                              |
| `docs/`         | `ARCHITECTURE.md`, `DECISIONS.md` (read these).             |

## Quick start

```bash
# 1. Install everything (npm workspaces)
npm install

# 2. Configure the server
cp server/.env.example server/.env        # defaults work out of the box (SQLite + mock TON + dev auth)

# 3. Create the DB + seed levels/chapters/config
npm run db:setup --workspace=server

# 4. Run it (3 terminals, or use the combined dev script)
npm run dev:server      # API on :4000
npm run dev:miniapp     # Mini App on :5173
npm run dev:admin       # Admin on :5174  (login: admin / moonrat-admin)
```

Open the Mini App at **http://localhost:5173**. Outside Telegram it uses a **dev identity**
automatically, so you can develop in a normal browser. Balances come from a deterministic
**mock** provider until the real jetton address is set.

## Going live checklist

1. **Telegram:** set `TELEGRAM_BOT_TOKEN` in `server/.env` and `ALLOW_DEV_AUTH=false`.
   Register the Mini App URL with @BotFather.
2. **TON:** set `TON_BALANCE_PROVIDER=tonapi` + `MOONRAT_JETTON_MASTER=<address>` +
   `MOONRAT_JETTON_DECIMALS`. Add a `TONAPI_KEY` for rate limits.
3. **Buy flow:** set `MOONRAT_BUY_URL` to your STON.fi/DeDust swap deep link.
4. **DB:** switch `DATABASE_URL` to Postgres and `provider` in `prisma/schema.prisma`.
5. **TON Connect:** host `apps/miniapp/public/tonconnect-manifest.json` at a public URL and
   set `VITE_TONCONNECT_MANIFEST`.
6. Change all secrets (`JWT_SECRET`, `ADMIN_*`).

## Feature status (foundation v0.1)

- ✅ Project structure + database schema
- ✅ Telegram auth (initData HMAC + dev fallback)
- ✅ Main Mini App UI (Mine / Expedition / Crew / Vault / Profile)
- ✅ TON wallet connection (TON Connect) + balance→hashrate sync
- ✅ Mining foundation: pluggable formula, off-chain accrual, claim
- ✅ Expedition/story system (chapters, milestones, missions) — admin-configurable
- ✅ Referral / Crew system
- ✅ Admin dashboard foundation (config, entities, users, settings)
- ⏳ On-chain reward settlement (awaiting tokenomics — see `docs/DECISIONS.md`)
- ⏳ Real $MOONRAT contract wiring (mock until address provided)

See **`docs/DECISIONS.md`** for the economy decisions that need your sign-off.
