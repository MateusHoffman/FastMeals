import { Prisma } from '@prisma/client';
import { prisma } from './prisma.js';

export class LockSetChangedError extends Error {
  constructor() {
    super('LOCK_SET_CHANGED');
    this.name = 'LockSetChangedError';
  }
}

const MAX_RETRIES = 3;

async function jitterBackoff(attempt: number): Promise<void> {
  const ms = 50 * (attempt + 1) + Math.random() * 30;
  await new Promise((r) => setTimeout(r, ms));
}

export async function runSerializable<T>(
  fn: (tx: Prisma.TransactionClient) => Promise<T>,
): Promise<T> {
  let lastError: unknown;
  for (let attempt = 0; attempt < MAX_RETRIES; attempt++) {
    try {
      return await prisma.$transaction(fn, {
        isolationLevel: Prisma.TransactionIsolationLevel.Serializable,
        maxWait: 2000,
        timeout: 5000,
      });
    } catch (err) {
      lastError = err;
      if (err instanceof LockSetChangedError) {
        await jitterBackoff(attempt);
        continue;
      }
      if (
        err instanceof Prisma.PrismaClientKnownRequestError &&
        err.code === 'P2034'
      ) {
        await jitterBackoff(attempt);
        continue;
      }
      throw err;
    }
  }
  throw lastError;
}
