import { loadLocalEnv } from '../scripts/load-local-env.js';
import { buildApp } from './app.js';
import { loadEnv } from './config/env.js';
import { disconnectPrisma } from './shared/database/prisma.js';

loadLocalEnv();

async function main() {
  const env = loadEnv();
  const app = await buildApp({ env });

  const shutdown = async (signal: string) => {
    app.log.info(`Received ${signal}, shutting down`);
    await app.close();
    await disconnectPrisma();
    process.exit(0);
  };

  process.on('SIGTERM', () => void shutdown('SIGTERM'));
  process.on('SIGINT', () => void shutdown('SIGINT'));

  await app.listen({ port: env.PORT, host: env.HOST });
  app.log.info(`API listening on ${env.HOST}:${env.PORT}`);
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
