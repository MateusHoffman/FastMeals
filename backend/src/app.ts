import Fastify, { type FastifyInstance } from 'fastify';
import cors from '@fastify/cors';
import cookie from '@fastify/cookie';
import helmet from '@fastify/helmet';
import rateLimit from '@fastify/rate-limit';
import {
  serializerCompiler,
  validatorCompiler,
  type ZodTypeProvider,
} from 'fastify-type-provider-zod';
import { ZodError } from 'zod';
import { loadEnv, type Env } from './config/env.js';
import { AppError, errorEnvelope } from './shared/errors/app-error.js';
import { registerHealthRoutes } from './modules/health/health.routes.js';
import { registerAuthRoutes } from './modules/auth/auth.routes.js';
import { registerProductRoutes } from './modules/products/product.routes.js';
import { registerOrderRoutes } from './modules/orders/order.routes.js';
import { registerDeliveryRoutes } from './modules/delivery-persons/delivery-person.routes.js';
import { registerReportRoutes } from './modules/reports/reports.routes.js';
import { registerSwagger } from './shared/plugins/swagger.js';
import { registerMetrics } from './shared/plugins/metrics.js';

export async function buildApp(options?: {
  env?: Env;
}): Promise<FastifyInstance> {
  const env = options?.env ?? loadEnv();

  const app = Fastify({
    logger: {
      level: env.NODE_ENV === 'production' ? 'info' : 'debug',
      redact: [
        'req.headers.authorization',
        'req.headers.cookie',
        'req.body.password',
        'req.body.refreshToken',
      ],
    },
    trustProxy: env.TRUST_PROXY,
    bodyLimit: 1_048_576,
    requestIdHeader: 'x-request-id',
    genReqId: () => crypto.randomUUID(),
  }).withTypeProvider<ZodTypeProvider>();

  app.setValidatorCompiler(validatorCompiler);
  app.setSerializerCompiler(serializerCompiler);

  await app.register(helmet, {
    contentSecurityPolicy: false,
    global: true,
  });

  if (env.CORS_ORIGIN) {
    await app.register(cors, {
      origin: env.CORS_ORIGIN,
      credentials: true,
    });
  }

  await app.register(cookie);

  await app.register(rateLimit, {
    max: 100,
    timeWindow: '1 minute',
    keyGenerator: (request) => request.ip,
    allowList: (request) => {
      if (process.env.DISABLE_RATE_LIMIT === 'true') return true;
      const url = request.url.split('?')[0] ?? '';
      return (
        url === '/api/health' ||
        url === '/api/health/live' ||
        url === '/metrics'
      );
    },
    errorResponseBuilder: () =>
      errorEnvelope('RATE_LIMIT_EXCEEDED', 'Limite de requisicoes excedido'),
  });

  app.setNotFoundHandler((request, reply) => {
    reply
      .status(404)
      .send(errorEnvelope('ROUTE_NOT_FOUND', 'Rota nao encontrada'));
  });

  app.setErrorHandler((error, request, reply) => {
    if (error instanceof AppError) {
      return reply
        .status(error.statusCode)
        .send(errorEnvelope(error.code, error.message, error.details));
    }

    if (error instanceof ZodError) {
      const details = error.issues.map((issue) => ({
        field: issue.path.join('.') || 'body',
        message: issue.message,
      }));
      return reply
        .status(400)
        .send(errorEnvelope('VALIDATION_ERROR', 'Dados invalidos', details));
    }

    const fastifyError = error as {
      validation?: Array<{
        params?: { issue?: { path?: string[]; message?: string } };
      }>;
      statusCode?: number;
    };

    if (fastifyError.validation) {
      const details = fastifyError.validation.map((v) => ({
        field: v.params?.issue?.path?.join('.') ?? 'body',
        message: v.params?.issue?.message ?? 'Invalido',
      }));
      return reply
        .status(400)
        .send(errorEnvelope('VALIDATION_ERROR', 'Dados invalidos', details));
    }

    if (fastifyError.statusCode === 429) {
      return reply
        .status(429)
        .send(errorEnvelope('RATE_LIMIT_EXCEEDED', 'Limite excedido'));
    }

    request.log.error(error);
    return reply
      .status(500)
      .send(errorEnvelope('INTERNAL_ERROR', 'Erro interno'));
  });

  if (env.NODE_ENV !== 'production' || process.env.ENABLE_SWAGGER === 'true') {
    await registerSwagger(app);
  }

  await registerMetrics(app);

  await app.register(
    async (api) => {
      await api.register(async (scope) => registerHealthRoutes(scope, env));
      await api.register(async (scope) => registerAuthRoutes(scope, env));
      await api.register(async (scope) => registerProductRoutes(scope, env));
      await api.register(async (scope) => registerOrderRoutes(scope, env));
      await api.register(async (scope) => registerDeliveryRoutes(scope, env));
      await api.register(async (scope) => registerReportRoutes(scope, env));
    },
    { prefix: '/api' },
  );

  return app;
}
