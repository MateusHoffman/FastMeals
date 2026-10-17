// BDD: AUTH-01, AUTH-02
import { describe, it, expect, beforeAll, afterAll } from 'vitest';
import { buildApp } from '../../src/app.js';
import type { FastifyInstance } from 'fastify';

describe('auth', () => {
  let app: FastifyInstance;

  beforeAll(async () => {
    app = await buildApp();
  });

  afterAll(async () => {
    await app.close();
  });

  it('login with valid credentials', async () => {
    const res = await app.inject({
      method: 'POST',
      url: '/api/auth/login',
      payload: { email: 'admin@fastmeals.com', password: 'Admin@123' },
    });
    expect(res.statusCode).toBe(200);
    const body = res.json() as { accessToken: string; user: { role: string } };
    expect(body.accessToken).toBeTruthy();
    expect(body.user.role).toBe('admin');
  });

  it('login with invalid credentials returns 401', async () => {
    const res = await app.inject({
      method: 'POST',
      url: '/api/auth/login',
      payload: { email: 'admin@fastmeals.com', password: 'wrong' },
    });
    expect(res.statusCode).toBe(401);
    const body = res.json() as { error: { code: string } };
    expect(body.error.code).toBe('INVALID_CREDENTIALS');
  });

  it('protected route without token returns 401', async () => {
    const res = await app.inject({ method: 'GET', url: '/api/products' });
    expect(res.statusCode).toBe(401);
  });
});
