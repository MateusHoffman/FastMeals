export const ORDER_STATUSES = [
  'pending',
  'preparing',
  'ready',
  'delivering',
  'delivered',
  'cancelled',
] as const;

export type OrderStatusValue = (typeof ORDER_STATUSES)[number];

const ORDER_STATUS_PT: Record<OrderStatusValue, string> = {
  pending: 'Pendente',
  preparing: 'Em preparo',
  ready: 'Pronto',
  delivering: 'Em entrega',
  delivered: 'Entregue',
  cancelled: 'Cancelado',
};

export function orderStatusLabel(status: string): string {
  return ORDER_STATUS_PT[status as OrderStatusValue] ?? status;
}

export const ORDER_TRANSITIONS: Record<OrderStatusValue, readonly OrderStatusValue[]> = {
  pending: ['preparing', 'cancelled'],
  preparing: ['ready', 'cancelled'],
  ready: ['delivering', 'cancelled'],
  delivering: ['delivered'],
  delivered: [],
  cancelled: [],
};

export function nextOrderStatuses(status: string): OrderStatusValue[] {
  return [...(ORDER_TRANSITIONS[status as OrderStatusValue] ?? [])];
}

const PRODUCT_CATEGORY_PT: Record<string, string> = {
  meal: 'Refeição',
  drink: 'Bebida',
  dessert: 'Sobremesa',
  side: 'Acompanhamento',
};

export function productCategoryLabel(category: string): string {
  return PRODUCT_CATEGORY_PT[category] ?? category;
}

export const PRODUCT_CATEGORIES = ['meal', 'drink', 'dessert', 'side'] as const;

const VEHICLE_PT: Record<string, string> = {
  bicycle: 'Bicicleta',
  motorcycle: 'Moto',
  car: 'Carro',
};

export function vehicleTypeLabel(type: string): string {
  return VEHICLE_PT[type] ?? type;
}

export function userRoleLabel(role: string | undefined): string {
  if (role === 'admin') return 'Administrador';
  if (role === 'viewer') return 'Visualizador';
  return role ?? '';
}

const ALGORITHM_PT: Record<string, string> = {
  hungarian: 'Atribuição húngara',
};

export function algorithmLabel(name: string): string {
  return ALGORITHM_PT[name] ?? name;
}
