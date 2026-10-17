import { prisma } from '../../shared/database/prisma.js';
import { optimizeAssignment } from '../../algorithms/optimizeAssignment.js';
import { decimalToNumber } from '../../shared/utils/decimal.js';

export { listOrders, getOrderById } from './order.queries.js';
export { createOrder } from './order.create.js';
export {
  assignDeliveryPerson,
  patchOrderStatus,
  acceptAssignment,
  acceptAssignmentsBatch,
} from './order.transitions.js';
export { listOrderStatusHistory } from './order.history.js';

export async function optimizeOrders() {
  const readyOrders = await prisma.order.findMany({
    where: { status: 'ready' },
    select: {
      id: true,
      latitude: true,
      longitude: true,
      deliveryAddress: true,
    },
  });

  const deliveringIds = await prisma.order.findMany({
    where: { status: 'delivering', deliveryPersonId: { not: null } },
    select: { deliveryPersonId: true },
  });
  const busySet = new Set(
    deliveringIds.map((o) => o.deliveryPersonId).filter(Boolean) as string[],
  );

  const persons = await prisma.deliveryPerson.findMany({
    where: {
      deletedAt: null,
      isActive: true,
      currentLatitude: { not: null },
      currentLongitude: { not: null },
    },
    select: {
      id: true,
      name: true,
      currentLatitude: true,
      currentLongitude: true,
    },
  });

  const available = persons.filter((p) => !busySet.has(p.id));

  const result = optimizeAssignment(
    readyOrders.map((o) => ({
      id: o.id,
      latitude: decimalToNumber(o.latitude),
      longitude: decimalToNumber(o.longitude),
    })),
    available.map((p) => ({
      id: p.id,
      currentLatitude: decimalToNumber(p.currentLatitude!),
      currentLongitude: decimalToNumber(p.currentLongitude!),
    })),
  );

  const orderById = new Map(readyOrders.map((o) => [o.id, o]));
  const personById = new Map(available.map((p) => [p.id, p]));

  return {
    ...result,
    assignments: result.assignments.map((a) => ({
      ...a,
      orderAddress: orderById.get(a.orderId)?.deliveryAddress ?? '',
      deliveryPersonName: personById.get(a.deliveryPersonId)?.name ?? '',
    })),
    unassigned: result.unassigned.map((u) => ({
      ...u,
      orderAddress: orderById.get(u.orderId)?.deliveryAddress ?? '',
    })),
  };
}
