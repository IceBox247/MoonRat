# Deploying Moonrat — one Vercel project + Neon

Everything is **one Vercel project** now: the Mini App (static) and the API (a serverless
function at `/api`) live together in `apps/miniapp`, same URL, no CORS, no second project.
The database is **Neon Postgres**.

Balances are **mocked** until you give the `$MOONRAT` jetton address; everything else is
real (Telegram auth, mining, exactly-once claims, referrals, vault, admin).

---

## Step 1 — Neon database

1. In **neon.tech**, create a project → database.
2. Copy the **connection string** (use the plain/direct one, host WITHOUT `-pooler`), e.g.
   `postgresql://user:pass@ep-xxx.aws.neon.tech/moonrat?sslmode=require`

## Step 2 — One Vercel project

Use your existing **moon-rat-server** project (or make a new one from the repo). Set:

1. **Settings → General → Root Directory** → `apps/miniapp`
2. **Settings → Environment Variables** → add:
   | Name | Value |
   |------|-------|
   | `DATABASE_URL` | your Neon string from Step 1 (**required**) |
   | `JWT_SECRET` | any long random string |
   | `ADMIN_JWT_SECRET` | any long random string |
   | `ADMIN_PASSWORD` | your admin password |
   | `ALLOW_DEV_AUTH` | `true` |
   | `TON_BALANCE_PROVIDER` | `mock` |
   | `MOONRAT_BUY_URL` | `https://app.ston.fi/swap` |
3. **Redeploy.**

That's it. The build creates the tables in Neon, seeds the story/levels, builds the Mini
App, and serves the API at `/api` on the same domain.

- App: `https://<your-project>.vercel.app`
- Health check: `https://<your-project>.vercel.app/api/health` → `{"ok":true,...}`

Open the app URL on your phone — it works end to end (real auth, mining, claims, referrals,
vault). It even works in a normal browser because dev-auth is on.

> The build **must** have `DATABASE_URL` set, or it fails at the table-creation step.

---

## Local development

```bash
npm install
cp apps/miniapp/.env.example apps/miniapp/.env   # defaults: SQLite + mock + dev-auth
npm run db:setup                                  # create + seed the local SQLite db
npm run dev:api      # backend on :4000
npm run dev:miniapp  # app on :5173 (proxies /api to :4000)
```

## Turning on the REAL money bits (later)

- **Telegram:** create a bot with **@BotFather**, set its Mini App URL to your Vercel URL,
  add `TELEGRAM_BOT_TOKEN` in Vercel, set `ALLOW_DEV_AUTH=false`.
- **Real $MOONRAT balances:** set `TON_BALANCE_PROVIDER=tonapi` + `MOONRAT_JETTON_MASTER`
  (+ optional `TONAPI_KEY`).
- **TON Connect manifest:** edit `apps/miniapp/public/tonconnect-manifest.json` so `url`/`iconUrl`
  point at your Vercel domain; redeploy.
- **Scale:** switch `DATABASE_URL` to the Neon **pooled** string (`-pooler`) for many users.

## Notes

- **"Cannot GET /"** never happens now — `/` serves the app; the API is under `/api/*`.
- Prisma is configured for the Vercel Lambda runtime (`rhel-openssl-3.0.x`).
- The admin dashboard (`apps/admin`) can be a separate small Vercel project later
  (Root `apps/admin`, `VITE_API_BASE` = your app URL).
