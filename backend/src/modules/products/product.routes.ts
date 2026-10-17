import type { FastifyInstance } from 'fastify';
import type { Env } from '../../config/env.js';
import {
  requireAuth,
  requireAdmin,
  authenticateRequest,
} from '../../shared/middlewares/auth.js';
import {
  validateCsrf,
  validateOrigin,
  usesCookieAuth,
} from '../../shared/middlewares/csrf.js';
import {
  createProductSchema,
  productsQuerySchema,
  updateProductSchema,
  uuidSchema,
} from '../../shared/validation/index.js';
import {
  createProduct,
  deleteProduct,
  getProductById,
  listProducts,
  updateProduct,
} from './product.service.js';
import { AppError } from '../../shared/errors/app-error.js';

async function guardWrite(request: Parameters<typeof usesCookieAuth>[0], env: Env) {
  if (usesCookieAuth(request)) {
    validateOrigin(request, env);
    validateCsrf(request);
  }
}

export async function registerProductRoutes(
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

  app.get('/products', async (request) => {
    const query = productsQuerySchema.parse(request.query);
    return listProducts(query);
  });

  app.get('/products/:id', async (request) => {
    const id = uuidSchema.parse((request.params as { id: string }).id);
    return getProductById(id);
  });

  app.post('/products', async (request, reply) => {
    await requireAdmin()(request);
    await guardWrite(request, env);
    const body = createProductSchema.parse(request.body);
    const product = await createProduct(body);
    return reply.status(201).send(product);
  });

  app.put('/products/:id', async (request) => {
    await requireAdmin()(request);
    await guardWrite(request, env);
    const id = uuidSchema.parse((request.params as { id: string }).id);
    const body = updateProductSchema.parse(request.body);
    return updateProduct(id, body);
  });

  app.delete('/products/:id', async (request, reply) => {
    await requireAdmin()(request);
    await guardWrite(request, env);
    const id = uuidSchema.parse((request.params as { id: string }).id);
    await deleteProduct(id);
    return reply.status(204).send();
  });
}

void requireAuth;
