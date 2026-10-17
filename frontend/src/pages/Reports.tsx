import { useQuery } from '@tanstack/react-query';
import { lazy, Suspense, useState } from 'react';
import { apiFetch } from '../services/api';
import { Skeleton } from '../components/Skeleton';
import {
  DateRangeToolbar,
  buildReportQueryString,
  computeRangeForPreset,
  type DateRangeValue,
} from '../components/DateRangeToolbar';
import { StaggerItem, StaggerList } from '../components/motion/Stagger';
import {
  buildStatusChartData,
  buildTopChartData,
  buildVehicleChartData,
} from './reportsChartBuilders';

const ReportsCharts = lazy(() =>
  import('./ReportsCharts').then((m) => ({ default: m.ReportsCharts })),
);

export function ReportsPage() {
  const [range, setRange] = useState<DateRangeValue>(() =>
    computeRangeForPreset('30d'),
  );
  const rangeQs = buildReportQueryString(range);
  const reportStale = 60_000;

  const revenue = useQuery({
    queryKey: ['revenue', range],
    queryFn: () =>
      apiFetch<{
        totalRevenue: number;
        totalOrders: number;
        averageOrderValue: number;
        dailyRevenue: Array<{ date: string; revenue: number }>;
      }>(`/reports/revenue?${rangeQs}`),
    staleTime: reportStale,
  });

  const byStatus = useQuery({
    queryKey: ['orders-by-status', range],
    queryFn: () =>
      apiFetch<{ data: Array<{ status: string; count: number }> }>(
        `/reports/orders-by-status?${rangeQs}`,
      ),
    staleTime: reportStale,
  });

  const topProducts = useQuery({
    queryKey: ['top-products', range],
    queryFn: () =>
      apiFetch<{
        data: Array<{
          productId: string;
          productName: string;
          totalQuantity: number;
          totalRevenue: number;
        }>;
      }>(`/reports/top-products?${rangeQs}&limit=10`),
    staleTime: reportStale,
  });

  const deliveryTime = useQuery({
    queryKey: ['average-delivery-time', range],
    queryFn: () =>
      apiFetch<{
        averageMinutes: number;
        fastestMinutes: number;
        slowestMinutes: number;
        totalDelivered: number;
        byVehicleType: Array<{
          vehicleType: string;
          averageMinutes: number;
          count: number;
        }>;
      }>(`/reports/average-delivery-time?${rangeQs}`),
    staleTime: reportStale,
  });

  const statusChartData = buildStatusChartData(byStatus.data?.data);
  const topChartData = buildTopChartData(topProducts.data?.data);
  const vehicleChartData = buildVehicleChartData(
    deliveryTime.data?.byVehicleType,
  );

  return (
    <div className="fm-page">
      <header className="fm-page-header">
        <div>
          <h1 className="fm-page-title">Relatórios</h1>
          <p className="fm-page-subtitle max-w-2xl">
            Receita e produtos usam data de entrega; pedidos por status usam data de
            criação. Período de 24h usa intervalo exato em UTC.
          </p>
        </div>
      </header>

      <DateRangeToolbar value={range} onChange={setRange} />

      {revenue.isLoading && !revenue.data ? (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          <Skeleton className="h-24" />
          <Skeleton className="h-24" />
          <Skeleton className="h-24" />
          <Skeleton className="h-24" />
        </div>
      ) : revenue.data ? (
        <StaggerList className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          <StaggerItem>
            <Metric label="Receita" value={`R$ ${revenue.data.totalRevenue.toFixed(2)}`} accent="orange" />
          </StaggerItem>
          <StaggerItem>
            <Metric label="Pedidos entregues" value={String(revenue.data.totalOrders)} accent="blue" />
          </StaggerItem>
          <StaggerItem>
            <Metric
              label="Ticket médio"
              value={`R$ ${revenue.data.averageOrderValue.toFixed(2)}`}
              accent="emerald"
            />
          </StaggerItem>
          <StaggerItem>
            <Metric
              label="Tempo médio entrega"
              value={
                deliveryTime.data && deliveryTime.data.totalDelivered === 0
                  ? '—'
                  : deliveryTime.data
                    ? `${deliveryTime.data.averageMinutes.toFixed(1)} min`
                    : '…'
              }
              accent="blue"
            />
          </StaggerItem>
        </StaggerList>
      ) : revenue.isError ? (
        <p className="fm-error-banner">Erro ao carregar receita</p>
      ) : null}

      {deliveryTime.data && deliveryTime.data.totalDelivered > 0 && (
        <StaggerList className="mt-4 grid gap-4 sm:grid-cols-3">
          <StaggerItem>
            <Metric
              label="Entrega mais rápida"
              value={`${deliveryTime.data.fastestMinutes.toFixed(1)} min`}
              accent="emerald"
            />
          </StaggerItem>
          <StaggerItem>
            <Metric
              label="Entrega mais lenta"
              value={`${deliveryTime.data.slowestMinutes.toFixed(1)} min`}
              accent="orange"
            />
          </StaggerItem>
          <StaggerItem>
            <Metric
              label="Total entregues (período)"
              value={String(deliveryTime.data.totalDelivered)}
              accent="blue"
            />
          </StaggerItem>
        </StaggerList>
      )}

      <Suspense
        fallback={
          <div className="mt-6 grid gap-6 lg:grid-cols-2">
            <Skeleton className="h-80" />
            <Skeleton className="h-80" />
            <Skeleton className="h-80" />
            <Skeleton className="h-80" />
          </div>
        }
      >
        <ReportsCharts
          revenueLoading={revenue.isLoading && !revenue.data}
          revenueDaily={revenue.data?.dailyRevenue}
          byStatusLoading={byStatus.isLoading && !byStatus.data}
          statusChartData={statusChartData}
          topLoading={topProducts.isLoading && !topProducts.data}
          topChartData={topChartData}
          deliveryLoading={deliveryTime.isLoading && !deliveryTime.data}
          vehicleChartData={vehicleChartData}
        />
      </Suspense>
    </div>
  );
}

function Metric({
  label,
  value,
  accent,
}: {
  label: string;
  value: string;
  accent: 'orange' | 'blue' | 'emerald';
}) {
  const bar = {
    orange: 'bg-gradient-to-r from-orange-500 to-orange-600',
    blue: 'bg-gradient-to-r from-blue-500 to-blue-600',
    emerald: 'bg-gradient-to-r from-emerald-500 to-emerald-600',
  }[accent];

  return (
    <div className="fm-kpi fm-kpi-interactive relative overflow-hidden">
      <span className={`absolute left-0 top-0 h-1 w-full ${bar}`} aria-hidden />
      <p className="fm-kpi-label">{label}</p>
      <p className="fm-kpi-value">{value}</p>
    </div>
  );
}
