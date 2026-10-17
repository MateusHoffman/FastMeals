import type { FastifyInstance } from 'fastify';
import type { Env } from '../../config/env.js';
import {
  authenticateRequest,
  requireAdmin,
} from '../../shared/middlewares/auth.js';
import {
  usesCookieAuth,
  validateCsrf,
  validateOrigin,
} from '../../shared/middlewares/csrf.js';
import {
  acceptAssignmentsBatchSchema,
  assignSchema,
  createOrderSchema,
  ordersQuerySchema,
  patchStatusSchema,
  uuidSchema,
} from '../../shared/validation/index.js';
import {
  acceptAssignment,
  acceptAssignmentsBatch,
  assignDeliveryPerson,
  createOrder,
  getOrderById,
  listOrders,
  optimizeOrders,
  patchOrderStatus,
  listOrderStatusHistory,
} from './order.service.js';
import { handleOrdersStream } from './order.stream.js';
import { AppError } from '../../shared/errors/app-error.js';
import { observeAssignmentOptimization } from '../../shared/plugins/metrics.js';

async function guardWrite(
  request: Parameters<typeof usesCookieAuth>[0],
  env: Env,
) {
  if (usesCookieAuth(request)) {
    validateOrigin(request, env);
    validateCsrf(request);
  }
}

function parseUuidParam(raw: string): string {
  try {
    return uuidSchema.parse(raw);
  } catch {
    throw new AppError(400, 'VALIDATION_ERROR', 'UUID invalido');
  }
}

export async function registerOrderRoutes(
  app: FastifyInstance,
  env: Env,
): Promise<void> {
  app.addHook('preHandler', async (request) => {
    const user = await authenticateRequest(request, env);
    if (!user) {
      throw new AppError(401, 'INVALID_TOKEN', 'Nao autenticado');
    }
    request.user = user;
  });

  app.get('/orders', async (request) => {
    const query = ordersQuerySchema.parse(request.query);
    return listOrders(query);
  });

  app.post('/orders/accept-assignments', async (request) => {
    await requireAdmin()(request);
    await guardWrite(request, env);
    const body = acceptAssignmentsBatchSchema.parse(request.body);
    return acceptAssignmentsBatch(body.assignments, request.user?.id);
  });

  app.post('/orders/optimize-assignment', async (request, reply) => {
    await requireAdmin()(request);
    await guardWrite(request, env);
    if (
      request.body &&
      typeof request.body === 'object' &&
      Object.keys(request.body as object).length > 0
    ) {
      throw new AppError(400, 'VALIDATION_ERROR', 'Body deve ser vazio');
    }
    const t0 = performance.now();
    const result = await optimizeOrders();
    const durationMs = Math.round(performance.now() - t0);
    observeAssignmentOptimization(
      result.algorithm,
      durationMs / 1000,
    );
    request.log.info(
      {
        durationMs,
        assignments: result.assignments.length,
        unassigned: result.unassigned.length,
        algorithm: result.algorithm,
      },
      'optimize-assignment completed',
    );
    return reply.send(result);
  });

  app.get('/orders/stream', async (request, reply) => {
    await handleOrdersStream(request, reply);
  });

  app.get('/orders/:id/history', async (request) => {
    const id = parseUuidParam((request.params as { id: string }).id);
    return { data: await listOrderStatusHistory(id) };
  });

  app.get('/orders/:id', async (request) => {
    const id = parseUuidParam((request.params as { id: string }).id);
    return getOrderById(id);
  });

  app.post('/orders', async (request, reply) => {
    await requireAdmin()(request);
    await guardWrite(request, env);
    const body = createOrderSchema.parse(request.body);
    const order = await createOrder(body);
    return reply.status(201).send(order);
  });

  app.patch('/orders/:id/status', async (request) => {
    await requireAdmin()(request);
    await guardWrite(request, env);
    const id = parseUuidParam((request.params as { id: string }).id);
    const body = patchStatusSchema.parse(request.body);
    return patchOrderStatus(id, body.status, request.user?.id);
  });

  app.patch('/orders/:id/assign', async (request) => {
    await requireAdmin()(request);
    await guardWrite(request, env);
    const id = parseUuidParam((request.params as { id: string }).id);
    const body = assignSchema.parse(request.body);
    return assignDeliveryPerson(id, body.deliveryPersonId);
  });

  app.post('/orders/:id/accept-assignment', async (request) => {
    await requireAdmin()(request);
    await guardWrite(request, env);
    const id = parseUuidParam((request.params as { id: string }).id);
    const body = assignSchema.parse(request.body);
    return acceptAssignment(id, body.deliveryPersonId, request.user?.id);
  });
}
