import type { FastifyInstance } from 'fastify';
import type { Env } from '../../config/env.js';
import { authenticateRequest } from '../../shared/middlewares/auth.js';
import {
  reportDateQuerySchema,
  revenueQuerySchema,
  topProductsQuerySchema,
} from '../../shared/validation/index.js';
import {
  getAverageDeliveryTimeReport,
  getOrdersByStatusReport,
  getRevenueReport,
  getTopProductsReport,
} from './reports.service.js';
import { AppError } from '../../shared/errors/app-error.js';

export async function registerReportRoutes(
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

  app.get('/reports/revenue', async (request) => {
    const query = revenueQuerySchema.parse(request.query);
    return getRevenueReport(query);
  });

  app.get('/reports/orders-by-status', async (request) => {
    const query = reportDateQuerySchema.parse(request.query);
    return getOrdersByStatusReport(query);
  });

  app.get('/reports/top-products', async (request) => {
    const query = topProductsQuerySchema.parse(request.query);
    return getTopProductsReport(query, query.limit);
  });

  app.get('/reports/average-delivery-time', async (request) => {
    const query = reportDateQuerySchema.parse(request.query);
    return getAverageDeliveryTimeReport(query);
  });
}
