import { spawnSync } from 'node:child_process';
import { loadLocalEnv } from './load-local-env.js';

/** Repassa argv ao Prisma CLI após carregar `.env` da raiz do repo. */
loadLocalEnv();
const args = process.argv.slice(2);
if (args.length === 0) {
  console.error('Uso: tsx scripts/prisma-cli.ts <subcomando prisma> [...args]');
  process.exit(1);
}

const result = spawnSync('npx', ['prisma', ...args], {
  stdio: 'inherit',
  env: process.env,
});

process.exit(result.status ?? 1);
