import { prisma } from '../../src/shared/database/prisma.js';

/** Benchmark fixture (10k rows) invalidates seed revenue oracles. */
export async function isBenchmarkFixtureActive(): Promise<boolean> {
  const count = await prisma.product.count({ where: { deletedAt: null } });
  return count > 500;
}

/** Falha cedo se o banco não reflete o seed oficial (ex.: após benchmark 10k). */
export async function expectOfficialSeedDataset(): Promise<void> {
  if (await isBenchmarkFixtureActive()) {
    throw new Error(
      'Banco com fixture de benchmark (>500 produtos). Rode: cd backend && npm run seed:reset && npm run seed',
    );
  }
}
