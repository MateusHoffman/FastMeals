import type { OrderStatus } from '@prisma/client';
import { AppError } from '../../shared/errors/app-error.js';

export const TRANSITIONS: Record<OrderStatus, readonly OrderStatus[]> = {
  pending: ['preparing', 'cancelled'],
  preparing: ['ready', 'cancelled'],
  ready: ['delivering', 'cancelled'],
  delivering: ['delivered'],
  delivered: [],
  cancelled: [],
};

export function assertTransition(
  from: OrderStatus,
  to: OrderStatus,
  hasDeliveryPerson: boolean,
): void {
  const allowed = TRANSITIONS[from];
  if (!allowed.includes(to)) {
    throw new AppError(
      422,
      'INVALID_STATUS_TRANSITION',
      `Transicao invalida de ${from} para ${to}`,
    );
  }
  if (to === 'delivering' && !hasDeliveryPerson) {
    throw new AppError(
      422,
      'INVALID_STATUS_TRANSITION',
      'Pedido ready nao pode ir para delivering sem entregador atribuido',
    );
  }
}

export function canTransition(
  from: OrderStatus,
  to: OrderStatus,
  hasDeliveryPerson: boolean,
): boolean {
  try {
    assertTransition(from, to, hasDeliveryPerson);
    return true;
  } catch {
    return false;
  }
}
