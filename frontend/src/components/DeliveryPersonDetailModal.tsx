import { useQuery } from '@tanstack/react-query';
import { apiFetch } from '../services/api';
import { vehicleTypeLabel } from '../lib/labels';
import { Modal } from './Modal';
import { Skeleton } from './Skeleton';
import type { DeliveryPersonDto } from '../types/api';

type DeliveryPersonDetailModalProps = {
  deliveryPersonId: string;
  onClose: () => void;
};

export function DeliveryPersonDetailModal({
  deliveryPersonId,
  onClose,
}: DeliveryPersonDetailModalProps) {
  const { data, isLoading, error } = useQuery({
    queryKey: ['delivery-person', deliveryPersonId],
    queryFn: () => apiFetch<DeliveryPersonDto>(`/delivery-persons/${deliveryPersonId}`),
  });

  return (
    <Modal open onClose={onClose} titleId="delivery-person-title" panelClassName="max-w-md">
      <div className="flex items-start justify-between gap-3">
        <h2 id="delivery-person-title" className="text-lg font-semibold text-slate-900 dark:text-slate-100">
          Entregador
        </h2>
        <button
          type="button"
          className="fm-btn-ghost px-2"
          onClick={onClose}
          aria-label="Fechar"
        >
          ✕
        </button>
      </div>

      {isLoading && <Skeleton className="mt-4 h-32 w-full" />}
      {error && (
        <p className="fm-error-banner mt-4">Não foi possível carregar o entregador.</p>
      )}
      {data && (
        <dl className="mt-4 space-y-3 text-sm">
          <div>
            <dt className="fm-section-title">Nome</dt>
            <dd className="mt-1 font-medium text-slate-900 dark:text-slate-100">{data.name}</dd>
          </div>
          <div>
            <dt className="fm-section-title">Telefone</dt>
            <dd className="mt-1 text-slate-700 dark:text-slate-300">{data.phone}</dd>
          </div>
          <div>
            <dt className="fm-section-title">Veículo</dt>
            <dd className="mt-1 text-slate-700 dark:text-slate-300">{vehicleTypeLabel(data.vehicleType)}</dd>
          </div>
          <div>
            <dt className="fm-section-title">Status</dt>
            <dd className="mt-1 text-slate-700 dark:text-slate-300">
              {data.isActive ? 'Ativo' : 'Inativo'}
              {data.currentOrderId ? ' · em entrega' : ' · disponível'}
            </dd>
          </div>
          {data.currentLatitude != null && data.currentLongitude != null && (
            <div>
              <dt className="fm-section-title">Localização</dt>
              <dd className="mt-1 tabular-nums text-slate-700 dark:text-slate-300">
                {data.currentLatitude.toFixed(5)}, {data.currentLongitude.toFixed(5)}
              </dd>
            </div>
          )}
        </dl>
      )}

      <div className="mt-6 flex justify-end">
        <button type="button" onClick={onClose} className="fm-btn-secondary">
          Fechar
        </button>
      </div>
    </Modal>
  );
}
