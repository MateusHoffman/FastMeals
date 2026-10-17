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
  createDeliveryPersonSchema,
  deliveryPersonsQuerySchema,
  updateDeliveryPersonSchema,
  uuidSchema,
} from '../../shared/validation/index.js';
import {
  createDeliveryPerson,
  deleteDeliveryPerson,
  getDeliveryPersonById,
  listDeliveryPersons,
  updateDeliveryPerson,
} from './delivery-person.service.js';
import { AppError } from '../../shared/errors/app-error.js';

async function guardWrite(
  request: Parameters<typeof usesCookieAuth>[0],
  env: Env,
) {
  if (usesCookieAuth(request)) {
    validateOrigin(request, env);
    validateCsrf(request);
  }
}

export async function registerDeliveryRoutes(
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

  app.get('/delivery-persons', async (request) => {
    const query = deliveryPersonsQuerySchema.parse(request.query);
    return listDeliveryPersons(query);
  });

  app.get('/delivery-persons/:id', async (request) => {
    const id = uuidSchema.parse((request.params as { id: string }).id);
    return getDeliveryPersonById(id);
  });

  app.post('/delivery-persons', async (request, reply) => {
    await requireAdmin()(request);
    await guardWrite(request, env);
    const body = createDeliveryPersonSchema.parse(request.body);
    const person = await createDeliveryPerson(body);
    return reply.status(201).send(person);
  });

  app.put('/delivery-persons/:id', async (request) => {
    await requireAdmin()(request);
    await guardWrite(request, env);
    const id = uuidSchema.parse((request.params as { id: string }).id);
    const body = updateDeliveryPersonSchema.parse(request.body);
    return updateDeliveryPerson(id, body);
  });

  app.delete('/delivery-persons/:id', async (request, reply) => {
    await requireAdmin()(request);
    await guardWrite(request, env);
    const id = uuidSchema.parse((request.params as { id: string }).id);
    await deleteDeliveryPerson(id);
    return reply.status(204).send();
  });
}
