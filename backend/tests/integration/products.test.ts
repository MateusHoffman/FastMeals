// BDD: PROD-01, PROD-02
import { describe, it, expect, beforeAll, afterAll } from 'vitest';
import { buildApp } from '../../src/app.js';
import type { FastifyInstance } from 'fastify';

async function adminToken(app: FastifyInstance): Promise<string> {
  const res = await app.inject({
    method: 'POST',
    url: '/api/auth/login',
    payload: { email: 'admin@fastmeals.com', password: 'Admin@123' },
  });
  return (res.json() as { accessToken: string }).accessToken;
}

describe('products', () => {
  let app: FastifyInstance;
  let token: string;

  beforeAll(async () => {
    app = await buildApp();
    token = await adminToken(app);
  });

  afterAll(async () => {
    await app.close();
  });

  it('lists products with pagination defaults', async () => {
    const res = await app.inject({
      method: 'GET',
      url: '/api/products',
      headers: { authorization: `Bearer ${token}` },
    });
    expect(res.statusCode).toBe(200);
    const body = res.json() as { data: unknown[]; pagination: { limit: number } };
    expect(body.data.length).toBeGreaterThan(0);
    expect(body.pagination.limit).toBe(20);
  });

  it('filters products by category query param', async () => {
    const res = await app.inject({
      method: 'GET',
      url: '/api/products?category=drink&limit=100',
      headers: { authorization: `Bearer ${token}` },
    });
    expect(res.statusCode).toBe(200);
    const body = res.json() as { data: Array<{ category: string }> };
    expect(body.data.length).toBeGreaterThan(0);
    expect(body.data.every((p) => p.category === 'drink')).toBe(true);
  });

  it('rejects invalid product on create', async () => {
    const res = await app.inject({
      method: 'POST',
      url: '/api/products',
      headers: { authorization: `Bearer ${token}` },
      payload: { name: 'ab', description: 'short', price: -1, category: 'meal', preparationTime: 0 },
    });
    expect(res.statusCode).toBe(400);
  });
});
