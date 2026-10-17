// Matriz de contrato alinhada a desafio/docs/api-spec.md
import { describe, it, expect, beforeAll, afterAll } from 'vitest';
import { buildApp } from '../../src/app.js';
import type { FastifyInstance } from 'fastify';
import { adminToken, viewerToken } from '../helpers/auth.js';

describe('api-spec contract matrix', () => {
  let app: FastifyInstance;
  let admin: string;
  let viewer: string;

  beforeAll(async () => {
    app = await buildApp();
    admin = await adminToken(app);
    viewer = await viewerToken(app);
  });

  afterAll(async () => {
    await app.close();
  });

  it('GET /products defaults pagination', async () => {
    const res = await app.inject({
      method: 'GET',
      url: '/api/products',
      headers: { authorization: `Bearer ${admin}` },
    });
    expect(res.statusCode).toBe(200);
    const body = res.json() as {
      pagination: { page: number; limit: number; totalPages: number };
      data: unknown[];
    };
    expect(body.pagination.page).toBe(1);
    expect(body.pagination.limit).toBe(20);
    expect(Array.isArray(body.data)).toBe(true);
  });

  it('viewer GET delivery-persons 200', async () => {
    const res = await app.inject({
      method: 'GET',
      url: '/api/delivery-persons',
      headers: { authorization: `Bearer ${viewer}` },
    });
    expect(res.statusCode).toBe(200);
    const body = res.json() as {
      data: unknown[];
      pagination: { page: number; limit: number };
    };
    expect(Array.isArray(body.data)).toBe(true);
    expect(body.pagination.limit).toBe(20);
  });

  it('GET delivery-persons/:id returns shape', async () => {
    const list = await app.inject({
      method: 'GET',
      url: '/api/delivery-persons?limit=1',
      headers: { authorization: `Bearer ${viewer}` },
    });
    const first = (
      list.json() as { data: Array<{ id: string }> }
    ).data[0];
    if (!first) return;
    const res = await app.inject({
      method: 'GET',
      url: `/api/delivery-persons/${first.id}`,
      headers: { authorization: `Bearer ${viewer}` },
    });
    expect(res.statusCode).toBe(200);
    const body = res.json() as {
      id: string;
      name: string;
      phone: string;
      vehicleType: string;
      isActive: boolean;
      currentLatitude: number | null;
      currentLongitude: number | null;
      currentOrderId: string | null;
    };
    expect(body.id).toBe(first.id);
    expect(typeof body.name).toBe('string');
    expect(typeof body.isActive).toBe('boolean');
  });

  it('GET delivery-persons/:id 404 unknown', async () => {
    const res = await app.inject({
      method: 'GET',
      url: '/api/delivery-persons/00000000-0000-4000-8000-000000000099',
      headers: { authorization: `Bearer ${viewer}` },
    });
    expect(res.statusCode).toBe(404);
    expect((res.json() as { error: { code: string } }).error.code).toBe(
      'DELIVERY_PERSON_NOT_FOUND',
    );
  });

  it('viewer POST /products → 403 FORBIDDEN', async () => {
    const res = await app.inject({
      method: 'POST',
      url: '/api/products',
      headers: { authorization: `Bearer ${viewer}` },
      payload: {
        name: 'Teste Prod',
        description: 'Descricao valida do produto teste',
        price: 10,
        category: 'meal',
        preparationTime: 10,
      },
    });
    expect(res.statusCode).toBe(403);
    expect((res.json() as { error: { code: string } }).error.code).toBe(
      'FORBIDDEN',
    );
  });

  it('viewer POST /orders → 403', async () => {
    const res = await app.inject({
      method: 'POST',
      url: '/api/orders',
      headers: { authorization: `Bearer ${viewer}` },
      payload: {},
    });
    expect(res.statusCode).toBe(403);
  });

  it('optimize response shape', async () => {
    const res = await app.inject({
      method: 'POST',
      url: '/api/orders/optimize-assignment',
      headers: { authorization: `Bearer ${admin}` },
    });
    expect(res.statusCode).toBe(200);
    const body = res.json() as {
      algorithm: string;
      executionTimeMs: number;
      assignments: unknown[];
      unassigned: unknown[];
      totalDistanceKm: number;
    };
    expect(body.algorithm).toBe('hungarian');
    expect(typeof body.executionTimeMs).toBe('number');
    expect(Array.isArray(body.assignments)).toBe(true);
  });

  it('error envelope on 404 product', async () => {
    const res = await app.inject({
      method: 'GET',
      url: '/api/products/00000000-0000-4000-8000-000000000099',
      headers: { authorization: `Bearer ${admin}` },
    });
    expect(res.statusCode).toBe(404);
    const body = res.json() as { error: { code: string; message: string } };
    expect(body.error.code).toBe('PRODUCT_NOT_FOUND');
    expect(body.error.message).toBeTruthy();
  });

  it('orders-by-status returns 6 statuses', async () => {
    const res = await app.inject({
      method: 'GET',
      url: '/api/reports/orders-by-status',
      headers: { authorization: `Bearer ${viewer}` },
    });
    expect(res.statusCode).toBe(200);
    const body = res.json() as { data: Array<{ status: string; count: number }> };
    expect(body.data).toHaveLength(6);
  });
});
