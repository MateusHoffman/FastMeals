interface PaginationProps {
  page: number;
  totalPages: number;
  total: number;
  onPageChange: (page: number) => void;
}

export function Pagination({
  page,
  totalPages,
  total,
  onPageChange,
}: PaginationProps) {
  if (totalPages <= 1 && total === 0) return null;

  return (
    <div className="flex flex-wrap items-center justify-between gap-3 rounded-xl border border-slate-200/80 bg-white px-4 py-3 text-sm shadow-sm dark:border-slate-700 dark:bg-slate-900">
      <p className="text-slate-600 dark:text-slate-400">
        Página <span className="font-medium text-slate-900 dark:text-slate-100">{page}</span> de{' '}
        <span className="font-medium text-slate-900 dark:text-slate-100">{totalPages}</span>
        <span className="mx-2 text-slate-300 dark:text-slate-600">·</span>
        <span className="tabular-nums">{total}</span> registro{total === 1 ? '' : 's'}
      </p>
      <div className="flex gap-2">
        <button
          type="button"
          disabled={page <= 1}
          onClick={() => onPageChange(page - 1)}
          className="fm-btn-secondary py-1.5 text-xs disabled:opacity-40"
        >
          Anterior
        </button>
        <button
          type="button"
          disabled={page >= totalPages}
          onClick={() => onPageChange(page + 1)}
          className="fm-btn-secondary py-1.5 text-xs disabled:opacity-40"
        >
          Próxima
        </button>
      </div>
    </div>
  );
}
