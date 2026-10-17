import { motion, useReducedMotion } from 'motion/react';
import { orderStatusLabel } from '../lib/labels';

/** Paleta fixa — contraste sobre fundo claro do badge (legível também no dark mode). */
const styles: Record<string, string> = {
  pending: 'bg-amber-100 text-amber-900 ring-amber-200/80',
  preparing: 'bg-blue-100 text-blue-900 ring-blue-200/80',
  ready: 'bg-emerald-100 text-emerald-900 ring-emerald-200/80',
  delivering: 'bg-violet-100 text-violet-900 ring-violet-200/80',
  delivered: 'bg-slate-200 text-slate-800 ring-slate-300/80',
  cancelled: 'bg-red-100 text-red-900 ring-red-200/80',
};

const dot: Record<string, string> = {
  pending: 'bg-amber-500',
  preparing: 'bg-blue-500',
  ready: 'bg-emerald-500',
  delivering: 'bg-violet-500',
  delivered: 'bg-slate-500',
  cancelled: 'bg-red-500',
};

const pulseStatuses = new Set(['pending', 'ready', 'delivering']);

function StatusDot({ status }: { status: string }) {
  const reduce = useReducedMotion();
  const className = `h-1.5 w-1.5 shrink-0 rounded-full ${dot[status] ?? 'bg-gray-400'}`;

  if (!pulseStatuses.has(status) || reduce) {
    return <span className={className} aria-hidden />;
  }

  return (
    <motion.span
      className={className}
      aria-hidden
      animate={{ scale: [1, 1.25, 1], opacity: [1, 0.75, 1] }}
      transition={{ duration: 2, repeat: Infinity, ease: 'easeInOut' }}
    />
  );
}

export function StatusBadge({ status }: { status: string }) {
  return (
    <span
      className={`fm-status-badge ${styles[status] ?? 'bg-gray-100 text-gray-800 ring-gray-200'}`}
    >
      <StatusDot status={status} />
      {orderStatusLabel(status)}
    </span>
  );
}
