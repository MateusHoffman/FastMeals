import type { ReactNode } from 'react';

type FixedRowsListProps<T> = {
  rowCount: number;
  items: T[];
  renderItem: (item: T, index: number) => ReactNode;
  getItemKey?: (item: T) => string;
  emptyMessage?: string;
  showEmptyMessage?: boolean;
  rowClassName?: string;
};

export function FixedRowsList<T>({
  rowCount,
  items,
  renderItem,
  getItemKey,
  emptyMessage,
  showEmptyMessage = false,
  rowClassName = 'fm-fixed-list-row',
}: FixedRowsListProps<T>) {
  const slots = Array.from({ length: rowCount }, (_, i) => items[i] ?? null);

  return (
    <div className="relative">
      {showEmptyMessage && emptyMessage && (
        <p className="mb-2 text-sm text-slate-500 dark:text-slate-400">{emptyMessage}</p>
      )}
      <div className="fm-table-wrap">
        <ul className="fm-fixed-list">
          {slots.map((item, index) =>
            item !== null ? (
              <li
                key={getItemKey?.(item) ?? String(index)}
                className={rowClassName}
              >
                {renderItem(item, index)}
              </li>
            ) : (
              <li
                key={`empty-${index}`}
                className="fm-fixed-list-row-empty"
                aria-hidden
              />
            ),
          )}
        </ul>
      </div>
    </div>
  );
}
