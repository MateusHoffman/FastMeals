import { Prisma } from '@prisma/client';
import { AppError } from '../../shared/errors/app-error.js';
import { runSerializable } from '../../shared/database/transaction.js';
import { orderInclude, toOrderDto, type OrderDto } from './order.mapper.js';
import { publishOrderEvent } from './order.events.js';
import { recordOrderStatusChange } from './order.history.js';
import type { z } from 'zod';
import type { createOrderSchema } from '../../shared/validation/index.js';

type CreateInput = z.infer<typeof createOrderSchema>;

function aggregateItems(
  items: CreateInput['items'],
): Map<string, number> {
  const map = new Map<string, number>();
  for (const item of items) {
    const prev = map.get(item.productId) ?? 0;
    const sum = prev + item.quantity;
    if (sum > 2_147_483_647) {
      throw new AppError(400, 'VALIDATION_ERROR', 'Quantidade excede limite');
    }
    map.set(item.productId, sum);
  }
  return map;
}

export async function createOrder(input: CreateInput): Promise<OrderDto> {
  const aggregated = aggregateItems(input.items);
  const productIds = [...aggregated.keys()].sort();

  return runSerializable(async (tx) => {
    const products = await tx.$queryRaw<
      Array<{
        id: string;
        name: string;
        price: Prisma.Decimal;
        is_available: boolean;
        deleted_at: Date | null;
      }>
    >`
      SELECT id, name, price, is_available, deleted_at
      FROM products
      WHERE id IN (${Prisma.join(productIds.map((id) => Prisma.sql`${id}::uuid`))})
      ORDER BY id
      FOR UPDATE
    `;

    const unavailable: Array<{
      productId: string;
      productName: string;
      reason: string;
      message: string;
    }> = [];

    for (const pid of productIds) {
      const p = products.find((row) => row.id === pid);
      if (!p || p.deleted_at) {
        unavailable.push({
          productId: pid,
          productName: 'unknown',
          reason: 'Produto nao encontrado',
          message: 'Produto nao encontrado',
        });
      } else if (!p.is_available) {
        unavailable.push({
          productId: pid,
          productName: p.name,
          reason: 'Produto indisponivel',
          message: 'Produto indisponivel',
        });
      }
    }

    if (unavailable.length > 0) {
      throw new AppError(
        422,
        'UNAVAILABLE_PRODUCT',
        'Produtos indisponiveis',
        unavailable,
      );
    }

    let total = new Prisma.Decimal(0);
    const lineItems: Array<{
      productId: string;
      quantity: number;
      unitPrice: Prisma.Decimal;
    }> = [];

    for (const pid of productIds) {
      const p = products.find((row) => row.id === pid)!;
      const qty = aggregated.get(pid)!;
      const unitPrice = p.price;
      total = total.add(unitPrice.mul(qty));
      lineItems.push({ productId: pid, quantity: qty, unitPrice });
    }

    if (total.gt(new Prisma.Decimal('99999999.99'))) {
      throw new AppError(400, 'VALIDATION_ERROR', 'Total excede limite');
    }

    const order = await tx.order.create({
      data: {
        customerName: input.customerName,
        customerPhone: input.customerPhone,
        deliveryAddress: input.deliveryAddress,
        latitude: new Prisma.Decimal(input.latitude),
        longitude: new Prisma.Decimal(input.longitude),
        totalAmount: total,
        items: {
          create: lineItems.map((li) => ({
            productId: li.productId,
            quantity: li.quantity,
            unitPrice: li.unitPrice,
          })),
        },
      },
      include: orderInclude,
    });

    await recordOrderStatusChange(tx, {
      orderId: order.id,
      fromStatus: null,
      toStatus: 'pending',
    });

    return toOrderDto(order);
  }).then((dto) => {
    publishOrderEvent('order.created', dto.id, { status: dto.status });
    return dto;
  });
}
