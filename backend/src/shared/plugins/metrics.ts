import type { FastifyInstance, FastifyRequest } from 'fastify';
import client from 'prom-client';

declare module 'fastify' {
  interface FastifyRequest {
    metricsStart?: bigint;
  }
}

export const metricsRegister = new client.Registry();

client.collectDefaultMetrics({
  register: metricsRegister,
  labels: { service: 'fastmeals-api' },
});

const httpRequestDuration = new client.Histogram({
  name: 'http_request_duration_seconds',
  help: 'Latencia HTTP em segundos',
  labelNames: ['method', 'route', 'status_code'],
  buckets: [0.005, 0.01, 0.025, 0.05, 0.1, 0.25, 0.5, 1, 2.5, 5, 10],
  registers: [metricsRegister],
});

const httpRequestsTotal = new client.Counter({
  name: 'http_requests_total',
  help: 'Total de requisicoes HTTP',
  labelNames: ['method', 'route', 'status_code'],
  registers: [metricsRegister],
});

export const assignmentOptimizationDuration = new client.Histogram({
  name: 'assignment_optimization_duration_seconds',
  help: 'Tempo do algoritmo de otimizacao de entregas',
  labelNames: ['algorithm'],
  buckets: [0.01, 0.05, 0.1, 0.25, 0.5, 1, 2, 5, 10, 30],
  registers: [metricsRegister],
});

function routeLabel(request: FastifyRequest): string {
  return request.routeOptions.url ?? 'unknown';
}

export async function registerMetrics(app: FastifyInstance): Promise<void> {
  app.addHook('onRequest', async (request) => {
    request.metricsStart = process.hrtime.bigint();
  });

  app.addHook('onResponse', async (request, reply) => {
    const start = request.metricsStart;
    if (start === undefined) return;

    const durationSec = Number(process.hrtime.bigint() - start) / 1e9;
    const labels = {
      method: request.method,
      route: routeLabel(request),
      status_code: String(reply.statusCode),
    };
    httpRequestDuration.observe(labels, durationSec);
    httpRequestsTotal.inc(labels);
  });

  app.get('/metrics', async (_request, reply) => {
    reply.header('Content-Type', metricsRegister.contentType);
    return metricsRegister.metrics();
  });
}

export function observeAssignmentOptimization(
  algorithm: string,
  durationSeconds: number,
): void {
  assignmentOptimizationDuration.observe({ algorithm }, durationSeconds);
}
