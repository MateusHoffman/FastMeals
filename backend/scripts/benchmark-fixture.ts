/**
 * Popula produtos/pedidos em volume para benchmark (somente NODE_ENV != production).
 */
import { Prisma } from '@prisma/client';
import { prisma } from '../src/shared/database/prisma.js';

const TARGET_PRODUCTS = 10_000;
const TARGET_ORDERS = 10_000;

export async function ensureBenchmarkFixture(): Promise<void> {
  const productCount = await prisma.product.count({ where: { deletedAt: null } });
  if (productCount >= TARGET_PRODUCTS) {
    console.log('benchmark fixture: products OK', productCount);
    return;
  }

  console.log('benchmark fixture: seeding products up to', TARGET_PRODUCTS);
  const batch = 500;
  let created = productCount;
  while (created < TARGET_PRODUCTS) {
    const slice = Math.min(batch, TARGET_PRODUCTS - created);
    const data = Array.from({ length: slice }, (_, i) => {
      const n = created + i;
      return {
        name: `Bench Product ${n}`.slice(0, 120),
        description: 'Produto sintetico para benchmark de listagem com indice',
        price: new Prisma.Decimal(((n % 500) + 1) / 10),
        category: (['meal', 'drink', 'dessert', 'side'] as const)[n % 4]!,
        isAvailable: true,
        preparationTime: (n % 60) + 1,
      };
    });
    await prisma.product.createMany({ data });
    created += slice;
  }

  const orderCount = await prisma.order.count();
  if (orderCount >= TARGET_ORDERS) {
    console.log('benchmark fixture: orders OK', orderCount);
    return;
  }

  const sampleProduct = await prisma.product.findFirst({
    where: { deletedAt: null },
    select: { id: true, price: true },
  });
  if (!sampleProduct) return;

  let person = await prisma.deliveryPerson.findFirst({
    where: { deletedAt: null, isActive: true },
  });
  if (!person) {
    person = await prisma.deliveryPerson.create({
      data: {
        name: 'Bench Courier',
        phone: '(11) 91111-1111',
        vehicleType: 'bicycle',
        isActive: true,
        currentLatitude: new Prisma.Decimal(-23.55),
        currentLongitude: new Prisma.Decimal(-46.63),
      },
    });
  }

  console.log('benchmark fixture: seeding orders up to', TARGET_ORDERS);
  let oCreated = orderCount;
  while (oCreated < TARGET_ORDERS) {
    const slice = Math.min(100, TARGET_ORDERS - oCreated);
    await prisma.$transaction(async (tx) => {
      for (let i = 0; i < slice; i++) {
        const idx = oCreated + i;
        const isDelivered = idx % 5 === 0;
        const now = new Date();
        await tx.order.create({
          data: {
            customerName: `Cliente Bench ${idx}`,
            customerPhone: '(11) 90000-0001',
            deliveryAddress: `Rua Benchmark ${idx}, Sao Paulo - SP`,
            latitude: new Prisma.Decimal(-23.55 - (idx % 100) / 10_000),
            longitude: new Prisma.Decimal(-46.63 - (idx % 100) / 10_000),
            status: isDelivered ? 'delivered' : 'pending',
            totalAmount: sampleProduct.price,
            deliveryPersonId: isDelivered ? person!.id : null,
            deliveredAt: isDelivered ? now : null,
            deliveryVehicleType: isDelivered ? person!.vehicleType : null,
            items: {
              create: {
                productId: sampleProduct.id,
                quantity: 1,
                unitPrice: sampleProduct.price,
              },
            },
          },
        });
      }
    });
    oCreated += slice;
  }
}

if (import.meta.url === `file://${process.argv[1]}`) {
  ensureBenchmarkFixture()
    .then(() => prisma.$disconnect())
    .catch((e) => {
      console.error(e);
      process.exit(1);
    });
}
