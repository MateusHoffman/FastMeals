import { motion, useReducedMotion } from 'motion/react';
import { Skeleton } from './Skeleton';

/** Fallback leve enquanto rotas lazy carregam. */
export function PageLoader() {
  const reduce = useReducedMotion();

  return (
    <motion.div
      className="space-y-4 p-6"
      role="status"
      aria-label="Carregando página"
      initial={reduce ? false : { opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ duration: 0.2 }}
    >
      <div className="flex items-center gap-3">
        {!reduce && (
          <motion.span
            className="inline-block size-2 rounded-full bg-orange-600"
            animate={{ scale: [1, 1.3, 1], opacity: [0.5, 1, 0.5] }}
            transition={{ duration: 1.2, repeat: Infinity }}
            aria-hidden
          />
        )}
        <Skeleton className="h-8 w-48" />
      </div>
      <Skeleton className="h-64 w-full" />
    </motion.div>
  );
}
