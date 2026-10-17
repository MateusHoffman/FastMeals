import type { OrderStatus, Prisma } from '@prisma/client';
import { prisma } from '../../shared/database/prisma.js';
import { AppError } from '../../shared/errors/app-error.js';
export interface OrderStatusHistoryDto {
  id: string;
  fromStatus: OrderStatus | null;
  toStatus: OrderStatus;
  changedByUserId: string | null;
  changedByEmail: string | null;
  createdAt: string;
}

export async function recordOrderStatusChange(
  tx: Prisma.TransactionClient,
  input: {
    orderId: string;
    fromStatus: OrderStatus | null;
    toStatus: OrderStatus;
    changedByUserId?: string | undefined;
  },
): Promise<void> {
  await tx.orderStatusHistory.create({
    data: {
      orderId: input.orderId,
      fromStatus: input.fromStatus,
      toStatus: input.toStatus,
      changedByUserId: input.changedByUserId ?? null,
    },
  });
}

export async function listOrderStatusHistory(
  orderId: string,
): Promise<OrderStatusHistoryDto[]> {
  const order = await prisma.order.findUnique({
    where: { id: orderId },
    select: { id: true },
  });
  if (!order) {
    throw new AppError(404, 'ORDER_NOT_FOUND', 'Pedido nao encontrado');
  }

  const rows = await prisma.orderStatusHistory.findMany({
    where: { orderId },
    orderBy: { createdAt: 'desc' },
    include: {
      changedBy: { select: { email: true } },
    },
  });

  return rows.map((row) => ({
    id: row.id,
    fromStatus: row.fromStatus,
    toStatus: row.toStatus,
    changedByUserId: row.changedByUserId,
    changedByEmail: row.changedBy?.email ?? null,
    createdAt: row.createdAt.toISOString(),
  }));
}
