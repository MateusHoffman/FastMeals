import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { AnimatePresence, motion, useReducedMotion } from 'motion/react';
import { useMemo, useState } from 'react';
import { StaggerItem, StaggerList } from '../components/motion/Stagger';
import { apiFetch } from '../services/api';
import { useAuth } from '../hooks/useAuth';
import { Pagination } from '../components/Pagination';
import { FixedRowsList } from '../components/FixedRowsList';
import { Modal } from '../components/Modal';
import { algorithmLabel, vehicleTypeLabel } from '../lib/labels';
import type {
  AssignmentSuggestion as Assignment,
  AcceptAssignmentsBatchResult,
  DeliveryPersonDto as DeliveryPerson,
  OptimizeAssignmentResult as OptimizeResult,
  PaginatedDeliveryPersonsDto,
  PaginatedOrdersDto,
} from '../types/api';

const LIST_PAGE = 5;
const FIXED_ROWS = 5;
const SUGGESTION_PAGE = 10;

const panelEase = [0.22, 1, 0.36, 1] as const;

export function AssignmentPage() {
  const { isAdmin } = useAuth();
  const reduceMotion = useReducedMotion();
  const [result, setResult] = useState<OptimizeResult | null>(null);
  const [readyPage, setReadyPage] = useState(1);
  const [personPage, setPersonPage] = useState(1);
  const [suggestionPage, setSuggestionPage] = useState(1);
  const [batchMessage, setBatchMessage] = useState('');
  const [personForm, setPersonForm] = useState<{
    open: boolean;
    editing: DeliveryPerson | null;
    name: string;
    phone: string;
    vehicleType: 'bicycle' | 'motorcycle' | 'car';
  }>({
    open: false,
    editing: null,
    name: '',
    phone: '(11) 91234-5678',
    vehicleType: 'motorcycle',
  });
  const qc = useQueryClient();

  const readyOrders = useQuery({
    queryKey: ['orders-ready', readyPage],
    queryFn: () => {
      const p = new URLSearchParams({
        status: 'ready',
        limit: String(LIST_PAGE),
        page: String(readyPage),
        sortBy: 'createdAt',
        sortOrder: 'asc',
      });
      return apiFetch<PaginatedOrdersDto>(`/orders?${p}`);
    },
    refetchInterval: 30_000,
  });

  const persons = useQuery({
    queryKey: ['delivery-available', personPage],
    queryFn: () => {
      const p = new URLSearchParams({
        isActive: 'true',
        available: 'true',
        limit: String(LIST_PAGE),
        page: String(personPage),
        sortBy: 'name',
        sortOrder: 'asc',
      });
      return apiFetch<PaginatedDeliveryPersonsDto>(`/delivery-persons?${p}`);
    },
    refetchInterval: 30_000,
  });

  const optimize = useMutation({
    mutationFn: () =>
      apiFetch<OptimizeResult>('/orders/optimize-assignment', { method: 'POST' }),
    onSuccess: (data) => {
      setResult(data);
      setSuggestionPage(1);
    },
  });

  const accept = useMutation({
    mutationFn: (a: Assignment) =>
      apiFetch(`/orders/${a.orderId}/accept-assignment`, {
        method: 'POST',
        json: { deliveryPersonId: a.deliveryPersonId },
      }),
    onSuccess: () => {
      void qc.invalidateQueries({ queryKey: ['orders-ready'] });
      void qc.invalidateQueries({ queryKey: ['orders'] });
      void qc.invalidateQueries({ queryKey: ['delivery-available'] });
      setResult(null);
    },
  });

  const acceptAll = useMutation({
    mutationFn: (assignments: Assignment[]) =>
      apiFetch<AcceptAssignmentsBatchResult>('/orders/accept-assignments', {
        method: 'POST',
        json: {
          assignments: assignments.map((a) => ({
            orderId: a.orderId,
            deliveryPersonId: a.deliveryPersonId,
          })),
        },
      }),
    onSuccess: (data) => {
      setBatchMessage(
        `${data.accepted.length} aceitas${data.failed.length ? `, ${data.failed.length} falharam` : ''}.`,
      );
      void qc.invalidateQueries({ queryKey: ['orders-ready'] });
      void qc.invalidateQueries({ queryKey: ['orders'] });
      void qc.invalidateQueries({ queryKey: ['delivery-available'] });
      setResult(null);
    },
  });

  const savePerson = useMutation({
    mutationFn: async () => {
      const body = {
        name: personForm.name,
        phone: personForm.phone,
        vehicleType: personForm.vehicleType,
        currentLatitude: -23.55,
        currentLongitude: -46.63,
      };
      if (personForm.editing) {
        return apiFetch(`/delivery-persons/${personForm.editing.id}`, {
          method: 'PUT',
          json: body,
        });
      }
      return apiFetch('/delivery-persons', { method: 'POST', json: body });
    },
    onSuccess: () => {
      setPersonForm((s) => ({ ...s, open: false, editing: null }));
      void qc.invalidateQueries({ queryKey: ['delivery-available'] });
    },
  });

  const deletePerson = useMutation({
    mutationFn: (id: string) =>
      apiFetch(`/delivery-persons/${id}`, { method: 'DELETE' }),
    onSuccess: () => void qc.invalidateQueries({ queryKey: ['delivery-available'] }),
  });

  const readyCount = readyOrders.data?.pagination.total ?? 0;
  const personCount = persons.data?.pagination.total ?? 0;

  const suggestionSlice = useMemo(() => {
    if (!result) return { pageItems: [] as Assignment[], totalPages: 1 };
    const start = (suggestionPage - 1) * SUGGESTION_PAGE;
    const pageItems = result.assignments.slice(start, start + SUGGESTION_PAGE);
    const totalPages =
      Math.ceil(result.assignments.length / SUGGESTION_PAGE) || 1;
    return { pageItems, totalPages };
  }, [result, suggestionPage]);

  return (
    <div className="fm-page">
      <header className="fm-page-header">
        <div>
          <h1 className="fm-page-title">Atribuição de entregadores</h1>
          <p className="fm-page-subtitle">
            Veja pedidos prontos, equipe disponível e aplique sugestões otimizadas.
          </p>
        </div>
        {isAdmin && (
          <div className="flex shrink-0 flex-wrap gap-2">
            <button
              type="button"
              onClick={() =>
                setPersonForm({
                  open: true,
                  editing: null,
                  name: '',
                  phone: '(11) 91234-5678',
                  vehicleType: 'motorcycle',
                })
              }
              className="fm-btn-secondary"
            >
              Novo entregador
            </button>
            <button
              type="button"
              onClick={() => optimize.mutate()}
              disabled={optimize.isPending}
              className="fm-btn-primary"
            >
              {optimize.isPending ? 'Calculando…' : 'Sugerir atribuição otimizada'}
            </button>
          </div>
        )}
      </header>

      <p className="sr-only" aria-live="polite">
        {batchMessage}
      </p>

      <div className="grid gap-6 lg:grid-cols-2">
        <section className="space-y-3">
          <div className="flex items-center justify-between gap-2">
            <h2 className="text-sm font-semibold uppercase tracking-wide text-slate-500 dark:text-slate-400">
              Pedidos prontos
            </h2>
            <span className="fm-badge-count">{readyCount}</span>
          </div>
          {readyOrders.isLoading ? (
            <FixedRowsList
              rowCount={FIXED_ROWS}
              items={[]}
              renderItem={() => null}
            />
          ) : (
            <>
              <FixedRowsList
                rowCount={FIXED_ROWS}
                items={readyOrders.data?.data ?? []}
                getItemKey={(o) => o.id}
                showEmptyMessage={readyCount === 0}
                emptyMessage="Nenhum pedido aguardando entrega."
                renderItem={(o) => (
                  <span className="font-medium text-slate-800 dark:text-slate-200">{o.customerName}</span>
                )}
              />
              {readyCount > 0 && readyOrders.data?.pagination && (
                <div className="mt-3">
                  <Pagination
                    page={readyOrders.data.pagination.page}
                    totalPages={readyOrders.data.pagination.totalPages}
                    total={readyOrders.data.pagination.total}
                    onPageChange={setReadyPage}
                  />
                </div>
              )}
            </>
          )}
        </section>

        <section className="space-y-3">
          <div className="flex items-center justify-between gap-2">
            <h2 className="text-sm font-semibold uppercase tracking-wide text-slate-500 dark:text-slate-400">
              Entregadores disponíveis
            </h2>
            <span className="fm-badge-count">{personCount}</span>
          </div>
          {persons.isLoading ? (
            <FixedRowsList
              rowCount={FIXED_ROWS}
              items={[]}
              renderItem={() => null}
            />
          ) : (
            <>
              <FixedRowsList
                rowCount={FIXED_ROWS}
                items={persons.data?.data ?? []}
                getItemKey={(p) => p.id}
                rowClassName="fm-fixed-list-row flex flex-wrap items-center justify-between gap-2"
                showEmptyMessage={personCount === 0}
                emptyMessage="Cadastre entregadores para atribuir pedidos."
                renderItem={(p) => (
                  <>
                    <div>
                      <span className="font-medium text-slate-900 dark:text-slate-100">{p.name}</span>
                      <span className="ml-2 rounded-md bg-slate-100 px-1.5 py-0.5 text-xs text-slate-600 dark:bg-slate-700 dark:text-slate-200">
                        {vehicleTypeLabel(p.vehicleType)}
                      </span>
                      {!p.isActive && (
                        <span className="ml-2 text-xs font-medium text-amber-700">inativo</span>
                      )}
                    </div>
                    {isAdmin && (
                      <div className="flex gap-2">
                        <button
                          type="button"
                          className="text-sm font-medium text-orange-600 hover:text-orange-800 dark:text-orange-400 dark:hover:text-orange-300"
                          onClick={() =>
                            setPersonForm({
                              open: true,
                              editing: p,
                              name: p.name,
                              phone: p.phone,
                              vehicleType: p.vehicleType as 'motorcycle',
                            })
                          }
                        >
                          Editar
                        </button>
                        <button
                          type="button"
                          className="text-sm font-medium text-red-600 hover:text-red-800"
                          onClick={() => deletePerson.mutate(p.id)}
                        >
                          Excluir
                        </button>
                      </div>
                    )}
                  </>
                )}
              />
              {personCount > 0 && persons.data?.pagination && (
                <div className="mt-3">
                  <Pagination
                    page={persons.data.pagination.page}
                    totalPages={persons.data.pagination.totalPages}
                    total={persons.data.pagination.total}
                    onPageChange={setPersonPage}
                  />
                </div>
              )}
            </>
          )}
        </section>
      </div>

      <AnimatePresence mode="wait">
      {result && (
        <motion.section
          key="optimize-result"
          className="rounded-xl border border-orange-200 bg-gradient-to-br from-orange-50 to-white p-5 shadow-sm dark:border-orange-900/40 dark:from-orange-950/30 dark:to-slate-900"
          initial={reduceMotion ? false : { opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          exit={reduceMotion ? { opacity: 1 } : { opacity: 0, y: 8 }}
          transition={{ duration: reduceMotion ? 0 : 0.32, ease: panelEase }}
        >
          <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
            <div className="flex flex-wrap gap-x-4 gap-y-1 text-sm text-slate-700 dark:text-slate-300">
              <span>
                Algoritmo:{' '}
                <strong className="text-slate-900 dark:text-slate-100">{algorithmLabel(result.algorithm)}</strong>
              </span>
              <span className="tabular-nums">
                Distância total:{' '}
                <strong className="text-slate-900 dark:text-slate-100">
                  {result.totalDistanceKm.toFixed(2)} km
                </strong>
              </span>
              <span className="tabular-nums">
                Tempo:{' '}
                <strong className="text-slate-900 dark:text-slate-100">{result.executionTimeMs} ms</strong>
              </span>
            </div>
            {isAdmin && result.assignments.length > 0 && (
              <button
                type="button"
                disabled={acceptAll.isPending}
                className="fm-btn bg-emerald-600 text-white hover:bg-emerald-700"
                onClick={() => acceptAll.mutate(result.assignments)}
              >
                {acceptAll.isPending ? 'Aceitando…' : 'Aceitar todas'}
              </button>
            )}
          </div>
          {result.baselineComparison &&
            result.baselineComparison.greedyNearestNeighborTotalKm > 0 && (
              <p className="mb-4 rounded-lg border border-emerald-200/80 bg-emerald-50/90 px-3 py-2 text-sm text-emerald-950 dark:border-emerald-800/50 dark:bg-emerald-950/40 dark:text-emerald-100">
                vs greedy nearest-neighbor (baseline típico do desafio):{' '}
                <strong className="tabular-nums">
                  {result.baselineComparison.greedyNearestNeighborTotalKm.toFixed(2)} km
                </strong>
                {result.baselineComparison.distanceSavedKm > 0 ? (
                  <>
                    {' '}
                    — Hungarian economiza{' '}
                    <strong className="tabular-nums">
                      {result.baselineComparison.distanceSavedKm.toFixed(2)} km
                    </strong>{' '}
                    (
                    <strong className="tabular-nums">
                      {result.baselineComparison.savingsPercent.toFixed(1)}%
                    </strong>
                    )
                  </>
                ) : (
                  <> — empate neste recorte (ótimo comprovado em testes maiores)</>
                )}
              </p>
            )}
          {result.assignments.length === 0 ? (
            <p className="text-sm text-slate-600 dark:text-slate-400">Nenhuma atribuição sugerida.</p>
          ) : (
            <>
              <StaggerList className="space-y-2">
                {suggestionSlice.pageItems.map((a) => (
                  <StaggerItem key={a.orderId}>
                  <li
                    className="flex flex-wrap items-center justify-between gap-3 rounded-lg border border-slate-200/80 bg-white px-4 py-3 text-sm shadow-sm dark:border-slate-700 dark:bg-slate-800/80"
                  >
                    <div className="min-w-0">
                      <p className="font-medium text-slate-900 dark:text-slate-100">
                        {a.deliveryPersonName ?? a.deliveryPersonId.slice(0, 8)}
                        <span className="mx-2 text-slate-400">→</span>
                        {a.orderAddress ?? a.orderId.slice(0, 8)}
                      </p>
                      <p className="mt-0.5 text-xs tabular-nums text-slate-500 dark:text-slate-400">
                        {a.estimatedDistanceKm.toFixed(2)} km estimados
                      </p>
                    </div>
                    {isAdmin && (
                      <div className="flex shrink-0 gap-2">
                        <button
                          type="button"
                          className="fm-btn bg-emerald-600 px-2.5 py-1 text-xs text-white hover:bg-emerald-700 focus:ring-emerald-500"
                          onClick={() => accept.mutate(a)}
                        >
                          Aceitar
                        </button>
                        <button
                          type="button"
                          className="fm-btn-secondary px-2.5 py-1 text-xs"
                          onClick={() =>
                            setResult((r) =>
                              r
                                ? {
                                    ...r,
                                    assignments: r.assignments.filter(
                                      (x) => x.orderId !== a.orderId,
                                    ),
                                  }
                                : r,
                            )
                          }
                        >
                          Rejeitar
                        </button>
                      </div>
                    )}
                  </li>
                  </StaggerItem>
                ))}
              </StaggerList>
              {result.assignments.length > SUGGESTION_PAGE && (
                <Pagination
                  page={suggestionPage}
                  totalPages={suggestionSlice.totalPages}
                  total={result.assignments.length}
                  onPageChange={setSuggestionPage}
                />
              )}
            </>
          )}
          {result.unassigned.length > 0 && (
            <div className="mt-4 rounded-lg border border-amber-200 bg-amber-50/80 px-4 py-3 dark:border-amber-900/50 dark:bg-amber-950/40">
              <p className="text-xs font-semibold uppercase tracking-wide text-amber-800 dark:text-amber-200">
                Não atribuídos
              </p>
              <ul className="mt-2 space-y-1 text-sm text-amber-900 dark:text-amber-100">
                {result.unassigned.map((u) => (
                  <li key={u.orderId}>
                    {u.orderAddress ?? u.orderId.slice(0, 8)} — {u.reason}
                  </li>
                ))}
              </ul>
            </div>
          )}
        </motion.section>
      )}
      </AnimatePresence>

      {personForm.open && isAdmin && (
        <Modal open onClose={() => setPersonForm((s) => ({ ...s, open: false }))} panelClassName="max-w-md">
          <form
            onSubmit={(e) => {
              e.preventDefault();
              savePerson.mutate();
            }}
          >
            <h2 className="mb-4 text-lg font-semibold text-slate-900 dark:text-slate-100">
              {personForm.editing ? 'Editar entregador' : 'Novo entregador'}
            </h2>
            <label className="mb-3 block text-sm font-medium text-slate-700 dark:text-slate-300">
              Nome
              <input
                required
                value={personForm.name}
                onChange={(e) =>
                  setPersonForm({ ...personForm, name: e.target.value })
                }
                className="fm-input mt-1.5"
              />
            </label>
            <label className="mb-3 block text-sm font-medium text-slate-700 dark:text-slate-300">
              Telefone
              <input
                required
                value={personForm.phone}
                onChange={(e) =>
                  setPersonForm({ ...personForm, phone: e.target.value })
                }
                className="fm-input mt-1.5"
              />
            </label>
            <label className="mb-6 block text-sm font-medium text-slate-700 dark:text-slate-300">
              Veículo
              <select
                value={personForm.vehicleType}
                onChange={(e) =>
                  setPersonForm({
                    ...personForm,
                    vehicleType: e.target.value as 'motorcycle',
                  })
                }
                className="fm-select mt-1.5"
              >
                <option value="bicycle">{vehicleTypeLabel('bicycle')}</option>
                <option value="motorcycle">{vehicleTypeLabel('motorcycle')}</option>
                <option value="car">{vehicleTypeLabel('car')}</option>
              </select>
            </label>
            <div className="flex justify-end gap-2">
              <button
                type="button"
                onClick={() => setPersonForm((s) => ({ ...s, open: false }))}
                className="fm-btn-secondary"
              >
                Cancelar
              </button>
              <button type="submit" className="fm-btn-primary">
                Salvar
              </button>
            </div>
          </form>
        </Modal>
      )}
    </div>
  );
}
