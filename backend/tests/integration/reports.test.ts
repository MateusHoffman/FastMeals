// BDD: REP-01, REP-02
import { describe, it, expect, beforeAll, afterAll } from 'vitest';
import { buildApp } from '../../src/app.js';
import type { FastifyInstance } from 'fastify';
import { expectOfficialSeedDataset } from '../helpers/db-fixture.js';

async function adminToken(app: FastifyInstance): Promise<string> {
  const res = await app.inject({
    method: 'POST',
    url: '/api/auth/login',
    payload: { email: 'admin@fastmeals.com', password: 'Admin@123' },
  });
  return (res.json() as { accessToken: string }).accessToken;
}

describe('reports', () => {
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

  it('revenue report for wide date range', async () => {
    const res = await app.inject({
      method: 'GET',
      url: '/api/reports/revenue?startDate=2020-01-01&endDate=2030-12-31',
      headers: { authorization: `Bearer ${token}` },
    });
    expect(res.statusCode).toBe(200);
    const body = res.json() as { totalOrders: number; totalRevenue: number };
    expect(body.totalOrders).toBe(4);
    expect(body.totalRevenue).toBe(370.8);
  });

  it('top products report', async () => {
    const res = await app.inject({
      method: 'GET',
      url: '/api/reports/top-products?limit=1',
      headers: { authorization: `Bearer ${token}` },
    });
    expect(res.statusCode).toBe(200);
    const body = res.json() as { data: Array<{ totalQuantity: number }> };
    expect(body.data[0]?.totalQuantity).toBe(3);
  });

  it('average delivery time report returns shape', async () => {
    const res = await app.inject({
      method: 'GET',
      url: '/api/reports/average-delivery-time',
      headers: { authorization: `Bearer ${token}` },
    });
    expect(res.statusCode).toBe(200);
    const body = res.json() as {
      averageMinutes: number;
      totalDelivered: number;
      byVehicleType: unknown[];
    };
    expect(typeof body.averageMinutes).toBe('number');
    expect(typeof body.totalDelivered).toBe('number');
    expect(Array.isArray(body.byVehicleType)).toBe(true);
  });
});
