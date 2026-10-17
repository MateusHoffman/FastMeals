import { Prisma } from '@prisma/client';

export function decimalToNumber(value: Prisma.Decimal): number {
  return value.toNumber();
}

export function roundMoney(value: number): number {
  return Math.round(value * 100) / 100;
}

export function toSafeNumber(value: bigint): number {
  const max = BigInt(Number.MAX_SAFE_INTEGER);
  if (value > max) {
    throw new Error('Integer exceeds safe JSON range');
  }
  return Number(value);
}
