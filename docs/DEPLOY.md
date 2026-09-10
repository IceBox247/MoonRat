# Deploying Moonrat (fully functional)

Two pieces go live:

1. **Backend API + Postgres database** → Render (one blueprint deploys both).
2. **Frontend Mini App** → Vercel (static site pointed at the backend).

Balances are **mocked** until you provide the real `$MOONRAT` jetton address — everything
else is real: Telegram auth, mining accrual, exactly-once claims, referrals, vault, admin.

---

## Step 1 — Backend + database on Render

1. Go to **render.com** → **New → Blueprint**.
2. Connect and pick the **`IceBox247/MoonRat`** repo. Render reads `render.yaml` and shows
   a web service **moonrat-api** + a Postgres **moonrat-db**.
3. Click **Apply**. It provisions the database and builds the API.
4. When it asks for the `sync:false` values, set:
   - **ADMIN_PASSWORD** → a strong password (this logs into the admin dashboard).
   - Leave **TELEGRAM_BOT_TOKEN** and **MOONRAT_JETTON_MASTER** blank for now.
5. Wait for it to go green, then open the service URL and add `/api/health` — you should see
   `{"ok":true,...}`. **Copy the base URL** (e.g. `https://moonrat-api.onrender.com`).

> Free Render Postgres lasts ~90 days and the free web service sleeps when idle (first
> request after idle is slow). Fine for testing; upgrade for production.

## Step 2 — Frontend on Vercel

1. Go to **vercel.com** → **Add New → Project** → import **`IceBox247/MoonRat`**.
2. **Root Directory** → `apps/miniapp`  (framework auto-detects **Vite**).
3. Add an **Environment Variable**:
   - **VITE_API_BASE** = the Render URL from Step 1 (e.g. `https://moonrat-api.onrender.com`)
   - (do **not** set `VITE_DEMO` — that’s only for the offline preview)
4. **Deploy.** Open the Vercel URL — the app boots, talks to the real API, and everything
   works (mining, claim, crew, vault, admin data). Opening it in a plain browser works too,
   because dev-auth is on.

## Step 3 — Lock CORS to your frontend

In Render → moonrat-api → Environment, change **CORS_ORIGINS** from `*` to your exact Vercel
URL (e.g. `https://moonrat.vercel.app`). Save (it redeploys).

## Step 4 — Admin dashboard (optional now)

The admin app (`apps/admin`) is a second Vercel project:
- Root Directory `apps/admin`, env **VITE_API_BASE** = the Render URL.
- Log in with `admin` / the ADMIN_PASSWORD you set. From there you tune the mining formula,
  levels, chapters, milestones, missions, announcements — no redeploys.

---

## Turning on the REAL money bits (when you’re ready)

- **Telegram Mini App:** create a bot with **@BotFather**, set its Mini App URL to your Vercel
  frontend, put the bot token in Render as **TELEGRAM_BOT_TOKEN**, and set **ALLOW_DEV_AUTH**
  to `false`. Now only real Telegram users can sign in.
- **Real $MOONRAT balances:** set **TON_BALANCE_PROVIDER=tonapi** and **MOONRAT_JETTON_MASTER**
  to your jetton master (contract) address in Render. Balances then come from chain and drive
  hash rate for real. (Add a `TONAPI_KEY` to avoid rate limits.)
- **TON Connect manifest:** edit `apps/miniapp/public/tonconnect-manifest.json` so `url` and
  `iconUrl` point at your Vercel domain, then redeploy the frontend.

## Alternative host (Railway)

If you prefer Railway: create a Postgres plugin + a service with **Root Directory** `server`,
Build `npm install --include=dev && npm run build:prod`, Start
`npm run predeploy:prod && npm run start:prod`, and the same env vars as `render.yaml`.
