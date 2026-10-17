import { motion, useReducedMotion } from 'motion/react';

/** Indicador visual de canal SSE / tempo real (com texto acessível). */
export function LiveIndicator({ label = 'Tempo real ativo' }: { label?: string }) {
  const reduce = useReducedMotion();

  return (
    <span className="inline-flex items-center gap-1.5 rounded-full bg-emerald-50 px-2 py-0.5 text-xs font-medium text-emerald-800 ring-1 ring-emerald-200/80 dark:bg-emerald-950/50 dark:text-emerald-200 dark:ring-emerald-800/60">
      {reduce ? (
        <span className="size-1.5 rounded-full bg-emerald-500" aria-hidden />
      ) : (
        <motion.span
          className="size-1.5 rounded-full bg-emerald-500"
          aria-hidden
          animate={{ scale: [1, 1.35, 1], opacity: [1, 0.65, 1] }}
          transition={{ duration: 1.6, repeat: Infinity, ease: 'easeInOut' }}
        />
      )}
      {label}
    </span>
  );
}
