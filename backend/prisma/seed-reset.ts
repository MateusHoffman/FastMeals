import { loadLocalEnv } from '../scripts/load-local-env.js';
import { prisma } from '../src/shared/database/prisma.js';

/** Limpa dados de dev/teste (não usar em produção). */
export async function resetDevDatabase(): Promise<void> {
  if (process.env.NODE_ENV === 'production') {
    throw new Error('seed:reset blocked in production');
  }
  await prisma.orderStatusHistory.deleteMany();
  await prisma.orderItem.deleteMany();
  await prisma.order.deleteMany();
  await prisma.product.deleteMany();
  await prisma.deliveryPerson.deleteMany();
  await prisma.user.deleteMany();
}

async function main() {
  loadLocalEnv();
  await resetDevDatabase();
  console.log('Database cleared for re-seed');
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
