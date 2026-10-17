import { AnimatePresence, motion, useReducedMotion } from 'motion/react';
import { Moon, Sun } from 'lucide-react';
import { useTheme } from '../hooks/useTheme';

export function ThemeToggle() {
  const { theme, toggle } = useTheme();
  const isDark = theme === 'dark';
  const reduce = useReducedMotion();

  return (
    <button
      type="button"
      onClick={toggle}
      className="fm-btn-ghost relative inline-flex size-9 shrink-0 items-center justify-center overflow-hidden p-0 dark:text-slate-200 dark:hover:bg-slate-800"
      aria-pressed={isDark}
      aria-label={isDark ? 'Ativar tema claro' : 'Ativar tema escuro'}
      title={isDark ? 'Tema claro' : 'Tema escuro'}
    >
      <AnimatePresence mode="wait" initial={false}>
        <motion.span
          key={isDark ? 'sun' : 'moon'}
          className="inline-flex"
          initial={reduce ? false : { opacity: 0, rotate: -90, scale: 0.6 }}
          animate={{ opacity: 1, rotate: 0, scale: 1 }}
          exit={reduce ? { opacity: 1 } : { opacity: 0, rotate: 90, scale: 0.6 }}
          transition={{ duration: reduce ? 0 : 0.22 }}
        >
          {isDark ? (
            <Sun className="size-[1.125rem]" aria-hidden />
          ) : (
            <Moon className="size-[1.125rem]" aria-hidden />
          )}
        </motion.span>
      </AnimatePresence>
    </button>
  );
}
