import { Prisma } from '@prisma/client';
import { prisma } from '../../shared/database/prisma.js';
import { AppError } from '../../shared/errors/app-error.js';
import { runSerializable } from '../../shared/database/transaction.js';
import { decimalToNumber } from '../../shared/utils/decimal.js';
import type { z } from 'zod';
import type {
  createDeliveryPersonSchema,
  deliveryPersonsQuerySchema,
  updateDeliveryPersonSchema,
} from '../../shared/validation/index.js';

type CreateInput = z.infer<typeof createDeliveryPersonSchema>;
type UpdateInput = z.infer<typeof updateDeliveryPersonSchema>;
type QueryInput = z.infer<typeof deliveryPersonsQuerySchema>;

export interface DeliveryPersonDto {
  id: string;
  name: string;
  phone: string;
  vehicleType: string;
  isActive: boolean;
  currentLatitude: number | null;
  currentLongitude: number | null;
  currentOrderId: string | null;
}

async function computeCurrentOrderIds(
  personIds: string[],
): Promise<Map<string, string | null>> {
  const map = new Map<string, string | null>();
  for (const id of personIds) map.set(id, null);
  if (personIds.length === 0) return map;

  const delivering = await prisma.order.findMany({
    where: {
      deliveryPersonId: { in: personIds },
      status: 'delivering',
    },
    select: { id: true, deliveryPersonId: true },
  });
  for (const o of delivering) {
    if (o.deliveryPersonId) map.set(o.deliveryPersonId, o.id);
  }
  return map;
}

function toDto(
  row: {
    id: string;
    name: string;
    phone: string;
    vehicleType: string;
    isActive: boolean;
    currentLatitude: Prisma.Decimal | null;
    currentLongitude: Prisma.Decimal | null;
  },
  currentOrderId: string | null,
): DeliveryPersonDto {
  return {
    id: row.id,
    name: row.name,
    phone: row.phone,
    vehicleType: row.vehicleType,
    isActive: row.isActive,
    currentLatitude: row.currentLatitude
      ? decimalToNumber(row.currentLatitude)
      : null,
    currentLongitude: row.currentLongitude
      ? decimalToNumber(row.currentLongitude)
      : null,
    currentOrderId,
  };
}

export async function listDeliveryPersons(
  query: QueryInput,
): Promise<{
  data: DeliveryPersonDto[];
  pagination: { page: number; limit: number; total: number; totalPages: number };
}> {
  const where: Prisma.DeliveryPersonWhereInput = {
    deletedAt: null,
    ...(query.isActive !== undefined ? { isActive: query.isActive } : {}),
    ...(query.available === true
      ? {
          isActive: true,
          orders: { none: { status: 'delivering' } },
        }
      : {}),
  };

  const orderBy: Prisma.DeliveryPersonOrderByWithRelationInput[] = [
    { [query.sortBy]: query.sortOrder },
    { id: query.sortOrder },
  ];

  const [total, rows] = await Promise.all([
    prisma.deliveryPerson.count({ where }),
    prisma.deliveryPerson.findMany({
      where,
      orderBy,
      skip: (query.page - 1) * query.limit,
      take: query.limit,
    }),
  ]);

  const orderMap = await computeCurrentOrderIds(rows.map((r) => r.id));
  const data = rows.map((r) => toDto(r, orderMap.get(r.id) ?? null));

  return {
    data,
    pagination: {
      page: query.page,
      limit: query.limit,
      total,
      totalPages: Math.ceil(total / query.limit) || 1,
    },
  };
}

export async function getDeliveryPersonById(id: string): Promise<DeliveryPersonDto> {
  const row = await prisma.deliveryPerson.findFirst({
    where: { id, deletedAt: null },
  });
  if (!row) {
    throw new AppError(
      404,
      'DELIVERY_PERSON_NOT_FOUND',
      'Entregador nao encontrado',
    );
  }
  const orderMap = await computeCurrentOrderIds([id]);
  return toDto(row, orderMap.get(id) ?? null);
}

export async function createDeliveryPerson(
  input: CreateInput,
): Promise<DeliveryPersonDto> {
  const row = await prisma.deliveryPerson.create({
    data: {
      name: input.name,
      phone: input.phone,
      vehicleType: input.vehicleType,
      isActive: input.isActive ?? true,
      currentLatitude:
        input.currentLatitude != null
          ? new Prisma.Decimal(input.currentLatitude)
          : null,
      currentLongitude:
        input.currentLongitude != null
          ? new Prisma.Decimal(input.currentLongitude)
          : null,
    },
  });
  return toDto(row, null);
}

export async function updateDeliveryPerson(
  id: string,
  input: UpdateInput,
): Promise<DeliveryPersonDto> {
  const existing = await prisma.deliveryPerson.findFirst({
    where: { id, deletedAt: null },
  });
  if (!existing) {
    throw new AppError(
      404,
      'DELIVERY_PERSON_NOT_FOUND',
      'Entregador nao encontrado',
    );
  }

  const row = await prisma.deliveryPerson.update({
    where: { id },
    data: {
      ...(input.name !== undefined ? { name: input.name } : {}),
      ...(input.phone !== undefined ? { phone: input.phone } : {}),
      ...(input.vehicleType !== undefined
        ? { vehicleType: input.vehicleType }
        : {}),
      ...(input.isActive !== undefined ? { isActive: input.isActive } : {}),
      ...(input.currentLatitude !== undefined
        ? {
            currentLatitude:
              input.currentLatitude === null
                ? null
                : new Prisma.Decimal(input.currentLatitude),
          }
        : {}),
      ...(input.currentLongitude !== undefined
        ? {
            currentLongitude:
              input.currentLongitude === null
                ? null
                : new Prisma.Decimal(input.currentLongitude),
          }
        : {}),
    },
  });
  const orderMap = await computeCurrentOrderIds([id]);
  return toDto(row, orderMap.get(id) ?? null);
}

export async function deleteDeliveryPerson(id: string): Promise<void> {
  await runSerializable(async (tx) => {
    const person = await tx.deliveryPerson.findFirst({
      where: { id, deletedAt: null },
    });
    if (!person) {
      throw new AppError(
        404,
        'DELIVERY_PERSON_NOT_FOUND',
        'Entregador nao encontrado',
      );
    }

    const delivering = await tx.order.count({
      where: { deliveryPersonId: id, status: 'delivering' },
    });
    if (delivering > 0) {
      throw new AppError(
        409,
        'DELIVERY_PERSON_IN_USE',
        'Entregador com pedido em entrega',
      );
    }

    await tx.order.updateMany({
      where: {
        deliveryPersonId: id,
        status: { in: ['pending', 'preparing', 'ready'] },
      },
      data: { deliveryPersonId: null },
    });

    await tx.deliveryPerson.update({
      where: { id },
      data: { deletedAt: new Date(), isActive: false },
    });
  });
}
