// BDD: SEED-01 — dataset oficial seed/data.json
import { readFileSync } from 'node:fs';
import { dirname, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import { describe, it, expect } from 'vitest';
import {
  readSeedDataJson,
  resolveSeedDataPath,
} from '../../prisma/seed-data-path.js';
import { prisma } from '../../src/shared/database/prisma.js';
import { expectOfficialSeedDataset } from '../helpers/db-fixture.js';

describe('seed data source', () => {
  it('resolveSeedDataPath aponta para seed/data.json do repositório', () => {
    const path = resolveSeedDataPath();
    expect(path.replace(/\\/g, '/')).toMatch(/\/seed\/data\.json$/);
    const raw = readSeedDataJson();
    const json = JSON.parse(raw) as {
      users: unknown[];
      products: Array<{ name: string }>;
    };
    expect(json.users).toHaveLength(2);
    expect(json.products).toHaveLength(15);
    expect(json.products[0]?.name).toBe('X-Burger Especial');
  });

  it('desafio/seed/data.json espelha o dataset canônico', () => {
    const canonical = JSON.parse(readSeedDataJson());
    const here = dirname(fileURLToPath(import.meta.url));
    const mirrorPath = resolve(here, '../../../desafio/seed/data.json');
    const mirror = JSON.parse(readFileSync(mirrorPath, 'utf-8'));
    expect(mirror).toEqual(canonical);
  });

  it('produtos do desafio existem no banco quando seed foi aplicado', async () => {
    await expectOfficialSeedDataset();
    const json = JSON.parse(readSeedDataJson()) as {
      products: Array<{ name: string }>;
    };
    const burger = await prisma.product.findFirst({
      where: { name: 'X-Burger Especial', deletedAt: null },
    });
    expect(burger).not.toBeNull();
    const count = await prisma.product.count({ where: { deletedAt: null } });
    expect(count).toBeGreaterThanOrEqual(json.products.length);
    await prisma.$disconnect();
  });
});
