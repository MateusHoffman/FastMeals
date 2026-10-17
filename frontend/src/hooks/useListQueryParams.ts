import { useCallback, useMemo } from 'react';
import { useSearchParams } from 'react-router-dom';

export function useListQueryParams(defaults: Record<string, string>) {
  const [searchParams, setSearchParams] = useSearchParams();

  const values = useMemo(() => {
    const out: Record<string, string> = { ...defaults };
    for (const key of Object.keys(defaults)) {
      const v = searchParams.get(key);
      if (v !== null && v !== '') out[key] = v;
    }
    return out;
  }, [searchParams, defaults]);

  const setParam = useCallback(
    (key: string, value: string) => {
      setSearchParams(
        (prev) => {
          const next = new URLSearchParams(prev);
          const def = defaults[key] ?? '';
          if (value === '' || value === def) next.delete(key);
          else next.set(key, value);
          return next;
        },
        { replace: true },
      );
    },
    [setSearchParams, defaults],
  );

  const setMany = useCallback(
    (patch: Record<string, string>) => {
      setSearchParams(
        (prev) => {
          const next = new URLSearchParams(prev);
          for (const [key, value] of Object.entries(patch)) {
            const def = defaults[key] ?? '';
            if (value === '' || value === def) next.delete(key);
            else next.set(key, value);
          }
          return next;
        },
        { replace: true },
      );
    },
    [setSearchParams, defaults],
  );

  return { values, setParam, setMany };
}
