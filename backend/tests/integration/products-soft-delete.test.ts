// BDD: PROD-06 / C8 soft delete
import { describe, it, expect, beforeAll, afterAll } from 'vitest';
import { buildApp } from '../../src/app.js';
import type { FastifyInstance } from 'fastify';
import { adminToken } from '../helpers/auth.js';

describe('product soft delete', () => {
  let app: FastifyInstance;
  let token: string;

  beforeAll(async () => {
    app = await buildApp();
    token = await adminToken(app);
  });

  afterAll(async () => {
    await app.close();
  });

  it('DELETE then GET/PUT return 404', async () => {
    const create = await app.inject({
      method: 'POST',
      url: '/api/products',
      headers: { authorization: `Bearer ${token}` },
      payload: {
        name: 'Soft Delete Probe',
        description: 'Produto temporario para teste de soft delete',
        price: 9.99,
        category: 'drink',
        preparationTime: 5,
      },
    });
    expect(create.statusCode).toBe(201);
    const { id } = create.json() as { id: string };

    const del = await app.inject({
      method: 'DELETE',
      url: `/api/products/${id}`,
      headers: { authorization: `Bearer ${token}` },
    });
    expect(del.statusCode).toBe(204);

    const get = await app.inject({
      method: 'GET',
      url: `/api/products/${id}`,
      headers: { authorization: `Bearer ${token}` },
    });
    expect(get.statusCode).toBe(404);

    const put = await app.inject({
      method: 'PUT',
      url: `/api/products/${id}`,
      headers: { authorization: `Bearer ${token}` },
      payload: { name: 'Nao deve atualizar' },
    });
    expect(put.statusCode).toBe(404);
  });
});
