/**
 * Gate A — performance reproduzível (listagens + optimize-assignment).
 */
import { performance } from 'node:perf_hooks';
import { writeFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { buildApp } from '../src/app.js';
import { loadEnv } from '../src/config/env.js';
import { loginWithPassword } from '../src/modules/auth/auth.service.js';
import { execSync } from 'node:child_process';
import { ensureBenchmarkFixture } from './benchmark-fixture.js';
import { loadLocalEnv } from './load-local-env.js';
import { greedyNearestNeighborTotalKm } from '../src/algorithms/greedyBaseline.js';
import { optimizeAssignment } from '../src/algorithms/optimizeAssignment.js';

function percentile(samples: number[], p: number): number {
  const sorted = [...samples].sort((a, b) => a - b);
  const idx = Math.min(
    sorted.length - 1,
    Math.max(0, Math.ceil((p / 100) * sorted.length) - 1),
  );
  return sorted[idx]!;
}

function benchmarkRuns(): number {
  const raw = process.env.BENCHMARK_RUNS;
  if (raw) {
    const n = Number.parseInt(raw, 10);
    if (Number.isFinite(n) && n >= 5) return n;
  }
  return 30;
}

async function measureHttp(
  fn: () => Promise<void>,
  runs = benchmarkRuns(),
): Promise<{ p50: number; p95: number }> {
  for (let i = 0; i < 5; i++) await fn();
  const times: number[] = [];
  for (let i = 0; i < runs; i++) {
    const t0 = performance.now();
    await fn();
    times.push(performance.now() - t0);
  }
  return { p50: percentile(times, 50), p95: percentile(times, 95) };
}

function syntheticInputs(rows: number, cols: number) {
  const orders = Array.from({ length: rows }, (_, i) => ({
    id: `o${i}`,
    latitude: -23.5 + i * 0.001,
    longitude: -46.6,
  }));
  const persons = Array.from({ length: cols }, (_, i) => ({
    id: `p${i}`,
    currentLatitude: -23.55 + i * 0.001,
    currentLongitude: -46.65,
  }));
  return { orders, persons };
}

function syntheticOptimize(rows: number, cols: number): number {
  const { orders, persons } = syntheticInputs(rows, cols);
  const t0 = performance.now();
  optimizeAssignment(orders, persons);
  return performance.now() - t0;
}

async function main() {
  loadLocalEnv();
  process.env.DISABLE_RATE_LIMIT = 'true';
  process.env.SPA_ORIGIN ??= 'http://localhost:3000';
  process.env.JWT_SECRET ??= 'local-dev-jwt-secret-min-32-chars-change-me!!';
  process.env.JWT_REFRESH_SECRET ??=
    'local-dev-refresh-secret-min-32-change!!';

  if (process.env.SKIP_BENCHMARK_FIXTURE !== 'true') {
    await ensureBenchmarkFixture();
  }

  const env = loadEnv();
  const app = await buildApp({ env });
  const { accessToken } = await loginWithPassword(
    'admin@fastmeals.com',
    'Admin@123',
    env,
  );
  const auth = { authorization: `Bearer ${accessToken}` };

  const productsList = await measureHttp(async () => {
    const res = await app.inject({
      method: 'GET',
      url: '/api/products?limit=20&sortBy=createdAt&sortOrder=desc',
      headers: auth,
    });
    if (res.statusCode === 429) throw new Error('rate limited during benchmark');
    if (res.statusCode !== 200) throw new Error(`products ${res.statusCode}`);
  });

  const ordersList = await measureHttp(async () => {
    const res = await app.inject({
      method: 'GET',
      url: '/api/orders?limit=20&sortBy=createdAt&sortOrder=desc',
      headers: auth,
    });
    if (res.statusCode !== 200) throw new Error(`orders ${res.statusCode}`);
  });

  const optimizeHttp = await measureHttp(async () => {
    const res = await app.inject({
      method: 'POST',
      url: '/api/orders/optimize-assignment',
      headers: auth,
    });
    if (res.statusCode !== 200) throw new Error(`optimize ${res.statusCode}`);
  });

  const opt50x30 = syntheticOptimize(50, 30);
  const { orders: o50, persons: p30 } = syntheticInputs(50, 30);
  const hungarian50x30 = optimizeAssignment(o50, p30);
  const greedy50x30 = {
    totalDistanceKm: greedyNearestNeighborTotalKm(o50, p30),
    executionTimeMs: hungarian50x30.executionTimeMs,
  };

  const report = {
    at: new Date().toISOString(),
    node: process.version,
    productsListMs: productsList,
    ordersListMs: ordersList,
    optimizeHttpMs: optimizeHttp,
    optimizePure50x30Ms: Math.round(opt50x30),
    algorithmCompare50x30: {
      hungarian: {
        totalDistanceKm: hungarian50x30.totalDistanceKm,
        executionTimeMs: hungarian50x30.executionTimeMs,
      },
      greedyNearestNeighbor: greedy50x30,
    },
  };

  console.log(JSON.stringify(report, null, 2));

  const out = resolve(process.cwd(), '../docs/benchmark-latest.json');
  try {
    writeFileSync(out, JSON.stringify(report, null, 2));
  } catch {
    /* optional in CI */
  }

  if (process.env.BENCHMARK_WRITE_SNAPSHOT === 'true') {
    const snapshot = resolve(
      process.cwd(),
      '../docs/performance/benchmark-snapshot.json',
    );
    try {
      writeFileSync(snapshot, JSON.stringify(report, null, 2));
    } catch {
      /* optional */
    }
  }

  let failed = false;
  if (productsList.p95 >= 200) {
    console.error('FAIL products p95 >= 200ms', productsList.p95);
    failed = true;
  }
  if (ordersList.p95 >= 200) {
    console.error('FAIL orders p95 >= 200ms', ordersList.p95);
    failed = true;
  }
  if (optimizeHttp.p95 >= 2000) {
    console.error('FAIL optimize http p95 >= 2000ms', optimizeHttp.p95);
    failed = true;
  }
  if (opt50x30 >= 2000) {
    console.error('FAIL optimize pure 50x30 >= 2000ms', opt50x30);
    failed = true;
  }

  await app.close();

  if (
    process.env.SKIP_BENCHMARK_FIXTURE !== 'true' &&
    process.env.BENCHMARK_KEEP_FIXTURE !== 'true'
  ) {
    console.log('benchmark: restoring official seed…');
    execSync('npm run seed:reset && npm run seed', {
      stdio: 'inherit',
      cwd: process.cwd(),
      env: { ...process.env, NODE_ENV: 'development' },
    });
  }

  if (failed) process.exit(1);
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
