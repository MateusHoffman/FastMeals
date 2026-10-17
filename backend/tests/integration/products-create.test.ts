import { describe, it, expect, beforeAll, afterAll } from 'vitest';
import { buildApp } from '../../src/app.js';
import type { FastifyInstance } from 'fastify';
import { adminToken } from '../helpers/auth.js';

describe('product create', () => {
  let app: FastifyInstance;
  let token: string;

  beforeAll(async () => {
    app = await buildApp();
    token = await adminToken(app);
  });

  afterAll(async () => {
    await app.close();
  });

  it('POST valid product → 201', async () => {
    const res = await app.inject({
      method: 'POST',
      url: '/api/products',
      headers: { authorization: `Bearer ${token}` },
      payload: {
        name: 'Produto Teste TDD',
        description: 'Descricao com mais de dez caracteres para validacao',
        price: 19.9,
        category: 'side',
        preparationTime: 15,
      },
    });
    expect(res.statusCode).toBe(201);
    const body = res.json() as { id: string; name: string };
    expect(body.name).toBe('Produto Teste TDD');
    await app.inject({
      method: 'DELETE',
      url: `/api/products/${body.id}`,
      headers: { authorization: `Bearer ${token}` },
    });
  });
});
