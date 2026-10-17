import { Prisma } from '@prisma/client';
import { prisma } from '../../shared/database/prisma.js';
import { AppError } from '../../shared/errors/app-error.js';
import {
  orderInclude,
  toOrderDto,
  type OrderDto,
} from './order.mapper.js';
import type { z } from 'zod';
import type { ordersQuerySchema } from '../../shared/validation/index.js';

type QueryInput = z.infer<typeof ordersQuerySchema>;

export function utcRange(
  startDate?: string,
  endDate?: string,
): Prisma.DateTimeFilter | undefined {
  if (!startDate && !endDate) return undefined;
  const filter: Prisma.DateTimeFilter = {};
  if (startDate) {
    filter.gte = new Date(`${startDate}T00:00:00.000Z`);
  }
  if (endDate) {
    const end = new Date(`${endDate}T00:00:00.000Z`);
    end.setUTCDate(end.getUTCDate() + 1);
    filter.lt = end;
  }
  return filter;
}

export async function listOrders(query: QueryInput): Promise<{
  data: OrderDto[];
  pagination: { page: number; limit: number; total: number; totalPages: number };
}> {
  const createdAt = utcRange(query.startDate, query.endDate);
  const where: Prisma.OrderWhereInput = {
    ...(query.status ? { status: query.status } : {}),
    ...(createdAt ? { createdAt } : {}),
    ...(query.deliveryPersonId
      ? { deliveryPersonId: query.deliveryPersonId }
      : {}),
    ...(query.search
      ? {
          customerName: {
            contains: query.search,
            mode: 'insensitive',
          },
        }
      : {}),
    ...(query.customerPhone
      ? {
          customerPhone: {
            contains: query.customerPhone,
          },
        }
      : {}),
  };

  const orderBy: Prisma.OrderOrderByWithRelationInput[] = [
    { [query.sortBy]: query.sortOrder },
    { id: query.sortOrder },
  ];

  const [total, rows] = await Promise.all([
    prisma.order.count({ where }),
    prisma.order.findMany({
      where,
      include: orderInclude,
      orderBy,
      skip: (query.page - 1) * query.limit,
      take: query.limit,
    }),
  ]);

  return {
    data: rows.map(toOrderDto),
    pagination: {
      page: query.page,
      limit: query.limit,
      total,
      totalPages: Math.ceil(total / query.limit) || 1,
    },
  };
}

export async function getOrderById(id: string): Promise<OrderDto> {
  const order = await prisma.order.findUnique({
    where: { id },
    include: orderInclude,
  });
  if (!order) {
    throw new AppError(404, 'ORDER_NOT_FOUND', 'Pedido nao encontrado');
  }
  return toOrderDto(order);
}
