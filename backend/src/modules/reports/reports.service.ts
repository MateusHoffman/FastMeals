import { Prisma } from '@prisma/client';
import { prisma } from '../../shared/database/prisma.js';
import { decimalToNumber, roundMoney } from '../../shared/utils/decimal.js';
import type { ReportRangeQuery } from '../../shared/validation/report.schemas.js';

function dateOnlyRange(
  startDate?: string,
  endDate?: string,
): Prisma.DateTimeFilter | undefined {
  if (!startDate && !endDate) return undefined;
  const filter: Prisma.DateTimeFilter = {};
  if (startDate) filter.gte = new Date(`${startDate}T00:00:00.000Z`);
  if (endDate) {
    const end = new Date(`${endDate}T00:00:00.000Z`);
    end.setUTCDate(end.getUTCDate() + 1);
    filter.lt = end;
  }
  return filter;
}

function resolveRange(query: ReportRangeQuery): Prisma.DateTimeFilter | undefined {
  if (query.startDateTime && query.endDateTime) {
    return {
      gte: new Date(query.startDateTime),
      lte: new Date(query.endDateTime),
    };
  }
  return dateOnlyRange(query.startDate, query.endDate);
}

export async function getRevenueReport(query: ReportRangeQuery) {
  const range = resolveRange(query)!;
  const orders = await prisma.order.findMany({
    where: { status: 'delivered', deliveredAt: range },
    select: { totalAmount: true, deliveredAt: true },
    orderBy: { deliveredAt: 'asc' },
  });

  const totalRevenue = roundMoney(
    orders.reduce((s, o) => s + decimalToNumber(o.totalAmount), 0),
  );
  const totalOrders = orders.length;
  const averageOrderValue =
    totalOrders === 0 ? 0 : roundMoney(totalRevenue / totalOrders);

  const byDay = new Map<string, { revenue: number; orders: number }>();
  for (const o of orders) {
    const d = o.deliveredAt!.toISOString().slice(0, 10);
    const cur = byDay.get(d) ?? { revenue: 0, orders: 0 };
    cur.revenue += decimalToNumber(o.totalAmount);
    cur.orders += 1;
    byDay.set(d, cur);
  }

  const dailyRevenue = [...byDay.entries()]
    .sort(([a], [b]) => a.localeCompare(b))
    .map(([date, v]) => ({
      date,
      revenue: roundMoney(v.revenue),
      orders: v.orders,
    }));

  return {
    startDate: query.startDate ?? query.startDateTime?.slice(0, 10),
    endDate: query.endDate ?? query.endDateTime?.slice(0, 10),
    totalRevenue,
    totalOrders,
    averageOrderValue,
    dailyRevenue,
  };
}

const ALL_STATUSES = [
  'pending',
  'preparing',
  'ready',
  'delivering',
  'delivered',
  'cancelled',
] as const;

export async function getOrdersByStatusReport(query: ReportRangeQuery) {
  const createdAt = resolveRange(query);
  const where: Prisma.OrderWhereInput = createdAt ? { createdAt } : {};

  const grouped = await prisma.order.groupBy({
    by: ['status'],
    where,
    _count: { _all: true },
  });

  const countMap = new Map<string, number>();
  for (const g of grouped) {
    countMap.set(g.status, g._count._all);
  }

  const data = ALL_STATUSES.map((status) => ({
    status,
    count: countMap.get(status) ?? 0,
  }));
  const total = data.reduce((s, d) => s + d.count, 0);

  return { data, total };
}

export async function getTopProductsReport(
  query: ReportRangeQuery,
  limit = 10,
) {
  const range = resolveRange(query);
  const ordersWhere: Prisma.OrderWhereInput = {
    status: 'delivered',
    ...(range ? { deliveredAt: range } : {}),
  };

  const items = await prisma.orderItem.findMany({
    where: { order: ordersWhere },
    include: { product: true },
  });

  const agg = new Map<
    string,
    { productName: string; totalQuantity: number; totalRevenue: number }
  >();

  for (const item of items) {
    const cur = agg.get(item.productId) ?? {
      productName: item.product.name,
      totalQuantity: 0,
      totalRevenue: 0,
    };
    cur.totalQuantity += item.quantity;
    cur.totalRevenue += decimalToNumber(item.unitPrice) * item.quantity;
    agg.set(item.productId, cur);
  }

  const data = [...agg.entries()]
    .map(([productId, v]) => ({
      productId,
      productName: v.productName,
      totalQuantity: v.totalQuantity,
      totalRevenue: roundMoney(v.totalRevenue),
    }))
    .sort((a, b) => {
      if (b.totalQuantity !== a.totalQuantity) {
        return b.totalQuantity - a.totalQuantity;
      }
      return a.productId.localeCompare(b.productId);
    })
    .slice(0, limit);

  return { data };
}

export async function getAverageDeliveryTimeReport(query: ReportRangeQuery) {
  const range = resolveRange(query);
  const orders = await prisma.order.findMany({
    where: {
      status: 'delivered',
      deliveredAt: { not: null },
      ...(range ? { deliveredAt: range } : {}),
    },
    select: {
      createdAt: true,
      deliveredAt: true,
      deliveryVehicleType: true,
    },
  });

  if (orders.length === 0) {
    return {
      averageMinutes: 0,
      fastestMinutes: 0,
      slowestMinutes: 0,
      totalDelivered: 0,
      byVehicleType: [] as Array<{
        vehicleType: string;
        averageMinutes: number;
        count: number;
      }>,
    };
  }

  const minutesList = orders.map((o) => {
    const ms = o.deliveredAt!.getTime() - o.createdAt.getTime();
    return ms / 60_000;
  });

  const averageMinutes = roundMoney(
    minutesList.reduce((a, b) => a + b, 0) / minutesList.length,
  );
  const fastestMinutes = roundMoney(Math.min(...minutesList));
  const slowestMinutes = roundMoney(Math.max(...minutesList));

  const byVehicle = new Map<string, number[]>();
  for (let i = 0; i < orders.length; i++) {
    const vt = orders[i]!.deliveryVehicleType ?? 'unknown';
    const list = byVehicle.get(vt) ?? [];
    list.push(minutesList[i]!);
    byVehicle.set(vt, list);
  }

  const byVehicleType = [...byVehicle.entries()].map(([vehicleType, mins]) => ({
    vehicleType,
    averageMinutes: roundMoney(mins.reduce((a, b) => a + b, 0) / mins.length),
    count: mins.length,
  }));

  return {
    averageMinutes,
    fastestMinutes,
    slowestMinutes,
    totalDelivered: orders.length,
    byVehicleType,
  };
}
