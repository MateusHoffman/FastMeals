type SortOrder = 'asc' | 'desc';

interface SortableThProps {
  label: string;
  column: string;
  sortBy: string;
  sortOrder: SortOrder;
  onSort: (column: string) => void;
  className?: string;
}

export function SortableTh({
  label,
  column,
  sortBy,
  sortOrder,
  onSort,
  className = '',
}: SortableThProps) {
  const active = sortBy === column;
  const indicator = active ? (sortOrder === 'asc' ? ' ↑' : ' ↓') : '';

  return (
    <th className={className}>
      <button
        type="button"
        onClick={() => onSort(column)}
        className={`inline-flex items-center gap-0.5 font-semibold text-slate-600 transition hover:text-orange-700 dark:text-slate-400 dark:hover:text-orange-400 ${active ? 'text-orange-700 dark:text-orange-400' : ''}`}
      >
        {label}
        <span className="text-xs opacity-80" aria-hidden>
          {indicator || ' ⇅'}
        </span>
      </button>
    </th>
  );
}

export function toggleSort(
  sortBy: string,
  sortOrder: SortOrder,
  column: string,
): { sortBy: string; sortOrder: SortOrder } {
  if (sortBy !== column) {
    return { sortBy: column, sortOrder: 'desc' };
  }
  return { sortBy: column, sortOrder: sortOrder === 'asc' ? 'desc' : 'asc' };
}
