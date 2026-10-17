import { orderStatusLabel, vehicleTypeLabel } from '../lib/labels';

export function buildStatusChartData(
  rows: Array<{ status: string; count: number }> | undefined,
) {
  return (
    rows
      ?.filter((s) => s.count > 0)
      .map((s) => ({
        status: orderStatusLabel(s.status),
        count: s.count,
      })) ?? []
  );
}

export function buildTopChartData(
  rows:
    | Array<{ productName: string; totalQuantity: number }>
    | undefined,
) {
  return (
    rows?.map((p) => ({
      name:
        p.productName.length > 22
          ? `${p.productName.slice(0, 20)}…`
          : p.productName,
      quantity: p.totalQuantity,
    })) ?? []
  );
}

export function buildVehicleChartData(
  rows: Array<{ vehicleType: string; averageMinutes: number }> | undefined,
) {
  return (
    rows?.map((v) => ({
      name: vehicleTypeLabel(v.vehicleType),
      averageMinutes: v.averageMinutes,
    })) ?? []
  );
}
