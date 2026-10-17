import { v5 as uuidv5 } from 'uuid';
import { loadLocalEnv } from '../scripts/load-local-env.js';
import { readSeedDataJson, resolveSeedDataPath } from './seed-data-path.js';
import { Prisma } from '@prisma/client';
import { z } from 'zod';
import { prisma } from '../src/shared/database/prisma.js';
import { hashPassword } from '../src/modules/auth/auth.service.js';

const NS = '6ba7b810-9dad-11d1-80b4-00c04fd430c8';

const seedSchema = z.object({
  users: z.array(
    z.object({
      email: z.string(),
      password: z.string(),
      role: z.enum(['admin', 'viewer']),
    }),
  ),
  products: z.array(
    z.object({
      name: z.string(),
      description: z.string(),
      price: z.number(),
      category: z.enum(['meal', 'drink', 'dessert', 'side']),
      imageUrl: z.string().optional(),
      isAvailable: z.boolean(),
      preparationTime: z.number(),
    }),
  ),
  deliveryPersons: z.array(
    z.object({
      name: z.string(),
      phone: z.string(),
      vehicleType: z.enum(['bicycle', 'motorcycle', 'car']),
      isActive: z.boolean(),
      currentLatitude: z.number().nullable().optional(),
      currentLongitude: z.number().nullable().optional(),
    }),
  ),
  orders: z.array(
    z.object({
      customerName: z.string(),
      customerPhone: z.string(),
      deliveryAddress: z.string(),
      latitude: z.number(),
      longitude: z.number(),
      status: z.enum([
        'pending',
        'preparing',
        'ready',
        'delivering',
        'delivered',
        'cancelled',
      ]),
      deliveryPersonIndex: z.number().optional(),
      items: z.array(
        z.object({
          productIndex: z.number(),
          quantity: z.number(),
        }),
      ),
    }),
  ),
});

const DELIVERED_OFFSETS = [42, 35, 50, 28];
const DELIVERED_INDICES = [5, 6, 8, 11];

function idFor(collection: string, index: number): string {
  return uuidv5(`${collection}:${index}`, NS);
}

function anchorDate(): Date {
  const raw = process.env.SEED_ANCHOR_DATE;
  if (raw) {
    return new Date(`${raw}T00:00:00.000Z`);
  }
  const d = new Date();
  d.setUTCHours(0, 0, 0, 0);
  d.setUTCDate(d.getUTCDate() - 1);
  return d;
}

async function main() {
  loadLocalEnv();
  const path = resolveSeedDataPath();
  console.log(`seed source: ${path}`);
  const data = seedSchema.parse(JSON.parse(readSeedDataJson()));

  await prisma.$transaction(async (tx) => {
    await tx.$executeRaw`SELECT pg_advisory_xact_lock(42424242)`;

    const counts = await Promise.all([
      tx.user.count(),
      tx.product.count(),
      tx.deliveryPerson.count(),
      tx.order.count(),
    ]);
    if (counts.some((c) => c > 0)) {
      console.log('seed skipped: database not empty');
      return;
    }

    const anchor = anchorDate();
    const entityCreated = new Date(anchor);
    entityCreated.setUTCDate(entityCreated.getUTCDate() - 30);

    for (let i = 0; i < data.users.length; i++) {
      const u = data.users[i]!;
      await tx.user.create({
        data: {
          id: idFor('users', i),
          email: u.email.toLowerCase(),
          passwordHash: await hashPassword(u.password),
          role: u.role,
          createdAt: entityCreated,
          updatedAt: entityCreated,
        },
      });
    }

    const productIds: string[] = [];
    for (let i = 0; i < data.products.length; i++) {
      const p = data.products[i]!;
      const id = idFor('products', i);
      productIds.push(id);
      await tx.product.create({
        data: {
          id,
          name: p.name,
          description: p.description,
          price: new Prisma.Decimal(p.price),
          category: p.category,
          imageUrl: p.imageUrl ?? null,
          isAvailable: p.isAvailable,
          preparationTime: p.preparationTime,
          createdAt: entityCreated,
          updatedAt: entityCreated,
        },
      });
    }

    const personIds: string[] = [];
    for (let i = 0; i < data.deliveryPersons.length; i++) {
      const d = data.deliveryPersons[i]!;
      const id = idFor('deliveryPersons', i);
      personIds.push(id);
      await tx.deliveryPerson.create({
        data: {
          id,
          name: d.name,
          phone: d.phone,
          vehicleType: d.vehicleType,
          isActive: d.isActive,
          currentLatitude:
            d.currentLatitude != null
              ? new Prisma.Decimal(d.currentLatitude)
              : null,
          currentLongitude:
            d.currentLongitude != null
              ? new Prisma.Decimal(d.currentLongitude)
              : null,
          createdAt: entityCreated,
        },
      });
    }

    const nOrders = data.orders.length;
    for (let i = 0; i < nOrders; i++) {
      const o = data.orders[i]!;
      const createdAt = new Date(anchor);
      createdAt.setUTCDate(createdAt.getUTCDate() - (nOrders - 1 - i));

      let total = new Prisma.Decimal(0);
      const itemsData = o.items.map((item) => {
        const pid = productIds[item.productIndex]!;
        const price = data.products[item.productIndex]!.price;
        const unitPrice = new Prisma.Decimal(price);
        total = total.add(unitPrice.mul(item.quantity));
        return {
          id: uuidv5(`order-item:${i}:${item.productIndex}`, NS),
          productId: pid,
          quantity: item.quantity,
          unitPrice,
          createdAt,
        };
      });

      const deliveryPersonId =
        o.deliveryPersonIndex != null
          ? personIds[o.deliveryPersonIndex]
          : null;

      let deliveredAt: Date | null = null;
      let deliveryVehicleType: 'bicycle' | 'motorcycle' | 'car' | null = null;
      let updatedAt = createdAt;

      const deliveredIdx = DELIVERED_INDICES.indexOf(i);
      if (deliveredIdx >= 0) {
        deliveredAt = new Date(createdAt);
        deliveredAt.setUTCMinutes(
          deliveredAt.getUTCMinutes() + DELIVERED_OFFSETS[deliveredIdx]!,
        );
        updatedAt = deliveredAt;
        if (o.deliveryPersonIndex != null) {
          deliveryVehicleType =
            data.deliveryPersons[o.deliveryPersonIndex]!.vehicleType;
        }
      } else if (o.status === 'delivering' && o.deliveryPersonIndex != null) {
        deliveryVehicleType =
          data.deliveryPersons[o.deliveryPersonIndex]!.vehicleType;
      }

      await tx.order.create({
        data: {
          id: idFor('orders', i),
          customerName: o.customerName,
          customerPhone: o.customerPhone,
          deliveryAddress: o.deliveryAddress,
          latitude: new Prisma.Decimal(o.latitude),
          longitude: new Prisma.Decimal(o.longitude),
          status: o.status,
          totalAmount: total,
          deliveryPersonId: deliveryPersonId ?? null,
          deliveredAt,
          deliveryVehicleType,
          createdAt,
          updatedAt,
          items: { create: itemsData },
        },
      });
    }

    const revenue = await tx.order.aggregate({
      where: { status: 'delivered' },
      _sum: { totalAmount: true },
      _count: true,
    });
    const sum = revenue._sum.totalAmount?.toNumber() ?? 0;
    if (Math.abs(sum - 370.8) > 0.01 || revenue._count !== 4) {
      throw new Error(`Seed oracle revenue failed: ${sum} / ${revenue._count}`);
    }
  });

  console.log('Seed completed');
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
