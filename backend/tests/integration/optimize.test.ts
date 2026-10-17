// BDD: OPT-01, OPT-02
import { describe, it, expect, beforeAll, afterAll } from 'vitest';
import { buildApp } from '../../src/app.js';
import type { FastifyInstance } from 'fastify';
import { prisma } from '../../src/shared/database/prisma.js';

async function adminToken(app: FastifyInstance): Promise<string> {
  const res = await app.inject({
    method: 'POST',
    url: '/api/auth/login',
    payload: { email: 'admin@fastmeals.com', password: 'Admin@123' },
  });
  return (res.json() as { accessToken: string }).accessToken;
}

describe('optimize assignment', () => {
  let app: FastifyInstance;
  let token: string;

  beforeAll(async () => {
    app = await buildApp();
    token = await adminToken(app);
  });

  afterAll(async () => {
    await app.close();
  });

  it('returns assignments with hungarian algorithm', async () => {
    const res = await app.inject({
      method: 'POST',
      url: '/api/orders/optimize-assignment',
      headers: { authorization: `Bearer ${token}` },
    });
    expect(res.statusCode).toBe(200);
    const body = res.json() as {
      algorithm: string;
      assignments: unknown[];
      unassigned: unknown[];
    };
    expect(body.algorithm).toBe('hungarian');
    expect(Array.isArray(body.assignments)).toBe(true);
    const cmp = (body as { baselineComparison?: { greedyNearestNeighborTotalKm: number } })
      .baselineComparison;
    expect(cmp).toBeDefined();
    expect(cmp!.greedyNearestNeighborTotalKm).toBeGreaterThanOrEqual(0);
  });

  it('marks ready orders unassigned when no delivery person is available', async () => {
    const readyBefore = await prisma.order.count({ where: { status: 'ready' } });
    expect(readyBefore).toBeGreaterThan(0);

    await prisma.deliveryPerson.updateMany({
      data: { isActive: false },
    });

    try {
      const res = await app.inject({
        method: 'POST',
        url: '/api/orders/optimize-assignment',
        headers: { authorization: `Bearer ${token}` },
      });
      expect(res.statusCode).toBe(200);
      const body = res.json() as {
        assignments: unknown[];
        unassigned: Array<{ orderId: string; reason: string }>;
        totalDistanceKm: number;
      };
      expect(body.assignments).toHaveLength(0);
      expect(body.unassigned.length).toBe(readyBefore);
      expect(body.unassigned[0]?.reason).toMatch(/available delivery person/i);
      expect(body.totalDistanceKm).toBe(0);
    } finally {
      await prisma.deliveryPerson.updateMany({
        data: { isActive: true },
      });
    }
  });
});
