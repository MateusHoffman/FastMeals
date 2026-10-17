export function Skeleton({ className = '' }: { className?: string }) {
  return (
    <div
      className={`fm-shimmer rounded-lg bg-gradient-to-r from-slate-200 via-slate-100 to-slate-200 bg-[length:200%_100%] dark:from-slate-800 dark:via-slate-700 dark:to-slate-800 ${className}`}
      aria-hidden
    />
  );
}
