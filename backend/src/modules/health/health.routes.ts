import type { FastifyInstance } from 'fastify';
import type { Env } from '../../config/env.js';
import { prisma } from '../../shared/database/prisma.js';
import { AppError, errorEnvelope } from '../../shared/errors/app-error.js';

export async function registerHealthRoutes(
  app: FastifyInstance,
  _env: Env,
): Promise<void> {
  app.get('/health/live', async () => ({
    status: 'ok',
    timestamp: new Date().toISOString(),
  }));

  app.get('/health', async (_req, reply) => {
    try {
      await prisma.$queryRaw`SELECT 1`;
      return {
        status: 'ok',
        timestamp: new Date().toISOString(),
      };
    } catch {
      return reply
        .status(500)
        .send(errorEnvelope('INTERNAL_ERROR', 'Banco indisponivel'));
    }
  });
}

void AppError;
