import { useEffect, useState } from 'react';
import { apiFetch, ApiError } from '../services/api';
import { useAuthStore, type AuthUser } from '../stores/authStore';

function hasSessionCookie(name: string): boolean {
  return document.cookie.split(';').some((part) => part.trim().startsWith(`${name}=`));
}

/** Refresh exige CSRF double-submit; sem csrf_token, POST /session/refresh retorna 403. */
function canAttemptSessionRefresh(): boolean {
  return hasSessionCookie('fm_refresh') && hasSessionCookie('csrf_token');
}

export function SessionBootstrap({ children }: { children: React.ReactNode }) {
  const setUser = useAuthStore((s) => s.setUser);
  const setSessionHydrated = useAuthStore((s) => s.setSessionHydrated);
  const [ready, setReady] = useState(false);

  useEffect(() => {
    void (async () => {
      try {
        const res = await apiFetch<{ user: AuthUser }>('/auth/session');
        setUser(res.user);
      } catch (err) {
        if (err instanceof ApiError && err.status === 401 && canAttemptSessionRefresh()) {
          try {
            const refreshed = await apiFetch<{ user: AuthUser }>(
              '/auth/session/refresh',
              { method: 'POST' },
            );
            setUser(refreshed.user);
          } catch {
            setUser(null);
          }
        } else if (err instanceof ApiError && err.status === 401) {
          setUser(null);
        } else {
          setUser(null);
        }
      } finally {
        setSessionHydrated(true);
        setReady(true);
      }
    })();
  }, [setUser, setSessionHydrated]);

  if (!ready) {
    return (
      <div className="flex min-h-screen flex-col items-center justify-center gap-3 bg-slate-50 text-slate-600 dark:text-slate-400">
        <div
          className="h-8 w-8 animate-spin rounded-full border-2 border-orange-200 border-t-orange-600"
          aria-hidden
        />
        <p className="text-sm font-medium">Carregando sessão...</p>
      </div>
    );
  }
  return children;
}
