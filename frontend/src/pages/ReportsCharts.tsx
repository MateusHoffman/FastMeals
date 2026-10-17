import type { ReactNode } from 'react';
import {
  Bar,
  BarChart,
  CartesianGrid,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from 'recharts';
import { Skeleton } from '../components/Skeleton';
import { useChartTheme, type ChartTheme } from '../hooks/useChartTheme';

export type ReportsChartsProps = {
  revenueLoading: boolean;
  revenueDaily: Array<{ date: string; revenue: number }> | undefined;
  byStatusLoading: boolean;
  statusChartData: Array<{ status: string; count: number }>;
  topLoading: boolean;
  topChartData: Array<{ name: string; quantity: number }>;
  deliveryLoading: boolean;
  vehicleChartData: Array<{ name: string; averageMinutes: number }>;
};

function tooltipStyle(theme: ChartTheme) {
  return {
    borderRadius: '8px',
    border: `1px solid ${theme.tooltipBorder}`,
    background: theme.tooltipBg,
    color: theme.tooltipText,
    fontSize: '12px',
  };
}

export function ReportsCharts(props: ReportsChartsProps) {
  const theme = useChartTheme();
  const {
    revenueLoading,
    revenueDaily,
    byStatusLoading,
    statusChartData,
    topLoading,
    topChartData,
    deliveryLoading,
    vehicleChartData,
  } = props;

  return (
    <div className="mt-6 grid gap-6 lg:grid-cols-2">
      <ChartCard title="Receita diária" subtitle="Pedidos delivered por dia">
        {revenueLoading ? (
          <Skeleton className="h-full w-full" />
        ) : (
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={revenueDaily ?? []}>
              <CartesianGrid strokeDasharray="3 3" stroke={theme.grid} />
              <XAxis dataKey="date" tick={{ fontSize: 10 }} stroke={theme.axis} />
              <YAxis tick={{ fontSize: 10 }} stroke={theme.axis} />
              <Tooltip contentStyle={tooltipStyle(theme)} />
              <Bar dataKey="revenue" fill="#c2410c" radius={[4, 4, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        )}
      </ChartCard>

      <ChartCard title="Pedidos por status" subtitle="Contagem por status (criação)">
        {byStatusLoading ? (
          <Skeleton className="h-full w-full" />
        ) : statusChartData.length === 0 ? (
          <p className="flex h-full items-center justify-center text-sm text-slate-600 dark:text-slate-400">
            Sem pedidos no período.
          </p>
        ) : (
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={statusChartData} layout="vertical" margin={{ left: 8, right: 16 }}>
              <CartesianGrid strokeDasharray="3 3" stroke={theme.grid} />
              <XAxis type="number" tick={{ fontSize: 10 }} stroke={theme.axis} />
              <YAxis
                type="category"
                dataKey="status"
                width={120}
                tick={{ fontSize: 10 }}
                stroke={theme.axis}
              />
              <Tooltip contentStyle={tooltipStyle(theme)} />
              <Bar dataKey="count" fill="#9333ea" radius={[0, 4, 4, 0]} />
            </BarChart>
          </ResponsiveContainer>
        )}
      </ChartCard>

      <ChartCard title="Top produtos" subtitle="Quantidade vendida (delivered)">
        {topLoading ? (
          <Skeleton className="h-full w-full" />
        ) : topChartData.length === 0 ? (
          <p className="flex h-full items-center justify-center text-sm text-slate-600 dark:text-slate-400">
            Nenhuma venda no período.
          </p>
        ) : (
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={topChartData} layout="vertical" margin={{ left: 8 }}>
              <CartesianGrid strokeDasharray="3 3" stroke={theme.grid} />
              <XAxis type="number" tick={{ fontSize: 10 }} stroke={theme.axis} />
              <YAxis
                type="category"
                dataKey="name"
                width={100}
                tick={{ fontSize: 10 }}
                stroke={theme.axis}
              />
              <Tooltip contentStyle={tooltipStyle(theme)} />
              <Bar dataKey="quantity" fill="#2563eb" radius={[0, 4, 4, 0]} />
            </BarChart>
          </ResponsiveContainer>
        )}
      </ChartCard>

      <ChartCard title="Tempo médio por veículo" subtitle="Minutos entre criação e entrega">
        {deliveryLoading ? (
          <Skeleton className="h-full w-full" />
        ) : vehicleChartData.length === 0 ? (
          <p className="flex h-full items-center justify-center text-sm text-slate-600 dark:text-slate-400">
            Sem entregas concluídas no período.
          </p>
        ) : (
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={vehicleChartData}>
              <CartesianGrid strokeDasharray="3 3" stroke={theme.grid} />
              <XAxis dataKey="name" tick={{ fontSize: 10 }} stroke={theme.axis} />
              <YAxis tick={{ fontSize: 10 }} stroke={theme.axis} />
              <Tooltip contentStyle={tooltipStyle(theme)} />
              <Bar dataKey="averageMinutes" fill="#16a34a" radius={[4, 4, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        )}
      </ChartCard>
    </div>
  );
}

function ChartCard({
  title,
  subtitle,
  children,
}: {
  title: string;
  subtitle: string;
  children: ReactNode;
}) {
  return (
    <div className="fm-card-padded fm-chart-card flex h-80 flex-col">
      <h2 className="mb-1 font-semibold text-slate-900 dark:text-slate-100">{title}</h2>
      <p className="mb-3 text-xs text-slate-600 dark:text-slate-400">{subtitle}</p>
      <div className="min-h-0 flex-1">{children}</div>
    </div>
  );
}
