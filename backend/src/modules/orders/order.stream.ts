import type { FastifyReply, FastifyRequest } from 'fastify';
import { orderEventHub, type OrderEvent } from './order.events.js';

export async function handleOrdersStream(
  request: FastifyRequest,
  reply: FastifyReply,
): Promise<void> {
  reply.hijack();
  reply.raw.writeHead(200, {
    'Content-Type': 'text/event-stream; charset=utf-8',
    'Cache-Control': 'no-cache, no-transform',
    Connection: 'keep-alive',
    'X-Accel-Buffering': 'no',
  });
  reply.raw.write(': connected\n\n');

  const onEvent = (event: OrderEvent) => {
    reply.raw.write(`data: ${JSON.stringify(event)}\n\n`);
  };

  const unsub = orderEventHub.subscribe(onEvent);

  const heartbeat = setInterval(() => {
    reply.raw.write(': heartbeat\n\n');
  }, 30_000);

  const cleanup = () => {
    clearInterval(heartbeat);
    unsub();
  };

  await new Promise<void>((resolve) => {
    const finish = () => {
      cleanup();
      resolve();
    };
    request.raw.once('close', finish);
    request.raw.once('error', finish);
  });
}
