const API_BASE = import.meta.env.VITE_API_URL ?? '/api';

function getCsrfToken(): string | null {
  const match = document.cookie.match(/(?:^|;\s*)csrf_token=([^;]+)/);
  return match?.[1] ? decodeURIComponent(match[1]) : null;
}

export class ApiError extends Error {
  constructor(
    public status: number,
    public code: string,
    message: string,
  ) {
    super(message);
  }
}

let refreshInFlight: Promise<void> | null = null;

async function refreshSessionOnce(): Promise<void> {
  if (!refreshInFlight) {
    refreshInFlight = apiFetchInternal<{ user: unknown }>(
      '/auth/session/refresh',
      { method: 'POST' },
      { skipRefresh: true },
    )
      .then(() => undefined)
      .finally(() => {
        refreshInFlight = null;
      });
  }
  await refreshInFlight;
}

type InternalOpts = { skipRefresh?: boolean; retried?: boolean };

async function apiFetchInternal<T>(
  path: string,
  options: RequestInit & { json?: unknown } = {},
  internal: InternalOpts = {},
): Promise<T> {
  const headers = new Headers(options.headers);
  const method = (options.method ?? 'GET').toUpperCase();
  if (options.json !== undefined) {
    headers.set('Content-Type', 'application/json');
  }
  if (['POST', 'PUT', 'PATCH', 'DELETE'].includes(method)) {
    const csrf = getCsrfToken();
    if (csrf) headers.set('X-CSRF-Token', csrf);
  }

  const init: RequestInit = {
    method,
    headers,
    credentials: 'include',
  };
  if (options.json !== undefined) {
    init.body = JSON.stringify(options.json);
  } else if (options.body !== undefined) {
    init.body = options.body;
  }
  const res = await fetch(`${API_BASE}${path}`, init);

  if (res.status === 204) return undefined as T;

  const text = await res.text();
  const data = text ? (JSON.parse(text) as unknown) : null;

  if (res.status === 401 && !internal.skipRefresh && !internal.retried) {
    const isAuthRoute = path.startsWith('/auth/');
    if (!isAuthRoute) {
      try {
        await refreshSessionOnce();
        return apiFetchInternal<T>(path, options, { ...internal, retried: true });
      } catch {
        /* fall through */
      }
    }
  }

  if (!res.ok) {
    const err = data as { error?: { code?: string; message?: string } };
    throw new ApiError(
      res.status,
      err.error?.code ?? 'INTERNAL_ERROR',
      err.error?.message ?? 'Erro na requisicao',
    );
  }

  return data as T;
}

export function apiFetch<T>(
  path: string,
  options: RequestInit & { json?: unknown } = {},
): Promise<T> {
  return apiFetchInternal<T>(path, options);
}
