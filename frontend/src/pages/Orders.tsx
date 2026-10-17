import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useMemo, useState } from 'react';
import { useOrderEvents } from '../hooks/useOrderEvents';
import { useDebouncedValue } from '../hooks/useDebouncedValue';
import { useListQueryParams } from '../hooks/useListQueryParams';
import { apiFetch } from '../services/api';
import { StatusBadge } from '../components/StatusBadge';
import { Skeleton } from '../components/Skeleton';
import { Pagination } from '../components/Pagination';
import { SortableTh, toggleSort } from '../components/SortableTh';
import { Modal } from '../components/Modal';
import { DeliveryPersonDetailModal } from '../components/DeliveryPersonDetailModal';
import { formatBrl } from '../lib/format';
import { useAuth } from '../hooks/useAuth';
import {
  ORDER_STATUSES,
  nextOrderStatuses,
  orderStatusLabel,
  vehicleTypeLabel,
} from '../lib/labels';
import { LiveIndicator } from '../components/motion/LiveIndicator';
import type {
  OrderDto as Order,
  OrderStatusHistoryDto,
  PaginatedOrdersDto as PaginatedOrders,
  PaginatedDeliveryPersonsDto,
} from '../types/api';

const PAGE_SIZE = 20;

const LIST_DEFAULTS = {
  status: '',
  search: '',
  phone: '',
  deliveryPersonId: '',
  start: '',
  end: '',
  page: '1',
  sortBy: 'createdAt',
  sortOrder: 'desc',
};

type OrderSortBy =
  | 'createdAt'
  | 'totalAmount'
  | 'status'
  | 'customerName'
  | 'updatedAt'
  | 'deliveredAt';

function defaultDates() {
  const end = new Date();
  const start = new Date();
  start.setUTCDate(start.getUTCDate() - 30);
  return {
    start: start.toISOString().slice(0, 10),
    end: end.toISOString().slice(0, 10),
  };
}

export function OrdersPage() {
  const { isAdmin } = useAuth();
  const defaults = useMemo(() => {
    const d = defaultDates();
    return {
      ...LIST_DEFAULTS,
      start: d.start,
      end: d.end,
    };
  }, []);

  const { values, setParam, setMany } = useListQueryParams(defaults);
  const searchInput = values.search;
  const debouncedSearch = useDebouncedValue(searchInput, 300);
  const page = Number(values.page) || 1;
  const sortBy = values.sortBy as OrderSortBy;
  const sortOrder = values.sortOrder as 'asc' | 'desc';

  const [editOrder, setEditOrder] = useState<Order | null>(null);
  const [deliveryPersonId, setDeliveryPersonId] = useState<string | null>(null);
  const [showCreate, setShowCreate] = useState(false);
  const [liveMessage, setLiveMessage] = useState('');
  const qc = useQueryClient();
  const { connected: sseConnected } = useOrderEvents({
    onEvent: (_type, orderId) => {
      setLiveMessage(`Pedido ${orderId.slice(0, 8)} atualizado.`);
    },
  });

  const deliveryPersons = useQuery({
    queryKey: ['delivery-persons-filter'],
    queryFn: () =>
      apiFetch<PaginatedDeliveryPersonsDto>(
        '/delivery-persons?isActive=true&limit=100',
      ),
    staleTime: 60_000,
  });

  const queryKey = [
    'orders',
    values.status,
    debouncedSearch,
    values.phone,
    values.deliveryPersonId,
    values.start,
    values.end,
    page,
    sortBy,
    sortOrder,
  ] as const;

  const { data, isLoading, error } = useQuery({
    queryKey,
    queryFn: () => {
      const params = new URLSearchParams({
        limit: String(PAGE_SIZE),
        page: String(page),
        sortBy,
        sortOrder,
      });
      if (values.status) params.set('status', values.status);
      if (debouncedSearch) params.set('search', debouncedSearch);
      if (values.phone) params.set('customerPhone', values.phone);
      if (values.deliveryPersonId)
        params.set('deliveryPersonId', values.deliveryPersonId);
      if (values.start) params.set('startDate', values.start);
      if (values.end) params.set('endDate', values.end);
      return apiFetch<PaginatedOrders>(`/orders?${params}`);
    },
    refetchInterval: sseConnected ? false : 60_000,
  });

  function handleSort(column: string) {
    const next = toggleSort(sortBy, sortOrder, column);
    setMany({
      sortBy: next.sortBy,
      sortOrder: next.sortOrder,
      page: '1',
    });
  }

  return (
    <div className="fm-page">
      <header className="fm-page-header">
        <div>
          <h1 className="fm-page-title">Pedidos</h1>
          <p className="fm-page-subtitle flex flex-wrap items-center gap-2">
            <span>Filtre, ordene e edite pedidos para avançar a operação.</span>
            {sseConnected && <LiveIndicator />}
          </p>
        </div>
        {isAdmin && (
          <button
            type="button"
            onClick={() => setShowCreate(true)}
            className="fm-btn-primary shrink-0"
          >
            Novo pedido
          </button>
        )}
      </header>

      <p className="sr-only" aria-live="polite" aria-atomic="true">
        {liveMessage}
      </p>

      <div className="fm-toolbar">
        <div className="min-w-0 flex-1 sm:max-w-[200px]">
          <span className="fm-toolbar-label">Cliente</span>
          <input
            type="search"
            placeholder="Nome..."
            value={searchInput}
            onChange={(e) => {
              setMany({ search: e.target.value, page: '1' });
            }}
            className="fm-input"
            aria-label="Buscar cliente"
          />
        </div>
        <div className="min-w-[120px] flex-1 sm:max-w-[160px]">
          <span className="fm-toolbar-label">Telefone</span>
          <input
            value={values.phone}
            onChange={(e) => setMany({ phone: e.target.value, page: '1' })}
            className="fm-input"
            placeholder="(11)..."
            aria-label="Filtrar telefone"
          />
        </div>
        <div className="min-w-[140px] flex-1 sm:max-w-[220px]">
          <span className="fm-toolbar-label">Status</span>
          <select
            value={values.status}
            onChange={(e) => setMany({ status: e.target.value, page: '1' })}
            className="fm-select"
            aria-label="Filtrar status"
          >
            <option value="">Todos os status</option>
            {ORDER_STATUSES.map((s) => (
              <option key={s} value={s}>
                {orderStatusLabel(s)}
              </option>
            ))}
          </select>
        </div>
        <div className="min-w-[140px] flex-1 sm:max-w-[220px]">
          <span className="fm-toolbar-label">Entregador</span>
          <select
            value={values.deliveryPersonId}
            onChange={(e) =>
              setMany({ deliveryPersonId: e.target.value, page: '1' })
            }
            className="fm-select"
            aria-label="Filtrar entregador"
          >
            <option value="">Todos</option>
            {deliveryPersons.data?.data.map((p) => (
              <option key={p.id} value={p.id}>
                {p.name}
              </option>
            ))}
          </select>
        </div>
        <div>
          <span className="fm-toolbar-label">De</span>
          <input
            type="date"
            value={values.start}
            onChange={(e) => setMany({ start: e.target.value, page: '1' })}
            className="fm-input"
            aria-label="Data inicio"
          />
        </div>
        <div>
          <span className="fm-toolbar-label">Até</span>
          <input
            type="date"
            value={values.end}
            onChange={(e) => setMany({ end: e.target.value, page: '1' })}
            className="fm-input"
            aria-label="Data fim"
          />
        </div>
      </div>

      {isLoading && (
        <div className="space-y-2">
          <Skeleton className="h-16 w-full" />
          <Skeleton className="h-16 w-full" />
          <Skeleton className="h-16 w-full" />
        </div>
      )}
      {error && <p className="fm-error-banner">Erro ao carregar pedidos</p>}
      {!isLoading && data?.data.length === 0 && (
        <div className="fm-empty">Nenhum pedido neste filtro.</div>
      )}

      {!isLoading && (data?.data.length ?? 0) > 0 && (
        <>
          <div className="fm-table-wrap hidden md:block">
            <table className="fm-table">
              <thead>
                <tr>
                  <SortableTh
                    label="Cliente"
                    column="customerName"
                    sortBy={sortBy}
                    sortOrder={sortOrder}
                    onSort={handleSort}
                  />
                  <th>Telefone</th>
                  <th>Entregador</th>
                  <SortableTh
                    label="Total"
                    column="totalAmount"
                    sortBy={sortBy}
                    sortOrder={sortOrder}
                    onSort={handleSort}
                  />
                  <SortableTh
                    label="Data"
                    column="createdAt"
                    sortBy={sortBy}
                    sortOrder={sortOrder}
                    onSort={handleSort}
                  />
                  <SortableTh
                    label="Status"
                    column="status"
                    sortBy={sortBy}
                    sortOrder={sortOrder}
                    onSort={handleSort}
                  />
                  {isAdmin && <th>Ações</th>}
                </tr>
              </thead>
              <tbody>
                {data?.data.map((order) => (
                  <tr key={order.id}>
                    <td>
                      <button
                        type="button"
                        className="text-left font-medium text-slate-900 dark:text-slate-100 hover:text-orange-600"
                        onClick={() => setEditOrder(order)}
                      >
                        {order.customerName}
                      </button>
                    </td>
                    <td className="whitespace-nowrap text-slate-600 dark:text-slate-400">
                      {order.customerPhone}
                    </td>
                    <td>
                      {order.deliveryPerson ? (
                        <button
                          type="button"
                          className="text-left font-medium text-slate-900 dark:text-slate-100 hover:text-orange-600"
                          onClick={() => setDeliveryPersonId(order.deliveryPerson!.id)}
                        >
                          {order.deliveryPerson.name}
                        </button>
                      ) : (
                        <span className="text-slate-400">—</span>
                      )}
                    </td>
                    <td className="tabular-nums font-medium text-slate-800 dark:text-slate-200">
                      {formatBrl(order.totalAmount)}
                    </td>
                    <td className="whitespace-nowrap text-slate-500 dark:text-slate-400">
                      {new Date(order.createdAt).toLocaleString('pt-BR')}
                    </td>
                    <td>
                      <StatusBadge status={order.status} />
                    </td>
                    {isAdmin && (
                      <td>
                        <button
                          type="button"
                          className="text-sm font-medium text-orange-600 hover:text-orange-800 dark:text-orange-400 dark:hover:text-orange-300"
                          onClick={() => setEditOrder(order)}
                        >
                          Editar
                        </button>
                      </td>
                    )}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          <div className="space-y-3 md:hidden">
            {data?.data.map((order) => (
              <article key={order.id} className="fm-card-padded">
                <div className="flex flex-wrap items-start justify-between gap-2">
                  <button
                    type="button"
                    className="min-w-0 flex-1 text-left"
                    onClick={() => setEditOrder(order)}
                  >
                    <p className="font-semibold text-slate-900 dark:text-slate-100">{order.customerName}</p>
                    <p className="mt-1 text-sm text-slate-600 dark:text-slate-400">{order.customerPhone}</p>
                    <p className="mt-1 text-sm text-slate-600 dark:text-slate-400">
                      Entregador:{' '}
                      {order.deliveryPerson ? (
                        <button
                          type="button"
                          className="font-medium text-orange-600 hover:text-orange-800 dark:text-orange-400 dark:hover:text-orange-300"
                          onClick={(e) => {
                            e.stopPropagation();
                            setDeliveryPersonId(order.deliveryPerson!.id);
                          }}
                        >
                          {order.deliveryPerson.name}
                        </button>
                      ) : (
                        '—'
                      )}
                    </p>
                    <p className="mt-1 text-sm tabular-nums text-slate-500 dark:text-slate-400">
                      {formatBrl(order.totalAmount)} ·{' '}
                      {new Date(order.createdAt).toLocaleString('pt-BR')}
                    </p>
                  </button>
                  <StatusBadge status={order.status} />
                </div>
                {isAdmin && (
                  <div className="mt-3 border-t border-slate-100 pt-3 dark:border-slate-800">
                    <button
                      type="button"
                      className="fm-btn-secondary w-full py-1.5 text-xs"
                      onClick={() => setEditOrder(order)}
                    >
                      Editar
                    </button>
                  </div>
                )}
              </article>
            ))}
          </div>

          {data?.pagination && (
            <Pagination
              page={data.pagination.page}
              totalPages={data.pagination.totalPages}
              total={data.pagination.total}
              onPageChange={(p) => setParam('page', String(p))}
            />
          )}
        </>
      )}

      {editOrder && (
        <OrderEditModal
          order={editOrder}
          canEditStatus={isAdmin}
          onClose={() => setEditOrder(null)}
          onUpdated={() => {
            setEditOrder(null);
            void qc.invalidateQueries({ queryKey: ['orders'] });
          }}
        />
      )}

      {deliveryPersonId && (
        <DeliveryPersonDetailModal
          deliveryPersonId={deliveryPersonId}
          onClose={() => setDeliveryPersonId(null)}
        />
      )}

      {showCreate && isAdmin && (
        <CreateOrderModal
          onClose={() => setShowCreate(false)}
          onCreated={() => {
            setShowCreate(false);
            void qc.invalidateQueries({ queryKey: ['orders'] });
          }}
        />
      )}
    </div>
  );
}

function OrderEditModal({
  order,
  canEditStatus,
  onClose,
  onUpdated,
}: {
  order: Order;
  canEditStatus: boolean;
  onClose: () => void;
  onUpdated: () => void;
}) {
  const [newStatus, setNewStatus] = useState('');
  const [err, setErr] = useState('');
  const transitions = nextOrderStatuses(order.status);

  const history = useQuery({
    queryKey: ['order-history', order.id],
    queryFn: () =>
      apiFetch<{ data: OrderStatusHistoryDto[] }>(`/orders/${order.id}/history`),
  });

  const statusMutation = useMutation({
    mutationFn: (status: string) =>
      apiFetch(`/orders/${order.id}/status`, { method: 'PATCH', json: { status } }),
    onSuccess: () => onUpdated(),
    onError: () => setErr('Não foi possível atualizar o status'),
  });

  function applyStatus(e: React.FormEvent) {
    e.preventDefault();
    setErr('');
    if (!newStatus) {
      setErr('Selecione o novo status');
      return;
    }
    statusMutation.mutate(newStatus);
  }

  return (
    <Modal open onClose={onClose} titleId="order-edit-title" panelClassName="max-w-lg">
      <div className="mb-4 flex items-start justify-between gap-3">
        <div>
          <h2 id="order-edit-title" className="text-lg font-semibold text-slate-900 dark:text-slate-100">
            {canEditStatus ? 'Editar pedido' : 'Detalhes do pedido'}
          </h2>
          <p className="text-sm text-slate-600 dark:text-slate-400">{order.customerName}</p>
          <div className="mt-2">
            <StatusBadge status={order.status} />
          </div>
        </div>
        <button
          type="button"
          className="fm-btn-ghost -mr-2 -mt-1 px-2 py-1 text-slate-500 dark:text-slate-400"
          onClick={onClose}
          aria-label="Fechar"
        >
          ✕
        </button>
      </div>

      <dl className="grid gap-3 text-sm sm:grid-cols-2">
        <div className="sm:col-span-2">
          <dt className="fm-section-title">Endereço</dt>
          <dd className="mt-1 text-slate-700 dark:text-slate-300">{order.deliveryAddress}</dd>
        </div>
        <div>
          <dt className="fm-section-title">Telefone</dt>
          <dd className="mt-1 text-slate-700 dark:text-slate-300">{order.customerPhone}</dd>
        </div>
        <div>
          <dt className="fm-section-title">Coordenadas</dt>
          <dd className="mt-1 tabular-nums text-slate-700 dark:text-slate-300">
            {order.latitude.toFixed(5)}, {order.longitude.toFixed(5)}
          </dd>
        </div>
        <div>
          <dt className="fm-section-title">Total</dt>
          <dd className="mt-1 text-lg font-semibold tabular-nums text-slate-900 dark:text-slate-100">
            {formatBrl(order.totalAmount)}
          </dd>
        </div>
        <div>
          <dt className="fm-section-title">Entregador</dt>
          <dd className="mt-1 text-slate-700 dark:text-slate-300">
            {order.deliveryPerson
              ? `${order.deliveryPerson.name} (${vehicleTypeLabel(order.deliveryPerson.vehicleType)})`
              : '—'}
          </dd>
        </div>
        <div>
          <dt className="fm-section-title">Criado em</dt>
          <dd className="mt-1 text-slate-700 dark:text-slate-300">
            {new Date(order.createdAt).toLocaleString('pt-BR')}
          </dd>
        </div>
        <div>
          <dt className="fm-section-title">Atualizado em</dt>
          <dd className="mt-1 text-slate-700 dark:text-slate-300">
            {new Date(order.updatedAt).toLocaleString('pt-BR')}
          </dd>
        </div>
      </dl>

      <div className="mt-5">
        <h3 className="fm-section-title">Histórico de status</h3>
        {history.isLoading ? (
          <Skeleton className="mt-2 h-16 w-full" />
        ) : (history.data?.data.length ?? 0) === 0 ? (
          <p className="mt-2 text-sm text-slate-500 dark:text-slate-400">Sem alterações registradas.</p>
        ) : (
          <ol className="mt-2 space-y-2 border-l-2 border-orange-200 pl-3">
            {history.data?.data.map((entry) => (
              <li key={entry.id} className="text-sm text-slate-700 dark:text-slate-300">
                <span className="font-medium text-slate-900 dark:text-slate-100">
                  {entry.fromStatus
                    ? `${orderStatusLabel(entry.fromStatus)} → ${orderStatusLabel(entry.toStatus)}`
                    : orderStatusLabel(entry.toStatus)}
                </span>
                <span className="mt-0.5 block text-xs text-slate-500 dark:text-slate-400">
                  {new Date(entry.createdAt).toLocaleString('pt-BR')}
                  {entry.changedByEmail ? ` · ${entry.changedByEmail}` : ''}
                </span>
              </li>
            ))}
          </ol>
        )}
      </div>

      <div className="mt-5">
        <h3 className="fm-section-title">Itens</h3>
        <ul className="mt-2 divide-y divide-slate-100 rounded-lg border border-slate-200">
          {order.items.map((i) => (
            <li key={i.id} className="flex justify-between gap-2 px-3 py-2 text-sm">
              <span>
                {i.quantity}x {i.product.name}
              </span>
              <span className="tabular-nums text-slate-600 dark:text-slate-400">
                {formatBrl(i.unitPrice)}
              </span>
            </li>
          ))}
        </ul>
      </div>

      {canEditStatus && (
        <form className="mt-6 border-t border-slate-100 pt-4 dark:border-slate-800" onSubmit={(e) => void applyStatus(e)}>
          <h3 className="fm-section-title">Alterar status</h3>
          {err && <p className="fm-error-banner mt-2">{err}</p>}
          {transitions.length === 0 ? (
            <p className="mt-2 text-sm text-slate-500 dark:text-slate-400">
              Nenhuma transição disponível para este status.
            </p>
          ) : (
            <label className="mt-2 block text-sm font-medium text-slate-700 dark:text-slate-300">
              Novo status
              <select
                value={newStatus}
                onChange={(e) => setNewStatus(e.target.value)}
                className="fm-select mt-1.5"
                aria-label="Novo status"
              >
                <option value="">Selecione...</option>
                {transitions.map((st) => (
                  <option key={st} value={st}>
                    {orderStatusLabel(st)}
                  </option>
                ))}
              </select>
            </label>
          )}
          <div className="mt-4 flex justify-end gap-2">
            <button type="button" onClick={onClose} className="fm-btn-secondary">
              Fechar
            </button>
            {transitions.length > 0 && (
              <button type="submit" disabled={statusMutation.isPending} className="fm-btn-primary">
                Atualizar status
              </button>
            )}
          </div>
        </form>
      )}

      {!canEditStatus && (
        <div className="mt-6 flex justify-end">
          <button type="button" onClick={onClose} className="fm-btn-secondary">
            Fechar
          </button>
        </div>
      )}
    </Modal>
  );
}

type LineItem = { productId: string; quantity: number };

function CreateOrderModal({
  onClose,
  onCreated,
}: {
  onClose: () => void;
  onCreated: () => void;
}) {
  const [form, setForm] = useState({
    customerName: '',
    customerPhone: '(11) 91234-5678',
    deliveryAddress: 'Rua Exemplo, 100, Sao Paulo - SP',
    latitude: -23.55,
    longitude: -46.63,
  });
  const [lines, setLines] = useState<LineItem[]>([{ productId: '', quantity: 1 }]);
  const [err, setErr] = useState('');

  const catalog = useQuery({
    queryKey: ['catalog-products'],
    queryFn: () =>
      apiFetch<{ data: Array<{ id: string; name: string; price: number }> }>(
        '/products?isAvailable=true&limit=100',
      ),
  });

  const priceById = useMemo(() => {
    const m = new Map<string, number>();
    for (const p of catalog.data?.data ?? []) m.set(p.id, p.price);
    return m;
  }, [catalog.data]);

  const estimatedTotal = lines.reduce((sum, line) => {
    const price = priceById.get(line.productId) ?? 0;
    return sum + price * line.quantity;
  }, 0);

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setErr('');
    const items = lines.filter((l) => l.productId && l.quantity > 0);
    if (items.length === 0) {
      setErr('Adicione ao menos um item');
      return;
    }
    try {
      await apiFetch('/orders', {
        method: 'POST',
        json: {
          ...form,
          items: items.map((l) => ({
            productId: l.productId,
            quantity: l.quantity,
          })),
        },
      });
      onCreated();
    } catch {
      setErr('Nao foi possivel criar o pedido');
    }
  }

  return (
    <Modal open onClose={onClose} titleId="create-order-title" panelClassName="max-w-lg">
      <form onSubmit={(e) => void submit(e)}>
        <h2 id="create-order-title" className="mb-1 text-lg font-semibold text-slate-900 dark:text-slate-100">
          Novo pedido
        </h2>
        <p className="mb-4 text-sm text-slate-500 dark:text-slate-400">
          Status, total e entregador são definidos pelo fluxo após a criação.
        </p>
        {err && <p className="fm-error-banner mb-4">{err}</p>}

        <label className="mb-3 block text-sm font-medium text-slate-700 dark:text-slate-300">
          Cliente
          <input
            required
            minLength={3}
            value={form.customerName}
            onChange={(e) => setForm({ ...form, customerName: e.target.value })}
            className="fm-input mt-1.5"
          />
        </label>
        <label className="mb-3 block text-sm font-medium text-slate-700 dark:text-slate-300">
          Telefone
          <input
            required
            value={form.customerPhone}
            onChange={(e) => setForm({ ...form, customerPhone: e.target.value })}
            className="fm-input mt-1.5"
          />
        </label>
        <label className="mb-3 block text-sm font-medium text-slate-700 dark:text-slate-300">
          Endereço de entrega
          <input
            required
            minLength={10}
            value={form.deliveryAddress}
            onChange={(e) => setForm({ ...form, deliveryAddress: e.target.value })}
            className="fm-input mt-1.5"
          />
        </label>
        <div className="mb-3 grid grid-cols-2 gap-3">
          <label className="text-sm font-medium text-slate-700 dark:text-slate-300">
            Latitude
            <input
              type="number"
              step="any"
              required
              value={form.latitude}
              onChange={(e) =>
                setForm({ ...form, latitude: Number(e.target.value) })
              }
              className="fm-input mt-1.5"
            />
          </label>
          <label className="text-sm font-medium text-slate-700 dark:text-slate-300">
            Longitude
            <input
              type="number"
              step="any"
              required
              value={form.longitude}
              onChange={(e) =>
                setForm({ ...form, longitude: Number(e.target.value) })
              }
              className="fm-input mt-1.5"
            />
          </label>
        </div>

        <div className="mb-3">
          <div className="mb-2 flex items-center justify-between">
            <span className="text-sm font-medium text-slate-700 dark:text-slate-300">Itens</span>
            <button
              type="button"
              className="text-xs font-medium text-orange-600 hover:text-orange-800 dark:text-orange-400 dark:hover:text-orange-300"
              onClick={() =>
                setLines((prev) => [...prev, { productId: '', quantity: 1 }])
              }
            >
              + Adicionar item
            </button>
          </div>
          <ul className="space-y-2">
            {lines.map((line, idx) => (
              <li key={idx} className="flex flex-wrap gap-2">
                <select
                  required
                  value={line.productId}
                  onChange={(e) => {
                    const v = e.target.value;
                    setLines((prev) =>
                      prev.map((l, i) => (i === idx ? { ...l, productId: v } : l)),
                    );
                  }}
                  className="fm-select min-w-0 flex-1"
                >
                  <option value="">Produto...</option>
                  {catalog.data?.data.map((p) => (
                    <option key={p.id} value={p.id}>
                      {p.name} — {formatBrl(p.price)}
                    </option>
                  ))}
                </select>
                <input
                  type="number"
                  min={1}
                  value={line.quantity}
                  onChange={(e) => {
                    const q = Number(e.target.value);
                    setLines((prev) =>
                      prev.map((l, i) => (i === idx ? { ...l, quantity: q } : l)),
                    );
                  }}
                  className="fm-input w-20"
                  aria-label="Quantidade"
                />
                {lines.length > 1 && (
                  <button
                    type="button"
                    className="fm-btn-ghost px-2 text-red-600"
                    onClick={() => setLines((prev) => prev.filter((_, i) => i !== idx))}
                    aria-label="Remover item"
                  >
                    ✕
                  </button>
                )}
              </li>
            ))}
          </ul>
          <p className="mt-2 text-sm tabular-nums text-slate-600 dark:text-slate-400">
            Total estimado:{' '}
            <strong className="text-slate-900 dark:text-slate-100">{formatBrl(estimatedTotal)}</strong>
          </p>
        </div>

        <div className="flex justify-end gap-2">
          <button type="button" onClick={onClose} className="fm-btn-secondary">
            Cancelar
          </button>
          <button type="submit" className="fm-btn-primary">
            Criar
          </button>
        </div>
      </form>
    </Modal>
  );
}
