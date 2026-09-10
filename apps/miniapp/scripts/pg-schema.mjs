// Generates prisma/schema.pg.prisma (PostgreSQL) from the dev schema.prisma (SQLite),
// keeping a single source of truth. Only the datasource provider differs.
import { readFileSync, writeFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { dirname, join } from 'node:path';

const here = dirname(fileURLToPath(import.meta.url));
const src = join(here, '..', 'prisma', 'schema.prisma');
const out = join(here, '..', 'prisma', 'schema.pg.prisma');

let s = readFileSync(src, 'utf8');
if (!s.includes('provider = "sqlite"')) {
  console.warn('[pg-schema] expected sqlite provider in schema.prisma; writing as-is');
}
s = s.replace('provider = "sqlite"', 'provider = "postgresql"');
s = `// AUTO-GENERATED from schema.prisma by scripts/pg-schema.mjs — do not edit by hand.\n${s}`;
writeFileSync(out, s);
console.log('[pg-schema] wrote', out);
