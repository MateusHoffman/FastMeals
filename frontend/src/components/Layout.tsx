import { NavLink, Outlet, useLocation } from 'react-router-dom';
import { useAuthStore } from '../stores/authStore';
import { apiFetch } from '../services/api';
import { userRoleLabel } from '../lib/labels';
import { ThemeToggle } from './ThemeToggle';
import { PageTransition } from './motion/PageTransition';
import { SidebarNavItem } from './motion/SidebarNavItem';

const NAV = [
  { to: '/orders', label: 'Pedidos', hint: 'Fila e status' },
  { to: '/products', label: 'Produtos', hint: 'Cardápio' },
  { to: '/assignment', label: 'Atribuição', hint: 'Entregadores' },
  { to: '/reports', label: 'Relatórios', hint: 'Métricas' },
] as const;

function sessionTitle(pathname: string): string {
  const match = NAV.find(
    (n) => pathname === n.to || pathname.startsWith(`${n.to}/`),
  );
  return match?.label ?? 'Painel';
}

export function Layout() {
  const user = useAuthStore((s) => s.user);
  const setUser = useAuthStore((s) => s.setUser);
  const { pathname } = useLocation();
  const title = sessionTitle(pathname);

  async function logout() {
    await apiFetch('/auth/session', { method: 'DELETE' });
    setUser(null);
    window.location.href = '/login';
  }

  return (
    <div className="flex h-screen overflow-hidden">
      <aside className="hidden w-56 shrink-0 flex-col border-r border-slate-200 bg-white lg:flex dark:border-slate-700 dark:bg-slate-900">
        <div className="fm-shell-brand">
          <p className="text-lg font-bold leading-tight text-orange-600">FastMeals</p>
          <p className="text-xs font-medium text-slate-500 dark:text-slate-400">Painel operacional</p>
        </div>
        <nav
          className="flex flex-1 flex-col gap-0.5 overflow-y-auto p-3"
          aria-label="Principal"
        >
          {NAV.map(({ to, label, hint }) => (
            <SidebarNavItem key={to} to={to} label={label} hint={hint} />
          ))}
        </nav>
      </aside>

      <div className="flex min-w-0 flex-1 flex-col overflow-hidden">
        <header className="z-40 shrink-0 border-b border-slate-200 bg-white/95 backdrop-blur supports-[backdrop-filter]:bg-white/80 dark:border-slate-700 dark:bg-slate-900/95 dark:supports-[backdrop-filter]:bg-slate-900/80">
          <div className="fm-shell-header-bar">
            <div className="min-w-0 shrink-0">
              <h1 className="text-lg font-semibold text-slate-900 dark:text-slate-50">
                {title}
              </h1>
              <p className="text-xs text-slate-500 dark:text-slate-400 lg:hidden">
                <span className="font-medium text-orange-600">FastMeals</span>
              </p>
            </div>
            <nav
              className="order-last flex w-full flex-wrap gap-1 lg:order-none lg:hidden"
              aria-label="Principal mobile"
            >
              {NAV.map(({ to, label }) => (
                <NavLink
                  key={to}
                  to={to}
                  className={({ isActive }) =>
                    `rounded-md px-2.5 py-1.5 text-xs font-medium ${isActive ? 'bg-orange-600 text-white' : 'text-slate-600 hover:bg-slate-100 dark:text-slate-300 dark:hover:bg-slate-800'}`
                  }
                >
                  {label}
                </NavLink>
              ))}
            </nav>
            <div className="ml-auto flex items-center gap-2 sm:gap-3">
              <ThemeToggle />
              <div className="hidden text-right sm:block">
                <p className="max-w-[200px] truncate text-sm font-medium text-slate-800 dark:text-slate-200">
                  {user?.email}
                </p>
                <p className="text-xs text-slate-500 dark:text-slate-400">{userRoleLabel(user?.role)}</p>
              </div>
              <span className="rounded-full bg-slate-100 px-2.5 py-1 text-xs font-medium text-slate-600 dark:bg-slate-800 dark:text-slate-300 sm:hidden">
                {userRoleLabel(user?.role)}
              </span>
              <button
                type="button"
                onClick={() => void logout()}
                className="fm-btn-secondary py-1.5 text-xs"
              >
                Sair
              </button>
            </div>
          </div>
        </header>

        <main className="flex-1 overflow-y-auto px-4 py-6 lg:px-8 lg:py-8">
          <div className="mx-auto max-w-6xl">
            <PageTransition>
              <Outlet />
            </PageTransition>
          </div>
        </main>
      </div>
    </div>
  );
}
