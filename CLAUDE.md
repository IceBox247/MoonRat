# MOONRAT — STANDING BRIEFING FOR CLAUDE SESSIONS

Read this at the start of any session working on Moonrat.

Moonrat is a story-driven meme-token **mining game on TON**, delivered as a Telegram
Mini App. **MINE • HOLD • EXPLORE.** A user's on-chain **$MOONRAT** holdings set their
Mining Power (hash rate); they mine rewards for free and will eventually withdraw real
crypto. It is early (foundation stage) but it is heading toward the **same real-money bar
as its predecessor**: once withdrawals are live, a bad deploy costs real money and real
trust. **Correctness > speed > cleverness.** Communities call a token a scam the moment
balances or payouts look wrong.

---

## 1. STACK & LAYOUT

- **Single Vercel project:** the Mini App + the API live together in `apps/miniapp`.
  The backend is a serverless function: `apps/miniapp/api/index.ts` exports the Express
  app, whose source is `apps/miniapp/api/_server/**` (routes, mining, auth, ton). Prisma
  schema is `apps/miniapp/prisma/`. `apps/admin/` is an optional separate dashboard.
- **Server:** Node + Express + TypeScript (CommonJS), **Prisma** ORM. Dev DB = **SQLite**;
  production = **Neon Postgres** (the build runs `scripts/pg-schema.mjs` to emit a
  postgresql schema, then `prisma db push` + seed).
- **Mini App:** React 18 + Vite + TypeScript, `@tonconnect/ui-react`, Telegram WebApp SDK,
  Framer Motion.
- **Admin:** React + Vite, JWT-gated.
- **Auth:** Telegram WebApp `initData`, HMAC-verified server-side (`server/src/auth`).
- **Chain reads:** `server/src/ton/balanceProvider.ts` — `mock` (dev) or `tonapi`
  (production; toncenter fallback to be added). tonapi throttles cloud IPs, so reads MUST
  fail safe (see invariants).
- **Docs:** `docs/ARCHITECTURE.md`, `docs/DECISIONS.md` (economy choices needing owner
  sign-off).

## 2. NON-NEGOTIABLE INVARIANTS — DO NOT BREAK THESE

1. **A failed on-chain read is NOT zero.** If a balance read fails/throttles, the provider
   returns `null` and we **keep the last known balance and hash rate**. Writing `0` wipes a
   user's real holdings and their mining power. A genuine `404` (no jetton wallet) IS a real
   zero and is fine. Never conflate the two. (`balanceProvider` + `refreshUserHashRate`.)
2. **Never double-credit or double-pay.** Reward crediting is exactly-once. The mining claim
   uses an **atomic optimistic guard**: decrement pending inside a transaction and only
   credit if exactly one row changed (`claimRewards`). New reward types (missions, referrals)
   MUST be idempotent the same way — a conditional `UPDATE`/`updateMany` that returns a count,
   or a unique constraint with insert-or-ignore. Never "simplify" the guard away.
3. **Withdrawals are money** (not built yet). When added: claim rows atomically
   (Postgres `FOR UPDATE SKIP LOCKED`, status `pending -> processing -> paid`). A failure
   that *might* have broadcast goes to `review` and is reconciled on-chain — **never
   auto-refunded** (that double-pays). Only a provably-not-broadcast failure is refunded.
4. **One wallet -> one account. One withdrawal address -> one account.** Enforced on
   wallet connect (a wallet already bound to another user is rejected). Keep it. Add the
   equivalent for withdrawal addresses when withdrawals land. Channel-membership and
   withdrawal minimums are expected anti-fraud additions — see `docs/DECISIONS.md`.
5. **We never touch private keys or seed phrases.** Wallet connection is TON Connect only;
   we receive a public address and read public on-chain balances.
6. **Economy stays configurable, never hardcoded.** Mining formula, rate, level thresholds,
   chapters, milestones, missions, referral reward all live in DB config (`MiningConfig`,
   `MinerLevel`, `AppSetting`, …) editable from the admin. Don't bake numbers into code.
7. **Schema changes:** edit `server/prisma/schema.prisma`, then `npm run db:push`
   (dev) / a migration (prod). A new column that never reaches prod is a silent data bug —
   verify it applied.
8. **Never commit or print secrets** (`JWT_SECRET`, `ADMIN_PASSWORD`, `TELEGRAM_BOT_TOKEN`,
   `TONAPI_KEY`, DB URLs, any future withdraw-wallet mnemonic). `.env` is gitignored — keep
   it that way; `.env.example` holds names only.

## 3. COST & PERFORMANCE DISCIPLINE

Not billing-critical yet (self/低-cost hosting, not per-query Neon HTTP), but build the
habits now so scale doesn't hurt:

- **Batch related reads.** Prefer one query returning a bundle over N round trips. Don't add
  a query to the hot auth path (`requireUser` + `/api/me`) without folding it in.
- **Cache global aggregates** (counts/sums identical for all users — e.g. total miners) in
  memory with a 30–60s TTL, invalidated on write. Don't recompute per request.
- **No new client polling** without a reason. Existing polls pause on `document.hidden` and
  use long intervals. Any per-screen fetch must tolerate remount (screens unmount on tab
  switch) — cache with a TTL.
- **Never add** analytics/telemetry SDKs or `console.log` to hot server paths.
- **Static assets** in `apps/miniapp/public` cache long. If you replace one, use a NEW
  filename rather than overwriting.

## 4. HOW TO WORK (PROCESS)

1. **Investigate before changing.** Read the code, grep, don't assume.
2. **Build/typecheck after every change** and before committing:
   `npm run build` (root) or per-workspace `tsc --noEmit`. Server: `npx tsc -p server`.
3. **Verify money-related changes end-to-end** where possible (curl the API flow; the
   server runs locally with SQLite + mock balances + dev auth). Say plainly what you did and
   did NOT verify.
4. **Commit in logical chunks** with a message explaining the *why*.
5. **`git fetch` before you start and before you push.** Push to
   `claude/moonrat-telegram-mini-app-9wp9tb`. Never force-push shared history.
6. **Config/infra actions are the owner's** (Vercel/host env vars, funding a payout wallet,
   BotFather setup, the real jetton address). Tell the owner the exact step; don't fake it.
7. **Flag trade-offs.** If a change trades freshness/accuracy for cost or speed, say so.

## 5. HOW TO COMMUNICATE

Owner moves fast, often on a phone, sends screenshots not logs.

- **Lead with the answer**, then detail. No long preambles.
- **Plain language first**, one-sentence cause before any jargon.
- **Be concrete:** exact env var names, exact paths, exact commands.
- **Separate "I fixed this in code" from "you must click this."**
- **Never overstate.** If something is untested or an assumption, say so.

## 6. KNOWN TRAPS

- **Opening the Mini App URL in a normal browser** works in dev only because we ship a
  **dev-auth fallback** (`ALLOW_DEV_AUTH=true`, no bot token). In production with a real
  `TELEGRAM_BOT_TOKEN` and `ALLOW_DEV_AUTH=false`, no Telegram `initData` -> `/api/me` 401 ->
  boot screen forever. That is correct. Test inside Telegram; curl `/api/health` (public)
  for server health.
- **tonapi throttles cloud IPs.** Keep the "null means unknown, keep last value" rule; add a
  toncenter fallback before going live.
- **React StrictMode double-fires effects in dev** — auth and any first-write path must be
  idempotent (first-login user/session creation already is; keep new ones that way).
- **SQLite ≠ Postgres.** `FOR UPDATE SKIP LOCKED` and some concurrency guarantees only exist
  on Postgres. Write money code for Postgres semantics and note the gap while dev is SQLite.

## 7. FIRST ACTIONS IN A NEW SESSION

```
git fetch origin claude/moonrat-telegram-mini-app-9wp9tb
git log --oneline -10 origin/claude/moonrat-telegram-mini-app-9wp9tb
git status -sb
npm install
cp apps/miniapp/.env.example apps/miniapp/.env   # SQLite + mock + dev-auth
npm run db:setup                # generate client, push schema, seed (idempotent)
npm run dev:api                 # backend on :4000
npm run dev:miniapp             # app on :5173 (proxies /api to :4000)
```
Then state your plan before touching money-related code (mining credit, claims, balances,
wallet binding, future withdrawals).
