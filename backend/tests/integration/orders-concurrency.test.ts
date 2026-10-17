/**
 * ADR-006 — at most one order in `delivering` per delivery person.
 */
import { describe, it, expect, beforeAll, afterAll } from 'vitest';
import { buildApp } from '../../src/app.js';
import type { FastifyInstance } from 'fastify';
import { adminToken } from '../helpers/auth.js';

async function createReadyOrder(
  app: FastifyInstance,
  token: string,
  productId: string,
  label: string,
): Promise<string> {
  const create = await app.inject({
    method: 'POST',
    url: '/api/orders',
    headers: { authorization: `Bearer ${token}` },
    payload: {
      customerName: `Conc ${label}`,
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

describe('concurrent delivering assignment', () => {
  let app: FastifyInstance;
  let token: string;

  beforeAll(async () => {
    app = await buildApp();
    token = await adminToken(app);
  });

  afterAll(async () => {
    await app.close();
  });

  it('allows only one parallel transition to delivering for the same courier', async () => {
    const products = await app.inject({
      method: 'GET',
      url: '/api/products?isAvailable=true&limit=1',
      headers: { authorization: `Bearer ${token}` },
    });
    expect(products.statusCode).toBe(200);
    const productId = (
      products.json() as { data: Array<{ id: string }> }
    ).data[0]!.id;

    const personRes = await app.inject({
      method: 'POST',
      url: '/api/delivery-persons',
      headers: { authorization: `Bearer ${token}` },
      payload: {
        name: 'Entregador Concorrencia',
        phone: '(11) 98765-4321',
        vehicleType: 'motorcycle',
        currentLatitude: -23.55,
        currentLongitude: -46.63,
      },
    });
    expect(personRes.statusCode).toBe(201);
    const personId = (personRes.json() as { id: string }).id;

    const orderA = await createReadyOrder(app, token, productId, 'A');
    const orderB = await createReadyOrder(app, token, productId, 'B');

    for (const orderId of [orderA, orderB]) {
      const assign = await app.inject({
        method: 'PATCH',
        url: `/api/orders/${orderId}/assign`,
        headers: { authorization: `Bearer ${token}` },
        payload: { deliveryPersonId: personId },
      });
      expect(assign.statusCode).toBe(200);
    }

    const results = await Promise.all(
      [orderA, orderB].map((orderId) =>
        app.inject({
          method: 'PATCH',
          url: `/api/orders/${orderId}/status`,
          headers: { authorization: `Bearer ${token}` },
          payload: { status: 'delivering' },
        }),
      ),
    );

    const ok = results.filter((r) => r.statusCode === 200);
    const failed = results.filter((r) => r.statusCode !== 200);
    expect(ok.length).toBe(1);
    expect(failed.length).toBe(1);
    expect(failed[0]!.statusCode).toBe(422);
    const body = failed[0]!.json() as { error: { code: string } };
    expect(body.error.code).toBe('DELIVERY_PERSON_UNAVAILABLE');
  });
});
