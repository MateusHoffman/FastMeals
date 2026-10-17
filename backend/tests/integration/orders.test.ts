// BDD: STATE-01, STATE-02
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

async function createReadyOrderWithoutDriver(
  app: FastifyInstance,
  token: string,
): Promise<string> {
  const products = await app.inject({
    method: 'GET',
    url: '/api/products?isAvailable=true&limit=1',
    headers: { authorization: `Bearer ${token}` },
  });
  expect(products.statusCode).toBe(200);
  const productId = (
    products.json() as { data: Array<{ id: string }> }
  ).data[0]!.id;

  const create = await app.inject({
    method: 'POST',
    url: '/api/orders',
    headers: { authorization: `Bearer ${token}` },
    payload: {
      customerName: 'State Test',
      customerPhone: '(11) 91234-5678',
      deliveryAddress: 'Rua Teste, 1, Sao Paulo - SP',
      latitude: -23.55,
      longitude: -46.63,
      items: [{ productId, quantity: 1 }],
    },
  });
  expect(create.statusCode).toBe(201);
  const id = (create.json() as { id: string }).id;
  for (const status of ['preparing', 'ready'] as const) {
    const patch = await app.inject({
      method: 'PATCH',
      url: `/api/orders/${id}/status`,
      headers: { authorization: `Bearer ${token}` },
      payload: { status },
    });
    expect(patch.statusCode).toBe(200);
  }
  return id;
}

describe('orders status', () => {
  let app: FastifyInstance;
  let token: string;

  beforeAll(async () => {
    app = await buildApp();
    token = await adminToken(app);
  });

  afterAll(async () => {
    await app.close();
  });

  it('valid transition pending to preparing', async () => {
    const list = await app.inject({
      method: 'GET',
      url: '/api/orders?status=pending&limit=1',
      headers: { authorization: `Bearer ${token}` },
    });
    const order = (list.json() as { data: Array<{ id: string }> }).data[0];
    if (!order) return;
    const res = await app.inject({
      method: 'PATCH',
      url: `/api/orders/${order.id}/status`,
      headers: { authorization: `Bearer ${token}` },
      payload: { status: 'preparing' },
    });
    expect(res.statusCode).toBe(200);
  });

  it('ready to delivering without driver returns 422', async () => {
    const orderId = await createReadyOrderWithoutDriver(app, token);
    const res = await app.inject({
      method: 'PATCH',
      url: `/api/orders/${orderId}/status`,
      headers: { authorization: `Bearer ${token}` },
      payload: { status: 'delivering' },
    });
    expect(res.statusCode).toBe(422);
    const body = res.json() as { error: { code: string } };
    expect(body.error.code).toBe('INVALID_STATUS_TRANSITION');
  });
});
