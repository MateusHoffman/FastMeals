// BDD: AUTH-SESSION-*
import { describe, it, expect, beforeAll, afterAll } from 'vitest';
import { buildApp } from '../../src/app.js';
import type { FastifyInstance } from 'fastify';
import { loadEnv } from '../../src/config/env.js';

describe('SPA session cookies', () => {
  let app: FastifyInstance;
  const origin = loadEnv().SPA_ORIGIN;

  beforeAll(async () => {
    app = await buildApp();
  });

  afterAll(async () => {
    await app.close();
  });

  it('session login returns user only, sets cookies', async () => {
    const res = await app.inject({
      method: 'POST',
      url: '/api/auth/session',
      headers: { origin, 'content-type': 'application/json' },
      payload: { email: 'admin@fastmeals.com', password: 'Admin@123' },
    });
    expect(res.statusCode).toBe(200);
    const body = res.json() as Record<string, unknown>;
    expect(body.user).toBeTruthy();
    expect(body.accessToken).toBeUndefined();
    expect(body.refreshToken).toBeUndefined();
    expect(res.headers['set-cookie']).toBeDefined();
  });

  it('GET session with cookie returns user', async () => {
    const login = await app.inject({
      method: 'POST',
      url: '/api/auth/session',
      headers: { origin, 'content-type': 'application/json' },
      payload: { email: 'viewer@fastmeals.com', password: 'Viewer@123' },
    });
    const cookie = login.headers['set-cookie'];
    const res = await app.inject({
      method: 'GET',
      url: '/api/auth/session',
      headers: { cookie: Array.isArray(cookie) ? cookie.join('; ') : cookie! },
    });
    expect(res.statusCode).toBe(200);
  });
});
