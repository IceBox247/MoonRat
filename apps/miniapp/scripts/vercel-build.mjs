// Build for Vercel. Works with OR without a database:
//   - No Postgres DATABASE_URL  -> build the frontend in DEMO mode (sample data, no backend).
//                                  Lets you click through the whole UI with zero setup.
//   - Postgres DATABASE_URL set -> generate client, push schema, seed, build the real app.
// The Prisma client is always generated so the /api function bundles either way.
import { execSync } from 'node:child_process';

function run(cmd, extraEnv = {}) {
  console.log(`\n$ ${cmd}`);
  execSync(cmd, { stdio: 'inherit', env: { ...process.env, ...extraEnv } });
}

const dbUrl = process.env.DATABASE_URL || '';
const hasDb = /^postgres(ql)?:\/\//.test(dbUrl);

// Prisma generate needs *some* DATABASE_URL present (it reads the schema's env ref, but does
// not connect). Provide a dummy when none is set so generation still succeeds.
run('node scripts/pg-schema.mjs');
run('npx prisma generate --schema prisma/schema.pg.prisma', hasDb ? {} : {
  DATABASE_URL: 'postgresql://user:pass@localhost:5432/placeholder',
});

if (hasDb) {
  console.log('[vercel-build] DATABASE_URL present — syncing schema + seeding.');
  run('npx prisma db push --schema prisma/schema.pg.prisma --skip-generate --accept-data-loss');
  run('npx tsx api/_server/seed.ts');
  run('npx vite build');
} else {
  console.log('[vercel-build] No Postgres DATABASE_URL — building the frontend in DEMO mode.');
  run('npx vite build', { VITE_DEMO: '1' });
}
