# Deploying Moonrat on Vercel + Neon

Everything runs on **Vercel** (your usual setup), backed by **Neon Postgres**. Two Vercel
projects from the same repo:

1. **API** — the backend as a Vercel **serverless function** (Root Directory `server`).
2. **Frontend** — the Mini App static site (Root Directory `apps/miniapp`).

Balances are **mocked** until you give the `$MOONRAT` jetton address; everything else is
real (Telegram auth, mining, exactly-once claims, referrals, vault, admin).

---

## Step 1 — Neon database

1. In **neon.tech**, create a project (or reuse one) → a database.
2. Copy the **connection string**. Use the **direct** one (host WITHOUT `-pooler`) for now —
   it lets the build create tables. Example:
   `postgresql://user:pass@ep-xxx.us-east-2.aws.neon.tech/moonrat?sslmode=require`

## Step 2 — API project (backend) on Vercel

You already have the **moon-rat-server** project. Point it at the backend:

1. **Settings → General → Root Directory** → `server` (if not already).
2. **Settings → Environment Variables** → add:
   | Name | Value |
   |------|-------|
   | `DATABASE_URL` | your Neon connection string from Step 1 |
   | `JWT_SECRET` | any long random string |
   | `ADMIN_JWT_SECRET` | any long random string |
   | `ADMIN_PASSWORD` | your admin password |
   | `ALLOW_DEV_AUTH` | `true` |
   | `TON_BALANCE_PROVIDER` | `mock` |
   | `MOONRAT_BUY_URL` | `https://app.ston.fi/swap` |
   | `CORS_ORIGINS` | `*` (tighten to your frontend URL later) |
3. **Redeploy.** The build runs `vercel-build` — it creates the tables in Neon and seeds
   levels/chapters/milestones, then serves the API as a function.
4. Check `https://<your-api>.vercel.app/api/health` → `{"ok":true,...}`. **Copy that base URL.**

> The build **must** have `DATABASE_URL` set or it fails at the table-creation step — that’s
> why Neon comes first.

## Step 3 — Frontend project (Mini App) on Vercel

1. **Add New → Project** → import **`IceBox247/MoonRat`** again.
2. **Root Directory** → `apps/miniapp` (auto-detects Vite).
3. **Environment Variable**: `VITE_API_BASE` = your API base URL from Step 2
   (e.g. `https://moon-rat-server.vercel.app`, **no** trailing `/api`).
4. **Deploy.** Open the URL — the Mini App boots, talks to the real API, and works end to end.
   (It works in a plain browser too, because dev-auth is on.)

## Step 4 — Tidy up

- API project → set `CORS_ORIGINS` to your exact frontend URL and redeploy.
- Admin: deploy `apps/admin` as a 3rd Vercel project (Root `apps/admin`, env
  `VITE_API_BASE` = API URL). Log in with `admin` / your `ADMIN_PASSWORD`.

---

## Turning on the REAL money bits (later)

- **Telegram:** create a bot via **@BotFather**, set its Mini App URL to your frontend, put
  the token in the API project as `TELEGRAM_BOT_TOKEN`, and set `ALLOW_DEV_AUTH=false`.
- **Real $MOONRAT balances:** set `TON_BALANCE_PROVIDER=tonapi` + `MOONRAT_JETTON_MASTER`
  (+ optional `TONAPI_KEY`) in the API project.
- **TON Connect manifest:** edit `apps/miniapp/public/tonconnect-manifest.json` so `url`/`iconUrl`
  point at your frontend domain; redeploy.
- **Scale:** switch `DATABASE_URL` to the Neon **pooled** string (`-pooler`) for many
  concurrent users. (Table creation should still be done once via the direct string.)

## Notes / troubleshooting

- **"Cannot GET /"** on the API domain is fine — the API only answers `/api/*`. Use
  `/api/health` to check it.
- Prisma is configured for the Vercel Lambda runtime (`rhel-openssl-3.0.x` binary target).
- Render is still supported as an alternative host (`render.yaml`), but Vercel is the
  primary path here.
