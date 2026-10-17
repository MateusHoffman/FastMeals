// BDD: SEED-03
import { describe, it, expect, beforeAll, afterAll } from 'vitest';
import { buildApp } from '../../src/app.js';
import type { FastifyInstance } from 'fastify';
import { adminToken } from '../helpers/auth.js';
import { expectOfficialSeedDataset } from '../helpers/db-fixture.js';

describe('seed oracles', () => {
  let app: FastifyInstance;
  let token: string;

  beforeAll(async () => {
    await expectOfficialSeedDataset();
    app = await buildApp();
    token = await adminToken(app);
  });

  afterAll(async () => {
    await app.close();
  });

  it('delivered revenue matches seed oracle (370.80)', async () => {
    const end = new Date();
    const start = new Date();
    start.setUTCFullYear(start.getUTCFullYear() - 1);
    const qs = new URLSearchParams({
      startDate: start.toISOString().slice(0, 10),
      endDate: end.toISOString().slice(0, 10),
    });
    const res = await app.inject({
      method: 'GET',
      url: `/api/reports/revenue?${qs}`,
      headers: { authorization: `Bearer ${token}` },
    });
    expect(res.statusCode).toBe(200);
    const body = res.json() as { totalRevenue: number; totalOrders: number };
    expect(body.totalOrders).toBeGreaterThanOrEqual(4);
    expect(Math.abs(body.totalRevenue - 370.8)).toBeLessThan(0.02);
  });
});
