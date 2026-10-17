import { motion, useReducedMotion } from 'motion/react';
import { NavLink } from 'react-router-dom';

type Props = {
  to: string;
  label: string;
  hint: string;
};

export function SidebarNavItem({ to, label, hint }: Props) {
  const reduce = useReducedMotion();

  return (
    <NavLink
      to={to}
      className={({ isActive }) =>
        `relative block rounded-lg px-3 py-2.5 transition-colors ${isActive ? 'text-white' : 'text-slate-700 hover:bg-orange-50 hover:text-orange-900 dark:text-slate-300 dark:hover:bg-slate-800 dark:hover:text-orange-300'}`
      }
    >
      {({ isActive }) => (
        <>
          {isActive &&
            (reduce ? (
              <span
                className="absolute inset-0 rounded-lg bg-orange-600 shadow-sm"
                aria-hidden
              />
            ) : (
              <motion.span
                layoutId="sidebar-nav-active"
                className="absolute inset-0 rounded-lg bg-orange-600 shadow-sm"
                transition={{ type: 'spring', stiffness: 380, damping: 32 }}
                aria-hidden
              />
            ))}
          <span className="relative block text-sm font-medium">{label}</span>
          <span
            className={`relative block text-xs ${isActive ? 'text-orange-100' : 'text-slate-600 dark:text-slate-400'}`}
          >
            {hint}
          </span>
        </>
      )}
    </NavLink>
  );
}
