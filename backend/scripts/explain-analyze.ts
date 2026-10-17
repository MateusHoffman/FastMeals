/**
 * Gate B — EXPLAIN ANALYZE das queries críticas de listagem.
 */
import { writeFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { loadLocalEnv } from './load-local-env.js';
import { prisma } from '../src/shared/database/prisma.js';

const queries: Record<string, string> = {
  products_list: `
EXPLAIN (ANALYZE, BUFFERS, FORMAT TEXT)
SELECT p.id
FROM products p
WHERE p.deleted_at IS NULL
ORDER BY p.created_at DESC, p.id DESC
LIMIT 20;
`,
  orders_list: `
EXPLAIN (ANALYZE, BUFFERS, FORMAT TEXT)
SELECT o.id
FROM orders o
ORDER BY o.created_at DESC, o.id DESC
LIMIT 20;
`,
  products_search: `
EXPLAIN (ANALYZE, BUFFERS, FORMAT TEXT)
SELECT p.id
FROM products p
WHERE p.deleted_at IS NULL
  AND p.name ILIKE '%bench%'
ORDER BY p.created_at DESC
LIMIT 20;
`,
};

async function main() {
  loadLocalEnv();
  const out: Record<string, string> = {};
  for (const [key, sql] of Object.entries(queries)) {
    const rows = await prisma.$queryRawUnsafe<Array<{ 'QUERY PLAN': string }>>(
      sql.trim(),
    );
    out[key] = rows.map((r) => r['QUERY PLAN']).join('\n');
    console.log(`\n=== ${key} ===\n${out[key]}\n`);
  }

  const path = resolve(process.cwd(), '../docs/explain-analyze.txt');
  const body = Object.entries(out)
    .map(([k, v]) => `=== ${k} ===\n${v}`)
    .join('\n\n');
  writeFileSync(path, `${body}\n`);
  console.log('Wrote', path);
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
