/**
 * Dois accepts paralelos no mesmo pedido ready — apenas um deve vencer.
 */
import { describe, it, expect, beforeAll, afterAll } from 'vitest';
import { buildApp } from '../../src/app.js';
import type { FastifyInstance } from 'fastify';
import { adminToken } from '../helpers/auth.js';

async function createReadyOrder(
  app: FastifyInstance,
  token: string,
  productId: string,
): Promise<string> {
  const create = await app.inject({
    method: 'POST',
    url: '/api/orders',
    headers: { authorization: `Bearer ${token}` },
    payload: {
      customerName: 'Accept Conc',
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

async function createCourier(
  app: FastifyInstance,
  token: string,
  suffix: string,
): Promise<string> {
  const res = await app.inject({
    method: 'POST',
    url: '/api/delivery-persons',
    headers: { authorization: `Bearer ${token}` },
    payload: {
      name: `Courier ${suffix}`,
      phone: suffix === '1' ? '(11) 98761-1111' : '(11) 98762-2222',
      vehicleType: 'motorcycle',
      currentLatitude: -23.55,
      currentLongitude: -46.63,
    },
  });
  expect(res.statusCode).toBe(201);
  return (res.json() as { id: string }).id;
}

describe('concurrent accept-assignment on same order', () => {
  let app: FastifyInstance;
  let token: string;

  beforeAll(async () => {
    app = await buildApp();
    token = await adminToken(app);
  });

  afterAll(async () => {
    await app.close();
  });

  it('allows only one parallel accept for the same ready order', async () => {
    const products = await app.inject({
      method: 'GET',
      url: '/api/products?isAvailable=true&limit=1',
      headers: { authorization: `Bearer ${token}` },
    });
    expect(products.statusCode).toBe(200);
    const productId = (
      products.json() as { data: Array<{ id: string }> }
    ).data[0]!.id;

    const orderId = await createReadyOrder(app, token, productId);
    const personA = await createCourier(app, token, '1');
    const personB = await createCourier(app, token, '2');

    const results = await Promise.all([
      app.inject({
        method: 'POST',
        url: `/api/orders/${orderId}/accept-assignment`,
        headers: { authorization: `Bearer ${token}` },
        payload: { deliveryPersonId: personA },
      }),
      app.inject({
        method: 'POST',
        url: `/api/orders/${orderId}/accept-assignment`,
        headers: { authorization: `Bearer ${token}` },
        payload: { deliveryPersonId: personB },
      }),
    ]);

    const ok = results.filter((r) => r.statusCode === 200);
    const failed = results.filter((r) => r.statusCode !== 200);
    expect(ok.length).toBe(1);
    expect(failed.length).toBe(1);
    expect(failed[0]!.statusCode).toBe(422);
    const body = failed[0]!.json() as { error: { code: string } };
    expect(body.error.code).toBe('INVALID_STATUS_TRANSITION');

    const get = await app.inject({
      method: 'GET',
      url: `/api/orders/${orderId}`,
      headers: { authorization: `Bearer ${token}` },
    });
    expect(get.statusCode).toBe(200);
    const order = get.json() as {
      status: string;
      deliveryPerson: { id: string } | null;
    };
    expect(order.status).toBe('delivering');
    expect([personA, personB]).toContain(order.deliveryPerson?.id);
  });
});
