import { Prisma, type OrderStatus, type VehicleType } from '@prisma/client';
import { AppError } from '../../shared/errors/app-error.js';
import { runSerializable } from '../../shared/database/transaction.js';
import { assertTransition } from './order-state-machine.js';
import { orderInclude, toOrderDto, type OrderDto } from './order.mapper.js';
import { publishOrderEvent } from './order.events.js';
import { recordOrderStatusChange } from './order.history.js';

async function loadOrderForUpdate(
  tx: Prisma.TransactionClient,
  orderId: string,
) {
  const order = await tx.order.findUnique({
    where: { id: orderId },
    include: orderInclude,
  });
  if (!order) {
    throw new AppError(404, 'ORDER_NOT_FOUND', 'Pedido nao encontrado');
  }
  return order;
}

async function validateDeliveryPerson(
  tx: Prisma.TransactionClient,
  deliveryPersonId: string,
): Promise<{ id: string; vehicleType: VehicleType; isActive: boolean }> {
  const person = await tx.deliveryPerson.findFirst({
    where: { id: deliveryPersonId, deletedAt: null },
  });
  if (!person) {
    throw new AppError(
      404,
      'DELIVERY_PERSON_NOT_FOUND',
      'Entregador nao encontrado',
    );
  }
  if (!person.isActive) {
    throw new AppError(
      422,
      'DELIVERY_PERSON_UNAVAILABLE',
      'Entregador inativo',
    );
  }
  const busy = await tx.order.findFirst({
    where: {
      deliveryPersonId,
      status: 'delivering',
    },
  });
  if (busy) {
    throw new AppError(
      422,
      'DELIVERY_PERSON_UNAVAILABLE',
      'Entregador ja em entrega',
    );
  }
  return person;
}

export async function assignDeliveryPerson(
  orderId: string,
  deliveryPersonId: string,
): Promise<OrderDto> {
  const dto = await runSerializable(async (tx) => {
    const order = await loadOrderForUpdate(tx, orderId);
    if (['delivering', 'delivered', 'cancelled'].includes(order.status)) {
      throw new AppError(
        422,
        'INVALID_STATUS_TRANSITION',
        'Nao e possivel atribuir neste status',
      );
    }
    await validateDeliveryPerson(tx, deliveryPersonId);

    const updated = await tx.order.update({
      where: { id: orderId },
      data: { deliveryPersonId },
      include: orderInclude,
    });
    return toOrderDto(updated);
  });
  publishOrderEvent('order.assigned', orderId, { deliveryPersonId });
  return dto;
}

export async function patchOrderStatus(
  orderId: string,
  status: OrderStatus,
  changedByUserId?: string,
): Promise<OrderDto> {
  const previousStatus = await runSerializable(async (tx) => {
    const order = await loadOrderForUpdate(tx, orderId);
    const fromStatus = order.status;
    const hasPerson = Boolean(order.deliveryPersonId);
    assertTransition(order.status, status, hasPerson);

    if (status === 'delivering') {
      const person = await validateDeliveryPerson(
        tx,
        order.deliveryPersonId!,
      );
      try {
        const updated = await tx.order.update({
          where: { id: orderId, status: order.status },
          data: {
            status: 'delivering',
            deliveryVehicleType: person.vehicleType,
          },
          include: orderInclude,
        });
        await recordOrderStatusChange(tx, {
          orderId,
          fromStatus,
          toStatus: status,
          ...(changedByUserId !== undefined ? { changedByUserId } : {}),
        });
        return { dto: toOrderDto(updated), fromStatus };
      } catch (err) {
        if (
          err instanceof Prisma.PrismaClientKnownRequestError &&
          err.code === 'P2002'
        ) {
          throw new AppError(
            422,
            'DELIVERY_PERSON_UNAVAILABLE',
            'Entregador indisponivel',
          );
        }
        throw err;
      }
    }

    if (status === 'delivered') {
      const now = new Date();
      const updated = await tx.order.update({
        where: { id: orderId, status: 'delivering' },
        data: { status: 'delivered', deliveredAt: now },
        include: orderInclude,
      });
      if (updated.status !== 'delivered') {
        throw new AppError(
          422,
          'INVALID_STATUS_TRANSITION',
          'Transicao invalida',
        );
      }
      await recordOrderStatusChange(tx, {
        orderId,
        fromStatus,
        toStatus: status,
        ...(changedByUserId !== undefined ? { changedByUserId } : {}),
      });
      return { dto: toOrderDto(updated), fromStatus };
    }

    const updated = await tx.order.update({
      where: { id: orderId, status: order.status },
      data: { status },
      include: orderInclude,
    });
    await recordOrderStatusChange(tx, {
      orderId,
      fromStatus,
      toStatus: status,
      ...(changedByUserId !== undefined ? { changedByUserId } : {}),
    });
    return { dto: toOrderDto(updated), fromStatus };
  });

  publishOrderEvent('order.status_changed', orderId, {
    fromStatus: previousStatus.fromStatus,
    toStatus: status,
  });
  return previousStatus.dto;
}

export async function acceptAssignment(
  orderId: string,
  deliveryPersonId: string,
  changedByUserId?: string,
): Promise<OrderDto> {
  const dto = await runSerializable(async (tx) => {
    const order = await loadOrderForUpdate(tx, orderId);
    if (order.status !== 'ready') {
      throw new AppError(
        422,
        'INVALID_STATUS_TRANSITION',
        'Pedido deve estar ready',
      );
    }
    const person = await validateDeliveryPerson(tx, deliveryPersonId);

    try {
      const updated = await tx.order.update({
        where: { id: orderId, status: 'ready' },
        data: {
          deliveryPersonId,
          status: 'delivering',
          deliveryVehicleType: person.vehicleType,
        },
        include: orderInclude,
      });
      await recordOrderStatusChange(tx, {
        orderId,
        fromStatus: 'ready',
        toStatus: 'delivering',
        ...(changedByUserId !== undefined ? { changedByUserId } : {}),
      });
      return toOrderDto(updated);
    } catch (err) {
      if (
        err instanceof Prisma.PrismaClientKnownRequestError &&
        err.code === 'P2002'
      ) {
        throw new AppError(
          422,
          'DELIVERY_PERSON_UNAVAILABLE',
          'Entregador indisponivel',
        );
      }
      throw err;
    }
  });
  publishOrderEvent('order.assignment_accepted', orderId, { deliveryPersonId });
  publishOrderEvent('order.status_changed', orderId, {
    fromStatus: 'ready',
    toStatus: 'delivering',
  });
  return dto;
}

export async function acceptAssignmentsBatch(
  assignments: Array<{ orderId: string; deliveryPersonId: string }>,
  changedByUserId?: string,
): Promise<{
  accepted: string[];
  failed: Array<{ orderId: string; code: string; message: string }>;
}> {
  const accepted: string[] = [];
  const failed: Array<{ orderId: string; code: string; message: string }> = [];

  for (const a of assignments) {
    try {
      await acceptAssignment(a.orderId, a.deliveryPersonId, changedByUserId);
      accepted.push(a.orderId);
    } catch (err) {
      if (err instanceof AppError) {
        failed.push({
          orderId: a.orderId,
          code: err.code,
          message: err.message,
        });
      } else {
        failed.push({
          orderId: a.orderId,
          code: 'INTERNAL_ERROR',
          message: 'Falha ao aceitar atribuicao',
        });
      }
    }
  }

  return { accepted, failed };
}
