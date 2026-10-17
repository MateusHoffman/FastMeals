import type { Order, OrderItem, Product, DeliveryPerson } from '@prisma/client';
import { decimalToNumber } from '../../shared/utils/decimal.js';

type OrderWithRelations = Order & {
  items: (OrderItem & { product: Product })[];
  deliveryPerson: DeliveryPerson | null;
};

export interface OrderDto {
  id: string;
  customerName: string;
  customerPhone: string;
  deliveryAddress: string;
  latitude: number;
  longitude: number;
  status: string;
  totalAmount: number;
  deliveryPerson: {
    id: string;
    name: string;
    phone: string;
    vehicleType: string;
  } | null;
  items: Array<{
    id: string;
    product: { id: string; name: string };
    quantity: number;
    unitPrice: number;
  }>;
  createdAt: string;
  updatedAt: string;
}

export function toOrderDto(order: OrderWithRelations): OrderDto {
  return {
    id: order.id,
    customerName: order.customerName,
    customerPhone: order.customerPhone,
    deliveryAddress: order.deliveryAddress,
    latitude: decimalToNumber(order.latitude),
    longitude: decimalToNumber(order.longitude),
    status: order.status,
    totalAmount: decimalToNumber(order.totalAmount),
    deliveryPerson: order.deliveryPerson
      ? {
          id: order.deliveryPerson.id,
          name: order.deliveryPerson.name,
          phone: order.deliveryPerson.phone,
          vehicleType: order.deliveryPerson.vehicleType,
        }
      : null,
    items: order.items.map((item) => ({
      id: item.id,
      product: { id: item.product.id, name: item.product.name },
      quantity: item.quantity,
      unitPrice: decimalToNumber(item.unitPrice),
    })),
    createdAt: order.createdAt.toISOString(),
    updatedAt: order.updatedAt.toISOString(),
  };
}

export const orderInclude = {
  items: { include: { product: true } },
  deliveryPerson: true,
} as const;
