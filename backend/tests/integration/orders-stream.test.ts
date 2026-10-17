import { describe, it, expect, beforeAll, afterAll } from 'vitest';
import { buildApp } from '../../src/app.js';
import type { FastifyInstance } from 'fastify';
import { adminToken } from '../helpers/auth.js';
import { orderEventHub } from '../../src/modules/orders/order.events.js';

describe('orders SSE stream', () => {
  let app: FastifyInstance;
  let token: string;

  beforeAll(async () => {
    app = await buildApp();
    token = await adminToken(app);
  });

  afterAll(async () => {
    await app.close();
  });

  it('requires authentication', async () => {
    const res = await app.inject({
      method: 'GET',
      url: '/api/orders/stream',
    });
    expect(res.statusCode).toBe(401);
  });

  it('emits status_changed when order is patched', async () => {
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

    const events: Array<{ type: string; orderId: string }> = [];
    const unsub = orderEventHub.subscribe((e) => {
      events.push({ type: e.type, orderId: e.orderId });
    });

    try {
      const patch = await app.inject({
        method: 'PATCH',
        url: `/api/orders/${order!.id}/status`,
        headers: { authorization: `Bearer ${token}` },
        payload: { status: nextStatus },
      });
      expect(patch.statusCode).toBe(200);
      expect(
        events.some(
          (e) =>
            e.type === 'order.status_changed' && e.orderId === order.id,
        ),
      ).toBe(true);
    } finally {
      unsub();
    }
  });
});
