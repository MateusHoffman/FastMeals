import { describe, it, expect, beforeAll, afterAll } from 'vitest';
import { buildApp } from '../../src/app.js';
import type { FastifyInstance } from 'fastify';
import { adminToken } from '../helpers/auth.js';

describe('order status history', () => {
  let app: FastifyInstance;
  let token: string;

  beforeAll(async () => {
    app = await buildApp();
    token = await adminToken(app);
  });

  afterAll(async () => {
    await app.close();
  });

  it('records history after status patch', async () => {
    const list = await app.inject({
      method: 'GET',
      url: '/api/orders?limit=50',
      headers: { authorization: `Bearer ${token}` },
    });
    const rows = (list.json() as { data: Array<{ id: string; status: string }> })
      .data;
    const order =
      rows.find((o) => o.status === 'pending') ??
      rows.find((o) => o.status === 'preparing');
    if (!order) return;
    const nextStatus = order.status === 'pending' ? 'preparing' : 'ready';

    const patch = await app.inject({
      method: 'PATCH',
      url: `/api/orders/${order.id}/status`,
      headers: { authorization: `Bearer ${token}` },
      payload: { status: nextStatus },
    });
    expect(patch.statusCode).toBe(200);

    const history = await app.inject({
      method: 'GET',
      url: `/api/orders/${order.id}/history`,
      headers: { authorization: `Bearer ${token}` },
    });
    expect(history.statusCode).toBe(200);
    const historyRows = (history.json() as { data: Array<{ toStatus: string }> })
      .data;
    expect(historyRows.some((r) => r.toStatus === nextStatus)).toBe(true);
  });
});
