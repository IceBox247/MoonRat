# Moonrat — Key Decisions (need your review)

Everything here is built to be **configurable from the backend/admin**, so these are
starting positions, not permanent commitments. Where a decision materially affects the
token economy, it is flagged **⚠ NEEDS SIGN-OFF**.

---

## 1. Mining accrual is OFF-CHAIN ⚠ NEEDS SIGN-OFF

Rewards accrue in our database as `hashRate × elapsedTime × globalRate`. Users **claim**
accumulated $MOONRAT later. Nothing is minted or transferred per tap.

**Why:** paying gas for every tap of every user is economically impossible. The standard
model (Notcoin, Hamster, etc.) accrues off-chain and settles on-chain in batches from a
funded **reward reserve**.

**Open question for you:** how do claims settle on-chain eventually?
- (a) Manual/batched jetton transfers from a treasury wallet, or
- (b) A claim smart contract users call, or
- (c) Points now, TGE conversion later.

Until you decide, claims move balances in our ledger only (`Claim` + `Vault`).

## 2. Mining Power = f(on-chain $MOONRAT balance)

The formula lives in the `MiningConfig` DB row and is evaluated by a pluggable engine
(`server/src/mining/formula.ts`). The shipped placeholder:

```
hashRate = baseHashRate + holdingsFactor * sqrt(balance / balanceUnit)
```

Diminishing returns (`sqrt`) so whales don't dominate linearly. **You can replace this
with any formula from the admin panel** — linear, tiered, logarithmic — without a redeploy
(engine supports `linear`, `sqrt`, `log`, and `tiered` strategies out of the box).

**Open question:** target curve + numbers. Placeholder values are in the seed.

## 3. Balance reads are MOCKED until you provide the jetton master address

`server/src/ton/balanceProvider.ts` has an interface with two implementations:
`MockBalanceProvider` (deterministic fake balances for dev) and `TonApiBalanceProvider`
(real, via TonAPI/toncenter). Switch with `TON_BALANCE_PROVIDER=tonapi` +
`MOONRAT_JETTON_MASTER=<address>` in `.env`.

## 4. Dev database = SQLite; production = Postgres

Prisma with SQLite for zero-setup local dev. Switch to Postgres by changing
`DATABASE_URL` + the `provider` in `schema.prisma`. No code changes.

## 5. Security

- We NEVER touch private keys/seed phrases. Wallet connection is via TON Connect only;
  we receive a wallet **address** and read its public on-chain balance.
- Telegram auth validates the `initData` HMAC signature server-side (`server/src/auth`).
- Admin dashboard is a separate app behind its own JWT + role check.

---

## Things intentionally left as placeholders

- Exact mining rate / hashrate numbers (seeded, editable in admin).
- Miner level thresholds (seeded, editable).
- Expedition chapters, milestones, missions (seeded, editable).
- Referral reward amounts (seeded, editable).
- $MOONRAT jetton contract address + decimals (env, currently mock).
- Swap/purchase target link (env — points to a DEX; e.g. STON.fi / DeDust deep link).
