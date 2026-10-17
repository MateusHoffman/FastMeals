// BDD: INFRA-01, INFRA-02
import { describe, it, expect, beforeAll, afterAll } from 'vitest';
import { buildApp } from '../../src/app.js';
import type { FastifyInstance } from 'fastify';

describe('health', () => {
  let app: FastifyInstance;

  beforeAll(async () => {
    app = await buildApp();
  });

  afterAll(async () => {
    await app.close();
  });

  it('GET /api/health/live returns 200', async () => {
    const res = await app.inject({ method: 'GET', url: '/api/health/live' });
    expect(res.statusCode).toBe(200);
    const body = res.json() as { status: string };
    expect(body.status).toBe('ok');
  });

  it('GET /api/health readiness with DB', async () => {
    const res = await app.inject({ method: 'GET', url: '/api/health' });
    expect(res.statusCode).toBe(200);
  });

  it('unknown route returns ROUTE_NOT_FOUND', async () => {
    const res = await app.inject({ method: 'GET', url: '/api/unknown-route' });
    expect(res.statusCode).toBe(404);
    const body = res.json() as { error: { code: string } };
    expect(body.error.code).toBe('ROUTE_NOT_FOUND');
  });
});
